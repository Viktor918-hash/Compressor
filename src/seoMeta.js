// Унікальні title/description для кожної сторінки. Без цього всі сторінки
// показують однаковий дефолтний текст (з SeoHead.jsx) — Google сприймає це
// як дублікати контенту і може не індексувати частину сторінок.
//
// es-блоки нижче — чорновий переклад для заповнення структури. Перед
// публікацією бажано перевірити носієм мови або якісним перекладачем.

export const PAGE_META = {
  home: {
    uk: {
      title: "Стиснути зображення онлайн швидко та без втрати якості",
      description:
        "Безкоштовно стиснути фото JPG, PNG та WebP відразу в браузері. Легко та без зайвих зусиль",
    },
    en: {
      title: "Compress images online quickly and without loss of quality",
      description:
        "Free online photo compressor for JPG, PNG and WebP directly in your browser. Easy and effortless",
    },
    ru: {
      title: "Сжать изображение онлайн бесплатно",
      description:
        "Сжать изображения онлайн. Сжимайте и оптимизируйте JPEG, PNG и WebP изображения прямо в браузере, легко и бесплатно.",
    },
    es: {
      title: "Comprimir imágenes online rápido y sin perder calidad",
      description:
        "Comprime fotos JPG, PNG y WebP gratis, directamente en el navegador. Fácil y sin complicaciones",
    },
  },
  convert: {
    uk: {
      title: "Швидке конвертування фото у JPG онлайн безкоштовно",
      description:
        "Перетворити зображення в JPG. Перетворюйте PNG, WEBP, BMP та HEIC (фото з iPhone) на формат JPG. Конвертуйте кілька файлів онлайн одночасно.",
    },
    en: {
      title: "Image converter to JPG",
      description:
        "Convert images to JPG. Turn PNG, WEBP, BMP and HEIC (iPhone photos) files into JPG format. Convert multiple images online simultaneously.",
    },
    ru: {
      title: "Конвертировать изображения в JPG",
      description:
        "Конвертировать изображения в JPG. Преобразовывайте PNG, WEBP, BMP и HEIC (фото с iPhone) в формат JPG. Конвертируйте несколько файлов онлайн одновременно.",
    },
    es: {
      title: "Conversor de imágenes a JPG",
      description:
        "Convierte imágenes a JPG. Transforma archivos PNG, WEBP, BMP y HEIC (fotos de iPhone) al formato JPG. Convierte varias imágenes a la vez.",
    },
  },
  resize: {
    uk: {
      title: "Змінити розмір фото онлайн",
      description:
        "Швидко змініть розмір зображень під потрібні. Безкоштовно змінюй розмір фото прямо в браузері.",
    },
    en: {
      title: "Resize Images Online Free",
      description:
        "Quickly resize images to what you need. Free online photo resizer directly in your browser.",
    },
    ru: {
      title: "Изменить размер изображений онлайн",
      description:
        "Изменить размер фото онлайн бесплатно. Изменяйте размер изображений в формате JPG, PNG, SVG или GIF за считанные секунды легко и бесплатно.",
    },
    es: {
      title: "Redimensionar Imágenes Online Gratis",
      description:
        "Cambia el tamaño de tus imágenes rápidamente. Redimensionador de fotos gratuito directamente en el navegador.",
    },
  },
  webp: {
    uk: {
      title: "Швидке конвертування фото у WEBP онлайн безкоштовно",
      description:
        "Перетворити зображення в WEBP. Перетворюйте JPG, PNG, BMP та HEIC (фото з iPhone) на формат WEBP. Конвертуйте кілька файлів онлайн одночасно.",
    },
    en: {
      title: "Convert images to WebP",
      description:
        "Convert images to WebP. Turn JPG, PNG, BMP and HEIC (iPhone photos) files into WebP format. Convert multiple images online simultaneously.",
    },
    ru: {
      title: "Конвертировать изображения в WEBP",
      description:
        "Конвертировать изображения в WEBP. Преобразовывайте JPG, PNG, BMP и HEIC (фото с iPhone) в формат WEBP. Конвертируйте несколько файлов онлайн одновременно.",
    },
    es: {
      title: "Convertir imágenes a WebP",
      description:
        "Convierte imágenes a WebP. Transforma archivos JPG, PNG, BMP y HEIC (fotos de iPhone) al formato WebP. Convierte varias imágenes a la vez.",
    },
  },
  presets: {
    uk: {
      title: "Готові фільтри та пресети для ваших фото",
      description:
        "Швидко обробити фото онлайн: додайте готові фільтри та пресети за секунди. 25+ стилів для ваших зображень — без Lightroom, прямо в браузері.",
    },
    en: {
      title: "Ready-made filters and presets for your photos",
      description:
        "Quickly process photos online: add ready-made filters and presets in seconds. 25+ styles for your images — no Lightroom needed, right in your browser.",
    },
    ru: {
      title: "Бесплатные пресеты для фото онлайн",
      description:
        "Готовый набор настроек для быстрого изменения фотографии прямо в браузере. Пресеты Лайтрум онлайн без скачивания",
    },
    es: {
      title: "Filtros y preajustes listos para tus fotos",
      description:
        "Edita fotos online en segundos: aplica filtros y preajustes listos para usar. Más de 25 estilos para tus imágenes, sin necesidad de Lightroom.",
    },
  },
  wordToPdf: {
    uk: {
      title: "Конвертувати Word у PDF онлайн безкоштовно",
      description:
        "Перетворіть DOC та DOCX у PDF за кілька секунд онлайн. Точна конвертація зі збереженням форматування, без встановлення програм.",
    },
    en: {
      title: "Convert Word to PDF online for free",
      description:
        "Turn DOC and DOCX files into PDF in seconds, online. Accurate conversion with formatting preserved — no software to install.",
    },
    ru: {
      title: "Конвертировать WORD в PDF",
      description:
        "Преобразование документов Word в PDF с первоначальной точностью PDF файла. Преобразование Word в PDF онлайн, легко и бесплатно.",
    },
    es: {
      title: "Convertir Word a PDF online gratis",
      description:
        "Convierte archivos DOC y DOCX a PDF en segundos, online. Conversión precisa con formato conservado, sin instalar programas.",
    },
  },
  pdfToWord: {
    uk: {
      title: "Конвертувати PDF у Word онлайн безкоштовно",
      description:
        "Перетворіть PDF у редагований DOCX-файл за кілька секунд зі збереженням форматування. До 10 файлів одночасно, безкоштовно.",
    },
    en: {
      title: "Convert PDF to Word online for free",
      description:
        "Turn your PDF into an editable DOCX file in seconds, formatting preserved. Up to 10 files at once, for free.",
    },
    ru: {
      title: "Конвертировать PDF в Word онлайн бесплатно",
      description:
        "Превратите PDF в редактируемый DOCX-файл за несколько секунд с сохранением форматирования. До 10 файлов одновременно, бесплатно.",
    },
    es: {
      title: "Convertir PDF a Word online gratis",
      description:
        "Convierte tu PDF en un archivo DOCX editable en segundos, conservando el formato. Hasta 10 archivos a la vez, gratis.",
    },
  },
  removeBg: {
    uk: {
      title: "Видалити задній фон з фото онлайн безкоштовно",
      description:
        "Автоматично видаліть задній фон з фото прямо в браузері. Магічна кисть для точного доопрацювання країв. Без відправки фото на сервер.",
    },
    en: {
      title: "Remove background from photo online for free",
      description:
        "Automatically remove the background from any photo right in your browser. Magic brush for fine-tuning edges. Your photo never leaves your device.",
    },
    ru: {
      title: "Удалить задний фон с фото онлайн бесплатно",
      description:
        "Автоматически удалите задний фон с фото прямо в браузере. Магическая кисть для точной доработки краёв. Без отправки фото на сервер.",
    },
    es: {
      title: "Eliminar el fondo de una foto online gratis",
      description:
        "Elimina automáticamente el fondo de cualquier foto directamente en tu navegador. Pincel mágico para retocar los bordes. Tu foto nunca sale de tu dispositivo.",
    },
  },
  imageToText: {
    uk: {
      title: "Розпізнати текст із фото онлайн безкоштовно",
      description:
        "Конвертувати фото, скріншот в текст. Розпізнати текст із зображення або відсканованої сторінки, онлайн без реєстрації.",
    },
    en: {
      title: "Extract Text from Image Online Free",
      description:
        "Turn any photo, scan, or screenshot into editable text right in your browser. Supports English, Ukrainian, Russian and Spanish. Your files never leave your device.",
    },
    ru: {
      title: "Распознать текст с фото онлайн бесплатно",
      description:
        "Конвертер фото в текст позволяет скопировать текст с фото. Вы можете извлечь текст с картинки с помощью этого переводчика изображений.",
    },
    es: {
      title: "Extraer texto de una imagen online gratis",
      description:
        "Convierte cualquier foto, escaneo o captura de pantalla en texto editable directamente en tu navegador. Compatible con español, inglés, ucraniano y ruso. Tus archivos nunca salen de tu dispositivo.",
    },
  },
  // Нові інструменти: ru/es — мої переклади, бажано вичитати носієм
  compressToSize: {
    uk: {
      title: "Зменшити фото до 200 КБ онлайн — до будь-якого розміру",
      description:
        "Стисніть фото до потрібного розміру: 50, 100, 200 КБ або свій ліміт. Прямо в браузері, без завантаження файлів на сервер і без реєстрації.",
    },
    en: {
      title: "Compress Image to 200 KB Online — Any Target Size",
      description:
        "Shrink a photo to an exact size: 50, 100, 200 KB or your own limit. Runs in your browser — files never leave your device, no sign-up needed.",
    },
    ru: {
      title: "Уменьшить фото до 200 КБ онлайн — до любого размера",
      description:
        "Сожмите фото до нужного размера: 50, 100, 200 КБ или свой лимит. Прямо в браузере, без загрузки файлов на сервер и без регистрации.",
    },
    es: {
      title: "Comprimir imagen a 200 KB online — a cualquier tamaño",
      description:
        "Reduce una foto al tamaño exacto que necesitas: 50, 100, 200 KB o tu propio límite. Funciona en el navegador: tus archivos no se suben a ningún servidor.",
    },
  },
  convertToPng: {
    uk: {
      title: "Конвертувати в PNG онлайн: JPG, WebP, HEIC у PNG",
      description:
        "Перетворіть фото у PNG онлайн: JPG, WebP, BMP, GIF, AVIF і HEIC з iPhone. Прозорість зберігається, файли не йдуть на сервер, реєстрація не потрібна.",
    },
    en: {
      title: "Convert Image to PNG Online — JPG, WebP, HEIC to PNG",
      description:
        "Convert JPG, WebP, BMP, GIF, AVIF and iPhone HEIC photos to PNG online. Transparency is kept, files never leave your browser, no sign-up needed.",
    },
    ru: {
      title: "Конвертировать в PNG онлайн: JPG, WebP, HEIC в PNG",
      description:
        "Преобразуйте фото в PNG онлайн: JPG, WebP, BMP, GIF, AVIF и HEIC с iPhone. Прозрачность сохраняется, файлы не уходят на сервер, регистрация не нужна.",
    },
    es: {
      title: "Convertir imagen a PNG online: JPG, WebP, HEIC a PNG",
      description:
        "Convierte fotos JPG, WebP, BMP, GIF, AVIF y HEIC de iPhone a PNG online. Conserva la transparencia, sin subir archivos a servidores ni registro.",
    },
  },
  removeExif: {
    uk: {
      title: "Видалити EXIF та GPS з фото онлайн без втрати якості",
      description:
        "Дізнайтеся, які метадані приховано у фото (камера, дата, GPS), і видаліть їх без перекодування та втрати якості. У браузері, без завантаження на сервер.",
    },
    en: {
      title: "Remove EXIF Data from Photos Online — No Quality Loss",
      description:
        "See what metadata is hidden in a photo (camera, date, GPS) and remove it without re-encoding or losing quality. Runs in your browser; files stay on your device.",
    },
    ru: {
      title: "Удалить EXIF и GPS из фото онлайн без потери качества",
      description:
        "Узнайте, какие метаданные скрыты в фото (камера, дата, GPS), и удалите их без перекодирования и потери качества. В браузере, без загрузки на сервер.",
    },
    es: {
      title: "Eliminar EXIF y GPS de fotos online sin perder calidad",
      description:
        "Descubre qué metadatos hay ocultos en una foto (cámara, fecha, GPS) y elimínalos sin recodificar ni perder calidad. En tu navegador, sin subir archivos.",
    },
  },
  photoToPdf: {
    uk: {
      title: "Фото в PDF онлайн: об'єднати кілька фото в один файл",
      description:
        "Перетворіть фото у PDF прямо в браузері: оберіть порядок сторінок, розмір A4 чи розмір фото, поля 0 або 10 мм. Без завантаження на сервер.",
    },
    en: {
      title: "Photos to PDF Online — Combine Multiple Photos into One File",
      description:
        "Turn photos into a single PDF in your browser: set the page order, A4 or photo-size pages, and 0 or 10 mm margins. Nothing is uploaded to a server.",
    },
    ru: {
      title: "Фото в PDF онлайн: объединить несколько фото в один файл",
      description:
        "Превратите фото в PDF прямо в браузере: выберите порядок страниц, размер A4 или размер фото, поля 0 или 10 мм. Без загрузки на сервер.",
    },
    es: {
      title: "Fotos a PDF online: combina varias fotos en un solo archivo",
      description:
        "Convierte tus fotos en un PDF en el navegador: elige el orden de páginas, tamaño A4 o de foto, y márgenes de 0 o 10 mm. Sin subir archivos.",
    },
  },
};
