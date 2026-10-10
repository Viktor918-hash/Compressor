import { cancelDirectUploadJob } from "../_lib/cloudconvert.js";

const JOB_ID_RE = /^[0-9a-f-]{10,100}$/i;

/**
 * POST /api/convert/cancel { jobId } — клієнт викликає це, коли користувач
 * скасовує конвертацію (кнопка "Скасувати" в Panel) під час очікування
 * статусу, щоб не платити CloudConvert за job, результат якого ніхто не
 * забере. Best-effort: завжди відповідає 204, навіть якщо скасування на
 * боці CloudConvert не вдалось (job просто стане "finished" непотрібним).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const jobId = typeof body.jobId === "string" ? body.jobId : "";

  if (JOB_ID_RE.test(jobId)) {
    await cancelDirectUploadJob(jobId).catch((err) => {
      console.error("convert/cancel error:", err);
    });
  }

  res.status(204).end();
}
