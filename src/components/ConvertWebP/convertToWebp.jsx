// heic2any (~1.3 МБ) вантажимо лише тоді, коли користувач справді додав
// HEIC/HEIF — а не в головному бандлі для всіх відвідувачів.
const loadHeic2any = async () => (await import("heic2any")).default;

// Розширення/типи, які браузер сам НЕ вміє декодувати через <canvas>
const isHeic = (file) => {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
};

// Конвертація довільного растрового Blob/File у WebP через canvas.
// На відміну від JPG, WebP підтримує прозорість — фон білим НЕ підкладаємо,
// інакше прозорі ділянки PNG втратять альфа-канал.
const blobToWebp = (blob, quality) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Canvas не зміг створити WebP-файл"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () =>
      reject(new Error("Браузер не зміг відкрити зображення"));

    reader.readAsDataURL(blob);
  });
};

// HEIC/HEIF (фото з iPhone) heic2any не вміє віддавати одразу у WebP —
// спершу декодуємо в JPEG, потім цей результат перекодовуємо в WebP.
const convertHeicToWebp = async (file, quality) => {
  const heic2any = await loadHeic2any();
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95,
  });
  const jpegBlob = Array.isArray(result) ? result[0] : result;
  return blobToWebp(jpegBlob, quality);
};

// Головна функція — передаємо в Panel як processFile.
// quality: 0..1, за замовчуванням 0.85 (хороший баланс якість/розмір)
export const convertToWebp = async (file, quality = 0.85) => {
  if (isHeic(file)) {
    return convertHeicToWebp(file, quality);
  }
  return blobToWebp(file, quality);
};

// Міняє будь-яке розширення на .webp
export const getWebpOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.webp`;
};
