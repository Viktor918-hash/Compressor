import { useId } from "react";
import { useTranslation } from "react-i18next";
import "./VideoSizePicker.css";

// Готові цілі в МБ. Клік по чипсу одночасно перемикає режим на "custom"
// і підставляє число в інпут — той самий паттерн, що й у TargetSizePicker
// (CompressToSize), лише в МБ замість КБ (відео завжди важить значно
// більше за фото, тож дрібніші одиниці тут не мають сенсу).
const SIZE_CHIPS_MB = [25, 50, 100, 200, 500];

/**
 * Перемикач "Рекомендовано" (автоматично, безпечний дефолт до 720p) /
 * "Свій розмір" (цільовий розмір файлу в МБ — число вводить користувач).
 * Той самий візуальний паттерн, що й TargetSizePicker у CompressToSize.
 *
 * targetMB — рядок (щоб можна було стерти й ввести число заново).
 * invalid — true, лише коли введене число некоректне (не перевіряє його
 *   проти розміру конкретного файлу — виклик, що передає конкретний
 *   file.size, сам порівнює ціль із розміром і показує окреме
 *   повідомлення "ціль більша за файл", якщо треба).
 * compact — вужчий вигляд (менші відступи/шрифт) для використання
 *   всередині одного рядка файлу в бічній панелі (round 28: вибір
 *   розміру окремо для кожного відео, а не один спільний на всі файли).
 */
const VideoSizePicker = ({
  mode,
  targetMB,
  onModeChange,
  onTargetChange,
  invalid,
  compact = false,
}) => {
  const { t } = useTranslation();
  const uid = useId();
  const valueId = `${uid}-value`;
  const hintId = `${uid}-hint`;

  const selectCustom = (mb) => {
    onModeChange("custom");
    onTargetChange(String(mb));
  };

  return (
    <fieldset
      className={`video-size-picker${compact ? " video-size-picker--compact" : ""}`}
    >
      <legend className="video-size-picker__title">
        {t("compressVideo.size.title")}
      </legend>

      <div
        className="video-size-picker__chips"
        role="group"
        aria-label={t("compressVideo.size.title")}
      >
        <button
          type="button"
          className={`video-size-picker__chip${
            mode === "recommended" ? " video-size-picker__chip--active" : ""
          }`}
          aria-pressed={mode === "recommended"}
          onClick={() => onModeChange("recommended")}
        >
          {t("compressVideo.size.recommended")}
        </button>
        {SIZE_CHIPS_MB.map((mb) => {
          const pressed = mode === "custom" && Number(targetMB) === mb;
          return (
            <button
              key={mb}
              type="button"
              className={`video-size-picker__chip${
                pressed ? " video-size-picker__chip--active" : ""
              }`}
              aria-pressed={pressed}
              onClick={() => selectCustom(mb)}
            >
              {mb} {t("compressVideo.size.mb")}
            </button>
          );
        })}
      </div>

      <div className="video-size-picker__custom">
        <label className="video-size-picker__label" htmlFor={valueId}>
          {t("compressVideo.size.custom")}
        </label>
        <input
          id={valueId}
          className="video-size-picker__input"
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          value={targetMB}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          onFocus={() => {
            if (mode !== "custom") onModeChange("custom");
          }}
          onChange={(e) => {
            onModeChange("custom");
            onTargetChange(e.target.value);
          }}
        />
        <span className="video-size-picker__unit">
          {t("compressVideo.size.mb")}
        </span>
      </div>

      <p
        id={hintId}
        className={`video-size-picker__hint${
          invalid ? " video-size-picker__hint--error" : ""
        }`}
        role={invalid ? "alert" : undefined}
      >
        {invalid
          ? t("compressVideo.errors.badTarget")
          : mode === "recommended"
          ? t("compressVideo.size.recommendedHint")
          : t("compressVideo.size.customHint")}
      </p>
    </fieldset>
  );
};

export default VideoSizePicker;
