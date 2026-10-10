// Приймає звіти браузера про порушення Content-Security-Policy-Report-Only
// (report-uri у vercel.json). Нічого не зберігає й нікуди не передає —
// лише компактний рядок у console.log (видно в Vercel Function Logs), щоб
// за тиждень-два оцінити, чи політику можна звузити й зробити enforcing
// (правило 0.14). Тіло завжди мале (сам звіт), тож ліміт — лише
// запобіжник проти аномалій, не функціональна межа.
const MAX_BODY_BYTES = 64 * 1024;

async function readRawBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (total > maxBytes) break; // мовчки обрізаємо — це лише лог, не критичні дані
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  try {
    const raw = await readRawBody(req, MAX_BODY_BYTES);
    const text = raw.toString("utf8");
    const parsed = JSON.parse(text);
    // Браузери надсилають або { "csp-report": {...} } (старий формат),
    // або Reporting API v1 — масив { body, type, url }. Логуємо скорочено.
    const report = parsed?.["csp-report"] || parsed?.[0]?.body || parsed;
    console.log(
      "CSP report:",
      JSON.stringify({
        documentUri: report?.["document-uri"] || report?.documentURL,
        violatedDirective:
          report?.["violated-directive"] || report?.effectiveDirective,
        blockedUri: report?.["blocked-uri"] || report?.blockedURL,
      })
    );
  } catch (err) {
    console.error("csp-report parse error:", err?.message);
  }

  res.status(204).end();
}
