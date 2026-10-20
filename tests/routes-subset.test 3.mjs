// Маршрути, що існують не в усіх мовах ({ slug, uk, en } без ru/es).
import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { buildSitemap } from "../scripts/generate-sitemap.mjs";
import {
  SITE_LANGS,
  langFromPath,
  hasLang,
  routeLangs,
  langUrl,
  xDefaultPath,
  hreflangEntries,
  routesForLang,
  findRouteByPath,
  switchLanguageTarget,
} from "../src/utils/routeLangs.js";
import { makeRequiredIn } from "./helpers/requiredLangs.mjs";

const FAKE_UK_EN = { slug: "fake", uk: "/fake-tool", en: "/en/fake-tool" };
const FAKE_UK_ONLY = { slug: "fakeUk", uk: "/tilky-uk" };
const FULL = ROUTE_PATHS.find((r) => r.slug === "resize");
const ROUTES = [...ROUTE_PATHS, FAKE_UK_EN, FAKE_UK_ONLY];

test("sitemap: маршрут без ru/es дає лише свої URL, hreflang без undefined, x-default = en", () => {
  const xml = buildSitemap("2026-01-01", [FAKE_UK_EN]);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, ["https://compressphoto.org/fake-tool", "https://compressphoto.org/en/fake-tool"]);
  assert.ok(!xml.includes("undefined"));
  const langs = [...xml.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(langs.slice(0, 3), ["uk", "en", "x-default"]);
  assert.equal(langs.length, 6); // 3 у кожному з двох <url>
  assert.match(xml, /hreflang="x-default" href="https:\/\/compressphoto\.org\/en\/fake-tool"/);
});

test("sitemap: маршрут лише з uk — x-default веде на uk", () => {
  const xml = buildSitemap("2026-01-01", [FAKE_UK_ONLY]);
  assert.match(xml, /hreflang="x-default" href="https:\/\/compressphoto\.org\/tilky-uk"/);
  assert.equal((xml.match(/<url>/g) || []).length, 1);
  assert.ok(!xml.includes("undefined"));
});

test("sitemap: справжні маршрути — жодного undefined, рівно по одному <url> на кожну наявну мову", () => {
  const xml = buildSitemap("2026-01-01");
  assert.ok(!xml.includes("undefined"));
  const expected = ROUTE_PATHS.reduce(
    (sum, r) => sum + SITE_LANGS.filter((l) => r[l]).length,
    0
  );
  assert.equal((xml.match(/<url>/g) || []).length, expected);
});

test("hreflang: лише наявні мови + x-default", () => {
  assert.deepEqual(routeLangs(FAKE_UK_EN), ["uk", "en"]);
  assert.deepEqual(
    hreflangEntries(FAKE_UK_EN).map((e) => e.hrefLang),
    ["uk", "en", "x-default"]
  );
  assert.equal(xDefaultPath(FAKE_UK_EN), "/en/fake-tool");
  assert.equal(xDefaultPath(FAKE_UK_ONLY), "/tilky-uk");
  assert.equal(hreflangEntries(FULL).length, 5);
});

test("посилання: запасний URL обрана мова → en → uk; hasLang для меню/футера", () => {
  assert.equal(langUrl(FAKE_UK_EN, "ru"), "/en/fake-tool");
  assert.equal(langUrl(FAKE_UK_EN, "es"), "/en/fake-tool");
  assert.equal(langUrl(FAKE_UK_ONLY, "en"), "/tilky-uk");
  assert.equal(langUrl(FULL, "es"), FULL.es);
  assert.equal(hasLang(FAKE_UK_EN, "ru"), false);
  assert.equal(hasLang(FAKE_UK_EN, "en"), true);
  assert.equal(hasLang(undefined, "en"), false);
});

test("App: маршрути створюються лише для мов, що мають URL", () => {
  assert.ok(routesForLang(ROUTES, "ru").every((r) => r.ru));
  assert.ok(!routesForLang(ROUTES, "ru").includes(FAKE_UK_EN));
  assert.ok(routesForLang(ROUTES, "en").includes(FAKE_UK_EN));
  assert.ok(!routesForLang(ROUTES, "en").includes(FAKE_UK_ONLY));
  assert.equal(routesForLang(ROUTES, "uk").length, ROUTES.length);
});

test("перемикач мови: відповідник сторінки, а без нього — головна цієї мови", () => {
  assert.equal(switchLanguageTarget(ROUTES, FULL.uk, "es"), FULL.es);
  assert.equal(switchLanguageTarget(ROUTES, "/fake-tool", "en"), "/en/fake-tool");
  assert.equal(switchLanguageTarget(ROUTES, "/fake-tool", "ru"), "/ru");
  assert.equal(switchLanguageTarget(ROUTES, "/en/fake-tool", "es"), "/es");
  assert.equal(switchLanguageTarget(ROUTES, "/en/fake-tool", "uk"), "/fake-tool");
  assert.equal(switchLanguageTarget(ROUTES, "/tilky-uk", "en"), "/en");
  assert.equal(switchLanguageTarget(ROUTES, "/en/fake-tool/", "uk"), "/fake-tool"); // кінцевий "/"
  assert.equal(switchLanguageTarget(ROUTES, "/no-such-page", "es"), "/es");
  assert.equal(findRouteByPath(ROUTES, "/en/fake-tool"), FAKE_UK_EN);
});

test("мова за URL: межа сегмента, а не просто префікс (/enhance-photo — це uk)", () => {
  assert.equal(langFromPath("/"), "uk");
  assert.equal(langFromPath("/en"), "en");
  assert.equal(langFromPath("/en/resize-image"), "en");
  assert.equal(langFromPath("/ru"), "ru");
  assert.equal(langFromPath("/es/imagen-a-texto"), "es");
  assert.equal(langFromPath("/enhance-photo"), "uk");
  assert.equal(langFromPath("/rubber-stamp"), "uk");
  assert.equal(langFromPath("/estimate-size"), "uk");
  assert.equal(langFromPath("/resize-image"), "uk");
});

test("i18n: ключі інструмента без ru/es обов'язкові лише для його мов", () => {
  const { requiredIn, ownerOf } = makeRequiredIn([...ROUTE_PATHS, FAKE_UK_EN], SITE_LANGS);
  assert.deepEqual(requiredIn("seoContent.fake.title"), ["uk", "en"]);
  assert.deepEqual(requiredIn("fake.panel.addMore"), ["uk", "en"]);
  assert.deepEqual(requiredIn("header.fake"), ["uk", "en"]);
  assert.deepEqual(requiredIn("header.fakeDesc"), ["uk", "en"]);
  // чужі ключі — в усіх мовах
  assert.deepEqual(requiredIn("header.resize"), SITE_LANGS);
  assert.deepEqual(requiredIn("seoContent.resize.title"), SITE_LANGS);
  assert.deepEqual(requiredIn("panel.cancel"), SITE_LANGS);
  assert.equal(ownerOf("fakeish.x"), undefined); // "fake." ≠ "fakeish."
});
