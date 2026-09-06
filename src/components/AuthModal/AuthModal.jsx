import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthModal({ isOpen, onClose, initialMode = "login" }) {
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
  const { signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

  // Скидаємо форму щоразу, коли модалку відкривають заново або міняють
  // початковий режим ззовні (клік "Увійти" після "Зареєструватись" тощо).
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail("");
      setPassword("");
      setErrorMsg("");
      setSuccessMsg("");
      setEmailTouched(false);
      setPasswordTouched(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

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
        setErrorMsg(error.message);
      } else {
        // Якщо в Supabase увімкнено "Confirm Email"
        if (data?.user && data?.session === null) {
          setSuccessMsg(
            "Реєстрація успішна! Перевірте вашу пошту для підтвердження."
          );
        } else {
          setSuccessMsg("Успішна реєстрація!");
          setTimeout(() => onClose(), 1200);
        }
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? "Невірний email або пароль"
            : error.message
        );
      } else {
        setSuccessMsg("Успішний вхід!");
        setTimeout(() => onClose(), 800);
      }
    }

    setIsSubmitting(false);
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    const { error } = await signInWithGoogle();
    if (error) setErrorMsg(error.message);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose}>
          ✕
        </button>

        <h2>
          {mode === "login" ? t("auth.titleLogin") : t("auth.titleRegister")}
        </h2>

        {/* Соціальна кнопка — лише Google */}
        <div style={oauthContainerStyle}>
          <button style={googleButtonStyle} onClick={handleGoogleAuth}>
            {t("auth.googleBtn")}
          </button>
        </div>

        <div style={dividerStyle}>
          <span>{t("auth.orEmail")}</span>
        </div>

        {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
        {successMsg && <div style={successStyle}>{successMsg}</div>}

        <form onSubmit={handleSubmit} style={formStyle} noValidate>
          <input
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            style={isEmailInvalid ? inputErrorStyle : inputStyle}
          />
          {isEmailInvalid && (
            <span style={fieldErrorTextStyle}>{t("auth.invalidEmail")}</span>
          )}
          <input
            type="password"
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            style={isPasswordInvalid ? inputErrorStyle : inputStyle}
          />
          {isPasswordInvalid && (
            <span style={fieldErrorTextStyle}>{t("auth.emptyPassword")}</span>
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
  borderRadius: "12px",
  width: "100%",
  maxWidth: "400px",
  position: "relative",
  boxSizing: "border-box",
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
  border: "1px solid #ccc",
  borderRadius: "6px",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "500",
};
const dividerStyle = {
  margin: "20px 0",
  textAlign: "center",
  borderBottom: "1px solid #eee",
  lineHeight: "0.1em",
};
const formStyle = { display: "flex", flexDirection: "column", gap: "12px" };
const inputStyle = {
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};
const inputErrorStyle = {
  ...inputStyle,
  border: "1px solid #dc2626",
  background: "#fef2f2",
};
const fieldErrorTextStyle = {
  color: "#dc2626",
  fontSize: "12px",
  marginTop: "-6px",
};
const submitButtonStyle = {
  padding: "12px",
  borderRadius: "6px",
  border: "none",
  background: "#2563eb",
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
  color: "#2563eb",
  cursor: "pointer",
  textDecoration: "underline",
  padding: 0,
};
const errorStyle = {
  background: "#fee2e2",
  color: "#dc2626",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "12px",
  fontSize: "14px",
};
const successStyle = {
  background: "#d1fae5",
  color: "#059669",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "12px",
  fontSize: "14px",
};
