import "./ConsentBanner.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getConsent,
  setConsent,
  OPEN_CONSENT_EVENT,
} from "../../utils/consent";

/**
 * Банер згоди на аналітику. Розташований fixed (не в потоці документа),
 * тому не спричиняє зсуву макета (CLS). Кнопки "Прийняти" і "Відхилити"
 * однакового вигляду й ваги — це вимога GDPR/ePrivacy до вільної згоди.
 * Показується лише на клієнті (після монтування), тож у prerender-HTML його нема.
 */
const ConsentBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    // Посилання "Налаштування cookies" у футері знову відкриває банер
    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      className="consent-banner"
      role="region"
      aria-label={t("consent.aria")}
    >
      <p className="consent-banner__text">{t("consent.text")}</p>
      <div className="consent-banner__actions">
        <button
          type="button"
          className="consent-banner__btn"
          onClick={() => choose("denied")}
        >
          {t("consent.decline")}
        </button>
        <button
          type="button"
          className="consent-banner__btn"
          onClick={() => choose("granted")}
        >
          {t("consent.accept")}
        </button>
      </div>
    </div>
  );
};

export default ConsentBanner;
