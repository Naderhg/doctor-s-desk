import type { Response } from "express";
import { ZodError } from "zod";

export function publicUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "patient" | "doctor";
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message ?? "بيانات غير صالحة";
    return sendError(res, 400, first);
  }
  if (typeof error === "object" && error && "status" in error && typeof error.status === "number") {
    return sendError(res, error.status, error instanceof Error ? error.message : "حدث خطأ");
  }
  console.error(error);
  const pgCode = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (pgCode === "42P01") {
    return sendError(res, 500, "جدول المستخدمين غير موجود. شغّل npm run db:push داخل server/");
  }
  if (pgCode === "ECONNREFUSED" || (error instanceof Error && error.message.includes("ECONNREFUSED"))) {
    return sendError(res, 500, "تعذّر الاتصال بقاعدة البيانات. شغّل docker compose up -d");
  }
  const detail = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
  return sendError(res, 500, process.env.NODE_ENV === "production" ? "حدث خطأ غير متوقع" : detail);
}
