import { api } from "./api";

export type NotifType =
  | "appointment_new"
  | "appointment_status"
  | "appointment_reminder"
  | "visit_new"
  | "prescription_new"
  | "attachment_new"
  | "medical_update"
  | "medication_reminder"
  | "system";

export type AppNotification = {
  id: string;
  type: NotifType;
  title: string;
  text: string;
  metadata: Record<string, string>;
  unread: boolean;
  time: string;
};

export function getNotifications() {
  return api<{ notifications: AppNotification[] }>("/notifications");
}

export function getUnreadCount() {
  return api<{ count: number }>("/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return api<{ ok: boolean }>(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return api<{ ok: boolean }>("/notifications/read-all", { method: "POST" });
}

export function getFileUrl(fileId: string) {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return `${API_URL}/files/${fileId}${token ? `?token=${token}` : ""}`;
}
