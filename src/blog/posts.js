// Статті блогу (round 36). Чисті дані без JSX і залежностей: файл
// імпортують routes.config.js (а через нього vite.config.js у Node),
// seoMeta.js, компоненти блогу і тести.
//
// Мови: лише uk + en (правило growth-prompt: ru/es — після перших показів
// у GSC). Тексти — з чернеток claude/compressphoto-blog-draft-01…04.md,
// звірені з кодом інструментів перед публікацією (див. CHANGES.md, round 36).
//
// Розмітка в текстах — мінімальна, рендерить src/components/Blog/inline.jsx:
//   **жирний**, `код`, [текст](/шлях-uk) — внутрішнє посилання (канонічний
//   uk-шлях; LocalizedLink сам підставить адресу поточної мови).

export const BLOG_LANGS = ["uk", "en"];
export const BLOG_INDEX_SLUG = "blog";
export const BLOG_PUBLISHED = "2026-10-18";

export const BLOG_INDEX = {
  uk: {
    title: "Блог CompressPhoto: поради про фото, відео і файли",
    description:
      "Практичні інструкції: як стиснути фото до потрібного розміру, відкрити HEIC на Windows, прибрати GPS із фото і надіслати відео без втрати якості.",
    h1: "Блог CompressPhoto",
    intro:
      "Короткі практичні інструкції для типових ситуацій з фото, відео й документами: що робити, коли сайт не приймає файл, і як не втратити якість.",
  },
  en: {
    title: "CompressPhoto Blog: Tips on Photos, Video and Files",
    description:
      "Practical how-tos: compress a photo to an exact size, open HEIC files on Windows, strip GPS from photos, and send video without losing quality.",
    h1: "CompressPhoto Blog",
    intro:
      "Short, practical guides for everyday problems with photos, video and documents: what to do when a site rejects your file, and how to keep the quality.",
  },
};

// Підписи інтерфейсу блогу (не через i18n: блог існує лише в uk/en,
// а ключі в translation.json вимагались би в усіх 4 мовах).
export const BLOG_UI = {
  uk: {
    home: "Головна",
    blog: "Блог",
    readMore: "Читати статтю",
    minRead: (n) => `${n} хв читання`,
    published: "Опубліковано",
    faq: "Питання та відповіді",
    otherPosts: "Інші статті",
    fromBlog: "Корисне з блогу",
    allPosts: "Усі статті блогу",
  },
  en: {
    home: "Home",
    blog: "Blog",
    readMore: "Read the article",
    minRead: (n) => `${n} min read`,
    published: "Published",
    faq: "Questions and answers",
    otherPosts: "More articles",
    fromBlog: "From our blog",
    allPosts: "All blog articles",
  },
};

export const BLOG_POSTS = [
  {
    slug: "blogCompressTo200kb",
    path: "compress-photo-to-200kb",
    published: BLOG_PUBLISHED,
    tool: "/compress-image-to-size",
    // сторінки інструментів, на яких показуємо посилання на цю статтю
    linkedFrom: ["compressToSize", "home", "resize"],
    uk: {
      title: "Як зменшити фото до 200 КБ без втрати якості",
      description:
        "Покроково: як стиснути фото до 200 КБ або будь-якого іншого розміру онлайн, без Photoshop і без втрати деталей. Безкоштовно, прямо в браузері.",
      h1: "Як зменшити фото до 200 КБ без втрати якості",
      lead: [
        "Сайт для подачі документів, форма на роботу, аватар чи анкета на грант — і раптом: «Файл завеликий, максимум 200 КБ». А телефон знімає фото на 4–8 МБ. Відкривати Photoshop заради одного фото довго, а стискати «на око» у випадковому онлайн-інструменті ризиковано: замість чіткого знімка можна отримати розмиту кашу.",
        "Нижче — як зробити це правильно: зменшити файл рівно до потрібного розміру (або трохи менше), не вгадуючи відсоток стиснення навмання.",
      ],
      sections: [
        {
          heading: "Чому фото з телефону важить 4–8 МБ, а потрібно 200 КБ",
          paragraphs: [
            "Сучасний смартфон знімає в роздільності 12–50 мегапікселів і майже без стиснення, щоб фото можна було потім редагувати. Для форми чи документа стільки деталей не потрібно: 200 КБ досить, щоб фото чітко виглядало на екрані й при друку паспортного розміру. Різниця в розмірі — це не «якість проти сміття», а «зайві дані проти потрібних».",
          ],
        },
        {
          heading: "Крок за кроком: стиснути фото до точного розміру",
          steps: [
            "**Відкрийте інструмент [«Зменшити фото до KB/MB»](/compress-image-to-size).** Він працює прямо в браузері: фото не вивантажується на сервер, а обробляється на вашому пристрої.",
            "**Додайте фото.** Підходять JPG, PNG, WebP і HEIC з iPhone.",
            "**Вкажіть цільовий розмір.** Є швидкі кнопки 50 / 100 / 200 / 500 / 1000 КБ або своє число. Якщо форма вимагає «до 200 КБ», ставте саме 200, а не менше: що ближче до межі, то менше втрат якості.",
            "**Оберіть формат.** JPEG підходить для портретів і звичайних фото. WebP стискає ще сильніше за того самого вигляду — обирайте його, якщо сайт приймає WebP (не всі державні портали це дозволяють).",
            "**Стисніть і завантажте результат.** Інструмент сам підбирає якість і лише за потреби трохи зменшує роздільність, щоб файл точно не перевищив ціль. Під результатом видно новий розмір і параметри, наприклад «Якість 82% · 2400×1800».",
          ],
        },
        {
          heading: "Чому «просто стиснути на 70%» — погана ідея",
          paragraphs: [
            "Більшість простих інструментів пропонують обрати відсоток якості й сподіватися, що файл вийде потрібного розміру. Але той самий відсоток дає різний результат залежно від фото: портрет на однотонному фоні стискається набагато сильніше, ніж складний пейзаж із деревами й текстурами. Доводиться стискати кілька разів навмання й щоразу перевіряти розмір вручну. Підхід «вкажіть ціль, а якість підбереться сама» прибирає це вгадування.",
          ],
        },
        {
          heading: "Коли ціль недосяжна",
          paragraphs: [
            "Якщо попросити стиснути фото до неймовірно малого розміру (наприклад, 5 КБ для знімка 4000×3000), чесний інструмент не віддасть мовчки розмазану кашу. Він скаже прямо: «Не вдалося стиснути до 5 КБ. Найменше, чого вдалося досягти, — 8,7 КБ (600×400). Оберіть більший розмір». Це краще за файл, який формально «влазить» у ліміт, але на якому нічого не розібрати.",
          ],
        },
        {
          heading: "Якщо сайт усе одно не приймає файл",
          paragraphs: [
            "Перевірте три речі: формат (деякі форми приймають лише JPG, а не WebP чи PNG), пропорції (фото на документи часто мають бути певного розміру — для цього є [«Обрізати фото»](/crop-image) і [«Змінити розмір фото»](/resize-image)) і те, що ви завантажуєте саме новий файл, а не старий.",
          ],
        },
      ],
      faq: [
        {
          q: "Чи втрачається якість при стисненні до 200 КБ?",
          a: "Що менша ціль, то більше спрощується зображення, але для фото з телефону стиснення до 200 КБ зазвичай майже непомітне на око. Для дуже малих цілей (5–20 КБ) доведеться або зменшити роздільність, або змиритися з помітною втратою деталей.",
        },
        {
          q: "1 КБ — це 1000 чи 1024 байти?",
          a: "Інструмент рахує 1 КБ = 1000 байт. Так файл гарантовано пройде ліміт форми, хоч би яку систему рахунку використовував сайт.",
        },
        {
          q: "Чи можна стиснути кілька фото одразу?",
          a: "Так, до 20 файлів за раз. Кожне фото стискається до вашої цілі окремо, а завантажити всі можна одним ZIP-архівом.",
        },
        {
          q: "Чи вивантажуються файли на сервер?",
          a: "Ні. Уся обробка відбувається у вашому браузері, файл не покидає пристрій.",
        },
        {
          q: "Чи підходить це для аватарки чи фото на документ?",
          a: "Так, 200 КБ — типова вимога для аватарок і анкет. Якщо потрібні ще й певні пропорції (наприклад, 3×4), спершу обріжте фото інструментом [«Обрізати фото»](/crop-image), а потім стисніть до потрібного розміру файлу.",
        },
      ],
      cta: {
        text: "Стиснути фото до потрібного розміру",
        sub: "Безкоштовно, без реєстрації, прямо в браузері.",
      },
    },
    en: {
      title: "Compress a Photo to 200KB Without Losing Quality",
      description:
        "Step by step: shrink a photo to exactly 200KB (or any size) online, with no Photoshop and no quality guesswork. Free, and it runs in your browser.",
      h1: "How to Compress a Photo to 200KB Without Losing Quality",
      lead: [
        "A job application, a visa portal, a grant form — and then: \"File too large, maximum 200KB.\" Your phone shoots 4–8MB photos. Opening Photoshop for one photo feels like overkill, and eyeballing a percentage in a random online tool risks turning a sharp photo into mush.",
        "Here's how to get it right: shrink the file to exactly the size you need (or a little under), without guessing a compression percentage.",
      ],
      sections: [
        {
          heading: "Why a phone photo is 4–8MB when you only need 200KB",
          paragraphs: [
            "Modern phones shoot at 12–50 megapixels with very little compression, so you can edit the photo later. A form or document doesn't need that much detail: 200KB is plenty for a photo to look sharp on screen or printed at passport size. The difference isn't \"quality vs. garbage\", it's \"more data than necessary vs. just enough\".",
          ],
        },
        {
          heading: "Step by step: compress a photo to an exact size",
          steps: [
            "**Open [Compress Image to Size](/compress-image-to-size).** It runs entirely in your browser: your photo is processed on your own device, not uploaded to a server.",
            "**Add your photo.** JPG, PNG, WebP and iPhone HEIC are all accepted.",
            "**Set your target size.** Use the quick buttons for 50 / 100 / 200 / 500 / 1000 KB or type your own number. If a form says \"under 200KB\", set the target to 200 rather than something much smaller: the closer to the limit, the less quality you lose.",
            "**Pick a format.** JPEG works well for portraits and regular photos. WebP compresses further at a similar look — use it if the site you're uploading to accepts WebP (not all government portals do).",
            "**Compress and download.** The tool picks the quality automatically and only reduces resolution when it has to, so the file never exceeds your target. The result shows the new size and the settings used, for example \"Quality 82% · 2400×1800\".",
          ],
        },
        {
          heading: "Why \"just compress by 70%\" doesn't work well",
          paragraphs: [
            "Most basic tools ask you to pick a quality percentage and hope the output lands near the right size. But the same percentage gives very different file sizes depending on the photo: a portrait on a plain background compresses far more than a detailed landscape full of trees and texture. That means trial and error, checking the size by hand every time. Setting a target and letting the quality adjust itself removes the guesswork.",
          ],
        },
        {
          heading: "When the target can't be reached",
          paragraphs: [
            "If you ask for an extremely small target — say 5KB for a 4000×3000 photo — an honest tool won't silently hand you a blurry mess. It tells you directly: \"Couldn't compress to 5 KB. The smallest achieved was 8.7 KB (600×400). Choose a larger size.\" That beats a file that technically meets the limit but is unrecognizable.",
          ],
        },
        {
          heading: "If the site still rejects the file",
          paragraphs: [
            "Check three things: the format (some forms only accept JPG, not WebP or PNG), the proportions (ID-style photos often need specific dimensions — use [Crop Image](/crop-image) and [Resize Image](/resize-image) for that), and that you're actually uploading the new file rather than the old one.",
          ],
        },
      ],
      faq: [
        {
          q: "Does compressing to 200KB hurt quality?",
          a: "The smaller the target, the more the image is simplified, but for a typical phone photo going down to 200KB is barely noticeable. For tiny targets (5–20KB) you'll either lose resolution or see a visible drop in detail.",
        },
        {
          q: "Is 1KB equal to 1000 or 1024 bytes?",
          a: "The tool treats 1KB as 1000 bytes, so the result clears a form's limit whichever convention that site uses.",
        },
        {
          q: "Can I compress several photos at once?",
          a: "Yes, up to 20 files at a time. Each photo is compressed to your target separately, and you can download them all as one ZIP.",
        },
        {
          q: "Are files uploaded to a server?",
          a: "No. All processing happens in your browser; the file never leaves your device.",
        },
        {
          q: "Is this suitable for an avatar or an ID photo?",
          a: "Yes, 200KB is a common requirement for avatars and application forms. If you also need specific proportions (for example 3×4), crop the photo first with [Crop Image](/crop-image), then compress it to the required file size.",
        },
      ],
      cta: {
        text: "Compress your photo to the right size",
        sub: "Free, no sign-up, runs entirely in your browser.",
      },
    },
  },
  {
    slug: "blogHeicToJpgWindows",
    path: "heic-to-jpg-windows",
    published: BLOG_PUBLISHED,
    tool: "/convert-to-jpg",
    linkedFrom: ["convert", "convertToPng"],
    uk: {
      title: "HEIC → JPG на Windows без програм: онлайн і безкоштовно",
      description:
        "Фото з iPhone не відкривається або не завантажується на сайт? Конвертуйте HEIC у JPG прямо в браузері, без Photoshop і без встановлення кодеків.",
      h1: "HEIC → JPG на Windows без програм",
      lead: [
        "Скопіювали фото з iPhone на комп'ютер з Windows — і файл `IMG_1234.HEIC` не відкривається звичним переглядачем, а сайт, куди його треба завантажити (інтернет-магазин, форма, фотодрук), пише «непідтримуваний формат файлу».",
        "Це не поломка. HEIC — формат, який Apple використовує за замовчуванням з iOS 11, а Windows без додаткового розширення з Microsoft Store його не показує. Нижче — як отримати звичайний JPG за хвилину, нічого не встановлюючи й нікуди не надсилаючи фото.",
      ],
      sections: [
        {
          heading: "Чому iPhone зберігає фото в HEIC, а не в JPG",
          paragraphs: [
            "HEIC (High Efficiency Image Container) стискає фото приблизно вдвічі ефективніше за JPG за тієї самої видимої якості, тому у 2017 році Apple зробила його типовим форматом. Проблема лише в сумісності: HEIC розуміють свіжі macOS, iOS і частина Android, але Windows, старі сайти, принтери фотолабораторій і більшість форм завантаження досі чекають JPG або PNG.",
          ],
        },
        {
          heading: "Крок за кроком: конвертувати HEIC у JPG",
          steps: [
            "**Відкрийте інструмент [«Конвертувати в JPG»](/convert-to-jpg).** Усе відбувається у вашому браузері, фото не вивантажується на сервер.",
            "**Додайте HEIC-файл або кілька.** Можна до 20 файлів за раз.",
            "**Дочекайтеся обробки.** Одне фото займає секунду-дві, кілька — трохи довше; прогрес видно для кожного файлу окремо.",
            "**Завантажте результат.** Один файл завантажується одразу як `.jpg`, кілька — одним ZIP-архівом.",
          ],
        },
        {
          heading: "Чому не можна просто перейменувати .HEIC на .JPG",
          paragraphs: [
            "Зміна розширення не змінює того, як записані самі пікселі: HEIC і JPG кодують зображення зовсім по-різному. Перейменований файл так і лишиться нечитаним (або відкриється як пошкоджений) у будь-якій програмі, що не розуміє HEIC. Потрібна саме конвертація — перекодування вмісту в інший формат.",
          ],
        },
        {
          heading: "Що робити, якщо фото багато",
          paragraphs: [
            "Інструмент приймає до 20 файлів за раз — зазвичай цього досить для партії фото з однієї події. Більше фото конвертуйте кількома партіями: кожна повертається своїм ZIP-архівом, тож розкласти фото по папках потім зручно.",
          ],
        },
        {
          heading: "Налаштування на самому iPhone",
          paragraphs: [
            "Якщо HEIC заважає постійно, на iPhone є налаштування «Камера → Формати → Найсумісніший»: тоді телефон одразу знімає в JPG. Але кожне фото важитиме приблизно вдвічі більше, тож для разової конвертації швидше скористатися онлайн-інструментом, ніж змінювати налаштування камери назавжди.",
          ],
        },
      ],
      faq: [
        {
          q: "Чи втрачається якість при конвертації HEIC у JPG?",
          a: "Невелика втрата можлива, бо формати стискають по-різному, але на око вона непомітна для перегляду, друку чи завантаження на сайт. Інструмент зберігає JPG з високою якістю (90%), а не стискає максимально.",
        },
        {
          q: "Чи можна конвертувати HEIC у PNG замість JPG?",
          a: "Так, для цього є [«Конвертувати в PNG»](/convert-to-png). PNG підходить, якщо потрібен формат без втрат, але для звичайних фото він важчий за JPG.",
        },
        {
          q: "Чи працює це на iPhone чи iPad?",
          a: "Так, інструмент працює в будь-якому сучасному браузері на телефоні, планшеті чи комп'ютері.",
        },
        {
          q: "Чому Windows не показує HEIC-файли?",
          a: "Для HEIC у Windows потрібне окреме розширення з Microsoft Store («HEIF Image Extensions»), яке на більшості комп'ютерів не встановлене. І навіть з ним частина програм і сайтів HEIC не приймає.",
        },
        {
          q: "Чи переносяться GPS-координати та інші метадані в JPG?",
          a: "Ні. JPG створюється в браузері заново, і метадані оригіналу (зокрема місце зйомки) у нього не потрапляють. Перевірити будь-яке фото можна в [«Видалити EXIF/метадані»](/remove-photo-metadata).",
        },
      ],
      cta: {
        text: "Конвертувати HEIC у JPG",
        sub: "Безкоштовно, без реєстрації, прямо в браузері.",
      },
    },
    en: {
      title: "HEIC to JPG on Windows — Free, No Install Needed",
      description:
        "iPhone photos won't open or upload? Convert HEIC to JPG right in your browser — no Photoshop, no codec pack, nothing to install, and nothing uploaded.",
      h1: "HEIC to JPG on Windows Without Installing Anything",
      lead: [
        "You copy photos from your iPhone to a Windows PC, and `IMG_1234.HEIC` won't open in the regular photo viewer — or the site you need it on (an online store, a form, a print shop) says \"unsupported file format\".",
        "Nothing is broken. HEIC is the format Apple has used by default since iOS 11, and Windows won't display it without an extra extension from the Microsoft Store. Here's how to get a regular JPG in a minute, with nothing to install and nothing sent anywhere.",
      ],
      sections: [
        {
          heading: "Why iPhone saves photos as HEIC instead of JPG",
          paragraphs: [
            "HEIC (High Efficiency Image Container) compresses photos roughly twice as efficiently as JPG at a similar visible quality, which is why Apple made it the default in 2017. The catch is compatibility: recent macOS, iOS and some Android versions support HEIC, but Windows, older websites, photo-lab printers and most upload forms still expect JPG or PNG.",
          ],
        },
        {
          heading: "Step by step: convert HEIC to JPG",
          steps: [
            "**Open [Convert to JPG](/convert-to-jpg).** Everything happens in your browser; the photo is never uploaded to a server.",
            "**Add one HEIC file or several** — up to 20 at a time.",
            "**Wait a moment.** A single photo takes a second or two; several take a little longer, with progress shown for each file.",
            "**Download the result.** One file downloads straight as `.jpg`; several come back as a single ZIP.",
          ],
        },
        {
          heading: "Why renaming .HEIC to .JPG doesn't work",
          paragraphs: [
            "Changing the extension doesn't change how the pixels are encoded inside: HEIC and JPG store images in completely different ways. A renamed file stays unreadable (or opens as a corrupted image) in any program that doesn't understand HEIC. What you need is a real conversion — re-encoding the content into another format.",
          ],
        },
        {
          heading: "What to do with a whole folder of photos",
          paragraphs: [
            "The tool accepts up to 20 files at a time, which usually covers one event. Convert larger sets in batches: each batch comes back as its own ZIP, so sorting the photos afterwards is easy.",
          ],
        },
        {
          heading: "A setting on the iPhone itself",
          paragraphs: [
            "If HEIC keeps getting in your way, iPhone has Camera → Formats → \"Most Compatible\", which makes the phone shoot JPG directly. Every photo will then take roughly twice the space, so for a one-off conversion an online tool is quicker than changing your camera settings for good.",
          ],
        },
      ],
      faq: [
        {
          q: "Does converting HEIC to JPG lose quality?",
          a: "A small loss is possible because the formats compress differently, but it isn't visible for normal viewing, printing or uploading. The tool saves the JPG at high quality (90%) rather than squeezing the size.",
        },
        {
          q: "Can I convert HEIC to PNG instead?",
          a: "Yes, use [Convert to PNG](/convert-to-png). PNG is lossless, but for regular photos it's heavier than JPG.",
        },
        {
          q: "Does this work on iPhone or iPad?",
          a: "Yes, it works in any modern browser on a phone, tablet or computer.",
        },
        {
          q: "Why doesn't Windows show HEIC files?",
          a: "HEIC on Windows needs a separate Microsoft Store extension (\"HEIF Image Extensions\") that isn't installed on most PCs. Even with it, some programs and sites still won't accept HEIC.",
        },
        {
          q: "Do GPS coordinates and other metadata carry over to the JPG?",
          a: "No. The JPG is created from scratch in your browser, so the original's metadata (including the shooting location) isn't copied into it. You can check any photo with [Remove EXIF/Metadata](/remove-photo-metadata).",
        },
      ],
      cta: {
        text: "Convert HEIC to JPG",
        sub: "Free, no sign-up, runs entirely in your browser.",
      },
    },
  },
  {
    slug: "blogExifGps",
    path: "exif-gps-privacy",
    published: BLOG_PUBLISHED,
    tool: "/remove-photo-metadata",
    linkedFrom: ["removeExif"],
    uk: {
      title: "Що таке EXIF і чи фото видає вашу локацію (GPS)",
      description:
        "Кожне фото з телефону несе приховані дані: модель камери, дату, іноді точні GPS-координати. Перевірте і приберіть їх безкоштовно, прямо в браузері.",
      h1: "Що таке EXIF і чи ваші фото видають вашу локацію",
      lead: [
        "Ви публікуєте фото з власного двору в оголошенні про продаж або надсилаєте знімок з відпустки в чат з малознайомими людьми — і не думаєте, що сам файл може містити точні координати місця зйомки.",
        "Це не параноя: смартфони за замовчуванням записують GPS у фото, і будь-хто, хто відкриє файл спеціальною програмою, а не просто подивиться на картинку, дізнається, де ви стояли, з точністю до кількох метрів.",
      ],
      sections: [
        {
          heading: "Що таке EXIF насправді",
          paragraphs: [
            "EXIF (Exchangeable Image File Format) — блок прихованих даних усередині файлу фотографії, поруч із пікселями. Телефон чи камера записує туди модель пристрою, дату й час, параметри зйомки (витримку, діафрагму, ISO), а на більшості телефонів — ще й GPS-координати, якщо камері дозволено доступ до геолокації. Під час звичайного перегляду цих даних не видно: ви бачите лише картинку, але файл «знає» більше.",
          ],
        },
        {
          heading: "Як перевірити й прибрати приховані дані",
          steps: [
            "**Відкрийте [«Видалити EXIF/метадані»](/remove-photo-metadata).** Усе відбувається у вашому браузері, фото нікуди не вивантажується.",
            "**Додайте фото** (JPEG, PNG або WebP, до 20 за раз). Обробка починається одразу.",
            "**Подивіться, що знайдено.** Під кожним файлом видно, що саме видалено: камеру, дату зйомки, програму, автора, серійний номер. Якщо у файлі були координати, вони показуються окремим попередженням — це найчутливіші дані.",
            "**Завантажте очищене фото** й викладайте саме його в оголошення, соцмережі чи будь-куди, де фото побачать незнайомі люди.",
          ],
        },
        {
          heading: "Коли це справді має значення",
          paragraphs: [
            "Найпоширеніші ситуації: оголошення про продаж (покупець бачить вашу адресу ще до першої зустрічі), фото дітей у соцмережах (геотег показує школу чи майданчик, куди вони регулярно ходять), фото робочого місця (розкриває графік і локацію), публічні фотозвіти (разом з іншими даними дозволяють відстежити пересування). Для сімейного альбому на вашому пристрої це не проблема — ризик з'являється тоді, коли фото потрапляє до сторонніх.",
          ],
        },
        {
          heading: "А інші метадані теж небезпечні?",
          paragraphs: [
            "Модель камери й дата зйомки самі по собі рідко загрожують приватності. Більше уваги варто звертати на **вбудовану мініатюру**: вона іноді зберігається окремо й може показувати старий, ще не обрізаний кадр. І на **ім'я автора**, яке деякі системи підставляють автоматично. Інструмент прибирає все це за один прохід, а не лише GPS.",
          ],
        },
        {
          heading: "Чи можна прибрати лише GPS, а решту лишити",
          paragraphs: [
            "Зараз інструмент прибирає всі метадані одразу (GPS, камеру, дату, мініатюру, XMP, IPTC) — для приватності це найпростіший і найнадійніший варіант. Єдиний виняток — тег повороту в JPEG: його лишаємо, щоб фото не «лягло на бік». Якщо вам важливо зберегти дату зйомки для архіву, просто лишіть собі оригінал: інструмент не змінює вихідний файл, а створює новий, очищений.",
          ],
        },
      ],
      faq: [
        {
          q: "Чи всі телефони додають GPS у фото?",
          a: "За замовчуванням здебільшого так — і на iOS, і на Android, якщо камері дозволено доступ до геолокації. Вимкнути це можна в налаштуваннях конфіденційності, але на вже зроблені фото це не вплине: їх треба очистити окремо.",
        },
        {
          q: "Чи видно метадані, якщо просто подивитися на фото в галереї?",
          a: "Ні, звичайний перегляд показує лише зображення. EXIF видно у властивостях файлу на комп'ютері («Подробиці» у Windows, «Інформація» на Mac) або в спеціальних програмах.",
        },
        {
          q: "Чи погіршується якість після видалення метаданих?",
          a: "Ні. Без галочки «Перекодувати фото повністю» пікселі не перекодовуються, тож якість та сама, а файл навіть трохи меншає. З галочкою фото перекодовується (JPEG і WebP — з якістю 92%), зате не лишається жодних тегів.",
        },
        {
          q: "Хіба соцмережі самі не прибирають ці дані?",
          a: "Великі платформи зазвичай прибирають GPS під час завантаження, але не всі месенджери й сайти оголошень роблять це. А якщо надіслати оригінальний файл напряму (поштою, у Telegram «як файл», на власний сайт), автоматичного очищення може не бути взагалі.",
        },
        {
          q: "Чи надсилається фото на ваш сервер?",
          a: "Ні. І перевірка, і видалення метаданих відбуваються локально у вашому браузері.",
        },
      ],
      cta: {
        text: "Перевірити й видалити метадані з фото",
        sub: "Безкоштовно, без реєстрації, прямо в браузері.",
      },
    },
    en: {
      title: "What Is EXIF — Is Your Photo Leaking Your GPS Location",
      description:
        "Every phone photo carries hidden data — camera model, date, sometimes exact GPS coordinates. Check it and strip it for free, right in your browser.",
      h1: "What Is EXIF, and Is Your Photo Leaking Your Location?",
      lead: [
        "You post a photo of your own backyard in a classifieds listing, or share a vacation shot in a group chat with people you barely know — without realizing the file itself can contain the exact coordinates of where it was taken.",
        "This isn't paranoia: phones record GPS into photos by default, and anyone who opens the file with the right tool, not just views the picture, can find out where you were standing, often to within a few meters.",
      ],
      sections: [
        {
          heading: "What EXIF actually is",
          paragraphs: [
            "EXIF (Exchangeable Image File Format) is a block of hidden data inside the photo file, next to the pixels. Your phone or camera writes the device model, date and time, shooting settings (shutter speed, aperture, ISO) and, on most phones, GPS coordinates too if the camera has location access. None of this shows when you simply look at the photo — you see the picture, but the file \"knows\" more.",
          ],
        },
        {
          heading: "How to check and remove the hidden data",
          steps: [
            "**Open [Remove EXIF/Metadata](/remove-photo-metadata).** Everything happens in your browser; the photo isn't uploaded anywhere.",
            "**Add your photo** (JPEG, PNG or WebP, up to 20 at a time). Processing starts right away.",
            "**See what was found.** Under each file you'll see what was removed: camera, shooting date, software, author, serial number. If the file had coordinates, they're shown as a separate warning — that's the most sensitive part.",
            "**Download the cleaned photo** and use that version for listings, social media or anywhere strangers might see it.",
          ],
        },
        {
          heading: "When this actually matters",
          paragraphs: [
            "The most common situations: a classifieds listing (a buyer sees your home address before you've even met), kids' photos on social media (a geotag points to a school or playground they visit regularly), workplace photos (they reveal your schedule and location), public event photos (combined with other data, they can track someone's movements). For a family album on your own device it's not an issue — the risk appears once a photo reaches strangers.",
          ],
        },
        {
          heading: "Is other metadata risky too?",
          paragraphs: [
            "Camera model and date are rarely a privacy problem on their own. Pay more attention to the **embedded thumbnail**, which is sometimes stored separately and can still show an older, uncropped version of the shot, and to the **author name**, which some systems fill in automatically. The tool strips all of this in one pass, not just GPS.",
          ],
        },
        {
          heading: "Can I remove only GPS and keep the rest?",
          paragraphs: [
            "Right now the tool removes all metadata at once (GPS, camera, date, thumbnail, XMP, IPTC) — the simplest and most reliable option for privacy. The one exception is the JPEG orientation tag, which is kept so the photo doesn't end up sideways. If you need the shooting date for an archive, just keep your original: the tool never changes the source file, it creates a new, cleaned one.",
          ],
        },
      ],
      faq: [
        {
          q: "Do all phones add GPS to photos?",
          a: "By default, mostly yes, on both iOS and Android, as long as the camera has location access. You can turn it off in privacy settings, but photos you've already taken keep their coordinates until you clean them.",
        },
        {
          q: "Can I see the metadata just by looking at the photo?",
          a: "No, a normal preview shows only the image. You can see EXIF in the file's properties on a computer (\"Details\" on Windows, \"Get Info\" on Mac) or in dedicated tools.",
        },
        {
          q: "Does removing metadata reduce quality?",
          a: "No. Without the \"re-encode the photo completely\" option the pixels aren't re-encoded, so quality stays the same and the file even gets slightly smaller. With the option on, the photo is re-encoded (JPEG and WebP at 92% quality) and no tags remain at all.",
        },
        {
          q: "Don't social networks strip this data anyway?",
          a: "Big platforms usually strip GPS on upload, but not every messenger or classifieds site does. And if you send the original file directly (by email, in Telegram \"as a file\", on your own website), there may be no cleanup at all.",
        },
        {
          q: "Is my photo sent to your server?",
          a: "No. Both checking and removing metadata happen locally in your browser.",
        },
      ],
      cta: {
        text: "Check and remove photo metadata",
        sub: "Free, no sign-up, runs entirely in your browser.",
      },
    },
  },
  {
    slug: "blogVideoWhatsapp",
    path: "compress-video-for-whatsapp-telegram",
    published: BLOG_PUBLISHED,
    tool: "/compress-video",
    linkedFrom: ["compressVideo", "trimVideo", "convertMovToMp4"],
    uk: {
      title: "Як стиснути відео для WhatsApp і Telegram без втрати якості",
      description:
        "WhatsApp сам стискає відео й псує якість. Стисніть відео заздалегідь до потрібного розміру в МБ і надішліть як файл, без повторного стиснення.",
      h1: "Чому WhatsApp псує якість відео і як стиснути відео самостійно",
      lead: [
        "Знайоме: зняли відео на телефон, надіслали в сімейний чат WhatsApp — і на іншому кінці воно прийшло мутним, хоча оригінал був чітким. Справа не у вашому телефоні й не в інтернеті одержувача: WhatsApp сам перестискає звичайні відео в чаті, щоб зекономити трафік, і робить це доволі агресивно.",
        "Вихід простий: стиснути відео самостійно до потрібного розміру ще до відправки і надіслати його як файл — тоді месенджер якість не чіпає.",
      ],
      sections: [
        {
          heading: "Чому це відбувається",
          paragraphs: [
            "Коли ви надсилаєте відео звичним способом (через галерею в чаті), WhatsApp орієнтується на практичний ліміт близько 16 МБ: більше відео він стискає сам, часто до 720p чи навіть 480p, і вплинути на це не можна. Якщо надіслати те саме відео як «Документ» (скріпка → «Документ»), воно піде без додаткового стиснення з лімітом 2 ГБ. Telegram менш агресивний (2 ГБ на файл безкоштовно, 4 ГБ з Premium), але логіка та сама: менший файл доходить швидше й надійніше, особливо в групах і на слабкому зв'язку.",
            "Ці ліміти месенджери час від часу змінюють, тож перед важливою відправкою варто перевірити актуальні цифри.",
          ],
        },
        {
          heading: "Як стиснути відео до потрібного розміру",
          steps: [
            "**Відкрийте [«Стиснути відео»](/compress-video)** і додайте файл (до 200 МБ).",
            "**Оберіть ціль.** «Рекомендовано» автоматично зменшить відео до 720p, якщо оригінал більший. Або «Свій розмір»: швидкі варіанти 25 / 50 / 100 / 200 / 500 МБ чи власне число — наприклад 15 МБ, якщо надсилатимете звичайним відео в WhatsApp.",
            "**Натисніть «Стиснути».** Інструмент підбере роздільність, яка дасть потрібний розмір, і перекодує відео.",
            "**Перевірте результат.** Сторінка чесно показує «Ціль: X МБ (орієнтовно) → отримано: Y МБ»: точний збіг не гарантований, бо розмір залежить і від того, що відбувається в кадрі (більше руху — більший файл).",
            "**Надішліть результат** звичайним відео, якщо вклалися в ~16 МБ для WhatsApp, або як документ, якщо файл більший, а якість важлива.",
          ],
        },
        {
          heading: "Потрібен лише фрагмент? Обріжте відео",
          paragraphs: [
            "Часто відео важке просто тому, що довге. Якщо треба надіслати лише кілька секунд, спершу виріжте потрібний шматок у [«Обрізати відео»](/trim-video): обрізка працює прямо в браузері, без перекодування й без ліміту конвертацій, а файл стає меншим пропорційно тривалості. Звук окремо можна зберегти в MP3 через [«Відео в MP3»](/video-to-mp3).",
          ],
        },
        {
          heading: "Важливо знати про сам інструмент",
          paragraphs: [
            "На відміну від фотоінструментів цього сайту, які обробляють зображення у вашому браузері, **для стиснення відео файл надсилається на сервер обробки** (CloudConvert): перекодування відео в браузері на звичайному телефоні тривало б задовго. Сервіс безкоштовний і без реєстрації, з лімітом **3 конвертації на день для гостя** (6 — після реєстрації) і максимальним розміром файлу **200 МБ**.",
          ],
        },
      ],
      faq: [
        {
          q: "Чому результат не збігається із заданим розміром точно?",
          a: "Стиснення працює через підбір роздільності: інструмент оцінює, яка роздільність дасть приблизно потрібний розмір, виходячи з тривалості й бітрейту оригіналу. Відео з великою кількістю руху після стиснення важить більше за статичну сцену тієї ж тривалості, тому фінальний розмір завжди орієнтовний.",
        },
        {
          q: "Чи краще надсилати відео як файл?",
          a: "Якщо якість важливіша за зручність перегляду в чаті — так: «як документ» месенджер не перестискає відео вдруге. Якщо достатньо помірної якості й хочеться відкривати відео одним дотиком, стисніть його до ~16 МБ і надсилайте звичайним способом.",
        },
        {
          q: "А якщо відео для Telegram?",
          a: "Telegram толерантніший до розміру (до 2 ГБ безкоштовно), тож заради ліміту стискати зазвичай не треба. Стиснення корисне, щоб зекономити пам'ять і трафік одержувача або швидше відправити відео на слабкому зв'язку.",
        },
        {
          q: "Чи погіршується звук?",
          a: "Ні, звукова доріжка лишається повноцінною: розмір зменшується головним чином за рахунок роздільності відео.",
        },
        {
          q: "Чи є ліміт на тривалість відео?",
          a: "Окремого ліміту на тривалість немає, лише 200 МБ на файл. Але довше відео при тому самому цільовому розмірі отримає нижчу роздільність: більше секунд ділять той самий бюджет мегабайтів.",
        },
      ],
      cta: {
        text: "Стиснути відео до потрібного розміру",
        sub: "Безкоштовно, без реєстрації — оберіть ціль у МБ.",
      },
    },
    en: {
      title: "Compress Video for WhatsApp & Telegram Without Quality Loss",
      description:
        "WhatsApp re-compresses videos and wrecks quality. Compress your video to a target size in MB first, then send it as a file — no second compression.",
      h1: "Why WhatsApp Ruins Video Quality — and How to Compress a Video Yourself",
      lead: [
        "You've probably seen this: you record a video on your phone, send it to a WhatsApp family chat, and it arrives blurry even though the original was sharp. It's not your phone or the recipient's connection — WhatsApp re-compresses regular chat videos to save bandwidth, and it does so fairly aggressively.",
        "The fix is simple: compress the video to the size you need before sending, then send it as a file, so the messenger doesn't touch the quality.",
      ],
      sections: [
        {
          heading: "Why this happens",
          paragraphs: [
            "When you send a video the usual way (from the gallery in a chat), WhatsApp works to a practical limit of roughly 16 MB: anything bigger gets compressed automatically, often to 720p or even 480p, with no control on your side. Send the same video as a \"Document\" (paperclip → Document) and it goes through without extra compression, with a 2 GB limit. Telegram is less aggressive (2 GB per file for free, 4 GB with Premium), but the same logic applies: a smaller file arrives faster and more reliably, especially in groups and on weak connections.",
            "Messengers change these limits from time to time, so check the current numbers before an important send.",
          ],
        },
        {
          heading: "How to compress a video to a specific size",
          steps: [
            "**Open [Compress Video](/compress-video)** and add your file (up to 200 MB).",
            "**Pick a target.** \"Recommended\" automatically scales the video down to 720p if the original is larger. Or choose \"Custom size\": quick options of 25 / 50 / 100 / 200 / 500 MB, or your own number — say 15 MB if you'll send it as a regular WhatsApp video.",
            "**Click Compress.** The tool picks the resolution that should land on your target and re-encodes the video.",
            "**Check the result.** The page honestly shows \"Target: X MB (approx.) → got: Y MB\": an exact match isn't guaranteed, because the size also depends on what's happening in the frame (more motion means a bigger file).",
            "**Send the result** as a regular video if you landed around 16 MB for WhatsApp, or as a document if it's bigger and quality matters.",
          ],
        },
        {
          heading: "Only need part of it? Trim the video",
          paragraphs: [
            "Often a video is heavy simply because it's long. If you only need a few seconds, cut that part out first with [Trim Video](/trim-video): trimming runs right in your browser, without re-encoding and without a daily limit, and the file shrinks in proportion to its length. To keep just the sound, save it as an MP3 with [Video to MP3](/video-to-mp3).",
          ],
        },
        {
          heading: "Worth knowing about the tool itself",
          paragraphs: [
            "Unlike the photo tools on this site, which process images in your browser, **video compression sends the file to a processing server** (CloudConvert): re-encoding video in the browser on an ordinary phone would take far too long. The service is free with no sign-up, with a limit of **3 conversions per day for guests** (6 with an account) and a maximum file size of **200 MB**.",
          ],
        },
      ],
      faq: [
        {
          q: "Why doesn't the result match my target exactly?",
          a: "Compression works by picking a resolution: the tool estimates which resolution will land near your target based on the original's duration and bitrate. High-motion footage ends up larger than a static scene of the same length, so the final size is always approximate.",
        },
        {
          q: "Is it better to send a video as a file?",
          a: "If quality matters more than one-tap playback in the chat, yes: sent \"as a document\", the video isn't re-compressed a second time. If moderate quality is fine and you want it to open in the chat, compress it to about 16 MB and send it the usual way.",
        },
        {
          q: "What if the video is for Telegram?",
          a: "Telegram is much more tolerant of size (up to 2 GB for free), so you usually don't need to compress for the limit. Compressing still helps save the recipient's storage and data, or send faster on a weak connection.",
        },
        {
          q: "Does compression hurt the audio?",
          a: "No, the audio track stays intact: the size comes down mainly through the video's resolution.",
        },
        {
          q: "Is there a limit on video length?",
          a: "There's no separate length limit, only 200 MB per file. But a longer video at the same target size gets a lower resolution: more seconds share the same megabyte budget.",
        },
      ],
      cta: {
        text: "Compress your video to a target size",
        sub: "Free, no sign-up — pick your target in MB.",
      },
    },
  },
  {
    // round 37: п'ята стаття блогу (growth-prompt.md, розділ 3.4) —
    // факт про білий фон і якість 90% звірено з src/components/Convertal/
    // convertToJpg.jsx (той самий тест, що стереже й статтю 1, round 36).
    slug: "blogPngToJpgBlack",
    path: "transparent-png-to-jpg-black",
    published: "2026-10-19",
    tool: "/convert-to-jpg",
    linkedFrom: ["convert", "home", "convertToPng"],
    uk: {
      title: "Прозорий PNG → JPG став чорним: чому і як виправити",
      description:
        "Конвертували прозорий PNG у JPG — і фон став чорним? Пояснюємо, чому так стається, і даємо конвертер, що підкладає білий фон сам, без чорних плям.",
      h1: "Чому прозорий PNG після конвертації в JPG стає чорним",
      lead: [
        "Ви стиснули логотип чи скрінштот, збережений як PNG із прозорим фоном, конвертували його в JPG — і замість прозорості отримали суцільне чорне тло. Це не поламаний файл і не збій конвертера — а особливість самого формату JPEG.",
        "Нижче — чому так стається з будь-яким PNG, де є прозорість, і як конвертувати так, щоб замість непередбачуваної чорної плями лишився білий (або будь-який інший, якщо підкласти його заздалегідь) фон.",
      ],
      sections: [
        {
          heading: "Чому прозорість перетворюється саме на чорний колір",
          paragraphs: [
            "Формат JPEG узагалі не вміє зберігати прозорість (альфа-канал) — кожен піксель у ньому лише колір, без значення «наскільки прозоро». Коли конвертер переносить PNG у JPG, прозорі пікселі треба чимось замінити. Якщо програма явно не підкладає якийсь фон заздалегідь, порожня ділянка малюється так, як браузерний canvas заповнює її за замовчуванням — а незаторкнутий піксель у ньому за стандартом повністю прозорий чорний (rgba(0,0,0,0)). Коли файл зберігається в JPG без альфа-каналу, прозорість просто відкидається, і лишається саме цей чорний колір.",
          ],
        },
        {
          heading: "Як перевірити, перш ніж конвертувати",
          steps: [
            "Відкрийте PNG у перегляднику, що показує прозорість сіро-білою «шахівницею» (так її показує, наприклад, попередній перегляд файлів у Windows/macOS чи сам браузер) — якщо навколо об'єкта видно цю текстуру, це прозорість, яка стане чорною без правильного фону.",
            "Якщо часу перевіряти немає — просто користуйтесь конвертером, який сам підкладає білий фон (нижче), і проблема не виникає в принципі.",
          ],
        },
        {
          heading: "Як конвертувати PNG у JPG без чорного фону",
          steps: [
            "**Відкрийте [«Конвертувати в JPG»](/convert-to-jpg).** Інструмент автоматично підкладає білий фон під прозорі ділянки PNG, WebP, BMP і HEIC/HEIF ще до перекодування в JPG — чорний фон просто не встигає з'явитися.",
            "**Додайте фото** — до 20 файлів за раз, до 30 МБ кожен.",
            "**Завантажте результат.** Якість JPG — 90%, фон під прозорими ділянками — білий; якщо потрібен інший колір фону, підкладіть його заздалегідь у будь-якому графічному редакторі — сам сайт колір фону не змінює.",
          ],
        },
        {
          heading: "Що робити, якщо фото вже збереглося з чорним фоном",
          paragraphs: [
            "Якщо файл уже конвертувався і чорний фон уже «впечений» у пікселі готового JPG — відновити прозорість неможливо: альфа-канал остаточно втрачається в момент першої конвертації. Доведеться повернутися до оригінального PNG (чи іншого файлу з прозорістю) і конвертувати його ще раз — цього разу інструментом, який коректно підкладає білий фон.",
          ],
        },
        {
          heading: "А чи стосується це інших форматів",
          paragraphs: [
            "Та ж історія з WebP і BMP: обидва можуть містити прозорість, а JPG не підтримує її в принципі. HEIC/HEIF з iPhone теж іноді мають альфа-канал — наприклад, скріншот із вирізаним фоном. Конвертер на сайті підкладає білий фон однаково для всіх цих форматів, а не лише для PNG.",
          ],
        },
      ],
      faq: [
        {
          q: "Чому фон став саме чорним, а не, наприклад, білим?",
          a: "Браузерний canvas, через який відбувається перекодування в більшості онлайн-конвертерів, за замовчуванням трактує незаторкнутий піксель як повністю прозорий чорний. Коли JPG зберігається без альфа-каналу, прозорість просто відкидається, і лишається саме чорний колір. Наш конвертер підкладає білий фон до того, як це станеться, тож чорного кольору в результаті немає.",
        },
        {
          q: "Чи можна отримати інший колір фону, не білий?",
          a: "Інструмент на сайті завжди підкладає білий — найуніверсальніший варіант для документів, друку й соцмереж. Якщо потрібен інший колір, підкладіть його вручну в графічному редакторі перед конвертацією.",
        },
        {
          q: "Чи псується якість фото під час цієї конвертації?",
          a: "Саме зображення (крім прозорих ділянок, які стають білими) перекодовується в JPG із якістю 90% — помітно вище за типові 70–80%, які деякі інші онлайн-конвертери ставлять за замовчуванням.",
        },
        {
          q: "А WebP чи HEIC із прозорістю матимуть ту саму проблему?",
          a: "Так, той самий принцип: будь-який формат з альфа-каналом (WebP, HEIC/HEIF, BMP із прозорістю) при конвертації в JPG без явного фону отримає чорні ділянки замість прозорих. Конвертер на сайті обробляє всі ці формати однаково.",
        },
        {
          q: "Чи надсилається фото на сервер під час конвертації?",
          a: "Ні. Конвертація відбувається локально у вашому браузері — файл нікуди не вивантажується.",
        },
      ],
      cta: {
        text: "Конвертувати PNG у JPG без чорного фону",
        sub: "Безкоштовно, без реєстрації, прямо в браузері.",
      },
    },
    en: {
      title: "Transparent PNG Turned Black in JPG: Why, and the Fix",
      description:
        "Converted a transparent PNG to JPG and got a solid black background? Here's why that happens, and a converter that fills white automatically instead.",
      h1: "Why a Transparent PNG Turns Black After Converting to JPG",
      lead: [
        "You compressed a logo or a screenshot saved as a transparent PNG, converted it to JPG — and instead of transparency you got a solid black background. That's not a broken file or a converter glitch; it's a quirk of the JPEG format itself.",
        "Below: why this happens with any PNG that has transparency, and how to convert it so you get a white background (or any other color, if you fill it in beforehand) instead of an unpredictable black patch.",
      ],
      sections: [
        {
          heading: "Why transparency turns into black specifically",
          paragraphs: [
            "JPEG simply can't store transparency (an alpha channel) at all — every pixel is just a color, with no \"how transparent\" value. When a converter turns a PNG into a JPG, the transparent pixels have to be replaced with something. If the tool doesn't explicitly fill in a background color first, the empty area gets whatever the browser's canvas defaults to — and an untouched pixel there is, by spec, fully transparent black (rgba(0,0,0,0)). Once the file is saved as JPG without an alpha channel, the transparency is simply dropped, and that black color is what remains.",
          ],
        },
        {
          heading: "How to check before you convert",
          steps: [
            "Open the PNG in a viewer that shows transparency as a grey-and-white checkerboard (how Windows/macOS file previews or a browser show it) — if you see that pattern around the subject, that's transparency, and it will turn black without the right background.",
            "If you don't have time to check, just use a converter that fills in a white background automatically (below), and the problem never comes up.",
          ],
        },
        {
          heading: "How to convert PNG to JPG without the black background",
          steps: [
            "**Open [Convert to JPG](/convert-to-jpg).** The tool automatically fills transparent areas of PNG, WebP, BMP and HEIC/HEIF with white before re-encoding to JPG, so a black background never gets the chance to appear.",
            "**Add your photos** — up to 20 files at a time, up to 30 MB each.",
            "**Download the result.** JPG quality is 90%, and the background under transparent areas is white; if you need a different color, fill it in yourself in an image editor beforehand — the site itself doesn't change the background color.",
          ],
        },
        {
          heading: "What if the photo already saved with a black background",
          paragraphs: [
            "If the file was already converted and the black background is baked into the finished JPG's pixels, there's no way to recover the transparency — the alpha channel is permanently lost the moment the first conversion happens. You'll need to go back to the original PNG (or another file that still has transparency) and convert it again, this time with a tool that fills the background correctly.",
          ],
        },
        {
          heading: "Does this affect other formats too",
          paragraphs: [
            "Same story with WebP and BMP: both can hold transparency, and JPG simply doesn't support it at all. HEIC/HEIF photos from an iPhone sometimes have an alpha channel too — for example, a screenshot with the background cut out. The converter on this site fills in a white background the same way for all of these formats, not just PNG.",
          ],
        },
      ],
      faq: [
        {
          q: "Why did the background turn black specifically, not white?",
          a: "The browser canvas that most online converters use for re-encoding treats an untouched pixel as fully transparent black by default. Once the JPG is saved without an alpha channel, the transparency is simply dropped and the color left behind is black. Our converter fills in white before that happens, so no black ever appears in the result.",
        },
        {
          q: "Can I get a different background color instead of white?",
          a: "The tool on this site always fills in white — the safest default for documents, printing and social media. If you need another color, fill it in yourself in an image editor before converting.",
        },
        {
          q: "Does this conversion reduce photo quality?",
          a: "The image itself (apart from the transparent areas, which become white) is re-encoded to JPG at 90% quality — noticeably higher than the 70-80% some other online converters use by default.",
        },
        {
          q: "Will WebP or HEIC files with transparency have the same problem?",
          a: "Yes, same principle: any format with an alpha channel (WebP, HEIC/HEIF, BMP with transparency) gets black areas instead of transparent ones when converted to JPG without an explicit background fill. The tool on this site handles all of these formats the same way.",
        },
        {
          q: "Is my photo uploaded to a server during conversion?",
          a: "No. The conversion happens locally in your browser — the file is never uploaded anywhere.",
        },
      ],
      cta: {
        text: "Convert PNG to JPG without a black background",
        sub: "Free, no sign-up, runs entirely in your browser.",
      },
    },
  },
  {
    // round 41: шоста стаття блогу. Факти про розмір WebP — developers.google.com/speed/webp;
    // Photoshop 23.2 — helpx.adobe.com/photoshop/kb/support-webp-image-format.html.
    // Поведінка конвертера (білий фон, 90%, 20 файлів × 30 МБ, локально) звірена з
    // src/components/Convertal/convertToJpg.jsx і PanelFile/Panel.jsx; PNG зберігає
    // прозорість — ConvertPng/convertToPng.js (без заливки фону).
    slug: "blogWebpToJpg",
    path: "what-is-webp-how-to-open-convert-to-jpg",
    published: "2026-10-28",
    tool: "/convert-to-jpg",
    linkedFrom: ["convert", "webp", "convertToPng"],
    uk: {
      title: "WebP: що це за формат, чим відкрити і як зробити JPG",
      description:
        "Зберегли картинку з сайту, а вона у форматі WebP і не відкривається? Пояснюємо, що це за формат, чим його відкрити і як перетворити в JPG без програм.",
      h1: "WebP: що це за формат, чим його відкрити і як перетворити в JPG",
      lead: [
        "Ви зберегли картинку з сайту, а замість звичного JPG отримали файл `.webp`. Стара програма його не відкриває, а форма на сайті не приймає.",
        "Розбираємо, звідки береться WebP, чим його переглянути на комп'ютері й телефоні та як отримати звичайний JPG.",
      ],
      sections: [
        {
          heading: "Що таке WebP",
          paragraphs: [
            "WebP — формат зображень, який Google представила у 2010 році. Його створили, щоб сторінки вантажилися швидше.",
            "За даними Google, WebP зі стисненням із втратами на 25–34% менший за JPG тієї ж якості. Без втрат він на 26% менший за PNG.",
            "Формат уміє зберігати прозорий фон, як PNG, і анімацію, як GIF. Тому сайти охоче віддають картинки саме в ньому.",
          ],
        },
        {
          heading: "Чому картинка з сайту зберігається як WebP",
          paragraphs: [
            "Браузер зберігає файл у тому форматі, в якому його надіслав сайт. Якщо сайт віддає WebP, ви отримаєте WebP, хоч на сторінці це виглядало як звичайне фото.",
            "Просто змінити розширення з `.webp` на `.jpg` не допоможе. Усередині файл лишиться WebP, і програма, яка не знає цього формату, видасть помилку.",
          ],
        },
        {
          heading: "Чим відкрити WebP",
          steps: [
            "**Браузер.** Перетягніть файл у вкладку Chrome, Edge, Firefox або Safari. Усі вони показують WebP.",
            "**Windows.** Застосунок «Фотографії» в Windows 11 відкриває WebP. Якщо файл не відкривається, встановіть безкоштовне розширення Webp Image Extensions від Microsoft у Microsoft Store.",
            "**macOS.** Відкрийте файл у «Перегляді» (Preview). Там же можна зберегти копію в JPEG: «Файл» → «Експортувати».",
            "**Photoshop.** Повна підтримка WebP з'явилась у версії 23.2. Старішим версіям потрібен окремий плагін.",
            "**Телефон.** Галерея на Android і «Фото» на iPhone зазвичай показують WebP. Проблеми виникають пізніше, коли файл треба кудись надіслати.",
          ],
        },
        {
          heading: "Як перетворити WebP у JPG онлайн",
          steps: [
            "Відкрийте [«Конвертувати в JPG»](/convert-to-jpg) і додайте файли. За раз можна до 20 штук, кожен до 30 МБ.",
            "Конвертація почнеться сама. Файли обробляються у вашому браузері й не вивантажуються на сервер.",
            "Завантажте результат. Якість JPG — 90%. Прозорі ділянки стануть білими, бо JPG не зберігає прозорість.",
          ],
        },
        {
          heading: "WebP, JPG чи PNG: що обрати",
          paragraphs: [
            "JPG потрібен, коли файл приймає форма на сайті, фотодрук або стара програма. Його відкриває будь-який пристрій.",
            "Якщо в картинці прозорий фон, наприклад у логотипі, перетворіть її [у PNG](/convert-to-png). PNG збереже прозорість, але файл буде більшим.",
            "Для власного сайту краще навпаки: [конвертуйте фото у WebP](/convert-to-webp), щоб сторінки вантажилися швидше.",
          ],
        },
      ],
      faq: [
        {
          q: "Чому JPG вийшов більшим за WebP?",
          a: "Так і має бути: WebP стискає ефективніше, тож та сама картинка в JPG важить більше. Якщо сайт обмежує розмір, стисніть JPG [до потрібної кількості КБ](/compress-image-to-size).",
        },
        {
          q: "Чи погіршиться якість після конвертації?",
          a: "Помітно — ні. Картинка перекодовується з якістю 90%, тож різницю на око побачити важко. Але кращою за оригінальний WebP вона не стане.",
        },
        {
          q: "Що буде з анімованим WebP?",
          a: "JPG не підтримує анімацію, тож у файлі лишиться один кадр. Для анімації потрібен інший формат, наприклад GIF або відео.",
        },
        {
          q: "Можна конвертувати кілька WebP одразу?",
          a: "Так, до 20 файлів за раз. Якщо файлів кілька, готові JPG завантажуються одним ZIP-архівом.",
        },
        {
          q: "Чи бачить хтось мої файли під час конвертації?",
          a: "Ні. Конвертер працює у вашому браузері, файли нікуди не надсилаються.",
        },
      ],
      cta: {
        text: "Перетворити WebP у JPG",
        sub: "Безкоштовно, без реєстрації, файли не покидають ваш пристрій.",
      },
    },
    en: {
      title: "What Is WebP, How to Open It and Convert It to JPG",
      description:
        "Saved an image and got a WebP file that won't open? Learn what WebP is, which apps open it on any device, and how to turn it into a JPG for free online.",
      h1: "What Is WebP, How to Open It and How to Convert It to JPG",
      lead: [
        "You saved an image from a website and got a `.webp` file instead of a JPG. An older app won't open it, and an upload form rejects it.",
        "Here's where WebP comes from, how to view it on a computer or phone, and how to get a regular JPG.",
      ],
      sections: [
        {
          heading: "What WebP is",
          paragraphs: [
            "WebP is an image format Google introduced in 2010. It was designed to make web pages load faster.",
            "According to Google, lossy WebP files are 25–34% smaller than JPGs of comparable quality. Lossless WebP is 26% smaller than PNG.",
            "WebP can also store a transparent background like PNG and animation like GIF. That's why so many sites now serve images in it.",
          ],
        },
        {
          heading: "Why images from websites save as WebP",
          paragraphs: [
            "Your browser saves a file in whatever format the site sent. If the site serves WebP, you get WebP, even if it looked like an ordinary photo on the page.",
            "Renaming `.webp` to `.jpg` won't help. The data inside is still WebP, and an app that doesn't support the format will still show an error.",
          ],
        },
        {
          heading: "How to open a WebP file",
          steps: [
            "**Browser.** Drag the file into a Chrome, Edge, Firefox or Safari tab. All of them display WebP.",
            "**Windows.** The Photos app in Windows 11 opens WebP. If it doesn't, install the free Webp Image Extensions from Microsoft in the Microsoft Store.",
            "**macOS.** Open the file in Preview. You can save a JPEG copy from there with File → Export.",
            "**Photoshop.** Full WebP support arrived in version 23.2. Older versions need a separate plug-in.",
            "**Phone.** Android galleries and iPhone Photos usually display WebP. The trouble starts when you need to send the file somewhere.",
          ],
        },
        {
          heading: "How to convert WebP to JPG online",
          steps: [
            "Open [Convert to JPG](/convert-to-jpg) and add your files: up to 20 at a time, up to 30 MB each.",
            "Conversion starts on its own. Files are processed in your browser and are never uploaded to a server.",
            "Download the result. JPG quality is 90%. Transparent areas turn white, because JPG can't store transparency.",
          ],
        },
        {
          heading: "WebP, JPG or PNG: which to use",
          paragraphs: [
            "Use JPG when a website form, a photo printer or an older app needs the file. Every device can open it.",
            "If the image has a transparent background, such as a logo, convert it [to PNG](/convert-to-png) instead. PNG keeps the transparency, but the file is larger.",
            "For your own website it's the other way round: [convert photos to WebP](/convert-to-webp) so your pages load faster.",
          ],
        },
      ],
      faq: [
        {
          q: "Why is the JPG bigger than the WebP?",
          a: "That's expected: WebP compresses more efficiently, so the same picture weighs more as a JPG. If a site has a size limit, compress the JPG [to an exact size in KB](/compress-image-to-size).",
        },
        {
          q: "Will the quality drop after conversion?",
          a: "Not noticeably. The image is re-encoded at 90% quality, so the difference is hard to see. It won't look better than the original WebP, though.",
        },
        {
          q: "What happens to an animated WebP?",
          a: "JPG doesn't support animation, so you get a single frame. To keep the motion, you need another format such as GIF or video.",
        },
        {
          q: "Can I convert several WebP files at once?",
          a: "Yes, up to 20 files at a time. With several files, the finished JPGs download together as one ZIP archive.",
        },
        {
          q: "Can anyone see my files during conversion?",
          a: "No. The converter runs in your browser, and your files aren't sent anywhere.",
        },
      ],
      cta: {
        text: "Convert WebP to JPG",
        sub: "Free, no sign-up, your files never leave your device.",
      },
    },
  },
];

export const blogPostPath = (post, lang) =>
  lang === "uk" ? `/blog/${post.path}` : `/${lang}/blog/${post.path}`;

/** Маршрути блогу для routes.config.js: індекс + статті, лише uk/en */
export const BLOG_ROUTE_PATHS = [
  { slug: BLOG_INDEX_SLUG, uk: "/blog", en: "/en/blog" },
  ...BLOG_POSTS.map((post) => ({
    slug: post.slug,
    uk: blogPostPath(post, "uk"),
    en: blogPostPath(post, "en"),
  })),
];

/** title/description для PAGE_META (seoMeta.js) */
export const BLOG_META = {
  [BLOG_INDEX_SLUG]: Object.fromEntries(
    BLOG_LANGS.map((l) => [l, { title: BLOG_INDEX[l].title, description: BLOG_INDEX[l].description }])
  ),
  ...Object.fromEntries(
    BLOG_POSTS.map((post) => [
      post.slug,
      Object.fromEntries(
        BLOG_LANGS.map((l) => [l, { title: post[l].title, description: post[l].description }])
      ),
    ])
  ),
};

export const blogPostBySlug = (slug) => BLOG_POSTS.find((p) => p.slug === slug);

/** Статті, на які варто послатися зі сторінки інструмента */
export const postsForTool = (toolSlug) =>
  BLOG_POSTS.filter((p) => p.linkedFrom.includes(toolSlug));

const stripMarkup = (s) =>
  String(s)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`]/g, "");

/** Хвилини читання (≈200 слів/хв, мінімум 1) */
export const readingMinutes = (post, lang) => {
  const c = post[lang];
  const parts = [
    ...c.lead,
    ...c.sections.flatMap((s) => [s.heading, ...(s.paragraphs || []), ...(s.steps || [])]),
    ...c.faq.flatMap((f) => [f.q, f.a]),
  ];
  const words = parts
    .map(stripMarkup)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/** 2026-10-18 → «18 жовтня 2026 р.» / "October 18, 2026" */
export const formatBlogDate = (iso, lang) =>
  new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
