import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { buildSitemap } from "../scripts/generate-sitemap.mjs";

const LANGS = ["uk", "en", "ru", "es"];

test("sitemap: кожен маршрут × мова, з lastmod і hreflang", () => {
  const xml = buildSitemap("2026-01-02");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // маршрут може існувати не в усіх мовах — беремо лише наявні
  const expected = ROUTE_PATHS.flatMap((r) =>
    LANGS.filter((l) => r[l]).map((l) => `https://compressphoto.org${r[l]}`)
  );
  assert.deepEqual([...locs].sort(), [...expected].sort());
  assert.equal(new Set(locs).size, locs.length, "дублікати URL");
  assert.equal((xml.match(/<lastmod>2026-01-02<\/lastmod>/g) || []).length, locs.length);
  // у кожному <url>: усі наявні мови маршруту + x-default
  const hreflangs = ROUTE_PATHS.reduce(
    (sum, r) => sum + LANGS.filter((l) => r[l]).length * (LANGS.filter((l) => r[l]).length + 1),
    0
  );
  assert.equal((xml.match(/hreflang=/g) || []).length, hreflangs);
});

test("robots.txt не забороняє неіснуючі сторінки й посилається на sitemap", () => {
  const robots = readFileSync("public/robots.txt", "utf8");
  assert.ok(!/account/i.test(robots));
  assert.match(robots, /Sitemap: https:\/\/compressphoto\.org\/sitemap\.xml/);
  const disallowed = [...robots.matchAll(/Disallow:\s*(\S+)/g)].map((m) => m[1]);
  for (const d of disallowed) {
    for (const r of ROUTE_PATHS) for (const l of LANGS) {
      if (!r[l]) continue;
      assert.ok(!r[l].startsWith(d), `Disallow ${d} блокує реальну сторінку ${r[l]}`);
    }
  }
});

test("OG-картинки: по одній на мову, 1200×630, легкі", () => {
  for (const l of LANGS) {
    const f = `public/og/og-${l}.png`;
    assert.ok(existsSync(f), f);
    const b = readFileSync(f);
    assert.equal(b.readUInt32BE(16), 1200);
    assert.equal(b.readUInt32BE(20), 630);
    assert.ok(b.length < 300 * 1024, `${f} завеликий: ${b.length}`);
  }
  const logo = readFileSync("public/logo-512.png");
  assert.equal(logo.readUInt32BE(16), 512);
  assert.equal(logo.readUInt32BE(20), 512);
});
