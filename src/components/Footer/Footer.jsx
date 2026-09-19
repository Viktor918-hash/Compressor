import "./Footer.css";
import { useTranslation } from "react-i18next";
import { OPEN_CONSENT_EVENT } from "../../utils/consent";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer__wrapper container">
        <p className="footer__text">
          © 2026 CompressPhoto - {t("footer.title")}.
        </p>
        <button
          type="button"
          className="footer__link-btn"
          onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
        >
          {t("consent.settings")}
        </button>
      </div>
    </footer>
  );
};

export default Footer;
