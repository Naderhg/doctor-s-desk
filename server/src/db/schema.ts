import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["patient", "doctor"]);
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
