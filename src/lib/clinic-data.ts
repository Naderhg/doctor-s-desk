export const clinic = {
  doctorName: "د. كريم النجار",
  clinicName: "عيادة د. كريم النجار",
  specialty: "باطنية عامة · استشارات ومتابعة",
  address: "شارع النيل، الدور الثاني — القاهرة",
  phone: "٠١٠٠٠٠٠٠٠٠٠",
  hours: [
    { day: "السبت – الأربعاء", time: "٩:٠٠ ص – ٤:٠٠ م" },
    { day: "الخميس", time: "٩:٠٠ ص – ١:٠٠ م" },
    { day: "الجمعة", time: "مغلق" },
  ],
};

export type VisitType = {
  id: string;
  label: string;
  duration: string;
  price: number;
  deposit: number;
};

export const visitTypes: VisitType[] = [
  { id: "new", label: "كشف جديد", duration: "٣٠ دقيقة", price: 400, deposit: 100 },
  { id: "followup", label: "إعادة كشف", duration: "٢٠ دقيقة", price: 250, deposit: 50 },
  { id: "video", label: "استشارة فيديو", duration: "٢٠ دقيقة", price: 300, deposit: 300 },
];

export const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export type DaySlot = { date: string; dayName: string; dayNum: string; closed: boolean };

function toArabicDigits(value: number | string) {
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export { toArabicDigits };

export function nextDays(count = 10): DaySlot[] {
  const out: DaySlot[] = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    out.push({
      date: d.toISOString().slice(0, 10),
      dayName: arabicDays[d.getDay()],
      dayNum: toArabicDigits(d.getDate()),
      closed: d.getDay() === 5,
    });
  }
  return out;
}

export type Slot = { time: string; taken: boolean };

const baseTimes = [
  "٠٩:٠٠",
  "٠٩:٣٠",
  "١٠:٠٠",
  "١٠:٣٠",
  "١١:٠٠",
  "١١:٣٠",
  "١٢:٠٠",
  "٠١:٠٠",
  "٠١:٣٠",
  "٠٢:٠٠",
  "٠٢:٣٠",
  "٠٣:٠٠",
];

export function slotsForDate(date: string): Slot[] {
  const seed = date.split("-").reduce((a, p) => a + Number(p), 0);
  return baseTimes.map((time, i) => ({ time, taken: (seed + i * 3) % 4 === 0 }));
}

export type Appointment = {
  id: string;
  patient: string;
  date: string;
  dayLabel: string;
  time: string;
  type: string;
  status: "مؤكد" | "بانتظار الدفع" | "ملغي" | "مكتمل";
  reason: string;
  video?: boolean;
};

export const upcomingAppointments: Appointment[] = [
  {
    id: "a1",
    patient: "أنت",
    date: "٢٣ سبتمبر",
    dayLabel: "الثلاثاء",
    time: "١٠:١٥ ص",
    type: "إعادة كشف",
    status: "مؤكد",
    reason: "متابعة ضغط الدم",
  },
  {
    id: "a2",
    patient: "أنت",
    date: "٣٠ سبتمبر",
    dayLabel: "الثلاثاء",
    time: "١١:٠٠ ص",
    type: "استشارة فيديو",
    status: "بانتظار الدفع",
    reason: "مراجعة نتائج التحاليل",
    video: true,
  },
];

export const pastAppointments: Appointment[] = [
  {
    id: "p1",
    patient: "أنت",
    date: "٢ سبتمبر",
    dayLabel: "الثلاثاء",
    time: "٠٩:٣٠ ص",
    type: "كشف جديد",
    status: "مكتمل",
    reason: "صداع متكرر وإرهاق",
  },
  {
    id: "p2",
    patient: "أنت",
    date: "١٨ أغسطس",
    dayLabel: "الاثنين",
    time: "١٢:٠٠ م",
    type: "إعادة كشف",
    status: "مكتمل",
    reason: "متابعة تحليل الغدة",
  },
];

export const medicalProfile = {
  age: "٣٤ سنة",
  gender: "ذكر",
  bloodType: "O+",
  chronic: ["ارتفاع ضغط الدم"],
  allergies: ["بنسلين"],
  medications: ["كونكور ٥ مجم — قرص صباحاً"],
};

export const attachments = [
  { id: "f1", name: "تحليل صورة دم كاملة.pdf", date: "٢ سبتمبر ٢٠٢٦", size: "٤٢٠ ك.ب" },
  { id: "f2", name: "أشعة صدر.jpg", date: "١٨ أغسطس ٢٠٢٦", size: "١٫٢ م.ب" },
];

export type Prescription = {
  id: string;
  date: string;
  diagnosis: string;
  items: { drug: string; dose: string; duration: string }[];
  tests: string[];
};

export const prescriptions: Prescription[] = [
  {
    id: "rx-1042",
    date: "٢ سبتمبر ٢٠٢٦",
    diagnosis: "ارتفاع ضغط الدم — متابعة",
    items: [
      { drug: "كونكور ٥ مجم", dose: "قرص صباحاً", duration: "٣٠ يوم" },
      { drug: "أسبرين ٧٥ مجم", dose: "قرص بعد الغداء", duration: "٣٠ يوم" },
    ],
    tests: ["صورة دم كاملة", "وظائف كلى"],
  },
  {
    id: "rx-1008",
    date: "١٨ أغسطس ٢٠٢٦",
    diagnosis: "قصور بسيط في الغدة الدرقية",
    items: [{ drug: "إلتروكسين ٥٠ ميكروجرام", dose: "قرص على الريق", duration: "٤٥ يوم" }],
    tests: ["TSH", "T4 حر"],
  },
];

export const notifications = [
  { id: "n1", text: "تم تأكيد موعدك يوم الثلاثاء ١٠:١٥ ص", time: "منذ ساعتين", unread: true },
  { id: "n2", text: "روشتة جديدة متاحة للتحميل", time: "أمس", unread: true },
  { id: "n3", text: "تذكير: إلغاء مجاني قبل الموعد بـ ٢٤ ساعة", time: "منذ ٣ أيام", unread: false },
];

export type DoctorAppointment = {
  id: string;
  time: string;
  patient: string;
  type: string;
  status: "مؤكد" | "قيد الانتظار" | "حضور" | "غياب";
  phone: string;
};

export const todaySchedule: DoctorAppointment[] = [
  { id: "d1", time: "٠٩:٣٠", patient: "سارة عبدالله", type: "كشف جديد", status: "حضور", phone: "٠١٠١١١١١١١١" },
  { id: "d2", time: "١٠:١٥", patient: "محمد حسن", type: "إعادة كشف", status: "مؤكد", phone: "٠١٠٢٢٢٢٢٢٢٢" },
  { id: "d3", time: "١١:٠٠", patient: "ليلى سمير", type: "استشارة فيديو", status: "قيد الانتظار", phone: "٠١٠٣٣٣٣٣٣٣٣" },
  { id: "d4", time: "١٢:٠٠", patient: "عمر فاروق", type: "كشف جديد", status: "مؤكد", phone: "٠١٠٤٤٤٤٤٤٤٤" },
  { id: "d5", time: "٠١:٣٠", patient: "هالة منصور", type: "إعادة كشف", status: "قيد الانتظار", phone: "٠١٠٥٥٥٥٥٥٥٥" },
  { id: "d6", time: "٠٢:١٥", patient: "يوسف طارق", type: "كشف جديد", status: "غياب", phone: "٠١٠٦٦٦٦٦٦٦٦" },
];

export const patients = [
  { id: "pt1", name: "سارة عبدالله", age: "٢٩", phone: "٠١٠١١١١١١١١", lastVisit: "اليوم", visits: "٤" },
  { id: "pt2", name: "محمد حسن", age: "٤٧", phone: "٠١٠٢٢٢٢٢٢٢٢", lastVisit: "٢ سبتمبر", visits: "١١" },
  { id: "pt3", name: "ليلى سمير", age: "٣٦", phone: "٠١٠٣٣٣٣٣٣٣٣", lastVisit: "٢٨ أغسطس", visits: "٦" },
  { id: "pt4", name: "عمر فاروق", age: "٥٢", phone: "٠١٠٤٤٤٤٤٤٤٤", lastVisit: "١٥ أغسطس", visits: "٢" },
  { id: "pt5", name: "هالة منصور", age: "٣١", phone: "٠١٠٥٥٥٥٥٥٥٥", lastVisit: "٩ أغسطس", visits: "٨" },
];

export const savedDrugs = [
  "كونكور ٥ مجم",
  "أسبرين ٧٥ مجم",
  "إلتروكسين ٥٠ ميكروجرام",
  "أوجمنتين ١ جم",
  "بانادول إكسترا",
  "نكسيوم ٤٠ مجم",
];

export const reviews = [
  { id: "r1", name: "منى ر.", text: "شرح مفصل وصبر كبير في الكشف، والمواعيد دقيقة." },
  { id: "r2", name: "أحمد ع.", text: "الحجز من الموقع سهل جداً والروشتة وصلتني على طول." },
  { id: "r3", name: "نهى س.", text: "متابعة ممتازة لحالة والدتي المزمنة على مدار سنة." },
];
