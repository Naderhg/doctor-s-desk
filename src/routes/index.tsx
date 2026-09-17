import { createFileRoute, Link } from "@tanstack/react-router";
import { useClinic } from "@/hooks/use-clinic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "عيادة د. كريم النجار — احجز كشفك أونلاين" },
      {
        name: "description",
        content:
          "عيادة باطنية عامة: حجز المواعيد أونلاين، متابعة الملف الطبي والروشتات، واستشارات فيديو.",
      },
      { property: "og:title", content: "عيادة د. كريم النجار — احجز كشفك أونلاين" },
      {
        property: "og:description",
        content: "احجز موعدك في دقيقتين وتابع ملفك الطبي وروشتاتك من مكان واحد.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading } = useClinic();
  const clinic = data?.clinic;
  const visitTypes = data?.visitTypes ?? [];
  const reviews = data?.reviews ?? [];

  return (
    <>
      <section className="relative z-10 grid gap-6 px-4 pb-10 pt-4 sm:px-8 lg:grid-cols-12">
        <div className="glass rounded-3xl p-7 sm:p-10 lg:col-span-7">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
            متاح للحجز أونلاين
          </span>
          <h1 className="mt-5 font-display text-3xl leading-[1.25] sm:text-5xl">
            رعاية طبية هادئة ترتكز على التفاصيل
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
            احجز كشفك في دقيقتين، تابع ملفك الطبي وروشتاتك من مكان واحد، وتذكّر بموعدك تلقائياً. تجربة صُمّمت
            لتكتمل بسلام ووضوح.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/booking" className="btn-primary px-6 py-3.5">
              احجز موعدك
            </Link>
            <Link to="/booking" search={{ type: "video" }} className="btn-ghost px-6 py-3.5">
              استشارة فيديو
            </Link>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-7 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">الخدمات والأسعار</h2>
            <span className="text-xs text-muted-foreground">العربون قابل للخصم</span>
          </div>
          <div className="mt-5 space-y-3">
            {isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
            {visitTypes.map((v) => (
              <Link
                key={v.id}
                to="/booking"
                search={{ type: v.slug }}
                className="glass-soft flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors hover:border-border-strong"
              >
                <span>
                  <span className="block font-semibold">{v.label}</span>
                  <span className="block text-xs text-muted-foreground">{v.duration}</span>
                </span>
                <span className="font-display font-bold text-primary">{v.price} ج.م</span>
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-muted p-4 text-sm">
            <p className="mb-2 font-semibold">مواعيد العمل</p>
            <ul className="space-y-1.5 text-muted-foreground">
              {(clinic?.hours ?? []).map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <span>{h.day}</span>
                  <span className="text-foreground">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
          {clinic ? <p className="mt-4 text-xs text-muted-foreground">{clinic.address}</p> : null}
        </div>
      </section>

      <section className="relative z-10 grid gap-5 px-4 pb-12 sm:px-8 md:grid-cols-3">
        {[
          {
            k: "+",
            t: "الملف الطبي",
            d: "بياناتك الصحية، فصيلة الدم، الحساسية، رفع التحاليل والأشعة وتاريخ الزيارات — كل شيء في مكان واحد.",
            to: "/medical-file" as const,
          },
          {
            k: "ر",
            t: "الروشتات",
            d: "روشتات مكتوبة بجرعات ومدة واضحة، عرض وطباعة أو تحميل PDF في أي وقت بعد الزيارة.",
            to: "/prescriptions" as const,
          },
          {
            k: "ت",
            t: "تذكير تلقائي",
            d: "إشعار داخل الموقع قبل موعدك، مع رابط مكالمة الفيديو يظهر في وقته. إلغاء مجاني قبل ٢٤ ساعة.",
            to: "/appointments" as const,
          },
        ].map((f) => (
          <Link key={f.t} to={f.to} className="glass rounded-2xl p-6 transition-colors hover:border-border-strong">
            <span className="grid size-11 place-items-center rounded-xl bg-brand/40 font-display text-lg font-bold text-primary">
              {f.k}
            </span>
            <h3 className="mt-4 font-display">{f.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
          </Link>
        ))}
      </section>

      <section className="relative z-10 grid gap-5 px-4 pb-12 sm:px-8 md:grid-cols-3">
        {reviews.map((r) => (
          <div key={r.id} className="glass-soft rounded-2xl p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">“{r.text}”</p>
            <p className="mt-4 text-sm font-semibold">{r.name}</p>
          </div>
        ))}
      </section>
    </>
  );
}
