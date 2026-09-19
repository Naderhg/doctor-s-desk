import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { handleError, publicUser, sendError } from "../lib/http.js";
import { signToken, type UserRole } from "../lib/jwt.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(120),
  email: z.string().trim().email("بريد غير صالح").toLowerCase(),
  phone: z.string().trim().min(8, "رقم الموبايل غير صالح").max(30),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن ٨ أحرف"),
});

const loginSchema = z.object({
  email: z.string().trim().email("بريد غير صالح").toLowerCase(),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(120),
  email: z.string().trim().email("بريد غير صالح").toLowerCase(),
  phone: z.string().trim().min(8, "رقم الموبايل غير صالح").max(30),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن ٨ أحرف"),
  role: z.enum(["doctor", "receptionist", "admin"]),
  assignedDoctorId: z.string().uuid().optional().nullable(),
});

function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

router.post("/signup", async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing) {
      sendError(res, 409, "هذا البريد مسجّل بالفعل");
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: "patient",
      })
      .returning();

    if (!user) {
      sendError(res, 500, "تعذّر إنشاء الحساب");
      return;
    }

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user) {
      sendError(res, 401, "البريد أو كلمة المرور غير صحيحة");
      return;
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      sendError(res, 401, "البريد أو كلمة المرور غير صحيحة");
      return;
    }

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: { ...req.user, assignedDoctorId: req.user.assignedDoctorId } });
});

// ─── Admin: user management ───

router.get("/users", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const rows = await db.select().from(users).orderBy(users.createdAt);
    res.json({ users: rows.map((u) => ({ ...publicUser(u), assignedDoctorId: u.assignedDoctorId })) });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/doctors", requireAuth, requireRole("admin", "doctor", "receptionist"), async (_req, res) => {
  try {
    const rows = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "doctor")).orderBy(users.name);
    res.json({ doctors: rows });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const body = createUserSchema.parse(req.body);
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing) {
      sendError(res, 409, "هذا البريد مسجّل بالفعل");
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: body.role as UserRole,
        assignedDoctorId: body.role === "receptionist" ? body.assignedDoctorId ?? null : null,
      })
      .returning();
    if (!user) {
      sendError(res, 500, "تعذّر إنشاء الحساب");
      return;
    }
    res.status(201).json({ user: { ...publicUser(user), assignedDoctorId: user.assignedDoctorId } });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (!user) {
      sendError(res, 404, "المستخدم غير موجود");
      return;
    }
    if (user.role === "patient") {
      sendError(res, 400, "لا يمكن حذف حساب مريض من هنا");
      return;
    }
    await db.delete(users).where(eq(users.id, req.params.id));
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
