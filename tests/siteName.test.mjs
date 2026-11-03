// round 43: назва сайту у видачі Google — WebSite-розмітка на всіх мовних
// головних вказує на корінь домену й має alternateName.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("WebSite: url — корінь домену, є name і alternateName", () => {
  const src = readFileSync("src/components/Seo/SeoHead.jsx", "utf8");
  const block = src.slice(src.indexOf('"@type": "WebSite"'), src.indexOf("publisher", src.indexOf('"@type": "WebSite"')));
  assert.match(block, /name: "CompressPhoto"/);
  assert.match(block, /alternateName: \[/);
  assert.match(block, /url: `\$\{SITE_URL\}\/`/);
  assert.doesNotMatch(block, /url: canonicalUrl/);
});
