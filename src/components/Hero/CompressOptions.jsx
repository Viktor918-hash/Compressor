import { useId } from "react";
import { useTranslation } from "react-i18next";
import "./CompressOptions.css";

const MIN_QUALITY = 40;
const MAX_QUALITY = 95;
const SIDE_CHOICES = [3840, 2560, 1920, 1280];

/**
 * Налаштування стиснення: якість (повзунок) і розмір.
 * За замовчуванням розмір зображення НЕ змінюється — стискається лише
 * якість JPEG/WebP (раніше фото 4000×3000 мовчки ставало 1824×1368).
 * Значення керує батьківський компонент (Hero).
 */
const CompressOptions = ({ value, onChange }) => {
  const { t } = useTranslation();
  const uid = useId();
  const { quality, keepSize, maxSide } = value;
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <fieldset className="compress-options">
      <legend className="visually-hidden">{t("hero.options.title")}</legend>

      <div className="compress-options__row">
        <label htmlFor={`${uid}-q`} className="compress-options__label">
          {t("hero.options.quality")}
          <output htmlFor={`${uid}-q`} className="compress-options__value">
            {quality}%
          </output>
        </label>
        <input
          id={`${uid}-q`}
          className="compress-options__range"
          type="range"
          min={MIN_QUALITY}
          max={MAX_QUALITY}
          step={5}
          value={quality}
          onChange={(e) => set({ quality: Number(e.target.value) })}
        />
      </div>

      <div className="compress-options__row compress-options__row--inline">
        <label className="compress-options__check">
          <input
            type="checkbox"
            checked={keepSize}
            onChange={(e) => set({ keepSize: e.target.checked })}
          />
          <span>{t("hero.options.keepSize")}</span>
        </label>

        {!keepSize && (
          <label className="compress-options__select-label">
            <span>{t("hero.options.maxSide")}</span>
            <select
              className="compress-options__select"
              value={maxSide}
              onChange={(e) => set({ maxSide: Number(e.target.value) })}
            >
              {SIDE_CHOICES.map((px) => (
                <option key={px} value={px}>
                  {px} px
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="compress-options__hint">{t("hero.options.hint")}</p>
    </fieldset>
  );
};

export default CompressOptions;
