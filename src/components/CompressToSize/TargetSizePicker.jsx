import { useId } from "react";
import { useTranslation } from "react-i18next";
import "./TargetSizePicker.css";

const SIZE_CHIPS_KB = [50, 100, 200, 500, 1000];

/**
 * Цільовий розмір (число + КБ/МБ, готові значення) і формат виходу.
 * value — рядок (щоб можна було стерти й ввести число заново).
 */
const TargetSizePicker = ({ value, unit, format, onSizeChange, onFormatChange, invalid }) => {
  const { t } = useTranslation();
  const uid = useId();
  const valueId = `${uid}-value`;
  const hintId = `${uid}-hint`;

  return (
    <fieldset className="target-size">
      <legend className="target-size__title">{t("compressToSize.target.title")}</legend>

      <div className="target-size__chips" role="group" aria-label={t("compressToSize.target.presets")}>
        {SIZE_CHIPS_KB.map((kb) => {
          const pressed = unit === "KB" && Number(value) === kb;
          return (
            <button
              key={kb}
              type="button"
              className={`target-size__chip${pressed ? " target-size__chip--active" : ""}`}
              aria-pressed={pressed}
              onClick={() => onSizeChange({ value: String(kb), unit: "KB" })}
            >
              {kb} {t("compressToSize.units.kb")}
            </button>
          );
        })}
      </div>

      <div className="target-size__custom">
        <label className="target-size__label" htmlFor={valueId}>
          {t("compressToSize.target.custom")}
        </label>
        <input
          id={valueId}
          className="target-size__input"
          type="number"
          inputMode="decimal"
          min="1"
          step="any"
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          onChange={(e) => onSizeChange({ value: e.target.value, unit })}
        />
        <select
          className="target-size__select"
          value={unit}
          aria-label={t("compressToSize.target.unit")}
          onChange={(e) => onSizeChange({ value, unit: e.target.value })}
        >
          <option value="KB">{t("compressToSize.units.kb")}</option>
          <option value="MB">{t("compressToSize.units.mb")}</option>
        </select>
      </div>

      <div className="target-size__format" role="radiogroup" aria-label={t("compressToSize.format.title")}>
        <span className="target-size__label">{t("compressToSize.format.title")}</span>
        {[
          { id: "jpeg", label: "JPEG" },
          { id: "webp", label: "WebP" },
        ].map(({ id, label }) => (
          <label key={id} className="target-size__radio">
            <input
              type="radio"
              className="visually-hidden"
              name={`${uid}-format`}
              value={id}
              checked={format === id}
              onChange={() => onFormatChange(id)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <p id={hintId} className={`target-size__hint${invalid ? " target-size__hint--error" : ""}`} role={invalid ? "alert" : undefined}>
        {invalid ? t("compressToSize.errors.badTarget") : t("compressToSize.target.hint")}
      </p>
    </fieldset>
  );
};

export default TargetSizePicker;
