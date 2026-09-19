// Згода на аналітику (Google Analytics). До згоди скрипт gtag.js НЕ
// завантажується взагалі (див. index.html: там лише консольна "заглушка"
// gtag із consent = denied), тому нічого не йде в Google без вибору
// користувача. Вибір зберігається в localStorage (cp_consent).
const GA_ID = "G-0F165P2VRL";
const STORAGE_KEY = "cp_consent";
export const CONSENT_EVENT = "cp-consent-change";
export const OPEN_CONSENT_EVENT = "cp-open-consent";

/** "granted" | "denied" | null (ще не вибирав) */
export function getConsent() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null; // localStorage недоступний — вважаємо, що вибору немає
  }
}

let analyticsLoaded = false;

export function loadAnalytics() {
  if (analyticsLoaded || typeof document === "undefined") return;
  analyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

export function setConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // без localStorage вибір діє лише в цій сесії
  }
  if (value === "granted") {
    loadAnalytics();
  } else if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Викликається один раз при старті застосунку. */
export function initAnalyticsFromStoredConsent() {
  if (getConsent() === "granted") loadAnalytics();
}
