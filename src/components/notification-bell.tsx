import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/notifications";

const typeIcon: Record<string, string> = {
  appointment_new: "📅",
  appointment_status: "🔄",
  appointment_reminder: "⏰",
  visit_new: "🏥",
  prescription_new: "💊",
  attachment_new: "📎",
  medical_update: "📋",
  medication_reminder: "⏰",
  system: "🔔",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const count = useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const list = useQuery({
    queryKey: ["notif-list"],
    queryFn: getNotifications,
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notif-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notif-list"] });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notif-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notif-list"] });
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = count.data?.count ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute left-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-display text-sm font-bold">الإشعارات</h3>
            {unread > 0 ? (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
              >
                تعليم الكل كمقروء
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {list.isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">جارٍ التحميل...</p>
            ) : (list.data?.notifications ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</p>
            ) : (
              <ul className="divide-y divide-border">
                {(list.data?.notifications ?? []).map((n: AppNotification) => (
                  <li
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                      n.unread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (n.unread) markRead.mutate(n.id);
                    }}
                  >
                    <span className="shrink-0 text-lg">{typeIcon[n.type] ?? "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.text}</p>
                      <p className="mt-1 text-[10px] text-subtle">{n.time}</p>
                    </div>
                    {n.unread ? (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
