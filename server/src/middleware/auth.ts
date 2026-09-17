import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { verifyToken } from "../lib/jwt.js";
import { sendError } from "../lib/http.js";

export type AuthedRequest = Request & {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "patient" | "doctor";
  };
};

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer ?? req.cookies?.token;

  if (!token) {
    sendError(res, 401, "يلزم تسجيل الدخول");
    return;
  }

  try {
    const payload = verifyToken(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) {
      sendError(res, 401, "الحساب غير موجود");
      return;
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    next();
  } catch {
    sendError(res, 401, "جلسة غير صالحة");
  }
}

export function requireRole(role: "doctor" | "patient") {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendError(res, 401, "يلزم تسجيل الدخول");
      return;
    }
    if (req.user.role !== role) {
      sendError(res, 403, "غير مصرح لك بالوصول");
      return;
    }
    next();
  };
}
