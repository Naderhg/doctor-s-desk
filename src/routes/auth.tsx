import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const nextUser =
        mode === "login"
          ? await login({ email, password })
          : await signup({ name, email, phone, password });
      const dest =
        nextUser.role === "patient" ? "/appointments" :
        nextUser.role === "admin" ? "/admin" :
        nextUser.role === "receptionist" ? "/front-desk" :
        nextUser.role === "cashier" ? "/billing" :
        "/doctor";
      await navigate({ to: dest });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إكمال الطلب");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="relative z-10 grid place-items-center px-4 pb-16 pt-4 sm:px-8">
      <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-8">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-xl py-2 font-semibold transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            دخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`rounded-xl py-2 font-semibold transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            حساب جديد
          </button>
        </div>

        <h1 className="font-display text-2xl">{mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? "ادخل لمتابعة مواعيدك وملفك الطبي." : "خطوة واحدة قبل حجز أول موعد."}
        </p>

        {user ? (
          <p className="mt-4 rounded-xl bg-primary/10 px-3 py-2 text-sm">أنت مسجّل كـ {user.name}</p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === "signup" ? (
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">الاسم بالكامل</label>
              <input
                className="field"
                placeholder="مثال: أحمد سمير"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">البريد الإلكتروني</label>
            <input
              className="field"
              type="email"
              placeholder="name@example.com"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {mode === "signup" ? (
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">رقم الموبايل</label>
              <input
                className="field"
                placeholder="01000000000"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">كلمة المرور</label>
            <input
              className="field"
              type="password"
              placeholder="••••••••"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : 1}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button type="submit" className="btn-primary w-full py-3.5" disabled={pending}>
            {pending ? "جارٍ التنفيذ..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>
      </div>
    </section>
  );
}
