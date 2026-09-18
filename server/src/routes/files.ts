import { Router } from "express";
import path from "node:path";
import { createReadStream, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { attachments } from "../db/schema.js";
import { sendError } from "../lib/http.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");

router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const [file] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, req.params.id))
      .limit(1);
    if (!file) {
      sendError(res, 404, "الملف غير موجود");
      return;
    }

    if (req.user!.role === "patient" && file.userId !== req.user!.id) {
      sendError(res, 403, "غير مصرح");
      return;
    }

    const filePath = path.join(uploadsDir, file.storedName);
    if (!existsSync(filePath)) {
      sendError(res, 404, "الملف غير موجود على الخادم");
      return;
    }

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
    createReadStream(filePath).pipe(res);
  } catch (error) {
    sendError(res, 500, "خطأ في جلب الملف");
  }
});

export default router;
