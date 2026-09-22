import { api } from "./api";

// ─── Encounters (front desk) ───

export type Department = "er" | "opd" | "ipd" | "or";
export type EncounterStatus = "active" | "discharged" | "cancelled";

export type Encounter = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  mrn: string;
  department: Department;
  departmentLabel: string;
  status: EncounterStatus;
  chiefComplaint: string;
  triageLevel: string | null;
  doctorName: string | null;
  admittedAt: string;
  admittedTime: string;
  dischargedAt: string | null;
};

export type PatientLookup = {
  id: string;
  name: string;
  phone: string | null;
  mrn: string | null;
  nationalId: string | null;
};

export function lookupPatients(q: string) {
  return api<{ patients: PatientLookup[] }>(`/encounters/patients/lookup?q=${encodeURIComponent(q)}`);
}

export function registerPatient(input: { name: string; phone: string; nationalId?: string | undefined }) {
  return api<{ patient: PatientLookup }>("/encounters/patients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function checkIn(input: {
  patientId: string;
  department: Department;
  chiefComplaint?: string | undefined;
  triageLevel?: "red" | "yellow" | "green" | undefined;
  assignedDoctorId?: string | null | undefined;
}) {
  return api<{ encounter: Encounter; invoiceId: string }>("/encounters", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listEncounters(params?: { status?: string | undefined; department?: string | undefined }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.department) qs.set("department", params.department);
  return api<{ encounters: Encounter[] }>(`/encounters?${qs.toString()}`);
}

export function getEncounter(id: string) {
  return api<{
    encounter: Encounter;
    invoice: { id: string; status: string; total: number; paid: number; remaining: number } | null;
  }>(`/encounters/${id}`);
}

export function dischargeEncounter(id: string) {
  return api<{ encounter: Encounter }>(`/encounters/${id}/discharge`, { method: "POST" });
}

// ─── Billing (cashier) ───

export type InvoiceStatus = "open" | "partially_paid" | "paid" | "cancelled";

export type InvoiceSummary = {
  id: string;
  encounterId: string;
  status: InvoiceStatus;
  patientName: string;
  mrn: string;
  department: Department;
  departmentLabel: string;
  encounterStatus: EncounterStatus;
  total: number;
  paid: number;
  remaining: number;
  createdAt: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  time: string;
};

export type Payment = {
  id: string;
  amount: number;
  method: string;
  methodLabel: string;
  time: string;
};

export type Service = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  department: Department | null;
};

export function listInvoices(status?: string | undefined) {
  const qs = status ? `?status=${status}` : "";
  return api<{ invoices: InvoiceSummary[] }>(`/billing/invoices${qs}`);
}

export function getInvoice(id: string) {
  return api<{ invoice: InvoiceSummary; items: InvoiceItem[]; payments: Payment[] }>(`/billing/invoices/${id}`);
}

export function getServices() {
  return api<{ services: Service[] }>("/billing/services");
}

export function addInvoiceItem(
  invoiceId: string,
  input: { serviceId?: string | undefined; description?: string | undefined; category?: string | undefined; quantity?: number | undefined; unitPrice?: number | undefined },
) {
  return api<{ item: InvoiceItem }>(`/billing/invoices/${invoiceId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removeInvoiceItem(invoiceId: string, itemId: string) {
  return api<{ ok: boolean }>(`/billing/invoices/${invoiceId}/items/${itemId}`, { method: "DELETE" });
}

export function addPayment(invoiceId: string, input: { amount: number; method: "cash" | "card" | "insurance" | "transfer" }) {
  return api<{ payment: Payment; invoiceStatus: InvoiceStatus }>(`/billing/invoices/${invoiceId}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
