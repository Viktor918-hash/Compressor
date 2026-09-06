import { supabase } from "../../lib/supabaseClient";
import { getAnonId } from "../../utils/anonId";
import i18n from "../../i18n/i18n";

// PDF-документи не можна коректно конвертувати в редаговане Word прямо в
// браузері (немає рушія розпізнавання макету/тексту), тому файл
// відправляється на наш серверний проксі /api/pdf-to-word, який вже сам
// звертається до CloudConvert і повертає готовий DOCX. Ключ CloudConvert
// живе тільки на сервері.
export const convertPdfToWord = async (file) => {
  const anonId = getAnonId();

  // Якщо користувач залогінений — додаємо його токен, щоб бекенд міг
  // порахувати ліміт "зареєстрований" (більше конвертацій на день), а не
  // "гість".
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    "Content-Type": file.type || "application/pdf",
    "X-Filename": encodeURIComponent(file.name),
    "X-Anon-Id": anonId,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/pdf-to-word", {
    method: "POST",
    headers,
    body: file,
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(
      data.isGuest ? i18n.t("wordToPdf.limit") : i18n.t("wordToPdf.limit2")
    );
    error.code = "LIMIT_REACHED";
    error.isGuest = !!data.isGuest;
    throw error;
  }

  if (!response.ok) {
    let message = `Не вдалося конвертувати "${file.name}" у Word.`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // тіло не JSON — лишаємо повідомлення за замовчуванням
    }
    throw new Error(message);
  }

  return await response.blob();
};

// Міняє будь-яке розширення (.pdf) на .docx
export const getDocxOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.docx`;
};
