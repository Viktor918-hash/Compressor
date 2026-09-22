// ТІЛЬКИ ДЛЯ E2E-ПЕРЕВІРОК. Сторінка-заглушка, на якій перевіряється
// Panel mode="merge" і маршрут із підмножиною мов ({ uk, en } без ru/es).
//
// Вона підключається лише коли збірка запущена з VITE_E2E_STUB=1
// (див. src/routes.jsx, src/toolsCatalog.js). У routes.config.js її НЕМАЄ,
// тому вона не потрапляє ні в prerender, ні в sitemap, ні в звичайну збірку.
//
// Поведінка processAll керується з тесту через window.__E2E_MERGE:
//   { steps, delay, fail, failOnce }  — і пишеться в window.__E2E_MERGE_CALLS.
import Panel from "../components/PanelFile/Panel";
import SeoHead from "../components/Seo/SeoHead";
import { ROUTES } from "../routes";
import { usePageLang } from "../hooks/usePageLang";

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });

// Зливає текстові файли в одному порядку, у якому вони надійшли
async function processAll(files, { signal, onProgress }) {
  const cfg = (window.__E2E_MERGE = window.__E2E_MERGE || {});
  (window.__E2E_MERGE_CALLS = window.__E2E_MERGE_CALLS || []).push(
    files.map((f) => f.name)
  );
  const steps = cfg.steps ?? 3;
  for (let i = 1; i <= steps; i++) {
    await sleep(cfg.delay ?? 40, signal);
    onProgress?.({ text: `Крок ${i}/${steps}`, value: i / steps });
  }
  if (cfg.fail) {
    if (cfg.failOnce) cfg.fail = false;
    throw new Error("boom");
  }
  const parts = await Promise.all(files.map((f) => f.text()));
  return {
    blob: new Blob([parts.join("+")], { type: "text/plain" }),
    name: "merged.txt",
  };
}

const MergeStub = () => {
  const lang = usePageLang();
  const route = ROUTES.find((r) => r.slug === "e2eMerge");
  return (
    <>
      <SeoHead route={route} lang={lang} title="E2E merge stub" />
      <Panel
        mode="merge"
        acceptedTypes={{ "text/plain": [".txt"] }}
        processAll={processAll}
        mergeButtonText="Створити"
        dropzoneText="Перетягніть .txt-файли"
        maxFiles={6}
        downloadOneText="Завантажити результат"
      >
        <h1 className="main__title">E2E merge stub</h1>
      </Panel>
    </>
  );
};

export default MergeStub;
