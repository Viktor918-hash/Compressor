import { getR2Config, sweepExpired } from "../_lib/r2.js";

/**
 * GET /api/share/cleanup — щоденний Vercel Cron (vercel.json → crons).
 * Vercel сам надсилає Authorization: Bearer <CRON_SECRET>, якщо змінна
 * CRON_SECRET задана в проєкті; без неї ендпоінт закритий (401) — щоб
 * ніхто сторонній не смикав масове прибирання.
 * Додатково те саме прибирання принагідно робить /api/share/create.
 */
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = (req.headers?.authorization || req.headers?.Authorization || "").trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  const cfg = getR2Config();
  if (!cfg) {
    res.status(503).json({ error: "SHARE_UNAVAILABLE" });
    return;
  }
  try {
    const deleted = await sweepExpired(cfg, { maxDelete: 1000 });
    res.status(200).json({ deleted });
  } catch (error) {
    console.error("share/cleanup error:", error);
    res.status(500).json({ error: "CLEANUP_FAILED" });
  }
}
