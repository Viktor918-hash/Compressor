import { useState, useEffect, useRef, useId } from "react";
import "./Header.css";
import { MdKeyboardArrowDown, MdGradient } from "react-icons/md";
import {
  FiMusic,
  FiScissors,
  FiBookOpen,
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
  FiCrop,
  FiRotateCw,
  FiDroplet,
  FiCircle,
  FiVideo,
  FiSearch,
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
import ToolSearch from "../ToolSearch/ToolSearch";

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 2. Стан для відкриття/закриття модалки авторизації
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' або 'register'

  // 3. Отримуємо дані користувача з Supabase Context
  const { user, isPro, signOut } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);

  // Пошук інструментів (round 33): кнопка в хедері, Ctrl/Cmd+K або "/"
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isMacLike =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || "");
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      const isCmdK = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (!isCmdK && !isSlash) return;
      e.preventDefault();
      setIsMenuOpen(false);
      setIsSearchOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Мобільне/планшетне бургер-меню: замість одного довгого списку —
  // категорії-акордеон (ті самі заголовки, що й у десктопному
  // dropdown-panel: catCompress/catVideo/catEdit/catDocs). Клік по
  // заголовку розкриває/згортає список інструментів під ним; кілька
  // категорій можуть бути розкриті одночасно.
  const mobileCategoriesId = useId();
  const [openCategories, setOpenCategories] = useState(() => new Set());
  const toggleCategory = (key) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  // Той самий набір інструментів, що й у трьох(+1) колонках десктопного
  // dropdown-panel вище, тільки згрупований для акордеону мобільного меню.
  const MOBILE_CATEGORIES = [
    {
      key: "catCompress",
      title: t("header.catCompress"),
      items: [
        { to: "/", icon: FaCompress, label: t("header.compress") },
        {
          to: "/compress-image-to-size",
          icon: FiTarget,
          label: t("header.compressToSize"),
        },
        { to: "/convert-to-jpg", icon: FiRepeat, label: t("header.convert") },
        {
          to: "/convert-to-webp",
          icon: FiImage,
          label: t("header.webp", "У WebP"),
        },
        {
          to: "/convert-to-png",
          icon: FiLayers,
          label: t("header.convertToPng"),
        },
        {
          to: "/remove-photo-metadata",
          icon: FiShield,
          label: t("header.removeExif"),
        },
      ],
    },
    {
      key: "catVideo",
      title: t("header.catVideo"),
      items: [
        {
          to: "/compress-video",
          icon: FiVideo,
          label: t("header.compressVideo"),
        },
        {
          to: "/convert-mov-to-mp4",
          icon: FiRepeat,
          label: t("header.convertMovToMp4"),
        },
        {
          to: "/convert-mkv-to-mp4",
          icon: FiRepeat,
          label: t("header.convertMkvToMp4"),
        },
        {
          to: "/convert-webm-to-mp4",
          icon: FiRepeat,
          label: t("header.convertWebmToMp4"),
        },
        { to: "/trim-video", icon: FiScissors, label: t("header.trimVideo") },
        { to: "/video-to-mp3", icon: FiMusic, label: t("header.videoToMp3") },
      ],
    },
    {
      key: "catEdit",
      title: t("header.catEdit"),
      items: [
        { to: "/resize-image", icon: TbResize, label: t("header.resize") },
        { to: "/crop-image", icon: FiCrop, label: t("header.cropImage") },
        {
          to: "/rotate-image",
          icon: FiRotateCw,
          label: t("header.rotateImage"),
        },
        {
          to: "/add-watermark",
          icon: FiDroplet,
          label: t("header.addWatermark"),
        },
        {
          to: "/black-and-white",
          icon: MdGradient,
          label: t("header.blackAndWhite"),
        },
        { to: "/circle-crop", icon: FiCircle, label: t("header.circleCrop") },
        {
          to: "/photo-presets",
          icon: FiSliders,
          label: t("presets.navTitle"),
        },
        {
          to: "/remove-background",
          icon: TbEraser,
          label: t("header.removeBg"),
        },
      ],
    },
    {
      key: "catDocs",
      title: t("header.catDocs"),
      items: [
        {
          to: "/convert-word-to-pdf",
          icon: FiFileText,
          label: t("header.wordToPdf"),
        },
        {
          to: "/convert-pdf-to-word",
          icon: FiFileText,
          label: t("header.pdfToWord"),
        },
        { to: "/photo-to-pdf", icon: FiCamera, label: t("header.photoToPdf") },
        { to: "/image-to-text", icon: FiType, label: t("header.imageToText") },
      ],
    },
  ];

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
                    to="/crop-image"
                    className="dropdown-panel__item"
                  >
                    <FiCrop size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.cropImage")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.cropImageDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/rotate-image"
                    className="dropdown-panel__item"
                  >
                    <FiRotateCw size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.rotateImage")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.rotateImageDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/add-watermark"
                    className="dropdown-panel__item"
                  >
                    <FiDroplet size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.addWatermark")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.addWatermarkDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/black-and-white"
                    className="dropdown-panel__item"
                  >
                    <MdGradient size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.blackAndWhite")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.blackAndWhiteDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/circle-crop"
                    className="dropdown-panel__item"
                  >
                    <FiCircle size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.circleCrop")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.circleCropDesc")}
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

                <div className="dropdown-panel__col">
                  <span className="dropdown-panel__col-title">
                    {t("header.catVideo")}
                  </span>
                  <LocalizedLink hideIfMissing
                    to="/compress-video"
                    className="dropdown-panel__item"
                  >
                    <FiVideo size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.compressVideo")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.compressVideoDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/convert-mov-to-mp4"
                    className="dropdown-panel__item"
                  >
                    <FiRepeat size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.convertMovToMp4")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.convertMovToMp4Desc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/convert-mkv-to-mp4"
                    className="dropdown-panel__item"
                  >
                    <FiRepeat size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.convertMkvToMp4")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.convertMkvToMp4Desc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/convert-webm-to-mp4"
                    className="dropdown-panel__item"
                  >
                    <FiRepeat size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.convertWebmToMp4")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.convertWebmToMp4Desc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/trim-video"
                    className="dropdown-panel__item"
                  >
                    <FiScissors size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.trimVideo")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.trimVideoDesc")}
                      </span>
                    </div>
                  </LocalizedLink>
                  <LocalizedLink hideIfMissing
                    to="/video-to-mp3"
                    className="dropdown-panel__item"
                  >
                    <FiMusic size={20} className="dropdown-panel__icon" />
                    <div>
                      <span className="dropdown-panel__title">
                        {t("header.videoToMp3")}
                      </span>
                      <span className="dropdown-panel__desc">
                        {t("header.videoToMp3Desc")}
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
            {/* Блог (round 36): лише uk/en — у ru/es пункт ховається */}
            <li className="header__list header__list--secondary">
              <LocalizedLink hideIfMissing to="/blog" className="nav__link">
                {t("header.blog")}
              </LocalizedLink>
            </li>
          </ul>

          <div className="div__nav">
            <button
              type="button"
              className="header__search-btn"
              onClick={() => setIsSearchOpen(true)}
              aria-label={t("header.search")}
              aria-keyshortcuts="Control+K Meta+K /"
              aria-haspopup="dialog"
            >
              <FiSearch size={18} aria-hidden="true" />
              <span className="header__search-text">{t("header.search")}</span>
              <kbd className="header__search-kbd" aria-hidden="true">
                {isMacLike ? "⌘K" : "Ctrl K"}
              </kbd>
            </button>
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
                      // було #f59e0b — токенізовано під той самий амбер,
                      // що й категорія "Документи" на головній (розділ 5)
                      background: "var(--color-warning-600, #B45309)",
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
          {MOBILE_CATEGORIES.map((category) => {
            const isOpen = openCategories.has(category.key);
            const panelId = `${mobileCategoriesId}-${category.key}`;
            return (
              <div key={category.key} className="mobile-menu__category">
                <button
                  type="button"
                  className="mobile-menu__category-header"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleCategory(category.key)}
                >
                  <span>{category.title}</span>
                  <MdKeyboardArrowDown
                    size={20}
                    aria-hidden="true"
                    className={`mobile-menu__category-chevron${
                      isOpen ? " mobile-menu__category-chevron--open" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div id={panelId} className="mobile-menu__category-items">
                    {category.items.map(({ to, icon: Icon, label }) => (
                      <LocalizedLink
                        key={to}
                        hideIfMissing
                        to={to}
                        className="mobile-menu__item"
                        onClick={closeMenu}
                      >
                        <Icon size={18} className="mobile-menu__icon" />
                        {label}
                      </LocalizedLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <LocalizedLink
          hideIfMissing
          to="/blog"
          className="mobile-menu__item mobile-menu__blog"
          onClick={closeMenu}
        >
          <FiBookOpen size={18} className="mobile-menu__icon" />
          {t("header.blog")}
        </LocalizedLink>

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

      <ToolSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

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
