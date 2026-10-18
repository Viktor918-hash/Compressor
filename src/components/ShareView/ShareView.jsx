import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { FiDownload, FiClock, FiAlertTriangle, FiFile, FiShield } from "react-icons/fi";
import { fetchShareInfo } from "../../utils/shareApi";
import { usePageLang } from "../../hooks/usePageLang";
import LocalizedLink from "../LocalizedLink/LocalizedLink";
import "./ShareView.css";

const HOME = { uk: "/", en: "/en", ru: "/ru", es: "/es" };

const pad = (n) => String(n).padStart(2, "0");
/** 5400 → "1:30:00" */
const formatCountdown = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

/**
 * Сторінка тимчасового посилання /s/:id (round 34): прев'ю, розмір,
 * зворотний відлік до видалення, кнопка "Завантажити". Не індексується
 * (meta robots + X-Robots-Tag у vercel.json).
 */
const ShareView = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const lang = usePageLang();
  const [info, setInfo] = useState({ status: "loading" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const controller = new AbortController();
    fetchShareInfo(id, { signal: controller.signal })
      .then(setInfo)
      .catch((err) => {
        if (err?.name !== "AbortError") setInfo({ status: "error" });
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (info.status !== "ok") return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [info.status]);

  const left = info.status === "ok" ? info.expiresAt - now / 1000 : 0;
  const expiredNow = info.status === "ok" && left <= 0;
  const status = expiredNow ? "expired" : info.status;

  const sizeText =
    info.size != null
      ? `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(
          info.size / 1024 / 1024 >= 1 ? info.size / 1024 / 1024 : info.size / 1024
        )} ${info.size / 1024 / 1024 >= 1 ? t("share.page.mb") : t("share.page.kb")}`
      : "";

  return (
    <main className="share-view container">
      <Helmet>
        <title>{t("share.page.metaTitle")}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>

      <div className="share-view__card">
        {status === "loading" && <p className="share-view__muted">{t("share.page.loading")}</p>}

        {status === "ok" && (
          <>
            <h1 className="share-view__title">{t("share.page.title")}</h1>
            {info.previewUrl && info.contentType.startsWith("image/") && (
              <img className="share-view__preview" src={info.previewUrl} alt={info.filename} />
            )}
            {info.previewUrl && info.contentType.startsWith("video/") && (
              <video className="share-view__preview" src={info.previewUrl} controls preload="metadata" />
            )}
            {!info.previewUrl && (
              <div className="share-view__file-icon" aria-hidden="true">
                <FiFile size={40} />
              </div>
            )}
            <p className="share-view__name" title={info.filename}>
              {info.filename}
            </p>
            <p className="share-view__muted">{sizeText}</p>
            <a className="share-view__download" href={info.downloadUrl} rel="noopener noreferrer">
              <FiDownload size={20} aria-hidden="true" />
              {t("share.page.download")}
            </a>
            <p className="share-view__timer" role="timer" aria-live="off">
              <FiClock size={16} aria-hidden="true" />
              {t("share.page.expiresIn", { time: formatCountdown(left) })}
            </p>
            <p className="share-view__privacy">
              <FiShield size={14} aria-hidden="true" />
              {t("share.page.privacy")}
            </p>
          </>
        )}

        {(status === "expired" || status === "notFound" || status === "error") && (
          <>
            <div className="share-view__file-icon share-view__file-icon--warn" aria-hidden="true">
              <FiAlertTriangle size={40} />
            </div>
            <h1 className="share-view__title">
              {status === "expired"
                ? t("share.page.expiredTitle")
                : status === "notFound"
                  ? t("share.page.notFoundTitle")
                  : t("share.page.errorTitle")}
            </h1>
            <p className="share-view__muted">
              {status === "expired"
                ? t("share.page.expiredText")
                : status === "notFound"
                  ? t("share.page.notFoundText")
                  : t("share.page.errorText")}
            </p>
          </>
        )}
      </div>

      <div className="share-view__cta">
        <p>{t("share.page.cta")}</p>
        <Link className="share-view__cta-btn" to={HOME[lang]}>
          {t("share.page.ctaButton")}
        </Link>
      </div>

      {status === "ok" && (
        <p className="share-view__report">
          <LocalizedLink to="/contact">{t("share.page.report")}</LocalizedLink>
        </p>
      )}
    </main>
  );
};

export default ShareView;
