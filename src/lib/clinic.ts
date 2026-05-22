export type AvailabilityReason = "Not Available" | "Leave";

export type DoctorUnavailability = {
  id: string;
  doctorId: string;
  date: string;
  reason: AvailabilityReason;
  note: string;
};

export type PatientRecordItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  familyHistory: string;
  isWalkIn: boolean;
  status: "Active" | "Inactive";
};

export type PatientVisitRecord = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string;
  start: string;
  end: string;
  type: "Clinic" | "Online";
  reason: string;
  status: string;
  queueNumber: number;
  updatedAt: string | null;
  vitals: {
    updatedAt: string;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    temperatureC: number | null;
    pulseRate: number | null;
    oxygenSaturation: number | null;
    respiratoryRate: number | null;
    weightKg: number | null;
    heightCm: number | null;
    notes: string | null;
  } | null;
  consultation: {
    updatedAt: string;
    note: string;
    prescription: string;
  } | null;
};

export type ConsultationProgress = "Ready" | "In Progress" | "Completed";

export type ConsultationNote = {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientName: string;
  note: string;
  prescription: string;
  status: ConsultationProgress;
  updatedAt: string;
};

export type SystemSettings = {
  clinicName: string;
  email: string;
  phone: string;
  address: string;
  onlineConsultationFee: number;
  maxPatientsPerHour: number;
  clinicOpenTime: string;
  clinicCloseTime: string;
  // Permanent Google Meet (or other web-meeting) link the clinic uses for
  // every Online consultation. Empty string means "not configured yet" — the
  // UI surfaces a setup prompt and new bookings ship without a link.
  defaultMeetingLink: string;
};

// All clinic data now lives in Supabase. Only INITIAL_SYSTEM_SETTINGS remains
// as an in-memory default returned if the system_settings row is missing.
export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  clinicName: "Doctora Kulot Clinic",
  email: "admin@doctora-kulot.test",
  phone: "+1 (555) 123-4567",
  address: "123 Medical Avenue",
  onlineConsultationFee: 120,
  maxPatientsPerHour: 5,
  clinicOpenTime: "08:00",
  clinicCloseTime: "17:00",
  defaultMeetingLink: "",
};
