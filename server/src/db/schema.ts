import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar, type AnyPgColumn } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["patient", "doctor", "admin", "receptionist", "cashier"]);
export const departmentEnum = pgEnum("department", ["er", "opd", "ipd", "or"]);
export const encounterStatusEnum = pgEnum("encounter_status", ["active", "discharged", "cancelled"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["open", "partially_paid", "paid", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "insurance", "transfer"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending_payment",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 30 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("patient"),
  assignedDoctorId: uuid("assigned_doctor_id").references((): AnyPgColumn => users.id),
  mrn: varchar("mrn", { length: 20 }).unique(),
  nationalId: varchar("national_id", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clinicSettings = pgTable("clinic_settings", {
  id: integer("id").primaryKey().default(1),
  doctorName: varchar("doctor_name", { length: 120 }).notNull(),
  clinicName: varchar("clinic_name", { length: 160 }).notNull(),
  specialty: varchar("specialty", { length: 160 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  cancelHours: integer("cancel_hours").notNull().default(24),
  hoursDisplay: jsonb("hours_display")
    .$type<{ day: string; time: string }[]>()
    .notNull(),
});

export const visitTypes = pgTable("visit_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  label: varchar("label", { length: 80 }).notNull(),
  durationMin: integer("duration_min").notNull(),
  price: integer("price").notNull(),
  deposit: integer("deposit").notNull(),
  video: boolean("video").notNull().default(false),
});

export const workingHours = pgTable("working_hours", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 5 }),
  endTime: varchar("end_time", { length: 5 }),
  closed: boolean("closed").notNull().default(false),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  text: text("text").notNull(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: uuid("doctor_id").references(() => users.id),
  visitTypeId: uuid("visit_type_id")
    .notNull()
    .references(() => visitTypes.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  reason: text("reason").notNull().default(""),
  status: appointmentStatusEnum("status").notNull().default("pending_payment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const medicalProfiles = pgTable("medical_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  ageYears: integer("age_years"),
  gender: varchar("gender", { length: 20 }),
  bloodType: varchar("blood_type", { length: 8 }),
  chronic: jsonb("chronic").$type<string[]>().notNull().default([]),
  allergies: jsonb("allergies").$type<string[]>().notNull().default([]),
  medications: jsonb("medications").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storedName: varchar("stored_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const visits = pgTable("visits", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: uuid("doctor_id").references(() => users.id),
  complaint: text("complaint"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  vitals: jsonb("vitals").$type<Record<string, string>>(),
  labs: jsonb("labs").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => users.id),
  visitId: uuid("visit_id").references(() => visits.id),
  diagnosis: varchar("diagnosis", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prescriptionItems = pgTable("prescription_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  prescriptionId: uuid("prescription_id")
    .notNull()
    .references(() => prescriptions.id),
  drug: varchar("drug", { length: 160 }).notNull(),
  dose: varchar("dose", { length: 160 }).notNull(),
  duration: varchar("duration", { length: 80 }).notNull(),
});

export const prescriptionTests = pgTable("prescription_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  prescriptionId: uuid("prescription_id")
    .notNull()
    .references(() => prescriptions.id),
  name: varchar("name", { length: 160 }).notNull(),
});

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment_new",
  "appointment_status",
  "appointment_reminder",
  "visit_new",
  "prescription_new",
  "attachment_new",
  "medical_update",
  "medication_reminder",
  "system",
]);

// ─── Hospital: encounters & billing ───

export const encounters = pgTable("encounters", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => users.id),
  department: departmentEnum("department").notNull(),
  status: encounterStatusEnum("status").notNull().default("active"),
  chiefComplaint: text("chief_complaint").notNull().default(""),
  triageLevel: varchar("triage_level", { length: 10 }), // red | yellow | green (ER only)
  assignedDoctorId: uuid("assigned_doctor_id").references(() => users.id),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  admittedAt: timestamp("admitted_at", { withTimezone: true }).defaultNow().notNull(),
  dischargedAt: timestamp("discharged_at", { withTimezone: true }),
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(), // consultation | lab | radiology | medication | room | procedure | other
  price: integer("price").notNull(),
  department: departmentEnum("department"),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  encounterId: uuid("encounter_id")
    .notNull()
    .references(() => encounters.id),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => users.id),
  status: invoiceStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  serviceId: uuid("service_id").references(() => services.id),
  description: varchar("description", { length: 255 }).notNull(),
  category: varchar("category", { length: 40 }).notNull().default("other"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  amount: integer("amount").notNull(),
  method: paymentMethodEnum("method").notNull().default("cash"),
  receivedById: uuid("received_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: notificationTypeEnum("type").notNull().default("system"),
  title: varchar("title", { length: 200 }).notNull(),
  text: text("text").notNull(),
  metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default({}),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type VisitType = typeof visitTypes.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Encounter = typeof encounters.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Service = typeof services.$inferSelect;
