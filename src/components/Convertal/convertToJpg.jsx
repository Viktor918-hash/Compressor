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

// Конвертація звичайних растрових форматів (PNG, WEBP, BMP тощо) через canvas
const convertViaCanvas = (file) => {
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
      // JPG не підтримує прозорість — підкладаємо білий фон,
      // інакше прозорі ділянки PNG/WEBP стануть чорними
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas не зміг створити файл"));
          }
        },
        "image/jpeg",
        0.9 // якість 90%
      );
    };

    img.onerror = () =>
      reject(new Error("Браузер не зміг відкрити зображення"));

    reader.readAsDataURL(file);
  });
};

// Конвертація HEIC/HEIF (фото з iPhone) через окрему бібліотеку
const convertHeic = async (file) => {
  const heic2any = await loadHeic2any();
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  // heic2any іноді повертає масив (якщо HEIC містив кілька кадрів) — беремо перший
  return Array.isArray(result) ? result[0] : result;
};

// Головна функція — саме її передаватимемо в Panel як processFile
export const convertToJpg = async (file) => {
  if (isHeic(file)) {
    return convertHeic(file);
  }
  return convertViaCanvas(file);
};

// Міняє будь-яке розширення на .jpg
export const getJpgOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.jpg`;
};
