import { api } from "./api";

export type DoctorAppointment = {
  id: string;
  patientId: string;
  patient: string;
  phone: string;
  time: string;
  type: string;
  visitTypeId: string;
  status: string;
  statusKey: "pending_payment" | "confirmed" | "cancelled" | "completed" | "no_show";
  reason: string;
  dateIso: string;
};

export type DoctorPatientListItem = {
  id: string;
  name: string;
  phone: string;
  age: string;
  lastVisit: string;
  visits: string;
};

export type DoctorPatientFile = {
  id: string;
  name: string;
  phone: string;
  age: string;
  gender: string;
  bloodType: string;
  chronic: string[];
  allergies: string[];
  medications: string[];
  lastVisit: string;
  visitsCount: string;
  attachments: { id: string; name: string; date: string; size: string }[];
  visits: {
    id: string;
    date: string;
    time: string;
    type: string;
    complaint: string;
    diagnosis: string;
    notes: string;
    vitals: Record<string, string>;
    labs: Record<string, string>;
    prescription: { drug: string; dose: string; duration: string }[];
    tests: string[];
  }[];
};

export type DoctorSettings = {
  clinic: {
    doctorName: string;
    clinicName: string;
    specialty: string;
    address: string;
    phone: string;
    cancelHours: number;
  } | null;
  visitTypes: {
    id: string;
    slug: string;
    label: string;
    durationMin: number;
    price: number;
    deposit: number;
    video: boolean;
  }[];
  workingHours: {
    id: string;
    dayOfWeek: number;
    startTime: string | null;
    endTime: string | null;
    closed: boolean;
  }[];
};

export type MonthReport = {
  id: string;
  label: string;
  revenue: number;
  deposits: number;
  booked: number;
  attended: number;
  cancelled: number;
  noShow: number;
  newPatients: number;
  diagnoses: { name: string; count: number }[];
};

export function getDoctorOverview() {
  return api<{
    doctorName: string;
    stats: { todayCount: number; completed: number; waiting: number; prescriptionsThisMonth: number };
    today: DoctorAppointment[];
    recentPatients: { id: string; name: string; lastVisit: string }[];
  }>("/doctor/overview");
}

export function getDoctorSchedule(date: string) {
  return api<{
    date: string;
    days: { date: string; dayName: string; dayNum: string; closed: boolean }[];
    closed: boolean;
    slots: { time: string; taken: boolean }[];
    appointments: DoctorAppointment[];
  }>(`/doctor/schedule?date=${encodeURIComponent(date)}`);
}

export function updateAppointmentStatus(id: string, status: "confirmed" | "cancelled" | "completed" | "no_show") {
  return api<{ appointment: DoctorAppointment }>(`/doctor/appointments/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function getDoctorPatients(q = "") {
  return api<{ patients: DoctorPatientListItem[] }>(`/doctor/patients?q=${encodeURIComponent(q)}`);
}

export function getDoctorPatient(id: string) {
  return api<{ patient: DoctorPatientFile }>(`/doctor/patients/${id}`);
}

export function createVisit(input: {
  patientId: string;
  appointmentId?: string | null;
  complaint?: string;
  diagnosis: string;
  notes?: string;
  items: { drug: string; dose: string; duration: string }[];
  tests: string[];
}) {
  return api<{ ok: boolean; visitId: string; prescriptionId: string }>("/doctor/visits", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getDoctorSettings() {
  return api<DoctorSettings>("/doctor/settings");
}

export function saveDoctorSettings(input: {
  clinic: NonNullable<DoctorSettings["clinic"]>;
  workingHours: DoctorSettings["workingHours"];
  visitTypes: { id: string; label: string; durationMin: number; price: number; deposit: number }[];
}) {
  return api<{ ok: boolean }>("/doctor/settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function getDoctorReports(month?: string) {
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  return api<{ months: { id: string; label: string }[]; report: MonthReport }>(`/doctor/reports${q}`);
}

export function toArabicDigits(value: number | string) {
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
