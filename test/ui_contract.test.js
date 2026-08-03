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

test("どくぼうそうは選択中の特性から発動し戦闘条件へ毒入力を置かない", () => {
  assert.match(
    script,
    /toxicBoostActive:\s*attackerPokemon\.ability\s*===\s*['"]どくぼうそう['"]/,
  );
  assert.doesNotMatch(html, /id="toxicBoostCheck"/);
  assert.doesNotMatch(html, /id="poisonCheck"/);
  assert.doesNotMatch(script, /poisonCheck|poisoned:/);
});

test("計算に関係する特性だけを候補数と同じ数のチェックボックスで表示する", () => {
  assert.doesNotMatch(html, /<select id="(?:attacker|defender)Ability"/);
  assert.match(html, /id="attackerAbilityRow"[^>]*style="display:\s*none/);
  assert.match(html, /id="attackerAbilityOptions"/);
  assert.match(html, /id="defenderAbilityRow"[^>]*style="display:\s*none/);
  assert.match(html, /id="defenderAbilityOptions"/);
  assert.match(
    script,
    /\.filter\(ability\s*=>\s*KatinukiDamageCore\.isDamageRelevantAbility\(side,\s*ability\)\)/,
  );
  assert.match(
    script,
    /document\.createElement\(['"]input['"]\)[\s\S]*?input\.type\s*=\s*['"]checkbox['"]/,
  );
  assert.match(
    script,
    /container\.querySelectorAll\(['"]input\[type="checkbox"\]['"]\)[\s\S]*?other\.checked\s*=\s*false/,
  );
  assert.doesNotMatch(script, /new Option\([^)]*なし/);
  assert.doesNotMatch(script, /getElementById\(['"](?:attacker|defender)Ability['"]\)/);
});

test("複数ターン計算はターンごとの防御側HPでマルチスケイルを判定する", () => {
  assert.match(
    script,
    /resolveMultiTurnDefenderHp\([\s\S]*?turnIndex[\s\S]*?defenderCurrentHpOverride/,
  );
});

test("特性チェック群を灰色のボックスで囲まない", () => {
  const abilityStyle = style.match(/\.ability-container\s*\{([^}]*)\}/);
  assert.ok(abilityStyle);
  assert.match(abilityStyle[1], /background(?:-color)?:\s*transparent/);
  assert.match(abilityStyle[1], /border:\s*0/);
  assert.match(abilityStyle[1], /padding:\s*0/);
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

test("グラベルブレスは後攻条件を選択できる", () => {
  assert.match(
    script,
    /'gravel_breath':\s*\{[\s\S]*?id:\s*'romActsAfterTarget'[\s\S]*?相手より後に行動/,
  );
});

test("めざめるパワーの威力は固定で、個体値から計算しない", () => {
  // プロキオン・デネブでは WS_MEZAMERUPOWER (0x0802AE50) が威力を計算しない。
  // 第3世代の x*40/63+30 は残っていてはいけない。
  assert.doesNotMatch(script, /\*\s*40\s*\/\s*63/);
  assert.doesNotMatch(script, /powerSum/);
  assert.match(script, /function calculateHiddenPowerBP\(\)\s*\{[\s\S]*?moveData\?\.find/);
});

test("タイプが変わる技でも分類は技データのまま扱う", () => {
  // WazaDamageCalc (0x0803E458) は record[10] の bit 0x02 で物理/特殊を決めており
  // 技のタイプは見ていない。タイプからの分類判定を持ってはいけない。
  assert.doesNotMatch(script, /getGen3CategoryByType/);
  assert.doesNotMatch(script, /getWeatherBallTypeAndCategory/);
  assert.match(script, /function getWeatherBallType\(\)/);
  // めざめるパワー・ウェザーボールの分岐で category を書き換えない
  for (const cls of ["awaken_power", "weather_ball"]) {
    const marker = `class === '${cls}'`;
    let from = script.indexOf(marker);
    assert.notEqual(from, -1, `${cls} の分岐が存在する`);
    while (from !== -1) {
      const block = script.slice(from, from + 220);
      assert.ok(!block.includes("category"), `${cls} の分岐で分類を上書きしない`);
      from = script.indexOf(marker, from + 1);
    }
  }
});
