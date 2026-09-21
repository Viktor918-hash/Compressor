import { useTranslation } from "react-i18next";
import { OCR_LANGS, OCR_MAX_LANGS } from "./imageToText";
import "./OcrLanguagePicker.css";

/**
 * Вибір мов тексту на фото (1…OCR_MAX_LANGS). Мова інтерфейсу сторінки
 * не дорівнює мові тексту на зображенні (український скріншот на /en),
 * тому вибір — за користувачем.
 */
const OcrLanguagePicker = ({ value, onChange }) => {
  const { t } = useTranslation();
  const atMax = value.length >= OCR_MAX_LANGS;

  const toggle = (code) => {
    if (value.includes(code)) {
      if (value.length === 1) return; // хоча б одна мова
      onChange(value.filter((c) => c !== code));
    } else if (!atMax) {
      onChange([...value, code]);
    }
  };

  return (
    <fieldset className="ocr-langs">
      <legend className="ocr-langs__title">{t("imageToText.langs.title")}</legend>
      <div className="ocr-langs__list">
        {OCR_LANGS.map(({ code, label }) => {
          const checked = value.includes(code);
          const disabled = !checked && atMax;
          return (
            <label
              key={code}
              className={`ocr-langs__chip ${disabled ? "ocr-langs__chip--disabled" : ""}`}
            >
              <input
                type="checkbox"
                className="visually-hidden"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(code)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
      <p className="ocr-langs__hint">
        {t("imageToText.langs.hint", { max: OCR_MAX_LANGS })}
      </p>
    </fieldset>
  );
};

export default OcrLanguagePicker;
