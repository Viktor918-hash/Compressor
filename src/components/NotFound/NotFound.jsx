import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePageLang } from "../../hooks/usePageLang";

const HOME = { uk: "/", en: "/en", ru: "/ru", es: "/es" };

/**
 * Сторінка 404 для переходів усередині застосунку. (Прямі заходи на
 * неіснуючі URL обслуговує public/404.html з реальним статусом 404.)
 */
const NotFound = () => {
  const { t } = useTranslation();
  const lang = usePageLang();

  return (
    <main
      className="container"
      style={{ padding: "64px 20px", textAlign: "center" }}
    >
      <Helmet>
        <title>{t("notFound.title", { lng: lang })} — CompressPhoto</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>
        404 — {t("notFound.title", { lng: lang })}
      </h1>
      <p style={{ marginBottom: 20 }}>{t("notFound.text", { lng: lang })}</p>
      <Link to={HOME[lang]} style={{ fontWeight: 600 }}>
        {t("notFound.home", { lng: lang })}
      </Link>
    </main>
  );
};

export default NotFound;
