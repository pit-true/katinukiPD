(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.KatinukiDamageCore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAMAGE_RELEVANT_ABILITIES = {
    attacker: new Set([
      "ヨガパワー", "ちからもち", "はりきり", "こんじょう",
      "どくぼうそう", "サンパワー", "よわき", "しんりょく",
      "もうか", "げきりゅう", "むしのしらせ", "ちからずく",
      "テクニシャン", "かたいツメ", "がんじょうあご",
      "てつのこぶし", "すてみ", "すなのちから", "エレキスキン",
      "スカイスキン", "フェアリースキン", "フリーズスキン",
      "ノーマルスキン", "スナイパー", "へんげんじざい",
      "てきおうりょく", "いろめがね",
    ]),
    defender: new Set([
      "ファーコート", "ふしぎなうろこ", "あついしぼう", "たいねつ",
      "フィルター", "ハードロック", "マルチスケイル",
      "フレンドガード",
    ]),
  };

  function isDamageRelevantAbility(side, ability) {
    return DAMAGE_RELEVANT_ABILITIES[side]?.has(ability) || false;
  }

  function resolveMultiTurnDefenderHp(currentHp, maxHp, turnIndex) {
    const normalizedMaxHp = Math.max(1, Number(maxHp) || 1);
    const normalizedCurrentHp = Math.max(
      0,
      Math.min(normalizedMaxHp, Number(currentHp) || 0),
    );
    if (turnIndex <= 0 || normalizedCurrentHp < normalizedMaxHp) {
      return normalizedCurrentHp;
    }
    return normalizedMaxHp - 1;
  }

  const TYPE_CHART = {
    "ノーマル": { "いわ": 0.5, "ゴースト": 0, "はがね": 0.5 },
    "ほのお": {
      "ほのお": 0.5, "みず": 0.5, "くさ": 2, "こおり": 2,
      "むし": 2, "いわ": 0.5, "ドラゴン": 0.5, "はがね": 2,
    },
    "みず": {
      "ほのお": 2, "みず": 0.5, "くさ": 0.5, "じめん": 2,
      "いわ": 2, "ドラゴン": 0.5,
    },
    "でんき": {
      "みず": 2, "でんき": 0.5, "くさ": 0.5, "じめん": 0,
      "ひこう": 2, "ドラゴン": 0.5,
    },
    "くさ": {
      "ほのお": 0.5, "みず": 2, "くさ": 0.5, "どく": 0.5,
      "じめん": 2, "ひこう": 0.5, "むし": 0.5, "いわ": 2,
      "ドラゴン": 0.5, "はがね": 0.5,
    },
    "こおり": {
      "ほのお": 0.5, "みず": 0.5, "くさ": 2, "こおり": 0.5,
      "じめん": 2, "ひこう": 2, "ドラゴン": 2, "はがね": 0.5,
    },
    "かくとう": {
      "ノーマル": 2, "こおり": 2, "どく": 0.5, "ひこう": 0.5,
      "エスパー": 0.5, "むし": 0.5, "いわ": 2, "ゴースト": 0,
      "あく": 2, "はがね": 2, "フェアリー": 0.5,
    },
    "どく": {
      "くさ": 2, "どく": 0.5, "じめん": 0.5, "いわ": 0.5,
      "ゴースト": 0.5, "はがね": 0, "フェアリー": 2,
    },
    "じめん": {
      "ほのお": 2, "でんき": 2, "くさ": 0.5, "どく": 2,
      "ひこう": 0, "むし": 0.5, "いわ": 2, "はがね": 2,
    },
    "ひこう": {
      "でんき": 0.5, "くさ": 2, "かくとう": 2, "むし": 2,
      "いわ": 0.5, "はがね": 0.5,
    },
    "エスパー": {
      "かくとう": 2, "どく": 2, "エスパー": 0.5,
      "あく": 0, "はがね": 0.5,
    },
    "むし": {
      "ほのお": 0.5, "くさ": 2, "かくとう": 0.5, "どく": 0.5,
      "ひこう": 0.5, "エスパー": 2, "ゴースト": 0.5,
      "あく": 2, "はがね": 0.5, "フェアリー": 0.5,
    },
    "いわ": {
      "ほのお": 2, "こおり": 2, "かくとう": 0.5, "じめん": 0.5,
      "ひこう": 2, "むし": 2, "はがね": 0.5,
    },
    "ゴースト": {
      "ノーマル": 0, "エスパー": 2, "ゴースト": 2, "あく": 0.5,
    },
    "ドラゴン": { "ドラゴン": 2, "はがね": 0.5, "フェアリー": 0 },
    "あく": {
      "かくとう": 0.5, "エスパー": 2, "ゴースト": 2,
      "あく": 0.5, "フェアリー": 0.5,
    },
    "はがね": {
      "ほのお": 0.5, "みず": 0.5, "でんき": 0.5, "こおり": 2,
      "いわ": 2, "はがね": 0.5, "フェアリー": 2,
    },
    "フェアリー": {
      "ほのお": 0.5, "かくとう": 2, "どく": 0.5, "ドラゴン": 2,
      "あく": 2, "はがね": 0.5,
    },
    "なし": {},
  };

  const TYPE_BOOST_ITEMS = {
    "シルクのスカーフ": "ノーマル",
    "もくたん": "ほのお",
    "しんぴのしずく": "みず",
    "うしおのおこう": "みず",
    "じしゃく": "でんき",
    "きせきのタネ": "くさ",
    "とけないこおり": "こおり",
    "くろおび": "かくとう",
    "どくバリ": "どく",
    "やわらかいすな": "じめん",
    "するどいくちばし": "ひこう",
    "まがったスプーン": "エスパー",
    "ぎんのこな": "むし",
    "かたいいし": "いわ",
    "のろいのおふだ": "ゴースト",
    "りゅうのキバ": "ドラゴン",
    "くろいメガネ": "あく",
    "メタルコート": "はがね",
    "ようせいのはね": "フェアリー",
  };

  const GEM_TYPES = {
    "ノーマルジュエル": "ノーマル",
    "くさのジュエル": "くさ",
    "ほのおのジュエル": "ほのお",
    "みずのジュエル": "みず",
    "でんきのジュエル": "でんき",
    "こおりのジュエル": "こおり",
    "いわのジュエル": "いわ",
    "じめんのジュエル": "じめん",
    "かくとうジュエル": "かくとう",
    "ひこうのジュエル": "ひこう",
    "むしのジュエル": "むし",
    "どくのジュエル": "どく",
    "エスパージュエル": "エスパー",
    "ゴーストジュエル": "ゴースト",
    "ドラゴンジュエル": "ドラゴン",
    "あくのジュエル": "あく",
    "はがねのジュエル": "はがね",
    "ようせいジュエル": "フェアリー",
  };

  const RESIST_BERRIES = {
    "ホズのみ": "ノーマル",
    "オッカのみ": "ほのお",
    "イトケのみ": "みず",
    "ソクノのみ": "でんき",
    "リンドのみ": "くさ",
    "ヤチェのみ": "こおり",
    "ヨプのみ": "かくとう",
    "ビアーのみ": "どく",
    "シュカのみ": "じめん",
    "バコウのみ": "ひこう",
    "ウタンのみ": "エスパー",
    "タンガのみ": "むし",
    "ヨロギのみ": "いわ",
    "カシブのみ": "ゴースト",
    "ハバンのみ": "ドラゴン",
    "ナモのみ": "あく",
    "リリバのみ": "はがね",
    "ロゼルのみ": "フェアリー",
  };

  const BITING_MOVES = new Set([
    "かみつく", "かみくだく", "ひっさつまえば", "どくどくのキバ",
    "ほのおのキバ", "こおりのキバ", "かみなりのキバ", "サイコファング",
  ]);

  const PUNCHING_MOVES = new Set([
    "れんぞくパンチ", "メガトンパンチ", "ほのおのパンチ", "れいとうパンチ",
    "かみなりパンチ", "マッハパンチ", "ばくれつパンチ", "きあいパンチ",
    "コメットパンチ", "シャドーパンチ", "スカイアッパー", "アームハンマー",
    "バレットパンチ", "ドレインパンチ", "グロウパンチ",
  ]);

  const RECOIL_MOVES = new Set([
    "とっしん", "すてみタックル", "じごくぐるま", "ボルテッカー",
    "だいちのいかり", "フレアドライブ", "ブレイブバード", "ウッドハンマー",
    "ワイルドボルト", "アクアインパクト", "もろはのずつき",
    "ムーンインパクト", "インパクトサイト",
  ]);

  const BATTLE_RANK_STATS = [
    "attack", "defense", "speed", "specialAttack",
    "specialDefense", "accuracy", "evasion",
  ];

  const MOVE_TYPE_EFFECTIVENESS_OVERRIDES = {
    "じゅうおうのキバ": { "ひこう": 1 },
    "フリーズドライ": { "みず": 2 },
    "ポイズンリーフ": { "みず": 2 },
  };

  function getTypeEffectiveness(moveType, defenderTypes) {
    return getMoveTypeEffectiveness("", moveType, defenderTypes);
  }

  function getMoveTypeEffectiveness(moveName, moveType, defenderTypes) {
    const row = TYPE_CHART[moveType] || {};
    const overrides = MOVE_TYPE_EFFECTIVENESS_OVERRIDES[moveName] || {};
    return (defenderTypes || []).reduce((total, type) => {
      if (Object.hasOwn(overrides, type)) {
        return total * overrides[type];
      }
      return total * (Object.hasOwn(row, type) ? row[type] : 1);
    }, 1);
  }

  function resolveMoveType(moveType, ability, moveClass = "", attackerTypes = []) {
    if (moveClass === "user_type" && attackerTypes.length > 0) {
      return attackerTypes[0];
    }
    if (moveType !== "ノーマル") return moveType;
    const conversions = {
      "エレキスキン": "でんき",
      "スカイスキン": "ひこう",
      "フェアリースキン": "フェアリー",
      "フリーズスキン": "こおり",
    };
    if (ability === "ノーマルスキン") return "ノーマル";
    return conversions[ability] || moveType;
  }

  function resolveMovePower(options) {
    const power = options.power || 0;
    const currentHp = options.currentHp ?? options.maxHp ?? 1;
    const maxHp = Math.max(1, options.maxHp || 1);
    const attackerCurrentHp =
      options.attackerCurrentHp ?? options.attackerMaxHp ?? 1;
    const attackerMaxHp = Math.max(1, options.attackerMaxHp || 1);

    if (options.moveClass === "itemless_boost" && !options.attackerItem) {
      return power * 2;
    }
    if (options.moveClass === "target_half_hp" && currentHp * 2 <= maxHp) {
      return power * 2;
    }
    if (
      options.moveClass === "attacker_half_hp"
      && attackerCurrentHp * 2 <= attackerMaxHp
    ) {
      return power * 2;
    }
    if (options.moveClass === "target_hp_scale") {
      return Math.max(1, Math.floor(power * currentHp / maxHp));
    }
    if (options.moveClass === "stored_power") {
      const rankTotal = getBattleRanks(options.attackerRanks)
        .reduce((total, rank) => total + Math.max(0, rank), 0);
      return power + rankTotal * 20;
    }
    if (options.moveClass === "punishment") {
      const raisedStatCount = getBattleRanks(options.defenderRanks)
        .filter((rank) => rank > 0)
        .length;
      return power + raisedStatCount * 20;
    }
    if (options.moveClass === "deadly_bone") {
      const speedRank = Math.max(
        0,
        normalizeRank(options.attackerRanks?.speed),
      );
      return power + Math.floor(speedRank / 2) * 10;
    }
    return power;
  }

  function normalizeRank(rank) {
    const value = Number(rank);
    if (!Number.isFinite(value)) return 0;
    return Math.max(-6, Math.min(6, Math.trunc(value)));
  }

  function applyBattleRank(value, rank) {
    const stat = Math.max(1, Number(value) || 1);
    const normalized = normalizeRank(rank);
    if (normalized >= 0) {
      return Math.floor(stat * (2 + normalized) / 2);
    }
    return Math.floor(stat * 2 / (2 - normalized));
  }

  function getBattleRanks(ranks = {}) {
    return BATTLE_RANK_STATS.map((stat) => normalizeRank(ranks[stat]));
  }

  function resolveMoveDamageMultiplier(options) {
    if (
      options.moveClass === "gravel_breath"
      && (
        options.actsAfterTarget
        || (options.defenderTypes || []).includes("はがね")
      )
    ) {
      return 2;
    }
    if (options.moveClass === "quick_turn") {
      const targetSpeedRank = normalizeRank(options.defenderRanks?.speed);
      if (targetSpeedRank < 0) return 0;
      if (targetSpeedRank > 0) return 2;
    }
    if (options.moveClass === "barrier_blast" && options.attackerScreen) {
      return 2;
    }
    if (options.moveClass === "payback" && options.actsAfterTarget) {
      return 2;
    }
    return 1;
  }

  function resolveOffensiveStat(options) {
    if (options.moveClass === "target_attack") {
      return options.defenderAttack || options.attack;
    }
    if (options.moveClass === "target_special_attack") {
      return options.defenderSpecialAttack || options.attack;
    }
    if (options.moveClass === "user_defense") {
      return options.attackerDefense || options.attack;
    }
    return options.attack;
  }

  function resolveOffensiveRank(options) {
    if (options.moveClass === "target_attack") {
      return options.defenderRanks?.attack;
    }
    if (options.moveClass === "target_special_attack") {
      return options.defenderRanks?.specialAttack;
    }
    if (options.moveClass === "user_defense") {
      return options.attackerRanks?.defense;
    }
    return options.category === "Special"
      ? options.attackerRanks?.specialAttack
      : options.attackerRanks?.attack;
  }

  function resolveDefensiveStat(options) {
    if (options.moveClass === "physical_defense") {
      return options.defenderDefense || options.defense;
    }
    if (options.moveClass === "special_defense") {
      return options.defenderSpecialDefense || options.defense;
    }
    return options.defense;
  }

  function resolveDefensiveRank(options) {
    if (options.moveClass === "physical_defense") {
      return options.defenderRanks?.defense;
    }
    if (options.moveClass === "special_defense") {
      return options.defenderRanks?.specialDefense;
    }
    return options.category === "Special"
      ? options.defenderRanks?.specialDefense
      : options.defenderRanks?.defense;
  }

  function applyRatio(value, numerator, denominator = 1) {
    return Math.floor(value * numerator / denominator);
  }

  function applyAttackModifiers(value, options, moveType) {
    const category = options.category;
    const ability = options.attackerAbility || "";
    const item = options.attackerItem || "";
    const attackerMaxHp = options.attackerMaxHp || 1;
    const attackerCurrentHp = options.attackerCurrentHp ?? attackerMaxHp;
    let result = value;

    if (category === "Physical" && ["ヨガパワー", "ちからもち"].includes(ability)) {
      result *= 2;
    } else if (category === "Physical" && ability === "はりきり") {
      result = applyRatio(result, 3, 2);
    } else if (category === "Physical" && ability === "こんじょう" && options.statused) {
      result = applyRatio(result, 3, 2);
    } else if (
      category === "Physical"
      && ability === "どくぼうそう"
      && options.toxicBoostActive
    ) {
      result = applyRatio(result, 3, 2);
    } else if (category === "Special" && ability === "サンパワー" && options.weather === "sunny") {
      result = applyRatio(result, 3, 2);
    } else if (ability === "よわき" && attackerCurrentHp <= attackerMaxHp / 2) {
      result = applyRatio(result, 1, 2);
    }

    if (item === "こだわりハチマキ" && category === "Physical") {
      result = applyRatio(result, 3, 2);
    } else if (item === "こだわりメガネ" && category === "Special") {
      result = applyRatio(result, 3, 2);
    } else if (item === "でんきだま" && options.attackerName === "ピカチュウ") {
      result *= 2;
    } else if (
      item === "ももいろシャボン"
      && category === "Physical"
      && ["リバード", "ララミンゴ"].includes(options.attackerName)
    ) {
      result *= 2;
    }

    if (
      item === "こころのしずく"
      && ["ラティアス", "ラティオス"].includes(options.attackerName)
      && category === "Special"
    ) {
      result = applyRatio(result, 3, 2);
    }
    return result;
  }

  function applyDefenseModifiers(value, options, moveType) {
    const category = options.category;
    const ability = options.defenderAbility || "";
    const item = options.defenderItem || "";
    let result = value;

    if (category === "Physical" && ability === "ファーコート") {
      result *= 2;
    } else if (category === "Physical" && ability === "ふしぎなうろこ" && options.defenderStatused) {
      result = applyRatio(result, 3, 2);
    } else if (
      category === "Special"
      && options.weather === "sandstorm"
      && (options.defenderTypes || []).includes("いわ")
    ) {
      result = applyRatio(result, 3, 2);
    }

    if (item === "しんかのきせき" && options.defenderCanEvolve) {
      result = applyRatio(result, 3, 2);
    } else if (item === "とつげきチョッキ" && category === "Special") {
      result = applyRatio(result, 3, 2);
    } else if (
      item === "メタルパウダー"
      && category === "Physical"
      && options.defenderName === "メタモン"
    ) {
      result = applyRatio(result, 3, 2);
    }
    if (
      item === "こころのしずく"
      && category === "Special"
      && ["ラティアス", "ラティオス"].includes(options.defenderName)
    ) {
      result = applyRatio(result, 3, 2);
    }
    return result;
  }

  function applyPowerModifiers(power, options, moveType) {
    const ability = options.attackerAbility || "";
    const item = options.attackerItem || "";
    const attackerMaxHp = options.attackerMaxHp || 1;
    const attackerCurrentHp = options.attackerCurrentHp ?? attackerMaxHp;
    let result = power;

    const biting = options.biting || BITING_MOVES.has(options.moveName);
    const punching = options.punching || PUNCHING_MOVES.has(options.moveName);
    const recoil = options.recoil || RECOIL_MOVES.has(options.moveName);

    const pinchTypes = {
      "しんりょく": "くさ",
      "もうか": "ほのお",
      "げきりゅう": "みず",
      "むしのしらせ": "むし",
    };

    if (
      pinchTypes[ability] === moveType
      && attackerCurrentHp <= attackerMaxHp / 3
    ) {
      result = applyRatio(result, 3, 2);
    } else if (ability === "ちからずく" && options.secondaryEffect) {
      result = applyRatio(result, 13, 10);
    } else if (ability === "テクニシャン" && result <= 60) {
      result = applyRatio(result, 3, 2);
    } else if (ability === "かたいツメ" && options.contact) {
      result = applyRatio(result, 13, 10);
    } else if (ability === "がんじょうあご" && biting) {
      result = applyRatio(result, 3, 2);
    } else if (ability === "てつのこぶし" && punching) {
      result = applyRatio(result, 6, 5);
    } else if (ability === "すてみ" && recoil) {
      result = applyRatio(result, 6, 5);
    } else if (
      ability === "すなのちから"
      && options.weather === "sandstorm"
      && ["いわ", "じめん", "はがね"].includes(moveType)
    ) {
      result = applyRatio(result, 13, 10);
    } else if (
      ["エレキスキン", "スカイスキン", "フェアリースキン", "フリーズスキン", "ノーマルスキン"]
        .includes(ability)
      && options.moveType === "ノーマル"
    ) {
      result = applyRatio(result, 6, 5);
    }

    if (
      (item === "ちからのハチマキ" && options.category === "Physical")
      || (item === "ものしりメガネ" && options.category === "Special")
    ) {
      result = applyRatio(result, 11, 10);
    } else if (TYPE_BOOST_ITEMS[item] === moveType) {
      result = applyRatio(result, 6, 5);
    } else if (GEM_TYPES[item] === moveType) {
      result = applyRatio(result, 3, 2);
    }
    return result;
  }

  function calculateDamageRange(input) {
    const options = {
      level: 50,
      power: 0,
      attack: 1,
      defense: 1,
      moveType: "なし",
      category: "Physical",
      attackerTypes: [],
      defenderTypes: [],
      moveClass: "standard",
      weather: "none",
      currentHp: 1,
      maxHp: 1,
      ...input,
    };

    const moveType = resolveMoveType(
      options.moveType,
      options.attackerAbility,
      options.moveClass,
      options.attackerTypes,
    );
    let attack = applyAttackModifiers(resolveOffensiveStat(options), options, moveType);
    attack = applyBattleRank(attack, resolveOffensiveRank(options));
    let defense = applyDefenseModifiers(resolveDefensiveStat(options), options, moveType);
    defense = applyBattleRank(defense, resolveDefensiveRank(options));
    let power = applyPowerModifiers(resolveMovePower(options), options, moveType);

    if (
      options.defenderAbility === "あついしぼう"
      && ["ほのお", "こおり"].includes(moveType)
    ) {
      attack = applyRatio(attack, 1, 2);
    } else if (options.defenderAbility === "たいねつ" && moveType === "ほのお") {
      attack = applyRatio(attack, 1, 2);
    }

    defense = Math.max(1, defense);
    const levelFactor = Math.floor(options.level * 2 / 5) + 2;
    let damage = Math.floor(levelFactor * power * attack / defense);
    damage = Math.floor(damage / 50) + 2;
    damage *= resolveMoveDamageMultiplier(options);

    if (
      options.screen
      && !options.critical
      && options.moveClass !== "ignore_screen"
    ) {
      damage = options.doubleBattle
        ? applyRatio(damage, 2, 3)
        : applyRatio(damage, 1, 2);
    }
    if (options.doubleBattle && options.spreadMove) {
      damage = applyRatio(damage, 3, 4);
    }
    if (options.weather === "rain" && moveType === "みず") {
      damage = applyRatio(damage, 3, 2);
    } else if (options.weather === "rain" && moveType === "ほのお") {
      damage = applyRatio(damage, 1, 2);
    } else if (options.weather === "sunny" && moveType === "ほのお") {
      damage = applyRatio(damage, 3, 2);
    } else if (options.weather === "sunny" && moveType === "みず") {
      damage = applyRatio(damage, 1, 2);
    }

    if (options.attackerItem === "いのちのたま") {
      damage = applyRatio(damage, 13, 10);
    }
    if (options.critical) {
      damage = applyRatio(damage, 3, 2);
      if (options.attackerAbility === "スナイパー") {
        damage = applyRatio(damage, 3, 2);
      }
    }
    if (options.burned && options.category === "Physical" && options.attackerAbility !== "こんじょう") {
      damage = applyRatio(damage, 1, 2);
    }

    const stab = (options.attackerTypes || []).includes(moveType)
      || options.attackerAbility === "へんげんじざい";
    if (stab) {
      damage = options.attackerAbility === "てきおうりょく"
        ? damage * 2
        : applyRatio(damage, 3, 2);
    }

    const effectiveness = getMoveTypeEffectiveness(
      options.moveName,
      moveType,
      options.defenderTypes,
    );
    damage = Math.floor(damage * effectiveness);

    if (effectiveness < 1 && effectiveness > 0 && options.attackerAbility === "いろめがね") {
      damage *= 2;
    }
    if (
      effectiveness > 1
      && ["フィルター", "ハードロック"].includes(options.defenderAbility)
    ) {
      damage = applyRatio(damage, 3, 4);
    }
    if (options.attackerItem === "たつじんのおび" && effectiveness > 1) {
      damage = applyRatio(damage, 6, 5);
    }
    if (
      RESIST_BERRIES[options.defenderItem] === moveType
      && (effectiveness > 1 || moveType === "ノーマル")
    ) {
      damage = applyRatio(damage, 1, 2);
    }
    if (
      options.defenderAbility === "マルチスケイル"
      && options.currentHp >= options.maxHp
    ) {
      damage = applyRatio(damage, 1, 2);
    }
    if (options.defenderAbility === "フレンドガード") {
      damage = applyRatio(damage, 3, 4);
    }

    if (damage <= 0 || effectiveness === 0) {
      return { min: 0, max: 0, effectiveness, moveType };
    }
    const max = Math.max(1, damage);
    return {
      min: Math.max(1, Math.floor(max * 85 / 100)),
      max,
      effectiveness,
      moveType,
    };
  }

  function formatMoveDetails(move) {
    const categoryNames = {
      Physical: "物理",
      Special: "特殊",
      Status: "変化",
    };
    const power = move.power > 0 ? move.power : "-";
    const accuracy = move.accuracy > 0 ? move.accuracy : "-";
    return {
      summary: `${move.type} / ${categoryNames[move.category] || move.category} / 威力 ${power} / 命中 ${accuracy}`,
      description: move.description || "",
    };
  }

  return {
    TYPE_CHART,
    calculateDamageRange,
    formatMoveDetails,
    getMoveTypeEffectiveness,
    getTypeEffectiveness,
    isDamageRelevantAbility,
    resolveMultiTurnDefenderHp,
    resolveMoveDamageMultiplier,
    resolveMovePower,
    resolveMoveType,
  };
});
