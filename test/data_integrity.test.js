const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", name), "utf8"));
}

test("プロキオン・デネブの習得技を1つの313体データへ統合する", () => {
  const pokemon = readJson("all_pokemon_data.json");
  assert.equal(pokemon.length, 313);
  assert.ok(pokemon.every((entry) => typeof entry.can_evolve === "boolean"));
  const basil = pokemon.find((entry) => entry.name === "バジール");
  assert.ok(basil.moves.includes("めざめるパワー"));
  assert.ok(basil.moves.includes("エナジーボール"));
  assert.equal(
    fs.existsSync(path.join(__dirname, "..", "all_pokemon_data_deneb.json")),
    false,
  );
});

test("Wiki掲載種を収録しROMの疑問符画像を使う未設定種を除外する", () => {
  const pokemon = readJson("all_pokemon_data.json");
  const names = pokemon.map((entry) => entry.name);
  const jsonOnlySpeciesWithUniqueSprites = [
    "アクタシ",
    "レクオレ",
    "タテボーシ",
    "シャーモン",
    "ドサーモン",
    "デリバード",
    "プレゼンタ",
  ];

  for (const name of jsonOnlySpeciesWithUniqueSprites) {
    assert.ok(names.includes(name), `${name} has a unique front/back sprite`);
  }
  for (const placeholder of ["シュンプー", "メアドア", "ダミー", "？"]) {
    assert.ok(!names.includes(placeholder), `${placeholder} uses a placeholder sprite`);
  }
});

test("習得可能な652技すべてにROM内説明文がある", () => {
  const moves = readJson("pokemon_moves.json");
  assert.equal(moves.length, 652);
  assert.ok(moves.every((move) => move.description.length > 0));
  assert.ok(moves.every((move) => typeof move.contact === "boolean"));
});

test("説明文で明示されたタイプ相性の例外は4技", () => {
  const moves = readJson("pokemon_moves.json");
  const matchupDescription =
    /タイプ(?:に|や)[\s\S]*(?:ばつぐん|つよい|こうげきが あたる)/;
  const names = moves
    .filter((move) => move.power > 0 && matchupDescription.test(move.description))
    .map((move) => move.name)
    .sort();

  assert.deepEqual(names, [
    "じゅうおうのキバ",
    "グラベルブレス",
    "フリーズドライ",
    "ポイズンリーフ",
  ].sort());
});

test("説明文から確定できる特殊ダメージ技を専用クラスへ分類する", () => {
  const moves = readJson("pokemon_moves.json");
  const expected = {
    "グラベルブレス": "gravel_breath",
    "カラフルアタック": "user_type",
    "アクロバット": "itemless_boost",
    "ソウルシェイプ": "target_half_hp",
    "ダイナソード": "two_fold",
    "ライフエナジー": "target_hp_scale",
    "ワイルドカード": "target_special_attack",
    "しおみず": "target_half_hp",
    "かじばのいちげき": "attacker_half_hp",
    "しぼりとる": "target_hp_scale",
    "イカサマ": "target_attack",
    "バリアアタック": "user_defense",
    "ソウルブレイク": "ignore_screen",
    "クイックターン": "quick_turn",
    "バリアブラスト": "barrier_blast",
    "アシストパワー": "stored_power",
    "おしおき": "punishment",
    "しっぺがえし": "payback",
    "デッドリーボーン": "deadly_bone",
  };

  for (const [name, moveClass] of Object.entries(expected)) {
    assert.equal(moves.find((move) => move.name === name)?.class, moveClass, name);
  }
  const beastKingFang = moves.find((move) => move.name === "じゅうおうのキバ");
  assert.equal(beastKingFang?.class, "standard");
  assert.equal(Object.hasOwn(beastKingFang, "fixed_value"), false);
  for (const name of [
    "スターダスト",
    "だいちのいかり",
    "サイコショック",
    "こおりのキッス",
  ]) {
    assert.equal(moves.find((move) => move.name === name)?.class, "physical_defense", name);
  }
  for (const name of ["バッドポイズン", "ヨガスマッシュ"]) {
    assert.equal(moves.find((move) => move.name === name)?.class, "special_defense", name);
  }
});

test("カラフルアタックの習得者はギャラクシアとカクレオン", () => {
  const pokemon = readJson("all_pokemon_data.json");
  const users = pokemon
    .filter((entry) => entry.moves.includes("カラフルアタック"))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(users, ["カクレオン", "ギャラクシア"].sort());
});

test("プロキオンに実在する主要なダメージ関連持ち物を重複なく収録する", () => {
  const items = readJson("item.json");
  const names = items.map((item) => item.name);
  assert.equal(new Set(names).size, names.length);
  for (const required of [
    "いのちのたま",
    "こだわりメガネ",
    "たつじんのおび",
    "しんかのきせき",
    "とつげきチョッキ",
    "うしおのおこう",
    "ももいろシャボン",
    "メタルパウダー",
    "ロゼルのみ",
  ]) {
    assert.ok(names.includes(required), `${required} is missing`);
  }
  for (const unavailable of [
    "しんかいのキバ",
    "しんかいのウロコ",
    "ふといホネ",
  ]) {
    assert.ok(!names.includes(unavailable), `${unavailable} is not in Procyon`);
  }
});

test("全タイプのジュエル名と説明をプロキオンROMに合わせる", () => {
  const items = readJson("item.json");
  const gems = items.filter((item) => item.name.endsWith("ジュエル"));
  const expectedNames = [
    "ノーマルジュエル", "くさのジュエル", "ほのおのジュエル",
    "みずのジュエル", "でんきのジュエル", "こおりのジュエル",
    "いわのジュエル", "じめんのジュエル", "かくとうジュエル",
    "ひこうのジュエル", "むしのジュエル", "どくのジュエル",
    "エスパージュエル", "ゴーストジュエル", "ドラゴンジュエル",
    "あくのジュエル", "はがねのジュエル", "ようせいジュエル",
  ];

  assert.equal(gems.length, 18);
  assert.deepEqual(
    gems.map((item) => item.name).sort(),
    expectedNames.sort(),
  );
  assert.ok(gems.every((item) => item.description.includes("1.5倍")));
});
