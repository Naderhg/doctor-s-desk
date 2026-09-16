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
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}

export { toArabicDigits };

export function nextDays(count = 10): DaySlot[] {
  const out: DaySlot[] = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    out.push({
      date: d.toISOString().slice(0, 10),
      dayName: arabicDays[d.getDay()]!,
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

export type PatientVisit = {
  id: string;
  date: string;
  time: string;
  type: string;
  complaint: string;
  diagnosis: string;
  notes?: string;
  vitals?: { bp?: string; temp?: string; weight?: string };
  labs?: { sugar?: string; hb?: string };
  prescription: { drug: string; dose: string; duration: string }[];
  tests: string[];
  followUp?: string;
};

export type PatientRecord = {
  id: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  bloodType: string;
  chronic: string[];
  allergies: string[];
  medications: string[];
  lastVisit: string;
  visitsCount: string;
  attachments: { id: string; name: string; date: string; size: string }[];
  visits: PatientVisit[];
};

export const patientRecords: PatientRecord[] = [
  {
    id: "pt1",
    name: "سارة عبدالله",
    age: "٢٩ سنة",
    gender: "أنثى",
    phone: "٠١٠١١١١١١١١",
    bloodType: "A+",
    chronic: ["أنيميا نقص حديد"],
    allergies: ["لا يوجد"],
    medications: ["فيروجلوبين — كبسولة يومياً"],
    lastVisit: "اليوم",
    visitsCount: "٤",
    attachments: [
      { id: "s1", name: "صورة دم كاملة.pdf", date: "١٥ سبتمبر ٢٠٢٦", size: "٣١٠ ك.ب" },
      { id: "s2", name: "نسبة الحديد.pdf", date: "٢ سبتمبر ٢٠٢٦", size: "٢٢٠ ك.ب" },
    ],
    visits: [
      {
        id: "v-s3",
        date: "١٥ سبتمبر ٢٠٢٦",
        time: "٠٩:٣٠ ص",
        type: "إعادة كشف",
        complaint: "إرهاق وشحوب مستمر",
        diagnosis: "أنيميا نقص حديد — تحسن جزئي",
        notes: "الهيموجلوبين ارتفع من ٩٫٢ إلى ١٠٫٨",
        vitals: { bp: "١١٠/٧٠", temp: "٣٦٫٨", weight: "٥٨ كجم" },
        labs: { hb: "١٠٫٨", sugar: "٩٥" },
        prescription: [
          { drug: "فيروجلوبين", dose: "كبسولة يومياً بعد الأكل", duration: "٦٠ يوم" },
          { drug: "فيتامين سي ١٠٠٠", dose: "قرص يومياً", duration: "٣٠ يوم" },
        ],
        tests: ["صورة دم كاملة بعد شهرين"],
        followUp: "١٥ نوفمبر ٢٠٢٦",
      },
      {
        id: "v-s2",
        date: "٢ سبتمبر ٢٠٢٦",
        time: "١٠:٠٠ ص",
        type: "إعادة كشف",
        complaint: "دوخة عند الوقوف",
        diagnosis: "أنيميا نقص حديد",
        vitals: { bp: "١٠٠/٦٥", temp: "٣٦٫٦", weight: "٥٧ كجم" },
        labs: { hb: "٩٫٦", sugar: "٩٢" },
        prescription: [{ drug: "فيروجلوبين", dose: "كبسولة يومياً", duration: "٣٠ يوم" }],
        tests: ["نسبة الحديد والفيريتين"],
      },
      {
        id: "v-s1",
        date: "١٠ أغسطس ٢٠٢٦",
        time: "١١:٣٠ ص",
        type: "كشف جديد",
        complaint: "إرهاق عام وصداع",
        diagnosis: "اشتباه أنيميا",
        vitals: { bp: "١٠٥/٧٠", temp: "٣٦٫٩", weight: "٥٧ كجم" },
        labs: { hb: "٩٫٢", sugar: "٩٠" },
        prescription: [{ drug: "بانادول إكسترا", dose: "عند اللزوم", duration: "٧ أيام" }],
        tests: ["صورة دم كاملة"],
      },
    ],
  },
  {
    id: "pt2",
    name: "محمد حسن",
    age: "٤٧ سنة",
    gender: "ذكر",
    phone: "٠١٠٢٢٢٢٢٢٢٢",
    bloodType: "O+",
    chronic: ["ارتفاع ضغط الدم", "دهون مرتفعة"],
    allergies: ["بنسلين"],
    medications: ["كونكور ٥ مجم — قرص صباحاً"],
    lastVisit: "٢ سبتمبر",
    visitsCount: "١١",
    attachments: [{ id: "m1", name: "رسم قلب.pdf", date: "٢ سبتمبر ٢٠٢٦", size: "٥١٠ ك.ب" }],
    visits: [
      {
        id: "v-m2",
        date: "٢ سبتمبر ٢٠٢٦",
        time: "١٠:١٥ ص",
        type: "إعادة كشف",
        complaint: "متابعة ضغط الدم",
        diagnosis: "ارتفاع ضغط الدم — منضبط",
        vitals: { bp: "١٣٠/٨٥", temp: "٣٦٫٧", weight: "٨٨ كجم" },
        labs: { sugar: "١٠٥" },
        prescription: [
          { drug: "كونكور ٥ مجم", dose: "قرص صباحاً", duration: "٣٠ يوم" },
          { drug: "أسبرين ٧٥ مجم", dose: "قرص بعد الغداء", duration: "٣٠ يوم" },
        ],
        tests: ["وظائف كلى", "دهون الدم"],
        followUp: "٢ أكتوبر ٢٠٢٦",
      },
      {
        id: "v-m1",
        date: "٤ أغسطس ٢٠٢٦",
        time: "١٢:٠٠ م",
        type: "إعادة كشف",
        complaint: "صداع خلفي متكرر",
        diagnosis: "ارتفاع ضغط غير منضبط",
        vitals: { bp: "١٥٠/٩٥", temp: "٣٦٫٥", weight: "٩٠ كجم" },
        labs: { sugar: "١١٢" },
        prescription: [{ drug: "كونكور ٥ مجم", dose: "قرص صباحاً", duration: "٣٠ يوم" }],
        tests: ["رسم قلب"],
      },
    ],
  },
  {
    id: "pt3",
    name: "ليلى سمير",
    age: "٣٦ سنة",
    gender: "أنثى",
    phone: "٠١٠٣٣٣٣٣٣٣٣",
    bloodType: "B+",
    chronic: ["قصور بسيط في الغدة الدرقية"],
    allergies: ["لا يوجد"],
    medications: ["إلتروكسين ٥٠ ميكروجرام"],
    lastVisit: "٢٨ أغسطس",
    visitsCount: "٦",
    attachments: [{ id: "l1", name: "تحليل TSH.pdf", date: "٢٨ أغسطس ٢٠٢٦", size: "١٨٠ ك.ب" }],
    visits: [
      {
        id: "v-l1",
        date: "٢٨ أغسطس ٢٠٢٦",
        time: "١١:٠٠ ص",
        type: "استشارة فيديو",
        complaint: "زيادة وزن وخمول",
        diagnosis: "قصور بسيط في الغدة الدرقية",
        vitals: { weight: "٧٢ كجم" },
        prescription: [{ drug: "إلتروكسين ٥٠ ميكروجرام", dose: "قرص على الريق", duration: "٤٥ يوم" }],
        tests: ["TSH", "T4 حر"],
        followUp: "١٢ أكتوبر ٢٠٢٦",
      },
    ],
  },
  {
    id: "pt4",
    name: "عمر فاروق",
    age: "٥٢ سنة",
    gender: "ذكر",
    phone: "٠١٠٤٤٤٤٤٤٤٤",
    bloodType: "AB+",
    chronic: ["سكري نوع ٢"],
    allergies: ["سلفا"],
    medications: ["جلوكوفاج ١٠٠٠ مجم"],
    lastVisit: "١٥ أغسطس",
    visitsCount: "٢",
    attachments: [],
    visits: [
      {
        id: "v-o1",
        date: "١٥ أغسطس ٢٠٢٦",
        time: "١٢:٠٠ م",
        type: "كشف جديد",
        complaint: "عطش وكثرة تبول",
        diagnosis: "سكري نوع ٢ — بداية",
        vitals: { bp: "١٣٥/٨٥", weight: "٩٥ كجم" },
        prescription: [{ drug: "جلوكوفاج ١٠٠٠ مجم", dose: "قرص بعد الغداء", duration: "٣٠ يوم" }],
        tests: ["سكر صائم", "HbA1c"],
        followUp: "١٥ سبتمبر ٢٠٢٦",
      },
    ],
  },
  {
    id: "pt5",
    name: "هالة منصور",
    age: "٣١ سنة",
    gender: "أنثى",
    phone: "٠١٠٥٥٥٥٥٥٥٥",
    bloodType: "A-",
    chronic: ["لا يوجد"],
    allergies: ["لا يوجد"],
    medications: ["لا يوجد"],
    lastVisit: "٩ أغسطس",
    visitsCount: "٨",
    attachments: [],
    visits: [
      {
        id: "v-h1",
        date: "٩ أغسطس ٢٠٢٦",
        time: "٠١:٣٠ م",
        type: "إعادة كشف",
        complaint: "التهاب حلق وحرارة",
        diagnosis: "التهاب لوزتين بكتيري",
        vitals: { temp: "٣٨٫٢", bp: "١١٥/٧٥" },
        prescription: [
          { drug: "أوجمنتين ١ جم", dose: "قرص كل ١٢ ساعة", duration: "٧ أيام" },
          { drug: "بانادول إكسترا", dose: "عند اللزوم", duration: "٥ أيام" },
        ],
        tests: [],
      },
    ],
  },
];

export function getPatientRecord(id: string) {
  return patientRecords.find((p) => p.id === id);
}

export function getPatientRecordByName(name: string) {
  return patientRecords.find((p) => p.name === name);
}

/** يحوّل الأرقام العربية (مع الفاصلة ٫) إلى رقم إنجليزي */
export function fromArabicDigits(value: string): number | null {
  const normalized = value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[^\d.]/g, " ")
    .trim()
    .split(/\s+/)[0];
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export type MetricKey = "bp" | "weight" | "sugar" | "hb";

export const metricMeta: Record<MetricKey, { label: string; unit: string; normal: [number, number] }> = {
  bp: { label: "الضغط الانقباضي", unit: "mmHg", normal: [90, 130] },
  weight: { label: "الوزن", unit: "كجم", normal: [50, 90] },
  sugar: { label: "السكر الصائم", unit: "mg/dL", normal: [70, 100] },
  hb: { label: "الهيموجلوبين", unit: "g/dL", normal: [12, 16] },
};

export type MetricPoint = { date: string; value: number };

export function metricSeries(visits: PatientVisit[], key: MetricKey): MetricPoint[] {
  const raw = [...visits].reverse().map((v) => {
    const source =
      key === "bp" ? v.vitals?.bp : key === "weight" ? v.vitals?.weight : key === "sugar" ? v.labs?.sugar : v.labs?.hb;
    const value = source ? fromArabicDigits(source) : null;
    return value === null ? null : { date: v.date, value };
  });
  return raw.filter((p): p is MetricPoint => p !== null);
}

/** تعارضات دوائية مبسطة (عرض تجريبي) */
export const drugInteractions: { a: string; b: string; note: string; level: "خطر" | "تحذير" }[] = [
  { a: "أسبرين", b: "وارفارين", note: "زيادة كبيرة في خطر النزيف.", level: "خطر" },
  { a: "كونكور", b: "فيراباميل", note: "هبوط شديد في النبض وضغط الدم.", level: "خطر" },
  { a: "نكسيوم", b: "بلافكس", note: "يقلل فاعلية بلافكس.", level: "تحذير" },
  { a: "إلتروكسين", b: "فيروجلوبين", note: "الحديد يقلل امتصاص إلتروكسين — افصل ٤ ساعات.", level: "تحذير" },
  { a: "جلوكوفاج", b: "بريدنيزولون", note: "الكورتيزون يرفع السكر ويقلل فاعلية العلاج.", level: "تحذير" },
  { a: "أوجمنتين", b: "ميثوتركسيت", note: "ارتفاع سمية الميثوتركسيت.", level: "خطر" },
];

/** ربط اسم الدواء بمجموعة الحساسية */
export const allergyGroups: { allergy: string; drugs: string[] }[] = [
  { allergy: "بنسلين", drugs: ["أوجمنتين", "أموكسيسيلين", "يونيكتام", "هاي بيوتك", "بنسلين"] },
  { allergy: "سلفا", drugs: ["سبترين", "باكتريم", "سلفا"] },
  { allergy: "أسبرين", drugs: ["أسبرين", "بروفين", "كتافلام"] },
];

export type RxAlert = { level: "خطر" | "تحذير"; title: string; detail: string };

export function checkPrescription(
  drugs: string[],
  patient?: { allergies: string[]; medications: string[] },
): RxAlert[] {
  const alerts: RxAlert[] = [];
  const clean = drugs.map((d) => d.trim()).filter(Boolean);
  const has = (list: string[], token: string) => list.some((x) => x.includes(token) || token.includes(x));

  // حساسية
  for (const drug of clean) {
    for (const g of allergyGroups) {
      if (!patient?.allergies.some((a) => a.includes(g.allergy))) continue;
      if (g.drugs.some((d) => drug.includes(d))) {
        alerts.push({
          level: "خطر",
          title: `حساسية ${g.allergy}`,
          detail: `المريض لديه حساسية من ${g.allergy} — «${drug}» من نفس المجموعة.`,
        });
      }
    }
  }

  // تعارض بين أدوية الروشتة أو مع الأدوية الحالية
  const current = patient?.medications ?? [];
  const all = [...clean, ...current];
  for (const rule of drugInteractions) {
    const hitA = has(all, rule.a);
    const hitB = has(all, rule.b);
    const inRx = clean.some((d) => d.includes(rule.a) || d.includes(rule.b));
    if (hitA && hitB && inRx) {
      alerts.push({
        level: rule.level,
        title: `تعارض: ${rule.a} + ${rule.b}`,
        detail: rule.note,
      });
    }
  }

  // تكرار نفس الدواء
  const seen = new Set<string>();
  for (const d of clean) {
    const key = d.split(" ")[0]!;
    if (seen.has(key)) {
      alerts.push({ level: "تحذير", title: "دواء مكرر", detail: `«${d}» مكتوب أكثر من مرة في الروشتة.` });
    }
    seen.add(key);
  }

  return alerts;
}

/** التقرير الشهري (بيانات تجريبية) */
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

export const monthlyReports: MonthReport[] = [
  {
    id: "2026-09",
    label: "سبتمبر ٢٠٢٦",
    revenue: 48750,
    deposits: 12300,
    booked: 168,
    attended: 141,
    cancelled: 13,
    noShow: 14,
    newPatients: 29,
    diagnoses: [
      { name: "ارتفاع ضغط الدم", count: 34 },
      { name: "أنيميا نقص حديد", count: 22 },
      { name: "سكري نوع ٢", count: 18 },
      { name: "قصور الغدة الدرقية", count: 12 },
      { name: "التهاب لوزتين", count: 9 },
    ],
  },
  {
    id: "2026-08",
    label: "أغسطس ٢٠٢٦",
    revenue: 41200,
    deposits: 10100,
    booked: 152,
    attended: 124,
    cancelled: 11,
    noShow: 17,
    newPatients: 24,
    diagnoses: [
      { name: "ارتفاع ضغط الدم", count: 28 },
      { name: "نزلات معوية", count: 21 },
      { name: "أنيميا نقص حديد", count: 17 },
      { name: "سكري نوع ٢", count: 14 },
      { name: "التهاب جيوب أنفية", count: 8 },
    ],
  },
  {
    id: "2026-07",
    label: "يوليو ٢٠٢٦",
    revenue: 37900,
    deposits: 9400,
    booked: 139,
    attended: 112,
    cancelled: 12,
    noShow: 15,
    newPatients: 19,
    diagnoses: [
      { name: "ارتفاع ضغط الدم", count: 25 },
      { name: "سكري نوع ٢", count: 16 },
      { name: "صداع نصفي", count: 13 },
      { name: "أنيميا نقص حديد", count: 11 },
      { name: "التهاب لوزتين", count: 7 },
    ],
  },
];
