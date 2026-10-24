// Нові інструменти (хвиля 1): маршрути, SEO-метадані й переклади в усіх 4 мовах.
// title ≤ 60, description 120–160, SEO-текст 250–500 слів (round 39: тексти скорочено,
// верхня межа — щоб вони знову не розросталися «водою»), однакова структура ключів,
// однакові {{плейсхолдери}} — щоб при перекладі нічого не загубилось.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROUTE_PATHS } from "../src/routes.config.js";
import { PAGE_META } from "../src/seoMeta.js";

const LANGS = ["uk", "en", "ru", "es"];
const TOOLS = {
  compressToSize: { ru: "/ru/compress-image-to-size", es: "/es/comprimir-imagen-a-kb", sections: 5 },
  convertToPng: { ru: "/ru/convert-to-png", es: "/es/convertir-a-png", sections: 5 },
  removeExif: { ru: "/ru/remove-photo-metadata", es: "/es/eliminar-metadatos-foto", sections: 6 },
  photoToPdf: { ru: "/ru/photo-to-pdf", es: "/es/foto-a-pdf", sections: 6 },
  cropImage: { ru: "/ru/crop-image", es: "/es/recortar-imagen", sections: 6 },
  rotateImage: { ru: "/ru/rotate-image", es: "/es/girar-imagen", sections: 5 },
  addWatermark: { ru: "/ru/add-watermark", es: "/es/marca-de-agua", sections: 6 },
  blackAndWhite: { ru: "/ru/black-and-white", es: "/es/foto-en-blanco-y-negro", sections: 5 },
  circleCrop: { ru: "/ru/circle-crop", es: "/es/recorte-circular", sections: 5 },
  compressVideo: { ru: "/ru/compress-video", es: "/es/comprimir-video", sections: 5 },
  // Раунд 24: прості конвертери формату відео (не стиснення).
  convertMovToMp4: { ru: "/ru/convert-mov-to-mp4", es: "/es/convertir-mov-a-mp4", sections: 5 },
  convertMkvToMp4: { ru: "/ru/convert-mkv-to-mp4", es: "/es/convertir-mkv-a-mp4", sections: 5 },
  convertWebmToMp4: { ru: "/ru/convert-webm-to-mp4", es: "/es/convertir-webm-a-mp4", sections: 5 },
  // Раунд 36: відео в браузері (FFmpeg.wasm).
  videoToMp3: { ru: "/ru/video-to-mp3", es: "/es/video-a-mp3", sections: 5 },
  trimVideo: { ru: "/ru/trim-video", es: "/es/recortar-video", sections: 5 },
};
const read = (l) => JSON.parse(readFileSync(`src/i18n/locales/${l}/translation.json`, "utf8"));
const words = (s) => (String(s).match(/[\p{L}\p{N}'’-]+/gu) || []).length;
const walk = (x) => (typeof x === "string" ? [x] : Array.isArray(x) ? x.flatMap(walk) : x && typeof x === "object" ? Object.values(x).flatMap(walk) : []);
const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, p + k + ".") : [p + k]));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[p + k, v]] : v && typeof v === "object" ? flat(v, p + k + ".") : []));
const ph = (s) => (String(s).match(/\{\{\w+\}\}/g) || []).sort().join();

for (const [slug, exp] of Object.entries(TOOLS)) {
  test(`${slug}: маршрут у 4 мовах, метадані й SEO-текст у кожній`, () => {
    const r = ROUTE_PATHS.find((x) => x.slug === slug);
    assert.deepEqual(Object.keys(r).sort(), ["en", "es", "ru", "slug", "uk"]);
    assert.equal(r.ru, exp.ru);
    assert.equal(r.es, exp.es);
    assert.equal(r.en, "/en" + r.uk);
    for (const l of LANGS) {
      const m = PAGE_META[slug][l];
      assert.ok(m.title.length <= 60, `${l} title ${m.title.length}`);
      assert.ok(m.description.length >= 120 && m.description.length <= 160, `${l} description ${m.description.length}`);
      const seo = read(l).seoContent[slug];
      const total = walk(seo).reduce((n, s) => n + words(s), 0);
      assert.ok(total >= 250 && total <= 500, `${l}: ${total} слів (очікується 250–500)`);
      assert.equal(seo.benefits.length, 4);
      assert.ok(seo.faq.length >= 4 && seo.faq.length <= 6);
      assert.ok(seo.sections.length >= 2 && seo.sections.length <= exp.sections, `${l}: розділів ${seo.sections.length}`);
    }
  });

  test(`${slug}: ключі перекладу й {{плейсхолдери}} збігаються з uk у ru/en/es`, () => {
    const uk = read("uk");
    const base = Object.fromEntries(flat(uk[slug]));
    for (const l of LANGS.slice(1)) {
      const tr = read(l);
      assert.deepEqual(keys(tr[slug]).sort(), keys(uk[slug]).sort(), `${l}: ключі ${slug} відрізняються від uk`);
      assert.deepEqual(keys(tr.seoContent[slug]).length > 0, true);
      const other = Object.fromEntries(flat(tr[slug]));
      for (const [k, v] of Object.entries(base)) assert.equal(ph(other[k]), ph(v), `${l}.${slug}.${k}`);
      assert.ok(tr.header[slug] && tr.header[slug + "Desc"], `${l}: header.${slug}`);
    }
  });
}

test("title і description унікальні по всьому сайту", () => {
  const all = Object.values(PAGE_META).flatMap((m) => Object.values(m));
  assert.equal(new Set(all.map((m) => m.title)).size, all.length);
  assert.equal(new Set(all.map((m) => m.description)).size, all.length);
});
