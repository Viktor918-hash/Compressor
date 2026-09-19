import { Component } from "react";
import i18n from "../../i18n/i18n";

/**
 * Глобальна межа помилок рендеру. Без неї будь-який виняток у компоненті
 * (у т.ч. збій завантаження чанка після нового деплою) залишає користувача
 * з порожнім білим екраном. Тепер — зрозуміле повідомлення і кнопка
 * "Перезавантажити". Скидається при переході на іншу сторінку (key у App.jsx).
 */
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        className="container"
        role="alert"
        style={{ padding: "64px 20px", textAlign: "center" }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          {i18n.t("errors.boundary.title")}
        </h1>
        <p style={{ marginBottom: 20, lineHeight: 1.5 }}>
          {i18n.t("errors.boundary.text")}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#4a4af4",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {i18n.t("errors.boundary.reload")}
        </button>
      </main>
    );
  }
}

export default ErrorBoundary;
