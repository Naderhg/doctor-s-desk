import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — عيادة د. كريم النجار" },
      { name: "description", content: "سجّل دخولك أو أنشئ حساباً لحجز المواعيد ومتابعة ملفك الطبي." },
      { property: "og:title", content: "تسجيل الدخول — عيادة د. كريم النجار" },
      { property: "og:description", content: "حساب واحد لحجز المواعيد ومتابعة الروشتات والملف الطبي." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <section className="relative z-10 grid place-items-center px-4 pb-16 pt-4 sm:px-8">
      <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-8">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted p-1 text-sm">
          <button
            onClick={() => setMode("login")}
            className={`rounded-xl py-2 font-semibold transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            دخول
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-xl py-2 font-semibold transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            حساب جديد
          </button>
        </div>

        <h1 className="font-display text-2xl">{mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? "ادخل لمتابعة مواعيدك وملفك الطبي." : "خطوة واحدة قبل حجز أول موعد."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {mode === "signup" ? (
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">الاسم بالكامل</label>
              <input className="field" placeholder="مثال: أحمد سمير" />
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">البريد الإلكتروني</label>
            <input className="field" type="email" placeholder="name@example.com" dir="ltr" />
          </div>
          {mode === "signup" ? (
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">رقم الموبايل</label>
              <input className="field" placeholder="٠١٠٠٠٠٠٠٠٠٠" dir="ltr" />
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">كلمة المرور</label>
            <input className="field" type="password" placeholder="••••••••" dir="ltr" />
          </div>
          <button type="submit" className="btn-primary w-full py-3.5">
            {mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-subtle">
          <span className="h-px flex-1 bg-border" />
          أو
          <span className="h-px flex-1 bg-border" />
        </div>

        <button type="button" className="btn-ghost w-full py-3.5">
          المتابعة باستخدام Google
        </button>

        <p className="mt-5 text-center text-xs text-subtle">
          هذه واجهة تجريبية — التسجيل الفعلي يُفعّل لاحقاً.
        </p>
      </div>
    </section>
  );
}
