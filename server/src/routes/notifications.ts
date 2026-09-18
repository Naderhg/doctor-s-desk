import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { relativeTimeAr } from "../lib/format.js";
import { handleError, sendError } from "../lib/http.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user!.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
    res.json({
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        text: n.text,
        metadata: n.metadata,
        unread: !n.read,
        time: relativeTimeAr(n.createdAt),
      })),
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/unread-count", async (req: AuthedRequest, res) => {
  try {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(sql`${notifications.userId} = ${req.user!.id} and ${notifications.read} = false`);
    res.json({ count: row?.n ?? 0 });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/:id/read", async (req: AuthedRequest, res) => {
  try {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, req.params.id))
      .returning();
    if (!updated) {
      sendError(res, 404, "الإشعار غير موجود");
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/read-all", async (req: AuthedRequest, res) => {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, req.user!.id));
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
