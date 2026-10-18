import { Fragment } from "react";
import LocalizedLink from "../LocalizedLink/LocalizedLink";

// Мінімальна розмітка для текстів блогу (src/blog/posts.js):
//   **жирний**, `код`, [текст](/шлях) — внутрішнє посилання.
// Рендеримо в React-елементи (без dangerouslySetInnerHTML), тож жодного
// HTML з даних у сторінку не потрапляє.
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

export function renderInline(text, keyPrefix = "") {
  const parts = String(text).split(TOKEN);
  return parts.map((part, i) => {
    const key = `${keyPrefix}${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{renderInline(part.slice(2, -2), `${key}-`)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <LocalizedLink key={key} to={href}>
          {label}
        </LocalizedLink>
      ) : (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}
