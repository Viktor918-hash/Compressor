import "./Footer.css";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer__wrapper container">
        <p className="footer__text">
          © 2026 CompressPhoto - {t("footer.title")}.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
