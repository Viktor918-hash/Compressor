// Унікальні title/description для кожної сторінки. Без цього всі сторінки
// показують однаковий дефолтний текст (з SeoHead.jsx) — Google сприймає це
// як дублікати контенту і може не індексувати частину сторінок.
//
// es-блоки нижче — чорновий переклад для заповнення структури. Перед
// публікацією бажано перевірити носієм мови або якісним перекладачем.

import { BLOG_META } from "./blog/posts.js";
import { PRESET_PAGE_META } from "./presets/presetPages.js";

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
        "Швидко обробити фото онлайн: додайте готові фільтри та пресети за секунди. 60+ стилів для ваших зображень — без Lightroom, прямо в браузері.",
    },
    en: {
      title: "Ready-made filters and presets for your photos",
      description:
        "Quickly process photos online: add ready-made filters and presets in seconds. 60+ styles for your images — no Lightroom needed, right in your browser.",
    },
    ru: {
      title: "Бесплатные пресеты для фото онлайн",
      description:
        "Готовый набор настроек для быстрого изменения фотографии прямо в браузере. Пресеты Лайтрум онлайн без скачивания",
    },
    es: {
      title: "Filtros y preajustes listos para tus fotos",
      description:
        "Edita fotos online en segundos: aplica filtros y preajustes listos para usar. Más de 60 estilos para tus imágenes, sin necesidad de Lightroom.",
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
  cropImage: {
    uk: {
      title: "Обрізати фото онлайн безкоштовно, без втрати якості",
      description:
        "Обріжте фото прямо в браузері: довільна рамка або готові пропорції 1:1, 4:3, 16:9 та інші. Точне перетягування, JPG/PNG/WebP. Без завантаження на сервер.",
    },
    en: {
      title: "Crop Image Online Free — Fast, No Quality Loss",
      description:
        "Crop a photo in your browser: freeform selection or ready ratios like 1:1, 4:3, 16:9. Drag to fine-tune, export as JPG, PNG or WebP. Nothing gets uploaded.",
    },
    ru: {
      title: "Обрезать фото онлайн бесплатно — без потери качества",
      description:
        "Обрежьте фото прямо в браузере: произвольная рамка или готовые пропорции 1:1, 4:3, 16:9 и другие. Точное перетаскивание, JPG/PNG/WebP. Без загрузки на сервер.",
    },
    es: {
      title: "Recortar Imagen Online Gratis — Sin Perder Calidad",
      description:
        "Recorta una foto en el navegador: selección libre o proporciones como 1:1, 4:3, 16:9. Arrastra para ajustar y exporta en JPG, PNG o WebP. Sin subir archivos.",
    },
  },
  rotateImage: {
    uk: {
      title: "Повернути й віддзеркалити фото онлайн безкоштовно",
      description:
        "Поверніть фото на 90°/180° або віддзеркальте по горизонталі чи вертикалі прямо в браузері. Швидко, без втрати якості, JPG/PNG/WebP. Без завантаження на сервер.",
    },
    en: {
      title: "Rotate & Flip Image Online Free — No Quality Loss",
      description:
        "Rotate a photo 90°/180° or flip it horizontally or vertically right in your browser. Fast, lossless for 90° turns, export as JPG, PNG or WebP. Nothing uploaded.",
    },
    ru: {
      title: "Повернуть фото онлайн бесплатно — без потери качества",
      description:
        "Поверните фото на 90°/180° или отразите по горизонтали и вертикали прямо в браузере. Быстро, без потери качества, JPG/PNG/WebP. Без загрузки на сервер.",
    },
    es: {
      title: "Girar y Voltear Imagen Online Gratis — Sin Perder Calidad",
      description:
        "Gira una foto 90°/180° o voltéala en horizontal o vertical directamente en el navegador. Rápido, sin pérdida de calidad, exporta en JPG, PNG o WebP.",
    },
  },
  addWatermark: {
    uk: {
      title: "Додати водяний знак на фото онлайн безкоштовно",
      description:
        "Додайте текстовий водяний знак або лого на фото прямо в браузері: позиція, прозорість, розмір, повторення по кадру. JPG/PNG/WebP. Без завантаження на сервер.",
    },
    en: {
      title: "Add Watermark to Photo Online Free",
      description:
        "Add a text watermark or your own logo to a photo in your browser: choose position, opacity, size, and tiling. Export as JPG, PNG or WebP. Nothing is uploaded.",
    },
    ru: {
      title: "Добавить водяной знак на фото онлайн бесплатно",
      description:
        "Добавьте текстовый водяной знак или лого на фото прямо в браузере: позиция, прозрачность, размер, повтор по кадру. JPG/PNG/WebP. Без загрузки на сервер.",
    },
    es: {
      title: "Añadir Marca de Agua a Foto Online Gratis",
      description:
        "Añade una marca de agua de texto o tu logo a una foto en el navegador: posición, opacidad, tamaño y repetición en mosaico. Exporta en JPG, PNG o WebP.",
    },
  },
  blackAndWhite: {
    uk: {
      title: "Чорно-біле фото онлайн безкоштовно",
      description:
        "Переведіть фото в чорно-біле прямо в браузері з повзунком інтенсивності 0–100%. JPG/PNG/WebP, без втрати якості позицій пікселів. Без завантаження на сервер.",
    },
    en: {
      title: "Black and White Photo Online Free",
      description:
        "Turn a photo black and white right in your browser with a 0-100% intensity slider for partial desaturation too. Export as JPG, PNG or WebP. Nothing uploaded.",
    },
    ru: {
      title: "Чёрно-белое фото онлайн бесплатно",
      description:
        "Сделайте фото чёрно-белым прямо в браузере с помощью ползунка интенсивности 0–100% — доступно и частичное обесцвечивание. JPG/PNG/WebP. Без загрузки на сервер.",
    },
    es: {
      title: "Foto en Blanco y Negro Online Gratis",
      description:
        "Convierte una foto a blanco y negro en el navegador con un control de intensidad del 0 al 100% para un desaturado parcial. Exporta en JPG, PNG o WebP.",
    },
  },
  circleCrop: {
    uk: {
      title: "Кругла обрізка фото онлайн безкоштовно",
      description:
        "Обріжте фото в ідеальне коло прямо в браузері — аватар, профіль чи лого. PNG з прозорим фоном або JPG/WebP. Без завантаження на сервер.",
    },
    en: {
      title: "Circle Crop Photo Online Free",
      description:
        "Crop a photo into a perfect circle in your browser — great for avatars or logos. Export as PNG with transparency or JPG/WebP. Nothing uploaded.",
    },
    ru: {
      title: "Круглая обрезка фото онлайн бесплатно",
      description:
        "Обрежьте фото в идеальный круг прямо в браузере — аватар, профиль или лого. PNG с прозрачным фоном или JPG/WebP. Без загрузки на сервер.",
    },
    es: {
      title: "Recorte Circular de Fotos Online Gratis",
      description:
        "Recorta una foto en un círculo perfecto en el navegador: ideal para avatares o logos. Exporta en PNG con transparencia o en JPG/WebP.",
    },
  },
  compressVideo: {
    uk: {
      title: "Стиснути відео онлайн безкоштовно (MP4, MOV, AVI)",
      description:
        "Зменшіть розмір відео MP4, MOV, AVI, WebM чи MKV онлайн — рекомендоване стиснення або свій розмір кадру. До 200 МБ, без встановлення програм.",
    },
    en: {
      title: "Compress Video Online Free (MP4, MOV, AVI)",
      description:
        "Shrink MP4, MOV, AVI, WebM or MKV video files online — pick recommended compression or choose your own resolution. Up to 200MB, nothing to install.",
    },
    ru: {
      title: "Сжать видео онлайн бесплатно (MP4, MOV, AVI)",
      description:
        "Уменьшите размер видео MP4, MOV, AVI, WebM или MKV онлайн — рекомендованное сжатие или свой размер кадра. До 200 МБ, без установки программ.",
    },
    es: {
      title: "Comprimir Video Online Gratis (MP4, MOV, AVI)",
      description:
        "Reduce el tamaño de video MP4, MOV, AVI, WebM o MKV online: compresión recomendada o tu propia resolución. Hasta 200MB, sin instalar programas.",
    },
  },
  // Раунд 24: три вузькі конвертери формату (не стиснення) — кожен під
  // окремий пошуковий запит, claude/compressphoto-growth-prompt.md §3.3-А.
  convertMovToMp4: {
    uk: {
      title: "Конвертувати MOV в MP4 онлайн безкоштовно",
      description:
        "Перетворіть відео MOV (QuickTime) у MP4 прямо в браузері — без встановлення програм. Файл до 200 МБ, готовий результат за кілька секунд.",
    },
    en: {
      title: "Convert MOV to MP4 Online Free",
      description:
        "Convert QuickTime MOV video files to MP4 online, right in your browser — nothing to install. Up to 200MB, ready in seconds.",
    },
    ru: {
      title: "Конвертировать MOV в MP4 онлайн бесплатно",
      description:
        "Преобразуйте видео MOV (QuickTime) в MP4 прямо в браузере — без установки программ. Файл до 200 МБ, готовый результат за секунды.",
    },
    es: {
      title: "Convertir MOV a MP4 Online Gratis",
      description:
        "Convierte archivos de video MOV (QuickTime) a MP4 online, directo en el navegador — sin instalar nada. Hasta 200MB, listo en segundos.",
    },
  },
  convertMkvToMp4: {
    uk: {
      title: "Конвертувати MKV в MP4 онлайн безкоштовно",
      description:
        "Перетворіть відео MKV (Matroska) у MP4 прямо в браузері — сумісний формат для будь-якого телефона чи плеєра. До 200 МБ, без програм.",
    },
    en: {
      title: "Convert MKV to MP4 Online Free",
      description:
        "Convert MKV (Matroska) video files to MP4 online — a universally compatible format for any phone or player. Up to 200MB, nothing to install.",
    },
    ru: {
      title: "Конвертировать MKV в MP4 онлайн бесплатно",
      description:
        "Преобразуйте видео MKV (Matroska) в MP4 прямо в браузере — совместимый формат для любого телефона или плеера. До 200 МБ, без программ.",
    },
    es: {
      title: "Convertir MKV a MP4 Online Gratis",
      description:
        "Convierte archivos de video MKV (Matroska) a MP4 online — un formato compatible con cualquier teléfono o reproductor. Hasta 200MB, sin instalar nada.",
    },
  },
  convertWebmToMp4: {
    uk: {
      title: "Конвертувати WebM в MP4 онлайн безкоштовно",
      description:
        "Перетворіть відео WebM у MP4 прямо в браузері — зручно для монтажу, презентацій і платформ, які не підтримують WebM. До 200 МБ, без програм.",
    },
    en: {
      title: "Convert WebM to MP4 Online Free",
      description:
        "Convert WebM video files to MP4 online — handy for editing software, presentations, and platforms that don't support WebM. Up to 200MB, nothing to install.",
    },
    ru: {
      title: "Конвертировать WebM в MP4 онлайн бесплатно",
      description:
        "Преобразуйте видео WebM в MP4 прямо в браузере — удобно для монтажа, презентаций и платформ, не поддерживающих WebM. До 200 МБ, без программ.",
    },
    es: {
      title: "Convertir WebM a MP4 Online Gratis",
      description:
        "Convierte archivos de video WebM a MP4 online — ideal para edición, presentaciones y plataformas que no admiten WebM. Hasta 200MB, sin instalar nada.",
    },
  },
  // Довір-сторінки: лише uk+en (ru/es — пізніше). noindex не ставимо —
  // Google навпаки любить бачити Privacy/Terms/Contact на сайтах.
  privacy: {
    uk: {
      title: "Політика конфіденційності — CompressPhoto",
      description:
        "Які дані отримує CompressPhoto і що з ними відбувається: обробка файлів у браузері, Word↔PDF через CloudConvert, акаунти через Supabase, аналітика лише за згодою.",
    },
    en: {
      title: "Privacy Policy — CompressPhoto",
      description:
        "What data CompressPhoto collects and what happens to it: in-browser file processing, Word↔PDF via CloudConvert, accounts via Supabase, consent-gated analytics.",
    },
  },
  terms: {
    uk: {
      title: "Умови використання — CompressPhoto",
      description:
        "Умови використання безкоштовних онлайн-інструментів CompressPhoto: ліміти, відмова від відповідальності, права на ваші файли.",
    },
    en: {
      title: "Terms of Service — CompressPhoto",
      description:
        "Terms of use for CompressPhoto's free online tools: limits, disclaimer, and your rights over your own files.",
    },
  },
  contact: {
    uk: {
      title: "Контакти — CompressPhoto",
      description: "Напишіть нам: питання, пропозиції, звіти про помилки чи запити щодо приватності.",
    },
    en: {
      title: "Contact — CompressPhoto",
      description: "Get in touch: questions, suggestions, bug reports, or privacy requests.",
    },
  },
  about: {
    uk: {
      title: "Про CompressPhoto",
      description:
        "CompressPhoto — безкоштовні онлайн-інструменти для фото й документів, що обробляють файли прямо у браузері, без завантаження на сервер.",
    },
    en: {
      title: "About CompressPhoto",
      description:
        "CompressPhoto is a free online toolkit for photos and documents that processes files right in your browser, with nothing uploaded to a server.",
    },
  },
  // Раунд 36: відео в браузері (FFmpeg.wasm)
  videoToMp3: {
    uk: {
      title: "Відео в MP3 онлайн — витягти звук з відео безкоштовно",
      description:
        "Конвертуйте MP4, MOV, WebM чи MKV у MP3 прямо в браузері: 128–320 кбіт/с, до 1000 МБ, без завантаження на сервер, без реєстрації й лімітів.",
    },
    en: {
      title: "Video to MP3 Online — Extract Audio From Video for Free",
      description:
        "Convert MP4, MOV, WebM or MKV to MP3 right in your browser: 128–320 kbps, files up to 1000 MB, nothing uploaded, no sign-up and no daily limits.",
    },
    ru: {
      title: "Видео в MP3 онлайн — извлечь звук из видео бесплатно",
      description:
        "Конвертируйте MP4, MOV, WebM или MKV в MP3 прямо в браузере: 128–320 кбит/с, до 1000 МБ, без загрузки на сервер, без регистрации и лимитов.",
    },
    es: {
      title: "Vídeo a MP3 online: extraer el audio de un vídeo gratis",
      description:
        "Convierta MP4, MOV, WebM o MKV a MP3 en su navegador: 128–320 kbps, hasta 1000 MB, sin subir nada a un servidor, sin registro ni límites diarios.",
    },
  },
  // Раунд 36: відео в браузері (FFmpeg.wasm)
  trimVideo: {
    uk: {
      title: "Обрізати відео онлайн — без втрати якості, безкоштовно",
      description:
        "Виріжте фрагмент з MP4, MOV, WebM чи MKV прямо в браузері: прев'ю, точний час, режим без перекодування. Файл не йде на сервер, без лімітів.",
    },
    en: {
      title: "Trim Video Online — Cut Clips Free, No Quality Loss",
      description:
        "Cut a clip from MP4, MOV, WebM or MKV right in your browser: preview, exact times and a no-re-encode mode. Nothing is uploaded and there are no limits.",
    },
    ru: {
      title: "Обрезать видео онлайн — без потери качества, бесплатно",
      description:
        "Вырежьте фрагмент из MP4, MOV, WebM или MKV прямо в браузере: превью, точное время, режим без перекодирования. Файл не уходит на сервер, без лимитов.",
    },
    es: {
      title: "Recortar vídeo online: sin perder calidad y gratis",
      description:
        "Corte un fragmento de MP4, MOV, WebM o MKV en su navegador: vista previa, tiempos exactos y modo sin recodificar. No se sube nada y no hay límites.",
    },
  },
  // Раунд 36: блог (uk/en) — title/description живуть поруч із текстами статей
  ...BLOG_META,
  ...PRESET_PAGE_META,
};
