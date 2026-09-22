import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/page-shell";
import { AuthGate } from "@/components/auth-gate";
import { ApiError } from "@/lib/api";
import {
  addInvoiceItem,
  addPayment,
  getInvoice,
  getServices,
  listInvoices,
  removeInvoiceItem,
  type InvoiceSummary,
} from "@/lib/hospital";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "الحسابات والخزينة — المستشفى" },
      { name: "description", content: "متابعة حسابات المرضى المفتوحة، إضافة البنود، وتحصيل المدفوعات." },
    ],
  }),
  component: BillingPage,
});

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  partially_paid: "سداد جزئي",
  paid: "مسدد",
  cancelled: "ملغي",
};

const statusColors: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600",
  partially_paid: "bg-blue-500/15 text-blue-600",
  paid: "bg-emerald-500/15 text-emerald-600",
  cancelled: "bg-muted text-muted-foreground",
};

function BillingPage() {
  return (
    <AuthGate>
      <RoleGate>
        <BillingContent />
      </RoleGate>
    </AuthGate>
  );
}

function RoleGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !["cashier", "admin", "receptionist"].includes(user.role)) {
    return (
      <PageShell title="غير مصرح" description="هذه الصفحة للحسابات والإدارة فقط">
        <p className="text-sm text-muted-foreground">لا تملك صلاحية الوصول لهذه الصفحة.</p>
      </PageShell>
    );
  }
  return children;
}

function BillingContent() {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const invoices = useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: () => listInvoices(statusFilter || undefined),
    refetchInterval: 15000,
  });

  return (
    <PageShell
      eyebrow="الحسابات"
      title="حسابات المرضى"
      description="كل دخول في الاستعلامات يفتح حساباً هنا تلقائياً — أضف البنود وحصّل المدفوعات"
    >
      <div className="mb-4 flex gap-1.5">
        {[
          { v: "open", l: "مفتوحة" },
          { v: "partially_paid", l: "سداد جزئي" },
          { v: "paid", l: "مسددة" },
          { v: "", l: "الكل" },
        ].map((f) => (
          <button
            key={f.v}
            className={`chip cursor-pointer ${statusFilter === f.v ? "bg-primary/20 font-semibold" : ""}`}
            onClick={() => setStatusFilter(f.v)}
          >
            {f.l}
          </button>
        ))}
      </div>

      {invoices.isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
      {invoices.error instanceof ApiError ? <p className="text-sm text-destructive">{invoices.error.message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {(invoices.data?.invoices ?? []).length === 0 && !invoices.isLoading ? (
            <p className="text-sm text-muted-foreground">لا توجد فواتير بهذه الحالة.</p>
          ) : null}
          {(invoices.data?.invoices ?? []).map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              selected={selectedId === inv.id}
              onSelect={() => setSelectedId(inv.id)}
            />
          ))}
        </div>

        <div>
          {selectedId ? (
            <InvoiceDetail invoiceId={selectedId} />
          ) : (
            <div className="glass grid place-items-center rounded-3xl p-10 text-sm text-muted-foreground">
              اختر فاتورة لعرض التفاصيل
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function InvoiceCard({ invoice, selected, onSelect }: { invoice: InvoiceSummary; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`glass w-full rounded-2xl p-4 text-right transition-colors ${selected ? "ring-2 ring-primary" : "hover:bg-primary/5"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{invoice.patientName}</p>
        <span className={`chip ${statusColors[invoice.status] ?? ""}`}>{statusLabels[invoice.status]}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
        {invoice.mrn} · {invoice.departmentLabel}
      </p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          الإجمالي: <b className="text-foreground">{invoice.total} ج</b>
        </span>
        <span className={invoice.remaining > 0 ? "text-destructive" : "text-emerald-600"}>
          المتبقي: {invoice.remaining} ج
        </span>
      </div>
    </button>
  );
}

function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCollect = user?.role === "cashier" || user?.role === "admin";

  const detail = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => getInvoice(invoiceId),
    refetchInterval: 10000,
  });
  const services = useQuery({ queryKey: ["services"], queryFn: getServices });

  const [serviceId, setServiceId] = useState("");
  const [qty, setQty] = useState(1);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "insurance" | "transfer">("cash");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const addItem = useMutation({
    mutationFn: () => addInvoiceItem(invoiceId, { serviceId, quantity: qty }),
    onSuccess: () => {
      setServiceId("");
      setQty(1);
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "تعذّر إضافة البند"),
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => removeInvoiceItem(invoiceId, itemId),
    onSuccess: invalidate,
  });

  const pay = useMutation({
    mutationFn: () => addPayment(invoiceId, { amount: Number(payAmount), method: payMethod }),
    onSuccess: () => {
      setPayAmount("");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "تعذّر تسجيل الدفع"),
  });

  function submitPayment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    pay.mutate();
  }

  const inv = detail.data?.invoice;
  if (detail.isLoading) return <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>;
  if (!inv) return null;

  const closed = inv.status === "paid" || inv.status === "cancelled";

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg">{inv.patientName}</h3>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {inv.mrn} · {inv.departmentLabel}
          </p>
        </div>
        <span className={`chip ${statusColors[inv.status] ?? ""}`}>{statusLabels[inv.status]}</span>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-1.5">
        {(detail.data?.items ?? []).map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
            <span>
              {item.description} <span className="text-xs text-muted-foreground">× {item.quantity}</span>
            </span>
            <span className="flex items-center gap-2">
              <b>{item.lineTotal} ج</b>
              {!closed ? (
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() => removeItem.mutate(item.id)}
                  disabled={removeItem.isPending}
                >
                  حذف
                </button>
              ) : null}
            </span>
          </div>
        ))}
        {(detail.data?.items ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">لا توجد بنود بعد — أضف من الكتالوج أدناه.</p>
        ) : null}
      </div>

      {/* Add item */}
      {!closed ? (
        <div className="mb-4 flex gap-2">
          <select className="field flex-1" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">اختر خدمة من الكتالوج...</option>
            {(services.data?.services ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.price} ج
              </option>
            ))}
          </select>
          <input
            className="field w-20"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          />
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            disabled={!serviceId || addItem.isPending}
            onClick={() => addItem.mutate()}
          >
            إضافة
          </button>
        </div>
      ) : null}

      {/* Totals */}
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted/40 p-4 text-center text-sm">
        <div>
          <p className="text-xs text-muted-foreground">الإجمالي</p>
          <p className="font-display text-lg font-bold">{inv.total} ج</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">المدفوع</p>
          <p className="font-display text-lg font-bold text-emerald-600">{inv.paid} ج</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">المتبقي</p>
          <p className={`font-display text-lg font-bold ${inv.remaining > 0 ? "text-destructive" : "text-emerald-600"}`}>
            {inv.remaining} ج
          </p>
        </div>
      </div>

      {/* Payments history */}
      {(detail.data?.payments ?? []).length > 0 ? (
        <div className="mb-4 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">المدفوعات</p>
          {(detail.data?.payments ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
              <span>
                {p.methodLabel} · {p.time}
              </span>
              <b className="text-emerald-600">{p.amount} ج</b>
            </div>
          ))}
        </div>
      ) : null}

      {/* Collect payment */}
      {canCollect && inv.remaining > 0 && !closed ? (
        <form onSubmit={submitPayment} className="flex gap-2">
          <input
            className="field flex-1"
            type="number"
            min={1}
            max={inv.remaining}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder={`المبلغ (حتى ${inv.remaining} ج)`}
            required
          />
          <select className="field w-28" value={payMethod} onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}>
            <option value="cash">نقدي</option>
            <option value="card">بطاقة</option>
            <option value="insurance">تأمين</option>
            <option value="transfer">تحويل</option>
          </select>
          <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={pay.isPending}>
            {pay.isPending ? "..." : "تحصيل"}
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
