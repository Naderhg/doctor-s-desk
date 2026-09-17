import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { AuthGate } from "@/components/auth-gate";
import { ApiError } from "@/lib/api";
import { cancelAppointment, getAppointments, getNotifications, type Appointment } from "@/lib/patient";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      { title: "مواعيدي — عيادة د. كريم النجار" },
      { name: "description", content: "مواعيدك القادمة والسابقة، مع إمكانية التأجيل أو الإلغاء ورابط مكالمة الفيديو." },
      { property: "og:title", content: "مواعيدي — عيادة د. كريم النجار" },
      { property: "og:description", content: "تابع مواعيدك القادمة والسابقة وأدر التأجيل والإلغاء." },
    ],
  }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  return (
    <AuthGate>
      <AppointmentsContent />
    </AuthGate>
  );
}

function AppointmentsContent() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const queryClient = useQueryClient();
  const appts = useQuery({ queryKey: ["appointments"], queryFn: getAppointments });
  const notes = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const cancel = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const list = tab === "upcoming" ? (appts.data?.upcoming ?? []) : (appts.data?.past ?? []);

  return (
    <PageShell
      eyebrow="حسابي"
      title="مواعيدي"
      description="الإلغاء المجاني متاح قبل الموعد بـ ٢٤ ساعة. بعد ذلك يُخصم العربون."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 inline-grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted p-1 text-sm">
            <button
              onClick={() => setTab("upcoming")}
              className={`rounded-xl px-5 py-2 font-semibold ${tab === "upcoming" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              القادمة
            </button>
            <button
              onClick={() => setTab("past")}
              className={`rounded-xl px-5 py-2 font-semibold ${tab === "past" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              السابقة
            </button>
          </div>

          {appts.isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
          {appts.error instanceof ApiError ? <p className="text-sm text-destructive">{appts.error.message}</p> : null}
          {!appts.isLoading && list.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مواعيد في هذه القائمة.</p> : null}

          <div className="space-y-3">
            {list.map((a) => (
              <AppointmentCard
                key={a.id}
                a={a}
                upcoming={tab === "upcoming"}
                onCancel={() => cancel.mutate(a.id)}
                cancelling={cancel.isPending}
                cancelError={cancel.error instanceof ApiError ? cancel.error.message : null}
              />
            ))}
          </div>
        </div>

        <aside className="glass h-fit rounded-3xl p-6">
          <h2 className="font-display text-lg">الإشعارات</h2>
          <ul className="mt-4 space-y-3">
            {(notes.data?.notifications ?? []).map((n) => (
              <li key={n.id} className="glass-soft rounded-2xl p-4">
                <p className={`text-sm ${n.unread ? "font-semibold" : "text-muted-foreground"}`}>{n.text}</p>
                <p className="mt-1 text-xs text-subtle">{n.time}</p>
              </li>
            ))}
            {!notes.isLoading && (notes.data?.notifications ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">لا توجد إشعارات بعد.</li>
            ) : null}
          </ul>
          <Link to="/booking" className="btn-primary mt-5 block px-5 py-3 text-center">
            حجز موعد جديد
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}

function AppointmentCard({
  a,
  upcoming,
  onCancel,
  cancelling,
  cancelError,
}: {
  a: Appointment;
  upcoming: boolean;
  onCancel: () => void;
  cancelling: boolean;
  cancelError: string | null;
}) {
  return (
    <article className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg">
            {a.dayLabel} {a.date} · {a.time}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {a.type} — {a.reason || "بدون سبب مكتوب"}
          </p>
        </div>
        <span className="chip">{a.status}</span>
      </div>
      {upcoming ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/booking" search={{ type: a.visitSlug }} className="btn-ghost px-4 py-2 text-sm">
            تأجيل
          </Link>
          <button className="btn-ghost px-4 py-2 text-sm" onClick={onCancel} disabled={cancelling}>
            {cancelling ? "جارٍ الإلغاء..." : "إلغاء"}
          </button>
          {a.video ? (
            <button className="btn-primary px-4 py-2 text-sm" disabled>
              رابط المكالمة يظهر وقت الموعد
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/prescriptions" className="btn-ghost px-4 py-2 text-sm">
            عرض الروشتة
          </Link>
          <Link to="/booking" className="btn-ghost px-4 py-2 text-sm">
            حجز متابعة
          </Link>
        </div>
      )}
      {cancelError ? <p className="mt-3 text-xs text-destructive">{cancelError}</p> : null}
    </article>
  );
}
