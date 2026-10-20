// round 36: блог — маршрути, метадані, посилання в текстах статей
import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";
import { BLOG_POSTS, BLOG_ROUTE_PATHS, readingMinutes } from "../src/blog/posts.js";

const texts = (c) => [
  ...c.lead,
  ...c.sections.flatMap((s) => [...(s.paragraphs || []), ...(s.steps || [])]),
  ...c.faq.map((f) => f.a),
];

test("блог: індекс і 4 статті лише в uk/en, у маршрутах і sitemap", () => {
  assert.equal(BLOG_POSTS.length, 4);
  for (const r of BLOG_ROUTE_PATHS) {
    const route = ROUTE_PATHS.find((x) => x.slug === r.slug);
    assert.ok(route, r.slug);
    assert.deepEqual(Object.keys(route).sort(), ["en", "slug", "uk"]);
    assert.ok(route.uk.startsWith("/blog"));
    assert.equal(route.en, "/en" + route.uk);
  }
});

test("блог: title ≤ 60, description 120–160 у кожній мові", () => {
  for (const r of BLOG_ROUTE_PATHS) {
    for (const l of ["uk", "en"]) {
      const m = PAGE_META[r.slug][l];
      assert.ok(m.title.length <= 60, `${r.slug}.${l} title ${m.title.length}`);
      assert.ok(m.description.length >= 120 && m.description.length <= 160, `${r.slug}.${l} description ${m.description.length}`);
    }
  }
});

test("блог: внутрішні посилання ведуть на існуючі сторінки, розмітка закрита", () => {
  const ukPaths = new Set(ROUTE_PATHS.map((r) => r.uk));
  for (const post of BLOG_POSTS) {
    assert.ok(ukPaths.has(post.tool), `${post.slug}: CTA ${post.tool}`);
    for (const l of ["uk", "en"]) {
      const c = post[l];
      assert.ok(c.faq.length >= 4 && c.faq.length <= 6, `${post.slug}.${l} faq`);
      assert.ok(readingMinutes(post, l) >= 2);
      for (const text of texts(c)) {
        for (const [, href] of text.matchAll(/\]\(([^)]+)\)/g)) {
          assert.ok(ukPaths.has(href), `${post.slug}.${l}: битий лінк ${href}`);
        }
        assert.equal((text.match(/\*\*/g) || []).length % 2, 0, `${post.slug}.${l}: незакритий **`);
        assert.equal((text.match(/`/g) || []).length % 2, 0, `${post.slug}.${l}: незакритий \``);
      }
    }
  }
});

test("блог: факти звірені з кодом (якість JPG 90%, ліміти відео 3/6, 200 МБ)", async () => {
  const { readFileSync } = await import("node:fs");
  const jpg = readFileSync("src/components/Convertal/convertToJpg.jsx", "utf8");
  assert.match(jpg, /0\.9 \/\/ якість 90%/);
  const heic = BLOG_POSTS.find((p) => p.slug === "blogHeicToJpgWindows");
  assert.ok(heic.uk.faq.some((f) => f.a.includes("(90%)")));
  const usage = readFileSync("api/_lib/usageLimit.js", "utf8");
  assert.match(usage, /GUEST_DAILY_LIMIT = 3;/);
  assert.match(usage, /USER_DAILY_LIMIT = 6;/);
  const video = BLOG_POSTS.find((p) => p.slug === "blogVideoWhatsapp");
  assert.ok(texts(video.uk).some((t) => t.includes("3 конвертації на день") && t.includes("200 МБ")));
});
