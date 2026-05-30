"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRole } from "@/src/components/layout/RoleProvider";

type RevenueReport = { online: number; clinic: number; total: number };
type NoShowReport = {
  doctor_id: string;
  doctor_name: string;
  total: number;
  no_shows: number;
  completed: number;
  rate: number;
};
type PeakHourReport = { start_time: string; count: number };
type VolumeReport = { appointments: number; unique_patients: number; total_patients: number };
type PaymentMethodBreakdown = { method: string; transactions: number; amount: number };
type PaymentStatusBreakdown = { status: string; transactions: number; amount: number };
type DailyTrendPoint = { date: string; revenue: number; appointments: number; patients: number };
type AppointmentTypeBreakdown = { type: string; count: number };

type ReportsPayload = {
  revenue: RevenueReport;
  no_show: NoShowReport[];
  peak_hours: PeakHourReport[];
  volume: VolumeReport;
  payment_methods: PaymentMethodBreakdown[];
  payment_statuses: PaymentStatusBreakdown[];
  daily_trends: DailyTrendPoint[];
  appointment_types: AppointmentTypeBreakdown[];
};

const PAYMENT_COLORS = ["#0284c7", "#14b8a6", "#2dd4bf", "#99f6e4", "#ccfbf1"];
const TYPE_COLORS: Record<string, string> = {
  Clinic: "#0284c7",
  Online: "#2563eb",
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMoneyCompact(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatPercent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatHourLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

function numberFromChartValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cell(value: string | number) {
  const isNumber = typeof value === "number";
  const type = isNumber ? "Number" : "String";
  return `<Cell><Data ss:Type="${type}">${isNumber ? value : xmlEscape(value)}</Data></Cell>`;
}

function worksheet(name: string, rows: Array<Array<string | number>>) {
  const body = rows.map((row) => `<Row>${row.map(cell).join("")}</Row>`).join("");
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${body}</Table></Worksheet>`;
}

function buildWorkbook(data: ReportsPayload, from: string, to: string) {
  const topPeak = data.peak_hours.reduce<PeakHourReport | null>(
    (best, current) => (!best || current.count > best.count ? current : best),
    null,
  );
  const totalNoShows = data.no_show.reduce((sum, row) => sum + row.no_shows, 0);
  const totalNoShowBase = data.no_show.reduce((sum, row) => sum + row.total, 0);

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${worksheet("Summary", [
  ["Clinic Reports Dashboard"],
  ["Date From", from],
  ["Date To", to],
  [],
  ["Metric", "Value"],
  ["Total Patients", data.volume.total_patients],
  ["Patients Served", data.volume.unique_patients],
  ["Appointments", data.volume.appointments],
  ["Revenue Total", data.revenue.total],
  ["Clinic Revenue", data.revenue.clinic],
  ["Online Revenue", data.revenue.online],
  ["No-show Rate", totalNoShowBase ? Number((totalNoShows / totalNoShowBase).toFixed(4)) : 0],
  ["Peak Hour", topPeak ? `${topPeak.start_time} (${topPeak.count})` : "No data"],
])}
${worksheet("Daily Trends", [
  ["Date", "Revenue", "Appointments", "Patients"],
  ...data.daily_trends.map((row) => [row.date, row.revenue, row.appointments, row.patients]),
])}
${worksheet("Payments", [
  ["Method", "Transactions", "Amount"],
  ...data.payment_methods.map((row) => [row.method, row.transactions, row.amount]),
  [],
  ["Status", "Transactions", "Amount"],
  ...data.payment_statuses.map((row) => [row.status, row.transactions, row.amount]),
])}
${worksheet("No Show", [
  ["Doctor", "No Shows", "Completed", "Total", "Rate"],
  ...data.no_show.map((row) => [row.doctor_name, row.no_shows, row.completed, row.total, Number(row.rate.toFixed(4))]),
])}
${worksheet("Peak Hours", [
  ["Start Time", "Appointments"],
  ...data.peak_hours.map((row) => [row.start_time, row.count]),
])}
</Workbook>`;
}

function downloadWorkbook(data: ReportsPayload, from: string, to: string) {
  const workbook = buildWorkbook(data, from, to);
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `clinic-reports-${from}-to-${to}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { accessToken, isLoading: authLoading } = useRole();
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayIso = today.toISOString().slice(0, 10);

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayIso);

  useEffect(() => {
    if (authLoading || !accessToken) return;
    if (from > to) {
      setError("The start date cannot be later than the end date.");
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoading(true);
        const url = new URL("/api/v2/reports", window.location.origin);
        url.searchParams.set("from", from);
        url.searchParams.set("to", to);
        const res = await fetch(url.toString(), {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to load reports.");
        const payload = (await res.json()) as ReportsPayload;
        if (!active) return;
        setData(payload);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load reports.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [accessToken, authLoading, from, to]);

  const totalNoShows = data?.no_show.reduce((sum, row) => sum + row.no_shows, 0) ?? 0;
  const totalNoShowBase = data?.no_show.reduce((sum, row) => sum + row.total, 0) ?? 0;
  const noShowRate = totalNoShowBase ? totalNoShows / totalNoShowBase : 0;
  const peakHour = data?.peak_hours.reduce<PeakHourReport | null>(
    (best, current) => (!best || current.count > best.count ? current : best),
    null,
  );
  const paymentTotal = data?.payment_methods.reduce((sum, row) => sum + row.amount, 0) ?? 0;
  const paidTransactions = data?.payment_statuses.find((row) => row.status === "Paid")?.transactions ?? 0;
  const totalTransactions = data?.payment_statuses.reduce((sum, row) => sum + row.transactions, 0) ?? 0;
  const collectionRate = totalTransactions ? paidTransactions / totalTransactions : 0;

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#0284c7_55%,#ecfeff_100%)] px-6 py-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] animate-fade-in-down">
        <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.24),transparent_58%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/90">Reports Center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Real clinic reporting for patients, collections, attendance, and busy hours
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50/85">
              Review operations in one place, spot no-show patterns quickly, and export an Excel-ready report for management.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickLink href="/payments" label="Payments" />
            <QuickLink href="/patients" label="Patients" />
            <QuickLink href="/appointments" label="Appointments" />
            <QuickLink href="/dashboard" label="Overview" />
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] animate-fade-in-up stagger-1">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Report Window</p>
            <p className="mt-1 text-sm text-slate-600">Adjust the date range to review performance for a day, week, month, or a custom period.</p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap gap-2">
              <PresetButton
                label="Today"
                onClick={() => {
                  setFrom(todayIso);
                  setTo(todayIso);
                }}
              />
              <PresetButton label="Last 7 days" onClick={() => applyPreset(setFrom, setTo, 6)} />
              <PresetButton label="Last 30 days" onClick={() => applyPreset(setFrom, setTo, 29)} />
              <PresetButton
                label="This month"
                onClick={() => {
                  setFrom(monthStart);
                  setTo(todayIso);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label className="text-slate-500">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
              <label className="text-slate-500">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
              <button
                type="button"
                onClick={() => data && downloadWorkbook(data, from, to)}
                disabled={!data || loading}
                className="rounded-full bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Patients"
          value={loading ? "..." : String(data?.volume.total_patients ?? 0)}
          hint={`${data?.volume.unique_patients ?? 0} served in selected range`}
          accent="teal"
        />
        <MetricCard
          label="Revenue"
          value={loading ? "..." : formatMoney(data?.revenue.total ?? 0)}
          hint={`${formatMoney(data?.revenue.clinic ?? 0)} clinic + ${formatMoney(data?.revenue.online ?? 0)} online`}
          accent="emerald"
        />
        <MetricCard
          label="Payment Reports"
          value={loading ? "..." : `${paidTransactions}/${totalTransactions || 0}`}
          hint={`${formatPercent(collectionRate)} paid collection rate`}
          accent="sky"
        />
        <MetricCard
          label="No-show Rate"
          value={loading ? "..." : formatPercent(noShowRate)}
          hint={`${totalNoShows} missed appointments`}
          accent="rose"
        />
        <MetricCard
          label="Peak Hour"
          value={loading ? "..." : peakHour ? formatHourLabel(peakHour.start_time) : "N/A"}
          hint={peakHour ? `${peakHour.count} bookings in the busiest slot` : "No activity in this range"}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel
          title="Daily Sales Report"
          subtitle="Use the Today preset for the cashier's day-end collection snapshot."
          className="animate-fade-in-up stagger-2"
        >
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Sales totals, payment methods, and visit-linked revenue refresh from the same paid POS and online transaction records used by receipts and billing history.
          </div>
        </Panel>
        <Panel
          title="Monthly Sales Report"
          subtitle="Use the This month preset for the running monthly clinic and online sales summary."
          className="animate-fade-in-up stagger-3"
        >
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Export the selected range to Excel when you need a formal monthly sales report for management or bookkeeping.
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Revenue and Visit Trend"
          subtitle="Daily snapshot of revenue, appointments, and patients served"
          className="animate-fade-in-up stagger-2"
        >
          {loading ? (
            <LoadingBlock className="h-[340px]" />
          ) : !data?.daily_trends.length ? (
            <EmptyState text="No trend data is available for the selected date range." />
          ) : (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily_trends} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickFormatter={(value) => formatMoneyCompact(Number(value))} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, name) =>
                      String(name) === "Revenue"
                        ? formatMoney(numberFromChartValue(value))
                        : numberFromChartValue(value).toLocaleString("en-US")
                    }
                    labelFormatter={(label) => formatDateLabel(String(label))}
                    contentStyle={{ borderRadius: 18, borderColor: "#dbeafe", boxShadow: "0 20px 45px rgba(15,23,42,0.12)" }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#0284c7" fill="url(#revenueFill)" strokeWidth={3} />
                  <Bar yAxisId="right" dataKey="appointments" name="Appointments" fill="#38bdf8" radius={[8, 8, 0, 0]} maxBarSize={26} />
                  <Bar yAxisId="right" dataKey="patients" name="Patients" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={26} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel
          title="Appointment Mix"
          subtitle="Clinic versus online visit distribution"
          className="animate-fade-in-up stagger-3"
        >
          {loading ? (
            <LoadingBlock className="h-[340px]" />
          ) : !data?.appointment_types.length ? (
            <EmptyState text="No appointment type data is available yet." />
          ) : (
            <>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.appointment_types}
                      dataKey="count"
                      nameKey="type"
                      innerRadius={72}
                      outerRadius={104}
                      paddingAngle={4}
                    >
                      {data.appointment_types.map((entry) => (
                        <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? "#14b8a6"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${numberFromChartValue(value)} appointments`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {data.appointment_types.map((row) => (
                  <div key={row.type} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[row.type] ?? "#14b8a6" }} />
                      <span className="text-sm font-semibold text-slate-700">{row.type}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{row.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Payment Method Breakdown" subtitle="Paid collections grouped by mode of payment" className="animate-fade-in-up stagger-4">
          {loading ? (
            <LoadingBlock className="h-[320px]" />
          ) : !data?.payment_methods.length ? (
            <EmptyState text="No paid transactions were found for this date range." />
          ) : (
            <>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.payment_methods} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="method" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => formatMoneyCompact(Number(value))} />
                    <Tooltip formatter={(value) => formatMoney(numberFromChartValue(value))} contentStyle={{ borderRadius: 18 }} />
                    <Bar dataKey="amount" radius={[12, 12, 0, 0]}>
                      {data.payment_methods.map((entry, index) => (
                        <Cell key={entry.method} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {data.payment_methods.map((row, index) => (
                  <div key={row.method} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }} />
                        <span className="text-sm font-semibold text-slate-700">{row.method}</span>
                      </div>
                      <span className="text-xs text-slate-500">{row.transactions} txns</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatMoney(row.amount)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>

        <Panel title="Payment Status Reports" subtitle="Track paid, pending, failed, and refunded transactions" className="animate-fade-in-up stagger-5">
          {loading ? (
            <LoadingBlock className="h-[320px]" />
          ) : !data?.payment_statuses.length ? (
            <EmptyState text="No payment status records are available yet." />
          ) : (
            <div className="space-y-4">
              {data.payment_statuses.map((row) => {
                const width = paymentTotal ? `${Math.max((row.amount / paymentTotal) * 100, 8)}%` : "8%";
                return (
                  <div key={row.status} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{row.status}</p>
                        <p className="text-xs text-slate-500">{row.transactions} transaction{row.transactions === 1 ? "" : "s"}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{formatMoney(row.amount)}</p>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-slate-200">
                      <div
                        className={`h-2.5 rounded-full ${
                          row.status === "Paid"
                            ? "bg-sky-500"
                            : row.status === "Pending"
                              ? "bg-amber-400"
                              : row.status === "Refunded"
                                ? "bg-fuchsia-500"
                                : "bg-rose-500"
                        }`}
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Peak Hour Analysis" subtitle="See which start times attract the highest booking volume" className="animate-fade-in-up stagger-6">
          {loading ? (
            <LoadingBlock className="h-[320px]" />
          ) : !data?.peak_hours.length ? (
            <EmptyState text="No appointment activity is available for the selected range." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peak_hours} margin={{ top: 8, right: 16, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="start_time" tickFormatter={formatHourLabel} stroke="#64748b" fontSize={11} interval={0} angle={-24} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                  <Tooltip
                    labelFormatter={(label) => formatHourLabel(String(label))}
                    formatter={(value) => `${numberFromChartValue(value)} bookings`}
                    contentStyle={{ borderRadius: 18 }}
                  />
                  <Bar dataKey="count" fill="#0284c7" radius={[12, 12, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="No-show Rate by Doctor" subtitle="Identify providers who may need reminder workflow support" className="animate-fade-in-up stagger-7">
          {loading ? (
            <LoadingBlock className="h-[320px]" />
          ) : !data?.no_show.length ? (
            <EmptyState text="No completed or no-show appointment data is available yet." />
          ) : (
            <div className="space-y-3">
              {data.no_show.map((row) => (
                <div key={row.doctor_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.doctor_name}</p>
                      <p className="text-xs text-slate-500">
                        {row.no_shows} no-show{row.no_shows === 1 ? "" : "s"} out of {row.total} total tracked visits
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.rate >= 0.2
                          ? "bg-rose-100 text-rose-700"
                          : row.rate >= 0.1
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {formatPercent(row.rate)}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-slate-200">
                    <div
                      className={`h-2.5 rounded-full ${
                        row.rate >= 0.2 ? "bg-rose-500" : row.rate >= 0.1 ? "bg-amber-400" : "bg-sky-500"
                      }`}
                      style={{ width: `${Math.max(row.rate * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function applyPreset(setFrom: (value: string) => void, setTo: (value: string) => void, daysBack: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysBack);
  setFrom(start.toISOString().slice(0, 10));
  setTo(end.toISOString().slice(0, 10));
}

function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${className ?? ""}`}>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: "teal" | "emerald" | "sky" | "rose" | "amber";
}) {
  const accents = {
    teal: "from-cyan-500/20 to-cyan-50 border-cyan-100",
    emerald: "from-sky-500/20 to-sky-50 border-sky-100",
    sky: "from-sky-500/20 to-sky-50 border-sky-100",
    rose: "from-rose-500/20 to-rose-50 border-rose-100",
    amber: "from-amber-400/20 to-amber-50 border-amber-100",
  };

  return (
    <div className={`animate-fade-in-up rounded-[1.5rem] border bg-linear-to-br ${accents[accent]} p-5 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/20 bg-white/12 px-4 py-2.5 text-center text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
    >
      {label}
    </Link>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
    >
      {label}
    </button>
  );
}

function LoadingBlock({ className }: { className: string }) {
  return <div className={`rounded-3xl bg-slate-100 shimmer ${className}`} />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
