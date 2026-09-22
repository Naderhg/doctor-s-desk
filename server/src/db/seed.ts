import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { env } from "../lib/env.js";
import { db } from "./index.js";
import { clinicSettings, reviews, services, users, visitTypes, workingHours } from "./schema.js";

async function seed() {
  const email = env.doctorEmail.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`Doctor already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(env.doctorPassword, 12);
    await db.insert(users).values({
      name: env.doctorName,
      email,
      phone: null,
      passwordHash,
      role: "doctor",
    });
    console.log(`Seeded doctor ${email}`);
  }

  // Seed admin user
  const adminEmail = "admin@clinic.local";
  const [adminExisting] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
  if (adminExisting) {
    console.log(`Admin already exists: ${adminEmail}`);
  } else {
    const adminHash = await bcrypt.hash("Admin123!", 12);
    await db.insert(users).values({
      name: "مدير العيادة",
      email: adminEmail,
      phone: null,
      passwordHash: adminHash,
      role: "admin",
    });
    console.log(`Seeded admin ${adminEmail} (password: Admin123!)`);
  }

  // Seed cashier user
  const cashierEmail = "cashier@clinic.local";
  const [cashierExisting] = await db.select({ id: users.id }).from(users).where(eq(users.email, cashierEmail)).limit(1);
  if (cashierExisting) {
    console.log(`Cashier already exists: ${cashierEmail}`);
  } else {
    const cashierHash = await bcrypt.hash("Cashier123!", 12);
    await db.insert(users).values({
      name: "موظف الحسابات",
      email: cashierEmail,
      phone: null,
      passwordHash: cashierHash,
      role: "cashier",
    });
    console.log(`Seeded cashier ${cashierEmail} (password: Cashier123!)`);
  }

  // Seed services catalog
  const existingServices = await db.select({ id: services.id }).from(services).limit(1);
  if (existingServices.length === 0) {
    await db.insert(services).values([
      { code: "CONS-ER", name: "كشف طوارئ", category: "consultation", price: 500, department: "er" },
      { code: "CONS-OPD", name: "كشف عيادة خارجية", category: "consultation", price: 400, department: "opd" },
      { code: "CONS-FUP", name: "إعادة كشف", category: "consultation", price: 250, department: "opd" },
      { code: "ROOM-DAY", name: "إقامة ليلة — غرفة داخلي", category: "room", price: 1500, department: "ipd" },
      { code: "ROOM-ICU", name: "إقامة ليلة — رعاية مركزة", category: "room", price: 5000, department: "ipd" },
      { code: "OR-FEE", name: "رسوم غرفة عمليات", category: "procedure", price: 8000, department: "or" },
      { code: "LAB-CBC", name: "تحليل صورة دم كاملة CBC", category: "lab", price: 150, department: null },
      { code: "LAB-GLU", name: "تحليل سكر", category: "lab", price: 80, department: null },
      { code: "RAD-XRAY", name: "أشعة عادية", category: "radiology", price: 300, department: null },
      { code: "RAD-CT", name: "أشعة مقطعية", category: "radiology", price: 1200, department: null },
    ]);
    console.log("Seeded services catalog");
  }

  const [clinic] = await db.select({ id: clinicSettings.id }).from(clinicSettings).limit(1);
  if (!clinic) {
    await db.insert(clinicSettings).values({
      id: 1,
      doctorName: env.doctorName,
      clinicName: "عيادة د. كريم النجار",
      specialty: "باطنية عامة · استشارات ومتابعة",
      address: "شارع النيل، الدور الثاني — القاهرة",
      phone: "01000000000",
      cancelHours: 24,
      hoursDisplay: [
        { day: "السبت – الأربعاء", time: "٩:٠٠ ص – ٤:٠٠ م" },
        { day: "الخميس", time: "٩:٠٠ ص – ١:٠٠ م" },
        { day: "الجمعة", time: "مغلق" },
      ],
    });
  }

  const existingTypes = await db.select({ slug: visitTypes.slug }).from(visitTypes);
  if (existingTypes.length === 0) {
    await db.insert(visitTypes).values([
      { slug: "new", label: "كشف جديد", durationMin: 30, price: 400, deposit: 100, video: false },
      { slug: "followup", label: "إعادة كشف", durationMin: 20, price: 250, deposit: 50, video: false },
      { slug: "video", label: "استشارة فيديو", durationMin: 20, price: 300, deposit: 300, video: true },
    ]);
  }

  const hours = await db.select({ id: workingHours.id }).from(workingHours);
  if (hours.length === 0) {
    await db.insert(workingHours).values([
      { dayOfWeek: 0, startTime: "09:00", endTime: "16:00", closed: false },
      { dayOfWeek: 1, startTime: "09:00", endTime: "16:00", closed: false },
      { dayOfWeek: 2, startTime: "09:00", endTime: "16:00", closed: false },
      { dayOfWeek: 3, startTime: "09:00", endTime: "16:00", closed: false },
      { dayOfWeek: 4, startTime: "09:00", endTime: "13:00", closed: false },
      { dayOfWeek: 5, startTime: null, endTime: null, closed: true },
      { dayOfWeek: 6, startTime: "09:00", endTime: "16:00", closed: false },
    ]);
  }

  const existingReviews = await db.select({ id: reviews.id }).from(reviews);
  if (existingReviews.length === 0) {
    await db.insert(reviews).values([
      { name: "منى ر.", text: "شرح مفصل وصبر كبير في الكشف، والمواعيد دقيقة." },
      { name: "أحمد ع.", text: "الحجز من الموقع سهل جداً والروشتة وصلتني على طول." },
      { name: "نهى س.", text: "متابعة ممتازة لحالة والدتي المزمنة على مدار سنة." },
    ]);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
