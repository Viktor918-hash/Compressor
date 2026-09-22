import { useId } from "react";
import { useTranslation } from "react-i18next";
import "./PdfOptions.css";

/** Розмір сторінки (A4 / розмір фото) і поля (0 / 10 мм) для «Фото в PDF». */
const PdfOptions = ({ pageSize, marginMm, onPageSizeChange, onMarginChange }) => {
  const { t } = useTranslation();
  const uid = useId();

  return (
    <fieldset className="pdf-options">
      <legend className="pdf-options__title">{t("photoToPdf.options.title")}</legend>

      <div className="pdf-options__row" role="radiogroup" aria-label={t("photoToPdf.options.pageSize")}>
        <span className="pdf-options__label">{t("photoToPdf.options.pageSize")}</span>
        {[
          { id: "a4", label: t("photoToPdf.options.pageSizeA4") },
          { id: "photo", label: t("photoToPdf.options.pageSizePhoto") },
        ].map(({ id, label }) => (
          <label key={id} className="pdf-options__radio">
            <input
              type="radio"
              className="visually-hidden"
              name={`${uid}-pagesize`}
              value={id}
              checked={pageSize === id}
              onChange={() => onPageSizeChange(id)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="pdf-options__row" role="radiogroup" aria-label={t("photoToPdf.options.margin")}>
        <span className="pdf-options__label">{t("photoToPdf.options.margin")}</span>
        {[
          { id: 0, label: t("photoToPdf.options.marginNone") },
          { id: 10, label: t("photoToPdf.options.margin10") },
        ].map(({ id, label }) => (
          <label key={id} className="pdf-options__radio">
            <input
              type="radio"
              className="visually-hidden"
              name={`${uid}-margin`}
              value={id}
              checked={marginMm === id}
              onChange={() => onMarginChange(id)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <p className="pdf-options__hint">{t("photoToPdf.options.hint")}</p>
    </fieldset>
  );
};

export default PdfOptions;
