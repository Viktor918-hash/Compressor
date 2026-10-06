import LegalPage from "./LegalPage";

// Тонкі обгортки: routes.jsx мапить slug на компонент без пропсів, тож
// кожна довір-сторінка — окремий компонент, що передає свій slug у
// загальний рендерер LegalPage.
export const Privacy = () => <LegalPage slug="privacy" />;
export const Terms = () => <LegalPage slug="terms" />;
export const Contact = () => <LegalPage slug="contact" />;
export const About = () => <LegalPage slug="about" />;
