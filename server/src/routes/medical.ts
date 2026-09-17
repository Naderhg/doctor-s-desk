import { Router, type Request } from "express";
import { desc, eq } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { db } from "../db/index.js";
import { appointments, attachments, medicalProfiles, visitTypes } from "../db/schema.js";
import { formatDateAr, formatFileSize } from "../lib/format.js";
import { handleError, sendError } from "../lib/http.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("patient"));

const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const ext = path.extname(file.originalname).slice(0, 10);
      cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const profileSchema = z.object({
  ageYears: z.number().int().min(1).max(120).nullable().optional(),
  gender: z.string().trim().max(20).nullable().optional(),
  bloodType: z.string().trim().max(8).nullable().optional(),
  chronic: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});

router.get("/", async (req: AuthedRequest, res) => {
  try {
    const [profile] = await db.select().from(medicalProfiles).where(eq(medicalProfiles.userId, req.user!.id)).limit(1);
    const files = await db
      .select()
      .from(attachments)
      .where(eq(attachments.userId, req.user!.id))
      .orderBy(desc(attachments.createdAt));
    const history = await db
      .select({ appointment: appointments, visit: visitTypes })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .where(eq(appointments.patientId, req.user!.id))
      .orderBy(desc(appointments.startsAt));

    res.json({
      profile: {
        ageYears: profile?.ageYears ?? null,
        gender: profile?.gender ?? null,
        bloodType: profile?.bloodType ?? null,
        chronic: profile?.chronic ?? [],
        allergies: profile?.allergies ?? [],
        medications: profile?.medications ?? [],
      },
      attachments: files.map((f) => ({
        id: f.id,
        name: f.name,
        date: formatDateAr(f.createdAt),
        size: formatFileSize(f.sizeBytes),
      })),
      visits: history.map((r) => ({
        id: r.appointment.id,
        date: formatDateAr(new Date(r.appointment.startsAt)),
        type: r.visit.label,
        reason: r.appointment.reason,
        status: r.appointment.status,
      })),
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/", async (req: AuthedRequest, res) => {
  try {
    const body = profileSchema.parse(req.body);
    const values = {
      userId: req.user!.id,
      ageYears: body.ageYears ?? null,
      gender: body.gender ?? null,
      bloodType: body.bloodType ?? null,
      chronic: body.chronic ?? [],
      allergies: body.allergies ?? [],
      medications: body.medications ?? [],
      updatedAt: new Date(),
    };
    await db.insert(medicalProfiles).values(values).onConflictDoUpdate({
      target: medicalProfiles.userId,
      set: {
        ageYears: values.ageYears,
        gender: values.gender,
        bloodType: values.bloodType,
        chronic: values.chronic,
        allergies: values.allergies,
        medications: values.medications,
        updatedAt: values.updatedAt,
      },
    });
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/attachments", upload.single("file"), async (req: AuthedRequest, res) => {
  try {
    const uploaded = (req as AuthedRequest & { file?: Express.Multer.File }).file;
    if (!uploaded) {
      sendError(res, 400, "اختر ملفاً");
      return;
    }
    const [file] = await db
      .insert(attachments)
      .values({
        userId: req.user!.id,
        name: uploaded.originalname,
        mimeType: uploaded.mimetype,
        sizeBytes: uploaded.size,
        storedName: uploaded.filename,
      })
      .returning();
    res.status(201).json({
      attachment: {
        id: file!.id,
        name: file!.name,
        date: formatDateAr(file!.createdAt),
        size: formatFileSize(file!.sizeBytes),
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
