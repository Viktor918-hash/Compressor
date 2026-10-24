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
        "Стиснення фото JPG, PNG і WebP у браузері: якість від 40 до 95 %, розмір у пікселях за бажанням. Файл не стане більшим за оригінал.",
    },
    en: {
      title: "Compress images online quickly and without loss of quality",
      description:
        "Compress JPG, PNG and WebP photos in your browser: set quality from 40 to 95% and optionally cap the size in pixels. The file never gets bigger.",
    },
    ru: {
      title: "Сжать изображение онлайн бесплатно",
      description:
        "Сжатие фото JPG, PNG и WebP в браузере: качество от 40 до 95 %, размер в пикселях по желанию. Файл не станет больше оригинала.",
    },
    es: {
      title: "Comprimir imágenes online rápido y sin perder calidad",
      description:
        "Comprime fotos JPG, PNG y WebP en el navegador: calidad del 40 al 95 % y tamaño en píxeles opcional. El archivo nunca queda más pesado.",
    },
  },
  convert: {
    uk: {
      title: "Швидке конвертування фото у JPG онлайн безкоштовно",
      description:
        "Перетворіть PNG, WebP, BMP або HEIC з iPhone на JPG з якістю 90 %. Прозорі ділянки отримують біле тло. Кілька файлів за раз, без реєстрації.",
    },
    en: {
      title: "Image converter to JPG",
      description:
        "Turn PNG, WebP, BMP or iPhone HEIC images into JPG at 90% quality. Transparent areas get a white background. Several files at once, no sign-up.",
    },
    ru: {
      title: "Конвертировать изображения в JPG",
      description:
        "Превратите PNG, WebP, BMP или HEIC с iPhone в JPG с качеством 90 %. Прозрачные участки получают белый фон. Несколько файлов за раз, без регистрации.",
    },
    es: {
      title: "Conversor de imágenes a JPG",
      description:
        "Pasa imágenes PNG, WebP, BMP o HEIC de iPhone a JPG con calidad del 90 %. Las zonas transparentes reciben fondo blanco. Varios archivos a la vez.",
    },
  },
  resize: {
    uk: {
      title: "Змінити розмір фото онлайн",
      description:
        "Змініть ширину й висоту фото в пікселях або оберіть готовий розмір для соцмереж. Пропорції можна зберегти, обробка — у вашому браузері.",
    },
    en: {
      title: "Resize Images Online Free",
      description:
        "Change a photo's width and height in pixels or pick a ready-made size for social media. Keep the aspect ratio if you need to; it runs in your browser.",
    },
    ru: {
      title: "Изменить размер изображений онлайн",
      description:
        "Измените ширину и высоту фото в пикселях или выберите готовый размер для соцсетей. Пропорции можно сохранить, обработка идёт в браузере.",
    },
    es: {
      title: "Redimensionar Imágenes Online Gratis",
      description:
        "Cambia el ancho y alto de una foto en píxeles o elige un tamaño listo para redes sociales. Puedes mantener la proporción; todo ocurre en tu navegador.",
    },
  },
  webp: {
    uk: {
      title: "Швидке конвертування фото у WEBP онлайн безкоштовно",
      description:
        "Зробіть фото легшими для сайту: JPG, PNG, BMP і HEIC з iPhone перетворюються на WebP з якістю 85 %. Прозорість зберігається, кілька файлів за раз.",
    },
    en: {
      title: "Convert images to WebP",
      description:
        "Make images lighter for your website: JPG, PNG, BMP and iPhone HEIC become WebP at 85% quality. Transparency is kept, several files at once.",
    },
    ru: {
      title: "Конвертировать изображения в WEBP",
      description:
        "Сделайте картинки легче для сайта: JPG, PNG, BMP и HEIC с iPhone превращаются в WebP с качеством 85 %. Прозрачность сохраняется, несколько файлов сразу.",
    },
    es: {
      title: "Convertir imágenes a WebP",
      description:
        "Aligera las imágenes de tu web: JPG, PNG, BMP y HEIC de iPhone pasan a WebP con calidad del 85 %. Se conserva la transparencia; varios archivos a la vez.",
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
        "Более 60 пресетов для фото в браузере: плёнка, портрет, природа, ночь, сезоны и подборки под задачи. Сила эффекта регулируется, есть сравнение «до/после».",
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
        "Перетворіть DOC і DOCX у PDF зі збереженням шрифтів і верстки. До 10 файлів по 50 МБ; конвертація відбувається на сервері CloudConvert.",
    },
    en: {
      title: "Convert Word to PDF online for free",
      description:
        "Turn DOC and DOCX files into PDF with fonts and layout kept. Up to 10 files of 50 MB each; the conversion runs on CloudConvert's servers.",
    },
    ru: {
      title: "Конвертировать Word в PDF онлайн бесплатно",
      description:
        "Преобразуйте DOC и DOCX в PDF с сохранением шрифтов и вёрстки. До 10 файлов по 50 МБ; конвертация выполняется на сервере CloudConvert.",
    },
    es: {
      title: "Convertir Word a PDF online gratis",
      description:
        "Convierte archivos DOC y DOCX a PDF conservando fuentes y diseño. Hasta 10 archivos de 50 MB; la conversión se hace en los servidores de CloudConvert.",
    },
  },
  pdfToWord: {
    uk: {
      title: "Конвертувати PDF у Word онлайн безкоштовно",
      description:
        "Перетворіть PDF на редагований DOCX, щоб виправити текст у Word. До 10 файлів по 50 МБ; складну верстку інколи доведеться доправити вручну.",
    },
    en: {
      title: "Convert PDF to Word online for free",
      description:
        "Turn a PDF into an editable DOCX so you can fix the text in Word. Up to 10 files of 50 MB each; complex layouts may need a manual touch-up.",
    },
    ru: {
      title: "Конвертировать PDF в Word онлайн бесплатно",
      description:
        "Превратите PDF в редактируемый DOCX, чтобы исправить текст в Word. До 10 файлов по 50 МБ; сложную вёрстку иногда придётся поправить вручную.",
    },
    es: {
      title: "Convertir PDF a Word online gratis",
      description:
        "Convierte un PDF en un DOCX editable para corregir el texto en Word. Hasta 10 archivos de 50 MB; los diseños complejos pueden requerir retoques.",
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
        "Розпізнайте текст зі скриншота, фото документа чи скану: українська, російська, англійська й іспанська. Результат — .txt або .doc, без реєстрації.",
    },
    en: {
      title: "Extract Text from Image Online Free",
      description:
        "Pull text from a screenshot, document photo or scan in English, Ukrainian, Russian or Spanish. Save it as .txt or .doc; the image stays on your device.",
    },
    ru: {
      title: "Распознать текст с фото онлайн бесплатно",
      description:
        "Распознайте текст со скриншота, фото документа или скана: русский, украинский, английский и испанский. Результат — .txt или .doc, без регистрации.",
    },
    es: {
      title: "Extraer texto de una imagen online gratis",
      description:
        "Extrae el texto de una captura, foto de un documento o escaneo en español, inglés, ucraniano o ruso. Guárdalo en .txt o .doc; la imagen no sale del equipo.",
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
        "Зменшіть відео MP4, MOV, AVI, WebM чи MKV: рекомендоване стиснення або цільовий розмір у МБ, наприклад для месенджера. До 5 файлів по 200 МБ.",
    },
    en: {
      title: "Compress Video Online Free (MP4, MOV, AVI)",
      description:
        "Shrink MP4, MOV, AVI, WebM or MKV videos: use the recommended setting or a target size in MB, for example for a messenger. Up to 5 files of 200 MB.",
    },
    ru: {
      title: "Сжать видео онлайн бесплатно (MP4, MOV, AVI)",
      description:
        "Уменьшите видео MP4, MOV, AVI, WebM или MKV: рекомендованное сжатие или целевой размер в МБ, например для мессенджера. До 5 файлов по 200 МБ.",
    },
    es: {
      title: "Comprimir Video Online Gratis (MP4, MOV, AVI)",
      description:
        "Reduce videos MP4, MOV, AVI, WebM o MKV: compresión recomendada o un tamaño objetivo en MB, por ejemplo para un mensajero. Hasta 5 archivos de 200 MB.",
    },
  },
  // Раунд 24: три вузькі конвертери формату (не стиснення) — кожен під
  // окремий пошуковий запит, claude/compressphoto-growth-prompt.md §3.3-А.
  convertMovToMp4: {
    uk: {
      title: "Конвертувати MOV в MP4 онлайн безкоштовно",
      description:
        "Перетворіть MOV з iPhone чи камери на MP4 (H.264), який відкривається на Windows, Android і сайтах. Відео HEVC перекодовується. До 200 МБ на файл.",
    },
    en: {
      title: "Convert MOV to MP4 Online Free",
      description:
        "Turn MOV files from an iPhone or camera into MP4 (H.264) that plays on Windows, Android and websites. HEVC video is re-encoded. Up to 200 MB per file.",
    },
    ru: {
      title: "Конвертировать MOV в MP4 онлайн бесплатно",
      description:
        "Превратите MOV с iPhone или камеры в MP4 (H.264), который открывается на Windows, Android и сайтах. Видео HEVC перекодируется. До 200 МБ на файл.",
    },
    es: {
      title: "Convertir MOV a MP4 Online Gratis",
      description:
        "Convierte archivos MOV del iPhone o de una cámara a MP4 (H.264), que se reproduce en Windows, Android y webs. El video HEVC se recodifica. Hasta 200 MB.",
    },
  },
  convertMkvToMp4: {
    uk: {
      title: "Конвертувати MKV в MP4 онлайн безкоштовно",
      description:
        "MKV не відкривається на телевізорі чи в монтажній програмі? Перетворіть його на MP4 з H.264. Звук зберігається, роздільність та сама. До 200 МБ.",
    },
    en: {
      title: "Convert MKV to MP4 Online Free",
      description:
        "MKV won't open on your TV or in your video editor? Convert it to MP4 with H.264. The audio is kept and the resolution stays the same. Up to 200 MB.",
    },
    ru: {
      title: "Конвертировать MKV в MP4 онлайн бесплатно",
      description:
        "MKV не открывается на телевизоре или в монтажной программе? Преобразуйте его в MP4 с H.264. Звук сохраняется, разрешение то же. До 200 МБ.",
    },
    es: {
      title: "Convertir MKV a MP4 Online Gratis",
      description:
        "¿Tu MKV no se abre en el televisor o en el editor de video? Conviértelo a MP4 con H.264. Se conserva el audio y la resolución no cambia. Hasta 200 MB.",
    },
  },
  convertWebmToMp4: {
    uk: {
      title: "Конвертувати WebM в MP4 онлайн безкоштовно",
      description:
        "Перетворіть запис екрана чи відео з браузера у форматі WebM на MP4 для PowerPoint, Keynote і монтажу. Роздільність не змінюється, до 200 МБ.",
    },
    en: {
      title: "Convert WebM to MP4 Online Free",
      description:
        "Convert a WebM screen recording or browser video to MP4 for PowerPoint, Keynote and video editors. The resolution stays the same, up to 200 MB.",
    },
    ru: {
      title: "Конвертировать WebM в MP4 онлайн бесплатно",
      description:
        "Преобразуйте запись экрана или видео из браузера в формате WebM в MP4 для PowerPoint, Keynote и монтажа. Разрешение не меняется, до 200 МБ.",
    },
    es: {
      title: "Convertir WebM a MP4 Online Gratis",
      description:
        "Convierte una grabación de pantalla o un video WebM del navegador a MP4 para PowerPoint, Keynote y editores. La resolución no cambia; hasta 200 MB.",
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
