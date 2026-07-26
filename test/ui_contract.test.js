const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("作品選択とバッジ補正を公開UI・計算処理に残さない", () => {
  assert.equal(html.includes("editionSelect"), false);
  assert.equal(html.includes("BadgeCheck"), false);
  assert.equal(script.includes("editionSelect"), false);
  assert.equal(script.includes("BadgeCheck"), false);
  assert.equal(script.includes("applyBadgeModifier"), false);
});

test("レベルプリセットはLv50とLv100だけにする", () => {
  const selects = [...html.matchAll(
    /<select class="level-preset"[\s\S]*?<\/select>/g,
  )];
  assert.equal(selects.length, 2);
  for (const [select] of selects) {
    const values = [...select.matchAll(/<option value="([^"]*)"/g)]
      .map((match) => match[1]);
    assert.deepEqual(values, ["50", "100"]);
  }
  assert.match(script, /return \[50, 100\];/);
});

test("概要に用途だけを簡潔に表示する", () => {
  assert.match(
    html,
    /<strong>概要:<\/strong> プロキオン・デネブ用カチヌキシミュレーター/,
  );
});
