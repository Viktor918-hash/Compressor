// Спільне декодування зображень для інструментів (стиснення до розміру,
// конвертація у PNG, згодом — обрізання тощо).

/** HEIC/HEIF (фото з iPhone): браузер сам їх не декодує. */
export const isHeic = (file) => {
  const name = (file.name || "").toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
};

/** Помилка з машинним кодом: сторінка сама будує текст для користувача. */
export const codedError = (code, extra = {}) =>
  Object.assign(new Error(code), { code }, extra);

/** Стандартна помилка скасування (перевіряється за error.name === "AbortError"). */
export const abortError = () =>
  Object.assign(new Error("Aborted"), { name: "AbortError" });

/**
 * Декодує файл у растр, УЖЕ повернутий відповідно до EXIF-орієнтації:
 * createImageBitmap з imageOrientation "from-image"; якщо браузер не знає
 * такого значення — <img>, який сучасні браузери повертають правильно.
 * HEIC/HEIF: heic2any (~1.3 МБ) вантажиться динамічно, лише коли він справді
 * потрібен, і віддає JPEG, який далі декодується як звичайний.
 *
 * Повертає { image, width, height, release }. Помилка: code "DECODE_FAILED".
 */
export async function decodeImage(file) {
  let source = file;
  if (isHeic(file)) {
    let heic2any;
    try {
      heic2any = (await import("heic2any")).default;
      const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
      source = Array.isArray(result) ? result[0] : result;
    } catch {
      throw codedError("DECODE_FAILED");
    }
  }

  try {
    const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close?.(),
    };
  } catch {
    // нижче — запасний шлях через <img>
  }

  const url = URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return {
      image: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => {},
    };
  } catch {
    throw codedError("DECODE_FAILED");
  } finally {
    URL.revokeObjectURL(url);
  }
}
