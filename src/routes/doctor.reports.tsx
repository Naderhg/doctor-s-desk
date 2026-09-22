import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { getDoctorReports } from "@/lib/doctor";

function toArabicDigits(value: number | string) {
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}

export const Route = createFileRoute("/doctor/reports")({
  head: () => ({
    meta: [
      { title: "التقرير الشهري — لوحة الدكتور" },
      { name: "description", content: "الإيرادات ونسب الغياب والإلغاء وأكثر التشخيصات شهرياً في العيادة." },
      { property: "og:title", content: "التقرير الشهري — لوحة الدكتور" },
      { property: "og:description", content: "أرقام العيادة في لمحة: إيرادات، حضور، غياب، وأكثر التشخيصات." },
    ],
  }),
  component: DoctorReports,
});

function pct(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string | undefined; tone?: "warn" | "good" | undefined }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-2xl ${
          tone === "warn" ? "text-destructive" : tone === "good" ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DoctorReports() {
  const [id, setId] = useState<string | undefined>(undefined);
  const reports = useQuery({
    queryKey: ["doctor-reports", id],
    queryFn: () => getDoctorReports(id ?? undefined),
  });
  const months = reports.data?.months ?? [];
  const r = reports.data?.report;
  if (!r) {
    return (
      <PageShell eyebrow="لوحة التحكم" title="التقرير الشهري" description="الإيرادات، نسب الحضور والغياب، وأكثر التشخيصات تكراراً.">
        <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
      </PageShell>
    );
  }
  const revenueDelta = null;
  const maxDx = Math.max(1, ...r.diagnoses.map((d) => d.count));

  return (
    <PageShell
      eyebrow="لوحة التحكم"
      title="التقرير الشهري"
      description="الإيرادات، نسب الحضور والغياب، وأكثر التشخيصات تكراراً."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {months.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setId(m.id)}
            className={m.id === r.id ? "btn-primary px-4 py-2 text-sm" : "btn-ghost px-4 py-2 text-sm"}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="إجمالي الإيرادات"
          value={`${toArabicDigits(r.revenue.toLocaleString("en-US"))} ج.م`}
          hint={revenueDelta === null ? undefined : `${revenueDelta >= 0 ? "▲" : "▼"} ${toArabicDigits(Math.abs(revenueDelta))}٪ عن الشهر السابق`}
          tone="good"
        />
        <Stat
          label="العرابين المحصّلة"
          value={`${toArabicDigits(r.deposits.toLocaleString("en-US"))} ج.م`}
          hint={`${toArabicDigits(pct(r.deposits, r.revenue))}٪ من الإيراد`}
        />
        <Stat
          label="نسبة الغياب"
          value={`${toArabicDigits(pct(r.noShow, r.booked))}٪`}
          hint={`${toArabicDigits(r.noShow)} مريض لم يحضر من ${toArabicDigits(r.booked)} حجز`}
          tone="warn"
        />
        <Stat
          label="نسبة الإلغاء"
          value={`${toArabicDigits(pct(r.cancelled, r.booked))}٪`}
          hint={`${toArabicDigits(r.cancelled)} حجز ملغي`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 font-display text-lg">الحجوزات</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "تم الكشف", value: r.attended, tone: "bg-primary" },
              { label: "غياب", value: r.noShow, tone: "bg-destructive" },
              { label: "إلغاء", value: r.cancelled, tone: "bg-muted-foreground" },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between">
                  <span>{row.label}</span>
                  <span className="text-muted-foreground">
                    {toArabicDigits(row.value)} · {toArabicDigits(pct(row.value, r.booked))}٪
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                  <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${pct(row.value, r.booked)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="glass-soft rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">إجمالي الحجوزات</p>
              <p className="mt-1 font-display text-xl">{toArabicDigits(r.booked)}</p>
            </div>
            <div className="glass-soft rounded-2xl p-4">
              <p className="text-xs text-muted-foreground">مرضى جدد</p>
              <p className="mt-1 font-display text-xl">{toArabicDigits(r.newPatients)}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 font-display text-lg">أكثر التشخيصات</h2>
          <ul className="space-y-3 text-sm">
            {r.diagnoses.map((d) => (
              <li key={d.name}>
                <div className="mb-1 flex justify-between">
                  <span>{d.name}</span>
                  <span className="text-muted-foreground">{toArabicDigits(d.count)} حالة</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${(d.count / maxDx) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}
