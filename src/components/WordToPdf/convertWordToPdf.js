import { supabase } from "../../lib/supabaseClient";
import { getAnonId } from "../../utils/anonId";
import { useTranslation } from "react-i18next";

// Word-документи не можна конвертувати в PDF прямо в браузері (немає рушія
// верстки сторінок), тому файл відправляється на наш серверний проксі
// /api/word-to-pdf, який вже сам звертається до CloudConvert і повертає
// готовий PDF. Ключ CloudConvert живе тільки на сервері.
export const convertWordToPdf = async (file) => {
  const anonId = getAnonId();
  const { t } = useTranslation();

  // Якщо користувач залогінений — додаємо його токен, щоб бекенд міг
  // порахувати ліміт "зареєстрований" (більше конвертацій на день), а не
  // "гість".
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    "Content-Type": file.type || "application/octet-stream",
    "X-Filename": encodeURIComponent(file.name),
    "X-Anon-Id": anonId,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/word-to-pdf", {
    method: "POST",
    headers,
    body: file,
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(
      data.isGuest ? t("wordToPdf.limit") : t("wordToPdf.limit2")
    );
    error.code = "LIMIT_REACHED";
    error.isGuest = !!data.isGuest;
    throw error;
  }

  if (!response.ok) {
    let message = `Не вдалося конвертувати "${file.name}" у PDF.`;
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

// Міняє будь-яке розширення (.doc, .docx) на .pdf
export const getPdfOutputName = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  return `${baseName}.pdf`;
};
