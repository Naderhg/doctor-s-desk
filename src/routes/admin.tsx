import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/page-shell";
import { AuthGate } from "@/components/auth-gate";
import { ApiError } from "@/lib/api";
import { listUsers, createUser, deleteUser, type AdminUser } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — عيادة د. كريم النجار" },
      { name: "description", content: "إدارة المستخدمين: إضافة وحذف أطباء وموظفي استقبال." },
    ],
  }),
  component: AdminPage,
});

const roleLabels: Record<string, string> = {
  admin: "مدير",
  doctor: "طبيب",
  receptionist: "استقبال",
  patient: "مريض",
};

function AdminPage() {
  return (
    <AuthGate>
      <RoleGate>
        <AdminContent />
      </RoleGate>
    </AuthGate>
  );
}

function RoleGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return (
      <PageShell title="غير مصرح" description="هذه الصفحة للمدير فقط">
        <p className="text-sm text-muted-foreground">لا تملك صلاحية الوصول لهذه الصفحة.</p>
      </PageShell>
    );
  }
  return children;
}

function AdminContent() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const [showForm, setShowForm] = useState(false);

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowForm(false);
    },
  });

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return (
    <PageShell eyebrow="لوحة الإدارة" title="إدارة المستخدمين" description="إضافة وحذف الأطباء وموظفي الاستقبال">
      <div className="mb-4">
        <button
          className="btn-primary px-4 py-2.5 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "إغلاق" : "+ إضافة مستخدم"}
        </button>
      </div>

      {showForm ? (
        <CreateUserForm
          pending={create.isPending}
          error={create.error instanceof ApiError ? create.error.message : null}
          onSubmit={(data) => create.mutate(data)}
        />
      ) : null}

      {users.isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
      {users.error instanceof ApiError ? <p className="text-sm text-destructive">{users.error.message}</p> : null}

      <div className="mt-6 space-y-3">
        {(users.data?.users ?? []).filter((u) => u.role !== "patient").length === 0 && !users.isLoading ? (
          <p className="text-sm text-muted-foreground">لا يوجد مستخدمون من الموظفين بعد.</p>
        ) : null}
        {(users.data?.users ?? []).filter((u) => u.role !== "patient").map((u) => (
          <UserRow
            key={u.id}
            user={u}
            onDelete={() => remove.mutate(u.id)}
            deleting={remove.isPending}
          />
        ))}
      </div>
    </PageShell>
  );
}

function CreateUserForm({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (data: { name: string; email: string; phone: string; password: string; role: "doctor" | "receptionist" | "admin" }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"doctor" | "receptionist" | "admin">("doctor");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, email, phone, password, role });
  }

  return (
    <form onSubmit={submit} className="glass mb-6 rounded-3xl p-6">
      <h3 className="mb-4 font-display text-lg">مستخدم جديد</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">الاسم</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثال: د. أحمد" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">البريد الإلكتروني</label>
          <input className="field" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">رقم الموبايل</label>
          <input className="field" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="01000000000" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">كلمة المرور</label>
          <input className="field" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">الدور</label>
          <select className="field" value={role} onChange={(e) => setRole(e.target.value as "doctor" | "receptionist" | "admin")}>
            <option value="doctor">طبيب</option>
            <option value="receptionist">استقبال</option>
            <option value="admin">مدير</option>
          </select>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <button type="submit" className="btn-primary mt-4 px-5 py-2.5 text-sm" disabled={pending}>
        {pending ? "جارٍ الإضافة..." : "إضافة المستخدم"}
      </button>
    </form>
  );
}

function UserRow({ user, onDelete, deleting }: { user: AdminUser; onDelete: () => void; deleting: boolean }) {
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.id === user.id;

  return (
    <article className="glass flex items-center justify-between gap-3 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
          {user.name.charAt(0)}
        </span>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">{user.email} · {user.phone ?? "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="chip">{roleLabels[user.role] ?? user.role}</span>
        {!isSelf ? (
          <button
            className="rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "..." : "حذف"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
