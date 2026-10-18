// round 33: зона завантаження Panel.jsx — чисті хелпери
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  acceptLabels,
  acceptKind,
  fileMatchesAccept,
  limitMb,
  pastedFileName,
  formatClock,
  estimateEtaSec,
} from "../src/components/PanelFile/uploadHints.js";

const IMG = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "image/heic": [],
  "image/heif": [],
  "": [".heic", ".heif"],
};
const VIDEO = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/x-matroska": [".mkv"],
  "": [".mp4", ".mov", ".mkv"],
};
const DOCS = {
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

test("acceptLabels: унікальні назви у порядку появи, HEIC/HEIF → один HEIC", () => {
  assert.deepEqual(acceptLabels(IMG), ["JPG", "PNG", "WebP", "HEIC"]);
  assert.deepEqual(acceptLabels(VIDEO), ["MP4", "MOV", "MKV"]);
  assert.deepEqual(acceptLabels(DOCS), ["DOC", "DOCX"]);
  assert.deepEqual(acceptLabels(undefined), []);
});

test("acceptKind: image / video / document / mixed", () => {
  assert.equal(acceptKind(IMG), "image");
  assert.equal(acceptKind(VIDEO), "video");
  assert.equal(acceptKind(DOCS), "document");
  assert.equal(acceptKind({ "image/png": [], "application/pdf": [] }), "mixed");
});

test("fileMatchesAccept: за MIME, за розширенням, і відмова для чужого типу", () => {
  assert.equal(fileMatchesAccept({ name: "a.png", type: "image/png" }, IMG), true);
  // HEIC без MIME-типу (так буває в Chrome на Windows) — за розширенням
  assert.equal(fileMatchesAccept({ name: "IMG_1.HEIC", type: "" }, IMG), true);
  assert.equal(fileMatchesAccept({ name: "doc.pdf", type: "application/pdf" }, IMG), false);
  assert.equal(fileMatchesAccept({ name: "clip.mov", type: "video/quicktime" }, VIDEO), true);
  assert.equal(fileMatchesAccept({ name: "x.gif", type: "image/gif" }, IMG), false);
  assert.equal(fileMatchesAccept({ name: "x.gif", type: "image/gif" }, { "image/*": [] }), true);
  assert.equal(fileMatchesAccept({ name: "x", type: "" }, undefined), true);
});

test("limitMb: байти → цілі МБ", () => {
  assert.equal(limitMb(30 * 1024 * 1024), 30);
  assert.equal(limitMb(200 * 1024 * 1024), 200);
  assert.equal(limitMb(15 * 1024 * 1024), 15);
});

test("pastedFileName: image.png зі скріншота → screenshot-<час>.png; справжні імена не чіпаємо", () => {
  const now = new Date(2026, 9, 18, 14, 5, 9);
  assert.equal(pastedFileName({ name: "image.png", type: "image/png" }, now), "screenshot-2026-10-18-14-05-09.png");
  assert.equal(pastedFileName({ name: "", type: "image/jpeg" }, now), "screenshot-2026-10-18-14-05-09.jpg");
  assert.equal(pastedFileName({ name: "blob", type: "image/webp" }, now), "screenshot-2026-10-18-14-05-09.webp");
  assert.equal(pastedFileName({ name: "Відпустка.jpg", type: "image/jpeg" }, now), "Відпустка.jpg");
});

test("formatClock: секунди → m:ss", () => {
  assert.equal(formatClock(0), "0:00");
  assert.equal(formatClock(9), "0:09");
  assert.equal(formatClock(83), "1:23");
  assert.equal(formatClock(-5), "0:00");
});

test("estimateEtaSec: null у перші 2 с, далі — за середньою швидкістю", () => {
  assert.equal(estimateEtaSec(10, 100, 1), null);
  assert.equal(estimateEtaSec(0, 100, 5), null);
  assert.equal(estimateEtaSec(100, 100, 5), null);
  // 50 з 200 МБ за 10 с → 5 МБ/с → лишилось 150 МБ → 30 с
  assert.equal(estimateEtaSec(50, 200, 10), 30);
});

test("демо-файли для «Спробувати на прикладі» існують і на них посилаються сторінки", () => {
  for (const f of ["demo-photo.jpg", "demo-photo.png", "demo-text.png"]) {
    assert.ok(existsSync(`public/samples/${f}`), `немає public/samples/${f}`);
  }
  const pages = {
    "src/components/Hero/Hero.jsx": "/samples/demo-photo.jpg",
    "src/components/Convertal/Convert.jsx": "/samples/demo-photo.png",
    "src/components/ImageToText/ImageToText.jsx": "/samples/demo-text.png",
  };
  for (const [file, url] of Object.entries(pages)) {
    assert.ok(readFileSync(file, "utf8").includes(`sampleUrl="${url}"`), file);
  }
});

test("демо-JPG містить GPS у EXIF (щоб на /remove-photo-metadata було що прибирати)", () => {
  const buf = readFileSync("public/samples/demo-photo.jpg");
  assert.equal(buf[0], 0xff);
  assert.equal(buf[1], 0xd8);
  assert.ok(buf.includes(Buffer.from("Exif\0\0")), "немає APP1 Exif");
  assert.ok(buf.includes(Buffer.from("Demo sample (not a real camera)")), "немає позначки демо");
});
