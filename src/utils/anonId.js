// Стабільний анонімний ідентифікатор відвідувача, що зберігається в
// localStorage. Використовується лише для обліку денного ліміту безкоштовних
// конвертацій для НЕ зареєстрованих користувачів (не для трекінгу/аналітики).
const STORAGE_KEY = "cp_anon_id";

export const getAnonId = () => {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage недоступний (приватний режим тощо) — генеруємо
    // одноразовий id на сесію, ліміт тоді рахується на бекенді по IP.
    return `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};
