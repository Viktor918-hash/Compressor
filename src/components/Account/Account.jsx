import { useState } from "react";
import { FiUser, FiLock, FiHeart, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../hooks/useFavorites";
import { PRESETS } from "../Presets/presetsData";
import SeoHead from "../Seo/SeoHead";
import { ROUTES } from "../../routes";
import { usePageLang } from "../../hooks/usePageLang";
import AuthModal from "../AuthModal/AuthModal";
import "./Account.css";

const Account = () => {
  const { user, profile, updateUsername, updatePassword } = useAuth();
  const {
    favoriteIds,
    toggleFavorite,
    loading: favoritesLoading,
  } = useFavorites();
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "account");

  const [username, setUsername] = useState(profile?.username || "");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(!user);

  const favoritePresets = PRESETS.filter((p) => favoriteIds.has(p.id));

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setUsernameMsg("");
    if (!username.trim()) return;

    setIsSavingUsername(true);
    const { error } = await updateUsername(username.trim());
    setIsSavingUsername(false);
    setUsernameMsg(error ? "Не вдалося зберегти ім'я" : "Збережено");
    setTimeout(() => setUsernameMsg(""), 2500);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMsg("");

    if (newPassword.length < 6) {
      setPasswordError("Пароль має містити щонайменше 6 символів");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Паролі не збігаються");
      return;
    }

    setIsSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordMsg("Пароль успішно змінено");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMsg(""), 2500);
  };

  // Якщо не залогінені — показуємо запрошення увійти замість сторінки.
  if (!user) {
    return (
      <main className="account-page">
        {route && (
          <SeoHead route={route} lang={lang} robots="noindex, nofollow" />
        )}
        <div className="account-page__wrapper container">
          <div className="account-guard">
            <p>Увійдіть в акаунт, щоб побачити свій профіль.</p>
            <button
              type="button"
              className="account-guard__btn"
              onClick={() => setAuthModalOpen(true)}
            >
              Увійти
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode="login"
        />
      </main>
    );
  }

  return (
    <main className="account-page">
      {route && (
        <SeoHead route={route} lang={lang} robots="noindex, nofollow" />
      )}
      <div className="account-page__wrapper container">
        <h1 className="main__title">Мій акаунт</h1>

        <div className="account-grid">
          {/* --- Ім'я користувача --- */}
          <section className="account-card">
            <h2 className="account-card__title">
              <FiUser size={18} /> Ім&apos;я користувача
            </h2>
            <p className="account-card__email">{user.email}</p>
            <form onSubmit={handleSaveUsername} className="account-form">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Як до вас звертатись?"
                maxLength={40}
                className="account-input"
              />
              <button
                type="submit"
                className="account-btn"
                disabled={isSavingUsername}
              >
                {isSavingUsername ? "Збереження…" : "Зберегти"}
              </button>
            </form>
            {usernameMsg && (
              <p className="account-msg account-msg--ok">{usernameMsg}</p>
            )}
          </section>

          {/* --- Зміна паролю --- */}
          <section className="account-card">
            <h2 className="account-card__title">
              <FiLock size={18} /> Змінити пароль
            </h2>
            <form onSubmit={handleChangePassword} className="account-form">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Новий пароль"
                className="account-input"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторіть пароль"
                className="account-input"
              />
              <button
                type="submit"
                className="account-btn"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Збереження…" : "Змінити пароль"}
              </button>
            </form>
            {passwordError && (
              <p className="account-msg account-msg--error">{passwordError}</p>
            )}
            {passwordMsg && (
              <p className="account-msg account-msg--ok">{passwordMsg}</p>
            )}
          </section>
        </div>

        {/* --- Обрані пресети --- */}
        <section className="account-favorites">
          <h2 className="account-card__title">
            <FiHeart size={18} /> Обрані пресети
          </h2>

          {favoritesLoading ? (
            <p className="account-favorites__empty">Завантаження…</p>
          ) : favoritePresets.length === 0 ? (
            <p className="account-favorites__empty">
              Ще немає обраних пресетів — натисніть на сердечко на будь-якому
              пресеті на сторінці "Пресети".
            </p>
          ) : (
            <div className="account-favorites__grid">
              {favoritePresets.map((preset) => (
                <div key={preset.id} className="account-favorite-item">
                  <button
                    type="button"
                    className="account-favorite-item__remove"
                    onClick={() => toggleFavorite(preset.id)}
                    aria-label={`Прибрати ${preset.name} з обраного`}
                  >
                    <FiX size={14} />
                  </button>
                  <span className="account-favorite-item__name">
                    {preset.name}
                  </span>
                  {preset.description && (
                    <span className="account-favorite-item__desc">
                      {preset.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Account;
