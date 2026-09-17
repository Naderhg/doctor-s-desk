import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/hooks/use-auth";
import { useClinic } from "@/hooks/use-clinic";
import { ApiError } from "@/lib/api";
import { bookAppointment, getDays, getSlots } from "@/lib/patient";

type Search = { type?: string | undefined };

export const Route = createFileRoute("/booking")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    type: typeof search['type'] === "string" ? (search['type'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "حجز موعد — عيادة د. كريم النجار" },
      { name: "description", content: "اختر نوع الكشف واليوم والموعد الفاضي، ثم أكّد الحجز في خطوات بسيطة." },
      { property: "og:title", content: "حجز موعد — عيادة د. كريم النجار" },
      { property: "og:description", content: "مواعيد فاضية محدّثة، ومنع الحجز المزدوج." },
    ],
  }),
  component: BookingPage,
});

const steps = ["نوع الكشف", "اليوم", "الموعد", "التأكيد"];

function BookingPage() {
  const { user } = useAuth();
  if (!user) {
    return (
      <AuthGate>
        <div />
      </AuthGate>
    );
  }
  return <BookingForm />;
}

function BookingForm() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: clinicData } = useClinic();
  const visitTypes = clinicData?.visitTypes ?? [];
  const daysQuery = useQuery({ queryKey: ["clinic-days"], queryFn: () => getDays(10) });
  const days = daysQuery.data?.days ?? [];

  const [step, setStep] = useState(0);
  const [typeId, setTypeId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!visitTypes.length || typeId) return;
    const fromSearch = visitTypes.find((v) => v.slug === search.type);
    setTypeId((fromSearch ?? visitTypes[0]!).id);
  }, [visitTypes, search.type, typeId]);

  useEffect(() => {
    if (!days.length || date) return;
    const open = days.find((d) => !d.closed);
    if (open) setDate(open.date);
  }, [days, date]);

  const visit = visitTypes.find((v) => v.id === typeId) ?? visitTypes[0];
  const slotsQuery = useQuery({
    queryKey: ["slots", date, visit?.id],
    queryFn: () => getSlots(date, visit!.id),
    enabled: Boolean(date && visit?.id),
  });
  const slots = slotsQuery.data?.slots ?? [];
  const selectedDay = days.find((d) => d.date === date);
  const canNext = step === 0 ? Boolean(typeId) : step === 1 ? Boolean(date) : step === 2 ? Boolean(time) : true;

  if (done) {
    return (
      <PageShell title="تم استلام طلب الحجز" eyebrow="حجز موعد">
        <div className="glass max-w-lg rounded-3xl p-7">
          <p className="text-sm text-muted-foreground">حالة الحجز</p>
          <p className="mt-1 font-display text-2xl text-primary">بانتظار الدفع / الدفع في العيادة</p>
          <dl className="mt-5 space-y-2 text-sm">
            <Row label="نوع الكشف" value={visit?.label ?? "—"} />
            <Row label="اليوم" value={`${selectedDay?.dayName} ${selectedDay?.dayNum}`} />
            <Row label="الموعد" value={time ?? "—"} />
            <Row label="سبب الزيارة" value={reason || "—"} />
            <Row label="العربون" value={`${visit?.deposit ?? 0} ج.م`} />
          </dl>
          <p className="mt-5 text-xs text-muted-foreground">
            الإلغاء المجاني متاح قبل الموعد بـ ٢٤ ساعة. سيظهر الحجز في صفحة «مواعيدي».
          </p>
          <button className="btn-ghost mt-6 px-5 py-3" onClick={() => { setDone(false); setStep(0); setTime(null); }}>
            حجز موعد آخر
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="حجز موعد"
      title="احجز موعدك"
      description="اختر نوع الكشف، ثم اليوم المتاح، ثم الموعد الفاضي. المواعيد المحجوزة أو التي مضت لا تظهر كمتاحة."
    >
      <div className="glass rounded-3xl p-6 sm:p-8">
        <ol className="flex flex-wrap gap-2 text-xs">
          {steps.map((s, i) => (
            <li
              key={s}
              className={`rounded-full px-4 py-1.5 font-semibold ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "border border-primary/40 text-primary"
                    : "border border-border text-muted-foreground"
              }`}
            >
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-7">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {visitTypes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setTypeId(v.id)}
                  className={`rounded-2xl border p-4 text-right transition-colors ${
                    typeId === v.id ? "border-primary bg-primary/15" : "border-border bg-muted hover:border-border-strong"
                  }`}
                >
                  <p className="font-semibold">{v.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{v.duration}</p>
                  <p className="mt-3 font-display font-bold text-primary">{v.price} ج.م</p>
                  <p className="text-xs text-muted-foreground">عربون {v.deposit} ج.م</p>
                </button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {days.map((d) => (
                <button
                  key={d.date}
                  disabled={d.closed}
                  onClick={() => { setDate(d.date); setTime(null); }}
                  className={`rounded-2xl border px-2 py-3 text-center transition-colors ${
                    d.closed
                      ? "cursor-not-allowed border-border bg-muted text-subtle"
                      : date === d.date
                        ? "border-primary bg-primary/15"
                        : "border-border bg-muted hover:border-border-strong"
                  }`}
                >
                  <span className="block text-xs text-muted-foreground">{d.dayName}</span>
                  <span className="block font-display text-xl font-bold">{d.dayNum}</span>
                  {d.closed ? <span className="block text-[10px] text-subtle">إجازة</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                المواعيد الفاضية يوم {selectedDay?.dayName} {selectedDay?.dayNum}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    disabled={s.taken}
                    onClick={() => setTime(s.time)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                      s.taken
                        ? "cursor-not-allowed border-border bg-muted text-subtle line-through"
                        : time === s.time
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted hover:border-border-strong"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">سبب الزيارة</label>
                <textarea
                  className="field min-h-32"
                  placeholder="اكتب شكواك باختصار ليطّلع عليها الدكتور قبل الكشف"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="glass-soft rounded-2xl p-5 text-sm">
                <p className="mb-3 font-semibold">ملخص الحجز</p>
                <dl className="space-y-2">
                  <Row label="نوع الكشف" value={visit?.label ?? "—"} />
                  <Row label="اليوم" value={`${selectedDay?.dayName} ${selectedDay?.dayNum}`} />
                  <Row label="الموعد" value={time ?? "—"} />
                  <Row label="سعر الكشف" value={`${visit?.price ?? 0} ج.م`} />
                  <Row label="العربون المطلوب" value={`${visit?.deposit ?? 0} ج.م`} />
                </dl>
                <p className="mt-4 rounded-xl border border-border bg-muted p-3 text-xs text-muted-foreground">
                  الدفع الإلكتروني غير مفعّل حالياً، سيتم تسجيل الحجز بحالة «بانتظار الدفع / الدفع في العيادة».
                </p>
              </div>
            </div>
          ) : null}
        </div>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            className="btn-ghost px-5 py-3 disabled:opacity-40"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            السابق
          </button>
          {step < 3 ? (
            <button
              className="btn-primary px-6 py-3"
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(3, s + 1))}
            >
              التالي
            </button>
          ) : (
            <button
              className="btn-primary px-6 py-3"
              disabled={pending || !visit || !time || !date}
              onClick={async () => {
                if (!visit || !time || !date) return;
                setPending(true);
                setError(null);
                try {
                  await bookAppointment({ visitTypeId: visit.id, date, time, reason });
                  await queryClient.invalidateQueries({ queryKey: ["appointments"] });
                  setDone(true);
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "تعذّر تأكيد الحجز");
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? "جارٍ التأكيد..." : "تأكيد الحجز"}
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
