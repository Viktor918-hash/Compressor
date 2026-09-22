import { fitToTarget } from "./fitToTarget";
import { abortError, codedError, decodeImage } from "../../utils/decodeImage.js";

// Формати виходу. Прозорості немає в жодному з них: прозорі ділянки PNG/WebP
// заливаємо білим (як у конвертері в JPG), інакше вони стали б чорними.
export const OUTPUT_FORMATS = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  webp: { mime: "image/webp", ext: "webp" },
};

// Що саме зробила обробка (для підпису «було → стало, якість, роздільність»).
// Ключ — вихідний Blob; тримаємо слабке посилання, щоб не було витоку пам'яті.
const infoByBlob = new WeakMap();
export const fitInfoOf = (blob) => infoByBlob.get(blob);

/** 1 КБ = 1000 байт: файл гарантовано влізе і в ліміт Windows (1024), і macOS (1000). */
export const toBytes = (value, unit) => {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return Math.floor(n * (unit === "MB" ? 1_000_000 : 1000));
};

// Оригінал повертаємо як є лише для веб-форматів; HEIC/BMP усе одно
// треба перетворити, бо їх не приймають форми та месенджери.
const KEEP_AS_IS = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Стискає зображення до цільового розміру (у байтах).
 * Повертає Blob (або сам файл, якщо він уже влізає); підсумок — у fitInfoOf(blob).
 * Помилки: DECODE_FAILED, ENCODE_FAILED, FORMAT_UNSUPPORTED, TARGET_UNREACHABLE
 * (із best: { size, width, height }) — текст для користувача будує сторінка.
 */
export async function compressImageToTarget(
  file,
  { targetBytes, format = "jpeg", signal, onProgress } = {}
) {
  const fmt = OUTPUT_FORMATS[format];
  if (!fmt) throw new RangeError(`Unknown output format: ${format}`);
  if (!(targetBytes > 0)) throw new RangeError("targetBytes must be > 0");

  // Уже влізає — нічого не чіпаємо (і чесно про це кажемо). Але спершу
  // перевіряємо, що це справді зображення: пошкоджений файл «без змін» не віддаємо.
  if (file.size <= targetBytes && KEEP_AS_IS.has(file.type)) {
    onProgress?.({ phase: "preparing" });
    const probe = await decodeImage(file); // файл ≤ цілі, тож це дешево
    probe.release();
    if (signal?.aborted) {
      throw abortError();
    }
    infoByBlob.set(file, {
      unchanged: true,
      originalBytes: file.size,
      resultBytes: file.size,
    });
    return file;
  }

  onProgress?.({ phase: "preparing" });
  const decoded = await decodeImage(file);
  if (signal?.aborted) {
    decoded.release();
    throw abortError();
  }

  const canvas = document.createElement("canvas");
  const encode = async (quality, _scale, { width, height }) => {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw codedError("ENCODE_FAILED");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.image, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, fmt.mime, quality)
    );
    if (!blob) throw codedError("ENCODE_FAILED");
    // Браузер, що не вміє кодувати формат (напр. WebP у старому Safari),
    // мовчки віддає PNG — це була б «тиха деградація», тож відмовляємось
    if (blob.type !== fmt.mime) throw codedError("FORMAT_UNSUPPORTED");
    return { size: blob.size, data: blob };
  };

  try {
    const result = await fitToTarget(encode, targetBytes, {
      width: decoded.width,
      height: decoded.height,
      signal,
      onProgress: (p) => onProgress?.({ phase: "encoding", ...p }),
    });
    if (!result.ok) {
      throw codedError("TARGET_UNREACHABLE", { best: result.best });
    }
    infoByBlob.set(result.data, {
      unchanged: false,
      quality: result.quality,
      width: result.width,
      height: result.height,
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      originalBytes: file.size,
      resultBytes: result.size,
      resized: result.scale < 1,
      format,
    });
    return result.data;
  } finally {
    decoded.release();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** photo.png → photo.jpg / photo.webp; оригінал, повернутий без змін, лишає своє ім'я. */
export const getFitOutputName = (originalName, blob, fallbackFormat = "jpeg") => {
  const info = blob && fitInfoOf(blob);
  if (info?.unchanged) return originalName;
  // формат беремо з підсумку обробки (а не з поточного вибору на сторінці —
  // користувач міг перемкнути його, поки файл ще оброблявся)
  const ext = OUTPUT_FORMATS[info?.format || fallbackFormat]?.ext || "jpg";
  const dot = originalName.lastIndexOf(".");
  const base = dot !== -1 ? originalName.slice(0, dot) : originalName;
  return `${base}.${ext}`;
};
