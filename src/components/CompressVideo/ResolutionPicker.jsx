import { useTranslation } from "react-i18next";
import "./ResolutionPicker.css";

// Готові висоти для "Свого розміру". Фактична роздільність файлу, який
// уже менший за обраний варіант, не апскейлиться — convertCompressVideo.js
// (scaleToHeight) завжди обрізає ціль до реальної висоти відео.
const PRESETS = ["1080", "720", "480", "360"];

/**
 * Перемикач "Рекомендовано" (автоматично, до 720p) / "Свій розмір"
 * (конкретна висота). Той самий візуальний паттерн, що й TargetSizePicker
 * у CompressToSize — чипси + підказка під низом.
 */
const ResolutionPicker = ({ mode, onModeChange }) => {
  const { t } = useTranslation();

  return (
    <fieldset className="resolution-picker">
      <legend className="resolution-picker__title">
        {t("compressVideo.resolution.title")}
      </legend>

      <div
        className="resolution-picker__chips"
        role="group"
        aria-label={t("compressVideo.resolution.title")}
      >
        <button
          type="button"
          className={`resolution-picker__chip${
            mode === "recommended" ? " resolution-picker__chip--active" : ""
          }`}
          aria-pressed={mode === "recommended"}
          onClick={() => onModeChange("recommended")}
        >
          {t("compressVideo.resolution.recommended")}
        </button>
        {PRESETS.map((height) => (
          <button
            key={height}
            type="button"
            className={`resolution-picker__chip${
              mode === height ? " resolution-picker__chip--active" : ""
            }`}
            aria-pressed={mode === height}
            onClick={() => onModeChange(height)}
          >
            {height}p
          </button>
        ))}
      </div>

      <p className="resolution-picker__hint">
        {mode === "recommended"
          ? t("compressVideo.resolution.recommendedHint")
          : t("compressVideo.resolution.customHint")}
      </p>
    </fieldset>
  );
};

export default ResolutionPicker;
