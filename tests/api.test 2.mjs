// Тести серверної частини конвертації (api/*): мокаємо Supabase і CloudConvert
// через globalThis.fetch, реальних запитів і платних конвертацій немає.
// Запуск: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

process.env.SUPABASE_URL = "http://fake.supabase.local";
process.env.SUPABASE_SERVICE_ROLE_KEY = "x";
process.env.CLOUDCONVERT_API_KEY = "k";

let rpcCalls = [], ccCalls = [], rpcMode = "ok", usageLeft = 3, ccMode = "ok", bigOut = false;
globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  if (url.startsWith("http://fake.supabase.local/rest/v1/rpc/increment_conversion_usage")) {
    rpcCalls.push(JSON.parse(opts.body));
    if (rpcMode === "err") return new Response(JSON.stringify({ message: "boom" }), { status: 500, headers: { "content-type": "application/json" } });
    const allowed = usageLeft > 0; if (allowed) usageLeft--;
    return new Response(JSON.stringify([{ allowed, remaining: usageLeft }]), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ message: "bad" }), { status: 401, headers: { "content-type": "application/json" } });
  if (url === "https://api.cloudconvert.com/v2/jobs" && opts.method === "POST") {
    ccCalls.push(JSON.parse(opts.body).tasks["import-file"].filename);
    return new Response(JSON.stringify({ data: { id: "job1" } }), { status: 201 });
  }
  if (url.startsWith("https://api.cloudconvert.com/v2/jobs/job1") && opts.method === "DELETE") { ccCalls.push("DELETE"); return new Response(null, { status: 204 }); }
  if (url.startsWith("https://api.cloudconvert.com/v2/jobs/job1")) {
    if (ccMode === "error") return new Response(JSON.stringify({ data: { tasks: [{ name: "convert-file", status: "error", message: "SECRET internal detail" }] } }));
    return new Response(JSON.stringify({ data: { tasks: [{ name: "export-file", status: "finished", result: { files: [{ url: "https://out.local/f" }] } }] } }));
  }
  if (url === "https://out.local/f") return new Response(bigOut ? Buffer.alloc(4.6 * 1024 * 1024) : Buffer.from("%PDF-out"));
  throw new Error("unexpected fetch " + url);
};

const wordH = (await import("../api/word-to-pdf.js")).default;
const pdfH = (await import("../api/pdf-to-word.js")).default;
const { ipv6Prefix64, guestIdentifier } = await import("../api/_lib/usageLimit.js");

function mkReq(body, headers = {}, method = "POST") {
  const r = Readable.from(body ? [body] : []);
  r.method = method; r.headers = { "content-type": "application/octet-stream", ...headers }; r.socket = { remoteAddress: "9.9.9.9" };
  return r;
}
function mkRes() {
  return { headers: {}, code: 200, body: null, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; }, send(b) { this.body = b; return this; } };
}
const docx = Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.from("....word/document.xml....")]);
const xlsx = Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.from("....xl/workbook.xml....")]);
const pdf = Buffer.from("%PDF-1.4 hello");
async function run(h, body, headers, method) { const res = mkRes(); await h(mkReq(body, headers, method), res); return res; }
const reset = () => { rpcCalls = []; ccCalls = []; rpcMode = "ok"; usageLeft = 3; ccMode = "ok"; bigOut = false; };
// сервер логує очікувані помилки через console.error — приглушуємо шум у тестах
const origError = console.error; console.error = () => {};
process.on("exit", () => { console.error = origError; });

test("docx → pdf: успіх, ім'я файлу зберігається, ліміт рахується за IP", async () => {
  reset();
  const r = await run(wordH, docx, { "x-filename": encodeURIComponent("Договір №1.docx"), "x-anon-id": "rand-1" });
  assert.equal(r.code, 200);
  assert.equal(ccCalls[0], "Договір №1.docx");
  assert.ok(rpcCalls[0].p_identifier.startsWith("ip:"));
  assert.ok(!rpcCalls[0].p_identifier.includes("rand-1"));
});
test("зміна X-Anon-Id НЕ змінює ключ ліміту (обхід закрито)", async () => {
  reset();
  await run(wordH, docx, { "x-anon-id": "A" });
  await run(wordH, docx, { "x-anon-id": "B" });
  assert.equal(rpcCalls[0].p_identifier, rpcCalls[1].p_identifier);
});
test("ліміт вичерпано → 429 і CloudConvert не викликається", async () => {
  reset(); usageLeft = 0;
  const r = await run(wordH, docx);
  assert.deepEqual([r.code, r.body.error, r.body.isGuest], [429, "LIMIT_REACHED", true]);
  assert.equal(ccCalls.length, 0);
});
test("помилка обліку → fail-closed 503 (а не безкоштовна конвертація)", async () => {
  reset(); rpcMode = "err";
  const r = await run(wordH, docx);
  assert.deepEqual([r.code, r.body.error], [503, "SERVICE_UNAVAILABLE"]);
  assert.equal(ccCalls.length, 0);
});
test("не той тип файлу → 415, квота не списується", async () => {
  reset();
  const r = await run(wordH, Buffer.from("hello text file"));
  assert.deepEqual([r.code, r.body.error], [415, "INVALID_FILE_TYPE"]);
  assert.equal(rpcCalls.length, 0);
  const r2 = await run(wordH, xlsx);
  assert.equal(r2.code, 415);
  const r3 = await run(pdfH, docx);
  assert.equal(r3.code, 415);
});
test("порожній файл → 400, квота не списується", async () => {
  reset();
  const r = await run(wordH, null);
  assert.deepEqual([r.code, r.body.error], [400, "EMPTY_FILE"]);
  assert.equal(rpcCalls.length, 0);
});
test("завеликий файл → 413 (за тілом і за Content-Length), квота не списується", async () => {
  reset();
  const r = await run(wordH, Buffer.alloc(4 * 1024 * 1024 + 10, 1));
  assert.deepEqual([r.code, r.body.error], [413, "FILE_TOO_LARGE"]);
  const r2 = await run(wordH, docx, { "content-length": String(10 * 1024 * 1024) });
  assert.equal(r2.code, 413);
  assert.equal(rpcCalls.length, 0);
});
test("некоректний X-Filename не дає 500; шлях з ../ санітизується", async () => {
  reset();
  let r = await run(wordH, docx, { "x-filename": "%E0%A4%A" });
  assert.equal(r.code, 200);
  assert.equal(ccCalls[0], "document.docx");
  reset();
  r = await run(wordH, docx, { "x-filename": encodeURIComponent("../../etc/passwd\u0000.docx") });
  assert.ok(!ccCalls[0].includes("/") && !ccCalls[0].includes("\\"));
});
test("помилка CloudConvert: клієнт бачить лише код, job скасовується", async () => {
  reset(); ccMode = "error";
  const r = await run(wordH, docx);
  assert.deepEqual([r.code, r.body.error], [502, "CONVERSION_FAILED"]);
  assert.ok(!JSON.stringify(r.body).includes("SECRET"));
  assert.ok(ccCalls.includes("DELETE"));
});
test("результат > 4.4 МБ → 413 RESULT_TOO_LARGE (ліміт відповіді Vercel)", async () => {
  reset(); bigOut = true;
  const r = await run(wordH, docx);
  assert.deepEqual([r.code, r.body.error], [413, "RESULT_TOO_LARGE"]);
});
test("pdf → word: успіх; GET → 405", async () => {
  reset();
  const r = await run(pdfH, pdf, { "x-filename": "a.pdf" });
  assert.equal(r.code, 200);
  assert.ok(r.headers["Content-Type"].includes("wordprocessingml"));
  const g = await run(wordH, docx, {}, "GET");
  assert.deepEqual([g.code, g.body.error], [405, "METHOD_NOT_ALLOWED"]);
});
test("IPv6 групується за /64, IPv4-mapped == IPv4", () => {
  assert.equal(ipv6Prefix64("2001:db8:1:2:aaaa:bbbb:cccc:dddd"), "2001:db8:1:2");
  assert.equal(ipv6Prefix64("2001:db8::1"), "2001:db8:0:0");
  assert.equal(ipv6Prefix64("::1"), "0:0:0:0");
  assert.equal(guestIdentifier({ headers: { "x-real-ip": "2001:db8:1:2::1" } }), guestIdentifier({ headers: { "x-real-ip": "2001:db8:1:2:ffff::9" } }));
  assert.equal(guestIdentifier({ headers: { "x-real-ip": "::ffff:1.2.3.4" } }), guestIdentifier({ headers: { "x-real-ip": "1.2.3.4" } }));
});
