const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

test("READMEはGitHub Pages利用者向けの案内にする", () => {
  assert.match(readme, /https:\/\/pit-true\.github\.io\/katinukiPD\//);
  assert.doesNotMatch(readme, /localhost|127\.0\.0\.1|python -m http\.server/);
  assert.doesNotMatch(readme, /VPD補正位置監査/);
});

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

test("技詳細は初期状態で閉じた控えめな開閉表示にする", () => {
  const details = html.match(
    /<details id="moveDetails"([^>]*)>([\s\S]*?)<\/details>/,
  );
  assert.ok(details);
  assert.equal(/\bopen\b/.test(details[1]), false);
  assert.match(details[2], /<summary><span aria-hidden="true">ⓘ<\/span> 技詳細<\/summary>/);
  assert.match(details[2], /id="moveDescription"/);
  const descriptionStyle = style.match(/\.move-description\s*\{([^}]*)\}/);
  assert.ok(descriptionStyle);
  assert.doesNotMatch(descriptionStyle[1], /min-height/);
  assert.doesNotMatch(descriptionStyle[1], /border-left/);
});

test("ダイナソードは既存の2倍条件欄をつめとぎ使用後として表示する", () => {
  assert.match(html, /id="twofoldLabel"/);
  assert.match(script, /currentMove\.name === ['"]ダイナソード['"]/);
  assert.match(script, /move\?\.class === ['"]two_fold['"][\s\S]*twofoldCheck/);
});

test("ROM固有技は選択時だけ専用条件を入力できる", () => {
  assert.match(html, /id="romMoveSettings"/);
  assert.match(html, /id="romMoveSettingsTitle"/);
  assert.match(html, /id="romMoveSettingsFields"/);
  for (const moveClass of [
    "quick_turn",
    "barrier_blast",
    "stored_power",
    "punishment",
    "payback",
    "deadly_bone",
    "target_attack",
    "target_special_attack",
    "user_defense",
    "physical_defense",
    "special_defense",
  ]) {
    assert.match(script, new RegExp(`['"]${moveClass}['"]`));
  }
  assert.match(script, /attackerScreen/);
  assert.match(script, /actsAfterTarget/);
  assert.match(script, /attackerRanks/);
  assert.match(script, /defenderRanks/);
});
