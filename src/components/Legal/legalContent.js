// Чистий текстовий вміст довір-сторінок (Privacy/Terms/Contact/About).
// Навмисно НЕ через react-i18next: це великі блоки прози, а не UI-рядки, що
// повторюються в інтерфейсі (як header.*/panel.*) — тримати їх поруч одним
// файлом простіше й безпечніше для перекладу/вичитки, ніж розкидати по
// translation.json. Мінімальні ключі seoContent.<slug>.title/PAGE_META —
// окремо, у src/seoMeta.js і locales/*/translation.json (вимагає тест
// tests/i18n.test.mjs).
//
// Статус: чернетка, підготовлена Claude 04.10.2026 (детальніше —
// claude/compressphoto-legal-pages-draft.md у проєкті). Контактний email і
// юрисдикція нижче — обрані за замовчуванням за відсутності уточнення від
// власника сайту (див. CHANGES.md, цей раунд): email — реальна адреса
// власника, юрисдикція — навмисно нейтральна (без прив'язки до країни).
// ПЕРЕД монетизацією/збором платежів тексти має вичитати юрист.

export const CONTACT_EMAIL = "petrovich4114@gmail.com";
export const LAST_UPDATED = { uk: "18 жовтня 2026", en: "October 18, 2026" };

export const LEGAL_CONTENT = {
  privacy: {
    uk: {
      title: "Політика конфіденційності",
      intro:
        "CompressPhoto (compressphoto.org) — безкоштовний набір інструментів для роботи із зображеннями та документами. Ця політика пояснює, які дані ми отримуємо і що з ними відбувається.",
      sections: [
        {
          heading: "1. Обробка файлів",
          paragraphs: [
            "Більшість інструментів (стиснення, конвертація форматів, зміна розміру, обрізка, поворот, водяний знак, видалення фону, видалення метаданих, розпізнавання тексту, пресети) обробляють ваш файл повністю у вашому браузері. Файл не завантажується на наш сервер і не передається нам — ми фізично не маємо до нього доступу.",
            "Виняток 1: конвертація Word ↔ PDF, стиснення відео та конвертація відео у MP4 відбуваються не локально. Файл вивантажується напряму з вашого браузера до сервісу конвертації CloudConvert. Файл автоматично видаляється з серверів CloudConvert невдовзі після обробки, відповідно до стандартних налаштувань збереження CloudConvert. Ми не зберігаємо копій цих файлів і не переглядаємо їхній вміст.",
            "Виняток 2: тимчасові посилання. Лише якщо ви самі натискаєте «Посилання на 2 години», готовий файл вивантажується в сховище Cloudflare R2, і будь-хто, у кого є посилання, може його завантажити. Посилання перестає працювати рівно через 2 години; файл видаляється зі сховища автоматично — під час наступного прибирання, не пізніше ніж за добу. Ми не переглядаємо вміст цих файлів, окрім випадків, коли отримуємо скаргу на незаконний вміст.",
          ],
        },
        {
          heading: "2. Облікові записи",
          paragraphs: [
            `Якщо ви реєструєтесь (щоб отримати більший денний ліміт конвертацій Word/PDF), ми зберігаємо email і статус акаунта через Supabase — сервіс автентифікації та бази даних. Пароль ми не бачимо і не зберігаємо у відкритому вигляді. Ви можете видалити акаунт, написавши на ${CONTACT_EMAIL}.`,
          ],
        },
        {
          heading: "3. Аналітика (лише за згодою)",
          paragraphs: [
            "Ми використовуємо Google Analytics, щоб розуміти, які інструменти популярні. Аналітика вмикається лише після вашої згоди в банері cookie-згоди; без згоди жоден запит до Google Analytics не надсилається. Ми не передаємо в аналітику імена ваших файлів чи їх вміст. Ви можете відкликати згоду в будь-який момент через посилання «Налаштування cookies» у футері.",
          ],
        },
        {
          heading: "4. Ліміти та анти-зловживання",
          paragraphs: [
            "Щоб безкоштовний сервіс лишався доступним для всіх, ми рахуємо кількість конвертацій (Word/PDF, відео) і тимчасових посилань за технічним ідентифікатором (хеш IP-адреси, а для зареєстрованих — ідентифікатор акаунта). Ми не використовуємо цей ідентифікатор для профілювання — лише для лічильників «скільки сьогодні».",
          ],
        },
        {
          heading: "5. Треті сторони, що отримують дані",
          list: [
            "CloudConvert — конвертація Word↔PDF і відео: сам файл, тимчасово.",
            "Cloudflare (R2) — тимчасові посилання: сам файл, до 2 годин доступу (видалення не пізніше ніж за добу), лише якщо ви створили посилання.",
            "Supabase — акаунти й авторизація: email, хеш пароля.",
            "Vercel — хостинг сайту: стандартні серверні логи (IP, User-Agent).",
            "Google Analytics — статистика використання, лише за згодою: анонімізовані дані сесії.",
          ],
        },
        {
          heading: "6. Ваші права",
          paragraphs: [
            "Ви можете попросити видалити свій акаунт і дані, відкликати згоду на аналітику в будь-який момент, і дізнатись, які дані ми про вас зберігаємо — напишіть нам (розділ 7).",
          ],
        },
        {
          heading: "7. Контакти",
          paragraphs: [`Питання про приватність: ${CONTACT_EMAIL}`],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      intro:
        "CompressPhoto (compressphoto.org) is a free toolkit for image and document processing. This policy explains what data we receive and what happens to it.",
      sections: [
        {
          heading: "1. File processing",
          paragraphs: [
            "Most tools (compress, convert, resize, crop, rotate, watermark, background removal, metadata removal, OCR, presets) process your file entirely in your browser. The file is never uploaded to our server and we never have access to it.",
            "Exception 1: Word ↔ PDF conversion, video compression and video-to-MP4 conversion are not local. The file is uploaded directly from your browser to CloudConvert, our conversion provider. Files are automatically deleted from CloudConvert's servers shortly after processing, per CloudConvert's standard retention settings. We don't keep copies and don't inspect their content.",
            "Exception 2: temporary links. Only if you click \"2-hour link\" is the processed file uploaded to Cloudflare R2 storage, where anyone with the link can download it. The link stops working exactly 2 hours later; the file is deleted from storage automatically at the next cleanup, within 24 hours at the latest. We don't inspect these files unless we receive a report about unlawful content.",
          ],
        },
        {
          heading: "2. Accounts",
          paragraphs: [
            "If you create an account (to get a higher daily Word/PDF conversion limit), we store your email and account status via Supabase, our authentication and database provider. We never see your password in plain text. You can request account deletion by emailing us (see Contact below).",
          ],
        },
        {
          heading: "3. Analytics (consent-gated)",
          paragraphs: [
            "We use Google Analytics to understand which tools are popular. Analytics only loads after you accept our cookie consent banner; without consent, no request to Google Analytics is ever sent. We never send file names or file content to analytics. You can withdraw consent at any time via the \"Cookie settings\" link in the footer.",
          ],
        },
        {
          heading: "4. Limits & abuse prevention",
          paragraphs: [
            "To keep the free service available to everyone, we count daily conversions (Word/PDF, video) and temporary links using a technical identifier (a hashed IP address, or your account ID if you're signed in). We don't use this identifier for profiling — only for the \"used today\" counters.",
          ],
        },
        {
          heading: "5. Third parties that may receive data",
          list: [
            "CloudConvert — Word↔PDF and video conversion: the file itself, temporarily.",
            "Cloudflare (R2) — temporary links: the file itself, accessible for up to 2 hours (deleted within 24 hours at the latest), only if you create a link.",
            "Supabase — accounts & authentication: email, hashed password.",
            "Vercel — site hosting: standard server logs (IP, user agent).",
            "Google Analytics — usage statistics, consent-gated: anonymized session data.",
          ],
        },
        {
          heading: "6. Your rights",
          paragraphs: [
            "You can ask us to delete your account and data, withdraw analytics consent at any time, and ask what data we hold about you — see Contact below.",
          ],
        },
        {
          heading: "7. Contact",
          paragraphs: [`Privacy questions: ${CONTACT_EMAIL}`],
        },
      ],
    },
  },
  terms: {
    uk: {
      title: "Умови використання",
      intro:
        "CompressPhoto (compressphoto.org) надає безкоштовні онлайн-інструменти для обробки зображень і документів. Сервіс надається «як є», без гарантій безперебійної роботи.",
      sections: [
        {
          heading: "1. Використання",
          list: [
            "Сервіс безкоштовний для особистого й комерційного використання в межах звичайного обсягу.",
            "Гостьовий ліміт на конвертацію Word/PDF — 3 на добу; з акаунтом — 6 на добу. Ліміти можуть змінюватись.",
            "Заборонено: автоматизоване масове використання (боти, скрипти) з метою обійти ліміти; спроби зламати, перевантажити чи іншим чином зашкодити роботі сервісу; завантаження файлів, на які у вас немає прав, або файлів із протиправним вмістом.",
            "Тимчасові посилання призначені лише для того, щоб передати результат обробки. За вміст файлу, яким ви ділитеся, відповідаєте ви. Ми видаляємо файл і блокуємо посилання, щойно дізнаємося про протиправний вміст (скарги — через сторінку «Контакти»).",
          ],
        },
        {
          heading: "2. Ваші файли",
          paragraphs: [
            "Файли, які ви обробляєте через клієнтські інструменти, не потрапляють на наш сервер — ви лишаєтесь єдиним власником і відповідальним за їхній вміст. Для Word↔PDF (серверна обробка) — те саме: ми не претендуємо на жодні права на вміст файлу і видаляємо копії автоматично (див. Політику конфіденційності).",
          ],
        },
        {
          heading: "3. Відмова від відповідальності",
          paragraphs: [
            "Сервіс надається «як є». Ми не гарантуємо, що результат обробки буде ідеальним для будь-якого конкретного випадку використання (наприклад, точність OCR або форматування при конвертації Word↔PDF залежить від вхідного файлу). Ми не несемо відповідальності за втрату даних чи будь-які збитки, що виникли через використання сервісу, в межах, дозволених застосовним законодавством.",
          ],
        },
        {
          heading: "4. Зміни умов",
          paragraphs: [
            "Ми можемо оновлювати ці умови; суттєві зміни позначатимемо датою останньої редакції вгорі сторінки.",
          ],
        },
        {
          heading: "5. Контакти",
          paragraphs: [`Питання щодо умов використання: ${CONTACT_EMAIL}`],
        },
      ],
    },
    en: {
      title: "Terms of Service",
      intro:
        "CompressPhoto (compressphoto.org) provides free online tools for image and document processing. The service is provided \"as is,\" without uptime guarantees.",
      sections: [
        {
          heading: "1. Use of the service",
          list: [
            "The service is free for personal and commercial use within normal volume.",
            "Guest users get 3 Word/PDF conversions per day; registered users get 6. Limits may change.",
            "Prohibited: automated bulk use (bots, scripts) to bypass limits; attempting to break, overload, or otherwise disrupt the service; uploading files you don't have rights to, or files with unlawful content.",
            "Temporary links are meant only for handing over a processing result. You are responsible for the content of files you share. We delete the file and disable the link as soon as we learn about unlawful content (report it via the Contact page).",
          ],
        },
        {
          heading: "2. Your files",
          paragraphs: [
            "Files you process through client-side tools never reach our server — you remain the sole owner and are responsible for their content. The same applies to Word↔PDF (server-side processing): we claim no rights over the file content and copies are deleted automatically (see our Privacy Policy).",
          ],
        },
        {
          heading: "3. Disclaimer",
          paragraphs: [
            "The service is provided \"as is.\" We don't guarantee the processing result will be perfect for any particular use case (for example, OCR accuracy or Word↔PDF formatting fidelity depends on your input file). We are not liable for data loss or any damages arising from use of the service, to the extent permitted by applicable law.",
          ],
        },
        {
          heading: "4. Changes to these terms",
          paragraphs: [
            "We may update these terms; the date at the top of the page will reflect the latest revision.",
          ],
        },
        {
          heading: "5. Contact",
          paragraphs: [`Questions about these terms: ${CONTACT_EMAIL}`],
        },
      ],
    },
  },
  contact: {
    uk: {
      title: "Контакти",
      intro:
        "Питання, пропозиції, звіти про помилки чи запити щодо приватності — пишіть нам напряму.",
      sections: [
        {
          heading: "Зв'язатися з нами",
            paragraphs: [`Email: ${CONTACT_EMAIL}`, "Відповідаємо зазвичай протягом кількох робочих днів."],
        },
      ],
    },
    en: {
      title: "Contact",
      intro:
        "Questions, suggestions, bug reports, or privacy requests — reach out directly.",
      sections: [
        {
          heading: "Get in touch",
            paragraphs: [`Email: ${CONTACT_EMAIL}`, "We usually reply within a few business days."],
        },
      ],
    },
  },
  about: {
    uk: {
      title: "Про CompressPhoto",
      intro:
        "CompressPhoto — набір безкоштовних онлайн-інструментів для роботи з фото й документами: стиснення, конвертація форматів, зміна розміру, обрізка, поворот, водяний знак, видалення фону, видалення метаданих, розпізнавання тексту, конвертація Word↔PDF і більше.",
      sections: [
        {
          heading: "Чому локальна обробка — це важливо",
          paragraphs: [
            "Більшість інструментів на цьому сайті обробляють ваш файл прямо у вашому браузері — він ніколи не завантажується на жоден сервер. Це означає: швидше (немає очікування завантаження), приватніше (ваші фото й документи лишаються лише на вашому пристрої) і без обмежень на кількість використань.",
          ],
        },
        {
          heading: "Мови",
          paragraphs: ["Сервіс доступний українською, English, Español і русском мовами."],
        },
        {
          heading: "Питання чи пропозиція?",
          paragraphs: [`Пишіть: ${CONTACT_EMAIL}`],
        },
      ],
    },
    en: {
      title: "About CompressPhoto",
      intro:
        "CompressPhoto is a free online toolkit for photos and documents: compression, format conversion, resizing, cropping, rotating, watermarking, background removal, metadata removal, OCR, Word↔PDF conversion, and more.",
      sections: [
        {
          heading: "Why local processing matters",
          paragraphs: [
            "Most tools on this site run entirely in your browser — your file never touches a server. That means faster processing (no upload wait), better privacy (your photos and documents stay on your device), and no cap on how many times you can use them.",
          ],
        },
        {
          heading: "Languages",
          paragraphs: ["Available in Ukrainian, English, Spanish, and Russian."],
        },
        {
          heading: "Questions or suggestions?",
          paragraphs: [`Email: ${CONTACT_EMAIL}`],
        },
      ],
    },
  },
};
