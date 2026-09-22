import "./Footer.css";
import { useTranslation } from "react-i18next";
import { OPEN_CONSENT_EVENT } from "../../utils/consent";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import { ROUTES } from "../../routes";
import { TOOLS } from "../../toolsCatalog";
import { usePageLang } from "../../hooks/usePageLang";
import { hasLang } from "../../utils/routeLangs";

const Footer = () => {
  const { t } = useTranslation();
  const lang = usePageLang();
  return (
    <footer className="footer">
      <div className="footer__wrapper container">
        {/* Посилання на всі інструменти на кожній сторінці: зручна навігація
            й внутрішня перелінковка для пошукових ботів */}
        <nav className="footer__nav" aria-label={t("footer.tools")}>
          <h2 className="footer__nav-title">{t("footer.tools")}</h2>
          <ul className="footer__nav-list">
            {TOOLS.map(({ slug, nameKey }) => {
              const route = ROUTES.find((r) => r.slug === slug);
              if (!route || !hasLang(route, lang)) return null;
              return (
                <li key={slug}>
                  <LocalizedLink to={route.uk} className="footer__nav-link">
                    {t(nameKey)}
                  </LocalizedLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="footer__bottom">
          <p className="footer__text">
            © {new Date().getFullYear()} CompressPhoto - {t("footer.title")}.
          </p>
          <button
            type="button"
            className="footer__link-btn"
            onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
          >
            {t("consent.settings")}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
