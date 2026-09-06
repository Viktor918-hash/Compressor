import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
import { FiDownload, FiArrowLeft, FiX, FiFileText } from "react-icons/fi";
import { TbPhotoPlus } from "react-icons/tb";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { useTranslation } from "react-i18next";

// 📊 Функція для відправки подій в Google Analytics
const trackGaEvent = (eventName, eventParams = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
};

const Panel = ({
  acceptedTypes,
  processFile, // async (file) => Blob — саме тут відбувається стиснення АБО конвертація
  getOutputName, // (originalName) => string — дозволяє поміняти розширення для конвертера
  maxFiles = 20,
  maxFileSize = 30 * 1024 * 1024,
  dropzoneText = "Перетягніть файл сюди або натисніть, щоб вибрати",
  showStats = true,
  onLimitReached, // (error) => void — викликається, коли бекенд повернув 429 (вичерпано денний ліміт)
  // Підписи в бічній панелі — за замовчуванням лишаються "фото"-орієнтованими
  // (як було для перших конвертерів), але сторінки на кшталт Word→PDF можуть
  // передати свої, щоб не писало "Додайте фото" для .docx файлу.
  emptyStateText,
  addMoreText,
  addMoreAriaLabel = "Додати ще фото",
  selectedLabel,
  downloadOneText,
  downloadManyText,
  removeAriaLabel, // (name) => string
  children, // заголовок і опис сторінки — свій для Hero і для Converter

  // ── Опційний перемикач формату виводу (наприклад, txt/doc для OCR) ──
  // Якщо formats передано (2+ записи) і задано buildOutput, Panel сама
  // показує перемикач біля кнопки завантаження і перегенеровує вихідний
  // Blob під обраний формат БЕЗ повторного виклику processFile — тобто
  // без повторної важкої роботи (наприклад, без повторного OCR).
  // У цьому режимі processFile повертає не готовий Blob, а "сирі" дані,
  // з яких buildOutput(raw, formatId, originalName) => Blob будує файл.
  formats, // [{ id: 'txt', label: '.txt' }, { id: 'doc', label: '.doc' }]
  defaultFormatId,
  buildOutput, // (raw, formatId, originalName) => Blob
}) => {
  const hasFormatSwitcher =
    Array.isArray(formats) &&
    formats.length > 1 &&
    typeof buildOutput === "function";
  const [selectedFormat, setSelectedFormat] = useState(
    defaultFormatId || formats?.[0]?.id
  );
  const [processedFiles, setProcessedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setErrorMessage("");

      const availableSlots = maxFiles - processedFiles.length;

      if (acceptedFiles.length > availableSlots) {
        setErrorMessage(
          `Можна додати ще максимум ${availableSlots} файлів. Ліміт — ${maxFiles}.`
        );
        return;
      }

      setShowPanel(true);
      setIsProcessing(true);
      setDownloaded(false);

      // 📊 1. ВІДСТЕЖЕННЯ ПОЧАТКУ ОБРОБКИ
      trackGaEvent("photo_process_start", {
        files_count: acceptedFiles.length,
      });

      for (const file of acceptedFiles) {
        if (file.size > maxFileSize) {
          setErrorMessage(
            `Файл ${file.name} занадто великий, макс. ${(
              maxFileSize /
              1024 /
              1024
            ).toFixed(0)}МБ.`
          );
          continue;
        }

        try {
          const result = await processFile(file);

          if (hasFormatSwitcher) {
            // Мультиформатний режим: result — це "сирі" дані (наприклад,
            // { text } від OCR), а не Blob. Готовий файл під поточний
            // формат обчислюємо тут-таки лише для GA/прев'ю; при зміні
            // формату Panel перегенерує Blob сама, без повторного OCR.
            const blob = buildOutput(result, selectedFormat, file.name);
            const outputName = getOutputName
              ? getOutputName(file.name, selectedFormat)
              : file.name;

            setProcessedFiles((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                original: file,
                raw: result,
                outputName,
              },
            ]);

            trackGaEvent("photo_compressed", {
              file_name: file.name,
              original_size_mb: (file.size / 1024 / 1024).toFixed(2),
              processed_size_mb: (blob.size / 1024 / 1024).toFixed(2),
            });
            continue;
          }

          const url = URL.createObjectURL(result);
          const outputName = getOutputName
            ? getOutputName(file.name)
            : file.name;

          setProcessedFiles((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              original: file,
              processed: result,
              outputName,
              url,
            },
          ]);
          // 📊 2. ВІДСТЕЖЕННЯ УСПІШНОГО СТИСНЕННЯ / КОНВЕРТАЦІЇ КОЖНОГО ФАЙЛА
          trackGaEvent("photo_compressed", {
            file_name: file.name,
            original_size_mb: (file.size / 1024 / 1024).toFixed(2),
            processed_size_mb: (result.size / 1024 / 1024).toFixed(2),
          });
        } catch (error) {
          if (error?.code === "LIMIT_REACHED") {
            setErrorMessage(error.message);
            onLimitReached?.(error);
            break; // немає сенсу пробувати решту файлів у цій же партії
          }
          setErrorMessage(
            error?.message || `Не вдалося обробити "${file.name}".`
          );
        }
      }

      setIsProcessing(false);
    },
    [
      processedFiles.length,
      maxFiles,
      maxFileSize,
      processFile,
      getOutputName,
      hasFormatSwitcher,
      buildOutput,
      selectedFormat,
    ]
  );

  const getUniqueFileName = (name, usedNames) => {
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }

    const dotIndex = name.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? name.slice(0, dotIndex) : name;
    const extension = dotIndex !== -1 ? name.slice(dotIndex) : "";

    let counter = 1;
    let newName = `${baseName} (${counter})${extension}`;

    while (usedNames.has(newName)) {
      counter++;
      newName = `${baseName} (${counter})${extension}`;
    }

    usedNames.add(newName);
    return newName;
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: acceptedTypes,
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  // У мультиформатному режимі готовий Blob і ім'я файлу залежать від
  // обраного формату, тож перераховуємо їх з "сирих" даних щоразу, коли
  // список файлів або обраний формат змінюються — без повторного OCR.
  const currentOutputs = useMemo(() => {
    if (!hasFormatSwitcher) return processedFiles;

    return processedFiles.map((f) => ({
      ...f,
      processed: buildOutput(f.raw, selectedFormat, f.original.name),
      outputName: getOutputName
        ? getOutputName(f.original.name, selectedFormat)
        : f.outputName,
    }));
  }, [
    hasFormatSwitcher,
    processedFiles,
    selectedFormat,
    buildOutput,
    getOutputName,
  ]);

  const stats = useMemo(() => {
    const totalOriginal = currentOutputs.reduce(
      (sum, f) => sum + f.original.size,
      0
    );
    const totalProcessed = currentOutputs.reduce(
      (sum, f) => sum + f.processed.size,
      0
    );
    const savedBytes = totalOriginal - totalProcessed;
    const savedPercent =
      totalOriginal > 0 ? Math.round((savedBytes / totalOriginal) * 100) : 0;

    return { totalOriginal, totalProcessed, savedBytes, savedPercent };
  }, [currentOutputs]);

  const handleDownloadAll = async () => {
    if (currentOutputs.length === 0) return;

    if (currentOutputs.length === 1) {
      const { processed, outputName, url } = currentOutputs[0];
      // У звичайному режимі url уже готовий заздалегідь; у мультиформатному
      // Blob перегенеровано щойно вище, тож створюємо URL тут-таки і
      // одразу звільняємо його після кліку.
      const href = url || URL.createObjectURL(processed);
      const a = document.createElement("a");
      a.href = href;
      a.download = outputName;
      a.click();
      if (!url) URL.revokeObjectURL(href);
      setDownloaded(true);
      return;
    }

    const zip = new JSZip();
    const usedNames = new Set();

    for (const { outputName, processed } of currentOutputs) {
      const uniqueName = getUniqueFileName(outputName, usedNames);
      zip.file(uniqueName, processed);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);

    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = "processed-files.zip";
    a.click();
    URL.revokeObjectURL(zipUrl);
    setDownloaded(true);
  };

  const handleReset = () => {
    processedFiles.forEach((f) => f.url && URL.revokeObjectURL(f.url));
    setProcessedFiles([]);
    setErrorMessage("");
    setShowPanel(false);
    setIsProcessing(false);
    setDownloaded(false);
  };

  const handleCloseClick = () => {
    handleReset();
    return;
  };

  const handleRemoveFile = (id) => {
    setProcessedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  useEffect(() => {
    if (showPanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showPanel]);

  const fmtSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";
  const { t } = useTranslation();
  return (
    <main className="main" {...getRootProps()}>
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="page-drag-overlay">
          <p>{t("panel.dropText")} </p>
        </div>
      )}

      <div className="main__wrapper container">
        <div className="main__content">
          <div className="main__txt">{children}</div>

          <div className="photo__input" id="dropzona">
            <div className="input__download">
              <FiDownload
                size={35}
                color="#4F7CFF"
                className="download__icon"
              />
            </div>
            <div className="input__info-text">
              <button
                type="button"
                className="input__text input__text--button"
                onClick={open}
              >
                {dropzoneText}
              </button>
            </div>
          </div>

          {errorMessage && !showPanel && (
            <p className="error-text">{errorMessage}</p>
          )}
        </div>
      </div>

      <aside className={`side-panel ${showPanel ? "side-panel--open" : ""}`}>
        <div className="side-panel__header">
          {showPanel && (
            <div className="side-panel__back">
              <button
                className="side-panel__back-btn"
                onClick={handleCloseClick}
                aria-label="Закрити панель"
              >
                <FiArrowLeft size={20} /> {t("panel.closePanel")}
              </button>
            </div>
          )}
          <h2 className="side-panel__title">
            {downloaded ? t("panel.fileDownload") : t("panel.fileRedi")}
          </h2>
        </div>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        {processedFiles.length > 0 ? (
          showStats && (
            <div className="side-panel__stats">
              <p className="side-panel__stats-percent">
                −{stats.savedPercent}%
              </p>
              <p className="side-panel__stats-detail">
                {fmtSize(stats.totalOriginal)} → {fmtSize(stats.totalProcessed)}
              </p>
              <p className="side-panel__stats-detail">
                {t("panel.saved")} {fmtSize(stats.savedBytes)}
              </p>
            </div>
          )
        ) : isProcessing ? (
          <p className="side-panel__empty">{t("panel.processing")} </p>
        ) : (
          <p className="side-panel__empty">
            {emptyStateText || t("panel.adFile")}
          </p>
        )}

        {isProcessing && (
          <p className="side-panel__loading">{t("resize.processing")} </p>
        )}

        {showPanel && processedFiles.length < maxFiles && (
          <div className="side__panel-wrapper">
            <button
              className="side-panel__add-btn"
              onClick={open}
              aria-label={addMoreAriaLabel}
            >
              <TbPhotoPlus size={24} className="side-panel_icon" />
              <span className="side-panel__add-text">
                {addMoreText || t("resize.empty")}
              </span>
              {processedFiles.length > 0 && (
                <span className="side-panel__add-badge">
                  {processedFiles.length}
                </span>
              )}
            </button>
          </div>
        )}

        <p className="panel__files">
          {selectedLabel || t("panel.selected")} {processedFiles.length}/
          {maxFiles}
        </p>

        <ul className="side-panel__filelist">
          {processedFiles.map(({ id, original, url }) => (
            <li key={id} className="side-panel__file-item">
              {/* У мультиформатному режимі (наприклад, OCR) url відсутній —
                  оброблений файл це текст/doc, а не картинка, тож завжди
                  показуємо іконку файлу замість зламаного прев'ю. */}
              {url && original.type?.startsWith("image/") ? (
                <img
                  src={url}
                  alt={original.name}
                  className="side-panel__thumbnail"
                />
              ) : (
                <span
                  className="side-panel__thumbnail side-panel__thumbnail--icon"
                  aria-hidden="true"
                >
                  <FiFileText size={20} />
                </span>
              )}
              <span className="side-panel__filename">{original.name}</span>
              <button
                className="side-panel__remove-btn"
                onClick={() => handleRemoveFile(id)}
                aria-label={
                  removeAriaLabel
                    ? removeAriaLabel(original.name)
                    : `Видалити ${original.name}`
                }
              >
                <FiX size={16} className="btn__krest" />
              </button>
            </li>
          ))}
        </ul>

        {hasFormatSwitcher && (
          <div className="side-panel__format-switch" role="group">
            {formats.map((format) => (
              <button
                key={format.id}
                type="button"
                className={`side-panel__format-btn ${
                  selectedFormat === format.id
                    ? "side-panel__format-btn--active"
                    : ""
                }`}
                onClick={() => setSelectedFormat(format.id)}
                aria-pressed={selectedFormat === format.id}
              >
                {format.label}
              </button>
            ))}
          </div>
        )}

        <button
          className={`side-panel__download-btn ${
            processedFiles.length === 0 ? "side-panel__download-btn--empty" : ""
          }`}
          onClick={handleDownloadAll}
          disabled={processedFiles.length === 0 || isProcessing}
        >
          {processedFiles.length > 1
            ? downloadManyText || t("panel.upLoadPhotos")
            : downloadOneText || t("panel.upLoadPhoto")}
        </button>
      </aside>
    </main>
  );
};

export default Panel;
