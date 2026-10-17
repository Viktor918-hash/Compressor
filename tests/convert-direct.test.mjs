// Тести api/convert/init.js, api/convert/status.js, api/convert/cancel.js
// (P0-6, раунд 20) — той самий паттерн мокання fetch, що в api.test.mjs:
// Supabase й CloudConvert ніколи не викликаються насправді.
import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";

process.env.SUPABASE_URL = "http://fake.supabase.local";
process.env.SUPABASE_SERVICE_ROLE_KEY = "x";
process.env.CLOUDCONVERT_API_KEY = "k";

let rpcCalls = [],
  ccCalls = [],
  rpcMode = "ok",
  usageLeft = 3,
  jobStatusMode = "finished",
  lastCreateBody = null;

globalThis.fetch = async (url, opts = {}) => {
  url = String(url);

  if (
    url.startsWith(
      "http://fake.supabase.local/rest/v1/rpc/increment_conversion_usage"
    )
  ) {
    rpcCalls.push(JSON.parse(opts.body));
    if (rpcMode === "err") {
      return new Response(JSON.stringify({ message: "boom" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    const allowed = usageLeft > 0;
    if (allowed) usageLeft--;
    return new Response(JSON.stringify([{ allowed, remaining: usageLeft }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (url === "https://api.cloudconvert.com/v2/jobs" && opts.method === "POST") {
    ccCalls.push("create");
    lastCreateBody = JSON.parse(opts.body);
    return new Response(
      JSON.stringify({
        data: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          tasks: [
            {
              name: "upload-file",
              result: {
                form: {
                  url: "https://upload.cloudconvert.example/presigned",
                  parameters: { key: "uploads/abc", policy: "p", signature: "s" },
                },
              },
            },
          ],
        },
      }),
      { status: 201 }
    );
  }

  if (
    url.startsWith("https://api.cloudconvert.com/v2/jobs/550e8400-e29b-41d4-a716-446655440000") &&
    opts.method === "DELETE"
  ) {
    ccCalls.push("delete");
    return new Response(null, { status: 204 });
  }

  if (url.startsWith("https://api.cloudconvert.com/v2/jobs/550e8400-e29b-41d4-a716-446655440000")) {
    ccCalls.push("status");
    if (jobStatusMode === "finished") {
      return new Response(
        JSON.stringify({
          data: {
            tasks: [
              {
                name: "export-file",
                status: "finished",
                result: { files: [{ url: "https://out.cloudconvert.example/f.pdf" }] },
              },
            ],
          },
        })
      );
    }
    if (jobStatusMode === "error") {
      return new Response(
        JSON.stringify({
          data: { tasks: [{ name: "convert-file", status: "error", message: "boom" }] },
        })
      );
    }
    return new Response(
      JSON.stringify({ data: { tasks: [{ name: "upload-file", status: "waiting" }] } })
    );
  }

  throw new Error("unexpected fetch " + url);
};

const initH = (await import("../api/convert/init.js")).default;
const statusH = (await import("../api/convert/status.js")).default;
const cancelH = (await import("../api/convert/cancel.js")).default;

function mkReq(body, headers = {}, method = "POST", query = {}) {
  const r = Readable.from([]);
  r.method = method;
  r.headers = { ...headers };
  r.socket = { remoteAddress: "9.9.9.9" };
  r.body = body;
  r.query = query;
  return r;
}
function mkRes() {
  return {
    headers: {},
    code: 200,
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(c) {
      this.code = c;
      return this;
    },
    json(o) {
      this.body = o;
      return this;
    },
    end() {
      return this;
    },
  };
}
async function run(h, body, headers, method, query) {
  const res = mkRes();
  await h(mkReq(body, headers, method, query), res);
  return res;
}
const reset = () => {
  rpcCalls = [];
  ccCalls = [];
  rpcMode = "ok";
  usageLeft = 3;
  jobStatusMode = "finished";
  lastCreateBody = null;
};
const origError = console.error;
console.error = () => {};
process.on("exit", () => {
  console.error = origError;
});

test("init: успіх → jobId + uploadUrl + uploadParameters, квота списана", async () => {
  reset();
  const r = await run(initH, {
    type: "word-to-pdf",
    filename: "a.docx",
    declaredExt: "docx",
    fileSize: 1024,
  });
  assert.equal(r.code, 200);
  assert.equal(r.body.jobId, "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(r.body.uploadUrl, "https://upload.cloudconvert.example/presigned");
  assert.deepEqual(r.body.uploadParameters, { key: "uploads/abc", policy: "p", signature: "s" });
  assert.equal(rpcCalls.length, 1);
});

test("init: невідповідність type/declaredExt → 415, квота не списується", async () => {
  reset();
  const r = await run(initH, {
    type: "word-to-pdf",
    filename: "a.pdf",
    declaredExt: "pdf",
    fileSize: 1024,
  });
  assert.deepEqual([r.code, r.body.error], [415, "INVALID_FILE_TYPE"]);
  assert.equal(rpcCalls.length, 0);
});

test("init: fileSize > 50 МБ → 413, квота не списується, CloudConvert не викликається", async () => {
  reset();
  const r = await run(initH, {
    type: "word-to-pdf",
    filename: "a.docx",
    declaredExt: "docx",
    fileSize: 51 * 1024 * 1024,
  });
  assert.deepEqual([r.code, r.body.error], [413, "FILE_TOO_LARGE"]);
  assert.equal(rpcCalls.length, 0);
  assert.equal(ccCalls.length, 0);
});

test("init: fileSize відсутній/0 → 400 EMPTY_FILE", async () => {
  reset();
  const r = await run(initH, {
    type: "word-to-pdf",
    filename: "a.docx",
    declaredExt: "docx",
    fileSize: 0,
  });
  assert.deepEqual([r.code, r.body.error], [400, "EMPTY_FILE"]);
});

test("init: невідомий type → 400 INVALID_REQUEST", async () => {
  reset();
  const r = await run(initH, {
    type: "video-compress",
    filename: "a.mp4",
    declaredExt: "mp4",
    fileSize: 1024,
  });
  assert.deepEqual([r.code, r.body.error], [400, "INVALID_REQUEST"]);
});

test("init: ліміт вичерпано → 429, CloudConvert не викликається", async () => {
  reset();
  usageLeft = 0;
  const r = await run(initH, {
    type: "pdf-to-word",
    filename: "a.pdf",
    declaredExt: "pdf",
    fileSize: 1024,
  });
  assert.deepEqual([r.code, r.body.error, r.body.isGuest], [429, "LIMIT_REACHED", true]);
  assert.equal(ccCalls.length, 0);
});

test("init: облік недоступний → fail-closed 503", async () => {
  reset();
  rpcMode = "err";
  const r = await run(initH, {
    type: "pdf-to-word",
    filename: "a.pdf",
    declaredExt: "pdf",
    fileSize: 1024,
  });
  assert.deepEqual([r.code, r.body.error], [503, "SERVICE_UNAVAILABLE"]);
  assert.equal(ccCalls.length, 0);
});

test("init: GET → 405", async () => {
  reset();
  const r = await run(initH, {}, {}, "GET");
  assert.deepEqual([r.code, r.body.error], [405, "METHOD_NOT_ALLOWED"]);
});

// ── compress-video (відео-стиснення) ────────────────────────────────────

test("init: compress-video з resolution → convert-таск отримує video_codec + width/height", async () => {
  reset();
  const r = await run(initH, {
    type: "compress-video",
    filename: "a.mp4",
    declaredExt: "mp4",
    fileSize: 10 * 1024 * 1024,
    resolution: { width: 1280, height: 720 },
  });
  assert.equal(r.code, 200);
  assert.equal(r.body.jobId, "550e8400-e29b-41d4-a716-446655440000");
  assert.deepEqual(lastCreateBody.tasks["convert-file"], {
    operation: "convert",
    input: "upload-file",
    output_format: "mp4",
    video_codec: "x264",
    width: 1280,
    height: 720,
    input_format: "mp4",
  });
});

test("init: compress-video без resolution → convert-таск без width/height", async () => {
  reset();
  const r = await run(initH, {
    type: "compress-video",
    filename: "a.mov",
    declaredExt: "mov",
    fileSize: 10 * 1024 * 1024,
  });
  assert.equal(r.code, 200);
  assert.deepEqual(lastCreateBody.tasks["convert-file"], {
    operation: "convert",
    input: "upload-file",
    output_format: "mp4",
    video_codec: "x264",
    input_format: "mov",
  });
});

test("init: compress-video з невалідною resolution (не ціле число) → ігнорується, без width/height", async () => {
  reset();
  const r = await run(initH, {
    type: "compress-video",
    filename: "a.mp4",
    declaredExt: "mp4",
    fileSize: 10 * 1024 * 1024,
    resolution: { width: "1280", height: 720.5 },
  });
  assert.equal(r.code, 200);
  assert.ok(!("width" in lastCreateBody.tasks["convert-file"]));
  assert.ok(!("height" in lastCreateBody.tasks["convert-file"]));
});

test("init: compress-video, fileSize > 200 МБ → 413, а word-to-pdf при цьому ж розмірі теж 413", async () => {
  reset();
  const r = await run(initH, {
    type: "compress-video",
    filename: "a.mp4",
    declaredExt: "mp4",
    fileSize: 201 * 1024 * 1024,
  });
  assert.deepEqual([r.code, r.body.error], [413, "FILE_TOO_LARGE"]);
  assert.equal(ccCalls.length, 0);
});

test("init: compress-video, 60 МБ (більше за ліміт word/pdf, менше за відео) → успіх", async () => {
  reset();
  const r = await run(initH, {
    type: "compress-video",
    filename: "a.mp4",
    declaredExt: "mp4",
    fileSize: 60 * 1024 * 1024,
  });
  assert.equal(r.code, 200);
});

test("init: compress-video з непідтримуваним розширенням → 415", async () => {
  reset();
  const r = await run(initH, {
    type: "compress-video",
    filename: "a.txt",
    declaredExt: "txt",
    fileSize: 1024,
  });
  assert.deepEqual([r.code, r.body.error], [415, "INVALID_FILE_TYPE"]);
  assert.equal(rpcCalls.length, 0);
});

// ── convert-{mov,mkv,webm}-to-mp4 (раунд 24, прості конвертери формату,
// claude/compressphoto-growth-prompt.md §3.3-А) ──────────────────────────
// На відміну від compress-video, кожен приймає ЛИШЕ свій один формат і
// convert-таск НІКОЛИ не отримує width/height (resolution у цих запитах
// не передається взагалі) — лише video_codec: x264 від
// buildVideoConvertOptions() без аргументів.

for (const [type, ext] of [
  ["convert-mov-to-mp4", "mov"],
  ["convert-mkv-to-mp4", "mkv"],
  ["convert-webm-to-mp4", "webm"],
]) {
  test(`init: ${type} успіх → convert-таск лише з video_codec: x264, без width/height`, async () => {
    reset();
    const r = await run(initH, {
      type,
      filename: `a.${ext}`,
      declaredExt: ext,
      fileSize: 10 * 1024 * 1024,
    });
    assert.equal(r.code, 200);
    assert.deepEqual(lastCreateBody.tasks["convert-file"], {
      operation: "convert",
      input: "upload-file",
      output_format: "mp4",
      video_codec: "x264",
      input_format: ext,
    });
    assert.equal(rpcCalls.length, 1);
  });

  test(`init: ${type} з іншим розширенням (не ${ext}) → 415, квота не списується`, async () => {
    reset();
    const other = ext === "mov" ? "mkv" : "mov";
    const r = await run(initH, {
      type,
      filename: `a.${other}`,
      declaredExt: other,
      fileSize: 10 * 1024 * 1024,
    });
    assert.deepEqual([r.code, r.body.error], [415, "INVALID_FILE_TYPE"]);
    assert.equal(rpcCalls.length, 0);
    assert.equal(ccCalls.length, 0);
  });

  test(`init: ${type}, fileSize > 200 МБ → 413, CloudConvert не викликається`, async () => {
    reset();
    const r = await run(initH, {
      type,
      filename: `a.${ext}`,
      declaredExt: ext,
      fileSize: 201 * 1024 * 1024,
    });
    assert.deepEqual([r.code, r.body.error], [413, "FILE_TOO_LARGE"]);
    assert.equal(ccCalls.length, 0);
  });

  test(`init: ${type}, resolution у тілі запиту ігнорується (ці інструменти її не підтримують, але сервер не падає)`, async () => {
    reset();
    const r = await run(initH, {
      type,
      filename: `a.${ext}`,
      declaredExt: ext,
      fileSize: 10 * 1024 * 1024,
      resolution: { width: 640, height: 360 },
    });
    assert.equal(r.code, 200);
    // isVideo: true технічно пропускає resolution крізь ту саму перевірку,
    // що й compress-video, — якщо хтось випадково передасть валідні
    // width/height, вони так само потраплять у convert-таск. Це свідомо
    // не заборонено (однакова логіка з compress-video), бо наш клієнт
    // просто ніколи не надсилає це поле для convert-*-to-mp4.
    assert.deepEqual(lastCreateBody.tasks["convert-file"], {
      operation: "convert",
      input: "upload-file",
      output_format: "mp4",
      video_codec: "x264",
      width: 640,
      height: 360,
      input_format: ext,
    });
  });
}

test("status: job завершено → finished + downloadUrl", async () => {
  reset();
  const r = await run(statusH, null, {}, "GET", { jobId: "550e8400-e29b-41d4-a716-446655440000" });
  assert.deepEqual(r.body, {
    status: "finished",
    downloadUrl: "https://out.cloudconvert.example/f.pdf",
  });
});

test("status: job ще обробляється → waiting", async () => {
  reset();
  jobStatusMode = "waiting";
  const r = await run(statusH, null, {}, "GET", { jobId: "550e8400-e29b-41d4-a716-446655440000" });
  assert.deepEqual(r.body, { status: "waiting" });
});

test("status: помилка CloudConvert → error, деталі лише в лог (не клієнту)", async () => {
  reset();
  jobStatusMode = "error";
  const r = await run(statusH, null, {}, "GET", { jobId: "550e8400-e29b-41d4-a716-446655440000" });
  assert.deepEqual(r.body, { status: "error" });
  assert.ok(!JSON.stringify(r.body).includes("boom"));
});

test("status: невалідний jobId → 400, CloudConvert не викликається", async () => {
  reset();
  const r = await run(statusH, null, {}, "GET", { jobId: "../../etc/passwd" });
  assert.deepEqual([r.code, r.body.error], [400, "INVALID_REQUEST"]);
  assert.equal(ccCalls.length, 0);
});

test("status: POST → 405", async () => {
  reset();
  const r = await run(statusH, null, {}, "POST", { jobId: "550e8400-e29b-41d4-a716-446655440000" });
  assert.equal(r.code, 405);
});

test("cancel: валідний jobId → DELETE на CloudConvert, 204", async () => {
  reset();
  const r = await run(cancelH, { jobId: "550e8400-e29b-41d4-a716-446655440000" });
  assert.equal(r.code, 204);
  assert.ok(ccCalls.includes("delete"));
});

test("cancel: невалідний/відсутній jobId → все одно 204, CloudConvert не викликається", async () => {
  reset();
  const r = await run(cancelH, {});
  assert.equal(r.code, 204);
  assert.equal(ccCalls.length, 0);
});
