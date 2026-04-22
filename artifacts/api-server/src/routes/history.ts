import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, downloadHistoryTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/history", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "UNAUTHENTICATED", message: "Sign in to view history." });
  }
  const page = Math.max(1, Number(req.query["page"] ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query["pageSize"] ?? 20)));
  const offset = (page - 1) * pageSize;

  const items = await db
    .select()
    .from(downloadHistoryTable)
    .where(eq(downloadHistoryTable.userId, req.session.userId))
    .orderBy(desc(downloadHistoryTable.downloadedAt))
    .limit(pageSize)
    .offset(offset);

  const totalRow = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(downloadHistoryTable)
    .where(eq(downloadHistoryTable.userId, req.session.userId));
  const total = totalRow[0]?.count ?? 0;

  return res.json({
    items: items.map((it) => ({
      id: it.id,
      platform: it.platform,
      originalUrl: it.originalUrl,
      videoTitle: it.videoTitle,
      thumbnailUrl: it.thumbnailUrl,
      duration: it.duration,
      format: it.format,
      quality: it.quality,
      fileSize: it.fileSize,
      downloadedAt: it.downloadedAt.toISOString(),
      status: it.status,
    })),
    total,
    page,
    pageSize,
  });
});

router.delete("/history/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "UNAUTHENTICATED", message: "Sign in required." });
  }
  const id = req.params["id"];
  if (!id) return res.status(400).json({ error: "BAD_REQUEST", message: "Missing id." });
  await db
    .delete(downloadHistoryTable)
    .where(and(eq(downloadHistoryTable.id, id), eq(downloadHistoryTable.userId, req.session.userId)));
  return res.json({ success: true });
});

export default router;
