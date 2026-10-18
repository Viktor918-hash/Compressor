// round 34: підпис SigV4 для Cloudflare R2 (S3 API) і id тимчасових посилань.
// Вектори — офіційні приклади з документації AWS «Signature Version 4»
// (examplebucket, AKIAIOSFODNN7EXAMPLE, 20130524T000000Z, us-east-1).
import test from "node:test";
import assert from "node:assert/strict";
import {
  presignUrl,
  signHeaders,
  newShareId,
  isValidShareId,
  shareExpiresAt,
  safeFileName,
  parseListXml,
  sweepExpired,
  uriEncode,
} from "../api/_lib/r2.js";

const AWS = {
  host: "examplebucket.s3.amazonaws.com",
  region: "us-east-1",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  now: new Date(Date.UTC(2013, 4, 24, 0, 0, 0)),
};

test("presignUrl: офіційний приклад AWS (GET /test.txt, 86400 с)", () => {
  const url = presignUrl({ ...AWS, method: "GET", path: "/test.txt", expiresSec: 86400 });
  assert.ok(url.endsWith("X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"), url);
  assert.ok(url.includes("X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request"));
});

test("signHeaders: офіційний приклад AWS (GET Object з Range)", () => {
  const h = signHeaders({ ...AWS, method: "GET", path: "/test.txt", headers: { range: "bytes=0-9" } });
  assert.match(h.Authorization, /SignedHeaders=host;range;x-amz-content-sha256;x-amz-date,/);
  assert.ok(h.Authorization.endsWith("Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41"), h.Authorization);
});

test("signHeaders: офіційний приклад AWS (ListObjects ?max-keys=2&prefix=J)", () => {
  const h = signHeaders({ ...AWS, method: "GET", path: "/", query: { "max-keys": "2", prefix: "J" } });
  assert.ok(h.Authorization.endsWith("Signature=34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7"), h.Authorization);
});

test("uriEncode: RFC 3986 (кирилиця, пробіл, дужки)", () => {
  assert.equal(uriEncode("фото (1).jpg"), "%D1%84%D0%BE%D1%82%D0%BE%20%281%29.jpg");
});

test("id посилання: формат, час закінчення, валідація", () => {
  const exp = 1792280000;
  const id = newShareId(exp, Buffer.from("abcdefghi"));
  assert.equal(id.length, 18);
  assert.ok(isValidShareId(id));
  assert.equal(shareExpiresAt(id), exp);
  assert.equal(isValidShareId("../etc/passwd"), false);
  assert.equal(isValidShareId(id + "x"), false);
  assert.equal(isValidShareId(undefined), false);
});

test("safeFileName: без шляхів і керівних символів, кирилиця лишається, довжина ≤ 120", () => {
  assert.equal(safeFileName("../../секрет.jpg"), "секрет.jpg");
  assert.equal(safeFileName('a"b<c>.png'), "a_b_c_.png");
  assert.equal(safeFileName(""), "file");
  const long = safeFileName("x".repeat(300) + ".webp");
  assert.equal(long.length, 120);
  assert.ok(long.endsWith(".webp"));
});

test("parseListXml: ключі, розміри, продовження списку", () => {
  const xml = `<ListBucketResult><IsTruncated>true</IsTruncated><Contents><Key>shares/a/f&amp;1.jpg</Key><Size>12</Size></Contents><Contents><Key>shares/b/x.png</Key><Size>3</Size></Contents><NextContinuationToken>tok</NextContinuationToken></ListBucketResult>`;
  assert.deepEqual(parseListXml(xml), {
    items: [
      { key: "shares/a/f&1.jpg", size: 12 },
      { key: "shares/b/x.png", size: 3 },
    ],
    nextToken: "tok",
  });
});

test("sweepExpired: видаляє лише прострочені (і сміття з невалідним id)", async () => {
  const now = 1792280000;
  const live = newShareId(now + 600, Buffer.from("livelivel"));
  const dead = newShareId(now - 1, Buffer.from("deaddeadd"));
  const calls = [];
  const fakeFetch = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || "GET" });
    if (!opts.method) {
      const body = [`shares/${live}/a.jpg`, `shares/${dead}/b.jpg`, "shares/garbage/c.jpg"]
        .map((k) => `<Contents><Key>${k}</Key><Size>1</Size></Contents>`)
        .join("");
      return new Response(`<ListBucketResult><IsTruncated>false</IsTruncated>${body}</ListBucketResult>`);
    }
    return new Response(null, { status: 204 });
  };
  const cfg = { host: "acc.r2.cloudflarestorage.com", bucket: "b", accessKeyId: "k", secretAccessKey: "s" };
  const n = await sweepExpired(cfg, { nowSec: now, fetchImpl: fakeFetch });
  assert.equal(n, 2);
  const deletes = calls.filter((c) => c.method === "DELETE").map((c) => decodeURIComponent(c.url));
  assert.ok(deletes.some((u) => u.includes(dead)));
  assert.ok(deletes.some((u) => u.includes("garbage")));
  assert.ok(!deletes.some((u) => u.includes(live)));
});
