export const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function toArabicDigits(value: number | string) {
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function formatTimeAr(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? "م" : "ص";
  const hour12 = h % 12 || 12;
  return `${toArabicDigits(pad2(hour12))}:${toArabicDigits(pad2(m))} ${period}`;
}

export function formatDateAr(date: Date) {
  return `${toArabicDigits(date.getDate())} ${monthName(date.getMonth())}`;
}

export function monthName(month: number) {
  return ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"][month]!;
}

export const doctorStatusAr = {
  pending_payment: "قيد الانتظار",
  confirmed: "مؤكد",
  cancelled: "ملغي",
  completed: "حضور",
  no_show: "غياب",
} as const;

export function formatDateTimeAr(date: Date) {
  return `${formatDateAr(date)} ${date.getFullYear()}`;
}

export function relativeTimeAr(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `منذ ${toArabicDigits(mins)} دقيقة`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `منذ ${toArabicDigits(hours)} ساعة`;
  const days = Math.round(hours / 24);
  if (days === 1) return "أمس";
  return `منذ ${toArabicDigits(days)} أيام`;
}

export const appointmentStatusAr = {
  pending_payment: "بانتظار الدفع",
  confirmed: "مؤكد",
  cancelled: "ملغي",
  completed: "مكتمل",
  no_show: "غياب",
} as const;

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${toArabicDigits(bytes)} بايت`;
  if (bytes < 1024 * 1024) return `${toArabicDigits(Math.round(bytes / 1024))} ك.ب`;
  return `${toArabicDigits((bytes / (1024 * 1024)).toFixed(1))} م.ب`;
}

export function cairoDate(year: number, month: number, day: number, hours = 0, minutes = 0) {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}
