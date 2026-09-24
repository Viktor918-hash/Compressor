import { useState, useEffect, useRef, useId } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Коди помилок Supabase Auth → ключі перекладу (auth.errors.*). Сирі
// англійські повідомлення бібліотеки користувачу не показуємо.
const ERROR_KEYS = {
  invalid_credentials: "invalidCredentials",
  user_already_exists: "userExists",
  email_exists: "userExists",
  weak_password: "weakPassword",
  email_not_confirmed: "emailNotConfirmed",
  over_request_rate_limit: "rateLimit",
  over_email_send_rate_limit: "rateLimit",
  signup_disabled: "signupDisabled",
};

/**
 * Діалог відкривається/закривається зовні. Внутрішній стан живе в
 * <AuthDialog>, який монтується заново при кожному відкритті — тож форма
 * скидається без ефектів із setState.
 */
export default function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  if (!isOpen) return null;
  return <AuthDialog onClose={onClose} initialMode={initialMode} />;
}

function AuthDialog({ onClose, initialMode }) {
  const [mode, setMode] = useState(initialMode); // 'login' або 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Показуємо підсвітку невалідного email тільки після того, як користувач
  // почав вводити щось і вийшов з поля (не з першого символу) — так не
  // "смикаємо" червоним, поки людина ще друкує адресу.
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Отримуємо методи авторизації з AuthContext
  const { signUpWithEmail, signInWithEmail, signInWithGoogle, prepareAuth } =
    useAuth();
  const { t } = useTranslation();
  const uid = useId();
  const dialogRef = useRef(null);
  const closeTimerRef = useRef(null);

  useFocusTrap(dialogRef, true, onClose);

  // Прогріваємо supabase-js, поки користувач заповнює форму
  useEffect(() => {
    prepareAuth?.();
  }, [prepareAuth]);

  // Не закриваємо вже розмонтований діалог таймером
  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const errorText = (error) => {
    const key = ERROR_KEYS[error?.code];
    if (key) return t(`auth.errors.${key}`);
    // старі версії supabase-js без error.code
    if (error?.message === "Invalid login credentials") {
      return t("auth.errors.invalidCredentials");
    }
    return t("auth.errors.generic");
  };

  const isEmailInvalid =
    emailTouched && email.length > 0 && !EMAIL_REGEX.test(email);
  const isPasswordInvalid = passwordTouched && password.length === 0;

  const switchMode = (newMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    setEmailTouched(false);
    setPasswordTouched(false);
  };

  const closeSoon = (ms) => {
    closeTimerRef.current = setTimeout(() => onClose(), ms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const emailInvalid = !EMAIL_REGEX.test(email);
    const passwordInvalid = password.length === 0;

    if (emailInvalid || passwordInvalid) {
      setEmailTouched(true);
      setPasswordTouched(true);
      return;
    }

    setIsSubmitting(true);

    if (mode === "register") {
      const { data, error } = await signUpWithEmail(email, password);
      if (error) {
        setErrorMsg(errorText(error));
      } else if (data?.user && data?.session === null) {
        // Якщо в Supabase увімкнено "Confirm Email"
        setSuccessMsg(t("auth.confirmEmailSent"));
      } else {
        setSuccessMsg(t("auth.registerSuccess"));
        closeSoon(1200);
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMsg(errorText(error));
      } else {
        setSuccessMsg(t("auth.loginSuccess"));
        closeSoon(800);
      }
    }

    setIsSubmitting(false);
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    const { error } = await signInWithGoogle();
    if (error) setErrorMsg(errorText(error));
  };

  const titleId = `${uid}-title`;
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const emailErrId = `${uid}-email-err`;
  const passwordErrId = `${uid}-password-err`;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={closeButtonStyle}
          onClick={onClose}
          aria-label={t("auth.close")}
        >
          <span aria-hidden="true">✕</span>
        </button>

        <h2 id={titleId}>
          {mode === "login" ? t("auth.titleLogin") : t("auth.titleRegister")}
        </h2>

        {/* Соціальна кнопка — лише Google */}
        <div style={oauthContainerStyle}>
          <button
            type="button"
            style={googleButtonStyle}
            onClick={handleGoogleAuth}
          >
            {t("auth.googleBtn")}
          </button>
        </div>

        <div style={dividerStyle}>
          <span>{t("auth.orEmail")}</span>
        </div>

        <div role="alert">
          {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
        </div>
        <div role="status">
          {successMsg && <div style={successStyle}>{successMsg}</div>}
        </div>

        <form onSubmit={handleSubmit} style={formStyle} noValidate>
          <label htmlFor={emailId} className="visually-hidden">
            {t("auth.emailPlaceholder")}
          </label>
          <input
            id={emailId}
            data-autofocus
            type="email"
            name="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={isEmailInvalid}
            aria-describedby={isEmailInvalid ? emailErrId : undefined}
            style={isEmailInvalid ? inputErrorStyle : inputStyle}
          />
          {isEmailInvalid && (
            <span id={emailErrId} style={fieldErrorTextStyle}>
              {t("auth.invalidEmail")}
            </span>
          )}
          <label htmlFor={passwordId} className="visually-hidden">
            {t("auth.passwordPlaceholder")}
          </label>
          <input
            id={passwordId}
            type="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            aria-invalid={isPasswordInvalid}
            aria-describedby={isPasswordInvalid ? passwordErrId : undefined}
            style={isPasswordInvalid ? inputErrorStyle : inputStyle}
          />
          {isPasswordInvalid && (
            <span id={passwordErrId} style={fieldErrorTextStyle}>
              {t("auth.emptyPassword")}
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={submitButtonStyle}
          >
            {isSubmitting
              ? t("auth.loading")
              : mode === "login"
              ? t("auth.loginBtn")
              : t("auth.registerBtn")}
          </button>
        </form>

        {/* Перемикач Реєстрація / Вхід */}
        <div style={switchContainerStyle}>
          {mode === "login" ? (
            <p>
              {t("auth.noAccount")}{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                style={linkButtonStyle}
              >
                {t("auth.registerBtn")}
              </button>
            </p>
          ) : (
            <p>
              {t("auth.hasAccount")}{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={linkButtonStyle}
              >
                {t("auth.loginBtn")}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Прості inline-стилі (легко перенести в CSS / Tailwind)
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};
const modalStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "var(--radius-md, 12px)",
  boxShadow: "var(--shadow-lg, 0 16px 40px rgba(17,24,39,.14))",
  width: "100%",
  maxWidth: "400px",
  position: "relative",
  boxSizing: "border-box",
  fontFamily: "var(--font-ui)",
};
const closeButtonStyle = {
  position: "absolute",
  top: "15px",
  right: "15px",
  border: "none",
  background: "none",
  fontSize: "18px",
  cursor: "pointer",
};
const oauthContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "20px",
};
const googleButtonStyle = {
  padding: "10px",
  border: "1px solid var(--color-border-strong, #ccc)",
  borderRadius: "var(--radius-sm, 8px)",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "500",
};
const dividerStyle = {
  margin: "20px 0",
  textAlign: "center",
  borderBottom: "1px solid var(--color-border, #eee)",
  lineHeight: "0.1em",
};
const formStyle = { display: "flex", flexDirection: "column", gap: "12px" };
const inputStyle = {
  padding: "12px",
  borderRadius: "var(--radius-sm, 8px)",
  border: "1px solid var(--color-border-strong, #ccc)",
  fontSize: "14px",
};
const inputErrorStyle = {
  ...inputStyle,
  border: "1px solid var(--color-danger-600, #dc2626)",
  background: "var(--color-danger-50, #fef2f2)",
};
const fieldErrorTextStyle = {
  color: "var(--color-danger-600, #dc2626)",
  fontSize: "12px",
  marginTop: "-6px",
};
const submitButtonStyle = {
  padding: "12px",
  borderRadius: "var(--radius-sm, 8px)",
  border: "none",
  // було #2563eb (той самий "старий синій" з розділу 2.1 документа,
  // просто в inline JS-стилі, тож скрипт кроку 2 — regex по .css — його
  // не бачив) — тепер той самий токен, що й скрізь на сайті.
  background: "var(--color-primary-600, #4338CA)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};
const switchContainerStyle = {
  marginTop: "20px",
  textAlign: "center",
  fontSize: "14px",
};
const linkButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--color-primary-600, #4338CA)",
  cursor: "pointer",
  textDecoration: "underline",
  padding: 0,
};
const errorStyle = {
  background: "var(--color-danger-50, #fee2e2)",
  color: "var(--color-danger-600, #dc2626)",
  padding: "10px",
  borderRadius: "var(--radius-sm, 8px)",
  marginBottom: "12px",
  fontSize: "14px",
};
const successStyle = {
  background: "var(--color-success-50, #d1fae5)",
  // --color-success-600 у tokens.css позначений лише для іконок/великих
  // ділянок (не AA для тексту) — тут текст, тому 700-й відтінок.
  color: "var(--color-success-700, #047857)",
  padding: "10px",
  borderRadius: "var(--radius-sm, 8px)",
  marginBottom: "12px",
  fontSize: "14px",
};
