import { checkAndConsumeUsage } from "./_lib/usageLimit.js";
import { convertDocxToPdf } from "./_lib/cloudconvert.js";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB — узгоджено з лімітом тіла запиту Vercel

// Vercel парсить req.body автоматично лише для відомих Content-Type
// (json/urlencoded/text). Для довільних бінарних типів (docx, application/
// octet-stream тощо) req.body НЕ гарантовано заповнюється — тому читаємо
// тіло запиту напряму з потоку.
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // 1. Перевіряємо й списуємо денний ліміт ДО важкої роботи з CloudConvert —
    //    щоб не витрачати платні конвертації на запити, які все одно відхилимо.
    const usage = await checkAndConsumeUsage(req);
    if (!usage.allowed) {
      res.status(429).json({
        error: "LIMIT_REACHED",
        isGuest: usage.isGuest,
        remaining: 0,
      });
      return;
    }

    // 2. Дістаємо файл із тіла запиту (читаємо потік напряму, див. коментар
    //    до readRawBody вище — req.body тут ненадійний для docx/бінарних
    //    типів).
    const fileBuffer = await readRawBody(req);

    if (!fileBuffer.length) {
      res.status(400).json({ error: "Порожній файл." });
      return;
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      res.status(400).json({
        error: `Файл занадто великий. Максимум ${(
          MAX_FILE_SIZE /
          1024 /
          1024
        ).toFixed(0)}МБ.`,
      });
      return;
    }

    const rawFilename = req.headers["x-filename"];
    const filename = rawFilename
      ? decodeURIComponent(rawFilename)
      : "document.docx";

    // 3. Конвертуємо через CloudConvert
    const pdfBuffer = await convertDocxToPdf(fileBuffer, filename);

    res.setHeader("Content-Type", "application/pdf");
    if (usage.remaining !== null) {
      res.setHeader("X-Remaining-Conversions", String(usage.remaining));
    }
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("word-to-pdf error:", error);
    res.status(500).json({
      error: error?.message || "Не вдалося конвертувати файл. Спробуйте пізніше.",
    });
  }
}
