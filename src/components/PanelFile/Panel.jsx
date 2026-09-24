import "../Hero/Hero.css";
import "../Hero/sidePanel.css";
import {
  FiDownload,
  FiArrowLeft,
  FiX,
  FiFileText,
  FiRefreshCw,
  FiAlertCircle,
  FiChevronUp,
  FiChevronDown,
  FiUploadCloud,
} from "react-icons/fi";
import { TbPhotoPlus } from "react-icons/tb";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../analytics";

// 📊 Події Google Analytics (лише після згоди — див. components/analytics.js).
// УВАГА: не додавайте в params імена файлів чи інші персональні дані —
// назви документів часто містять прізвища/назви договорів.
const trackGaEvent = trackEvent;

// Скільки повідомлень про помилки показуємо одразу (решта — "…та ще N")
const MAX_VISIBLE_ERRORS = 3;

// Блокуємо Blob-URL не одразу після click(): деякі браузери ще не встигли
// почати завантаження. 60 с — з запасом, пам'ять звільняється після цього.
const revokeLater = (url) => setTimeout(() => URL.revokeObjectURL(url), 60_000);

const triggerDownload = (href, filename) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const fmtSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";

const IDLE_MERGE = {
  status: "idle",
  progressText: null,
  progressValue: null,
  result: null,
  error: null,
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Кожен файл у черзі має статус:
 *   queued → processing → done | error
 * Файли обробляються послідовно (обробка важка для CPU / платна на сервері).
 * Помилка одного файлу не зупиняє решту; для файлу з помилкою є "Повторити".
 * processFile отримує другим аргументом { signal } — AbortSignal, який
 * спрацьовує при "Скасувати"/закритті панелі (не всі обробники його
 * підтримують; результат "скасованого" файлу в будь-якому разі відкидається).
 *
 * РЕЖИМ ЗЛИТТЯ (mode="merge"): N файлів → ОДИН результат (об'єднати PDF,
 * зібрати зображення в PDF тощо). Файли НЕ обробляються по одному: вони
 * лишаються у списку зі статусом "ready", користувач упорядковує їх
 * (стрілки ↑↓, перетягування) і натискає "Створити" — тоді викликається
 * processAll(files, { signal, onProgress }) → Promise<{ blob, name }>,
 * де files — File[] у поточному порядку списку. Результат один, завантажується
 * одним файлом. Будь-яка зміна списку скидає готовий результат.
 * Звичайний режим (mode не задано) працює як і раніше.
 */
const Panel = ({
  acceptedTypes,
  processFile, // async (file, { signal, onProgress }) => Blob — саме тут відбувається стиснення АБО конвертація
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
  // Рядок довіри під порожнім станом ("без реєстрації / без встановлення…").
  // За замовчуванням показаний — вірний для клієнтських інструментів
  // (canvas/WASM, файл не йде на сервер). Сторінки, що реально шлють файл
  // на бекенд (Word↔PDF через CloudConvert), передають false, щоб не
  // стверджувати неправду.
  showEmptyTrust = true,
  addMoreText,
  addMoreAriaLabel,
  selectedLabel,
  downloadOneText,
  downloadManyText,
  removeAriaLabel, // (name) => string
  children, // заголовок і опис сторінки — свій для Hero і для Converter
  options, // необов'язковий блок налаштувань під зоною завантаження (напр. якість стиснення)

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

  // ── Необов'язкові підписи результату (напр. «стиснути до N КБ») ──
  formatSize, // (bytes) => string — свій формат розміру в рядку «було → стало» (за замовчуванням — МБ)
  resultNote, // (file, resultBlob) => string | null — додатковий рядок під результатом (якість, роздільність…)

  // ── Режим злиття: N файлів → один результат ──
  mode = "single", // "single" | "merge"
  processAll, // async (files: File[], { signal, onProgress }) => { blob: Blob, name: string }
  mergeButtonText, // текст кнопки "Створити" (за замовчуванням — panel.mergeCreate)
  mergeMinFiles = 2, // мінімум файлів для запуску
  mergeWarning, // (files: File[]) => string | null — необов'язкове попередження (напр. "загалом > 200 МБ"), показується під списком, поки merge.status === "idle"
}) => {
  const { t } = useTranslation();
  const fmtFileSize = formatSize || fmtSize;
  const hasFormatSwitcher =
    Array.isArray(formats) &&
    formats.length > 1 &&
    typeof buildOutput === "function";
  const [selectedFormat, setSelectedFormat] = useState(
    defaultFormatId || formats?.[0]?.id
  );
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState([]); // повідомлення рівня "скидання файлів" (тип, ліміт кількості)
  const [showPanel, setShowPanel] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [tick, setTick] = useState(0); // щоб черга перезапускалась після завершення файлу
  const isMerge = mode === "merge";
  // Стан злиття: idle → running → done | error. result: { blob, name, url, size }
  const [merge, setMerge] = useState(IDLE_MERGE);
  const [dragId, setDragId] = useState(null); // файл, який зараз перетягують
  const [overId, setOverId] = useState(null); // файл під курсором під час перетягування

  // "Сесія" обробки: збільшується при закритті панелі, "Скасувати" і
  // розмонтуванні, щоб результат файлу, який ще обробляється, відкидався
  // (і не додавався в уже закриту панель).
  const sessionRef = useRef(0);
  const runningRef = useRef(false);
  const controllerRef = useRef(null);
  const itemsRef = useRef(items);
  const mergeRef = useRef(merge);
  const listRef = useRef(null);
  const pendingFocusRef = useRef(null); // { id, dir } — повернути фокус на кнопку після переміщення
  // Найсвіжіші пропси для черги (щоб не перезапускати ефект щоразу, коли
  // батьківський компонент створює нову функцію-обробник)
  const latest = useRef({});

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    mergeRef.current = merge;
  }, [merge]);
  useEffect(() => {
    latest.current = {
      processFile,
      resultNote,
      processAll,
      mergeMinFiles,
      getOutputName,
      buildOutput,
      hasFormatSwitcher,
      selectedFormat,
      onLimitReached,
      t,
    };
  });

  // Розмонтування (перехід на іншу сторінку): звільняємо всі Blob-URL
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- навмисно: лічильник, не DOM-вузол
      sessionRef.current++;
      controllerRef.current?.abort();
      itemsRef.current.forEach((f) => f.url && URL.revokeObjectURL(f.url));
      if (mergeRef.current.result?.url) {
        URL.revokeObjectURL(mergeRef.current.result.url);
      }
    };
  }, []);

  const pushError = useCallback(
    (message) => setErrors((prev) => [...prev, message]),
    []
  );

  const patchItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  // ── Черга: бере наступний файл зі статусом "queued" ────────────────────
  useEffect(() => {
    if (isMerge) return; // у режимі злиття файли не обробляються по одному
    if (runningRef.current) return;
    const next = items.find((i) => i.status === "queued");
    if (!next) return;

    runningRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    const session = sessionRef.current;
    const isStale = () => session !== sessionRef.current;
    const file = next.file;

    setItems((prev) =>
      prev.map((i) => (i.id === next.id ? { ...i, status: "processing" } : i))
    );

    (async () => {
      const cur = latest.current;
      try {
        // onProgress({ text, value }) — необов'язковий прогрес обробника
        // (напр. OCR: "Розпізнавання 43%"); value 0…1. Оновлюємо стан лише
        // при зміні відсотка, щоб не перерисовувати панель на кожну подію.
        let lastProgressKey = "";
        const onProgress = (p) => {
          if (isStale() || controller.signal.aborted) return;
          const pct =
            typeof p?.value === "number" ? Math.round(p.value * 100) : null;
          const key = `${p?.text ?? ""}|${pct}`;
          if (key === lastProgressKey) return;
          lastProgressKey = key;
          patchItem(next.id, {
            progressText: p?.text ?? null,
            progressValue: pct === null ? null : pct / 100,
          });
        };
        const result = await cur.processFile(file, {
          signal: controller.signal,
          onProgress,
        });
        if (isStale() || controller.signal.aborted) return;
        // файл могли прибрати зі списку, поки він обробляався
        if (!itemsRef.current.some((i) => i.id === next.id)) return;

        if (cur.hasFormatSwitcher) {
          // Мультиформатний режим: result — це "сирі" дані (наприклад,
          // { text } від OCR), а не Blob. Готовий файл під поточний формат
          // Panel перегенерує сама, без повторного OCR.
          const blob = cur.buildOutput(result, cur.selectedFormat, file.name);
          patchItem(next.id, {
            status: "done",
            raw: result,
            processedSize: blob.size,
            outputName: cur.getOutputName
              ? cur.getOutputName(file.name, cur.selectedFormat)
              : file.name,
          });
          trackGaEvent("photo_compressed", {
            original_size_mb: (file.size / 1024 / 1024).toFixed(2),
            processed_size_mb: (blob.size / 1024 / 1024).toFixed(2),
          });
        } else {
          const url = URL.createObjectURL(result);
          patchItem(next.id, {
            status: "done",
            processed: result,
            processedSize: result.size,
            url,
            // 3-й аргумент — результат: ім'я може залежати від того, що саме
            // повернув обробник (напр. файл, що вже влізав, лишається як був)
            outputName: cur.getOutputName
              ? cur.getOutputName(file.name, undefined, result)
              : file.name,
            note: cur.resultNote?.(file, result) || null,
          });
          // 📊 ВІДСТЕЖЕННЯ УСПІШНОГО СТИСНЕННЯ / КОНВЕРТАЦІЇ КОЖНОГО ФАЙЛА
          trackGaEvent("photo_compressed", {
            original_size_mb: (file.size / 1024 / 1024).toFixed(2),
            processed_size_mb: (result.size / 1024 / 1024).toFixed(2),
          });
        }
      } catch (error) {
        if (isStale() || controller.signal.aborted) return;
        if (error?.code === "LIMIT_REACHED") {
          // Ліміт вичерпано: решту файлів обробити не вдасться — позначаємо
          // їх помилкою (їх можна повторити пізніше кнопкою "Повторити").
          setItems((prev) =>
            prev.map((i) =>
              i.id === next.id || i.status === "queued"
                ? { ...i, status: "error", error: error.message }
                : i
            )
          );
          cur.onLimitReached?.(error);
        } else {
          console.error("processFile failed:", error);
          // Показуємо повідомлення лише від помилок, які самі є
          // "для користувача" (локалізовані); технічні тексти бібліотек
          // ("Failed to fetch", "Canvas toBlob failed") — не показуємо.
          patchItem(next.id, {
            status: "error",
            error:
              error?.userFacing && error?.message
                ? error.message
                : cur.t("errors.processFailed", { name: file.name }),
          });
        }
      } finally {
        runningRef.current = false;
        setTick((n) => n + 1);
      }
    })();
  }, [items, tick, patchItem, isMerge]);

  const isProcessing = items.some(
    (i) => i.status === "queued" || i.status === "processing"
  );
  const doneItems = useMemo(
    () => items.filter((i) => i.status === "done"),
    [items]
  );
  const finishedCount = items.filter(
    (i) => i.status === "done" || i.status === "error"
  ).length;

  const mergeRunning = merge.status === "running";

  // Якщо закрити вкладку посеред обробки — браузер попередить про втрату
  const busy = isProcessing || mergeRunning;
  useEffect(() => {
    if (!busy) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  // Будь-яка зміна списку (додати / видалити / змінити порядок) робить
  // готовий результат недійсним: звільняємо його URL і повертаємо "Створити".
  const invalidateMerge = useCallback(() => {
    if (!isMerge) return;
    const { result, status } = mergeRef.current;
    if (result?.url) URL.revokeObjectURL(result.url);
    if (status === "done" || status === "error") setMerge(IDLE_MERGE);
    setDownloaded(false);
  }, [isMerge]);

  // Причина відхилення файлу самим react-dropzone (тип не з accept тощо)
  const describeRejection = useCallback(
    (file, dropErrors) => {
      const code = dropErrors?.[0]?.code;
      if (code === "file-invalid-type") {
        return t("errors.fileInvalidType", { name: file.name });
      }
      if (code === "file-too-large") {
        return t("errors.fileTooLarge", {
          name: file.name,
          max: (maxFileSize / 1024 / 1024).toFixed(0),
        });
      }
      return t("errors.processFailed", { name: file.name });
    },
    [t, maxFileSize]
  );

  const onDrop = useCallback(
    (acceptedFiles, fileRejections = []) => {
      const problems = fileRejections.map(({ file, errors: dropErrors }) =>
        describeRejection(file, dropErrors)
      );

      // Нічого придатного (наприклад, .txt на сторінці зображень): показуємо
      // причину й НЕ відкриваємо порожню бічну панель.
      if (acceptedFiles.length === 0) {
        setErrors(problems);
        return;
      }

      const availableSlots = maxFiles - itemsRef.current.length;

      if (availableSlots <= 0) {
        setErrors([...problems, t("errors.limitFull", { max: maxFiles })]);
        return;
      }

      // Поки триває злиття, склад списку не змінюємо (результат би не збігся)
      if (isMerge && mergeRef.current.status === "running") return;

      // Приймаємо перші N файлів, решту чесно позначаємо як пропущені —
      // замість того, щоб відхиляти всю партію.
      const withinLimit = acceptedFiles.slice(0, availableSlots);
      const skipped = acceptedFiles.length - withinLimit.length;
      if (skipped > 0) {
        problems.push(
          t("errors.tooManyFiles", {
            count: withinLimit.length,
            max: maxFiles,
            skipped,
          })
        );
      }

      // Завеликі файли не ставимо в чергу, а пояснюємо причину
      const filesToProcess = withinLimit.filter((file) => {
        if (file.size > maxFileSize) {
          problems.push(
            t("errors.fileTooLarge", {
              name: file.name,
              max: (maxFileSize / 1024 / 1024).toFixed(0),
            })
          );
          return false;
        }
        return true;
      });
      setErrors(problems);
      if (filesToProcess.length === 0) return;

      setShowPanel(true);
      setDownloaded(false);

      if (isMerge) {
        invalidateMerge();
        setItems((prev) => [
          ...prev,
          ...filesToProcess.map((file) => ({
            id: newId(),
            file,
            status: "ready",
            // прев'ю для зображень (звільняється при видаленні / закритті)
            url: file.type?.startsWith("image/")
              ? URL.createObjectURL(file)
              : undefined,
          })),
        ]);
        return;
      }

      // 📊 ВІДСТЕЖЕННЯ ПОЧАТКУ ОБРОБКИ
      trackGaEvent("photo_process_start", {
        files_count: filesToProcess.length,
      });

      setItems((prev) => [
        ...prev,
        ...filesToProcess.map((file) => ({
          id: newId(),
          file,
          status: "queued",
        })),
      ]);
    },
    [maxFiles, maxFileSize, describeRejection, t, isMerge, invalidateMerge]
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
    if (!hasFormatSwitcher) return doneItems;

    return doneItems.map((f) => ({
      ...f,
      processed: buildOutput(f.raw, selectedFormat, f.file.name),
      outputName: getOutputName
        ? getOutputName(f.file.name, selectedFormat)
        : f.outputName,
    }));
  }, [hasFormatSwitcher, doneItems, selectedFormat, buildOutput, getOutputName]);

  const stats = useMemo(() => {
    const totalOriginal = currentOutputs.reduce((sum, f) => sum + f.file.size, 0);
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
      // Blob перегенеровано щойно вище, тож створюємо URL тут-таки.
      const href = url || URL.createObjectURL(processed);
      triggerDownload(href, outputName);
      if (!url) revokeLater(href);
      setDownloaded(true);
      return;
    }

    try {
      // JSZip (~100 КБ) потрібен лише для завантаження кількох файлів —
      // тому вантажимо його тільки тут, а не в головному бандлі.
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const usedNames = new Set();

      for (const { outputName, processed } of currentOutputs) {
        const uniqueName = getUniqueFileName(outputName, usedNames);
        zip.file(uniqueName, processed);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      triggerDownload(zipUrl, "processed-files.zip");
      revokeLater(zipUrl);
      setDownloaded(true);
    } catch (error) {
      console.error("zip failed:", error);
      pushError(t("errors.zipFailed"));
    }
  };

  const handleReset = () => {
    sessionRef.current++; // відкидаємо результати файлів, що ще обробляються
    controllerRef.current?.abort();
    items.forEach((f) => f.url && URL.revokeObjectURL(f.url));
    if (merge.result?.url) URL.revokeObjectURL(merge.result.url);
    setMerge(IDLE_MERGE);
    setItems([]);
    setErrors([]);
    setShowPanel(false);
    setDownloaded(false);
  };

  const handleCloseClick = () => {
    handleReset();
  };

  // "Скасувати": прибираємо все, що ще не оброблено; готові й помилкові лишаються
  const handleCancel = () => {
    sessionRef.current++;
    controllerRef.current?.abort();
    if (isMerge) {
      // Злиття: файли ще не оброблені, тож НІЧОГО не видаляємо зі списку —
      // просто зупиняємо створення й повертаємо кнопку "Створити".
      setMerge(IDLE_MERGE);
      return;
    }
    setItems((prev) =>
      prev.filter((i) => i.status === "done" || i.status === "error")
    );
  };

  const handleRetry = (id) => {
    patchItem(id, {
      status: "queued",
      error: null,
      progressText: null,
      progressValue: null,
    });
    setDownloaded(false);
  };

  const handleRemoveFile = (id) => {
    invalidateMerge();
    setItems((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // ── Режим злиття: порядок, створення, завантаження ─────────────────────
  const moveItem = (id, delta) => {
    const from = itemsRef.current.findIndex((i) => i.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= itemsRef.current.length) return;
    invalidateMerge();
    pendingFocusRef.current = { id, dir: delta < 0 ? "up" : "down" };
    setItems((prev) => {
      const a = prev.findIndex((i) => i.id === id);
      const b = a + delta;
      if (a < 0 || b < 0 || b >= prev.length) return prev;
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  // Після переміщення DOM-вузол міг втратити фокус — повертаємо його на
  // ту саму кнопку (або на протилежну, якщо файл дійшов до краю списку).
  useEffect(() => {
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    const li = listRef.current?.querySelector(`[data-item-id="${target.id}"]`);
    const btn = li?.querySelector(`[data-move="${target.dir}"]:not(:disabled)`);
    (btn || li?.querySelector("[data-move]:not(:disabled)"))?.focus();
  }, [items]);

  const moveItemTo = (fromId, toId) => {
    if (fromId === toId) return;
    const from = itemsRef.current.findIndex((i) => i.id === fromId);
    const to = itemsRef.current.findIndex((i) => i.id === toId);
    if (from < 0 || to < 0) return;
    invalidateMerge();
    setItems((prev) => {
      const a = prev.findIndex((i) => i.id === fromId);
      const b = prev.findIndex((i) => i.id === toId);
      if (a < 0 || b < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(a, 1);
      next.splice(b, 0, moved);
      return next;
    });
  };

  const endDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  const handleMerge = async () => {
    const cur = latest.current;
    const files = itemsRef.current.map((i) => i.file);
    if (
      !isMerge ||
      typeof cur.processAll !== "function" ||
      mergeRef.current.status === "running" ||
      files.length < cur.mergeMinFiles
    ) {
      return;
    }

    if (mergeRef.current.result?.url) {
      URL.revokeObjectURL(mergeRef.current.result.url);
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    const session = ++sessionRef.current;
    const isStale = () => session !== sessionRef.current || controller.signal.aborted;

    setDownloaded(false);
    setMerge({ ...IDLE_MERGE, status: "running" });
    // 📊 без імен файлів — лише кількість
    trackGaEvent("merge_start", { files_count: files.length });

    try {
      let lastKey = "";
      const onProgress = (p) => {
        if (isStale()) return;
        const pct =
          typeof p?.value === "number"
            ? Math.round(Math.min(1, Math.max(0, p.value)) * 100)
            : null;
        const key = `${p?.text ?? ""}|${pct}`;
        if (key === lastKey) return;
        lastKey = key;
        setMerge((prev) =>
          prev.status === "running"
            ? {
                ...prev,
                progressText: p?.text ?? null,
                progressValue: pct === null ? null : pct / 100,
              }
            : prev
        );
      };

      const out = await cur.processAll(files, {
        signal: controller.signal,
        onProgress,
      });
      // Скасовано / панель закрита / список змінився, поки йшла робота —
      // результат відкидаємо (URL для нього ще не створено).
      if (isStale()) return;
      if (!(out?.blob instanceof Blob)) {
        throw new Error("processAll must resolve to { blob, name }");
      }
      const url = URL.createObjectURL(out.blob);
      setMerge({
        ...IDLE_MERGE,
        status: "done",
        result: {
          blob: out.blob,
          name: out.name || "merged",
          url,
          size: out.blob.size,
        },
      });
      trackGaEvent("merge_done", {
        files_count: files.length,
        result_size_mb: (out.blob.size / 1024 / 1024).toFixed(2),
      });
    } catch (error) {
      if (isStale()) return;
      if (error?.code === "LIMIT_REACHED") cur.onLimitReached?.(error);
      else console.error("processAll failed:", error);
      setMerge({
        ...IDLE_MERGE,
        status: "error",
        error:
          error?.userFacing && error?.message
            ? error.message
            : cur.t("errors.mergeFailed"),
      });
    }
  };

  const handleDownloadMerge = () => {
    const { result } = mergeRef.current;
    if (!result) return;
    triggerDownload(result.url, result.name);
    setDownloaded(true);
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

  const warningText = useMemo(() => {
    if (typeof mergeWarning !== "function" || merge.status !== "idle") return null;
    return mergeWarning(items.map((i) => i.file)) || null;
  }, [mergeWarning, items, merge.status]);

  const visibleErrors = errors.slice(0, MAX_VISIBLE_ERRORS);
  const hiddenErrors = errors.length - visibleErrors.length;
  const errorBlock =
    errors.length > 0 ? (
      <div role="alert">
        {visibleErrors.map((message, i) => (
          <p className="error-text" key={i}>
            {message}
          </p>
        ))}
        {hiddenErrors > 0 && (
          <p className="error-text">{t("errors.more", { count: hiddenErrors })}</p>
        )}
      </div>
    ) : null;

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
                color="var(--color-primary-600)"
                className="download__icon"
                aria-hidden="true"
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
            {showEmptyTrust && (
              <p className="photo__input__trust">{t("panel.emptyTrust")}</p>
            )}
          </div>

          {options}

          {!showPanel && errorBlock}
        </div>
      </div>

      <aside
        className={`side-panel ${showPanel ? "side-panel--open" : ""}`}
        inert={!showPanel}
      >
        <div className="side-panel__header">
          {showPanel && (
            <div className="side-panel__back">
              <button
                className="side-panel__back-btn"
                onClick={handleCloseClick}
                aria-label={t("panel.closePanel")}
              >
                <FiArrowLeft size={20} /> {t("panel.closePanel")}
              </button>
            </div>
          )}
          <h2 className="side-panel__title">
            {downloaded
              ? t("panel.fileDownload")
              : isMerge && merge.status !== "done"
                ? t("panel.mergeTitle")
                : t("panel.fileRedi")}
          </h2>
        </div>

        {showPanel && errorBlock}

        {items.length === 0 && (
          <div className="side-panel__empty-state">
            <FiUploadCloud
              size={28}
              className="side-panel__empty-icon"
              aria-hidden="true"
            />
            <p className="side-panel__empty">
              {emptyStateText || t("panel.adFile")}
            </p>
            {showEmptyTrust && (
              <p className="side-panel__empty-trust">
                {t("panel.emptyTrust")}
              </p>
            )}
          </div>
        )}

        {doneItems.length > 0 && showStats && (
          <div className="side-panel__stats">
            <p className="side-panel__stats-percent">−{stats.savedPercent}%</p>
            <p className="side-panel__stats-detail">
              {fmtSize(stats.totalOriginal)} → {fmtSize(stats.totalProcessed)}
            </p>
            <p className="side-panel__stats-detail">
              {t("panel.saved")} {fmtSize(stats.savedBytes)}
            </p>
          </div>
        )}

        {isMerge && items.length > 0 && (
          <div className="side-panel__merge-info">
            {items.length > 1 && (
              <p className="side-panel__hint">{t("panel.orderHint")}</p>
            )}
            {items.length < mergeMinFiles && merge.status === "idle" && (
              <p className="side-panel__hint side-panel__hint--warn" role="status">
                {t("panel.mergeNeedMore", { min: mergeMinFiles })}
              </p>
            )}
            {warningText && (
              <p className="side-panel__hint side-panel__hint--warn" role="status">
                {warningText}
              </p>
            )}
            {mergeRunning && (
              <div className="side-panel__progress">
                <div className="side-panel__progress-row" aria-live="polite">
                  <span>{merge.progressText || t("panel.mergeWorking")}</span>
                  <button
                    type="button"
                    className="side-panel__cancel-btn"
                    onClick={handleCancel}
                  >
                    {t("panel.cancel")}
                  </button>
                </div>
                <progress
                  className="side-panel__progress-bar"
                  max={1}
                  // без value — «невизначений» прогрес, якщо обробник його не звітує
                  {...(typeof merge.progressValue === "number"
                    ? { value: merge.progressValue }
                    : {})}
                  aria-label={merge.progressText || t("panel.mergeWorking")}
                />
              </div>
            )}
            {merge.status === "error" && (
              <div className="side-panel__merge-error" role="alert">
                <p className="error-text">{merge.error}</p>
                <button
                  type="button"
                  className="side-panel__cancel-btn"
                  onClick={handleMerge}
                >
                  {t("panel.retry")}
                </button>
              </div>
            )}
            {merge.status === "done" && merge.result && (
              <p className="side-panel__merge-result" role="status">
                <span className="side-panel__filename" title={merge.result.name}>
                  {merge.result.name}
                </span>
                <span>
                  {t("panel.mergeTotal", {
                    from: fmtSize(items.reduce((sum, i) => sum + i.file.size, 0)),
                    to: fmtSize(merge.result.size),
                  })}
                </span>
              </p>
            )}
          </div>
        )}

        {!isMerge && items.length > 0 && (
          <div className="side-panel__progress">
            <div className="side-panel__progress-row" aria-live="polite">
              <span>
                {isProcessing
                  ? t("panel.progress", {
                      done: finishedCount,
                      total: items.length,
                    })
                  : t("panel.progressDone", {
                      done: doneItems.length,
                      total: items.length,
                    })}
              </span>
              {isProcessing && (
                <button
                  type="button"
                  className="side-panel__cancel-btn"
                  onClick={handleCancel}
                >
                  {t("panel.cancel")}
                </button>
              )}
            </div>
            <progress
              className="side-panel__progress-bar"
              max={items.length}
              value={finishedCount}
              aria-label={t("panel.progress", {
                done: finishedCount,
                total: items.length,
              })}
            />
          </div>
        )}

        {showPanel && items.length < maxFiles && (
          <div className="side__panel-wrapper">
            <button
              className="side-panel__add-btn"
              onClick={open}
              disabled={mergeRunning}
              aria-label={addMoreAriaLabel || t("panel.addMoreAria")}
            >
              <TbPhotoPlus size={24} className="side-panel_icon" />
              <span className="side-panel__add-text">
                {addMoreText || t("resize.empty")}
              </span>
              {items.length > 0 && (
                <span className="side-panel__add-badge">{items.length}</span>
              )}
            </button>
          </div>
        )}

        <p className="panel__files">
          {selectedLabel || t("panel.selected")} {items.length}/{maxFiles}
        </p>

        <ul className="side-panel__filelist" ref={listRef}>
          {items.map((item, index) => {
            const { id, file, url, status } = item;
            const canDrag = isMerge && !mergeRunning && items.length > 1;
            return (
              <li
                key={id}
                data-item-id={id}
                className={`side-panel__file-item${
                  dragId === id ? " side-panel__file-item--dragging" : ""
                }${
                  dragId && overId === id && dragId !== id
                    ? " side-panel__file-item--over"
                    : ""
                }`}
                draggable={canDrag || undefined}
                onDragStart={
                  canDrag
                    ? (e) => {
                        setDragId(id);
                        e.dataTransfer.effectAllowed = "move";
                        // Firefox не починає перетягування без setData
                        e.dataTransfer.setData("text/plain", id);
                      }
                    : undefined
                }
                onDragOver={
                  canDrag && dragId
                    ? (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (overId !== id) setOverId(id);
                      }
                    : undefined
                }
                onDrop={
                  canDrag && dragId
                    ? (e) => {
                        e.preventDefault();
                        moveItemTo(dragId, id);
                        endDrag();
                      }
                    : undefined
                }
                onDragEnd={canDrag ? endDrag : undefined}
              >
                {isMerge && (
                  <span className="side-panel__file-index" aria-hidden="true">
                    {index + 1}
                  </span>
                )}
                {/* У мультиформатному режимі (наприклад, OCR) url відсутній —
                    оброблений файл це текст/doc, а не картинка, тож завжди
                    показуємо іконку файлу замість зламаного прев'ю. */}
                {url && file.type?.startsWith("image/") ? (
                  <img src={url} alt="" className="side-panel__thumbnail" />
                ) : (
                  <span
                    className={`side-panel__thumbnail side-panel__thumbnail--icon ${
                      status === "error" ? "side-panel__thumbnail--error" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {status === "error" ? (
                      <FiAlertCircle size={20} />
                    ) : (
                      <FiFileText size={20} />
                    )}
                  </span>
                )}
                <span className="side-panel__file-info">
                  <span className="side-panel__filename" title={file.name}>
                    {file.name}
                  </span>
                  <span
                    className={`side-panel__file-status side-panel__file-status--${status}`}
                  >
                    {status === "ready" && fmtSize(file.size)}
                    {status === "queued" && t("panel.status.queued")}
                    {status === "processing" &&
                      (item.progressText || t("panel.status.processing"))}
                    {status === "done" &&
                      `${fmtFileSize(file.size)} → ${fmtFileSize(item.processedSize)}`}
                    {status === "error" && item.error}
                  </span>
                  {status === "done" && item.note && (
                    <span className="side-panel__file-note">{item.note}</span>
                  )}
                  {status === "processing" &&
                    typeof item.progressValue === "number" && (
                      <progress
                        className="side-panel__file-progress"
                        max={1}
                        value={item.progressValue}
                        aria-label={item.progressText || t("panel.status.processing")}
                      />
                    )}
                </span>
                {status === "error" && (
                  <button
                    type="button"
                    className="side-panel__retry-btn"
                    onClick={() => handleRetry(id)}
                    aria-label={t("panel.retryAria", { name: file.name })}
                    title={t("panel.retry")}
                  >
                    <FiRefreshCw size={16} />
                  </button>
                )}
                {isMerge && (
                  <span className="side-panel__move">
                    <button
                      type="button"
                      className="side-panel__move-btn"
                      data-move="up"
                      onClick={() => moveItem(id, -1)}
                      disabled={index === 0 || mergeRunning}
                      aria-label={t("panel.moveUp", { name: file.name })}
                      title={t("panel.moveUp", { name: file.name })}
                    >
                      <FiChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="side-panel__move-btn"
                      data-move="down"
                      onClick={() => moveItem(id, 1)}
                      disabled={index === items.length - 1 || mergeRunning}
                      aria-label={t("panel.moveDown", { name: file.name })}
                      title={t("panel.moveDown", { name: file.name })}
                    >
                      <FiChevronDown size={16} />
                    </button>
                  </span>
                )}
                <button
                  className="side-panel__remove-btn"
                  disabled={isMerge && mergeRunning}
                  onClick={() => handleRemoveFile(id)}
                  aria-label={
                    removeAriaLabel
                      ? removeAriaLabel(file.name)
                      : t("panel.removeFile", { name: file.name })
                  }
                >
                  <FiX size={16} className="btn__krest" />
                </button>
              </li>
            );
          })}
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

        {isMerge ? (
          merge.status === "done" ? (
            <button
              type="button"
              className="side-panel__download-btn"
              onClick={handleDownloadMerge}
            >
              {downloadOneText || t("panel.upLoadPhoto")}
            </button>
          ) : (
            <button
              type="button"
              className={`side-panel__download-btn ${
                items.length === 0 ? "side-panel__download-btn--empty" : ""
              }`}
              data-merge-create
              onClick={handleMerge}
              disabled={items.length < mergeMinFiles || mergeRunning}
            >
              {mergeButtonText || t("panel.mergeCreate")}
            </button>
          )
        ) : (
          <button
            className={`side-panel__download-btn ${
              doneItems.length === 0 ? "side-panel__download-btn--empty" : ""
            }`}
            onClick={handleDownloadAll}
            disabled={doneItems.length === 0 || isProcessing}
          >
            {doneItems.length > 1
              ? downloadManyText || t("panel.upLoadPhotos")
              : downloadOneText || t("panel.upLoadPhoto")}
          </button>
        )}
      </aside>
    </main>
  );
};

export default Panel;
