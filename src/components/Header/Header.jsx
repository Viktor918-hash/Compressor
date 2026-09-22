import { useState, useEffect, useRef, useId } from "react";
import "./Header.css";
import { MdKeyboardArrowDown } from "react-icons/md";
import {
  FiRepeat,
  FiX,
  FiMenu,
  FiImage,
  FiSliders,
  FiLogOut,
  FiUser,
  FiFileText,
  FiType,
  FiTarget,
  FiLayers,
  FiShield,
  FiCamera,
} from "react-icons/fi";
import { FaCompress } from "react-icons/fa";
import { TbResize, TbEraser } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import LocalizedLink from "../LocalizedLink/LocalizedLink";

// 1. Імпортуємо контекст авторизації та модальне вікно
// Змінюємо "../" на "../../"
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../AuthModal/AuthModal";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 2. Стан для відкриття/закриття модалки авторизації
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' або 'register'

  // 3. Отримуємо дані користувача з Supabase Context
  const { user, isPro, signOut } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);

  // Випадне меню "Інструменти": відкривається кліком/Enter/Space (а не лише
  // наведенням мишки), закривається Escape, кліком поза меню й виходом фокуса.
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef(null);
  const toolsButtonRef = useRef(null);
  const toolsPanelId = useId();

  useEffect(() => {
    if (!isToolsOpen) return undefined;
    const onPointerDown = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setIsToolsOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsToolsOpen(false);
        toolsButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isToolsOpen]);

  // Мобільне меню — модальне: фокус усередині, Escape закриває
  const mobileMenuRef = useRef(null);
  useFocusTrap(mobileMenuRef, isMenuOpen, closeMenu);

  // Хендлери відкриття авторизації
  const openLogin = (e) => {
    if (e) e.preventDefault();
    setAuthMode("login");
    setIsAuthOpen(true);
    closeMenu();
  };

  const openRegister = (e) => {
    if (e) e.preventDefault();
    setAuthMode("register");
    setIsAuthOpen(true);
    closeMenu();
  };

  // Дозволяє будь-якому компоненту (напр. Word→PDF конвертеру, коли гість
  // вичерпав денний ліміт) відкрити модалку реєстрації, не тягнучи стан
  // Header через пропси/контекст.
  useEffect(() => {
    const openFromEvent = () => openRegister();
    window.addEventListener("open-register-modal", openFromEvent);
    return () =>
      window.removeEventListener("open-register-modal", openFromEvent);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header className="header">
      <div className="header__wrapper container">
        <div className="header__content"></div>

        <nav className="header__nav" aria-label={t("header.mainNav")}>
          <LocalizedLink hideIfMissing to="/" className="header__logo-link">
            <img
              className="header__logo"
              src="/logoImg/compressphoto_header_logo_2.svg"
              alt="CompressPhoto"
            />
          </LocalizedLink>

          <ul className="header__nav-list">
            <li
              ref={toolsRef}
              className={`header__list header__list--dropdown header__list--tools ${
                isToolsOpen ? "header__list--open" : ""
              }`}
              onBlur={(e) => {
                // фокус пішов за межі меню (Tab) — закриваємо
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsToolsOpen(false);
                }
              }}
            >
              <button
                ref={toolsButtonRef}
                type="button"
                className="nav__link nav__link--button"
                aria-expanded={isToolsOpen}
                aria-controls={toolsPanelId}
                onClick={() => setIsToolsOpen((v) => !v)}
              >
                {t("header.tools")}
                <MdKeyboardArrowDown size={22} aria-hidden="true" />
              </button>

              <div className="dropdown-panel" id={toolsPanelId}>
                <div className="dropdown-panel__col">
                  <span className="dropdown-panel__col-title">
                    {t("header.catCompress")}
                  </span>
                  <LocalizedLink hideIfMissing to="/" className="dropdown-panel__item">
                    <FaCompress size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.compress")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.compressDesc")}
                      </span>
                    </div>
                  </LocalizedLink>

                  <LocalizedLink
                    hideIfMissing
                    to="/compress-image-to-size"
                    className="dropdown-panel__item"
                  >
                    <FiTarget size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.compressToSize")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.compressToSizeDesc")}
                      </span>
                    </div>
                  </LocalizedLink>

                  <LocalizedLink hideIfMissing
                    to="/convert-to-jpg"
                    className="dropdown-panel__item"
                  >
                    <FiRepeat size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.convert")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.convertDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/convert-to-webp"
                    className="dropdown-panel__item"
                  >
                    <FiImage size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.webp", "У WebP")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t(
                          "header.webpDesc",
                          "Конвертуйте фото у формат WebP"
                        )}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/convert-to-png"
                    className="dropdown-panel__item"
                  >
                    <FiLayers size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.convertToPng")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.convertToPngDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/remove-photo-metadata"
                    className="dropdown-panel__item"
                  >
                    <FiShield size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.removeExif")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.removeExifDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                </div>

                <div className="dropdown-panel__col">
                  <span className="dropdown-panel__col-title">
                    {t("header.catEdit")}
                  </span>
                  <LocalizedLink hideIfMissing
                    to="/resize-image"
                    className="dropdown-panel__item"
                  >
                    <TbResize size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.resize")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.resizeDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/photo-presets"
                    className="dropdown-panel__item"
                  >
                    <FiSliders size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("presets.navTitle")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.prest")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/remove-background"
                    className="dropdown-panel__item"
                  >
                    <TbEraser size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.removeBg")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.removeBgDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                </div>

                <div className="dropdown-panel__col">
                  <span className="dropdown-panel__col-title">
                    {t("header.catDocs")}
                  </span>
                  <LocalizedLink hideIfMissing
                    to="/convert-word-to-pdf"
                    className="dropdown-panel__item"
                  >
                    <FiFileText size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.wordToPdf")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.wordToPdfDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/convert-pdf-to-word"
                    className="dropdown-panel__item"
                  >
                    <FiFileText size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.pdfToWord")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.pdfToWordDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/photo-to-pdf"
                    className="dropdown-panel__item"
                  >
                    <FiCamera size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.photoToPdf")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.photoToPdfDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/image-to-text"
                    className="dropdown-panel__item"
                  >
                    <FiType size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.imageToText")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.imageToTextDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                </div>
              </div>
            </li>
            <li className="header__list header__list--secondary">
              <LocalizedLink hideIfMissing to="/photo-presets" className="nav__link">
                {t("presets.navTitle")}
              </LocalizedLink>
            </li>
          </ul>

          <div className="div__nav">
            {/* 4. Відображення кнопок у десктопній версії */}
            {user ? (
              <div
                className="header__user-info"
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span
                  className="user-email"
                  style={{ fontSize: "14px", fontWeight: "500" }}
                >
                  {user.email.split("@")[0]}
                </span>
                {isPro && (
                  <span
                    className="pro-badge"
                    style={{
                      background: "#f59e0b",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    PRO
                  </span>
                )}
                <button
                  type="button"
                  className="sigIn"
                  onClick={signOut}
                  title={t("header.signOut")}
                  aria-label={t("header.signOut")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    background: "none",
                  }}
                >
                  <FiLogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="header__sigIn"
                  onClick={openLogin}
                >
                  {t("header.signIn")}
                </button>
                <button
                  type="button"
                  className="header__logIn"
                  onClick={openRegister}
                >
                  {t("header.signUp")}
                </button>
              </>
            )}

            <span className="lenguage">
              <LanguageSwitcher />
            </span>

            <button
              type="button"
              className="burger-btn"
              onClick={() => setIsMenuOpen(true)}
              aria-label={t("header.openMenu")}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <FiMenu size={28} />
            </button>
          </div>
        </nav>
      </div>

      {isMenuOpen && (
        <div
          className={`mobile-menu-backdrop ${
            isMenuOpen ? "mobile-menu-backdrop--open" : ""
          }`}
          onClick={closeMenu}
          aria-hidden={!isMenuOpen}
        />
      )}

      <aside
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`mobile-menu ${isMenuOpen ? "mobile-menu--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t("header.menu")}
        inert={!isMenuOpen}
      >
        <div className="mobile-menu__header">
          <span className="mobile-menu__title">{t("header.menu")}</span>
          <button
            type="button"
            className="mobile-menu__close"
            onClick={closeMenu}
            aria-label={t("header.closeMenu")}
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="mobile-menu__section">
          <span className="mobile-menu__section-title">
            {t("header.tools")}
          </span>
          <LocalizedLink hideIfMissing
            to="/"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FaCompress size={18} className="mobile-menu__icon" />
            {t("header.compress")}
          </LocalizedLink>
          <LocalizedLink
            hideIfMissing
            to="/compress-image-to-size"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiTarget size={18} className="mobile-menu__icon" />
            {t("header.compressToSize")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/convert-to-jpg"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiRepeat size={18} className="mobile-menu__icon" />
            {t("header.convert")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/convert-to-webp"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiImage size={18} className="mobile-menu__icon" />
            {t("header.webp", "У WebP")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/convert-to-png"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiLayers size={18} className="mobile-menu__icon" />
            {t("header.convertToPng")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/remove-photo-metadata"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiShield size={18} className="mobile-menu__icon" />
            {t("header.removeExif")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/resize-image"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <TbResize size={18} className="mobile-menu__icon" />
            {t("header.resize")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/photo-presets"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiSliders size={18} className="mobile-menu__icon" />
            {t("presets.navTitle")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/convert-word-to-pdf"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiFileText size={18} className="mobile-menu__icon" />
            {t("header.wordToPdf")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/convert-pdf-to-word"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiFileText size={18} className="mobile-menu__icon" />
            {t("header.pdfToWord")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/photo-to-pdf"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiCamera size={18} className="mobile-menu__icon" />
            {t("header.photoToPdf")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/remove-background"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <TbEraser size={18} className="mobile-menu__icon" />
            {t("header.removeBg")}
          </LocalizedLink>
          <LocalizedLink hideIfMissing
            to="/image-to-text"
            className="mobile-menu__item"
            onClick={closeMenu}
          >
            <FiType size={18} className="mobile-menu__icon" />
            {t("header.imageToText")}
          </LocalizedLink>
        </div>

        <div className="mobile-menu__item mobile-menu__language">
          <LanguageSwitcher className="mobile-menu__language-switcher" />
        </div>

        {/* 5. Відображення авторизації в мобільному меню */}
        <div className="mobile-menu__auth">
          {user ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                width: "100%",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FiUser size={18} />
                <span>{user.email}</span>
              </div>
              <button
                type="button"
                className="sigIn mobile-menu__signin"
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
              >
                {t("header.signOut")}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="sigIn mobile-menu__signin"
                onClick={openLogin}
              >
                {t("header.signIn")}
              </button>
              <button
                type="button"
                className="logIn mobile-menu__signup"
                onClick={openRegister}
              >
                {t("header.signUp")}
              </button>
            </>
          )}
        </div>
      </aside>

      {/* 6. Модальне вікно для авторизації */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
};

export default Header;
