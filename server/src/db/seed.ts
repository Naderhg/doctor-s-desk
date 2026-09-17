import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { env } from "../lib/env.js";
import { db } from "./index.js";
import { clinicSettings, reviews, users, visitTypes, workingHours } from "./schema.js";

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
