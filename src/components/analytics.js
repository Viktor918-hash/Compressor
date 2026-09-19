import { getConsent } from "../utils/consent";

// Відправка подій у Google Analytics — тільки після згоди користувача.
// УВАГА: не передавайте в params імена файлів чи інші персональні дані.
export const trackEvent = (eventName, eventParams = {}) => {
  if (
    typeof window !== "undefined" &&
    window.gtag &&
    getConsent() === "granted"
  ) {
    window.gtag("event", eventName, eventParams);
  }
};
