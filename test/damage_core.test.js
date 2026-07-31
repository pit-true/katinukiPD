const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateDamageRange,
  formatMoveDetails,
  getTypeEffectiveness,
  isDamageRelevantAbility,
  isRecoilMove,
  resolveMoveDamageMultiplier,
  resolveMovePower,
  resolveMoveType,
  resolveMultiTurnDefenderHp,
} = require("../damage_core.js");

const pokemonMoves = require("../pokemon_moves.json");

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

test("どくぼうそうはどく・もうどく時の物理攻撃をランク補正前に1.5倍する", () => {
  const physical = {
    ...base,
    attackerTypes: [],
    defenderTypes: [],
    attack: 101,
    defense: 100,
    attackerAbility: "どくぼうそう",
  };
  const normal = calculateDamageRange(physical);
  const poisoned = calculateDamageRange({
    ...physical,
    toxicBoostActive: true,
    attackerRanks: { attack: 2 },
  });
  const romOrderControl = calculateDamageRange({
    ...physical,
    attackerAbility: "",
    attack: 302,
  });
  const special = calculateDamageRange({
    ...physical,
    category: "Special",
    toxicBoostActive: true,
    attackerRanks: { specialAttack: 2 },
  });

  assert.deepEqual(poisoned, romOrderControl);
  assert.deepEqual(normal, calculateDamageRange({
    ...physical,
    toxicBoostActive: false,
  }));
  assert.deepEqual(special, calculateDamageRange({
    ...physical,
    category: "Special",
    attackerRanks: { specialAttack: 2 },
  }));
});

test("攻撃側・防御側で実際にダメージ計算へ影響する特性だけを候補にする", () => {
  assert.equal(isDamageRelevantAbility("attacker", "どくぼうそう"), true);
  assert.equal(isDamageRelevantAbility("attacker", "ヨガパワー"), true);
  assert.equal(isDamageRelevantAbility("attacker", "スナイパー"), true);
  assert.equal(isDamageRelevantAbility("defender", "マルチスケイル"), true);
  assert.equal(isDamageRelevantAbility("attacker", "プレッシャー"), false);
  assert.equal(isDamageRelevantAbility("attacker", "きょううん"), false);
  assert.equal(isDamageRelevantAbility("defender", "プレッシャー"), false);
  assert.equal(isDamageRelevantAbility("defender", "きょううん"), false);
  assert.equal(isDamageRelevantAbility("attacker", "マルチスケイル"), false);
  assert.equal(isDamageRelevantAbility("defender", "スナイパー"), false);
});

test("ヨガパワーは物理攻撃を2倍にする", () => {
  const physical = {
    ...base,
    attackerTypes: [],
    defenderTypes: [],
    attack: 100,
    defense: 100,
  };
  assert.deepEqual(
    calculateDamageRange({
      ...physical,
      attackerAbility: "ヨガパワー",
    }),
    calculateDamageRange({
      ...physical,
      attack: 200,
    }),
  );
});

test("インパクトサイトはすてみの対象技として威力を1.2倍する", () => {
  const impactSite = {
    ...base,
    moveName: "インパクトサイト",
    power: 90,
    attackerAbility: "すてみ",
  };

  assert.deepEqual(
    calculateDamageRange(impactSite),
    calculateDamageRange({ ...impactSite, recoil: true }),
  );
  assert.ok(calculateDamageRange(impactSite).max > calculateDamageRange({
    ...impactSite,
    attackerAbility: "",
  }).max);
});

test("説明文に反動・失敗時ダメージがある全技をすてみの対象にする", () => {
  const recoilMovesFromDescriptions = pokemonMoves.filter((move) => {
    const description = (move.description || "").replace(/\s/g, "");
    return /じぶんも.*ダメージをうけ/.test(description)
      || description.includes("はずすとじぶんがダメージをうける");
  }).map((move) => move.name);

  assert.deepEqual(recoilMovesFromDescriptions, [
    "とびげり",
    "とっしん",
    "すてみタックル",
    "じごくぐるま",
    "とびひざげり",
    "ボルテッカー",
    "だいちのいかり",
    "フレアドライブ",
    "ブレイブバード",
    "ウッドハンマー",
    "ワイルドボルト",
    "アクアインパクト",
    "もろはのずつき",
    "ムーンインパクト",
    "インパクトサイト",
  ]);
  for (const moveName of recoilMovesFromDescriptions) {
    assert.equal(isRecoilMove(moveName), true, `${moveName}がすてみ対象ではありません`);
  }
});

test("複数ターン時のマルチスケイル判定用HPは初撃後に満タン扱いしない", () => {
  assert.equal(resolveMultiTurnDefenderHp(200, 200, 0), 200);
  assert.equal(resolveMultiTurnDefenderHp(200, 200, 1), 199);
  assert.equal(resolveMultiTurnDefenderHp(200, 200, 4), 199);
  assert.equal(resolveMultiTurnDefenderHp(135, 200, 0), 135);
  assert.equal(resolveMultiTurnDefenderHp(135, 200, 3), 135);
});

test("とつげきチョッキは特殊防御をランク補正前に1.5倍し物理防御には掛からない", () => {
  const special = {
    ...base,
    category: "Special",
    attackerTypes: [],
    defenderTypes: [],
    attack: 100,
    defense: 101,
  };
  const assaultVest = calculateDamageRange({
    ...special,
    defenderItem: "とつげきチョッキ",
    defenderRanks: { specialDefense: 2 },
  });
  const romOrderControl = calculateDamageRange({
    ...special,
    defense: 302,
  });
  const physical = {
    ...special,
    category: "Physical",
    defenderItem: "とつげきチョッキ",
  };

  assert.deepEqual(assaultVest, romOrderControl);
  assert.deepEqual(
    calculateDamageRange(physical),
    calculateDamageRange({ ...physical, defenderItem: "" }),
  );
});

test("いのちのたまは急所・タイプ一致・タイプ相性より前にダメージを1.3倍する", () => {
  const lifeOrb = calculateDamageRange({
    ...base,
    power: 21,
    attack: 100,
    defense: 100,
    moveType: "ノーマル",
    attackerTypes: ["ノーマル"],
    defenderTypes: [],
    attackerItem: "いのちのたま",
  });

  // 基礎ダメージ11 → 珠で14 → タイプ一致で21。
  // タイプ一致後に珠を掛けると20になるため、補正位置も検出できる。
  assert.equal(lifeOrb.max, 21);
});

test("ジュエルはタイプ一致時に技威力を1.5倍する", () => {
  const gem = calculateDamageRange({
    ...base,
    power: 40,
    attack: 100,
    defense: 100,
    attackerTypes: [],
    attackerItem: "ノーマルジュエル",
  });
  const power60 = calculateDamageRange({
    ...base,
    power: 60,
    attack: 100,
    defense: 100,
    attackerTypes: [],
  });

  assert.deepEqual(gem, power60);
});

test("ようせいジュエルはフェアリー技の威力を1.5倍する", () => {
  const gem = calculateDamageRange({
    ...base,
    power: 40,
    attack: 100,
    defense: 100,
    moveType: "フェアリー",
    attackerTypes: [],
    attackerItem: "ようせいジュエル",
  });
  const power60 = calculateDamageRange({
    ...base,
    power: 60,
    attack: 100,
    defense: 100,
    moveType: "フェアリー",
    attackerTypes: [],
  });

  assert.deepEqual(gem, power60);
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

test("グラベルブレスははがね相手でもいわ技本来の相性を維持してダメージだけ2倍にする", () => {
  const target = {
    ...base,
    power: 70,
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
    moveClass: "gravel_breath",
  });
  const neutralRockMove = calculateDamageRange({
    ...target,
    moveName: "いわなだれ",
    defenderTypes: ["ノーマル"],
  });

  assert.equal(ordinaryRockMove.effectiveness, 0.5);
  assert.equal(gravelBreath.effectiveness, 0.5);
  assert.equal(gravelBreath.max, neutralRockMove.max);
  assert.ok(gravelBreath.max > ordinaryRockMove.max);
});

test("グラベルブレスは素早さ比で威力を変えず70に固定する", () => {
  assert.equal(resolveMovePower({
    moveClass: "gravel_breath",
    power: 70,
    attackerSpeed: 100,
    defenderSpeed: 200,
  }), 70);
  assert.equal(resolveMovePower({
    moveClass: "gravel_breath",
    power: 70,
    attackerSpeed: 40,
    defenderSpeed: 400,
  }), 70);
});

test("グラベルブレスははがね相手または後攻で2倍になり両方でも重複しない", () => {
  assert.equal(resolveMoveDamageMultiplier({
    moveClass: "gravel_breath",
    defenderTypes: [],
  }), 1);
  assert.equal(resolveMoveDamageMultiplier({
    moveClass: "gravel_breath",
    defenderTypes: ["はがね"],
  }), 2);
  assert.equal(resolveMoveDamageMultiplier({
    moveClass: "gravel_breath",
    defenderTypes: [],
    actsAfterTarget: true,
  }), 2);
  assert.equal(resolveMoveDamageMultiplier({
    moveClass: "gravel_breath",
    defenderTypes: ["はがね"],
    actsAfterTarget: true,
  }), 2);
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

test("能力参照技は置き換え先の能力ランクを参照する", () => {
  const common = {
    ...base,
    attackerTypes: [],
    defenderTypes: [],
    attack: 50,
    defense: 100,
    attackerDefense: 100,
    defenderAttack: 100,
    defenderSpecialAttack: 100,
    defenderDefense: 100,
    defenderSpecialDefense: 100,
  };
  const cases = [
    {
      moveClass: "target_attack",
      ranks: { defenderRanks: { attack: 2 } },
      control: { defenderAttack: 200 },
    },
    {
      moveClass: "target_special_attack",
      category: "Special",
      ranks: { defenderRanks: { specialAttack: 2 } },
      control: { defenderSpecialAttack: 200 },
    },
    {
      moveClass: "user_defense",
      ranks: { attackerRanks: { defense: 2 } },
      control: { attackerDefense: 200 },
    },
    {
      moveClass: "physical_defense",
      category: "Special",
      ranks: { defenderRanks: { defense: 2 } },
      control: { defenderDefense: 200 },
    },
    {
      moveClass: "special_defense",
      ranks: { defenderRanks: { specialDefense: 2 } },
      control: { defenderSpecialDefense: 200 },
    },
  ];

  for (const entry of cases) {
    const ranked = calculateDamageRange({
      ...common,
      category: entry.category || "Physical",
      moveClass: entry.moveClass,
      ...entry.ranks,
    });
    const control = calculateDamageRange({
      ...common,
      category: entry.category || "Physical",
      moveClass: entry.moveClass,
      ...entry.control,
    });
    assert.deepEqual(ranked, control, entry.moveClass);
  }
});

test("プロキオン固有の攻撃・防御持ち物をROM倍率で計算する", () => {
  const physical = {
    ...base,
    attackerTypes: [],
    defenderTypes: [],
    attack: 100,
    defense: 100,
  };
  const doubledAttack = calculateDamageRange({ ...physical, attack: 200 });
  for (const attackerName of ["リバード", "ララミンゴ"]) {
    assert.deepEqual(
      calculateDamageRange({
        ...physical,
        attackerName,
        attackerItem: "ももいろシャボン",
      }),
      doubledAttack,
      attackerName,
    );
  }
  assert.deepEqual(
    calculateDamageRange({
      ...physical,
      attackerName: "ピカチュウ",
      attackerItem: "ももいろシャボン",
    }),
    calculateDamageRange(physical),
  );
  assert.deepEqual(
    calculateDamageRange({
      ...physical,
      defenderName: "メタモン",
      defenderItem: "メタルパウダー",
    }),
    calculateDamageRange({ ...physical, defense: 150 }),
  );
});

test("こころのしずくはラティアス・ラティオスの特攻と特防を1.5倍にする", () => {
  const special = {
    ...base,
    category: "Special",
    moveType: "ほのお",
    attackerTypes: [],
    defenderTypes: [],
    attack: 100,
    defense: 100,
  };
  assert.deepEqual(
    calculateDamageRange({
      ...special,
      attackerName: "ラティオス",
      attackerItem: "こころのしずく",
    }),
    calculateDamageRange({ ...special, attack: 150 }),
  );
  assert.deepEqual(
    calculateDamageRange({
      ...special,
      defenderName: "ラティアス",
      defenderItem: "こころのしずく",
    }),
    calculateDamageRange({ ...special, defense: 150 }),
  );
});

test("うしおのおこうはみず技の威力を1.2倍にする", () => {
  const incense = calculateDamageRange({
    ...base,
    power: 50,
    moveType: "みず",
    attackerTypes: [],
    defenderTypes: [],
    attackerItem: "うしおのおこう",
  });
  const power60 = calculateDamageRange({
    ...base,
    power: 60,
    moveType: "みず",
    attackerTypes: [],
    defenderTypes: [],
  });
  assert.deepEqual(incense, power60);
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

test("アシストパワーは使用者の上昇ランク合計だけ威力を加算する", () => {
  assert.equal(resolveMovePower({
    moveClass: "stored_power",
    power: 20,
    attackerRanks: {
      attack: 2,
      defense: -3,
      speed: 1,
      specialAttack: 4,
      specialDefense: 0,
      accuracy: 1,
      evasion: -1,
    },
  }), 180);
  assert.equal(resolveMovePower({
    moveClass: "stored_power",
    power: 20,
    attackerRanks: {
      attack: 6,
      defense: 6,
      speed: 6,
      specialAttack: 6,
      specialDefense: 6,
      accuracy: 6,
      evasion: 6,
    },
  }), 860);
});

test("おしおきは相手の上昇した能力の種類数だけ威力を加算する", () => {
  assert.equal(resolveMovePower({
    moveClass: "punishment",
    power: 60,
    defenderRanks: {
      attack: 6,
      defense: -2,
      speed: 1,
      specialAttack: 0,
      specialDefense: 4,
      accuracy: -1,
      evasion: 3,
    },
  }), 140);
  assert.equal(resolveMovePower({
    moveClass: "punishment",
    power: 60,
    defenderRanks: {
      attack: 1,
      defense: 1,
      speed: 1,
      specialAttack: 1,
      specialDefense: 1,
      accuracy: 1,
      evasion: 1,
    },
  }), 200);
});

test("デッドリーボーンは使用者の素早さランクを2段階ごとに威力へ反映する", () => {
  const expected = new Map([
    [-6, 80], [0, 80], [1, 80],
    [2, 90], [3, 90],
    [4, 100], [5, 100],
    [6, 110],
  ]);
  for (const [speed, power] of expected) {
    assert.equal(resolveMovePower({
      moveClass: "deadly_bone",
      power: 80,
      attackerRanks: { speed },
    }), power, `speed rank ${speed}`);
  }
});

test("クイックターンは相手の素早さランクだけで失敗・通常・2倍を決める", () => {
  assert.equal(resolveMoveDamageMultiplier({
    moveClass: "quick_turn",
    defenderRanks: { speed: -1 },
  }), 0);
  assert.equal(resolveMoveDamageMultiplier({
    moveClass: "quick_turn",
    defenderRanks: { speed: 0 },
  }), 1);
  assert.equal(resolveMoveDamageMultiplier({
    moveClass: "quick_turn",
    defenderRanks: { speed: 1 },
  }), 2);

  const failed = calculateDamageRange({
    ...base,
    moveClass: "quick_turn",
    defenderRanks: { speed: -6 },
  });
  assert.deepEqual(failed, {
    min: 0,
    max: 0,
    effectiveness: 1,
    moveType: "ノーマル",
  });
});

test("バリアブラストは使用者側に壁があると基礎ダメージ後に2倍になる", () => {
  const normal = calculateDamageRange({
    ...base,
    moveClass: "barrier_blast",
  });
  const boosted = calculateDamageRange({
    ...base,
    moveClass: "barrier_blast",
    attackerScreen: true,
  });
  assert.equal(boosted.max, normal.max * 2);
});

test("しっぺがえしは実際に相手より後に行動すると基礎ダメージ後に2倍になる", () => {
  const normal = calculateDamageRange({
    ...base,
    moveClass: "payback",
  });
  const boosted = calculateDamageRange({
    ...base,
    moveClass: "payback",
    actsAfterTarget: true,
  });
  assert.equal(boosted.max, normal.max * 2);
});
