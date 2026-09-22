import { api } from "./api";

export type ClinicInfo = {
  doctorName: string;
  clinicName: string;
  specialty: string;
  address: string;
  phone: string;
  cancelHours: number;
  hours: { day: string; time: string }[];
};

export type VisitType = {
  id: string;
  slug: string;
  label: string;
  durationMin: number;
  duration: string;
  price: number;
  deposit: number;
  video: boolean;
};

export type Review = { id: string; name: string; text: string };

export type DaySlot = { date: string; dayName: string; dayNum: string; closed: boolean };

export type Slot = { time: string; taken: boolean };

export type Appointment = {
  id: string;
  date: string;
  dateIso: string;
  dayLabel: string;
  time: string;
  type: string;
  visitTypeId: string;
  visitSlug: string;
  status: string;
  statusKey: string;
  reason: string;
  video: boolean;
  price: number;
  deposit: number;
};

export type Notification = { id: string; text: string; unread: boolean; time: string };

export type MedicalFile = {
  profile: {
    ageYears: number | null;
    gender: string | null;
    bloodType: string | null;
    chronic: string[];
    allergies: string[];
    medications: string[];
  };
  attachments: { id: string; name: string; date: string; size: string }[];
  visits: { id: string; date: string; type: string; reason: string; status: string }[];
};

export type Prescription = {
  id: string;
  date: string;
  diagnosis: string;
  doctorName: string;
  items: { drug: string; dose: string; duration: string }[];
  tests: string[];
};

export function getClinic() {
  return api<{ clinic: ClinicInfo; visitTypes: VisitType[]; reviews: Review[] }>("/clinic");
}

export function getDays(count = 10) {
  return api<{ days: DaySlot[] }>(`/clinic/days?count=${count}`);
}

export function getSlots(date: string, visitTypeId: string) {
  return api<{ closed: boolean; slots: Slot[] }>(
    `/clinic/slots?date=${encodeURIComponent(date)}&visitTypeId=${encodeURIComponent(visitTypeId)}`,
  );
}

export function getAppointments() {
  return api<{ upcoming: Appointment[]; past: Appointment[] }>("/appointments");
}

export function bookAppointment(input: { visitTypeId: string; date: string; time: string; reason: string }) {
  return api<{ appointment: Appointment }>("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cancelAppointment(id: string) {
  return api<{ appointment: Appointment }>(`/appointments/${id}/cancel`, { method: "POST" });
}

export function rescheduleAppointment(id: string, input: { date: string; time: string }) {
  return api<{ appointment: Appointment }>(`/appointments/${id}/reschedule`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getNotifications() {
  return api<{ notifications: Notification[] }>("/appointments/notifications");
}

export function getMedicalFile() {
  return api<MedicalFile>("/medical-file");
}

export function updateMedicalFile(input: MedicalFile["profile"]) {
  return api<{ ok: boolean }>("/medical-file", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function uploadAttachment(file: File) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const form = new FormData();
  form.append("file", file);
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${API_URL}/medical-file/attachments`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; attachment?: MedicalFile["attachments"][number] };
  if (!res.ok) throw new Error(data.error ?? "فشل رفع الملف");
  return data;
}

export function getPrescriptions() {
  return api<{ prescriptions: Prescription[] }>("/prescriptions");
}
