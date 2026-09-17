import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { clinicSettings, prescriptionItems, prescriptions, prescriptionTests } from "../db/schema.js";
import { formatDateTimeAr } from "../lib/format.js";
import { handleError } from "../lib/http.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("patient"));

router.get("/", async (req: AuthedRequest, res) => {
  try {
    const [clinic] = await db.select().from(clinicSettings).limit(1);
    const rows = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, req.user!.id))
      .orderBy(desc(prescriptions.createdAt));

    const result = [];
    for (const rx of rows) {
      const items = await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, rx.id));
      const tests = await db.select().from(prescriptionTests).where(eq(prescriptionTests.prescriptionId, rx.id));
      result.push({
        id: rx.id,
        date: formatDateTimeAr(rx.createdAt),
        diagnosis: rx.diagnosis,
        doctorName: clinic?.doctorName ?? "",
        items: items.map((i) => ({ drug: i.drug, dose: i.dose, duration: i.duration })),
        tests: tests.map((t) => t.name),
      });
    }
    res.json({ prescriptions: result });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
