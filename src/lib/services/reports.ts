import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export type RevenueReport = {
  online: number;
  clinic: number;
  total: number;
};

export type NoShowReport = {
  doctor_id: string;
  doctor_name: string;
  total: number;
  no_shows: number;
  completed: number;
  rate: number;
};

export type PeakHourReport = {
  start_time: string;
  count: number;
};

export type PatientVolumeReport = {
  appointments: number;
  unique_patients: number;
  total_patients: number;
};

export type PaymentMethodBreakdown = {
  method: string;
  transactions: number;
  amount: number;
};

export type PaymentStatusBreakdown = {
  status: string;
  transactions: number;
  amount: number;
};

export type DailyTrendPoint = {
  date: string;
  revenue: number;
  appointments: number;
  patients: number;
};

export type AppointmentTypeBreakdown = {
  type: string;
  count: number;
};

export type ReportsPayload = {
  revenue: RevenueReport;
  no_show: NoShowReport[];
  peak_hours: PeakHourReport[];
  volume: PatientVolumeReport;
  payment_methods: PaymentMethodBreakdown[];
  payment_statuses: PaymentStatusBreakdown[];
  daily_trends: DailyTrendPoint[];
  appointment_types: AppointmentTypeBreakdown[];
};

type PaymentRow = {
  amount: number | string;
  method: string;
  status: string;
  paid_at: string | null;
  appointments?:
    | {
        appointment_type?: string | null;
      }
    | {
        appointment_type?: string | null;
      }[]
    | null;
};

type AppointmentRow = {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  appointment_type: string;
  doctors?:
    | {
        profiles?: { full_name?: string | null } | { full_name?: string | null }[] | null;
      }
    | {
        profiles?: { full_name?: string | null } | { full_name?: string | null }[] | null;
      }[]
    | null;
};

function normalizeDate(value: string) {
  return value.slice(0, 10);
}

function parseAmount(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function getAppointmentType(
  value:
    | {
        appointment_type?: string | null;
      }
    | {
        appointment_type?: string | null;
      }[]
    | null
    | undefined,
) {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.appointment_type ?? "Clinic";
}

function getDoctorName(value: AppointmentRow["doctors"]) {
  const doctor = Array.isArray(value) ? value[0] : value;
  const profile = Array.isArray(doctor?.profiles) ? doctor?.profiles[0] : doctor?.profiles;
  return profile?.full_name?.trim() || "Unknown doctor";
}

async function getPayments(from?: string, to?: string) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("payments")
    .select("amount, method, status, paid_at, appointments(appointment_type)")
    .order("paid_at", { ascending: true });

  if (from) query = query.gte("paid_at", `${from}T00:00:00`);
  if (to) query = query.lte("paid_at", `${to}T23:59:59.999`);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as unknown as PaymentRow[];
}

async function getAppointments(from?: string, to?: string) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("appointments")
    .select("patient_id, doctor_id, appointment_date, start_time, status, appointment_type, doctors(profiles(full_name))")
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (from) query = query.gte("appointment_date", from);
  if (to) query = query.lte("appointment_date", to);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as unknown as AppointmentRow[];
}

export async function getRevenue(from?: string, to?: string): Promise<RevenueReport> {
  const data = await getPayments(from, to);

  let online = 0;
  let clinic = 0;
  for (const row of data) {
    if (row.status !== "Paid") continue;
    const amount = parseAmount(row.amount);
    const type = getAppointmentType(row.appointments);
    if (type === "Online") online += amount;
    else clinic += amount;
  }

  return { online, clinic, total: online + clinic };
}

export async function getNoShowRates(from?: string, to?: string): Promise<NoShowReport[]> {
  const rows = await getAppointments(from, to);
  const relevant = rows.filter((row) => row.status === "NoShow" || row.status === "Completed");

  const agg = new Map<
    string,
    {
      doctor_name: string;
      total: number;
      no_shows: number;
      completed: number;
    }
  >();

  for (const row of relevant) {
    const current = agg.get(row.doctor_id) ?? {
      doctor_name: getDoctorName(row.doctors),
      total: 0,
      no_shows: 0,
      completed: 0,
    };
    current.total += 1;
    if (row.status === "NoShow") current.no_shows += 1;
    if (row.status === "Completed") current.completed += 1;
    agg.set(row.doctor_id, current);
  }

  return [...agg.entries()]
    .map(([doctor_id, value]) => ({
      doctor_id,
      doctor_name: value.doctor_name,
      total: value.total,
      no_shows: value.no_shows,
      completed: value.completed,
      rate: value.total ? value.no_shows / value.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate || b.no_shows - a.no_shows || a.doctor_name.localeCompare(b.doctor_name));
}

export async function getPeakHours(from?: string, to?: string): Promise<PeakHourReport[]> {
  const rows = await getAppointments(from, to);
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (row.status === "Cancelled") continue;
    const key = row.start_time.slice(0, 5);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([start_time, count]) => ({ start_time, count }))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export async function getPatientVolume(from?: string, to?: string): Promise<PatientVolumeReport> {
  const supabase = getSupabaseAdmin();
  const [{ count: totalPatients, error: patientsError }, appointments] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }),
    getAppointments(from, to),
  ]);

  if (patientsError) throw patientsError;

  const activeAppointments = appointments.filter((row) => row.status !== "Cancelled");
  const uniquePatients = new Set(activeAppointments.map((row) => row.patient_id));

  return {
    appointments: activeAppointments.length,
    unique_patients: uniquePatients.size,
    total_patients: totalPatients ?? 0,
  };
}

export async function getPaymentMethodBreakdown(from?: string, to?: string): Promise<PaymentMethodBreakdown[]> {
  const rows = await getPayments(from, to);
  const agg = new Map<string, PaymentMethodBreakdown>();

  for (const row of rows) {
    if (row.status !== "Paid") continue;
    const current = agg.get(row.method) ?? { method: row.method, transactions: 0, amount: 0 };
    current.transactions += 1;
    current.amount += parseAmount(row.amount);
    agg.set(row.method, current);
  }

  return [...agg.values()].sort((a, b) => b.amount - a.amount);
}

export async function getPaymentStatusBreakdown(from?: string, to?: string): Promise<PaymentStatusBreakdown[]> {
  const rows = await getPayments(from, to);
  const agg = new Map<string, PaymentStatusBreakdown>();

  for (const row of rows) {
    const current = agg.get(row.status) ?? { status: row.status, transactions: 0, amount: 0 };
    current.transactions += 1;
    current.amount += parseAmount(row.amount);
    agg.set(row.status, current);
  }

  return [...agg.values()].sort((a, b) => b.transactions - a.transactions);
}

export async function getDailyTrends(from?: string, to?: string): Promise<DailyTrendPoint[]> {
  const [payments, appointments] = await Promise.all([getPayments(from, to), getAppointments(from, to)]);
  const agg = new Map<string, DailyTrendPoint>();

  for (const row of payments) {
    if (row.status !== "Paid" || !row.paid_at) continue;
    const date = normalizeDate(row.paid_at);
    const current = agg.get(date) ?? { date, revenue: 0, appointments: 0, patients: 0 };
    current.revenue += parseAmount(row.amount);
    agg.set(date, current);
  }

  for (const row of appointments) {
    if (row.status === "Cancelled") continue;
    const date = row.appointment_date;
    const current = agg.get(date) ?? { date, revenue: 0, appointments: 0, patients: 0 };
    current.appointments += 1;
    agg.set(date, current);
  }

  const patientPerDay = new Map<string, Set<string>>();
  for (const row of appointments) {
    if (row.status === "Cancelled") continue;
    const set = patientPerDay.get(row.appointment_date) ?? new Set<string>();
    set.add(row.patient_id);
    patientPerDay.set(row.appointment_date, set);
  }

  for (const [date, patients] of patientPerDay.entries()) {
    const current = agg.get(date) ?? { date, revenue: 0, appointments: 0, patients: 0 };
    current.patients = patients.size;
    agg.set(date, current);
  }

  return [...agg.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAppointmentTypeBreakdown(from?: string, to?: string): Promise<AppointmentTypeBreakdown[]> {
  const rows = await getAppointments(from, to);
  const agg = new Map<string, number>();

  for (const row of rows) {
    if (row.status === "Cancelled") continue;
    agg.set(row.appointment_type, (agg.get(row.appointment_type) ?? 0) + 1);
  }

  return [...agg.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getReportsDashboard(from?: string, to?: string): Promise<ReportsPayload> {
  const [
    revenue,
    no_show,
    peak_hours,
    volume,
    payment_methods,
    payment_statuses,
    daily_trends,
    appointment_types,
  ] = await Promise.all([
    getRevenue(from, to),
    getNoShowRates(from, to),
    getPeakHours(from, to),
    getPatientVolume(from, to),
    getPaymentMethodBreakdown(from, to),
    getPaymentStatusBreakdown(from, to),
    getDailyTrends(from, to),
    getAppointmentTypeBreakdown(from, to),
  ]);

  return {
    revenue,
    no_show,
    peak_hours,
    volume,
    payment_methods,
    payment_statuses,
    daily_trends,
    appointment_types,
  };
}
