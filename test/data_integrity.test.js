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

test("習得可能な652技すべてにROM内説明文がある", () => {
  const moves = readJson("pokemon_moves.json");
  assert.equal(moves.length, 652);
  assert.ok(moves.every((move) => move.description.length > 0));
  assert.ok(moves.every((move) => typeof move.contact === "boolean"));
});

test("主要な第7世代向け持ち物を重複なく収録する", () => {
  const items = readJson("item.json");
  const names = items.map((item) => item.name);
  assert.equal(new Set(names).size, names.length);
  for (const required of [
    "いのちのたま",
    "こだわりメガネ",
    "たつじんのおび",
    "しんかのきせき",
    "とつげきチョッキ",
    "ロゼルのみ",
  ]) {
    assert.ok(names.includes(required), `${required} is missing`);
  }
});
