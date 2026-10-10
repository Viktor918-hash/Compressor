// Чиста логіка "Свій розмір" (МБ) для стиснення відео — без DOM/мережевих
// залежностей (той самий паттерн, що й CompressToSize/fitToTarget.js: вся
// математика в окремому файлі, щоб легко юніт-тестувати без браузера).
//
// CloudConvert підтверджено приймає лише video_codec/width/height для
// відео-convert-таска (api/_lib/cloudconvert.js::buildVideoConvertOptions) —
// параметр бітрейту/CRF офіційно не підтверджений, тож свідомо не
// вгадуємо його назву. "Цільовий розмір у МБ" тут — НЕ пряме керування
// бітрейтом на сервері, а оцінка на клієнті: яку роздільність попросити,
// щоб результат був близьким до бажаного розміру. Це завжди приблизно
// (контент із різною складністю стискається по-різному при тій самій
// роздільності) — текст про це показує CompressVideo.jsx (note.targetApprox).

// "Рекомендовано" — завжди безпечний дефолт: не більше 720p.
export const RECOMMENDED_MAX_HEIGHT = 720;

// Оцінка бітрейту аудіо-доріжки, яку CloudConvert лишає як є (ми не
// керуємо аудіо) — віднімаємо її з "бюджету" байтів, перш ніж рахувати,
// скільки лишається на відео-доріжку.
const AUDIO_BITRATE_RESERVE_BPS = 128_000;
// Не даємо відео-бітрейту впасти нижче цього (інакше картинка стане
// кашею) — у цьому разі просто не досягнемо цілі точно.
const MIN_VIDEO_BITRATE_BPS = 150_000;
// Ніколи не апскейлимо (масштаб > 1) і не стискаємо більш ніж у 10 разів
// за одну дію (нижче — вже не "стиснення", а втрата відео як такого).
const MIN_SCALE = 0.1;
const MAX_SCALE = 1;

/**
 * 1 МБ = 1 000 000 байт (та сама домовленість, що й toBytes() у
 * CompressToSize/compressToSize.js — узгоджено з тим, як рахує браузер/ОС).
 */
export function toVideoBytes(mb) {
  const n = Number(String(mb).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return Math.floor(n * 1_000_000);
}

/**
 * Перевіряє targetBytes (режим "Свій розмір") проти розміру файлу.
 * Повертає null, якщо все гаразд, інакше — Error з кодом BAD_TARGET
 * (некоректне число) або TARGET_TOO_LARGE (ціль ≥ розміру самого файлу —
 * вимога round 22: червоний текст про помилку в UI, див.
 * CompressVideo.jsx::processFile).
 */
export function validateCustomTarget(targetBytes, fileSize) {
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    return Object.assign(new Error("BAD_TARGET"), { code: "BAD_TARGET" });
  }
  if (targetBytes >= fileSize) {
    return Object.assign(new Error("TARGET_TOO_LARGE"), {
      code: "TARGET_TOO_LARGE",
      targetBytes,
      fileSize,
    });
  }
  return null;
}

/**
 * Оцінює, яку висоту кадру треба попросити в CloudConvert, щоб вкластись
 * у targetBytes. Рахує "бюджет" бітрейту відео-доріжки (цільові байти,
 * мінус аудіо, поділені на тривалість) і порівнює його з оціненим
 * бітрейтом оригіналу — масштабує роздільність пропорційно
 * (sqrt, бо розмір файлу приблизно пропорційний КІЛЬКОСТІ пікселів при
 * тій самій якості кодування, а не лінійно висоті).
 *
 * @param {{width:number, height:number, duration:number|null}} meta
 * @param {number} fileSize
 * @param {number} targetBytes
 * @returns {number} цільова висота (до округлення/парності — цим займається scaleToHeight)
 */
export function estimateHeightForTarget(meta, fileSize, targetBytes) {
  if (!meta.duration || meta.duration <= 0) {
    // Не знаємо тривалість (рідкий випадок) — не можемо порахувати
    // бітрейт, тож повертаємось до безпечного дефолту.
    return RECOMMENDED_MAX_HEIGHT;
  }

  const sourceBitrate = (fileSize * 8) / meta.duration;
  const targetBitrate = (targetBytes * 8) / meta.duration;

  const sourceVideoBitrate = Math.max(
    sourceBitrate - AUDIO_BITRATE_RESERVE_BPS,
    MIN_VIDEO_BITRATE_BPS
  );
  const targetVideoBitrate = Math.max(
    targetBitrate - AUDIO_BITRATE_RESERVE_BPS,
    MIN_VIDEO_BITRATE_BPS
  );

  const scale = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, targetVideoBitrate / sourceVideoBitrate)
  );

  return Math.round(meta.height * Math.sqrt(scale));
}
