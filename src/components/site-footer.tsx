import { useClinic } from "@/hooks/use-clinic";

export function SiteFooter() {
  const { data } = useClinic();
  const clinic = data?.clinic;

  return (
    <footer className="relative z-10 px-4 pb-8 sm:px-8">
      <div className="glass-soft flex flex-col items-center justify-between gap-3 rounded-2xl px-6 py-4 text-sm text-muted-foreground sm:flex-row">
        <p>
          {clinic ? `${clinic.clinicName} — ${clinic.address} · ${clinic.phone}` : "عيادة د. كريم النجار"}
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
