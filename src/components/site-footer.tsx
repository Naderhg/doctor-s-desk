import { clinic } from "@/lib/clinic-data";

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-4 pb-8 sm:px-8">
      <div className="glass-soft flex flex-col items-center justify-between gap-3 rounded-2xl px-6 py-4 text-sm text-muted-foreground sm:flex-row">
        <p>
          {clinic.clinicName} — {clinic.address} · {clinic.phone}
        </p>
        <div className="flex gap-5">
          <span>سياسة الإلغاء</span>
          <span>الخصوصية</span>
          <span>تواصل</span>
        </div>
      </div>
    </footer>
  );
}
