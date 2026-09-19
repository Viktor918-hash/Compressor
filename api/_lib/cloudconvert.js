const CLOUDCONVERT_API = "https://api.cloudconvert.com/v2";

// Опитування статусу завдання CloudConvert. Загальний дедлайн має
// вкладатись у functions.maxDuration з vercel.json (там 60 с).
const POLL_INTERVAL_MS = 1200;
const POLL_DEADLINE_MS = 45_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Помилка з машинозчитуваним кодом. Текст (message) — лише для логів на
 * сервері; клієнту віддається код, а людяне повідомлення підставляє i18n
 * на фронтенді (див. errors.* у translation.json).
 */
export class ConvertError extends Error {
  constructor(code, message, status = 500) {
    super(message || code);
    this.code = code;
    this.status = status;
  }
}

/**
 * Конвертує DOC/DOCX (Buffer) у PDF (Buffer) через CloudConvert.
 */
export async function convertDocxToPdf(fileBuffer, filename) {
  return convertViaCloudConvert(fileBuffer, filename, "pdf");
}

/**
 * Конвертує PDF (Buffer) у DOCX (Buffer) через CloudConvert.
 */
export async function convertPdfToDocx(fileBuffer, filename) {
  return convertViaCloudConvert(fileBuffer, filename, "docx");
}

// fetch із таймаутом, щоб зависання CloudConvert не з'їдало весь maxDuration
async function timedFetch(url, options = {}, timeoutMs = 15_000) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      throw new ConvertError("CONVERSION_TIMEOUT", "CloudConvert request timed out", 504);
    }
    throw new ConvertError("CONVERSION_FAILED", `CloudConvert network error: ${err?.message}`, 502);
  }
}

// Best-effort: скасувати/видалити завдання, щоб воно не продовжувало
// коштувати після нашої помилки/таймауту.
function cancelJob(jobId, authHeaders) {
  return fetch(`${CLOUDCONVERT_API}/jobs/${jobId}`, {
    method: "DELETE",
    headers: authHeaders,
    signal: AbortSignal.timeout(5_000),
  }).catch(() => {});
}

/**
 * Спільна логіка створення job/опитування статусу/завантаження результату
 * для CloudConvert — використовується і для docx→pdf, і для pdf→docx,
 * різниться лише output_format.
 */
async function convertViaCloudConvert(fileBuffer, filename, outputFormat) {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) {
    throw new ConvertError(
      "SERVICE_UNAVAILABLE",
      "CLOUDCONVERT_API_KEY не налаштований на сервері",
      503
    );
  }

  const authHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // 1. Створюємо job: імпорт файлу (base64) → конвертація → експорт у URL
  const createJobRes = await timedFetch(
    `${CLOUDCONVERT_API}/jobs`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        tasks: {
          "import-file": {
            operation: "import/base64",
            file: fileBuffer.toString("base64"),
            filename,
          },
          "convert-file": {
            operation: "convert",
            input: "import-file",
            output_format: outputFormat,
          },
          "export-file": {
            operation: "export/url",
            input: "convert-file",
          },
        },
      }),
    },
    20_000
  );

  if (!createJobRes.ok) {
    const errText = await createJobRes.text().catch(() => "");
    console.error("CloudConvert create job failed:", createJobRes.status, errText);
    throw new ConvertError("CONVERSION_FAILED", "CloudConvert create job failed", 502);
  }

  const createJobData = await createJobRes.json();
  const jobId = createJobData?.data?.id;
  if (!jobId) {
    throw new ConvertError("CONVERSION_FAILED", "CloudConvert returned no job id", 502);
  }

  try {
    // 2. Опитуємо статус, поки job не завершиться (успішно чи з помилкою)
    let exportTask = null;
    const deadline = Date.now() + POLL_DEADLINE_MS;

    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);

      const statusRes = await timedFetch(
        `${CLOUDCONVERT_API}/jobs/${jobId}?include=tasks`,
        { headers: authHeaders },
        8_000
      );

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      const tasks = statusData?.data?.tasks || [];

      const errored = tasks.find((task) => task.status === "error");
      if (errored) {
        // Деталі — тільки в лог (можуть містити внутрішню інформацію).
        console.error(
          "CloudConvert task error:",
          errored.name,
          errored.code,
          errored.message
        );
        throw new ConvertError("CONVERSION_FAILED", "CloudConvert task error", 502);
      }

      const foundExport = tasks.find(
        (task) => task.name === "export-file" && task.status === "finished"
      );
      if (foundExport) {
        exportTask = foundExport;
        break;
      }
    }

    if (!exportTask) {
      throw new ConvertError("CONVERSION_TIMEOUT", "CloudConvert job timed out", 504);
    }

    const fileUrl = exportTask.result?.files?.[0]?.url;
    if (!fileUrl) {
      throw new ConvertError("CONVERSION_FAILED", "CloudConvert returned no file url", 502);
    }

    // 3. Завантажуємо готовий файл і повертаємо як Buffer
    const outRes = await timedFetch(fileUrl, {}, 20_000);
    if (!outRes.ok) {
      throw new ConvertError("CONVERSION_FAILED", "Result download failed", 502);
    }

    return Buffer.from(await outRes.arrayBuffer());
  } catch (err) {
    // Не залишаємо завдання «висіти» (і коштувати) після помилки/таймауту
    await cancelJob(jobId, authHeaders);
    throw err;
  }
}
