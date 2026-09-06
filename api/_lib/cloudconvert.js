const CLOUDCONVERT_API = "https://api.cloudconvert.com/v2";

// Скільки разів і як часто опитувати статус завдання CloudConvert.
// 20 × 1.2с ≈ 24с — вкладається у ліміт виконання serverless-функції
// (див. functions.maxDuration у vercel.json).
const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 1200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Конвертує DOC/DOCX (Buffer) у PDF (Buffer) через CloudConvert.
 * Кидає Error з людяним повідомленням у разі невдачі.
 */
export async function convertDocxToPdf(fileBuffer, filename) {
  return convertViaCloudConvert(fileBuffer, filename, "pdf");
}

/**
 * Конвертує PDF (Buffer) у DOCX (Buffer) через CloudConvert.
 * Кидає Error з людяним повідомленням у разі невдачі.
 */
export async function convertPdfToDocx(fileBuffer, filename) {
  return convertViaCloudConvert(fileBuffer, filename, "docx");
}

/**
 * Спільна логіка створення job/опитування статусу/завантаження результату
 * для CloudConvert — використовується і для docx→pdf, і для pdf→docx,
 * різниться лише output_format.
 */
async function convertViaCloudConvert(fileBuffer, filename, outputFormat) {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CLOUDCONVERT_API_KEY не налаштований на сервері. Зверніться до адміністратора."
    );
  }

  const authHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // 1. Створюємо job: імпорт файлу (base64) → конвертація → експорт у URL
  const createJobRes = await fetch(`${CLOUDCONVERT_API}/jobs`, {
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
  });

  if (!createJobRes.ok) {
    const errText = await createJobRes.text().catch(() => "");
    console.error("CloudConvert create job failed:", createJobRes.status, errText);
    throw new Error("Не вдалося створити завдання конвертації.");
  }

  const createJobData = await createJobRes.json();
  const jobId = createJobData?.data?.id;
  if (!jobId) {
    throw new Error("CloudConvert не повернув ID завдання.");
  }

  // 2. Опитуємо статус, поки job не завершиться (успішно чи з помилкою)
  let exportTask = null;

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const statusRes = await fetch(
      `${CLOUDCONVERT_API}/jobs/${jobId}?include=tasks`,
      { headers: authHeaders }
    );

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();
    const job = statusData?.data;
    const tasks = job?.tasks || [];

    const errored = tasks.find((task) => task.status === "error");
    if (errored) {
      throw new Error(
        `Помилка конвертації: ${errored.message || "невідома помилка CloudConvert"}`
      );
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
    throw new Error(
      "Конвертація триває занадто довго. Спробуйте, будь ласка, ще раз."
    );
  }

  const fileUrl = exportTask.result?.files?.[0]?.url;
  if (!fileUrl) {
    throw new Error("CloudConvert не повернув посилання на готовий файл.");
  }

  // 3. Завантажуємо готовий PDF і повертаємо як Buffer
  const pdfRes = await fetch(fileUrl);
  if (!pdfRes.ok) {
    throw new Error("Не вдалося завантажити готовий PDF.");
  }

  const arrayBuffer = await pdfRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
