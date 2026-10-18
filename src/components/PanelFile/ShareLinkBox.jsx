import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiLink, FiCopy, FiCheck, FiSend, FiRefreshCw } from "react-icons/fi";
import { createShareLink } from "../../utils/shareApi";
import { trackEvent } from "../analytics";
import "./ShareLinkBox.css";

/**
 * Тимчасове посилання на результат обробки (round 34): файл вантажиться
 * в Cloudflare R2 лише після явного кліку, посилання діє 2 години.
 * getFile: async () => { blob, name } | null
 */
const ShareLinkBox = ({ getFile }) => {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState({ status: "idle" }); // idle | working | ready | error
  const [copied, setCopied] = useState(false);
  const controllerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches;

  const create = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: "working", progress: 0 });
    try {
      const file = await getFile();
      if (!file) throw new Error("no file");
      const link = await createShareLink(file.blob, file.name, {
        signal: controller.signal,
        onProgress: (p) => setState({ status: "working", progress: p }),
      });
      trackEvent("share_link_created", { size_mb: (file.blob.size / 1024 / 1024).toFixed(2) });
      setState({ status: "ready", ...link });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("share link failed:", error);
      setState({
        status: "error",
        message:
          error?.userFacing && error?.message ? error.message : t("share.errors.SHARE_FAILED"),
      });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.url);
    } catch {
      // старі браузери / без дозволу — виділяємо текст, щоб скопіювати вручну
      inputRef.current?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const send = async () => {
    try {
      await navigator.share({ url: state.url, title: t("share.page.title") });
    } catch {
      // користувач закрив вікно — нічого не робимо
    }
  };

  const until =
    state.status === "ready"
      ? new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" }).format(
          new Date(state.expiresAt * 1000)
        )
      : "";

  return (
    <div className="share-link" aria-live="polite">
      {state.status === "idle" && (
        <>
          <button type="button" className="share-link__create" onClick={create}>
            <FiLink size={18} aria-hidden="true" />
            {t("share.button")}
          </button>
          <p className="share-link__note">{t("share.note")}</p>
        </>
      )}

      {state.status === "working" && (
        <div className="share-link__working">
          <span>
            {t("share.creating", { percent: Math.round((state.progress || 0) * 100) })}
          </span>
          <progress
            className="side-panel__file-progress"
            max={1}
            value={state.progress || 0}
            aria-label={t("share.creating", { percent: Math.round((state.progress || 0) * 100) })}
          />
        </div>
      )}

      {state.status === "ready" && (
        <div className="share-link__ready">
          <p className="share-link__ready-title">
            <FiCheck size={16} aria-hidden="true" /> {t("share.ready", { time: until })}
          </p>
          <div className="share-link__row">
            <input
              ref={inputRef}
              className="share-link__input"
              type="text"
              readOnly
              value={state.url}
              aria-label={t("share.linkLabel")}
              onFocus={(e) => e.target.select()}
            />
            <button type="button" className="share-link__copy" onClick={copy}>
              {copied ? <FiCheck size={16} aria-hidden="true" /> : <FiCopy size={16} aria-hidden="true" />}
              {copied ? t("share.copied") : t("share.copy")}
            </button>
          </div>
          {canNativeShare && (
            <button type="button" className="share-link__send" onClick={send}>
              <FiSend size={16} aria-hidden="true" />
              {t("share.send")}
            </button>
          )}
        </div>
      )}

      {state.status === "error" && (
        <div className="share-link__error" role="alert">
          <p className="error-text">{state.message}</p>
          <button type="button" className="share-link__retry" onClick={create}>
            <FiRefreshCw size={14} aria-hidden="true" />
            {t("share.retry")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareLinkBox;
