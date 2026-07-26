const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateDamageRange,
  formatMoveDetails,
  getTypeEffectiveness,
  resolveMovePower,
  resolveMoveType,
} = require("../damage_core.js");

const base = {
  level: 50,
  power: 100,
  attack: 120,
  defense: 100,
  moveType: "ノーマル",
  category: "Physical",
  attackerTypes: ["ノーマル"],
  defenderTypes: ["ノーマル"],
  moveClass: "standard",
  weather: "none",
  currentHp: 200,
  maxHp: 200,
};

test("第6世代以降のタイプ相性を使う", () => {
  assert.equal(getTypeEffectiveness("あく", ["はがね"]), 1);
  assert.equal(getTypeEffectiveness("ゴースト", ["はがね"]), 1);
  assert.equal(getTypeEffectiveness("フェアリー", ["ドラゴン"]), 2);
  assert.equal(getTypeEffectiveness("ドラゴン", ["フェアリー"]), 0);
});

test("じばく・だいばくはつで防御を半減しない", () => {
  const standard = calculateDamageRange(base);
  const explosion = calculateDamageRange({ ...base, moveClass: "b_harf" });
  assert.deepEqual(explosion, standard);
});

test("急所ダメージは1.5倍", () => {
  const normal = calculateDamageRange(base);
  const critical = calculateDamageRange({ ...base, critical: true });
  assert.equal(critical.max, Math.floor(normal.max * 1.5));
});

test("すなあらし中はいわタイプの特殊防御が1.5倍", () => {
  const normal = calculateDamageRange({
    ...base,
    category: "Special",
    moveType: "みず",
    attackerTypes: ["みず"],
    defenderTypes: ["いわ"],
  });
  const sand = calculateDamageRange({
    ...base,
    category: "Special",
    moveType: "みず",
    attackerTypes: ["みず"],
    defenderTypes: ["いわ"],
    weather: "sandstorm",
  });
  assert.ok(sand.max < normal.max);
});

test("マルチスケイルはHP満タン時だけダメージを半減", () => {
  const normal = calculateDamageRange(base);
  const fullHp = calculateDamageRange({
    ...base,
    defenderAbility: "マルチスケイル",
  });
  const damaged = calculateDamageRange({
    ...base,
    defenderAbility: "マルチスケイル",
    currentHp: 199,
  });
  assert.equal(fullHp.max, Math.floor(normal.max / 2));
  assert.deepEqual(damaged, normal);
});

test("てきおうりょくとフィルターを計算する", () => {
  const stab = calculateDamageRange({
    ...base,
    attackerAbility: "てきおうりょく",
  });
  const normal = calculateDamageRange(base);
  assert.ok(stab.max > normal.max);

  const superEffective = {
    ...base,
    moveType: "かくとう",
    attackerTypes: ["かくとう"],
    defenderTypes: ["いわ"],
  };
  const unfiltered = calculateDamageRange(superEffective);
  const filtered = calculateDamageRange({
    ...superEffective,
    defenderAbility: "フィルター",
  });
  assert.equal(filtered.max, Math.floor(unfiltered.max * 0.75));
});

test("いのちのたまとこだわりメガネを計算する", () => {
  const normal = calculateDamageRange({
    ...base,
    category: "Special",
  });
  const lifeOrb = calculateDamageRange({
    ...base,
    category: "Special",
    attackerItem: "いのちのたま",
  });
  const choiceSpecs = calculateDamageRange({
    ...base,
    category: "Special",
    attackerItem: "こだわりメガネ",
  });
  assert.ok(lifeOrb.max > normal.max);
  assert.ok(choiceSpecs.max > lifeOrb.max);
});

test("技情報を説明文つきで表示できる形に整える", () => {
  assert.deepEqual(
    formatMoveDetails({
      type: "ほのお",
      category: "Special",
      power: 90,
      accuracy: 100,
      description: "相手を 炎で\n攻撃する。",
    }),
    {
      summary: "ほのお / 特殊 / 威力 90 / 命中 100",
      description: "相手を 炎で\n攻撃する。",
    },
  );
  assert.equal(
    formatMoveDetails({ type: "ノーマル", category: "Status", power: 0, accuracy: 0 })
      .summary,
    "ノーマル / 変化 / 威力 - / 命中 -",
  );
});

test("壁補正はシングルで半減、ダブルで3分の2", () => {
  const normal = calculateDamageRange(base);
  const single = calculateDamageRange({ ...base, screen: true });
  const double = calculateDamageRange({ ...base, screen: true, doubleBattle: true });
  assert.equal(single.max, Math.floor(normal.max / 2));
  assert.equal(double.max, Math.floor(normal.max * 2 / 3));
});

test("技タグに応じてがんじょうあご・てつのこぶし・ちからずくを計算する", () => {
  const normal = calculateDamageRange(base);
  const bite = calculateDamageRange({
    ...base,
    moveName: "かみくだく",
    attackerAbility: "がんじょうあご",
  });
  const punch = calculateDamageRange({
    ...base,
    moveName: "ほのおのパンチ",
    attackerAbility: "てつのこぶし",
  });
  const sheerForce = calculateDamageRange({
    ...base,
    attackerAbility: "ちからずく",
    secondaryEffect: true,
  });
  assert.ok(bite.max > normal.max);
  assert.ok(punch.max > normal.max);
  assert.ok(sheerForce.max > normal.max);
});

test("攻撃側HPと防御側HPを混同せず、よわきとしんりょくを判定する", () => {
  const normal = calculateDamageRange({
    ...base,
    moveType: "くさ",
    attackerTypes: ["くさ"],
  });
  const defenderDamaged = calculateDamageRange({
    ...base,
    moveType: "くさ",
    attackerTypes: ["くさ"],
    attackerAbility: "よわき",
    currentHp: 1,
    maxHp: 200,
    attackerCurrentHp: 200,
    attackerMaxHp: 200,
  });
  const attackerDamaged = calculateDamageRange({
    ...base,
    moveType: "くさ",
    attackerTypes: ["くさ"],
    attackerAbility: "よわき",
    attackerCurrentHp: 100,
    attackerMaxHp: 200,
  });
  const overgrow = calculateDamageRange({
    ...base,
    moveType: "くさ",
    attackerTypes: ["くさ"],
    attackerAbility: "しんりょく",
    attackerCurrentHp: 60,
    attackerMaxHp: 200,
  });
  assert.deepEqual(defenderDamaged, normal);
  assert.ok(attackerDamaged.max < normal.max);
  assert.ok(overgrow.max > normal.max);
});

test("じゅうおうのキバはひこう複合の相性無効を取り除く", () => {
  const target = {
    ...base,
    moveType: "じめん",
    attackerTypes: ["じめん"],
    defenderTypes: ["はがね", "ひこう"],
  };
  const ordinaryGroundMove = calculateDamageRange({
    ...target,
    moveName: "じしん",
  });
  const beastKingFang = calculateDamageRange({
    ...target,
    moveName: "じゅうおうのキバ",
  });

  assert.equal(ordinaryGroundMove.effectiveness, 0);
  assert.equal(beastKingFang.effectiveness, 2);
  assert.ok(beastKingFang.max > 0);
});

test("みずに抜群と明記された技は複合タイプを含めて相性を上書きする", () => {
  const freezeDry = calculateDamageRange({
    ...base,
    moveName: "フリーズドライ",
    moveType: "こおり",
    attackerTypes: ["こおり"],
    defenderTypes: ["みず", "じめん"],
  });
  const poisonLeaf = calculateDamageRange({
    ...base,
    moveName: "ポイズンリーフ",
    moveType: "どく",
    attackerTypes: ["どく"],
    defenderTypes: ["みず", "じめん"],
  });

  assert.equal(freezeDry.effectiveness, 4);
  assert.equal(poisonLeaf.effectiveness, 1);
});

test("グラベルブレスはいわ技本来の耐性を上書きしてはがねに抜群となる", () => {
  const target = {
    ...base,
    moveType: "いわ",
    attackerTypes: ["いわ"],
    defenderTypes: ["はがね"],
  };
  const ordinaryRockMove = calculateDamageRange({
    ...target,
    moveName: "いわなだれ",
  });
  const gravelBreath = calculateDamageRange({
    ...target,
    moveName: "グラベルブレス",
  });

  assert.equal(ordinaryRockMove.effectiveness, 0.5);
  assert.equal(gravelBreath.effectiveness, 2);
  assert.ok(gravelBreath.max > ordinaryRockMove.max);
});

test("グラベルブレスは素早さ比で威力を求め150で打ち止めにする", () => {
  assert.equal(resolveMovePower({
    moveClass: "gyro_ball",
    power: 70,
    attackerSpeed: 100,
    defenderSpeed: 200,
  }), 51);
  assert.equal(resolveMovePower({
    moveClass: "gyro_ball",
    power: 70,
    attackerSpeed: 40,
    defenderSpeed: 400,
  }), 150);
});

test("道具なし・HP半分・相手HP比例の技威力を自動計算する", () => {
  assert.equal(resolveMovePower({
    moveClass: "itemless_boost",
    power: 55,
    attackerItem: "",
  }), 110);
  assert.equal(resolveMovePower({
    moveClass: "itemless_boost",
    power: 55,
    attackerItem: "するどいくちばし",
  }), 55);
  assert.equal(resolveMovePower({
    moveClass: "target_half_hp",
    power: 65,
    currentHp: 50,
    maxHp: 100,
  }), 130);
  assert.equal(resolveMovePower({
    moveClass: "target_half_hp",
    power: 65,
    currentHp: 51,
    maxHp: 100,
  }), 65);
  assert.equal(resolveMovePower({
    moveClass: "attacker_half_hp",
    power: 65,
    attackerCurrentHp: 50,
    attackerMaxHp: 100,
  }), 130);
  assert.equal(resolveMovePower({
    moveClass: "target_hp_scale",
    power: 120,
    currentHp: 75,
    maxHp: 100,
  }), 90);
});

test("カラフルアタックは使用者の第一タイプになる", () => {
  assert.equal(
    resolveMoveType("ノーマル", "", "user_type", ["どく", "エスパー"]),
    "どく",
  );
  assert.equal(
    resolveMoveType("ノーマル", "", "user_type", ["ノーマル"]),
    "ノーマル",
  );
});

test("相手能力・自分の防御・物理防御を参照する技を計算する", () => {
  const common = {
    ...base,
    power: 95,
    attack: 40,
    defense: 200,
    attackerDefense: 180,
    defenderAttack: 160,
    defenderSpecialAttack: 220,
    defenderDefense: 100,
    defenderSpecialDefense: 200,
  };
  const standard = calculateDamageRange(common);
  const foulPlay = calculateDamageRange({ ...common, moveClass: "target_attack" });
  const wildCard = calculateDamageRange({
    ...common,
    category: "Special",
    moveClass: "target_special_attack",
  });
  const bodyPress = calculateDamageRange({ ...common, moveClass: "user_defense" });
  const psyshock = calculateDamageRange({
    ...common,
    category: "Special",
    moveClass: "physical_defense",
  });
  const yogaSmash = calculateDamageRange({
    ...common,
    attack: 180,
    defense: 100,
    moveClass: "special_defense",
  });
  const physicalControl = calculateDamageRange({
    ...common,
    attack: 180,
    defense: 100,
  });

  assert.ok(foulPlay.max > standard.max);
  assert.ok(wildCard.max > standard.max);
  assert.ok(bodyPress.max > standard.max);
  assert.ok(psyshock.max > standard.max);
  assert.ok(yogaSmash.max < physicalControl.max);
});

test("ソウルブレイクは壁によるダメージ軽減を無視する", () => {
  const normal = calculateDamageRange({ ...base, screen: true });
  const soulBreak = calculateDamageRange({
    ...base,
    moveClass: "ignore_screen",
    screen: true,
  });
  const noScreen = calculateDamageRange({ ...base, screen: false });

  assert.ok(soulBreak.max > normal.max);
  assert.deepEqual(soulBreak, noScreen);
});
