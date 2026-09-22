// Генерує public/sitemap.xml з src/routes.config.js — єдиного джерела URL.
// Раніше sitemap правився вручну й міг розійтись із реальними маршрутами.
//
// lastmod — дата останнього git-коміту, що чіпав код/контент сайту (не дата
// білда: Google перестає довіряти lastmod, якщо він змінюється при кожному
// деплої). Якщо git недоступний (архів без .git) — сьогоднішня дата.
// Можна задати вручну: SITEMAP_LASTMOD=2026-09-01 npm run build
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { SITE_LANGS, hreflangEntries } from "../src/utils/routeLangs.js";

const SITE_URL = "https://compressphoto.org";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function resolveLastmod() {
  if (isDate(process.env.SITEMAP_LASTMOD || "")) return process.env.SITEMAP_LASTMOD;
  const today = new Date().toISOString().slice(0, 10);
  const paths = ["src", "index.html", "public", ":(exclude)public/sitemap.xml", ":(exclude)public/tesseract"];
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  try {
    // Є незакомічені зміни в коді/контенті — значить сайт змінюється зараз
    if (git("status", "--porcelain", "--", ...paths)) return today;
    const out = git("log", "-1", "--format=%cs", "--", ...paths);
    if (isDate(out)) return out;
  } catch {
    /* немає git */
  }
  return today;
}

export function buildSitemap(lastmod = resolveLastmod(), routes = ROUTE_PATHS) {
  const urls = [];
  for (const route of routes) {
    // hreflang лише для мов, що мають URL; x-default = en, а якщо його немає — uk
    const alternates = hreflangEntries(route)
      .map(({ hrefLang, path }) => `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${SITE_URL}${path}" />`)
      .join("\n");
    for (const l of SITE_LANGS) {
      if (!route[l]) continue;
      urls.push(`  <url>\n    <loc>${SITE_URL}${route[l]}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const xml = buildSitemap();
  writeFileSync(path.join(root, "public", "sitemap.xml"), xml);
  console.log(`sitemap.xml: ${(xml.match(/<url>/g) || []).length} URL, lastmod ${xml.match(/<lastmod>([^<]+)/)?.[1]}`);
}
