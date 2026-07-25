// ========================
// 1. グローバル変数定義
// ========================

// データ格納用
let allPokemonData = [];
let moveData = [];
let itemData = [];
let natureData = [];

// ポケモンの状態管理
let attackerPokemon = {
    name: "",
    baseStats: { hp: 0, a: 0, b: 0, c: 0, d: 0, s: 0 },
    ivValues: { hp: 31, a: 31, b: 31, c: 31, d: 31, s: 31 },
    evValues: { hp: 0, a: 0, b: 0, c: 0, d: 0, s: 0 },
    natureModifiers: { a: 1.0, b: 1.0, c: 1.0, d: 1.0, s: 1.0 },
    level: 50,
    types: [],
    item: null,
    ability: "",
    canEvolve: false
};

let defenderPokemon = {
    name: "",
    baseStats: { hp: 0, a: 0, b: 0, c: 0, d: 0, s: 0 },
    ivValues: { hp: 31, a: 31, b: 31, c: 31, d: 31, s: 31 },
    evValues: { hp: 0, a: 0, b: 0, c: 0, d: 0, s: 0 },
    natureModifiers: { a: 1.0, b: 1.0, c: 1.0, d: 1.0, s: 1.0 },
    level: 50,
    types: [],
    item: null,
    ability: "",
    canEvolve: false
};

// 現在選択されている技
let currentMove = null;

// ダメージ履歴
let damageHistory = [];

// 複数ターンの技を管理する配列（最初の技も含めて5つ）
let multiTurnMoves = [null, null, null, null, null]; // 0: 1ターン目の技(通常の技欄), 1-4: 2-5ターン目

// 性格データ
const natureDataList = [
    { "name": "ひかえめ", "c": 1.1, "a": 0.9 },
    { "name": "おくびょう", "s": 1.1, "a": 0.9 },
    { "name": "いじっぱり", "a": 1.1, "c": 0.9 },
    { "name": "ようき", "s": 1.1, "c": 0.9 },
    { "name": "ずぶとい", "b": 1.1, "a": 0.9 },
    { "name": "おだやか", "d": 1.1, "a": 0.9 },
    { "name": "わんぱく", "b": 1.1, "c": 0.9 },
    { "name": "しんちょう", "d": 1.1, "c": 0.9 },
    { "name": "れいせい", "c": 1.1, "s": 0.9 },
    { "name": "ゆうかん", "a": 1.1, "s": 0.9 },
    { "name": "なまいき", "d": 1.1, "s": 0.9 },
    { "name": "むじゃき", "s": 1.1, "d": 0.9 },
    { "name": "せっかち", "s": 1.1, "b": 0.9 },
    { "name": "さみしがり", "a": 1.1, "b": 0.9 },
    { "name": "やんちゃ", "a": 1.1, "d": 0.9 },
    { "name": "のうてんき", "b": 1.1, "d": 0.9 },
    { "name": "のんき", "b": 1.1, "s": 0.9 },
    { "name": "おっとり", "c": 1.1, "b": 0.9 },
    { "name": "うっかりや", "c": 1.1, "d": 0.9 },
    { "name": "おとなしい", "d": 1.1, "b": 0.9 },
    { "name": "まじめ", "a": 1.0, "b": 1.0, "c": 1.0, "d": 1.0, "s": 1.0 },
    { "name": "てれや", "a": 1.0, "b": 1.0, "c": 1.0, "d": 1.0, "s": 1.0 },
    { "name": "がんばりや", "a": 1.0, "b": 1.0, "c": 1.0, "d": 1.0, "s": 1.0 },
    { "name": "すなお", "a": 1.0, "b": 1.0, "c": 1.0, "d": 1.0, "s": 1.0 },
    { "name": "きまぐれ", "a": 1.0, "b": 1.0, "c": 1.0, "d": 1.0, "s": 1.0 }
];

// ========================
// 2. 初期化関数
// ========================

document.addEventListener('DOMContentLoaded', function() {
    initializePageWithRestore();
});

// ========================
// クリップボードコピー機能
// ========================

// 持ち物がダメージ計算に影響するかを判定
function isItemEffectiveForMove(item, move) {
    if (!item || !move) return false;
    
    const isPhysical = move.category === 'Physical';
    const isSpecial = move.category === 'Special';
    const pokemonName = attackerPokemon.name;
    
    // ポケモン専用アイテムの専用チェック
    const exclusiveItems = {
        'でんきだま': ['ピカチュウ'],
        'こころのしずく': ['ラティオス', 'ラティアス'],
        'しんかいのウロコ': ['パールル'],
        'しんかいのキバ': ['パールル'],
        'メタルパウダー': ['メタモン'],
        'ふといホネ': ['カラカラ', 'ガラガラ']
    };
    
    // 専用アイテムの場合、該当ポケモン以外は効果なし
    if (exclusiveItems[item.name]) {
        if (!exclusiveItems[item.name].includes(pokemonName)) {
            return false;
        }
    }
    
    // 攻撃力補正系アイテム
    if (item.timing === "attackMod") {
        if (isPhysical && item.a && item.a !== 1.0) return true;
        if (isSpecial && item.c && item.c !== 1.0) return true;
    }
    
    // タイプ一致補正系アイテム
    if (item.timing === "typeMod" && item.type === move.type) {
        return true;
    }
    
    // 威力補正系アイテム（特定技への補正）
    if (item.timing === "powerMod") {
        return true;
    }
    
    return false;
}

// ========================

function copyResult(button) {
    // 結果テキストを親要素から抽出
    const resultDiv = button.closest('.damage-result');
    
    // 全テキストを取得して行ごとに分割
    const allText = resultDiv.textContent;
    const allLines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const lines = [];
    
    // 必要な行だけを抽出
    let moveAdded = false;
    for (let line of allLines) {
        if (line.includes('攻撃側:') && !line.includes('ダメージ計算結果') && !line.includes('コピー')) {
            lines.push(line);
        } else if (line.includes('防御側:') && !line.includes('ダメージ計算結果') && !line.includes('コピー')) {
            lines.push(line);
        } else if (line.includes('使用技:')) {
            lines.push(line);
            moveAdded = true;
            
            // 攻撃側の持ち物がダメージに影響する場合は追加
            if (attackerPokemon.item && currentMove && isItemEffectiveForMove(attackerPokemon.item, currentMove)) {
                lines.push(`持ち物: ${attackerPokemon.item.name}`);
            }
        } else if (line.includes('ランク補正:')) {
            lines.push(line);
        } else if (line.includes('ダメージ範囲:')) {
            lines.push(line);
        } else if (line.includes('割合:') && line.includes('%')) {
            lines.push(line);
        } else if ((line.includes('確定') && line.includes('発')) || 
                   (line.includes('乱数') && line.includes('発') && line.includes('%'))) {
            lines.push(line);
            break; // 乱数情報は最初の1つだけ
        }
    }
    
    const copyText = lines.join('\n');
    
    navigator.clipboard.writeText(copyText).then(function() {
        // 成功時の表示
        const originalText = button.textContent;
        button.textContent = 'コピー完了';
        button.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '#007bff';
        }, 1500);
    }).catch(function(err) {
        console.error('コピーに失敗しました: ', err);
        alert('コピーに失敗しました');
    });
}

// ========================
// ページ再読み込み時の入力値復元機能
// ========================

/**
 * ページ読み込み時に既存の入力値をJavaScript状態に同期
 */
function restoreInputValuesOnLoad() {
    // ポケモン名の復元
    restorePokemonSelection();
    
    // レベルの復元
    restoreLevels();
    
    // 個体値・努力値の復元
    restoreIVEVValues();
    
    // 性格の復元
    restoreNatureSelection();
    
    // アイテムの復元
    restoreItemSelection();
    
    // 技の復元
    restoreMoveSelection();
    
    // 複数ターン技の復元
    restoreMultiTurnMoves();
    
    // 実数値の同期（最後に実行）
    restoreRealStatValues();
    
    // ステータス計算を実行
    if (attackerPokemon.name) {
        updateStats('attacker');
    }
    if (defenderPokemon.name) {
        updateStats('defender');
    }
    
    // ボタンの表示を更新
    updateAllButtons();
    
    // 詳細設定の表示更新
    updateDetailSummary('attacker');
    updateDetailSummary('defender');
}

/**
 * ポケモン選択の復元
 */
function restorePokemonSelection() {
    const attackerInput = document.getElementById('attackerPokemon');
    const defenderInput = document.getElementById('defenderPokemon');
    
    if (attackerInput && attackerInput.value) {
        selectPokemon('attacker', attackerInput.value);
    }
    
    if (defenderInput && defenderInput.value) {
        selectPokemon('defender', defenderInput.value);
    }
}

/**
 * レベルの復元
 */
function restoreLevels() {
    const attackerLevel = document.getElementById('attackerLevel');
    const defenderLevel = document.getElementById('defenderLevel');
    
    if (attackerLevel && attackerLevel.value) {
        attackerPokemon.level = parseInt(attackerLevel.value) || 50;
        syncLevelPreset('attacker', attackerPokemon.level);
    }

    if (defenderLevel && defenderLevel.value) {
        defenderPokemon.level = parseInt(defenderLevel.value) || 50;
        syncLevelPreset('defender', defenderPokemon.level);
    }
}

/**
 * 個体値・努力値の復元
 */
function restoreIVEVValues() {
    const stats = ['hp', 'a', 'b', 'c', 'd', 's'];
    
    // 攻撃側の復元
    stats.forEach(stat => {
        const statUpper = stat.toUpperCase();
        
        // 個体値（メイン）
        const mainIV = document.getElementById(`attackerIv${statUpper}`);
        if (mainIV && mainIV.value !== '') {
            attackerPokemon.ivValues[stat] = parseInt(mainIV.value) || 31;
        }
        
        // 個体値（詳細）
        const detailIV = document.getElementById(`attackerDetailIv${statUpper}`);
        if (detailIV && detailIV.value !== '') {
            attackerPokemon.ivValues[stat] = parseInt(detailIV.value) || 31;
            if (mainIV) mainIV.value = detailIV.value; // 同期
        }
        
        // 努力値（メイン）
        const mainEV = document.getElementById(`attackerEv${statUpper}`);
        if (mainEV && mainEV.value !== '') {
            attackerPokemon.evValues[stat] = parseInt(mainEV.value) || 0;
        }
        
        // 努力値（詳細）
        const detailEV = document.getElementById(`attackerDetailEv${statUpper}`);
        if (detailEV && detailEV.value !== '') {
            attackerPokemon.evValues[stat] = parseInt(detailEV.value) || 0;
            if (mainEV) mainEV.value = detailEV.value; // 同期
        }
    });
    
    // 防御側の復元
    stats.forEach(stat => {
        const statUpper = stat.toUpperCase();
        
        // 個体値（メイン）
        const mainIV = document.getElementById(`defenderIv${statUpper}`);
        if (mainIV && mainIV.value !== '') {
            defenderPokemon.ivValues[stat] = parseInt(mainIV.value) || 31;
        }
        
        // 個体値（詳細）
        const detailIV = document.getElementById(`defenderDetailIv${statUpper}`);
        if (detailIV && detailIV.value !== '') {
            defenderPokemon.ivValues[stat] = parseInt(detailIV.value) || 31;
            if (mainIV) mainIV.value = detailIV.value; // 同期
        }
        
        // 努力値（メイン）
        const mainEV = document.getElementById(`defenderEv${statUpper}`);
        if (mainEV && mainEV.value !== '') {
            defenderPokemon.evValues[stat] = parseInt(mainEV.value) || 0;
        }
        
        // 努力値（詳細）
        const detailEV = document.getElementById(`defenderDetailEv${statUpper}`);
        if (detailEV && detailEV.value !== '') {
            defenderPokemon.evValues[stat] = parseInt(detailEV.value) || 0;
            if (mainEV) mainEV.value = detailEV.value; // 同期
        }
    });
}

/**
 * 性格選択の復元
 */
function restoreNatureSelection() {
    const attackerNature = document.getElementById('attackerNature');
    const defenderNature = document.getElementById('defenderNature');
    
    if (attackerNature && attackerNature.value) {
        selectNature('attacker');
    }
    
    if (defenderNature && defenderNature.value) {
        selectNature('defender');
    }
    
    // 性格チェックボックスの復元
    restoreNatureCheckboxes();
}

/**
 * 性格チェックボックスの復元
 */
function restoreNatureCheckboxes() {
    const sides = ['attacker', 'defender'];
    const stats = ['a', 'b', 'c', 'd', 's'];
    
    sides.forEach(side => {
        const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
        
        stats.forEach(stat => {
            const plusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Plus`);
            const minusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Minus`);
            
            if (plusCheckbox && plusCheckbox.checked) {
                pokemon.natureModifiers[stat] = 1.1;
                // 他のプラス補正を解除
                stats.forEach(otherStat => {
                    if (otherStat !== stat) {
                        const otherPlusCheckbox = document.getElementById(`${side}${otherStat.toUpperCase()}Plus`);
                        if (otherPlusCheckbox && otherPlusCheckbox.checked) {
                            otherPlusCheckbox.checked = false;
                            pokemon.natureModifiers[otherStat] = pokemon.natureModifiers[otherStat] === 0.9 ? 0.9 : 1.0;
                        }
                    }
                });
            }
            
            if (minusCheckbox && minusCheckbox.checked) {
                pokemon.natureModifiers[stat] = 0.9;
                // 他のマイナス補正を解除
                stats.forEach(otherStat => {
                    if (otherStat !== stat) {
                        const otherMinusCheckbox = document.getElementById(`${side}${otherStat.toUpperCase()}Minus`);
                        if (otherMinusCheckbox && otherMinusCheckbox.checked) {
                            otherMinusCheckbox.checked = false;
                            pokemon.natureModifiers[otherStat] = pokemon.natureModifiers[otherStat] === 1.1 ? 1.1 : 1.0;
                        }
                    }
                });
            }
        });
        
        // メイン画面の性格補正ボタンも更新
        if (side === 'attacker') {
            updateMainNatureButtons(side, 'a', pokemon.natureModifiers['a']);
            updateMainNatureButtons(side, 'c', pokemon.natureModifiers['c']);
        } else {
            updateMainNatureButtons(side, 'b', pokemon.natureModifiers['b']);
            updateMainNatureButtons(side, 'd', pokemon.natureModifiers['d']);
        }
    });
}

/**
 * アイテム選択の復元
 */
function restoreItemSelection() {
    const attackerItem = document.getElementById('attackerItem');
    const defenderItem = document.getElementById('defenderItem');
    
    if (attackerItem && attackerItem.value) {
        selectItem('attacker', attackerItem.value);
    }
    
    if (defenderItem && defenderItem.value) {
        selectItem('defender', defenderItem.value);
    }
}

/**
 * 技選択の復元
 */
function restoreMoveSelection() {
    const attackMove = document.getElementById('attackMove');
    
    if (attackMove && attackMove.value) {
        selectMove(attackMove.value);
    }
}

/**
 * 複数ターン技の復元
 */
function restoreMultiTurnMoves() {
    for (let i = 2; i <= 5; i++) {
        const moveInput = document.getElementById(`multiTurnMove${i}`);
        if (moveInput && moveInput.value) {
            selectMultiTurnMove(i - 1, moveInput.value);
        }
    }
}

/**
 * 実数値の同期（既存の入力値がある場合）
 */
function restoreRealStatValues() {
    const sides = ['attacker', 'defender'];
    const stats = ['hp', 'a', 'b', 'c', 'd', 's'];
    
    sides.forEach(side => {
        stats.forEach(stat => {
            const statUpper = stat.toUpperCase();
            
            // メイン画面の実数値
            const mainReal = document.getElementById(`${side}Real${statUpper}`);
            if (mainReal && mainReal.value && parseInt(mainReal.value) > 0) {
                // 実数値から逆算して個体値・努力値を調整
                adjustStatsFromRealValue(side, stat, parseInt(mainReal.value));
            }
            
            // 詳細画面の実数値
            const detailReal = document.getElementById(`${side}DetailReal${statUpper}`);
            if (detailReal && detailReal.value && parseInt(detailReal.value) > 0) {
                // メイン画面にも反映
                if (mainReal && !mainReal.value) {
                    if (mainReal.updateValueSilently) {
                        mainReal.updateValueSilently(detailReal.value);
                    } else {
                        mainReal.value = detailReal.value;
                    }
                }
            }
        });
    });
}

/**
 * 実数値から個体値・努力値を逆算調整
 */
function adjustStatsFromRealValue(side, stat, targetValue) {
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    
    // ポケモンが選択されていない場合はスキップ
    if (!pokemon.name || !pokemon.baseStats[stat]) {
        return;
    }
    
    // 現在の実数値を計算
    const currentRealStat = calculateCurrentStat(pokemon, stat);
    
    // 既に目標値と一致している場合はスキップ
    if (currentRealStat === targetValue) {
        return;
    }
    
    // 制限チェック
    const limits = calculateStatLimits(pokemon.baseStats[stat], pokemon.level, stat === 'hp');
    if (targetValue < limits.min || targetValue > limits.max) {
        console.warn(`実数値${targetValue}は範囲外です (${limits.min}-${limits.max})`);
        return;
    }
    
    // 最適化処理を実行
    const result = findOptimalStats(pokemon, stat, targetValue, pokemon.baseStats[stat], pokemon.level);
    
    if (result && isValidResult(result, targetValue, pokemon.baseStats[stat], pokemon.level, stat === 'hp')) {
        // 結果を適用
        pokemon.ivValues[stat] = result.iv;
        pokemon.evValues[stat] = result.ev;
        
        // 性格補正も変更された場合
        if (result.changeNature && result.natureMod !== undefined && stat !== 'hp') {
            pokemon.natureModifiers[stat] = result.natureMod;
        }
        
        // UI要素を更新
        updateIVEVInputs(side, stat, result.iv, result.ev);
    }
}

/**
 * 特殊設定の復元（チェックボックス、セレクトボックスなど）
 */
function restoreSpecialSettings() {
    // 天候設定
    const weatherSelect = document.getElementById('weatherSelect');
    if (weatherSelect && weatherSelect.value) {
        updateWeatherBallIfNeeded();
        updateCastformTypeIfNeeded();
    }
    
    // 特性チェックボックス（必要に応じて追加）
    restoreAbilityCheckboxes();
    
    // その他のチェックボックス
    restoreOtherCheckboxes();
}

/**
 * 特性チェックボックスの復元
 */
function restoreAbilityCheckboxes() {
    // 攻撃側特性
    const attackerAbilities = [
        'yogaPowerCheck', 'hugePowerCheck', 'harikiriCheck',
        'plusCheck', 'minusCheck', 'gutsCheck',
        'shinryokuCheck', 'moukaCheck', 'gekiryuuCheck',
        'mushiNoShiraseCheck', 'moraibiCheck'
    ];
    
    // 防御側特性
    const defenderAbilities = [
        'atsuishibouCheck', 'fushiginaurokoCheck'
    ];
    
    [...attackerAbilities, ...defenderAbilities].forEach(abilityId => {
        const checkbox = document.getElementById(abilityId);
        if (checkbox && checkbox.checked) {
        }
    });
}

/**
 * その他のチェックボックスの復元
 */
function restoreOtherCheckboxes() {
    const checkboxes = [
        'criticalCheck', 'substituteCheck', 'doubleCheck',
        'wallCheck', 'burnCheck', 'chargingCheck',
        'helpCheck', 'twofoldCheck', 'keepDamageCheck'
    ];
    
    checkboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
    });
}

/**
 * 現在HPの復元と同期
 */
function restoreCurrentHP() {
    const currentHPInput = document.getElementById('defenderCurrentHP');
    const maxHPInput = document.getElementById('defenderRealHP');
    const detailMaxHPInput = document.getElementById('defenderDetailRealHP');
    
    if (currentHPInput && maxHPInput) {
        const currentHP = parseInt(currentHPInput.value) || 0;
        const maxHP = parseInt(maxHPInput.value) || parseInt(detailMaxHPInput?.value) || 0;
        
        if (currentHP > 0 && maxHP > 0) {
            // 制限を設定
            currentHPInput.setAttribute('max', maxHP);
            currentHPInput.setAttribute('min', 1);
            currentHPInput.setAttribute('data-max-hp', maxHP);
            
            // 現在HPが最大HPを超えている場合は修正
            if (currentHP > maxHP) {
                currentHPInput.value = maxHP;
            }
        }
    }
}

// ========================
// DOMContentLoaded内で呼び出す修正版初期化関数
// ========================

function initializePageWithRestore() {
    // 既存の初期化処理
    loadAllData().then(() => {
        setupEventListeners();
        initializeNatureDataWithDropdown();
        syncIVInputs();
        setupStepInputs();
        initializeNatureButtons();
        updateDamageCalculationButton();
        setupMultiTurnMoveListeners();
        setupRealStatInputListeners();
        updateDetailSummary('attacker');
        updateDetailSummary('defender');
        setupHPSyncListeners();
        initializeMobileControls();
        document.getElementById('editionSelect')?.addEventListener('change', changeEdition);
        document.getElementById('attackerAbility')?.addEventListener('change', function() {
            attackerPokemon.ability = this.value;
        });
        document.getElementById('defenderAbility')?.addEventListener('change', function() {
            defenderPokemon.ability = this.value;
        });
        
        // ★重要：データ読み込み完了後に入力値を復元
        setTimeout(() => {
            restoreInputValuesOnLoad();
            restoreSpecialSettings();
            restoreCurrentHP();
        }, 100);
    });
    
    // UI初期化
    document.getElementById('twofoldContainer').style.display = 'none';
    document.getElementById('multiHitContainer').style.display = 'none';
    
    // ナビゲーションメニューの動作
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
    }
}


// データ読み込み
async function loadAllData() {
    try {
        // 全ポケモンデータ
        const edition = document.getElementById('editionSelect')?.value || 'procyon';
        const pokemonFile = edition === 'deneb'
            ? 'all_pokemon_data_deneb.json'
            : 'all_pokemon_data.json';
        const pokemonResponse = await fetch(pokemonFile);
        allPokemonData = await pokemonResponse.json();
        
        // 技データ
        const moveResponse = await fetch('pokemon_moves.json');
        moveData = await moveResponse.json();
        
        // アイテムデータ
        const itemResponse = await fetch('item.json');
        itemData = await itemResponse.json();
        
        // ドロップダウンの初期化
        initializeDropdownsWithNature();
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
    }
}

// 性格データの初期化
function initializeNatureDataWithDropdown() {
    natureData = natureDataList;
}


function initializeNatureButtons() {
    // 攻撃側の初期化
    updateMainNatureButtons('attacker', 'a', 1.0);
    updateMainNatureButtons('attacker', 'c', 1.0);
    
    // 防御側の初期化
    updateMainNatureButtons('defender', 'b', 1.0);
    updateMainNatureButtons('defender', 'd', 1.0);
}

function getLevelPresets() {
    return [5, 15, 20, 30, 50, 55, 100];
}

function normalizeLevel(value) {
    return Math.max(1, Math.min(100, parseInt(value) || 50));
}

function syncLevelPreset(side, level) {
    const preset = document.getElementById(`${side}LevelPreset`);
    if (!preset) return;

    const normalizedLevel = normalizeLevel(level);
    preset.value = getLevelPresets().includes(normalizedLevel) ?
        String(normalizedLevel) :
        '';
}

function applyLevelChange(side, value) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const level = normalizeLevel(value);
    target.level = level;
    syncLevelPreset(side, level);
    updateStats(side);
}

function setLevelPreset(side, value) {
    if (!value) return;

    const level = normalizeLevel(value);
    const levelInput = document.getElementById(`${side}Level`);
    if (levelInput) {
        levelInput.value = level;
    }
    applyLevelChange(side, level);
}

// イベントリスナーの設定
function setupEventListeners() {
    // レベル変更時（修正：制限更新を追加）
    document.getElementById('attackerLevel').addEventListener('change', function() {
        applyLevelChange('attacker', this.value);
        // 制限更新は updateStats 内で実行される
    });

    document.getElementById('defenderLevel').addEventListener('change', function() {
        applyLevelChange('defender', this.value);
        // 制限更新は updateStats 内で実行される
    });

    // inputイベントも追加（スピンボタン対応）（修正：制限更新を追加）
    document.getElementById('attackerLevel').addEventListener('input', function() {
        applyLevelChange('attacker', this.value);
        // 制限更新は updateStats 内で実行される
    });

    document.getElementById('defenderLevel').addEventListener('input', function() {
        applyLevelChange('defender', this.value);
        // 制限更新は updateStats 内で実行される
    });

    // 性格変更時
    document.getElementById('attackerNature').addEventListener('change', () => selectNature('attacker'));
    document.getElementById('defenderNature').addEventListener('change', () => selectNature('defender'));
    
    // 個体値変更時（表示されている欄）- ボタン更新を追加
    document.getElementById('attackerIvA').addEventListener('change', function() { 
        syncDetailIV('attacker', 'a'); 
        updateStats('attacker'); 
        updateIVButton(this); 
    });
    document.getElementById('attackerIvC').addEventListener('change', function() { 
        syncDetailIV('attacker', 'c'); 
        updateStats('attacker'); 
        updateIVButton(this); 
    });
    document.getElementById('defenderIvHP').addEventListener('change', function() { 
        syncDetailIV('defender', 'hp'); 
        updateStats('defender'); 
        updateIVButton(this); 
    });
    document.getElementById('defenderIvB').addEventListener('change', function() { 
        syncDetailIV('defender', 'b'); 
        updateStats('defender'); 
        updateIVButton(this); 
    });
    document.getElementById('defenderIvD').addEventListener('change', function() { 
        syncDetailIV('defender', 'd'); 
        updateStats('defender'); 
        updateIVButton(this); 
    });
    
    // 努力値変更時（メイン表示）
    document.getElementById('attackerEvA').addEventListener('change', function() { 
        syncDetailEV('attacker', 'a'); 
        updateStats('attacker'); 
        updateEVButton(this); 
    });
    document.getElementById('attackerEvC').addEventListener('change', function() { 
        syncDetailEV('attacker', 'c'); 
        updateStats('attacker'); 
        updateEVButton(this); 
    });
    document.getElementById('defenderEvHP').addEventListener('change', function() { 
        syncDetailEV('defender', 'hp'); 
        updateStats('defender'); 
        updateEVButton(this); 
    });
    document.getElementById('defenderEvB').addEventListener('change', function() { 
        syncDetailEV('defender', 'b'); 
        updateStats('defender'); 
        updateEVButton(this); 
    });
    document.getElementById('defenderEvD').addEventListener('change', function() { 
        syncDetailEV('defender', 'd'); 
        updateStats('defender'); 
        updateEVButton(this); 
    });

    // 天候変更時
    document.getElementById('weatherSelect').addEventListener('change', function() {
    updateWeatherBallIfNeeded();
    updateCastformTypeIfNeeded();
    });

    // まひ・こんらん変更時
    const paralysisSelect = document.getElementById('paralysisSelect');
    const confusionSelect = document.getElementById('confusionSelect');
    
    if (paralysisSelect) {
        paralysisSelect.addEventListener('change', function() {
            handleActionRestrictionChange();
        });
    }
    
    if (confusionSelect) {
        confusionSelect.addEventListener('change', function() {
            handleActionRestrictionChange();
        });
    }
    const statusDamageSelect = document.getElementById('statusDamageSelect');
    const spikesLevelInput = document.getElementById('spikesLevel');
    
    if (statusDamageSelect) {
        statusDamageSelect.addEventListener('change', function() {
            handleAutoSettingChange();
        });
    }
    
    if (spikesLevelInput) {
        spikesLevelInput.addEventListener('change', function() {
            handleAutoSettingChange();
        });
    }

    const curseSelect = document.getElementById('curseSelect');
    const nightmareSelect = document.getElementById('nightmareSelect');
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    
    if (curseSelect) {
        curseSelect.addEventListener('change', function() {
            handleAutoSettingChange();
        });
    }
    
    if (nightmareSelect) {
        nightmareSelect.addEventListener('change', function() {
            handleAutoSettingChange();
        });
    }
    
    if (leechSeedSelect) {
        leechSeedSelect.addEventListener('change', function() {
            handleAutoSettingChange();
        });
    }
}

function handleActionRestrictionChange() {
    console.log('=== 行動制限変更処理開始 ===');
    
    const paralysisSelect = document.getElementById('paralysisSelect');
    const confusionSelect = document.getElementById('confusionSelect');
    const paralysisValue = paralysisSelect ? paralysisSelect.value : 'none';
    const confusionValue = confusionSelect ? confusionSelect.value : 'none';
    
    const hasParalysis = paralysisValue !== 'none' && paralysisValue !== '';
    const hasConfusion = confusionValue !== 'none' && confusionValue !== '';
    const hasActionRestriction = hasParalysis || hasConfusion;
    
    console.log('行動制限設定:', {
        paralysis: paralysisValue,
        confusion: confusionValue,
        hasActionRestriction: hasActionRestriction
    });
    
    // ユーザーが入力した技があるかチェック
    let hasUserInputMoves = false;
    for (let i = 2; i <= 5; i++) {
        const input = document.getElementById(`multiTurnMove${i}`);
        if (input && input.value && input.value.trim() !== '') {
            hasUserInputMoves = true;
            break;
        }
    }
    
    console.log('ユーザー入力の複数ターン技:', hasUserInputMoves);
    
    // 行動制限がなくなり、かつユーザー入力の技もない場合は配列をクリア
    if (!hasActionRestriction && !hasUserInputMoves) {
        console.log('行動制限なし＆ユーザー入力技なし → multiTurnMoves配列をクリア');
        // 1ターン目以外をクリア
        for (let i = 1; i < 5; i++) {
            multiTurnMoves[i] = null;
        }
    }
    
    console.log('multiTurnMoves状態:', multiTurnMoves.map((move, i) => `${i}: ${move ? move.name : 'null'}`));
    console.log('=== 行動制限変更処理完了 ===');
}

// ユーザーが入力した複数ターン技があるかチェック
function hasUserInputMoves() {
    console.log('=== hasUserInputMoves チェック開始 ===');
    
    // 1. DOM入力欄の値をチェック（2-5ターン目）- 最優先
    let hasActualInputMoves = false;
    for (let i = 2; i <= 5; i++) {
        const input = document.getElementById(`multiTurnMove${i}`);
        if (input) {
            const value = input.value ? input.value.trim() : '';
            console.log(`${i}ターン目入力欄の値:`, `"${value}"`);
            if (value !== '') {
                console.log(`${i}ターン目に技が入力されています:`, value);
                hasActualInputMoves = true;
                break;
            }
        }
    }
    
    // 2. multiTurnMoves配列内の技をチェック（ただし、自動設定技は除外）
    let hasActualMultiTurnMoves = hasActualInputMoves;
    if (!hasActualInputMoves) {
        // 現在の設定を確認
        const paralysisSelect = document.getElementById('paralysisSelect');
        const confusionSelect = document.getElementById('confusionSelect');
        const statusDamageSelect = document.getElementById('statusDamageSelect');
        const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
        const weather = document.getElementById('weatherSelect').value;
        
        const paralysisValue = paralysisSelect ? paralysisSelect.value : 'none';
        const confusionValue = confusionSelect ? confusionSelect.value : 'none';
        const statusDamageValue = statusDamageSelect ? statusDamageSelect.value : 'none';
        
        const hasActionRestriction = (paralysisValue !== 'none' && paralysisValue !== '') || 
                                   (confusionValue !== 'none' && confusionValue !== '');
        const hasConstantDamage = statusDamageValue !== 'none' || spikesLevel > 0 || 
                                (weather === 'sandstorm' || weather === 'hail');
        
        console.log('自動設定条件チェック:', {
            hasActionRestriction: hasActionRestriction,
            hasConstantDamage: hasConstantDamage
        });
        
        // 自動設定が有効でない場合のみ配列をチェック
        if (!hasActionRestriction && !hasConstantDamage) {
            for (let i = 1; i < 5; i++) {
                if (multiTurnMoves[i] && multiTurnMoves[i].name && multiTurnMoves[i].name.trim() !== '') {
                    console.log(`multiTurnMoves[${i}]に技が設定されています:`, multiTurnMoves[i].name);
                    hasActualMultiTurnMoves = true;
                    break;
                }
            }
        } else {
            console.log('自動設定が有効のため、配列内の技は無視します');
        }
    }
    
    const result = hasActualMultiTurnMoves;
    
    console.log('=== hasUserInputMoves 結果 ===');
    console.log('入力欄での複数ターン技:', hasActualInputMoves);
    console.log('配列内での複数ターン技:', hasActualMultiTurnMoves);
    console.log('最終結果:', result);
    console.log('================================');
    
    return result;
}

function handleAutoSettingChange() {
    
    // 現在の設定を確認
    const paralysisSelect = document.getElementById('paralysisSelect');
    const confusionSelect = document.getElementById('confusionSelect');
    const statusDamageSelect = document.getElementById('statusDamageSelect');
    const spikesLevelInput = document.getElementById('spikesLevel');
    const weatherSelect = document.getElementById('weatherSelect');
    
    // のろい・あくむ・やどりぎの設定取得
    const curseSelect = document.getElementById('curseSelect');
    const nightmareSelect = document.getElementById('nightmareSelect');
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    const leechSeed2Select = document.getElementById('leechSeed2Select');
    
    const paralysisValue = paralysisSelect ? paralysisSelect.value : 'none';
    const confusionValue = confusionSelect ? confusionSelect.value : 'none';
    const statusDamageValue = statusDamageSelect ? statusDamageSelect.value : 'none';
    const spikesLevel = spikesLevelInput ? parseInt(spikesLevelInput.value) || 0 : 0;
    const weather = weatherSelect ? weatherSelect.value : 'none';
    
    // のろい・あくむ・やどりぎの値取得
    const curseValue = curseSelect ? curseSelect.value : 'none';
    const nightmareValue = nightmareSelect ? nightmareSelect.value : 'none';
    const leechSeedValue = leechSeedSelect ? leechSeedSelect.value : 'none';
    const leechSeed2Value = leechSeed2Select ? leechSeed2Select.value : 'none';

    const hasActionRestriction = (paralysisValue !== 'none' && paralysisValue !== '') || 
                               (confusionValue !== 'none' && confusionValue !== '');
    const hasConstantDamage = statusDamageValue !== 'none' || spikesLevel > 0 ||
                           (weather === 'sandstorm' || weather === 'hail') ||
                           (curseValue !== 'none' && curseValue !== '') ||
                           (nightmareValue !== 'none' && nightmareValue !== '') ||
                           (leechSeedValue !== 'none' && leechSeedValue !== '') ||
                           (leechSeed2Value !== 'none' && leechSeed2Value !== '');
   // 自動設定がすべてなくなり、かつユーザー入力の技もない場合は配列をクリア
   if (!hasActionRestriction && !hasConstantDamage && !hasUserInputMoves) {
       // 1ターン目以外をクリア
       for (let i = 1; i < 5; i++) {
           multiTurnMoves[i] = null;
       }
   }
}

// 個体値入力の同期
function syncIVInputs() {
    // 攻撃側
    document.getElementById('attackerDetailIvA').value = document.getElementById('attackerIvA').value;
    document.getElementById('attackerDetailIvC').value = document.getElementById('attackerIvC').value;
    
    // 防御側
    document.getElementById('defenderDetailIvHP').value = document.getElementById('defenderIvHP').value;
    document.getElementById('defenderDetailIvB').value = document.getElementById('defenderIvB').value;
    document.getElementById('defenderDetailIvD').value = document.getElementById('defenderIvD').value;
    
    // 努力値も同期
    syncAllEVInputs();
    
    // ボタンの初期表示を更新
    updateAllButtons();
}

// 全努力値同期
function syncAllEVInputs() {
    // 攻撃側努力値同期
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const mainId = `attackerEv${stat.toUpperCase()}`;
        const detailId = `attackerDetailEv${stat.toUpperCase()}`;
        const mainInput = document.getElementById(mainId);
        const detailInput = document.getElementById(detailId);
        
        if (mainInput && detailInput) {
            detailInput.value = mainInput.value || 0;
        }
    });
    
    // 防御側努力値同期
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const mainId = `defenderEv${stat.toUpperCase()}`;
        const detailId = `defenderDetailEv${stat.toUpperCase()}`;
        const mainInput = document.getElementById(mainId);
        const detailInput = document.getElementById(detailId);
        
        if (mainInput && detailInput) {
            detailInput.value = mainInput.value || 0;
        }
    });
}

// 努力値の同期（メイン→詳細）
function syncDetailEV(side, stat) {
    const mainId = `${side}Ev${stat.toUpperCase()}`;
    const detailId = `${side}DetailEv${stat.toUpperCase()}`;
    const mainInput = document.getElementById(mainId);
    const detailInput = document.getElementById(detailId);
    
    if (mainInput && detailInput) {
        detailInput.value = mainInput.value;
        updateDetailEVButton(detailInput);
    }
}

// 努力値の同期（詳細→メイン）
function syncMainEV(side, stat) {
    const detailId = `${side}DetailEv${stat.toUpperCase()}`;
    const mainId = `${side}Ev${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailId);
    const mainInput = document.getElementById(mainId);
    
    if (detailInput && mainInput) {
        mainInput.value = detailInput.value;
        updateEVButton(mainInput);
    }
}

function syncDetailIV(side, stat) {
    const mainId = `${side}Iv${stat.toUpperCase()}`;
    const detailId = `${side}DetailIv${stat.toUpperCase()}`;
    const mainInput = document.getElementById(mainId);
    const detailInput = document.getElementById(detailId);
    
    if (mainInput && detailInput) {
        detailInput.value = mainInput.value;
        updateDetailIVButton(detailInput);
    }
}

// ========================
// 3. ドロップダウン機能
// ========================

function initializeDropdownsWithNature() {
    // 既存のドロップダウン初期化
    setupPokemonDropdown('attackerPokemon', 'attacker');
    setupPokemonDropdown('defenderPokemon', 'defender');
    setupMoveDropdown();
    setupItemDropdown('attackerItem', 'attacker');
    setupItemDropdown('defenderItem', 'defender');
    setupNatureDropdowns();
}

// ポケモンドロップダウンの設定
function setupPokemonDropdown(inputId, side) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // ドロップダウン作成
    const dropdown = document.createElement('div');
    dropdown.className = 'pokemon-dropdown';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);
    
    // クリック時
    input.addEventListener('click', function(e) {
        e.stopPropagation();
        this.value = '';
        showPokemonList(dropdown, input, side);
    });
    
    // 入力時
    input.addEventListener('input', function() {
        filterPokemonList(this.value, dropdown, input, side);
    });

    // 入力完了時（フォーカスアウト、Enter）の処理を追加
    input.addEventListener('blur', function() {
        checkExactMatch(this.value, side);
    });
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkExactMatch(this.value, side);
            dropdown.style.display = 'none';
        }
    });
    
    // 外側クリックで閉じる
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function checkExactMatch(inputText, side) {
    if (!inputText) return;
    
    // カタカナ、ひらがな、ローマ字での完全一致を検索
    const exactMatch = allPokemonData.find(pokemon => {
        return pokemon.name === inputText ||
               pokemon.hiragana === inputText ||
               (pokemon.romaji && pokemon.romaji.toLowerCase() === inputText.toLowerCase());
    });
    
    if (exactMatch) {
        selectPokemon(side, exactMatch.name);
    }
}

// ポケモンリスト表示
function showPokemonList(dropdown, input, side) {
    dropdown.innerHTML = '';
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    // 最初の30件を表示
    const displayItems = allPokemonData;
    
    displayItems.forEach(pokemon => {
        const item = createDropdownItem(pokemon.name, () => {
            input.value = pokemon.name;
            dropdown.style.display = 'none';
            selectPokemon(side, pokemon.name);
        });
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

// ポケモンフィルタリング
function filterPokemonList(searchText, dropdown, input, side) {
    if (!searchText) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '';
    
    const search = searchText.toLowerCase();
    
    // カタカナ・ひらがな変換
    const toHiragana = (text) => {
        return text.replace(/[\u30A1-\u30F6]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    };
    
    const toKatakana = (text) => {
        return text.replace(/[\u3041-\u3096]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
    };
    
    const hiraganaSearch = toHiragana(search);
    const katakanaSearch = toKatakana(search);
    
    const filtered = allPokemonData.filter(pokemon => {
        const name = pokemon.name ? pokemon.name.toLowerCase() : '';
        const hiragana = pokemon.hiragana ? pokemon.hiragana.toLowerCase() : '';
        const romaji = pokemon.romaji ? pokemon.romaji.toLowerCase() : '';
        
        // 前方一致検索
        return name.startsWith(search) || 
               name.startsWith(hiraganaSearch) ||
               name.startsWith(katakanaSearch) ||
               hiragana.startsWith(search) ||
               hiragana.startsWith(hiraganaSearch) ||
               romaji.startsWith(search);
    });
    
    const displayItems = filtered;
    
    displayItems.forEach(pokemon => {
        const item = createDropdownItem(pokemon.name, () => {
            input.value = pokemon.name;
            dropdown.style.display = 'none';
            selectPokemon(side, pokemon.name);
        });
        dropdown.appendChild(item);
    });
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    dropdown.style.display = displayItems.length > 0 ? 'block' : 'none';
}

// 技ドロップダウンの設定
function setupMoveDropdown() {
    const input = document.getElementById('attackMove');
    if (!input) return;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'pokemon-dropdown';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);
    
    input.addEventListener('click', function(e) {
        e.stopPropagation();
        this.value = '';
        showMoveList(dropdown, input);
    });
    
    input.addEventListener('input', function() {
        filterMoveList(this.value, dropdown, input);
    });
    
    // 完全一致チェックを追加
    input.addEventListener('blur', function() {
        checkExactMoveMatch(this.value);
    });
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkExactMoveMatch(this.value);
            dropdown.style.display = 'none';
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// 技の完全一致チェック
function checkExactMoveMatch(inputText) {
    
    if (!inputText) {
        //console.log('空文字のため技をクリア');
        currentMove = null;
        // 全ての特殊設定を非表示に
        hideAllMoveSpecialSettings();
        return;
    }
    
    const exactMatch = moveData.find(move => {
        return move.name === inputText ||
               (move.hiragana && move.hiragana === inputText) ||
               (move.romaji && move.romaji.toLowerCase() === inputText.toLowerCase());
    });
    
    if (exactMatch) {
        //console.log(`一致する技が見つかりました: ${exactMatch.name}`);
        selectMove(exactMatch.name);
    } else {
        //console.log(`一致する技が見つかりません: "${inputText}"`);
        currentMove = null;
        hideAllMoveSpecialSettings();
    }
}

// 全ての技特殊設定を非表示にする
function hideAllMoveSpecialSettings() {
    const multiHitContainer = document.getElementById('multiHitContainer');
    const pinchUpContainer = document.querySelector('.pinchUpContainer');
    const pinchDownContainer = document.querySelector('.pinchDownContainer');
    const twofoldContainer = document.getElementById('twofoldContainer');
    const moveSpecialSettings = document.querySelectorAll('.move-special-setting');

    if (multiHitContainer) multiHitContainer.style.display = 'none';
    if (pinchUpContainer) pinchUpContainer.style.display = 'none';
    if (pinchDownContainer) pinchDownContainer.style.display = 'none';
    if (twofoldContainer) twofoldContainer.style.display = 'none';
    moveSpecialSettings.forEach(setting => {
        setting.style.display = 'none';
    });
}

// アイテムドロップダウンの設定を修正
function setupItemDropdown(inputId, side) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'pokemon-dropdown';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);
    
    input.addEventListener('click', function(e) {
        e.stopPropagation();
        this.value = '';
        showItemList(dropdown, input, side);
    });
    
    input.addEventListener('input', function() {
        filterItemList(this.value, dropdown, input, side);
    });
    
    // 完全一致チェックを追加
    input.addEventListener('blur', function() {
        checkExactItemMatch(this.value, side);
    });
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkExactItemMatch(this.value, side);
            dropdown.style.display = 'none';
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// アイテムの完全一致チェック
function checkExactItemMatch(inputText, side) {
    if (!inputText) {
        // 空の場合はアイテムをクリア
        selectItem(side, null);
        return;
    }
    
    const exactMatch = itemData.find(item => {
        return item.name === inputText ||
               (item.hiragana && item.hiragana === inputText) ||
               (item.romaji && item.romaji.toLowerCase() === inputText.toLowerCase());
    });
    
    if (exactMatch) {
        selectItem(side, exactMatch.name);
    } else {
        // 一致しない場合もアイテムをクリア
        selectItem(side, null);
    }
}

function selectMoveForTurn(moveName, turn) {
    const moveData_found = moveData.find(m => m.name === moveName);
    if (!moveData_found) return;
    
    // 複数ターン技の配列に保存
    multiTurnMoves[turn] = moveData_found;
    
    //console.log(`${turn + 1}ターン目に技を設定: ${moveName} (class: ${moveData_found.class})`);
    
    // HP入力欄の表示/非表示を制御
    const pinchUpContainer = document.querySelector('.pinchUpContainer');
    const pinchDownContainer = document.querySelector('.pinchDownContainer');
    
    // 一旦すべて非表示
    if (pinchUpContainer) pinchUpContainer.style.display = 'none';
    if (pinchDownContainer) pinchDownContainer.style.display = 'none';
    
    // 技のクラスに応じて表示
    switch (moveData_found.class) {
        case 'pinch_up':
            if (pinchUpContainer) {
                pinchUpContainer.style.display = 'flex';
                updatePinchHPValues(); // ★HP値を更新
                console.log('きしかいせい・じたばた用HP入力欄を表示');
            }
            break;
            
        case 'pinch_down':
            if (pinchDownContainer) {
                pinchDownContainer.style.display = 'flex';
                updatePinchHPValues(); // ★HP値を更新
                console.log('ふんか・しおふき用HP入力欄を表示');
            }
            break;
            
        default:
            //console.log(`通常技のため特殊HP入力欄は表示しません: ${moveData_found.class}`);
            break;
    }
}


function checkExactMoveMatchForTurn(inputText, turn, inputId) {
    // ★フラグチェック：ドロップダウンクリック直後は処理をスキップ
    const input = document.getElementById(inputId);
    if (input && input._preventBlur) {
        console.log(`${turn + 1}ターン目: ドロップダウンクリック後のためblurをスキップ`);
        return;
    }

    if (!inputText || inputText.trim() === '') {
        multiTurnMoves[turn] = null;
        hideAllMoveSpecialSettings(); // HP入力欄を非表示
        //console.log(`${turn + 1}ターン目の技をクリア`);
        return;
    }
    
    const exactMatch = moveData.find(move => move.name === inputText.trim());
    
    if (exactMatch) {
        console.log(`${turn + 1}ターン目に一致する技が見つかりました: ${exactMatch.name}`);
        multiTurnMoves[turn] = exactMatch;
        
        // ★重要：selectMoveForTurnを呼んでHP入力欄を表示
        selectMoveForTurn(exactMatch.name, turn);
    } else {
        //console.log(`${turn + 1}ターン目に一致する技が見つかりません: "${inputText}"`);
        multiTurnMoves[turn] = null;
        hideAllMoveSpecialSettings();
    }
}


// 現在選択されているポケモンが覚える技を取得
function getAvailableMovesForCurrentPokemon() {
    // 攻撃側のポケモンが選択されているかを確認
    if (!attackerPokemon.name) {
        // ポケモンが選択されていない場合は全ての技を返す
        return moveData;
    }
    
    // all_pokemon_dataから該当するポケモンを検索
    const pokemonInfo = allPokemonData.find(p => p.name === attackerPokemon.name);
    if (!pokemonInfo || !pokemonInfo.moves) {
        // ポケモンの情報が見つからない場合は全ての技を返す
        return moveData;
    }
    
    // そのポケモンが覚える技名のリストを取得
    const pokemonMoveNames = pokemonInfo.moves;
    
    // moveDataから該当する技のデータのみを抽出
    const availableMoves = pokemonMoveNames.map(moveName => {
        return moveData.find(move => move.name === moveName);
    }).filter(move => move !== undefined); // 見つからない技は除外
    
    return availableMoves;
}

// 技リスト表示
function showMoveList(dropdown, input) {
    dropdown.innerHTML = '';
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    // 現在選択されているポケモンの技のみを取得
    const availableMoves = getAvailableMovesForCurrentPokemon();
    const displayItems = availableMoves; // 制限なしで全て表示
    
    displayItems.forEach(move => {
        const item = createDropdownItem(move.name, () => {
            //console.log(`ドロップダウンから技選択: ${move.name}`);
            input.value = move.name;
            dropdown.style.display = 'none';
            selectMove(move.name);
        });
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

// 技フィルタリング
function filterMoveList(searchText, dropdown, input) {
    if (!searchText) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '';
    
    const search = searchText.toLowerCase();
    
    // カタカナ・ひらがな変換
    const toHiragana = (text) => {
        return text.replace(/[\u30A1-\u30F6]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    };
    
    const toKatakana = (text) => {
        return text.replace(/[\u3041-\u3096]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
    };
    
    const hiraganaSearch = toHiragana(search);
    const katakanaSearch = toKatakana(search);
    
    // 現在選択されているポケモンの技のみを取得してフィルタリング
    const availableMoves = getAvailableMovesForCurrentPokemon();
    const filtered = availableMoves.filter(move => {
        const name = move.name ? move.name.toLowerCase() : '';
        const hiragana = move.hiragana ? move.hiragana.toLowerCase() : '';
        const romaji = move.romaji ? move.romaji.toLowerCase() : '';
        
        // 前方一致検索
        return name.includes(search) || 
               name.includes(hiraganaSearch) ||
               name.includes(katakanaSearch) ||
               hiragana.includes(search) ||
               hiragana.includes(hiraganaSearch) ||
               romaji.includes(search);
    });
    
    const displayItems = filtered;
    
    displayItems.forEach(move => {
        const item = createDropdownItem(move.name, () => {
            input.value = move.name;
            dropdown.style.display = 'none';
            selectMove(move.name);
        });
        dropdown.appendChild(item);
    });
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    dropdown.style.display = displayItems.length > 0 ? 'block' : 'none';
}

// アイテムリスト表示
function showItemList(dropdown, input, side) {
    dropdown.innerHTML = '';
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    // サイドによってフィルタリング
    const filteredItems = itemData.filter(item => {
        if (side === 'attacker') {
            return item.timing === 'attackMod';
        } else {
            return item.timing !== 'attackMod';
        }
    });
    
    filteredItems.forEach(item => {
        const itemElement = createDropdownItem(item.name, () => {
            input.value = item.name;
            dropdown.style.display = 'none';
            selectItem(side, item.name);
        });
        dropdown.appendChild(itemElement);
    });
    
    dropdown.style.display = 'block';
}

// アイテムフィルタリング
function filterItemList(searchText, dropdown, input, side) {
    if (!searchText) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '';
    
    const search = searchText.toLowerCase();
    
    const toHiragana = (text) => {
        return text.replace(/[\u30A1-\u30F6]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    };
    
    const toKatakana = (text) => {
        return text.replace(/[\u3041-\u3096]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
    };
    
    const hiraganaSearch = toHiragana(search);
    const katakanaSearch = toKatakana(search);
    
    // サイドによってフィルタリング
    const filtered = itemData.filter(item => {
        // まずタイミングでフィルタ
        if (side === 'attacker' && item.timing !== 'attackMod') return false;
        if (side === 'defender' && item.timing === 'attackMod') return false;
        
        // 次に検索文字でフィルタ
        const name = item.name ? item.name.toLowerCase() : '';
        const hiragana = item.hiragana ? item.hiragana.toLowerCase() : '';
        const romaji = item.romaji ? item.romaji.toLowerCase() : '';
        
        return name.includes(search) || 
               name.includes(hiraganaSearch) ||
               name.includes(katakanaSearch) ||
               hiragana.includes(search) ||
               hiragana.includes(hiraganaSearch) ||
               romaji.includes(search);
    });
    
    filtered.forEach(item => {
        const itemElement = createDropdownItem(item.name, () => {
            input.value = item.name;
            dropdown.style.display = 'none';
            selectItem(side, item.name);
        });
        dropdown.appendChild(itemElement);
    });
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    dropdown.style.display = filtered.length > 0 ? 'block' : 'none';
}

// ドロップダウンアイテム作成
function createDropdownItem(text, onClick) {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.textContent = text;
    item.addEventListener('click', onClick);
    return item;
}

// ========================
// 性格選択のドロップダウン化システム
// ========================

/**
 * 性格ドロップダウンの設定（他のフィールドと同じ方式）
 */
function setupNatureDropdowns() {
    setupNatureDropdown('attackerNature', 'attacker');
    setupNatureDropdown('defenderNature', 'defender');
}

/**
 * 個別の性格ドロップダウンを設定
 */
function setupNatureDropdown(inputId, side) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // ドロップダウン作成
    const dropdown = document.createElement('div');
    dropdown.className = 'pokemon-dropdown nature-dropdown';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);
    
    // クリック時
    input.addEventListener('click', function(e) {
        e.stopPropagation();
        this.value = '';
        showNatureList(dropdown, input, side);
    });
    
    // 入力時
    input.addEventListener('input', function() {
        filterNatureList(this.value, dropdown, input, side);
    });

    // 入力完了時（フォーカスアウト、Enter）の処理
    input.addEventListener('blur', function() {
        checkExactNatureMatch(this.value, side);
    });
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkExactNatureMatch(this.value, side);
            dropdown.style.display = 'none';
        }
    });
    
    // 外側クリックで閉じる
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

/**
 * 性格リスト表示
 */
function showNatureList(dropdown, input, side) {
    dropdown.innerHTML = '';
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    // 性格データを取得（既存のnatureDataListを使用）
    const natures = getNatureDataForDropdown();
    
    natures.forEach(nature => {
        const item = createNatureDropdownItem(nature, side, () => {
            input.value = nature.displayName;
            dropdown.style.display = 'none';
            selectNatureFromDropdown(side, nature.name);
        });
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

/**
 * 性格フィルタリング
 */
function filterNatureList(searchText, dropdown, input, side) {
    if (!searchText) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '';
    
    const search = searchText.toLowerCase();
    const natures = getNatureDataForDropdown();
    
    // ひらがな・カタカナ変換
    const toHiragana = (text) => {
        return text.replace(/[\u30A1-\u30F6]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    };
    
    const toKatakana = (text) => {
        return text.replace(/[\u3041-\u3096]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
    };
    
    const hiraganaSearch = toHiragana(search);
    const katakanaSearch = toKatakana(search);
    
    const filtered = natures.filter(nature => {
        const name = nature.name.toLowerCase();
        const displayName = nature.displayName.toLowerCase();
        
        return name.includes(search) || 
               name.includes(hiraganaSearch) ||
               name.includes(katakanaSearch) ||
               displayName.includes(search) ||
               displayName.includes(hiraganaSearch) ||
               displayName.includes(katakanaSearch);
    });
    
    filtered.forEach(nature => {
        const item = createNatureDropdownItem(nature, side, () => {
            input.value = nature.displayName;
            dropdown.style.display = 'none';
            selectNatureFromDropdown(side, nature.name);
        });
        dropdown.appendChild(item);
    });
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    dropdown.style.display = filtered.length > 0 ? 'block' : 'none';
}

/**
 * 性格の完全一致チェック
 */
function checkExactNatureMatch(inputText, side) {
    if (!inputText) {
        // 空の場合は「まじめ」（補正なし）にリセット
        selectNatureFromDropdown(side, 'まじめ');
        return;
    }
    
    const natures = getNatureDataForDropdown();
    const exactMatch = natures.find(nature => 
        nature.name === inputText || nature.displayName === inputText
    );
    
    if (exactMatch) {
        selectNatureFromDropdown(side, exactMatch.name);
    } else {
        // 一致しない場合は「まじめ」にリセット
        selectNatureFromDropdown(side, 'まじめ');
        const input = document.getElementById(side === 'attacker' ? 'attackerNature' : 'defenderNature');
        if (input) {
            input.value = 'まじめ (無補正)';
        }
    }
}

/**
 * ドロップダウン表示用の性格データを取得
 */
function getNatureDataForDropdown() {
    const customOrder = getCustomNatureOrder();
    
    const natureList = natureDataList.map(nature => {
        let displayName = nature.name;
        
        // 補正情報を追加
        const modifiers = [];
        Object.keys(nature).forEach(stat => {
            if (stat !== 'name') {
                const value = nature[stat];
                if (value === 1.1) {
                    const statName = getStatDisplayName(stat);
                    modifiers.push(`${statName}↑`);  // 修正：A↑ 形式
                } else if (value === 0.9) {
                    const statName = getStatDisplayName(stat);
                    modifiers.push(`${statName}↓`);  // 修正：A↓ 形式
                }
            }
        });
        
        if (modifiers.length > 0) {
            displayName += ` (${modifiers.join(' ')})`;
        } else {
            displayName += ' (無補正)';
        }
        
        return {
            name: nature.name,
            displayName: displayName,
            data: nature
        };
    });
    
    // カスタム順序でソート
    return natureList.sort((a, b) => {
        const indexA = customOrder.indexOf(a.name);
        const indexB = customOrder.indexOf(b.name);
        
        // カスタム順序にない場合は最後に配置
        if (indexA === -1 && indexB === -1) {
            return a.name.localeCompare(b.name, 'ja');
        }
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
    });
}

/**
 * ステータス名の表示用変換
 */
function getStatDisplayName(stat) {
    const statNames = {
        'a': 'A',
        'b': 'B', 
        'c': 'C',
        'd': 'D',
        's': 'S'
    };
    return statNames[stat] || stat;
}

/**
 * 性格ドロップダウンアイテム作成
 */
function createNatureDropdownItem(nature, side, onClick) {
    const item = document.createElement('div');
    item.className = 'dropdown-item nature-dropdown-item';
    
    // メイン表示（性格名）
    const nameSpan = document.createElement('span');
    nameSpan.className = 'nature-name';
    nameSpan.textContent = nature.name;
    
    // 補正表示
    const modifierSpan = document.createElement('span');
    modifierSpan.className = 'nature-modifier';
    
    const modifiers = [];
    Object.keys(nature.data).forEach(stat => {
        if (stat !== 'name') {
            const value = nature.data[stat];
            if (value === 1.1) {
                modifiers.push(`${getStatDisplayName(stat)}↑`);
            } else if (value === 0.9) {
                modifiers.push(`${getStatDisplayName(stat)}↓`);
            }
        }
    });
    
    modifierSpan.textContent = modifiers.length > 0 ? `(${modifiers.join(' ')})` : '(無補正)';
    
    item.appendChild(nameSpan);
    item.appendChild(modifierSpan);
    item.addEventListener('click', onClick);
    
    return item;
}

function getCustomNatureOrder() {
    return [
        'いじっぱり', 'わんぱく', 'しんちょう', 'ようき',
        'ひかえめ', 'ずぶとい', 'おだやか', 'おくびょう',
        'ゆうかん', 'れいせい', 'のんき', 'なまいき',
        'やんちゃ', 'のうてんき', 'うっかりや', 'むじゃき',
        'さみしがり', 'おっとり', 'おとなしい', 'せっかち',
        'まじめ', 'てれや', 'がんばりや', 'すなお', 'きまぐれ'
    ];
}

/**
 * ドロップダウンから性格選択
 */
function selectNatureFromDropdown(side, natureName) {
    const inputId = side === 'attacker' ? 'attackerNature' : 'defenderNature';
    const input = document.getElementById(inputId);
    
    // 既存の性格選択ロジックを使用
    if (input) {
        input.value = natureName;
    }
    
    selectNature(side);
    
    // 入力欄の表示を更新（表示名に変更）
    const natures = getNatureDataForDropdown();
    const selectedNature = natures.find(nature => nature.name === natureName);
    if (selectedNature && input) {
        input.value = selectedNature.displayName;
    }
}

/**
 * 性格復元時の処理（復元機能用）
 */
function restoreNatureSelectionFromValue(side, natureName) {
    if (!natureName) return;
    
    const natures = getNatureDataForDropdown();
    const nature = natures.find(n => n.name === natureName || n.displayName === natureName);
    
    if (nature) {
        selectNatureFromDropdown(side, nature.name);
    }
}

// ========================
// 4. 選択処理
// ========================

function updateAbilitySelect(side, abilities) {
    const select = document.getElementById(`${side}Ability`);
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    if (!select) return;

    const abilityList = [...new Set(
        (Array.isArray(abilities) ? abilities : [abilities]).filter(Boolean)
    )];
    select.replaceChildren(new Option('なし', ''));
    for (const ability of abilityList) {
        select.add(new Option(ability, ability));
    }
    select.value = abilityList[0] || '';
    target.ability = select.value;
}

// ポケモン選択
function selectPokemon(side, pokemonName) {  
    // ポケモン名が空の場合の処理
    if (!pokemonName) {
        const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
        
        // ポケモンデータをリセット
        target.name = "";
        target.baseStats = { hp: 0, a: 0, b: 0, c: 0, d: 0, s: 0 };
        target.types = [];
        target.ability = "";
        target.canEvolve = false;
        updateAbilitySelect(side, []);
        
        // 特性チェックボックスを非表示
        if (side === 'attacker') {
            hideAllAbilityCheckboxes(side);
        }
        
        // 入力制限をクリア
        clearRealStatInputLimits(side);
        
        updateStats(side);
        return;
    }
    
    const pokemon = allPokemonData.find(p => p.name === pokemonName);
    if (!pokemon) return;
    
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    
    target.name = pokemon.name;
    target.canEvolve = Boolean(pokemon.can_evolve);
    target.baseStats = {
        hp: pokemon.basestats[0],
        a: pokemon.basestats[1],
        b: pokemon.basestats[2],
        c: pokemon.basestats[3],
        d: pokemon.basestats[4],
        s: pokemon.basestats[5]
    };

    // ポワルンの場合は天候に応じてタイプを設定、それ以外は通常のタイプ
    if (pokemonName === 'ポワルン') {
        target.types = getCastformTypeByWeather();
    } else {
        target.types = Array.isArray(pokemon.type) ? pokemon.type : [pokemon.type];
    }
    
    updateStats(side);

    // ポケモンデータから特性を確認
    const pokemonInfo = allPokemonData.find(p => p.name === pokemonName);
    if (pokemonInfo && pokemonInfo.ability) {
        updateAbilitySelect(side, pokemonInfo.ability);
        if (side === 'attacker') {
            updateAbilityCheckboxes(side, pokemonInfo.ability);
        } else {
            updateDefenderAbilityCheckboxes(pokemonInfo.ability);
        }
    } else {
        updateAbilitySelect(side, []);
        if (side === 'attacker') {
            hideAllAbilityCheckboxes(side);
        } else {
            hideAllDefenderAbilityCheckboxes();
        }
    }
    updateAllRealStatInputLimits(side);
}

// ポケモン情報を入れ替える関数
function swapPokemon() {
    // 一時的に攻撃側の情報を保存
    const tempPokemon = JSON.parse(JSON.stringify(attackerPokemon));
    
    // 入力欄の値を保存
    const tempInputs = {
        name: document.getElementById('attackerPokemon').value,
        level: document.getElementById('attackerLevel').value,
        nature: document.getElementById('attackerNature').value,
        item: document.getElementById('attackerItem').value,
        // 詳細設定の値も保存
        detailIvs: {},
        detailEvs: {},
        detailReals: {}
    };
    
    // 詳細設定の値を保存
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const ivInput = document.getElementById(`attackerDetailIv${stat.toUpperCase()}`);
        const evInput = document.getElementById(`attackerDetailEv${stat.toUpperCase()}`);
        const realInput = document.getElementById(`attackerDetailReal${stat.toUpperCase()}`);
        if (ivInput) tempInputs.detailIvs[stat] = ivInput.value;
        if (evInput) tempInputs.detailEvs[stat] = evInput.value;
        if (realInput) tempInputs.detailReals[stat] = realInput.value;
    });
    
    // 防御側の値を攻撃側に設定
    attackerPokemon = JSON.parse(JSON.stringify(defenderPokemon));
    document.getElementById('attackerPokemon').value = document.getElementById('defenderPokemon').value;
    document.getElementById('attackerLevel').value = document.getElementById('defenderLevel').value;
    document.getElementById('attackerNature').value = document.getElementById('defenderNature').value;
    document.getElementById('attackerItem').value = document.getElementById('defenderItem').value;
    
    // 防御側に一時保存した値を設定
    defenderPokemon = tempPokemon;
    document.getElementById('defenderPokemon').value = tempInputs.name;
    document.getElementById('defenderLevel').value = tempInputs.level;
    document.getElementById('defenderNature').value = tempInputs.nature;
    document.getElementById('defenderItem').value = tempInputs.item;
    syncLevelPreset('attacker', document.getElementById('attackerLevel').value);
    syncLevelPreset('defender', document.getElementById('defenderLevel').value);
    
    // ★修正：詳細設定の値を入れ替え
    swapDetailSettings(tempInputs);
    
    // ★修正：詳細設定から取得してレベル下の個体値・努力値を設定
    setMainStatsFromDetail();
    
    // ★修正：実数値の入れ替え
    swapRealStats(tempInputs);
    
    // ★修正：性格補正ボタンとチェックボックスの状態を正しく設定
    resetNatureUIAfterSwap();
    
    // ボタンの表示を更新
    updateAllButtons();
    
    // 特性の表示を更新
    updateAbilitiesAfterSwap();
    
    // ステータスを更新
    updateStats('attacker');
    updateStats('defender');
}
// 詳細設定の値を入れ替える関数
function swapDetailSettings(tempInputs) {
    // 攻撃側詳細設定に防御側の値を設定
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const defenderIvInput = document.getElementById(`defenderDetailIv${stat.toUpperCase()}`);
        const defenderEvInput = document.getElementById(`defenderDetailEv${stat.toUpperCase()}`);
        const attackerIvInput = document.getElementById(`attackerDetailIv${stat.toUpperCase()}`);
        const attackerEvInput = document.getElementById(`attackerDetailEv${stat.toUpperCase()}`);
        
        if (defenderIvInput && attackerIvInput) {
            attackerIvInput.value = defenderIvInput.value;
        }
        if (defenderEvInput && attackerEvInput) {
            attackerEvInput.value = defenderEvInput.value;
        }
    });
    
    // 防御側詳細設定に攻撃側の値を設定
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const defenderIvInput = document.getElementById(`defenderDetailIv${stat.toUpperCase()}`);
        const defenderEvInput = document.getElementById(`defenderDetailEv${stat.toUpperCase()}`);
        
        if (defenderIvInput && tempInputs.detailIvs[stat] !== undefined) {
            defenderIvInput.value = tempInputs.detailIvs[stat];
        }
        if (defenderEvInput && tempInputs.detailEvs[stat] !== undefined) {
            defenderEvInput.value = tempInputs.detailEvs[stat];
        }
    });
}
// 実数値の入れ替える関数
function swapRealStats(tempInputs) {
    // まず詳細設定の実数値を入れ替え
    // 攻撃側詳細設定に防御側の値を設定
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const defenderDetailReal = document.getElementById(`defenderDetailReal${stat.toUpperCase()}`);
        const attackerDetailReal = document.getElementById(`attackerDetailReal${stat.toUpperCase()}`);
        
        if (defenderDetailReal && attackerDetailReal) {
            const tempValue = defenderDetailReal.value;
            if (attackerDetailReal.updateValueSilently) {
                attackerDetailReal.updateValueSilently(tempValue);
            } else {
                attackerDetailReal.value = tempValue;
            }
        }
    });
    
    // 防御側詳細設定に攻撃側の値を設定
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const defenderDetailReal = document.getElementById(`defenderDetailReal${stat.toUpperCase()}`);
        
        if (defenderDetailReal && tempInputs.detailReals[stat]) {
            if (defenderDetailReal.updateValueSilently) {
                defenderDetailReal.updateValueSilently(tempInputs.detailReals[stat]);
            } else {
                defenderDetailReal.value = tempInputs.detailReals[stat];
            }
        }
    });
    
    // 入れ替え完了後、詳細設定の実数値をメイン表示に代入
    // 攻撃側：詳細設定のA,Cをメイン表示のA,Cに代入
    const attackerDetailRealA = document.getElementById('attackerDetailRealA');
    const attackerDetailRealC = document.getElementById('attackerDetailRealC');
    const attackerRealA = document.getElementById('attackerRealA');
    const attackerRealC = document.getElementById('attackerRealC');
    
    if (attackerDetailRealA && attackerRealA) {
        const valueA = attackerDetailRealA.value;
        if (attackerRealA.updateValueSilently) {
            attackerRealA.updateValueSilently(valueA);
        } else {
            attackerRealA.value = valueA;
        }
    }
    
    if (attackerDetailRealC && attackerRealC) {
        const valueC = attackerDetailRealC.value;
        if (attackerRealC.updateValueSilently) {
            attackerRealC.updateValueSilently(valueC);
        } else {
            attackerRealC.value = valueC;
        }
    }
    
    // 防御側：詳細設定のHP,B,Dをメイン表示のHP,B,Dに代入
    const defenderDetailRealHP = document.getElementById('defenderDetailRealHP');
    const defenderDetailRealB = document.getElementById('defenderDetailRealB');
    const defenderDetailRealD = document.getElementById('defenderDetailRealD');
    const defenderRealHP = document.getElementById('defenderRealHP');
    const defenderRealB = document.getElementById('defenderRealB');
    const defenderRealD = document.getElementById('defenderRealD');
    
    if (defenderDetailRealHP && defenderRealHP) {
        const valueHP = defenderDetailRealHP.value;
        if (defenderRealHP.updateValueSilently) {
            defenderRealHP.updateValueSilently(valueHP);
        } else {
            defenderRealHP.value = valueHP;
        }
    }
    
    if (defenderDetailRealB && defenderRealB) {
        const valueB = defenderDetailRealB.value;
        if (defenderRealB.updateValueSilently) {
            defenderRealB.updateValueSilently(valueB);
        } else {
            defenderRealB.value = valueB;
        }
    }
    
    if (defenderDetailRealD && defenderRealD) {
        const valueD = defenderDetailRealD.value;
        if (defenderRealD.updateValueSilently) {
            defenderRealD.updateValueSilently(valueD);
        } else {
            defenderRealD.value = valueD;
        }
    }
}

// 性格UI（ボタンとチェックボックス）をリセットして正しく設定する関数
function resetNatureUIAfterSwap() {
    // 攻撃側の性格補正を取得して設定
    const attackerNature = document.getElementById('attackerNature').value;
    const attackerNatureData = natureData.find(n => n.name === attackerNature);
    
    if (attackerNatureData) {
        // 攻撃側のnatureModifiersを更新
        attackerPokemon.natureModifiers = { a: 1.0, b: 1.0, c: 1.0, d: 1.0, s: 1.0 };
        Object.keys(attackerNatureData).forEach(stat => {
            if (stat !== 'name' && attackerPokemon.natureModifiers[stat] !== undefined) {
                attackerPokemon.natureModifiers[stat] = attackerNatureData[stat];
            }
        });
        
        // 攻撃側のメイン性格ボタンを更新
        updateMainNatureButtons('attacker', 'a', attackerPokemon.natureModifiers.a);
        updateMainNatureButtons('attacker', 'c', attackerPokemon.natureModifiers.c);
        
        // 攻撃側の詳細チェックボックスを更新
        updateDetailNatureCheckboxes('attacker', attackerPokemon.natureModifiers);
    }
    
    // 防御側の性格補正を取得して設定
    const defenderNature = document.getElementById('defenderNature').value;
    const defenderNatureData = natureData.find(n => n.name === defenderNature);
    
    if (defenderNatureData) {
        // 防御側のnatureModifiersを更新
        defenderPokemon.natureModifiers = { a: 1.0, b: 1.0, c: 1.0, d: 1.0, s: 1.0 };
        Object.keys(defenderNatureData).forEach(stat => {
            if (stat !== 'name' && defenderPokemon.natureModifiers[stat] !== undefined) {
                defenderPokemon.natureModifiers[stat] = defenderNatureData[stat];
            }
        });
        
        // 防御側のメイン性格ボタンを更新
        updateMainNatureButtons('defender', 'b', defenderPokemon.natureModifiers.b);
        updateMainNatureButtons('defender', 'd', defenderPokemon.natureModifiers.d);
        
        // 防御側の詳細チェックボックスを更新
        updateDetailNatureCheckboxes('defender', defenderPokemon.natureModifiers);
    }
}

// 詳細設定の性格チェックボックスを更新する関数
function updateDetailNatureCheckboxes(side, natureModifiers) {
    // すべてのチェックボックスをクリア
    const checkboxes = document.querySelectorAll(`.nature-plus-checkbox[data-side="${side}"], .nature-minus-checkbox[data-side="${side}"]`);
    checkboxes.forEach(cb => cb.checked = false);
    
    // 現在の性格補正に基づいてチェック
    ['a', 'b', 'c', 'd', 's'].forEach(stat => {
        if (natureModifiers[stat] === 1.1) {
            const plusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Plus`);
            if (plusCheckbox) plusCheckbox.checked = true;
        } else if (natureModifiers[stat] === 0.9) {
            const minusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Minus`);
            if (minusCheckbox) minusCheckbox.checked = true;
        }
    });
}

// 詳細設定からメインの個体値・努力値を設定する関数
function setMainStatsFromDetail() {
    // 攻撃側：詳細設定A,Cをメイン表示A,Cに設定
    const attackerDetailIvA = document.getElementById('attackerDetailIvA');
    const attackerDetailIvC = document.getElementById('attackerDetailIvC');
    const attackerDetailEvA = document.getElementById('attackerDetailEvA');
    const attackerDetailEvC = document.getElementById('attackerDetailEvC');
    
    const attackerIvA = document.getElementById('attackerIvA');
    const attackerIvC = document.getElementById('attackerIvC');
    const attackerEvA = document.getElementById('attackerEvA');
    const attackerEvC = document.getElementById('attackerEvC');
    
    if (attackerDetailIvA && attackerIvA) {
        attackerIvA.value = attackerDetailIvA.value;
        updateIVButton(attackerIvA);
    }
    if (attackerDetailIvC && attackerIvC) {
        attackerIvC.value = attackerDetailIvC.value;
        updateIVButton(attackerIvC);
    }
    if (attackerDetailEvA && attackerEvA) {
        attackerEvA.value = attackerDetailEvA.value;
        updateEVButton(attackerEvA);
    }
    if (attackerDetailEvC && attackerEvC) {
        attackerEvC.value = attackerDetailEvC.value;
        updateEVButton(attackerEvC);
    }
    
    // 防御側：詳細設定HP,B,Dをメイン表示HP,B,Dに設定
    const defenderDetailIvHP = document.getElementById('defenderDetailIvHP');
    const defenderDetailIvB = document.getElementById('defenderDetailIvB');
    const defenderDetailIvD = document.getElementById('defenderDetailIvD');
    const defenderDetailEvHP = document.getElementById('defenderDetailEvHP');
    const defenderDetailEvB = document.getElementById('defenderDetailEvB');
    const defenderDetailEvD = document.getElementById('defenderDetailEvD');
    
    const defenderIvHP = document.getElementById('defenderIvHP');
    const defenderIvB = document.getElementById('defenderIvB');
    const defenderIvD = document.getElementById('defenderIvD');
    const defenderEvHP = document.getElementById('defenderEvHP');
    const defenderEvB = document.getElementById('defenderEvB');
    const defenderEvD = document.getElementById('defenderEvD');
    
    if (defenderDetailIvHP && defenderIvHP) {
        defenderIvHP.value = defenderDetailIvHP.value;
        updateIVButton(defenderIvHP);
    }
    if (defenderDetailIvB && defenderIvB) {
        defenderIvB.value = defenderDetailIvB.value;
        updateIVButton(defenderIvB);
    }
    if (defenderDetailIvD && defenderIvD) {
        defenderIvD.value = defenderDetailIvD.value;
        updateIVButton(defenderIvD);
    }
    if (defenderDetailEvHP && defenderEvHP) {
        defenderEvHP.value = defenderDetailEvHP.value;
        updateEVButton(defenderEvHP);
    }
    if (defenderDetailEvB && defenderEvB) {
        defenderEvB.value = defenderDetailEvB.value;
        updateEVButton(defenderEvB);
    }
    if (defenderDetailEvD && defenderEvD) {
        defenderEvD.value = defenderDetailEvD.value;
        updateEVButton(defenderEvD);
    }
}

// 特性表示を更新する関数
function updateAbilitiesAfterSwap() {
    if (attackerPokemon.name) {
        const attackerInfo = allPokemonData.find(p => p.name === attackerPokemon.name);
        if (attackerInfo && attackerInfo.ability) {
            updateAbilityCheckboxes('attacker', attackerInfo.ability);
        } else {
            hideAllAbilityCheckboxes('attacker');
        }
    } else {
        hideAllAbilityCheckboxes('attacker');
    }
    
    if (defenderPokemon.name) {
        const defenderInfo = allPokemonData.find(p => p.name === defenderPokemon.name);
        if (defenderInfo && defenderInfo.ability) {
            updateDefenderAbilityCheckboxes(defenderInfo.ability);
        } else {
            hideAllDefenderAbilityCheckboxes();
        }
    } else {
        hideAllDefenderAbilityCheckboxes();
    }
}
// ウェザーボールのタイプと分類を取得する
function getWeatherBallTypeAndCategory() {
    const weather = document.getElementById('weatherSelect').value;
    switch (weather) {
        case 'sunny':
            return { type: 'ほのお', category: 'Special' };
        case 'rain':
            return { type: 'みず', category: 'Special' };
        case 'sandstorm':
            return { type: 'いわ', category: 'Physical' };
        case 'hail':
            return { type: 'こおり', category: 'Special' };
        default:
            return { type: 'ノーマル', category: 'Special' }; // 天候なしの場合
    }
}
// 天候変更時にウェザーボールを更新する
function updateWeatherBallIfNeeded() {
    // 現在選択されている技がウェザーボールの場合
    if (currentMove && currentMove.class === 'weather_ball') {
        const weatherData = getWeatherBallTypeAndCategory();
        currentMove.type = weatherData.type;
        currentMove.category = weatherData.category;
    }
    
    // 複数ターン技でウェザーボールがある場合
    for (let i = 0; i < multiTurnMoves.length; i++) {
        if (multiTurnMoves[i] && multiTurnMoves[i].class === 'weather_ball') {
            const weatherData = getWeatherBallTypeAndCategory();
            multiTurnMoves[i].type = weatherData.type;
            multiTurnMoves[i].category = weatherData.category;
        }
    }
}
// ポワルンの天候による形態変化を取得する
function getCastformTypeByWeather() {
    const weather = document.getElementById('weatherSelect').value;
    
    switch (weather) {
        case 'sunny':
            return ['ほのお'];
        case 'rain':
            return ['みず'];
        case 'sandstorm':
            return ['いわ'];
        case 'hail':
            return ['こおり'];
        default:
            return ['ノーマル']; // 天候なしの場合
    }
}

// ポワルンのタイプを更新する
function updateCastformTypeIfNeeded() {
    // 攻撃側がポワルンの場合
    if (attackerPokemon.name === 'ポワルン') {
        attackerPokemon.types = getCastformTypeByWeather();
        console.log('攻撃側ポワルンのタイプを更新:', attackerPokemon.types);
    }
    
    // 防御側がポワルンの場合
    if (defenderPokemon.name === 'ポワルン') {
        defenderPokemon.types = getCastformTypeByWeather();
        console.log('防御側ポワルンのタイプを更新:', defenderPokemon.types);
    }
}

// 技選択
function selectMove(moveName) {
    
    // めざめるパワーの場合、タイプと分類を動的に更新
    if (currentMove && currentMove.class === 'awaken_power') {
        const newType = calculateHiddenPowerType();
        currentMove.type = newType;
        currentMove.category = getGen3CategoryByType(newType);
    }
    // ウェザーボールの場合、天候に応じてタイプと分類を更新
    if (currentMove && currentMove.class === 'weather_ball') {
        const weatherData = getWeatherBallTypeAndCategory();
        currentMove.type = weatherData.type;
        currentMove.category = weatherData.category;
    }
    
    // 全ての特殊設定を一旦非表示に
    const multiHitContainer = document.getElementById('multiHitContainer');
    const pinchUpContainer = document.querySelector('.pinchUpContainer');
    const pinchDownContainer = document.querySelector('.pinchDownContainer');
    const twofoldContainer = document.getElementById('twofoldContainer');
    const moveSpecialSettings = document.querySelectorAll('.move-special-setting');

    if (multiHitContainer) multiHitContainer.style.display = 'none';
    if (pinchUpContainer) pinchUpContainer.style.display = 'none';
    if (pinchDownContainer) pinchDownContainer.style.display = 'none';
    if (twofoldContainer) twofoldContainer.style.display = 'none';
    moveSpecialSettings.forEach(setting => {
        setting.style.display = 'none';
    });
    
    currentMove = moveData.find(m => m.name === moveName);
    updateMoveDescription(currentMove);
    if (!currentMove) return;

    // 技のクラスに応じて表示
    switch (currentMove.class) {
        case 'two_hit':
            // リストは表示しない（固定2回なので）
            break;
            
        case 'three_hit':
            // リストは表示しない（固定3回なので）
            break;
            
        case 'multi_hit':
            if (multiHitContainer) {
                multiHitContainer.style.display = 'block';
            }
            break;
            
        case 'pinch_up':
            if (pinchUpContainer) {
                pinchUpContainer.style.display = 'flex';
                updatePinchHPValues();
            }
            break;
            
        case 'pinch_down':
            if (pinchDownContainer) {
                pinchDownContainer.style.display = 'flex';
                updatePinchHPValues();
            }
            break;
            
        case 'two_fold':
            if (twofoldContainer) {
                twofoldContainer.style.display = 'flex';
            }
            break;

        case 'ice_ball':
            document.getElementById('iceBallSettings').style.display = 'flex';
            break;

        case 'rage':
            document.getElementById('rageSettings').style.display = 'flex';
            break;

        case 'spit_up':
            document.getElementById('spitUpSettings').style.display = 'flex';
            break;

        case 'fury_cutter':
            document.getElementById('furyCutterSettings').style.display = 'flex';
            break;

        case 'present':
            document.getElementById('presentSettings').style.display = 'flex';
            break;

        case 'triple_kick':
            document.getElementById('tripleKickSettings').style.display = 'flex';
            break;

        case 'beat_up':
            document.getElementById('beatUpSettings').style.display = 'flex';
            break;
    }
}

function updateMoveDescription(move) {
    const summary = document.getElementById('moveSummary');
    const description = document.getElementById('moveDescriptionText');
    if (!summary || !description) return;
    if (!move) {
        summary.textContent = '技情報';
        description.textContent = '-';
        return;
    }
    const details = KatinukiDamageCore.formatMoveDetails(move);
    summary.textContent = details.summary;
    description.textContent = details.description || '-';
}

async function changeEdition() {
    const edition = document.getElementById('editionSelect')?.value || 'procyon';
    const pokemonFile = edition === 'deneb'
        ? 'all_pokemon_data_deneb.json'
        : 'all_pokemon_data.json';
    try {
        const response = await fetch(pokemonFile);
        allPokemonData = await response.json();
        for (const side of ['attacker', 'defender']) {
            const input = document.getElementById(`${side}Pokemon`);
            if (input) input.value = '';
            selectPokemon(side, '');
        }
    } catch (error) {
        console.error('作品データの切替エラー:', error);
    }
}

// 連続技の表示情報を取得する関数
function getMultiHitDisplayInfo(minDamage, maxDamage, totalHP, currentMove) {
    if (!currentMove || currentMove.class !== 'multi_hit') {
        return {
            displayMinDamage: minDamage,
            displayMaxDamage: maxDamage,
            moveDisplayText: ''
        };
    }
    
    const hitCountSelect = document.getElementById('multiHitCount');
    const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';
    const constantDamage = calculateTotalConstantDamage(totalHP, defenderPokemon.types, 1);
    const movePower = calculatePower(currentMove);
    const accuracyText = currentMove.accuracy < 100 ? `, 命中${currentMove.accuracy}` : '';
    
    let displayMinDamage, displayMaxDamage, moveDisplayText;
    
    if (selectedHitCount === '2-5') {
        // 2-5回の場合
        displayMinDamage = minDamage * 2 + constantDamage;
        displayMaxDamage = maxDamage * 5 + constantDamage;
        moveDisplayText = `${currentMove.name} (威力${movePower}×2-5発, ${currentMove.type}, ${currentMove.category === 'Physical' ? '物理' : '特殊'}${accuracyText})`;
        console.log(`連続技表示: 2-5回, ダメージ範囲 ${displayMinDamage}~${displayMaxDamage}`);
    } else {
        // 固定回数の場合（2, 3, 4, 5）
        const hitCount = parseInt(selectedHitCount);
        displayMinDamage = minDamage * hitCount + constantDamage;
        displayMaxDamage = maxDamage * hitCount + constantDamage;
        moveDisplayText = `${currentMove.name} (威力${movePower}×${hitCount}発, ${currentMove.type}, ${currentMove.category === 'Physical' ? '物理' : '特殊'}${accuracyText})`;
        console.log(`連続技表示: ${hitCount}回, ダメージ範囲 ${displayMinDamage}~${displayMaxDamage}`);
    }
    
    return {
        displayMinDamage,
        displayMaxDamage,
        moveDisplayText
    };
}

// 3回攻撃技の乱数計算
function calculateThreeHitRandText(minDamage, maxDamage, targetHP, isSubstitute) {
    console.log(`3回攻撃技乱数計算開始: ${currentMove.name}`);
    console.log(`ダメージ ${minDamage}~${maxDamage}, 対象HP ${targetHP}`);
    
    // 3回攻撃技の総ダメージ（既に3倍されている前提）
    const totalMinDamage = minDamage;
    const totalMaxDamage = maxDamage;
    
    console.log(`3回攻撃技の総ダメージ: ${totalMinDamage}~${totalMaxDamage}`);
    
    // 定数ダメージを加算
    const constantDamage = calculateTotalConstantDamage(defenderPokemon.baseStats?.hp || targetHP, defenderPokemon.types, 1);
    const effectiveMinDamage = totalMinDamage + constantDamage;
    const effectiveMaxDamage = totalMaxDamage + constantDamage;
    
    console.log(`定数ダメージ込み: ${effectiveMinDamage}~${effectiveMaxDamage}`);
    
    // 確定1発判定
    if (effectiveMinDamage >= targetHP) {
        return {
            hits: 1,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isThreeHit: true,
            hitCount: 3
        };
    }
    
    // 乱数1発判定
    if (effectiveMaxDamage >= targetHP) {
        // 成功する乱数パターンを計算
        const damageRange = effectiveMaxDamage - effectiveMinDamage + 1;
        const successfulRange = effectiveMaxDamage - Math.max(effectiveMinDamage, targetHP) + 1;
        const successRate = (successfulRange / damageRange) * 100;
        
        let randLevel = "";
        if (successRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (successRate >= 75.0) {
            randLevel = "高乱数";
        } else if (successRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (successRate >= 50.0) {
            randLevel = "中乱数";
        } else if (successRate >= 37.5) {
            randLevel = "中低乱数";
        } else if (successRate >= 25.0) {
            randLevel = "低乱数";
        } else if (successRate >= 6.25) {
            randLevel = "超低乱数";
        } else {
            randLevel = "最低乱数";
        }
        
        return {
            hits: 1,
            percent: parseFloat(successRate.toFixed(1)),
            randLevel: randLevel,
            effectiveMinDamage: effectiveMinDamage * 3,
            effectiveMaxDamage: effectiveMaxDamage * 3,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isThreeHit: true,
            hitCount: 3
        };
    }
    
    // 2発で倒せるかチェック
    if (effectiveMaxDamage * 2 >= targetHP) {
        // 2発目で倒す確率を計算
        const twoHitMinTotal = effectiveMinDamage * 2;
        const twoHitMaxTotal = effectiveMaxDamage * 2;
        const damageRange = twoHitMaxTotal - twoHitMinTotal + 1;
        const successfulRange = twoHitMaxTotal - Math.max(twoHitMinTotal, targetHP) + 1;
        const successRate = (successfulRange / damageRange) * 100;
        
        let randLevel = "";
        if (successRate >= 100.0) {
            randLevel = "確定";
        } else if (successRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (successRate >= 75.0) {
            randLevel = "高乱数";
        } else if (successRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (successRate >= 50.0) {
            randLevel = "中乱数";
        } else if (successRate >= 37.5) {
            randLevel = "中低乱数";
        } else if (successRate >= 25.0) {
            randLevel = "低乱数";
        } else if (successRate >= 6.25) {
            randLevel = "超低乱数";
        } else {
            randLevel = "最低乱数";
        }
        
        return {
            hits: 2,
            percent: successRate >= 100.0 ? null : parseFloat(successRate.toFixed(1)),
            randLevel: randLevel,
            effectiveMinDamage: twoHitMinTotal,
            effectiveMaxDamage: twoHitMaxTotal,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isThreeHit: true,
            hitCount: 3
        };
    }
    
    // 3発以上必要な場合
    const hitsNeeded = Math.ceil(targetHP / effectiveMaxDamage);
    return {
        hits: hitsNeeded,
        percent: null,
        randLevel: hitsNeeded + "発",
        effectiveMinDamage: effectiveMinDamage,
        effectiveMaxDamage: effectiveMaxDamage,
        isSubstitute: isSubstitute,
        targetHP: targetHP,
        isThreeHit: true,
        hitCount: 3
    };
}

// 2回攻撃技の乱数計算
function calculateTwoHitRandText(minDamage, maxDamage, targetHP, isSubstitute) {
    console.log(`2回攻撃技乱数計算開始: ${currentMove.name}`);
    console.log(`ダメージ ${minDamage}~${maxDamage}, 対象HP ${targetHP}`);
    
    // 2回攻撃技の総ダメージ（既に2倍されている前提）
    const totalMinDamage = minDamage;
    const totalMaxDamage = maxDamage;
    
    console.log(`2回攻撃技の総ダメージ: ${totalMinDamage}~${totalMaxDamage}`);
    
    // 定数ダメージを加算
    const constantDamage = calculateTotalConstantDamage(defenderPokemon.baseStats?.hp || targetHP, defenderPokemon.types, 1);
    const effectiveMinDamage = totalMinDamage + constantDamage;
    const effectiveMaxDamage = totalMaxDamage + constantDamage;
    
    console.log(`定数ダメージ込み: ${effectiveMinDamage}~${effectiveMaxDamage}`);
    
    // 確定1発判定
    if (effectiveMinDamage >= targetHP) {
        return {
            hits: 1,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isTwoHit: true,
            hitCount: 2
        };
    }
    
    // 乱数1発判定
    if (effectiveMaxDamage >= targetHP) {
        // 成功する乱数パターンを計算
        const damageRange = effectiveMaxDamage - effectiveMinDamage + 1;
        const successfulRange = effectiveMaxDamage - Math.max(effectiveMinDamage, targetHP) + 1;
        const successRate = (successfulRange / damageRange) * 100;
        
        let randLevel = "";
        if (successRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (successRate >= 75.0) {
            randLevel = "高乱数";
        } else if (successRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (successRate >= 37.5) {
            randLevel = "中乱数";
        } else if (successRate >= 25.0) {
            randLevel = "中低乱数";
        } else if (successRate > 6.3) {
            randLevel = "低乱数";
        } else {
            randLevel = "超低乱数";
        }
        
        return {
            hits: 1,
            percent: successRate.toFixed(1),
            randLevel: randLevel,
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isTwoHit: true,
            hitCount: 2
        };
    }
    
    // 2発確定の場合
    const requiredHits = Math.ceil(targetHP / effectiveMinDamage);
    return {
        hits: requiredHits,
        percent: null,
        randLevel: "確定",
        effectiveMinDamage: effectiveMinDamage,
        effectiveMaxDamage: effectiveMaxDamage,
        isSubstitute: isSubstitute,
        targetHP: targetHP,
        isTwoHit: true,
        hitCount: 2
    };
}


// 複数ターン技の選択
function selectMultiTurnMove(turn, moveName) {
    
    if (!moveName || moveName.trim() === '') {
        // 空の場合はnullを設定
        multiTurnMoves[turn] = null;
        return;
    }
    
    const move = moveData.find(m => m.name === moveName);
    if (move) {
        multiTurnMoves[turn] = move;
        
        // めざめるパワーの場合、タイプと分類を動的に更新
        if (move && move.class === 'awaken_power') {
            const newType = calculateHiddenPowerType();
            multiTurnMoves[turn] = { 
                ...move, 
                type: newType,
                category: getGen3CategoryByType(newType)
            };
        }
        // ウェザーボールの場合、天候に応じてタイプと分類を更新
        if (move && move.class === 'weather_ball') {
            const weatherData = getWeatherBallTypeAndCategory();
            multiTurnMoves[turn] = {
                ...move,
                type: weatherData.type,
                category: weatherData.category
            };
        }
    } else {
        multiTurnMoves[turn] = null;
    }
}

// 特性チェックボックスの表示制御
function updateAbilityCheckboxes(side, abilities) {
  // 配列でない場合は配列に変換
  const abilityList = Array.isArray(abilities) ? abilities : [abilities];
  
  // 一旦すべて非表示
  hideAllAbilityCheckboxes(side);
  
  // 該当する特性のチェックボックスを表示
  abilityList.forEach(ability => {
    switch(ability) {
      case 'ヨガパワー':
        showAndCheckAbility('yogaPowerContainer', 'yogaPowerCheck');
        break;
      case 'ちからもち':
        showAndCheckAbility('hugePowerContainer', 'hugePowerCheck');
        break;
      case 'はりきり':
        showAndCheckAbility('harikiriContainer', 'harikiriCheck');
        break;
      case 'プラス':
        showAndCheckAbility('plusContainer', 'plusheck');
        break;
      case 'マイナス':
        showAndCheckAbility('minusContainer', 'minusCheck');
        break;
      case 'こんじょう':
        showAndCheckAbility('gutsContainer', 'gutsCheck');
        break;
      case 'しんりょく':
        showAndCheckAbility('shinryokuContainer', 'shinryokuCheck');
        break;
      case 'もうか':
        showAndCheckAbility('moukaContainer', 'moukaCheck');
        break;
      case 'げきりゅう':
        showAndCheckAbility('gekiryuuContainer', 'gekiryuuCheck');
        break;
      case 'むしのしらせ':
        showAndCheckAbility('mushiNoShiraseContainer', 'mushiNoShiraseCheck');
        break;
      case 'もらいび':
        showAndCheckAbility('moraibiContainer', 'moraibiCheck');
        break;
    }
  });
}
function showAndCheckAbility(containerId, checkboxId) {
    document.querySelector('.attackerAbilityContainer').style.display = 'flex';
  const container = document.getElementById(containerId);
  if (container) {
    container.style.display = 'inline-block';
    // デフォルトではチェックを入れない（ユーザーが選択）
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
      checkbox.checked = false;
    }
  }
}

function hideAllAbilityCheckboxes(side) {
  const abilityContainers = [
    'yogaPowerContainer', 'hugePowerContainer','harikiriContainer',
    'plusContainer', 'minusContainer', 'gutsContainer',
    'shinryokuContainer', 'moukaContainer', 'gekiryuuContainer', 'mushiNoShiraseContainer',
    'moraibiContainer'
  ];
  
  abilityContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.style.display = 'none';
      const checkbox = container.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = false;
      }
    }
  });
}

function hideAllDefenderAbilityCheckboxes() {
    document.querySelector('.defenderAbilityContainer').style.display = 'none';
    const defenderAbilities = ['atsuishibouContainer', 'fushiginaurokoContainer'];
    defenderAbilities.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.style.display = 'none';
            const checkbox = container.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
        }
    });
}

// 防御側の特性更新関数
function updateDefenderAbilityCheckboxes(abilities) {
    const abilityList = Array.isArray(abilities) ? abilities : [abilities];
    
    // まず全ての防御側特性を非表示
    hideAllDefenderAbilityCheckboxes();
    
    // 防御側の特性コンテナを表示するかどうか
    let hasDefenderAbility = false;
    
    abilityList.forEach(ability => {
        if (ability === 'あついしぼう') {
            hasDefenderAbility = true;
            const container = document.getElementById('atsuishibouContainer');
            if (container) {
                container.style.display = 'inline-block';
            }
        } else if (ability === 'ふしぎなうろこ') {
            hasDefenderAbility = true;
            const container = document.getElementById('fushiginaurokoContainer');
            if (container) {
                container.style.display = 'inline-block';
            }
        }
    });
    
    if (hasDefenderAbility) {
        document.querySelector('.defenderAbilityContainer').style.display = 'flex';
    }
}

// アイテム選択
function selectItem(side, itemName) {
    const item = itemName ? itemData.find(i => i.name === itemName) : null;
    if (side === 'attacker') {
        attackerPokemon.item = item;
    } else {
        defenderPokemon.item = item;
    }
}

// 性格選択
function selectNature(side) {
    const inputId = side === 'attacker' ? 'attackerNature' : 'defenderNature';
    const selectedNature = document.getElementById(inputId).value;
    const nature = natureData.find(n => n.name === selectedNature);
    
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    
    // 性格補正をリセット
    target.natureModifiers = { a: 1.0, b: 1.0, c: 1.0, d: 1.0, s: 1.0 };
    
    if (nature) {
        Object.keys(nature).forEach(stat => {
            if (stat !== 'name' && target.natureModifiers[stat] !== undefined) {
                target.natureModifiers[stat] = nature[stat];
            }
        });
    }
    
    // 性格チェックボックスを更新（メイン画面のボタンも含む）
    updateNatureCheckboxes(side);
    updateStats(side);
}

// ========================
// 5. ステータス計算
// ========================

// 個体値設定
function setIV(side, stat, value) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const inputId = `${side}Iv${stat.toUpperCase()}`;
    const input = document.getElementById(inputId);
    
    if (!input) return;
    
    const currentValue = parseInt(input.value) || 31;
    const newValue = currentValue === 31 ? 30 : 31;
    
    target.ivValues[stat] = newValue;
    input.value = newValue;
    
    // 詳細設定の入力欄も更新
    const detailInputId = `${side}DetailIv${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailInputId);
    if (detailInput) {
        detailInput.value = newValue;
        updateDetailIVButton(detailInput);
    }
    
    // ボタン表示を更新
    const parent = input.parentElement;
    const button = parent.querySelector('.iv-quick-btn');
    if (button) {
        const nextValue = newValue === 31 ? 30 : 31;
        button.textContent = nextValue;
        button.setAttribute('onclick', `setIV('${side}', '${stat}', ${nextValue})`);
    }
    
    updateStats(side);
    
    // ★改良: 防御側HPの個体値変更時は即座に現在HPも同期
    if (side === 'defender' && stat === 'hp') {
        // より短い遅延で確実に同期
        setTimeout(() => {
            syncCurrentHPWithMaxHP();
        }, 30);
    }
}

// 詳細設定の個体値設定
function setDetailIV(side, stat, value) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const detailInputId = `${side}DetailIv${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailInputId);
    
    if (!detailInput) return;
    
    const currentValue = parseInt(detailInput.value) || 31;
    const newValue = currentValue === 31 ? 30 : 31;
    
    target.ivValues[stat] = newValue;
    detailInput.value = newValue;
    
    // メインの個体値入力欄も更新
    const mainInputId = `${side}Iv${stat.toUpperCase()}`;
    const mainInput = document.getElementById(mainInputId);
    if (mainInput) {
        mainInput.value = newValue;
        updateIVButton(mainInput);
    }
    
    // 詳細設定のボタンも更新
    updateDetailIVButton(detailInput);
    
    updateStats(side);
    
    // ★改良: 防御側HPの個体値変更時は即座に現在HPも同期
    if (side === 'defender' && stat === 'hp') {
        // より短い遅延で確実に同期
        setTimeout(() => {
            syncCurrentHPWithMaxHP();
        }, 30);
    }
}

// 詳細設定の努力値設定
function setDetailEV(side, stat, value) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const detailInputId = `${side}DetailEv${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailInputId);
    
    if (!detailInput) return;
    
    const currentValue = parseInt(detailInput.value) || 0;
    const newValue = currentValue === 252 ? 0 : 252;
    
    target.evValues[stat] = newValue;
    detailInput.value = newValue;
    
    // メインの努力値入力欄も更新
    const mainInputId = `${side}Ev${stat.toUpperCase()}`;
    const mainInput = document.getElementById(mainInputId);
    if (mainInput) {
        mainInput.value = newValue;
        updateEVButton(mainInput);
    }
    
    // 詳細設定のボタンも更新
    updateDetailEVButton(detailInput);
    
    updateStats(side);
    
    // ★改良: 防御側HPの努力値変更時は即座に現在HPも同期
    if (side === 'defender' && stat === 'hp') {
        // より短い遅延で確実に同期
        setTimeout(() => {
            syncCurrentHPWithMaxHP();
        }, 30);
    }
}


// 努力値設定
function setEV(side, stat, value) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const inputId = `${side}Ev${stat.toUpperCase()}`;
    const input = document.getElementById(inputId);
    
    if (!input) return;
    
    const currentValue = parseInt(input.value) || 0;
    const newValue = currentValue === 252 ? 0 : 252;
    
    target.evValues[stat] = newValue;
    input.value = newValue;
    
    // ボタン表示を更新
    updateEVButton(input);
    
    // 詳細設定の努力値入力欄も更新
    const detailInputId = `${side}DetailEv${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailInputId);
    if (detailInput) {
        detailInput.value = newValue;
        updateDetailEVButton(detailInput);
    }
    
    updateStats(side);
    
    // ★改良: 防御側HPの努力値変更時は即座に現在HPも同期
    if (side === 'defender' && stat === 'hp') {
        // より短い遅延で確実に同期
        setTimeout(() => {
            syncCurrentHPWithMaxHP();
        }, 30);
    }
}

// 個体値ボタンの表示を更新
function updateIVButton(input) {
    const value = parseInt(input.value) || 31;
    const buttonText = value === 31 ? '30' : '31';
    
    const parent = input.parentElement;
    const button = parent.querySelector('.iv-quick-btn');
    if (button) {
        button.textContent = buttonText;
        // onclick属性も更新
        const side = input.id.includes('attacker') ? 'attacker' : 'defender';
        const stat = input.id.match(/Iv([A-Z]+)/)[1].toLowerCase();
        button.setAttribute('onclick', `setIV('${side}', '${stat}', ${value === 31 ? 30 : 31})`);
    }
}

// 努力値ボタンの表示を更新
function updateEVButton(input) {
    const value = parseInt(input.value) || 0;
    const buttonText = value === 252 ? '0' : '252';
    
    const parent = input.parentElement;
    const button = parent.querySelector('.ev-quick-btn');
    if (button) {
        button.textContent = buttonText;
        // onclick属性も更新
        const side = input.id.includes('attacker') ? 'attacker' : 'defender';
        const stat = input.id.match(/Ev([A-Z]+)/)[1].toLowerCase();
        button.setAttribute('onclick', `setEV('${side}', '${stat}', ${value === 252 ? 0 : 252})`);
    }
}

function updateDetailEVButton(input) {
    const value = parseInt(input.value) || 0;
    const buttonText = value === 252 ? '0' : '252';
    
    const parent = input.parentElement;
    const button = parent.querySelector('.ev-quick-btn');
    if (button) {
        button.textContent = buttonText;
        // onclick属性も更新
        const side = input.id.includes('attacker') ? 'attacker' : 'defender';
        const stat = input.id.match(/Ev([A-Z]+)/)[1].toLowerCase();
        button.setAttribute('onclick', `setDetailEV('${side}', '${stat}', ${value === 252 ? 0 : 252})`);
    }
}

function updateDetailIVButton(input) {
    const value = parseInt(input.value) || 31;
    const buttonText = value === 31 ? '30' : '31';
    
    const parent = input.parentElement;
    const button = parent.querySelector('.iv-quick-btn');
    if (button) {
        button.textContent = buttonText;
        // onclick属性も更新
        const side = input.id.includes('attacker') ? 'attacker' : 'defender';
        const stat = input.id.match(/Iv([A-Z]+)/)[1].toLowerCase();
        button.setAttribute('onclick', `setDetailIV('${side}', '${stat}', ${value === 31 ? 30 : 31})`);
    }
}

// 4. 現在HPの強制同期関数
function syncCurrentHPWithMaxHP() {
    const maxHPInput = document.getElementById('defenderRealHP');
    const detailMaxHPInput = document.getElementById('defenderDetailRealHP');
    const currentHPInput = document.getElementById('defenderCurrentHP');
    
    if (!currentHPInput) return;
    
    // 最大HPを取得（メイン画面を優先）
    let maxHP = 0;
    if (maxHPInput && maxHPInput.value) {
        maxHP = parseInt(maxHPInput.value) || 0;
    } else if (detailMaxHPInput && detailMaxHPInput.value) {
        maxHP = parseInt(detailMaxHPInput.value) || 0;
    }
    
    if (maxHP > 0) {
        console.log(`現在HPを最大HP(${maxHP})に強制同期`);
        currentHPInput.value = maxHP;
        currentHPInput.setAttribute('data-max-hp', maxHP);
        currentHPInput.setAttribute('max', maxHP);
        currentHPInput.setAttribute('min', 1);
    }
}

// 5. HP関連の変更監視とリアルタイム同期
function setupHPSyncListeners() {
    // 防御側HP個体値・努力値・実数値の変更を監視
    const hpRelatedInputs = [
        'defenderIvHP',
        'defenderEvHP', 
        'defenderDetailIvHP',
        'defenderDetailEvHP',
        'defenderRealHP',
        'defenderDetailRealHP',
        'defenderLevel'
    ];
    
    hpRelatedInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // input, change, blur イベントで監視
            ['input', 'change', 'blur'].forEach(eventType => {
                input.addEventListener(eventType, function() {
                    // 少し遅延させて確実に計算後に同期
                    setTimeout(() => {
                        syncCurrentHPWithMaxHP();
                    }, 50);
                });
            });
        }
    });
    
    // 防御側の性格変更も監視（HP実数値に影響する場合がある）
    const defenderNature = document.getElementById('defenderNature');
    if (defenderNature) {
        defenderNature.addEventListener('change', function() {
            setTimeout(() => {
                syncCurrentHPWithMaxHP();
            }, 100);
        });
    }
    
    // 防御側ポケモン変更も監視
    const defenderPokemon = document.getElementById('defenderPokemon');
    if (defenderPokemon) {
        defenderPokemon.addEventListener('change', function() {
            setTimeout(() => {
                syncCurrentHPWithMaxHP();
            }, 200); // ポケモン変更は少し長めの遅延
        });
    }
}

// 6. 現在HPの強制同期関数（改良版）
function syncCurrentHPWithMaxHP() {
    const maxHPInput = document.getElementById('defenderRealHP');
    const detailMaxHPInput = document.getElementById('defenderDetailRealHP');
    const currentHPInput = document.getElementById('defenderCurrentHP');
    
    // 最大HPを取得（メイン画面を優先、次に詳細画面、最後に計算値）
    let maxHP = 0;
    
    if (maxHPInput && maxHPInput.value && !isNaN(parseInt(maxHPInput.value))) {
        maxHP = parseInt(maxHPInput.value);
    } else if (detailMaxHPInput && detailMaxHPInput.value && !isNaN(parseInt(detailMaxHPInput.value))) {
        maxHP = parseInt(detailMaxHPInput.value);
    } else {
        // 実数値入力欄に値がない場合は計算で求める
        const stats = calculateStats(defenderPokemon);
        maxHP = stats.hp;
    }
    
    if (maxHP > 0) {
        const currentValue = parseInt(currentHPInput.value) || 0;
        const previousMaxHP = parseInt(currentHPInput.getAttribute('data-max-hp')) || 0;
        
        // 以下の条件で現在HPを同期
        // 1. 最大HPが変更された
        // 2. 現在HPが0
        // 3. 現在HPが新しい最大HPを超えている
        // 4. 現在HPが前の最大HPと同じ（満タン状態を維持）
        const shouldSync = 
            maxHP !== previousMaxHP || 
            currentValue === 0 || 
            currentValue > maxHP ||
            (previousMaxHP > 0 && currentValue === previousMaxHP);
        
        if (shouldSync) {
            currentHPInput.value = maxHP;
        }
        
        // 制限と記録を更新
        currentHPInput.setAttribute('data-max-hp', maxHP);
        currentHPInput.setAttribute('max', maxHP);
        currentHPInput.setAttribute('min', 1);
        
        // ポケモン名も記録
        const currentPokemonName = defenderPokemon.name || '';
        currentHPInput.setAttribute('data-pokemon-name', currentPokemonName);
    }
}
function setupStepInputs() {
    // 全ての努力値入力欄に4単位ステップとイベントリスナーを設定
    const evInputs = document.querySelectorAll('.ev-input');
    evInputs.forEach(input => {
        input.step = 4;
        input.addEventListener('input', handleEVInput);
        
        // 初期値をpreviousValueとして設定
        const initialValue = parseInt(input.value) || 0;
        input.dataset.previousValue = initialValue;
        
        // 詳細設定の努力値入力欄の場合、change イベントも追加
        if (input.id.includes('Detail')) {
            input.addEventListener('change', function() {
                const side = this.id.includes('attacker') ? 'attacker' : 'defender';
                const stat = this.id.match(/Ev([A-Z]+)/)[1].toLowerCase();
                syncMainEV(side, stat);
                updateStats(side);
            });
        }
    });
    
    // 詳細設定の個体値入力欄にもイベントリスナーを追加
    const detailIvInputs = document.querySelectorAll('.detail-stat-row .iv-input');
    detailIvInputs.forEach(input => {
        input.addEventListener('change', function() {
            updateDetailIVButton(this);
            // メインの入力欄も同期
            const side = this.id.includes('attacker') ? 'attacker' : 'defender';
            const stat = this.id.match(/Iv([A-Z]+)/)[1].toLowerCase();
            syncMainIV(side, stat);
            updateStats(side);
            
            // めざめるパワーのタイプと分類が変わる可能性があるので更新
            if (side === 'attacker') {
                updateHiddenPowerIfNeeded();
            }
            // 防御側のめざパ表示も更新
            updateDetailSummary(side);
        });
    });

}

function syncMainIV(side, stat) {
    const detailInputId = `${side}DetailIv${stat.toUpperCase()}`;
    const mainInputId = `${side}Iv${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailInputId);
    const mainInput = document.getElementById(mainInputId);
    
    if (detailInput && mainInput) {
        mainInput.value = detailInput.value;
        updateIVButton(mainInput);
    }
}

function handleEVInput(event) {
    const input = event.target;
    let value = parseInt(input.value) || 0;
    const previousValue = parseInt(input.dataset.previousValue) || parseInt(input.getAttribute('data-previous-value')) || 0;
    
    // サイドとステータスを判定して個体値対応の調整
    const inputId = input.id;
    const side = inputId.includes('attacker') ? 'attacker' : 'defender';
    let stat;
    if (inputId.includes('HP') || inputId.includes('Hp')) stat = 'hp';
    else if (inputId.includes('A')) stat = 'a';
    else if (inputId.includes('B')) stat = 'b';
    else if (inputId.includes('C')) stat = 'c';
    else if (inputId.includes('D')) stat = 'd';
    else if (inputId.includes('S')) stat = 's';
    
    if (stat && side) {
        const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
        const currentIV = pokemon.ivValues[stat];
        
        // 方向を検出
        const direction = value > previousValue ? 1 : (value < previousValue ? -1 : 0);
        
        // 方向を考慮した専用関数を呼び出し
        if (direction !== 0) {
            const adjustedValue = getAdjustedEVValue(currentIV, previousValue, value, direction);
            value = adjustedValue;
        }
        
        value = Math.max(0, Math.min(252, value));
    } else {
        // 判定できない場合は4の倍数に調整
        value = Math.round(value / 4) * 4;
        value = Math.max(0, Math.min(252, value));
    }
    
    // 前回の値を保存
    input.dataset.previousValue = value;
    
    input.value = value;
    
    // ボタンの表示を更新
    if (input.closest('.detail-stat-row')) {
        updateDetailEVButton(input);
    } else {
        updateEVButton(input);
    }
    
    // 同期処理
    if (stat && side) {
        // 詳細設定の入力欄の場合はメインと同期
        if (input.closest('.detail-stat-row')) {
            syncMainEV(side, stat);
        } else {
            // メインの入力欄の場合は詳細設定と同期
            syncDetailEV(side, stat);
        }
        
        // ステータス更新
        updateStats(side);
    }
}

// 方向を考慮したEV値調整関数
function getAdjustedEVValue(currentIV, previousValue, targetValue, direction) {
    if (currentIV === 31) {
        // 個体値31：8n-4パターンに調整
        if (targetValue === 0) {
            return 0;
        } else if (targetValue <= 4) {
            return direction > 0 ? 4 : 0;
        } else {
            if (direction > 0) {
                // 増加方向：上の8n-4値
                const base = Math.ceil((targetValue + 4) / 8);
                return Math.max(4, Math.min(252, base * 8 - 4));
            } else {
                // 減少方向：下の8n-4値
                const base = Math.floor((targetValue + 4) / 8);
                let candidate = base * 8 - 4;
                if (candidate >= targetValue) {
                    candidate = Math.max(0, (base - 1) * 8 - 4);
                }
                return candidate === -4 ? 0 : Math.max(0, Math.min(252, candidate));
            }
        }
    } else if (currentIV === 30) {
        // 個体値30：8nパターンに調整
        if (targetValue === 0) {
            return 0;
        } else if (targetValue <= 8) {
            return direction > 0 ? 8 : 0;
        } else {
            if (direction > 0) {
                // 増加方向：上の8n値
                const base = Math.ceil(targetValue / 8);
                return Math.max(8, Math.min(248, base * 8));
            } else {
                // 減少方向：下の8n値
                const base = Math.floor(targetValue / 8);
                let candidate = base * 8;
                if (candidate >= targetValue) {
                    candidate = Math.max(0, (base - 1) * 8);
                }
                return Math.max(0, Math.min(248, candidate));
            }
        }
    } else {
        // その他：4の倍数に調整（方向を考慮）
        if (direction > 0) {
            return Math.ceil(targetValue / 4) * 4;
        } else {
            return Math.floor(targetValue / 4) * 4;
        }
    }
}

function updateAllButtons() {
    // IV ボタンの初期化
    document.querySelectorAll('.iv-input').forEach(input => {
        const value = parseInt(input.value) || 31;
        const nextValue = value === 31 ? 30 : 31;
        const parent = input.parentElement;
        const button = parent.querySelector('.iv-quick-btn');
        if (button) {
            button.textContent = nextValue;
        }
    });
    
    // EV ボタンの初期化
    document.querySelectorAll('.ev-input').forEach(input => {
        const value = parseInt(input.value) || 0;
        const nextValue = value === 252 ? 0 : 252;
        const parent = input.parentElement;
        const button = parent.querySelector('.ev-quick-btn');
        if (button) {
            button.textContent = nextValue;
        }
    });
}

// 性格補正ボタン
function setNatureModifier(side, stat, value, button) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    target.natureModifiers[stat] = value;
    
    // ボタンの選択状態を更新
    const buttons = document.querySelectorAll(`.nature-btn[data-side="${side}"][data-stat="${stat}"]`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    // 詳細設定のチェックボックスも更新
    const plusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Plus`);
    const minusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Minus`);
    
    if (plusCheckbox && minusCheckbox) {
        if (value === 1.1) {
            plusCheckbox.checked = true;
            minusCheckbox.checked = false;
        } else if (value === 0.9) {
            plusCheckbox.checked = false;
            minusCheckbox.checked = true;
        } else {
            plusCheckbox.checked = false;
            minusCheckbox.checked = false;
        }
    }
    
    // 性格を更新
    updateNatureFromModifiers(side);
    updateStats(side);
}

// 詳細設定の表示切替
function toggleDetail(side) {
    const detail = document.getElementById(`${side}Detail`);
    const header = detail.previousElementSibling;
    
    if (detail.style.display === 'none') {
        detail.style.display = 'block';
        header.textContent = '▼ 詳細設定を閉じる';
    } else {
        detail.style.display = 'none';
        header.textContent = '▶ 詳細設定を開く';
    }
}

// 性格チェックボックス処理
function handleNatureCheckbox(side, stat, type) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    
    // チェックボックスの状態を取得
    const checkboxId = `${side}${stat.toUpperCase()}${type === 'plus' ? 'Plus' : 'Minus'}`;
    const checkbox = document.getElementById(checkboxId);
    const isChecked = checkbox.checked;
    
    if (isChecked) {
        // 同じタイプの他のチェックボックスをオフにする
        const checkboxes = document.querySelectorAll(`.nature-${type}-checkbox[data-side="${side}"]`);
        checkboxes.forEach(cb => {
            if (cb !== checkbox) cb.checked = false;
        });
        
        // 性格補正を適用
        if (type === 'plus') {
            // 他のステータスの+補正を解除
            ['a', 'b', 'c', 'd', 's'].forEach(s => {
                if (s !== stat && target.natureModifiers[s] === 1.1) {
                    target.natureModifiers[s] = 1.0;
                }
            });
            target.natureModifiers[stat] = 1.1;
        } else {
            // 他のステータスの-補正を解除
            ['a', 'b', 'c', 'd', 's'].forEach(s => {
                if (s !== stat && target.natureModifiers[s] === 0.9) {
                    target.natureModifiers[s] = 1.0;
                }
            });
            target.natureModifiers[stat] = 0.9;
        }
    } else {
        // チェックを外した場合は補正を解除
        target.natureModifiers[stat] = 1.0;
    }
    
    // メイン画面の性格補正ボタンも更新
    updateMainNatureButtons(side, stat, target.natureModifiers[stat]);
    
    // 性格を更新
    updateNatureFromModifiers(side);
    updateStats(side);
}

// 性格補正から性格を逆算
function updateNatureFromModifiers(side) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const inputId = side === 'attacker' ? 'attackerNature' : 'defenderNature';
    
    // 補正値から性格を特定
    const nature = natureData.find(n => {
        return ['a', 'b', 'c', 'd', 's'].every(stat => {
            const modifier = n[stat] || 1.0;
            return modifier === target.natureModifiers[stat];
        });
    });
    
    if (nature) {
        document.getElementById(inputId).value = nature.name;
    }
}

function updateMainNatureButtons(side, stat, value) {    
    // 攻撃側はA,Cのみ、防御側はB,Dのみ表示されている
    const shouldUpdate = (side === 'attacker' && (stat === 'a' || stat === 'c')) ||
                        (side === 'defender' && (stat === 'b' || stat === 'd')); 
    if (shouldUpdate) {
        const buttons = document.querySelectorAll(`.nature-btn[data-side="${side}"][data-stat="${stat}"]`);
        buttons.forEach((btn, index) => {
            const btnValue = parseFloat(btn.getAttribute('data-value'));           
            if (btnValue === value) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
}

// 性格チェックボックスの更新
function updateNatureCheckboxes(side) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    
    // すべてのチェックボックスをクリア
    const checkboxes = document.querySelectorAll(`.nature-plus-checkbox[data-side="${side}"], .nature-minus-checkbox[data-side="${side}"]`);
    checkboxes.forEach(cb => cb.checked = false);
    
    // 現在の性格補正に基づいてチェック
    ['a', 'b', 'c', 'd', 's'].forEach(stat => {
        if (target.natureModifiers[stat] === 1.1) {
            const plusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Plus`);
            if (plusCheckbox) plusCheckbox.checked = true;
        } else if (target.natureModifiers[stat] === 0.9) {
            const minusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Minus`);
            if (minusCheckbox) minusCheckbox.checked = true;
        }
    });
    
    // メイン画面の性格補正ボタンも更新
    if (side === 'attacker') {
        updateMainNatureButtons(side, 'a', target.natureModifiers['a']);
        updateMainNatureButtons(side, 'c', target.natureModifiers['c']);
    } else {
        updateMainNatureButtons(side, 'b', target.natureModifiers['b']);
        updateMainNatureButtons(side, 'd', target.natureModifiers['d']);
    }
}

// ステータス更新
function updateStats(side) {
    const target = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const level = parseInt(document.getElementById(`${side}Level`).value) || 50;
    target.level = level;
    
    // 個体値を取得（メイン表示または詳細設定から）
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const ivInput = document.getElementById(`${side}Iv${stat.toUpperCase()}`);
        const detailIvInput = document.getElementById(`${side}DetailIv${stat.toUpperCase()}`);
        
        let ivValue = target.ivValues[stat]; // デフォルトは現在の値
        
        if (ivInput && ivInput.value !== '') {
            const inputValue = parseInt(ivInput.value);
            if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 31) {
                ivValue = inputValue;
            }
        } else if (detailIvInput && detailIvInput.value !== '') {
            const inputValue = parseInt(detailIvInput.value);
            if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 31) {
                ivValue = inputValue;
            }
        }
        
        target.ivValues[stat] = ivValue;
    });
    
    // 努力値を取得（メイン表示または詳細設定から）
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const evInput = document.getElementById(`${side}Ev${stat.toUpperCase()}`);
        const detailEvInput = document.getElementById(`${side}DetailEv${stat.toUpperCase()}`);
        
        let evValue = target.evValues[stat]; // デフォルトは現在の値
        
        if (evInput && evInput.value !== '') {
            const inputValue = parseInt(evInput.value);
            if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 252) {
                evValue = Math.floor(inputValue / 4) * 4; // 4の倍数に調整
            }
        } else if (detailEvInput && detailEvInput.value !== '') {
            const inputValue = parseInt(detailEvInput.value);
            if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 252) {
                evValue = Math.floor(inputValue / 4) * 4; // 4の倍数に調整
            }
        }
        
        target.evValues[stat] = evValue;
    });
    
    // 実数値計算
    const stats = calculateStats(target);
    
    // ★修正: 防御側のHP実数値が変更された場合の現在HP同期処理を強化
    if (side === 'defender') {
        setTimeout(() => {
            const currentHPInput = document.getElementById('defenderCurrentHP');

            if (currentHPInput && stats.hp) {
                // 計算されたHP実数値を使用
                const newMaxHP = stats.hp;

                // 前回の最大HPを取得
                const previousMaxHP = parseInt(currentHPInput.getAttribute('data-max-hp')) || 0;
                const currentValue = parseInt(currentHPInput.value) || 0;

                // ★重要: HP実数値が変更された場合は必ず現在HPを同期
                if (newMaxHP !== previousMaxHP || currentValue === 0 || currentValue > newMaxHP) {
                    currentHPInput.value = newMaxHP;
                }

                // 新しい最大HPを記録し、制限を設定
                currentHPInput.setAttribute('data-max-hp', newMaxHP);
                currentHPInput.setAttribute('max', newMaxHP);
                currentHPInput.setAttribute('min', 1);

                // モバイルスライダーの最大値も更新（現在HPがアクティブな場合のみ）
                if (mobileControlState.isActive &&
                    mobileControlState.activeInput === currentHPInput) {
                    const mobileSlider = document.getElementById('mobileSlider');
                    if (mobileSlider) {
                        mobileSlider.setAttribute('max', newMaxHP);
                        const mobileMaxLabel = document.getElementById('mobileMaxLabel');
                        if (mobileMaxLabel) {
                            mobileMaxLabel.textContent = newMaxHP;
                        }
                    }
                }

                // ポケモン名も記録（ポケモン変更検知用）
                const currentPokemonName = defenderPokemon.name;
                currentHPInput.setAttribute('data-pokemon-name', currentPokemonName);
            }
        }, 50);
    }

    // 表示更新
    displayStats(side, stats);

    // めざめるパワーのタイプが変わる可能性があるので更新
    updateHiddenPowerIfNeeded();

    // 入力制限を更新
    if (target.name) { // ポケモンが選択されている場合のみ
        updateAllRealStatInputLimits(side);
    }

    // HP実数値が変更された場合、pinch系の技のHP値も更新
    if (side === 'attacker' && (currentMove?.class === 'pinch_up' || currentMove?.class === 'pinch_down')) {
        updatePinchHPValues();
    }
    
    // めざパと合計努力値の表示を更新
    updateDetailSummary(side);
}

// めざパと合計努力値の表示を更新
function updateDetailSummary(side) {
    // めざめるパワーのタイプと威力を計算（攻撃側の個体値を使用）
    let hiddenPowerType, hiddenPowerPower;
    
    if (side === 'attacker') {
        hiddenPowerType = calculateHiddenPowerType();
        hiddenPowerPower = calculateHiddenPowerBP();
    } else {
        // 防御側の場合も攻撃側の個体値でめざパを計算するか、
        // 防御側専用の計算関数を作成するかを選択
        // ここでは防御側専用の計算を実装
        hiddenPowerType = calculateDefenderHiddenPowerType();
        hiddenPowerPower = calculateDefenderHiddenPowerBP();
    }
    
    // 合計努力値を計算
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const totalEV = Object.values(pokemon.evValues).reduce((sum, ev) => sum + ev, 0);
    
    // 表示要素を取得
    const hiddenPowerDisplay = document.getElementById(`${side}HiddenPowerDisplay`);
    const totalEVDisplay = document.getElementById(`${side}TotalEVDisplay`);
    
    if (hiddenPowerDisplay) {
        hiddenPowerDisplay.textContent = `${hiddenPowerType} ${hiddenPowerPower}`;
    }
    
    if (totalEVDisplay) {
        if (totalEV > 508) {
            const excess = totalEV - 508;
            totalEVDisplay.textContent = `508+${excess}`;
            totalEVDisplay.style.color = '#dc3545'; // 赤色
            totalEVDisplay.style.fontWeight = 'bold';
        } else {
            totalEVDisplay.textContent = totalEV.toString();
            totalEVDisplay.style.color = '#333'; // 通常色
            totalEVDisplay.style.fontWeight = 'normal';
        }
    }
}


// 防御側専用のめざめるパワータイプ計算
function calculateDefenderHiddenPowerType() {
    // 防御側ポケモンの個体値を取得
    const ivs = {
        hp: parseInt(document.getElementById('defenderDetailIvHP').value),
        a: parseInt(document.getElementById('defenderDetailIvA').value),
        b: parseInt(document.getElementById('defenderDetailIvB').value),
        c: parseInt(document.getElementById('defenderDetailIvC').value),
        d: parseInt(document.getElementById('defenderDetailIvD').value),
        s: parseInt(document.getElementById('defenderDetailIvS').value)
    };
    
    // タイプ計算 (各個体値が奇数かどうか)
    let typeSum = 0;
    if (ivs.hp % 2 === 1) typeSum += 1;
    if (ivs.a % 2 === 1) typeSum += 2;
    if (ivs.b % 2 === 1) typeSum += 4;
    if (ivs.s % 2 === 1) typeSum += 8;
    if (ivs.c % 2 === 1) typeSum += 16;
    if (ivs.d % 2 === 1) typeSum += 32;
    
    const typeIndex = Math.floor(typeSum * 15 / 63);
    
    // タイプの対応表
    const typeTable = [
        'かくとう', 'ひこう', 'どく', 'じめん', 'いわ', 'むし', 'ゴースト', 'はがね',
        'ほのお', 'みず', 'くさ', 'でんき', 'エスパー', 'こおり', 'ドラゴン', 'あく'
    ];
    
    return typeTable[typeIndex];
}

// 防御側専用のめざめるパワー威力計算
function calculateDefenderHiddenPowerBP() {
    // 防御側ポケモンの個体値を取得
    const ivs = {
        hp: parseInt(document.getElementById('defenderDetailIvHP').value),
        a: parseInt(document.getElementById('defenderDetailIvA').value),
        b: parseInt(document.getElementById('defenderDetailIvB').value),
        c: parseInt(document.getElementById('defenderDetailIvC').value),
        d: parseInt(document.getElementById('defenderDetailIvD').value),
        s: parseInt(document.getElementById('defenderDetailIvS').value)
    };
    
    // 威力計算 (各個体値を4で割った余りが2以上かどうか)
    let powerSum = 0;
    if (ivs.hp % 4 >= 2) powerSum += 1;
    if (ivs.a % 4 >= 2) powerSum += 2;
    if (ivs.b % 4 >= 2) powerSum += 4;
    if (ivs.s % 4 >= 2) powerSum += 8;
    if (ivs.c % 4 >= 2) powerSum += 16;
    if (ivs.d % 4 >= 2) powerSum += 32;
    
    const power = Math.floor(powerSum * 40 / 63) + 30;
    return power;
}

// 実数値計算
function calculateStats(pokemon) {
    const level = pokemon.level;
    const stats = {};
    
    // HP計算（性格補正なし）
    const hpBase = pokemon.baseStats.hp * 2 + pokemon.ivValues.hp + Math.floor(pokemon.evValues.hp / 4);
    const hpLevel = Math.floor(hpBase * level / 100);
    stats.hp = hpLevel + level + 10;
    
    // その他のステータス
    ['a', 'b', 'c', 'd', 's'].forEach(stat => {
        const base = pokemon.baseStats[stat] * 2 + pokemon.ivValues[stat] + Math.floor(pokemon.evValues[stat] / 4);
        const levelCalc = Math.floor(base * level / 100);
        const beforeNature = levelCalc + 5;
        stats[stat] = Math.floor(beforeNature * pokemon.natureModifiers[stat]);
    });
    
    return stats;
}

// ステータス表示
function displayStats(side, stats) {
    // メイン表示の更新（攻撃側：A,C / 防御側：H,B,D）
    if (side === 'attacker') {
        const attackerRealA = document.getElementById('attackerRealA');
        const attackerRealC = document.getElementById('attackerRealC');
        
        // updateValueSilentlyが利用可能な場合はそれを使用
        if (attackerRealA && attackerRealA.updateValueSilently) {
            attackerRealA.updateValueSilently(stats.a);
        } else if (attackerRealA) {
            attackerRealA.value = stats.a;
        }
        
        if (attackerRealC && attackerRealC.updateValueSilently) {
            attackerRealC.updateValueSilently(stats.c);
        } else if (attackerRealC) {
            attackerRealC.value = stats.c;
        }
    } else {
        const defenderRealHP = document.getElementById('defenderRealHP');
        const defenderRealB = document.getElementById('defenderRealB');
        const defenderRealD = document.getElementById('defenderRealD');
        
        // updateValueSilentlyが利用可能な場合はそれを使用
        if (defenderRealHP && defenderRealHP.updateValueSilently) {
            defenderRealHP.updateValueSilently(stats.hp);
        } else if (defenderRealHP) {
            defenderRealHP.value = stats.hp;
        }
        
        if (defenderRealB && defenderRealB.updateValueSilently) {
            defenderRealB.updateValueSilently(stats.b);
        } else if (defenderRealB) {
            defenderRealB.value = stats.b;
        }
        
        if (defenderRealD && defenderRealD.updateValueSilently) {
            defenderRealD.updateValueSilently(stats.d);
        } else if (defenderRealD) {
            defenderRealD.value = stats.d;
        }
    }
    
    // 詳細設定の実数値更新
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const detailInput = document.getElementById(`${side}DetailReal${stat.toUpperCase()}`);
        if (detailInput) {
            if (detailInput.updateValueSilently) {
                detailInput.updateValueSilently(stats[stat]);
            } else {
                detailInput.value = stats[stat];
            }
        }
    });
    
    // ポケモン情報を表示
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const infoElement = document.getElementById(`${side}PokemonInfo`);
    if (infoElement && pokemon.name) {
        const typeText = pokemon.types.join('/');
        const statsText = `H${pokemon.baseStats.hp} A${pokemon.baseStats.a} B${pokemon.baseStats.b} C${pokemon.baseStats.c} D${pokemon.baseStats.d} S${pokemon.baseStats.s}`;
        infoElement.textContent = `${typeText} ${statsText}`;
        infoElement.style.display = 'block';
    }
}

// ========================
// スピンボタン関係のリファクタリング
// ========================

/**
 * 実数値入力管理クラス
 * スピンボタンの動作と実数値の変更を統一的に管理
 */
class RealStatInputManager {
    constructor() {
        this.inputElements = new Map(); // 入力要素とその設定を管理
        this.isUpdating = new Set(); // 更新中フラグ
    }

    /**
     * 実数値入力要素を初期化
     */
    initializeRealStatInputs() {
        const config = [
            // メイン画面の実数値入力
            { id: 'attackerRealA', side: 'attacker', stat: 'a', type: 'main' },
            { id: 'attackerRealC', side: 'attacker', stat: 'c', type: 'main' },
            { id: 'defenderRealHP', side: 'defender', stat: 'hp', type: 'main' },
            { id: 'defenderRealB', side: 'defender', stat: 'b', type: 'main' },
            { id: 'defenderRealD', side: 'defender', stat: 'd', type: 'main' },
            
            // 詳細設定の実数値入力
            ...['hp', 'a', 'b', 'c', 'd', 's'].flatMap(stat => [
                { id: `attackerDetailReal${stat.toUpperCase()}`, side: 'attacker', stat, type: 'detail' },
                { id: `defenderDetailReal${stat.toUpperCase()}`, side: 'defender', stat, type: 'detail' }
            ])
        ];

        config.forEach(item => this.setupRealStatInput(item));
    }

    /**
     * 個別の実数値入力要素を設定
     */
    setupRealStatInput({ id, side, stat, type }) {
        const input = document.getElementById(id);
        if (!input) return;

        // 既存の要素を置換してイベントリスナーをクリア
        const newInput = this.createInputElement(input, { id, side, stat, type });
        input.parentNode.replaceChild(newInput, input);
        
        this.inputElements.set(id, { side, stat, type, element: newInput });
    }

    /**
     * 新しい入力要素を作成
     */
    createInputElement(originalInput, config) {
        const newInput = originalInput.cloneNode(true);
        newInput.removeAttribute('readonly');
        
        let previousValue = parseInt(newInput.value) || 0;
        const updateKey = config.id;

        // サイレント更新関数
        newInput.updateValueSilently = (newValue) => {
            this.isUpdating.add(updateKey);
            newInput.value = newValue;
            previousValue = parseInt(newValue) || 0;
            this.isUpdating.delete(updateKey);
        };

        // input イベント（スピンボタン操作時）
        newInput.addEventListener('input', (e) => {
            if (this.isUpdating.has(updateKey)) return;
            
            const currentValue = parseInt(e.target.value) || 0;
            const direction = this.getChangeDirection(currentValue, previousValue);
            
            if (direction !== 0) {
                this.isUpdating.add(updateKey);
                this.handleRealStatChange(config, currentValue, direction);
                this.isUpdating.delete(updateKey);
                previousValue = currentValue;
            }
        });

        // change イベント（直接入力時）
        newInput.addEventListener('change', (e) => {
            if (this.isUpdating.has(updateKey)) return;
            
            const currentValue = parseInt(e.target.value) || 0;
            if (currentValue !== previousValue) {
                this.isUpdating.add(updateKey);
                this.handleRealStatChange(config, currentValue, 0);
                this.isUpdating.delete(updateKey);
                previousValue = currentValue;
            }
        });

        // スピンボタンの特殊処理
        this.setupSpinButtonHandling(newInput, config);

        return newInput;
    }

    /**
     * 変化方向を判定
     */
    getChangeDirection(current, previous) {
        if (current > previous) return 1;
        if (current < previous) return -1;
        return 0;
    }

    /**
     * スピンボタンの特殊処理を設定
     */
    setupSpinButtonHandling(input, config) {
        // キーボード操作（矢印キー）
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                setTimeout(() => this.handleSpinButtonDown(config), 10);
            }
        });

        // マウス操作（スピンボタンクリック）
        input.addEventListener('mousedown', (e) => {
            if (this.isSpinButtonDownClick(e, input)) {
                setTimeout(() => this.handleSpinButtonDown(config), 10);
            }
        });
    }

    /**
     * スピンボタン下向きクリックかどうか判定
     */
    isSpinButtonDownClick(event, input) {
        const rect = input.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        const isInSpinButtonArea = clickX > rect.width - 20;
        const isLowerHalf = clickY > rect.height / 2;
        
        return isInSpinButtonArea && isLowerHalf;
    }

    /**
     * スピンボタン下向き操作の処理
     */
    handleSpinButtonDown(config) {
        const pokemon = config.side === 'attacker' ? attackerPokemon : defenderPokemon;
        const currentRealStat = this.calculateCurrentStat(pokemon, config.stat);
        const limits = calculateStatLimits(pokemon.baseStats[config.stat], pokemon.level, config.stat === 'hp');
        
        // 個体値1→0の特殊処理
        if (currentRealStat === limits.min && pokemon.ivValues[config.stat] === 1) {
            const statWith0IV = calculateStatWithParams(
                pokemon.baseStats[config.stat], 
                pokemon.level, 
                0, 
                pokemon.evValues[config.stat], 
                pokemon.natureModifiers[config.stat], 
                config.stat === 'hp'
            );
            
            if (statWith0IV <= currentRealStat) {
                pokemon.ivValues[config.stat] = 0;
                updateIVEVInputs(config.side, config.stat, 0, pokemon.evValues[config.stat]);
                updateStats(config.side);
                return true;
            }
        }
        
        return false;
    }

    /**
     * 実数値変更の統一処理
     */
    handleRealStatChange(config, targetValue, direction) {
        const pokemon = config.side === 'attacker' ? attackerPokemon : defenderPokemon;
        const currentRealStat = this.calculateCurrentStat(pokemon, config.stat);
        
        // 基本的な制限チェック
        if (targetValue === currentRealStat) return;
        
        // 個体値1→0の特別処理
        if (this.handleSpecialIV1to0Case(pokemon, config, targetValue, direction)) {
            return;
        }
        
        // 個体値優先の最適化処理
        const result = this.findOptimalStatsIVFirst(pokemon, config.stat, targetValue, direction);
        if (result) {
            this.applyStatResult(pokemon, config, result);
        }

        // HP実数値が変更された場合は現在HPも更新
        if (config.side === 'defender' && config.stat === 'hp') {
            setTimeout(() => {
                updateCurrentHPFromRealHP();
            }, 100);
        }
    }

    /**
     * 個体値1→0の特別処理
     */
    handleSpecialIV1to0Case(pokemon, config, targetValue, direction) {
        if (pokemon.ivValues[config.stat] !== 1 || direction >= 0) return false;
        
        const statWith0IV = calculateStatWithParams(
            pokemon.baseStats[config.stat], 
            pokemon.level, 
            0, 
            pokemon.evValues[config.stat], 
            pokemon.natureModifiers[config.stat], 
            config.stat === 'hp'
        );
        
        if (statWith0IV <= targetValue) {
            pokemon.ivValues[config.stat] = 0;
            updateIVEVInputs(config.side, config.stat, 0, pokemon.evValues[config.stat]);
            updateStats(config.side);
            return true;
        }
        
        return false;
    }

    /**
     * 入力制限を更新（統合版）
     */
    updateInputLimits(side) {
        const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
        if (!pokemon.name) return;
        const stats = ['hp', 'a', 'b', 'c', 'd', 's'];
        stats.forEach(stat => {
            this.updateSingleStatLimits(side, stat, pokemon);
        });
    }

    /**
     * 個別ステータスの制限を更新
     */
    updateSingleStatLimits(side, stat, pokemon) {
        if (!pokemon.baseStats[stat] || pokemon.baseStats[stat] === 0) {
            return; // ポケモンが選択されていない場合は何もしない
        }

        const limits = calculateStatLimits(pokemon.baseStats[stat], pokemon.level, stat === 'hp');

        // HPの場合は、現在の実数値をmaxに設定
        if (stat === 'hp') {
            const currentHPValue = calculateStatWithParams(
                pokemon.baseStats[stat],
                pokemon.level,
                pokemon.ivValues[stat],
                pokemon.evValues[stat],
                1.0, // HPに性格補正なし
                true // isHP
            );
            limits.max = currentHPValue;
        }

        // メイン入力欄
        const mainId = `${side}Real${stat.toUpperCase()}`;
        this.setInputLimits(mainId, limits);

        // 詳細入力欄
        const detailId = `${side}DetailReal${stat.toUpperCase()}`;
        this.setInputLimits(detailId, limits);
    }

    /**
     * 個別入力欄の制限設定
     */
    setInputLimits(inputId, limits) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        input.setAttribute('min', limits.min);
        input.setAttribute('max', limits.max);
        
        // 現在値が範囲外の場合は修正
        const currentValue = parseInt(input.value) || 0;
        if (currentValue > 0) {
            if (currentValue < limits.min) {
                input.updateValueSilently ? input.updateValueSilently(limits.min) : (input.value = limits.min);
            } else if (currentValue > limits.max) {
                input.updateValueSilently ? input.updateValueSilently(limits.max) : (input.value = limits.max);
            }
        }
    }

    // ユーティリティメソッド（既存の関数を参照）
    calculateCurrentStat(pokemon, stat) {
        const level = pokemon.level;
        const baseStat = pokemon.baseStats[stat];
        const iv = pokemon.ivValues[stat];
        const ev = pokemon.evValues[stat];
        const natureModifier = pokemon.natureModifiers[stat] || 1.0;
        
        return calculateStatWithParams(baseStat, level, iv, ev, natureModifier, stat === 'hp');
    }

    findOptimalStats(pokemon, stat, targetValue) {
        return findOptimalStats(pokemon, stat, targetValue, pokemon.baseStats[stat], pokemon.level);
    }

    /**
     * 個体値優先の最適化処理
     * 実数値を上げる時：個体値31未満なら個体値を優先、31なら努力値
     * 実数値を下げる時：努力値を優先、0なら個体値
     */
    findOptimalStatsIVFirst(pokemon, stat, targetValue, direction) {
        const baseStat = pokemon.baseStats[stat];
        const level = pokemon.level;
        const currentIV = pokemon.ivValues[stat];
        const currentEV = pokemon.evValues[stat];
        const currentNature = pokemon.natureModifiers[stat] || 1.0;
        const isHP = stat === 'hp';       
        // 実数値を上げる場合（direction > 0）
        if (direction > 0) {
            return this.optimizeForIncrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
        }
        // 実数値を下げる場合（direction < 0）
        else if (direction < 0) {
            return this.optimizeForDecrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
        }
        // 方向が不明な場合は従来の処理
        else {
            return findOptimalStats(pokemon, stat, targetValue, baseStat, level);
        }
    }

    /**
     * 実数値を上げる場合の最適化（個体値優先）
     */
    optimizeForIncrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat) {      
        // 1. 個体値が31未満の場合、まず個体値を上げる
        if (currentIV < 31) {       
            // 現在の努力値で個体値を上げて目標に到達できるかチェック
            for (let iv = currentIV + 1; iv <= 31; iv++) {
                const statValue = calculateStatWithParams(baseStat, level, iv, currentEV, currentNature, isHP);            
                if (statValue === targetValue) {

                    return { iv: iv, ev: currentEV, natureMod: currentNature };
                }
                if (statValue > targetValue) {
                    // 前の個体値で努力値調整を試す
                    const prevIV = iv - 1;
                    return this.adjustWithEV(baseStat, level, isHP, prevIV, currentEV, currentNature, targetValue, stat);
                }
            }  
            // 個体値31でも届かない場合、個体値31で努力値調整
            return this.adjustWithEV(baseStat, level, isHP, 31, currentEV, currentNature, targetValue, stat);
        }
        // 2. 個体値が31の場合、努力値を上げる
        else {
            return this.adjustWithEV(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
        }
    }

    /**
     * 実数値を下げる場合の最適化（努力値優先）
     */
    optimizeForDecrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat) {        
        // 1. 努力値が0より大きい場合、まず努力値を下げる
        if (currentEV > 0) {         
            // 現在の個体値で努力値を下げて目標に到達できるかチェック
            for (let ev = currentEV - 4; ev >= 0; ev -= 4) {
                const statValue = calculateStatWithParams(baseStat, level, currentIV, ev, currentNature, isHP);            
                if (statValue === targetValue) {
                    return { iv: currentIV, ev: ev, natureMod: currentNature };
                }
                if (statValue < targetValue) {
                    break;
                }
            }
        }
        // 2. 努力値を0にしても目標に届かない場合、個体値を下げる      
        if (currentIV > 0) {
            for (let iv = currentIV - 1; iv >= 0; iv--) {
                // 各個体値で最適な努力値を探す
                for (let ev = 0; ev <= 252; ev += 4) {
                    const statValue = calculateStatWithParams(baseStat, level, iv, ev, currentNature, isHP);
                    if (statValue === targetValue) {
                        return { iv: iv, ev: ev, natureMod: currentNature };
                    }
                }
            }
        }
        // どうしても達成できない場合は従来の処理にフォールバック
        return findOptimalStats({ 
            baseStats: { [stat]: baseStat }, 
            level: level, 
            ivValues: { [stat]: currentIV }, 
            evValues: { [stat]: currentEV }, 
            natureModifiers: { [stat]: currentNature } 
        }, stat, targetValue, baseStat, level);
    }

    /**
     * 指定された個体値で努力値を調整して目標値を探す
     */
    adjustWithEV(baseStat, level, isHP, iv, currentEV, currentNature, targetValue, stat) {       
        // 現在の努力値から上げる方向で探索
        for (let ev = currentEV; ev <= 252; ev += 4) {
            const statValue = calculateStatWithParams(baseStat, level, iv, ev, currentNature, isHP);           
            if (statValue === targetValue) {
                return { iv: iv, ev: ev, natureMod: currentNature };
            }
            if (statValue > targetValue) {
                break;
            }
        }
        
        // 努力値だけでは達成できない場合、性格変更を含む最適化
        return findOptimalStats({ 
            baseStats: { [stat]: baseStat }, 
            level: level, 
            ivValues: { [stat]: iv }, 
            evValues: { [stat]: currentEV }, 
            natureModifiers: { [stat]: currentNature } 
        }, stat, targetValue, baseStat, level);
    }

    applyStatResult(pokemon, config, result) {
        pokemon.ivValues[config.stat] = result.iv;
        pokemon.evValues[config.stat] = result.ev;
        
        if (result.changeNature && result.natureMod !== undefined && config.stat !== 'hp') {
            pokemon.natureModifiers[config.stat] = result.natureMod;
            this.updateNatureUI(config.side, config.stat, result.natureMod);
        }
        
        updateIVEVInputs(config.side, config.stat, result.iv, result.ev);
        updateStats(config.side);
    }

    updateNatureUI(side, stat, natureMod) {
        // 性格UI更新の処理（既存コードから移動）
        if ((side === 'attacker' && (stat === 'a' || stat === 'c')) ||
            (side === 'defender' && (stat === 'b' || stat === 'd'))) {
            updateMainNatureButtons(side, stat, natureMod);
        }
        
        const plusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Plus`);
        const minusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Minus`);
        
        if (plusCheckbox && minusCheckbox) {
            if (natureMod === 1.1) {
                plusCheckbox.checked = true;
                minusCheckbox.checked = false;
            } else if (natureMod === 0.9) {
                plusCheckbox.checked = false;
                minusCheckbox.checked = true;
            } else {
                plusCheckbox.checked = false;
                minusCheckbox.checked = false;
            }
        }
        
        updateNatureFromModifiers(side);
    }
}

// グローバルインスタンス
const realStatManager = new RealStatInputManager();

// 初期化時に呼び出す関数を更新
function setupRealStatInputListeners() {
    realStatManager.initializeRealStatInputs();
    setupHPRealStatChangeListener();
}

// HP実数値変更時の現在HP自動更新処理
function setupHPRealStatChangeListener() {
    // メイン画面のHP実数値入力欄
    const defenderRealHP = document.getElementById('defenderRealHP');
    if (defenderRealHP) {
        defenderRealHP.addEventListener('input', function() {
            updateCurrentHPFromRealHP();
        });
        
        defenderRealHP.addEventListener('change', function() {
            updateCurrentHPFromRealHP();
        });
    }
    
    // 詳細設定のHP実数値入力欄
    const defenderDetailRealHP = document.getElementById('defenderDetailRealHP');
    if (defenderDetailRealHP) {
        defenderDetailRealHP.addEventListener('input', function() {
            updateCurrentHPFromRealHP();
        });
        
        defenderDetailRealHP.addEventListener('change', function() {
            updateCurrentHPFromRealHP();
        });
    }
}

/**
 * 個別の実数値入力要素を設定（修正版）
 */
function setupRealStatInputFixed({ id, side, stat, type }) {
    const input = document.getElementById(id);
    if (!input) return;

    // ★修正：新しい要素に置き換えずに、既存の要素にイベントリスナーを追加
    let previousValue = parseInt(input.value) || 0;
    const updateKey = id;

    // ★重要：既存のupdateValueSilently関数があれば保持、なければ作成
    if (!input.updateValueSilently) {
        input.updateValueSilently = (newValue) => {
            if (realStatManager && realStatManager.isUpdating) {
                realStatManager.isUpdating.add(updateKey);
            }
            input.value = newValue;
            previousValue = parseInt(newValue) || 0;
            if (realStatManager && realStatManager.isUpdating) {
                realStatManager.isUpdating.delete(updateKey);
            }
        };
    }

    // ★修正：既存のinputイベントリスナーと干渉しないよう、モバイル専用の処理を分離
    const mobileInputHandler = function(e) {
        // モバイルコントロールからの変更の場合はスキップ
        if (mobileControlState.isActive && mobileControlState.activeInput === this) {
            return;
        }
        
        // デスクトップまたは通常のスピンボタン操作の場合は既存の処理を実行
        if (window.innerWidth > 768) {
            // 既存のスピンボタン機能をここで実行
            const currentValue = parseInt(e.target.value) || 0;
            const direction = getChangeDirection(currentValue, previousValue);
            
            if (direction !== 0) {
                if (realStatManager && realStatManager.isUpdating) {
                    realStatManager.isUpdating.add(updateKey);
                }
                handleRealStatChange({ id, side, stat, type }, currentValue, direction);
                if (realStatManager && realStatManager.isUpdating) {
                    realStatManager.isUpdating.delete(updateKey);
                }
                previousValue = currentValue;
            }
        }
    };

    // input イベントリスナーを追加（既存のリスナーとは別に）
    input.addEventListener('input', mobileInputHandler);

    // change イベントも同様に処理
    const mobileChangeHandler = function(e) {
        if (mobileControlState.isActive && mobileControlState.activeInput === this) {
            return;
        }
        
        if (window.innerWidth > 768) {
            const currentValue = parseInt(e.target.value) || 0;
            if (currentValue !== previousValue) {
                if (realStatManager && realStatManager.isUpdating) {
                    realStatManager.isUpdating.add(updateKey);
                }
                handleRealStatChange({ id, side, stat, type }, currentValue, 0);
                if (realStatManager && realStatManager.isUpdating) {
                    realStatManager.isUpdating.delete(updateKey);
                }
                previousValue = currentValue;
            }
        }
    };

    input.addEventListener('change', mobileChangeHandler);

    // ★修正：スピンボタンの特殊処理も保持
    setupSpinButtonHandlingFixed(input, { id, side, stat, type });
}

// HP実数値から現在HPを更新する
function updateCurrentHPFromRealHP() {
    const currentHPInput = document.getElementById('defenderCurrentHP');
    if (!currentHPInput) return;
    
    // メイン画面と詳細設定の両方からHP実数値を取得
    const mainRealHP = document.getElementById('defenderRealHP');
    const detailRealHP = document.getElementById('defenderDetailRealHP');
    
    let newMaxHP = 0;
    
    // メイン画面の値を優先
    if (mainRealHP && mainRealHP.value) {
        newMaxHP = parseInt(mainRealHP.value) || 0;
    } else if (detailRealHP && detailRealHP.value) {
        newMaxHP = parseInt(detailRealHP.value) || 0;
    }
    
    if (newMaxHP > 0) {
        const previousMaxHP = parseInt(currentHPInput.getAttribute('data-max-hp')) || 0;
        
        // HP実数値が変更された場合は常に現在HPを最大HPにリセット
        if (newMaxHP !== previousMaxHP) {
            currentHPInput.value = newMaxHP;
        }
        
        // 新しい最大HPを記録
        currentHPInput.setAttribute('data-max-hp', newMaxHP);
        currentHPInput.setAttribute('max', newMaxHP);
        currentHPInput.setAttribute('min', 1);
    }
}

// ポケモン選択時の制限更新
function updateAllRealStatInputLimits(side) {
    realStatManager.updateInputLimits(side);
}

// 個別ステータスの制限更新（新規追加）
function updateRealStatInputLimits(side, stat) {
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    if (!pokemon.name || !pokemon.baseStats[stat] || pokemon.baseStats[stat] === 0) {
        return;
    }
    
    const limits = calculateStatLimits(pokemon.baseStats[stat], pokemon.level, stat === 'hp');
    
    // メイン入力欄
    const mainId = `${side}Real${stat.toUpperCase()}`;
    const mainInput = document.getElementById(mainId);
    if (mainInput) {
        mainInput.setAttribute('min', limits.min);
        mainInput.setAttribute('max', limits.max);
        
        const currentValue = parseInt(mainInput.value) || 0;
        if (currentValue > 0) {
            if (currentValue < limits.min) {
                if (mainInput.updateValueSilently) {
                    mainInput.updateValueSilently(limits.min);
                } else {
                    mainInput.value = limits.min;
                }
            } else if (currentValue > limits.max) {
                if (mainInput.updateValueSilently) {
                    mainInput.updateValueSilently(limits.max);
                } else {
                    mainInput.value = limits.max;
                }
            }
        }
    }
    
    // 詳細設定の実数値入力欄
    const detailId = `${side}DetailReal${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailId);
    if (detailInput) {
        detailInput.setAttribute('min', limits.min);
        detailInput.setAttribute('max', limits.max);
        
        const currentValue = parseInt(detailInput.value) || 0;
        if (currentValue > 0) {
            if (currentValue < limits.min) {
                if (detailInput.updateValueSilently) {
                    detailInput.updateValueSilently(limits.min);
                } else {
                    detailInput.value = limits.min;
                }
            } else if (currentValue > limits.max) {
                if (detailInput.updateValueSilently) {
                    detailInput.updateValueSilently(limits.max);
                } else {
                    detailInput.value = limits.max;
                }
            }
        }
    }
}

// 制限クリア
function clearRealStatInputLimits(side) {
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const mainId = `${side}Real${stat.toUpperCase()}`;
        const detailId = `${side}DetailReal${stat.toUpperCase()}`;
        
        [mainId, detailId].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.removeAttribute('min');
                input.removeAttribute('max');
            }
        });
    });
}

// 結果が有効かチェックする関数
function isValidResult(result, targetValue, baseStat, level, isHP) {
  if (!result) return false;
  
  // 結果から実際の実数値を計算（性格補正も考慮）
  const actualStat = calculateStatWithParams(
    baseStat, 
    level, 
    result.iv, 
    result.ev, 
    result.natureMod || 1.0,  // ここが重要：result.natureModを使用
    isHP
  );
  
  // 目標値と一致するか確認
  return actualStat === targetValue;
}

// HP実数値を取得してpinch系の入力欄に設定する関数
function updatePinchHPValues() {
  // 攻撃側のHP実数値を取得
  const attackerHP = parseInt(document.getElementById('attackerDetailRealHP').value) || 0;
  
  if (attackerHP > 0) {
    // pinchUp（きしかいせい・じたばた）用
    const pinchUpMaxHP = document.getElementById('pinchUp_maxHP');
    if (pinchUpMaxHP) {
      pinchUpMaxHP.value = attackerHP;
    }
    
    // pinchDown（しおふき・ふんか）用
    const pinchDownCurrentHP = document.getElementById('pinchDown_currentHP');
    const pinchDownMaxHP = document.getElementById('pinchDown_maxHP');
    if (pinchDownCurrentHP) {
      pinchDownCurrentHP.value = attackerHP;
    }
    if (pinchDownMaxHP) {
      pinchDownMaxHP.value = attackerHP;
    }
  }
}

// 最適な個体値・努力値・性格補正を探す関数
function findOptimalStats(pokemon, stat, targetValue, baseStat, level) {
    const currentIV = pokemon.ivValues[stat];
    const currentEV = pokemon.evValues[stat];
    const currentNature = pokemon.natureModifiers[stat] || 1.0;
    const isHP = stat === 'hp';  
    // calculateOptimalIVEVを呼び出して最適解を探す
    const result = calculateOptimalIVEV(targetValue, baseStat, level, currentNature, isHP, currentIV, currentEV);
   
    return result;
}

// 現在のステータスを計算
function calculateCurrentStat(pokemon, stat) {
  const level = pokemon.level;
  const baseStat = pokemon.baseStats[stat];
  const iv = pokemon.ivValues[stat];
  const ev = pokemon.evValues[stat];
  const natureModifier = pokemon.natureModifiers[stat] || 1.0;
  
  return calculateStatWithParams(baseStat, level, iv, ev, natureModifier, stat === 'hp');
}

// パラメータから実数値を計算
function calculateStatWithParams(baseStat, level, iv, ev, natureModifier, isHP) {
  if (isHP) {
    const base = baseStat * 2 + iv + Math.floor(ev / 4);
    const levelCalc = Math.floor(base * level / 100);
    return levelCalc + level + 10;
  } else {
    const base = baseStat * 2 + iv + Math.floor(ev / 4);
    const levelCalc = Math.floor(base * level / 100);
    const beforeNature = levelCalc + 5;
    return Math.floor(beforeNature * natureModifier);
  }
}

// スピンボタンの動作に最適化した個体値・努力値計算
function calculateOptimalIVEV(targetRealStat, baseStat, level, natureModifier, isHP, currentIV, currentEV) { 
  // 実数値計算関数
  const calculateStat = (iv, ev, natureMod) => {
    return calculateStatWithParams(baseStat, level, iv, ev, natureMod, isHP);
  };
  
  // 現在の実数値
  const currentRealStat = calculateStat(currentIV, currentEV, natureModifier);
  
  // 実現可能性チェック
  const limits = calculateStatLimits(baseStat, level, isHP);
  if (targetRealStat < limits.min || targetRealStat > limits.max) {
    return null;
  }
  
  // 特殊ケース1は削除（自動性格補正をしない）
  
  // 特殊ケース2は削除（自動性格補正をしない）
  
  // 新しい特殊ケースも削除（自動性格補正をしない）
  
  // 特殊ケース3: 性格補正0.9で実数値を下げる場合（個体値1→0の処理）
if (!isHP && natureModifier === 0.9 && targetRealStat < currentRealStat) { 
  // まず努力値を減らして調整を試す
  if (currentEV > 0) {
    for (let ev = currentEV - 4; ev >= 0; ev -= 4) {
      const stat = calculateStat(currentIV, ev, 0.9);
      if (stat === targetRealStat) {
        return { iv: currentIV, ev: ev, natureMod: 0.9 };
      }
      if (stat < targetRealStat) break;
    }
  }
  
  // 努力値を減らしても目標に届かない場合、個体値を減らす
  if (currentIV > 0) {
    for (let iv = currentIV - 1; iv >= 0; iv--) {
      // 各個体値で最適な努力値を探す
      for (let ev = 0; ev <= 252; ev += 4) {
        const stat = calculateStat(iv, ev, 0.9);
        if (stat === targetRealStat) {
          return { iv: iv, ev: ev, natureMod: 0.9 };
        }
      }
    }
    
    // 特別ケース：個体値1→0（実数値が同じでも許可）
    if (currentIV === 1) {
      const stat0 = calculateStat(0, currentEV, 0.9);
      const stat1 = calculateStat(1, currentEV, 0.9);
      if (stat0 === stat1) {
        return { iv: 0, ev: currentEV, natureMod: 0.9 };
      }
    }
  }
}
  
  // 実数値を上げる場合の処理
  if (targetRealStat > currentRealStat) {   
    // 性格補正0.9の場合は努力値を優先的に調整
    if (!isHP && natureModifier === 0.9) {      
      // まず努力値を増やして調整を試す（個体値は現在のまま）
      if (currentEV < 252) {
        for (let ev = currentEV + 4; ev <= 252; ev += 4) {
          const stat = calculateStat(currentIV, ev, 0.9);
          if (stat === targetRealStat) {
            return { iv: currentIV, ev: ev, natureMod: 0.9 };
          }
          if (stat > targetRealStat) {
            break;
          }
        }
      }
      
      // 努力値252でも届かない場合、個体値を上げる
      if (currentIV < 31) {
        for (let iv = currentIV + 1; iv <= 31; iv++) {
          // 努力値は0から252まで探索
          for (let ev = 0; ev <= 252; ev += 4) {
            const stat = calculateStat(iv, ev, 0.9);
            if (stat === targetRealStat) {
              return { iv: iv, ev: ev, natureMod: 0.9 };
            }
          }
        }
      }
      
      // 性格補正0.9では届かない場合、性格補正を上げる
      const higherNatureStat = calculateStat(31, 252, 1.0);
      if (higherNatureStat >= targetRealStat) {
        // 性格補正を1.0に変更して努力値を減らして調整
        for (let ev = 252; ev >= 0; ev -= 4) {
          const stat = calculateStat(31, ev, 1.0);
          if (stat === targetRealStat) {
            return { iv: 31, ev: ev, natureMod: 1.0, changeNature: true };
          }
        }
        
        // 努力値を減らしても目標に合わない場合、個体値も調整
        for (let iv = 0; iv <= 31; iv++) {
          for (let ev = 0; ev <= 252; ev += 4) {
            const stat = calculateStat(iv, ev, 1.0);
            if (stat === targetRealStat) {
              return { iv: iv, ev: ev, natureMod: 1.0, changeNature: true };
            }
          }
        }
      }
    } else {
      // 性格補正1.0または1.1の場合は個体値優先    
      // まず個体値を上げて調整を試す（努力値は現在のまま）
      if (currentIV < 31) {

        for (let iv = currentIV + 1; iv <= 31; iv++) {
          const stat = calculateStat(iv, currentEV, natureModifier);
          if (stat === targetRealStat) {
            return { iv: iv, ev: currentEV, natureMod: natureModifier };
          }
          if (stat > targetRealStat) {
            break;
          }
        }
      }
      
      // 個体値31の場合、または個体値を上げても届かない場合は努力値を増やす
      if (currentIV === 31 || currentEV < 252) {
        const useIV = currentIV === 31 ? 31 : currentIV;
        
        for (let ev = currentEV + 4; ev <= 252; ev += 4) {
          const stat = calculateStat(useIV, ev, natureModifier);
          if (stat === targetRealStat) {
            return { iv: useIV, ev: ev, natureMod: natureModifier };
          }
          if (stat > targetRealStat) {
            break;
          }
        }
      }
      
      // 個体値31、努力値252でも届かない場合は性格補正を上げる
      if (!isHP && natureModifier < 1.1) {
        const higherNatureStat = calculateStat(31, 252, natureModifier === 0.9 ? 1.0 : 1.1);
        if (higherNatureStat >= targetRealStat) {
          // 性格補正を上げて努力値を減らして調整
          const newNature = natureModifier === 0.9 ? 1.0 : 1.1;
          
          for (let ev = 252; ev >= 0; ev -= 4) {
            const stat = calculateStat(31, ev, newNature);
            if (stat === targetRealStat) {
              return { iv: 31, ev: ev, natureMod: newNature, changeNature: true };
            }
          }
          
          // 個体値優先で探索
          for (let iv = 0; iv <= 31; iv++) {
            for (let ev = 0; ev <= 252; ev += 4) {
              const stat = calculateStat(iv, ev, newNature);
              if (stat === targetRealStat) {
                return { iv: iv, ev: ev, natureMod: newNature, changeNature: true };
              }
            }
          }
        }
      }
    }
  }
  
  // 実数値を下げる場合の処理
  if (targetRealStat < currentRealStat) {
    // 性格補正が不利（0.9）ではない場合、まず性格補正を変更できるか検討
    if (!isHP && natureModifier > 0.9) {
      // 現在の個体値・努力値で性格補正を下げた場合の実数値を計算
      const lowerNatureStat = calculateStat(currentIV, currentEV, natureModifier === 1.1 ? 1.0 : 0.9);
      if (lowerNatureStat === targetRealStat) {
        return { iv: currentIV, ev: currentEV, natureMod: natureModifier === 1.1 ? 1.0 : 0.9, changeNature: true };
      }
    }
    
    // 努力値を減らす
    if (currentEV > 0) {
      for (let ev = currentEV - 4; ev >= 0; ev -= 4) {
        const stat = calculateStat(currentIV, ev, natureModifier);
        if (stat === targetRealStat) {
          return { iv: currentIV, ev: ev, natureMod: natureModifier };
        }
        if (stat < targetRealStat) break;
      }
    }
    
    // 個体値を減らす
    if (currentIV > 0) {
      for (let iv = currentIV - 1; iv >= 0; iv--) {
        const stat = calculateStat(iv, currentEV, natureModifier);
        if (stat === targetRealStat) {
          return { iv: iv, ev: currentEV, natureMod: natureModifier };
        }
        if (stat < targetRealStat) break;
      }
    }
  }
  
  // 全探索（最適解を見つける）- 性格補正による優先順位変更
  let bestResult = null;
  let minChanges = Infinity;
  
  const natureOptions = isHP ? [1.0] : [0.9, 1.0, 1.1];
  
  for (const natureMod of natureOptions) {
    for (let iv = 0; iv <= 31; iv++) {
      for (let ev = 0; ev <= 252; ev += 4) {
        const stat = calculateStat(iv, ev, natureMod);
        if (stat === targetRealStat) {
          // 変更数を計算（性格補正0.9の場合は努力値優先、それ以外は個体値優先）
          let changes = 0;
          if (natureModifier === 0.9) {
            // 性格補正0.9の場合：努力値 < 個体値 < 性格の優先順位
            if (ev !== currentEV) changes += 1;  // 努力値の優先度を最高に
            if (iv !== currentIV) changes += 2;  // 個体値の優先度を中に
            if (natureMod !== natureModifier) changes += 3;  // 性格の優先度を最低に
          } else {
            // その他の場合：個体値 < 努力値 < 性格の優先順位
            if (iv !== currentIV) changes += 1;  // 個体値の優先度を最高に
            if (ev !== currentEV) changes += 2;  // 努力値の優先度を中に
            if (natureMod !== natureModifier) changes += 3;  // 性格の優先度を最低に
          }
          
          if (changes < minChanges) {
            minChanges = changes;
            bestResult = { 
              iv: iv, 
              ev: ev, 
              natureMod: natureMod, 
              changeNature: natureMod !== natureModifier 
            };
          }
        }
      }
    }
  }
  return bestResult;
}

// 実数値の上限・下限を計算
function calculateStatLimits(baseStat, level, isHP = false) {
  if (isHP) {
    // HPの場合
    const minBase = baseStat * 2 + 0 + 0; // IV0, EV0
    const minLevel = Math.floor(minBase * level / 100);
    const minStat = minLevel + level + 10;
    
    const maxBase = baseStat * 2 + 31 + Math.floor(252 / 4); // IV31, EV252
    const maxLevel = Math.floor(maxBase * level / 100);
    const maxStat = maxLevel + level + 10;
    
    const result = { min: minStat, max: maxStat };;
    return result;
  } else {
    // HP以外の場合
    const minBase = baseStat * 2 + 0 + 0; // IV0, EV0
    const minLevel = Math.floor(minBase * level / 100);
    const minBeforeNature = minLevel + 5;
    const minStat = Math.floor(minBeforeNature * 90 / 100); // 性格補正0.9
    
    const maxBase = baseStat * 2 + 31 + Math.floor(252 / 4); // IV31, EV252
    const maxLevel = Math.floor(maxBase * level / 100);
    const maxBeforeNature = maxLevel + 5;
    const maxStat = Math.floor(maxBeforeNature * 110 / 100); // 性格補正1.1

    const result = { min: minStat, max: maxStat };
    return result;
  }
}

// 現在選択されている性格補正に基づいて制限を計算する関数
function calculateStatLimitsWithNature(baseStat, level, natureMod, isHP = false) {
  if (isHP) {
    // HPの場合（性格補正なし）
    return calculateStatLimits(baseStat, level, true);
  } else {
    // HP以外の場合、現在の性格補正でのみ計算
    const minBase = baseStat * 2 + 0 + 0; // IV0, EV0
    const minLevel = Math.floor(minBase * level / 100);
    const minBeforeNature = minLevel + 5;
    const minStat = Math.floor(minBeforeNature * natureMod);
    
    const maxBase = baseStat * 2 + 31 + Math.floor(252 / 4); // IV31, EV252
    const maxLevel = Math.floor(maxBase * level / 100);
    const maxBeforeNature = maxLevel + 5;
    const maxStat = Math.floor(maxBeforeNature * natureMod);

    const result = { min: minStat, max: maxStat };
    return result;
  }
}

// 個体値・努力値のUIを更新する関数
function updateIVEVInputs(side, stat, iv, ev) {
  const statUpper = stat.toUpperCase();
  
  // メイン画面の個体値
  const mainIvInput = document.getElementById(`${side}Iv${statUpper}`);
  if (mainIvInput) {
    mainIvInput.value = iv;
    updateIVButton(mainIvInput);
  }
  
  // メイン画面の努力値
  const mainEvInput = document.getElementById(`${side}Ev${statUpper}`);
  if (mainEvInput) {
    mainEvInput.value = ev;
    updateEVButton(mainEvInput);
  }
  
  // 詳細設定の個体値
  const detailIvInput = document.getElementById(`${side}DetailIv${statUpper}`);
  if (detailIvInput) {
    detailIvInput.value = iv;
    updateDetailIVButton(detailIvInput);
  }
  
  // 詳細設定の努力値
  const detailEvInput = document.getElementById(`${side}DetailEv${statUpper}`);
  if (detailEvInput) {
    detailEvInput.value = ev;
    updateDetailEVButton(detailEvInput);
  }
  
  // ポケモンオブジェクトの値も更新
  const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
  pokemon.ivValues[stat] = iv;
  pokemon.evValues[stat] = ev;
}

// 全ての実数値入力欄の制限を更新する関数
function updateAllRealStatInputLimits(side) {
  const stats = ['hp', 'a', 'b', 'c', 'd', 's'];
  stats.forEach(stat => {
    updateRealStatInputLimits(side, stat);
  });
}

// 個別ステータスの制限更新（新規追加）
function updateRealStatInputLimits(side, stat) {
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    if (!pokemon.name || !pokemon.baseStats[stat] || pokemon.baseStats[stat] === 0) {
        return;
    }
    
    const limits = calculateStatLimits(pokemon.baseStats[stat], pokemon.level, stat === 'hp');
    
    // メイン入力欄
    const mainId = `${side}Real${stat.toUpperCase()}`;
    const mainInput = document.getElementById(mainId);
    if (mainInput) {
        mainInput.setAttribute('min', limits.min);
        mainInput.setAttribute('max', limits.max);
        
        const currentValue = parseInt(mainInput.value) || 0;
        if (currentValue > 0) {
            if (currentValue < limits.min) {
                if (mainInput.updateValueSilently) {
                    mainInput.updateValueSilently(limits.min);
                } else {
                    mainInput.value = limits.min;
                }
            } else if (currentValue > limits.max) {
                if (mainInput.updateValueSilently) {
                    mainInput.updateValueSilently(limits.max);
                } else {
                    mainInput.value = limits.max;
                }
            }
        }
    }
    
    // 詳細設定の実数値入力欄
    const detailId = `${side}DetailReal${stat.toUpperCase()}`;
    const detailInput = document.getElementById(detailId);
    if (detailInput) {
        detailInput.setAttribute('min', limits.min);
        detailInput.setAttribute('max', limits.max);
        
        const currentValue = parseInt(detailInput.value) || 0;
        if (currentValue > 0) {
            if (currentValue < limits.min) {
                if (detailInput.updateValueSilently) {
                    detailInput.updateValueSilently(limits.min);
                } else {
                    detailInput.value = limits.min;
                }
            } else if (currentValue > limits.max) {
                if (detailInput.updateValueSilently) {
                    detailInput.updateValueSilently(limits.max);
                } else {
                    detailInput.value = limits.max;
                }
            }
        }
    }
}

// 入力制限をクリアする関数
function clearRealStatInputLimits(side) {
    ['hp', 'a', 'b', 'c', 'd', 's'].forEach(stat => {
        const mainId = `${side}Real${stat.toUpperCase()}`;
        const detailId = `${side}DetailReal${stat.toUpperCase()}`;
        
        [mainId, detailId].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.removeAttribute('min');
                input.removeAttribute('max');
            }
        });
    });
}

// ========================
// 6. ダメージ計算
// ========================

// 威力計算
function calculateIceBallPower(turn, usedDefenseCurl) {
    const boundedTurn = Math.max(1, Math.min(5, parseInt(turn) || 1));
    const defenseCurlMultiplier = usedDefenseCurl ? 2 : 1;
    return 30 * Math.pow(2, boundedTurn - 1) * defenseCurlMultiplier;
}

function calculateFuryCutterPower(successCount) {
    const boundedCount = Math.max(1, Math.min(5, parseInt(successCount) || 1));
    return 10 * Math.pow(2, boundedCount - 1);
}

function calculateRageAttackRank(baseRank, hitCount) {
    const parsedRank = baseRank === '±0' ? 0 : parseInt(baseRank) || 0;
    const boundedHitCount = Math.max(0, Math.min(6, parseInt(hitCount) || 0));
    const finalRank = Math.max(-6, Math.min(6, parsedRank + boundedHitCount));

    if (finalRank > 0) return `+${finalRank}`;
    if (finalRank === 0) return '±0';
    return finalRank.toString();
}

function calculateSpitUpDamage(baseDamage, stockpileCount) {
    const boundedCount = Math.max(1, Math.min(3, parseInt(stockpileCount) || 1));
    return baseDamage * boundedCount;
}

function calculatePsywaveDamageValues(level) {
    const boundedLevel = Math.max(1, Math.min(100, parseInt(level) || 1));
    return Array.from({ length: 11 }, (_value, index) => {
        return Math.max(1, Math.floor(boundedLevel * (50 + index * 10) / 100));
    });
}

function getPresentOutcomes(defenderMaxHP) {
    const healAmount = Math.max(1, Math.floor(defenderMaxHP / 4));
    return [
        { kind: 'damage', power: 40, probability: 0.4 },
        { kind: 'damage', power: 80, probability: 0.3 },
        { kind: 'damage', power: 120, probability: 0.1 },
        { kind: 'heal', amount: healAmount, probability: 0.2 }
    ];
}

function isPresentHealingSelected(move) {
    return move && move.class === 'present' &&
           document.getElementById('presentOutcome')?.value === 'heal';
}

function getTripleKickPowers() {
    return [10, 20, 30];
}

function getTripleKickHitProbabilities(accuracy) {
    const hitRate = Math.max(0, Math.min(100, Number(accuracy) || 0)) / 100;
    const missRate = 1 - hitRate;
    return [
        missRate,
        hitRate * missRate,
        hitRate * hitRate * missRate,
        hitRate * hitRate * hitRate
    ];
}

function getSelectedTripleKickHitCount() {
    const selected = parseInt(document.getElementById('tripleKickHits')?.value) || 3;
    return Math.max(1, Math.min(3, selected));
}

function sumDamageRanges(ranges) {
    return ranges.reduce((total, range) => {
        total[0] += range[0];
        total[1] += range[1];
        return total;
    }, [0, 0]);
}

function parseBeatUpMembers(value, fallbackLevel, fallbackBaseAttack) {
    const members = String(value || '')
        .split(/[,、\n]/)
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
            const [levelText, baseAttackText] = entry.split(/[:：]/);
            const level = parseInt(levelText);
            const baseAttack = parseInt(baseAttackText);
            if (!Number.isFinite(level) || level < 1 || level > 100 ||
                !Number.isFinite(baseAttack) || baseAttack < 1 || baseAttack > 255) {
                return null;
            }
            return { level, baseAttack };
        })
        .filter(Boolean)
        .slice(0, 6);

    if (members.length > 0) {
        return members;
    }

    return [{
        level: Math.max(1, Math.min(100, parseInt(fallbackLevel) || 50)),
        baseAttack: Math.max(1, Math.min(255, parseInt(fallbackBaseAttack) || 1))
    }];
}

function calculateBeatUpMemberDamage(level, baseAttack, defenderBaseDefense) {
    const levelFactor = Math.floor(level * 2 / 5) + 2;
    let damage = baseAttack * 10 * levelFactor;
    damage = Math.floor(damage / Math.max(1, defenderBaseDefense));
    damage = Math.floor(damage / 50);
    return damage + 2;
}

function calculateBeatUpTotalDamage(members, defenderBaseDefense, helpingHand = false, critical = false) {
    return members.reduce((total, member) => {
        let damage = calculateBeatUpMemberDamage(
            member.level,
            member.baseAttack,
            defenderBaseDefense
        );
        if (helpingHand) {
            damage = Math.floor(damage * 1.5);
        }
        if (critical) {
            damage *= 2;
        }
        return total + damage;
    }, 0);
}

function calculatePower(move) {
    // きしかいせい・じたばた
    if (move.class === 'pinch_up') {
        const currentHP = parseInt(document.getElementById('pinchUp_currentHP')?.value) || 1;
        const maxHP = parseInt(document.getElementById('pinchUp_maxHP')?.value) || 100;
        const HPrate = Math.floor(currentHP * 48 / maxHP);
        
        if (HPrate >= 33) return 20;
        else if (HPrate >= 17) return 40;
        else if (HPrate >= 10) return 80;
        else if (HPrate >= 5) return 100;
        else if (HPrate >= 2) return 150;
        else return 200;
    }
    // ふんか・しおふき
    else if (move.class === 'pinch_down') {
        const currentHP = parseInt(document.getElementById('pinchDown_currentHP').value);
        const maxHP = parseInt(document.getElementById('pinchDown_maxHP').value);
        const pinchDownPower = Math.floor(150 * currentHP / maxHP);
        return pinchDownPower;
    }

    else if (move.class === 'awaken_power'){
        return calculateHiddenPowerBP();
    }
    // けたぐり・くさむすび・じゅうりょくは
    else if (move.class === 'weight_based') {
        const defenderWeight = getDefenderWeight();
        
        if (defenderWeight < 10.0) return 20;
        else if (defenderWeight < 25.0) return 40;
        else if (defenderWeight < 50.0) return 60;
        else if (defenderWeight < 100.0) return 80;
        else if (defenderWeight < 200.0) return 100;
        else return 120;
    }
    else if (move.class === 'ice_ball') {
        const turn = document.getElementById('iceBallTurn')?.value || 1;
        const usedDefenseCurl = document.getElementById('defenseCurlCheck')?.checked || false;
        return calculateIceBallPower(turn, usedDefenseCurl);
    }
    else if (move.class === 'fury_cutter') {
        const successCount = document.getElementById('furyCutterCount')?.value || 1;
        return calculateFuryCutterPower(successCount);
    }
    else if (move.class === 'present') {
        const outcome = document.getElementById('presentOutcome')?.value || '40';
        return outcome === 'heal' ? 0 : parseInt(outcome);
    }

    return move.power || 0;
}

// 防御側ポケモンの重さを取得する関数
function getDefenderWeight() {
    const defenderName = defenderPokemon.name;
    if (!defenderName) {
        console.warn('防御側ポケモンが選択されていません');
        return 50.0; // デフォルト値
    }
    
    const pokemonData = allPokemonData.find(p => p.name === defenderName);
    if (!pokemonData || !pokemonData.weight) {
        console.warn(`ポケモン「${defenderName}」の重さが見つかりません`);
        return 50.0; // デフォルト値
    }
    
    return pokemonData.weight;
}

// めざめるパワーの威力計算
function calculateHiddenPowerBP() {
    // 攻撃側ポケモンの個体値を取得（正しい順序：H-A-B-C-D-S）
    const ivs = {
        hp: parseInt(document.getElementById('attackerDetailIvHP').value),
        a: parseInt(document.getElementById('attackerDetailIvA').value),
        b: parseInt(document.getElementById('attackerDetailIvB').value),
        c: parseInt(document.getElementById('attackerDetailIvC').value),
        d: parseInt(document.getElementById('attackerDetailIvD').value),
        s: parseInt(document.getElementById('attackerDetailIvS').value)
    };
    
    // 威力計算 (各個体値を4で割った余りが2以上かどうか)
    let powerSum = 0;
    if (ivs.hp % 4 >= 2) powerSum += 1;
    if (ivs.a % 4 >= 2) powerSum += 2;
    if (ivs.b % 4 >= 2) powerSum += 4;
    if (ivs.s % 4 >= 2) powerSum += 8;   // SとCの順序を修正
    if (ivs.c % 4 >= 2) powerSum += 16;  // SとCの順序を修正
    if (ivs.d % 4 >= 2) powerSum += 32;
    
    const power = Math.floor(powerSum * 40 / 63) + 30;
    return power;
}


// めざめるパワーのタイプ計算
function calculateHiddenPowerType() {
    // 攻撃側ポケモンの個体値を取得（正しい順序：H-A-B-C-D-S）
    const ivs = {
        hp: parseInt(document.getElementById('attackerDetailIvHP').value),
        a: parseInt(document.getElementById('attackerDetailIvA').value),
        b: parseInt(document.getElementById('attackerDetailIvB').value),
        c: parseInt(document.getElementById('attackerDetailIvC').value),
        d: parseInt(document.getElementById('attackerDetailIvD').value),
        s: parseInt(document.getElementById('attackerDetailIvS').value)
    };
    
    // タイプ計算 (各個体値が奇数かどうか)
    let typeSum = 0;
    if (ivs.hp % 2 === 1) typeSum += 1;
    if (ivs.a % 2 === 1) typeSum += 2;
    if (ivs.b % 2 === 1) typeSum += 4;
    if (ivs.s % 2 === 1) typeSum += 8;
    if (ivs.c % 2 === 1) typeSum += 16;
    if (ivs.d % 2 === 1) typeSum += 32;
    
    const typeIndex = Math.floor(typeSum * 15 / 63);
    
    // タイプの対応表
    const typeTable = [
        'かくとう', // 0
        'ひこう',   // 1
        'どく',     // 2
        'じめん',   // 3
        'いわ',     // 4
        'むし',     // 5
        'ゴースト', // 6
        'はがね',   // 7
        'ほのお',   // 8
        'みず',     // 9
        'くさ',     // 10
        'でんき',   // 11
        'エスパー', // 12
        'こおり',   // 13
        'ドラゴン', // 14
        'あく'      // 15
    ];
    
    return typeTable[typeIndex];
}

// 3世代のタイプから物理/特殊を判定
function getGen3CategoryByType(type) {
    // 物理タイプ
    const physicalTypes = ['ノーマル', 'かくとう', 'どく', 'じめん', 'ひこう', 'むし', 'いわ', 'ゴースト', 'はがね'];
    
    // 特殊タイプ
    const specialTypes = ['ほのお', 'みず', 'でんき', 'くさ', 'こおり', 'エスパー', 'ドラゴン', 'あく'];
    
    if (physicalTypes.includes(type)) {
        return 'Physical';
    } else if (specialTypes.includes(type)) {
        return 'Special';
    } else {
        // デフォルトは特殊
        return 'Special';
    }
}

// めざめるパワーのタイプ更新が必要かチェック
function updateHiddenPowerIfNeeded() {
   
    // 現在選択されている技がめざめるパワーの場合
    if (currentMove && currentMove.class === 'awaken_power') {
        const newType = calculateHiddenPowerType();
        const newPower = calculateHiddenPowerBP();
        
        currentMove.type = newType;
        currentMove.category = getGen3CategoryByType(newType);
        currentMove.power = newPower;
    }
    
    // 複数ターン技でめざめるパワーがある場合
    for (let i = 0; i < multiTurnMoves.length; i++) {
        if (multiTurnMoves[i] && multiTurnMoves[i].class === 'awaken_power') {
            const newType = calculateHiddenPowerType();
            const newPower = calculateHiddenPowerBP();
            
            multiTurnMoves[i].type = newType;
            multiTurnMoves[i].category = getGen3CategoryByType(newType);
            multiTurnMoves[i].power = newPower;  // ← この行を追加
        }
    }
}

// 定数ダメージ計算
function calculateStatusDamage(maxHP, statusType, turn) {
    switch (statusType) {
        case 'burn':
        case 'poison':
            return Math.floor(maxHP / 8); // 1/8ダメージ
        case 'badlypoison':
            return Math.floor(maxHP * turn / 16); // turn/16ダメージ
        default:
            return 0;
    }
}

// まきびしダメージ計算
function calculateSpikesDamage(maxHP, spikesLevel, turn) {
    // 1ターン目のみダメージ
    if (turn !== 1) return 0;
    
    switch (spikesLevel) {
        case 1:
            return Math.floor(maxHP / 8); // 1/8ダメージ
        case 2:
            return Math.floor(maxHP / 6); // 1/6ダメージ
        case 3:
            return Math.floor(maxHP / 4); // 1/4ダメージ
        default:
            return 0;
    }
}

// 天候による定数ダメージ計算
function calculateWeatherDamage(maxHP, pokemonTypes, weather) {
    if (weather === 'sandstorm') {
        // いわ・じめん・はがねタイプ以外は1/16ダメージ
        const immuneTypes = ['いわ', 'じめん', 'はがね'];
        const isImmune = pokemonTypes.some(type => immuneTypes.includes(type));
        return isImmune ? 0 : Math.floor(maxHP / 16);
    } else if (weather === 'hail') {
        // こおりタイプ以外は1/16ダメージ
        const isImmune = pokemonTypes.includes('こおり');
        return isImmune ? 0 : Math.floor(maxHP / 16);
    }
    return 0;
}

// 総定数ダメージ計算
function calculateTotalConstantDamage(maxHP, pokemonTypes, turn) {
    let totalDamage = 0;
    
    // 状態異常による定数ダメージ（起点ターン対応）
    const statusType = document.getElementById('statusDamageSelect').value;
    const statusStartTurn = parseInt(document.getElementById('statusDamageStartTurn')?.value) || 1;
    
    if (statusType !== 'none' && turn >= statusStartTurn) {
        totalDamage += calculateStatusDamage(maxHP, statusType, turn - statusStartTurn + 1);
    }
    
    // まきびしダメージ（1ターン目のみ）
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    totalDamage += calculateSpikesDamage(maxHP, spikesLevel, turn);
    
    // 天候による定数ダメージ
    const weather = document.getElementById('weatherSelect').value;
    totalDamage += calculateWeatherDamage(maxHP, pokemonTypes, weather);
    
    // のろいダメージ（起点ターン対応）
    const curseSelect = document.getElementById('curseSelect');
    if (curseSelect) {
        const curseStartTurn = parseInt(curseSelect.value);
        if (!isNaN(curseStartTurn) && turn >= curseStartTurn) {
            totalDamage += calculateCurseDamage(maxHP);
        }
    }
    
    // あくむダメージ（起点ターン対応）
    const nightmareSelect = document.getElementById('nightmareSelect');
    if (nightmareSelect) {
        const nightmareStartTurn = parseInt(nightmareSelect.value);
        if (!isNaN(nightmareStartTurn) && turn >= nightmareStartTurn) {
            totalDamage += calculateNightmareDamage(maxHP);
        }
    }
    
    // やどりぎダメージ（起点ターン対応）
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    if (leechSeedSelect) {
        const leechSeedStartTurn = parseInt(leechSeedSelect.value);
        if (!isNaN(leechSeedStartTurn) && turn >= leechSeedStartTurn) {
            totalDamage += calculateLeechSeedDamage(maxHP);
        }
    }

    return totalDamage;
}

// のろいダメージ計算（最大HPの1/4）
function calculateCurseDamage(maxHP) {
    return Math.floor(maxHP / 4);
}

// あくむダメージ計算（最大HPの1/4）
function calculateNightmareDamage(maxHP) {
    return Math.floor(maxHP / 4);
}

// やどりぎダメージ計算（最大HPの1/8）
function calculateLeechSeedDamage(maxHP) {
    return Math.floor(maxHP / 8);
}

// やどりぎ回復量計算（相手＝攻撃側の最大HPの1/8回復）
function calculateLeechSeed2HealAmount() {
    const attackerMaxHP = calculateStats(attackerPokemon).hp;
    return Math.floor(attackerMaxHP / 8);
}

function getRankMultiplier(rankValue) {
    const multipliers = {
        '-6': { numerator: 10, denominator: 40 },
        '-5': { numerator: 10, denominator: 35 },
        '-4': { numerator: 10, denominator: 30 },
        '-3': { numerator: 10, denominator: 25 },
        '-2': { numerator: 10, denominator: 20 },
        '-1': { numerator: 10, denominator: 15 },
        '±0':  { numerator: 10, denominator: 10 },
        '+1':  { numerator: 15, denominator: 10 },
        '+2':  { numerator: 20, denominator: 10 },
        '+3':  { numerator: 25, denominator: 10 },
        '+4':  { numerator: 30, denominator: 10 },
        '+5':  { numerator: 35, denominator: 10 },
        '+6':  { numerator: 40, denominator: 10 }
    };
    
    const mult = multipliers[rankValue.toString()];
    return mult ? mult.numerator / mult.denominator : 1.0;
}

function applyBadgeModifier(stat, enabled) {
    return enabled ? Math.floor(stat * 110 / 100) : stat;
}

// ダメージ計算本体
function calculateDamage(attack, defense, level, power, category, moveType, attackerTypes, defenderTypes, atkRank, defRank, move = currentMove) {
  let finalAttack = attack;
  let finalDefense = defense;
  let finalPower = power;
  let effectiveAtkRank = atkRank;

  if (move && move.class === 'beat_up') {
      const memberInput = document.getElementById('beatUpMembers')?.value || '';
      const members = parseBeatUpMembers(
          memberInput,
          attackerPokemon.level,
          attackerPokemon.baseStats?.a
      );
      const damage = calculateBeatUpTotalDamage(
          members,
          defenderPokemon.baseStats?.b || 1,
          document.getElementById('helpCheck')?.checked || false,
          document.getElementById('criticalCheck')?.checked || false
      );
      return [damage, damage];
  }

  if (move && move.class === 'triple_kick') {
      const singleHitMove = { ...move, class: 'triple_kick_hit' };
      const hitCount = getSelectedTripleKickHitCount();
      const hitRanges = getTripleKickPowers().slice(0, hitCount).map(hitPower => calculateDamage(
          attack,
          defense,
          level,
          hitPower,
          category,
          moveType,
          attackerTypes,
          defenderTypes,
          atkRank,
          defRank,
          singleHitMove
      ));
      return sumDamageRanges(hitRanges);
  }

  if (move && move.class === 'psywave') {
      const damageValues = calculatePsywaveDamageValues(level);
      return [damageValues[0], damageValues[damageValues.length - 1]];
  }

  if (isPresentHealingSelected(move)) {
      return [0, 0];
  }
  
  
  // きしかいせい・じたばた
  if (currentMove && currentMove.class === "pinch_up"){
    const currentHP = parseInt(document.getElementById('pinchUp_currentHP').value) || 1;
    const maxHP = parseInt(document.getElementById('pinchUp_maxHP').value) || 1;
    const HPrate = Math.floor(currentHP * 48 / maxHP);
  
    if (HPrate >= 33) {
      finalPower = 20;
    } else if (HPrate >= 17) {
      finalPower = 40;
    } else if (HPrate >= 10) {
      finalPower = 80;
    } else if (HPrate >= 5) {
      finalPower = 100;
    } else if (HPrate >= 2) {
      finalPower = 150;
    } else {
      finalPower = 200;
    }
  }

  if (move && move.class === 'rage') {
    const rageHitCount = document.getElementById('rageHitCount')?.value || 0;
    effectiveAtkRank = calculateRageAttackRank(atkRank, rageHitCount);
  }

  // バッジ・ランク補正は実数値に反映し、以降は第7世代準拠コアで計算する。
  finalAttack = applyBadgeModifier(
      finalAttack,
      document.getElementById('attackerBadgeCheck')?.checked || false
  );
  finalDefense = applyBadgeModifier(
      finalDefense,
      document.getElementById('defenderBadgeCheck')?.checked || false
  );
  const atkRankMultiplier = getRankMultiplier(effectiveAtkRank);
  const defRankMultiplier = getRankMultiplier(defRank);
  finalAttack = Math.floor(finalAttack * atkRankMultiplier);
  finalDefense = Math.floor(finalDefense * defRankMultiplier);

  // 技固有の条件は基礎威力へまとめて反映する。
  if (document.getElementById('doroasobiCheck').checked && moveType === 'でんき') {
    finalPower = Math.floor(finalPower / 3);
  }
  if (document.getElementById('mizuasobiCheck').checked && moveType === 'ほのお') {
    finalPower = Math.floor(finalPower / 3);
  }
  const weather = document.getElementById('weatherSelect').value;
  if (weather === 'rain' && move?.class === 'solarbeam') {
      finalPower = Math.floor(finalPower / 2);
  }
  if (document.getElementById('twofoldCheck')?.checked) {
      finalPower *= 2;
  }
  if (move?.class === 'weather_ball' && weather !== 'none') {
      finalPower *= 2;
  }
  if (document.getElementById('chargingCheck')?.checked && moveType === 'でんき') {
      finalPower *= 2;
  }
  if (document.getElementById('helpCheck')?.checked) {
      finalPower = Math.floor(finalPower * 3 / 2);
  }

  const defenderStats = calculateStats(defenderPokemon);
  const defenderMaxHp = Math.max(
      1,
      parseInt(document.getElementById('defenderRealHP')?.value)
          || defenderStats.hp
          || 1
  );
  const defenderCurrentHp = Math.max(
      0,
      parseInt(document.getElementById('defenderCurrentHP')?.value)
          || defenderMaxHp
  );
  const isDouble = document.getElementById('doubleCheck')?.checked || false;
  const damage = KatinukiDamageCore.calculateDamageRange({
      level,
      power: finalPower,
      moveName: move?.name || '',
      attack: finalAttack,
      defense: finalDefense,
      category,
      moveType,
      moveClass: move?.class || 'standard',
      attackerTypes,
      defenderTypes,
      attackerName: attackerPokemon.name,
      defenderName: defenderPokemon.name,
      attackerAbility: attackerPokemon.ability,
      defenderAbility: defenderPokemon.ability,
      attackerItem: attackerPokemon.item?.name || '',
      defenderItem: defenderPokemon.item?.name || '',
      defenderCanEvolve: defenderPokemon.canEvolve,
      weather,
      critical: document.getElementById('criticalCheck')?.checked || false,
      burned: document.getElementById('burnCheck')?.checked || false,
      statused: document.getElementById('burnCheck')?.checked || false,
      defenderStatused:
          (document.getElementById('statusDamageSelect')?.value || 'none') !== 'none',
      screen: document.getElementById('wallCheck')?.checked || false,
      doubleBattle: isDouble,
      spreadMove: isDouble && move?.target === 2,
      currentHp: defenderCurrentHp,
      maxHp: defenderMaxHp,
      contact: move?.contact || false,
      secondaryEffect: (move?.effect_chance || 0) > 0,
      biting: move?.biting || false,
      punching: move?.punching || false,
      recoil: move?.recoil || false,
  });

  if (move?.class === 'spit_up') {
      const stockpileCount = document.getElementById('stockpileCount')?.value || 1;
      return [
          calculateSpitUpDamage(damage.min, stockpileCount),
          calculateSpitUpDamage(damage.max, stockpileCount),
      ];
  }
  return [damage.min, damage.max];
}

// ========================
// 7. 結果表示
// ========================

// ダメージ保持の切り替え
function toggleDamageKeep() {
   const keepDamage = document.getElementById('keepDamageCheck').checked;
   
   if (!keepDamage) {
       // 履歴をクリア
       damageHistory = [];
   }
}

// 乱数計算
function performDamageCalculationEnhanced() {
    // ツール情報非表示
    document.querySelector('.tool-info').style.display = 'none';
    // ポワルンのタイプを最新の天候に更新
    updateCastformTypeIfNeeded();

    // 入力チェック
    if (!attackerPokemon.name || !defenderPokemon.name) {
        console.log('ポケモンが選択されていません');
        alert('攻撃側と防御側のポケモンを選択してください');
        return;
    }

    if (!currentMove) {
        console.log('技が選択されていません');
        alert('技を選択してください');
        return;
    }
    
    handleAutoSettingChange();
    
    // 行動制限チェック（まひ・こんらん）
    const paralysisSelect = document.getElementById('paralysisSelect');
    const confusionSelect = document.getElementById('confusionSelect');
    const hasParalysis = paralysisSelect && paralysisSelect.value !== 'none';
    const hasConfusion = confusionSelect && confusionSelect.value !== 'none';
    const hasActionRestriction = hasParalysis || hasConfusion;

    // 複数ターン技が実際に設定されているかチェック
    const hasMultiTurn = hasMultiTurnMoves();
    
    // 定数ダメージの設定があるかチェック（やけど、どく、もうどく、まきびし、天候、のろい、あくむ、やどりぎ）
    const statusType = document.getElementById('statusDamageSelect').value;
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    const weather = document.getElementById('weatherSelect').value;
    const curseSelect = document.getElementById('curseSelect');
    const nightmareSelect = document.getElementById('nightmareSelect');
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    
    const curseValue = curseSelect ? curseSelect.value : 'none';
    const nightmareValue = nightmareSelect ? nightmareSelect.value : 'none';
    const leechSeedValue = leechSeedSelect ? leechSeedSelect.value : 'none';
    
    const hasConstantDamage = statusType !== 'none' || spikesLevel > 0 || 
                            (weather === 'sandstorm' || weather === 'hail') ||
                            (curseValue !== 'none' && curseValue !== '') ||
                            (nightmareValue !== 'none' && nightmareValue !== '') ||
                            (leechSeedValue !== 'none' && leechSeedValue !== '');
    
    // 複数ターン表示が必要な条件：
    // 1. 実際に複数ターン技が設定されている
    // 2. 行動制限（まひ・こんらん）がある
    const needsMultiTurnDisplay = hasMultiTurn || hasActionRestriction;
    
    if (needsMultiTurnDisplay) {
        
        // 行動制限がある場合は、multiTurnMovesに技を事前設定
        if (hasActionRestriction) {
            const paralysisValue = hasParalysis ? parseInt(paralysisSelect.value) : 0;
            const confusionValue = hasConfusion ? parseInt(confusionSelect.value) : 0;
            const maxRestrictionTurn = Math.max(paralysisValue || 0, confusionValue || 0);
            const neededTurns = Math.max(maxRestrictionTurn, 2); // 最低2ターン
            
            // multiTurnMoves配列に技を設定
            multiTurnMoves[0] = currentMove; // 1ターン目
            for (let i = 1; i < neededTurns; i++) {
                if (!multiTurnMoves[i]) {
                    multiTurnMoves[i] = currentMove;
                    console.log(`${i + 1}ターン目に${currentMove.name}を設定（行動制限対応）`);
                }
            }
        }
        
        const defenderStats = calculateStats(defenderPokemon);
        displayMultiTurnResults(defenderStats.hp, false);
        return;
    }
    
    // 単発技だが定数ダメージがある場合
    // 内部的に複数ターン計算を使用するが、表示は単発として扱う
    if (hasConstantDamage) {
        
        // ★重要: 計算時のみ内部的に設定、表示判定には影響しない
        const tempMultiTurnMoves = [...multiTurnMoves]; // バックアップ
        multiTurnMoves[0] = currentMove;
        multiTurnMoves[1] = currentMove; // 定数ダメージ計算用に2ターン目も設定
        
        // ステータス計算とダメージ計算
        const attackerStats = calculateStats(attackerPokemon);
        const defenderStats = calculateStats(defenderPokemon);
        
        const isPhysical = currentMove.category === "Physical";
        const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
        const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
        
        const atkRankElement = document.getElementById('attackerAtkRank');
        const defRankElement = document.getElementById('defenderDefRank');
        
        const atkRank = atkRankElement ? atkRankElement.value : '±0';
        const defRank = defRankElement ? defRankElement.value : '±0';
        
        const [minDamage, maxDamage] = calculateDamage(
            attackValue,
            defenseValue,
            attackerPokemon.level,
            calculatePower(currentMove),
            currentMove.category,
            currentMove.type,
            attackerPokemon.types,
            defenderPokemon.types,
            atkRank,
            defRank
        );
        
        // 単発表示として結果を表示（内部的には複数ターン計算を使用）
        displayUnifiedResults(minDamage, maxDamage, defenderStats.hp, false, atkRank, defRank);
        
        // ★重要: 表示後、配列を適切な状態に戻す
        multiTurnMoves[1] = null; // 内部計算用の2ターン目をクリア
        
        return;
    }
    
    // 通常の単発技計算
    for (let i = 1; i < 5; i++) {
        multiTurnMoves[i] = null;
    }
    multiTurnMoves[0] = currentMove;
    
    // ステータス計算とダメージ計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    
    const isPhysical = currentMove.category === "Physical";
    const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
    const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
    
    const atkRankElement = document.getElementById('attackerAtkRank');
    const defRankElement = document.getElementById('defenderDefRank');
    
    const atkRank = atkRankElement ? atkRankElement.value : '±0';
    const defRank = defRankElement ? defRankElement.value : '±0';
    
    const [baseDamageMin, baseDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        calculatePower(currentMove),
        currentMove.category,
        currentMove.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank
    );
    
    let minDamage = baseDamageMin;
    let maxDamage = baseDamageMax;
    
    // 統合版結果表示を呼び出し
    displayUnifiedResults(minDamage, maxDamage, defenderStats.hp, false, atkRank, defRank);
}

// ========================
// HPバー作成関数
// ========================

// HPバー作成関数の修正版
function createHPBar(minDamage, maxDamage, totalHP, keepDamage = false) {
    const maxDots = 48;
    
    // みがわり仮定かチェック
    const isSubstitute = document.getElementById('substituteCheck')?.checked || false;
    let currentHP = totalHP;
    let displayMaxHP = totalHP;
    
    if (isSubstitute) {
        currentHP = Math.floor(totalHP / 4);
        displayMaxHP = currentHP;
    } else {
        const currentHPInput = document.getElementById('defenderCurrentHP');
        if (currentHPInput && currentHPInput.value) {
            currentHP = parseInt(currentHPInput.value) || totalHP;
        }
        displayMaxHP = currentHP;
    }
    
    let displayMinDamage = minDamage;
    let displayMaxDamage = maxDamage;
    
    // 累積ダメージの計算
    if (keepDamage && damageHistory.length > 0) {
        const historyMin = damageHistory.reduce((sum, entry) => sum + entry.minDamage, 0);
        const historyMax = damageHistory.reduce((sum, entry) => sum + entry.maxDamage, 0);
        displayMinDamage = historyMin + minDamage;
        displayMaxDamage = historyMax + maxDamage;
    }
    
    // 定数ダメージを計算
    const constantDamage = calculateTotalConstantDamage(totalHP, defenderPokemon.types, 1);
    
    // ダメージに定数ダメージを追加
    displayMinDamage += constantDamage;
    displayMaxDamage += constantDamage;
    
    // ★修正：攻撃後のHPを先に計算
    const hpAfterMinDamage = Math.max(0, currentHP - displayMinDamage);
    const hpAfterMaxDamage = Math.max(0, currentHP - displayMaxDamage);
    
    // アイテム効果を正しい順序で計算
    const defenderItem = defenderPokemon.item;
    let healInfo = '';
    let finalMinHP = hpAfterMinDamage;
    let finalMaxHP = hpAfterMaxDamage;
    
    // やどりぎ回復量を計算
    let leechSeedHeal = 0;
    const leechSeed2Select = document.getElementById('leechSeed2Select');
    if (leechSeed2Select && leechSeed2Select.value !== 'none') {
        leechSeedHeal = calculateLeechSeed2HealAmount();
    }
    
    if (defenderItem && !isSubstitute) {
        if (defenderItem.name === 'オボンのみ') {
            // ★修正：攻撃後のHPで発動条件を判定
            const halfHP = totalHP / 2;
            let berryActivatedMin = false;
            let berryActivatedMax = false;
            
            // 最小ダメージの場合
            if (hpAfterMinDamage > 0 && hpAfterMinDamage <= halfHP) {
                berryActivatedMin = true;
                finalMinHP = Math.min(hpAfterMinDamage + 30 + leechSeedHeal, totalHP);
            } else if (leechSeedHeal > 0) {
                finalMinHP = Math.min(hpAfterMinDamage + leechSeedHeal, totalHP);
            }
            
            // 最大ダメージの場合
            if (hpAfterMaxDamage > 0 && hpAfterMaxDamage <= halfHP) {
                berryActivatedMax = true;
                finalMaxHP = Math.min(hpAfterMaxDamage + 30 + leechSeedHeal, totalHP);
            } else if (leechSeedHeal > 0) {
                finalMaxHP = Math.min(hpAfterMaxDamage + leechSeedHeal, totalHP);
            }
            
            // 表示テキストを設定
            if (berryActivatedMin || berryActivatedMax) {
                if (leechSeedHeal > 0) {
                    healInfo = berryActivatedMin && berryActivatedMax ? 
                        `<br>(オボンのみ+やどりぎ回復 +${30 + leechSeedHeal})` :
                        `<br>(オボンのみ+やどりぎ回復 条件付き発動)`;
                } else {
                    healInfo = berryActivatedMin && berryActivatedMax ? 
                        '<br>(オボンのみ発動後)' : 
                        '<br>(オボンのみ 条件付き発動)';
                }
            } else if (leechSeedHeal > 0) {
                healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
            }
            
        } else if (isFigyBerry(defenderItem.name)) {
            // フィラ系きのみも同様に修正
            const halfHP = totalHP / 2;
            const berryHealAmount = Math.floor(totalHP / 8);
            let berryActivatedMin = false;
            let berryActivatedMax = false;
            
            // 最小ダメージの場合
            if (hpAfterMinDamage > 0 && hpAfterMinDamage <= halfHP) {
                berryActivatedMin = true;
                finalMinHP = Math.min(hpAfterMinDamage + berryHealAmount + leechSeedHeal, totalHP);
            } else if (leechSeedHeal > 0) {
                finalMinHP = Math.min(hpAfterMinDamage + leechSeedHeal, totalHP);
            }
            
            // 最大ダメージの場合
            if (hpAfterMaxDamage > 0 && hpAfterMaxDamage <= halfHP) {
                berryActivatedMax = true;
                finalMaxHP = Math.min(hpAfterMaxDamage + berryHealAmount + leechSeedHeal, totalHP);
            } else if (leechSeedHeal > 0) {
                finalMaxHP = Math.min(hpAfterMaxDamage + leechSeedHeal, totalHP);
            }
            
            // 表示テキストを設定
            if (berryActivatedMin || berryActivatedMax) {
                if (leechSeedHeal > 0) {
                    healInfo = berryActivatedMin && berryActivatedMax ? 
                        `<br>(${defenderItem.name}+やどりぎ回復 +${berryHealAmount + leechSeedHeal})` :
                        `<br>(${defenderItem.name}+やどりぎ回復 条件付き発動)`;
                } else {
                    healInfo = berryActivatedMin && berryActivatedMax ? 
                        `<br>(${defenderItem.name}発動後)` : 
                        `<br>(${defenderItem.name} 条件付き発動)`;
                }
            } else if (leechSeedHeal > 0) {
                healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
            }
            
        } else if (defenderItem.name === 'たべのこし') {
            // たべのこしは毎ターン確実に発動
            const leftoversHealAmount = Math.floor(totalHP / 16);
            const totalHealAmount = leftoversHealAmount + leechSeedHeal;
            finalMinHP = Math.min(hpAfterMinDamage + totalHealAmount, totalHP);
            finalMaxHP = Math.min(hpAfterMaxDamage + totalHealAmount, totalHP);
            
            healInfo = leechSeedHeal > 0 ? 
                `<br>(たべのこし+やどりぎ回復 +${totalHealAmount})` : 
                '<br>(たべのこし考慮)';
                
        } else if (leechSeedHeal > 0) {
            // やどりぎ回復のみ
            finalMinHP = Math.min(hpAfterMinDamage + leechSeedHeal, totalHP);
            finalMaxHP = Math.min(hpAfterMaxDamage + leechSeedHeal, totalHP);
            healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
        }
    } else if (leechSeedHeal > 0 && !isSubstitute) {
        // アイテムなし、やどりぎ回復のみ
        finalMinHP = Math.min(hpAfterMinDamage + leechSeedHeal, totalHP);
        finalMaxHP = Math.min(hpAfterMaxDamage + leechSeedHeal, totalHP);
        healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
    }
    
    // ★修正：ここから先は最終的なHP残量で処理
    const remainHPAfterMinDamage = finalMinHP;
    const remainHPAfterMaxDamage = finalMaxHP;
    
    const remainMinDots = Math.ceil((remainHPAfterMinDamage / displayMaxHP) * maxDots);
    const remainMaxDots = Math.ceil((remainHPAfterMaxDamage / displayMaxHP) * maxDots);
    
    const remainMinPercent = (remainHPAfterMinDamage / displayMaxHP * 100).toFixed(1);
    const remainMaxPercent = (remainHPAfterMaxDamage / displayMaxHP * 100).toFixed(1);
    
    // 定数ダメージの詳細情報を生成（変更なし）
    let constantDamageInfo = '';
    if (constantDamage > 0 || leechSeedHeal > 0) {
        const damageDetails = [];
        
        // 状態異常ダメージ
        const statusType = document.getElementById('statusDamageSelect').value;
        if (statusType !== 'none') {
            const statusNames = {
                'burn': 'やけど',
                'poison': 'どく', 
                'badlypoison': 'もうどく'
            };
            const statusDamage = calculateStatusDamage(totalHP, statusType, 1);
            if (statusDamage > 0) {
                damageDetails.push(`${statusNames[statusType]} -${statusDamage}`);
            }
        }
        
        // まきびしダメージ
        const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
        const spikesDamage = calculateSpikesDamage(totalHP, spikesLevel, 1);
        if (spikesDamage > 0) {
            damageDetails.push(`まきびし -${spikesDamage}`);
        }
        
        // のろいダメージ
        const curseSelect = document.getElementById('curseSelect');
        if (curseSelect && curseSelect.value !== 'none') {
            const curseDamage = calculateCurseDamage(totalHP);
            damageDetails.push(`のろい -${curseDamage}`);
        }
        
        // あくむダメージ
        const nightmareSelect = document.getElementById('nightmareSelect');
        if (nightmareSelect && nightmareSelect.value !== 'none') {
            const nightmareDamage = calculateNightmareDamage(totalHP);
            damageDetails.push(`あくむ -${nightmareDamage}`);
        }
        
        // やどりぎダメージ
        const leechSeedSelect = document.getElementById('leechSeedSelect');
        if (leechSeedSelect && leechSeedSelect.value !== 'none') {
            const leechSeedDamage = calculateLeechSeedDamage(totalHP);
            damageDetails.push(`やどりぎ -${leechSeedDamage}`);
        }
        
        // 天候ダメージ
        const weather = document.getElementById('weatherSelect').value;
        const weatherDamage = calculateWeatherDamage(totalHP, defenderPokemon.types, weather);
        if (weatherDamage > 0) {
            const weatherNames = {
                'sandstorm': 'すなあらし',
                'hail': 'あられ'
            };
            damageDetails.push(`${weatherNames[weather]} -${weatherDamage}`);
        }
        
        if (damageDetails.length > 0) {
            constantDamageInfo = `<br>(${damageDetails.join(', ')})`;
        }
    }
    
    // HPバーの生成処理（変更なし）
    const dotPercentage = 100 / maxDots;
    const minDotPercent = remainMinDots * dotPercentage;
    const maxDotPercent = remainMaxDots * dotPercentage;
    
    function generateLayers() {
        let layers = '';
        
        if (remainMinDots >= 25 && remainMaxDots < 25) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f8e038 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            const halfDotPercent = 24 * dotPercentage;
            layers += `<div style="height: 100%; width: ${halfDotPercent}%; background-color: #c8a808 !important; position: absolute; left: 0; top: 0; z-index: 9;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #58d080 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots >= 25 && remainMaxDots >= 25) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #70f8a8 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #58d080 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots >= 10 && remainMaxDots < 10) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f85838 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            const fifthDotPercent = 9 * dotPercentage;
            layers += `<div style="height: 100%; width: ${fifthDotPercent}%; background-color: #a84048 !important; position: absolute; left: 0; top: 0; z-index: 9;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #c8a808 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots >= 10 && remainMinDots < 25 && remainMaxDots >= 10 && remainMaxDots < 25) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f8e038 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #c8a808 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots < 10 && remainMaxDots < 10) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f85838 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #a84048 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        }
        
        return layers;
    }
    
    function generateDotMarkers() {
        let markers = '';
        
        for (let i = 1; i < maxDots; i++) {
            const position = (i / maxDots) * 100;
            markers += `<div class="dot-marker" style="height: 100%; width: 1px; background-color: rgba(0,0,0,0.2); position: absolute; left: calc(${position}% - 0.5px); top: 0; z-index: 20;"></div>`;
        }
        
        return markers;
    }
    
    let hpBarHtml = '';
    
    if (remainHPAfterMaxDamage == remainHPAfterMinDamage) {
        let hpDisplayText = '';
        if (isSubstitute) {
            hpDisplayText = `みがわりHP: ${remainHPAfterMaxDamage}/${displayMaxHP} (${remainMaxPercent}%)${healInfo}${constantDamageInfo}`;
        } else {
            if (currentHP === totalHP) {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}/${currentHP} (${remainMaxPercent}%)${healInfo}${constantDamageInfo}`;
            } else {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}/${currentHP} (現在HPから${remainMaxPercent}%)${healInfo}${constantDamageInfo}`;
            }
        }
        
        hpBarHtml = `
        <div style="margin: 10px 0; width: 100%; position: relative;">
          <div style="height: 15px; width: 100%; background-color: #506858; border-radius: 5px; position: relative; overflow: hidden;">
            ${generateLayers()}
            ${generateDotMarkers()}
          </div>
          <div style="text-align: center; margin-top: 3px; font-size: 0.85em; color: #777;">
            <div>${hpDisplayText}</div>
            <div>ドット: [${remainMaxDots}/48]</div>
          </div>
        </div>
        `;
    } else {
        let hpDisplayText = '';
        if (isSubstitute) {
            hpDisplayText = `みがわりHP: ${remainHPAfterMaxDamage}~${remainHPAfterMinDamage}/${displayMaxHP} (${remainMaxPercent}%~${remainMinPercent}%)${healInfo}${constantDamageInfo}`;
        } else {
            if (currentHP === totalHP) {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}~${remainHPAfterMinDamage}/${currentHP} (${remainMaxPercent}%~${remainMinPercent}%)${healInfo}${constantDamageInfo}`;
            } else {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}~${remainHPAfterMinDamage}/${currentHP} (現在HPから${remainMaxPercent}%~${remainMinPercent}%)${healInfo}${constantDamageInfo}`;
            }
        }
        
        hpBarHtml = `
        <div style="margin: 10px 0; width: 100%; position: relative;">
          <div style="height: 15px; width: 100%; background-color: #506858; border-radius: 5px; position: relative; overflow: hidden;">
            ${generateLayers()}
            ${generateDotMarkers()}
          </div>
          <div style="text-align: center; margin-top: 3px; font-size: 0.85em; color: #777;">
            <div>${hpDisplayText}</div>
            <div>ドット: [${remainMaxDots}~${remainMinDots}/48]</div>
          </div>
        </div>
        `;
    }
    
    return hpBarHtml;
}

// 確定n発、乱数n発のテキスト
function calculateRandText(displayMinDamage, displayMaxDamage, defenderHP, currentMove) {
    if (displayMinDamage === 0 && displayMaxDamage === 0) {
        return { hits: 0, percent: "0.0", randLevel: "" };
    }
    
    // みがわり仮定かチェック
    const isSubstitute = document.getElementById('substituteCheck')?.checked || false;
    let targetHP = defenderHP;
    
    if (isSubstitute) {
        targetHP = Math.floor(defenderHP / 4);
    } else {
        const currentHPInput = document.getElementById('defenderCurrentHP');
        if (currentHPInput && currentHPInput.value) {
            targetHP = parseInt(currentHPInput.value) || defenderHP;
        }
    }
    
    // 連続技の特別処理
    if (currentMove) {
        if (currentMove.class === 'multi_hit') {
            const hitCountSelect = document.getElementById('multiHitCount');
            const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';
            
            if (selectedHitCount === '2-5') {
                // 2-5回の場合は統合版の計算を使用
                const singleMinDamage = Math.floor(displayMinDamage / 2);
                const singleMaxDamage = Math.floor(displayMaxDamage / 5);
                return calculateMultiHitRandTextUnified(singleMinDamage, singleMaxDamage, targetHP, isSubstitute);
            } else {
                // 固定回数の場合
                const hitCount = parseInt(selectedHitCount);
                return calculateFixedMultiHitRandText(displayMinDamage, displayMaxDamage, targetHP, hitCount, isSubstitute);
            }
        } else if (currentMove.class === 'two_hit') {
            return calculateTwoHitRandText(displayMinDamage, displayMaxDamage, targetHP, isSubstitute);
        } else if (currentMove.class === 'three_hit') {
            return calculateThreeHitRandText(displayMinDamage, displayMaxDamage, targetHP, isSubstitute);
        }
    }
    
    // 通常技の処理（既存のcalculateRandTextロジック）
    const effectiveMinDamage = displayMinDamage;
    const effectiveMaxDamage = displayMaxDamage;
    
    if (effectiveMinDamage >= targetHP) {
        return {
            hits: 1,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
    
    // 通常技の乱数計算（既存ロジック）
    const minHits = effectiveMaxDamage > 0 ? Math.ceil(targetHP / effectiveMaxDamage) : Infinity;
    const maxHits = effectiveMinDamage > 0 ? Math.ceil(targetHP / effectiveMinDamage) : Infinity;
    
    if (!isFinite(minHits) || !isFinite(maxHits)) {
        return { hits: 0, percent: "0.0", randLevel: "不可", isSubstitute: isSubstitute, targetHP: targetHP };
    }
    
    let knockoutPercent = 0;
    
    if (minHits === 1) {
        if (effectiveMaxDamage >= targetHP) {
            const successfulOutcomes = Math.max(0, effectiveMaxDamage - Math.max(effectiveMinDamage, targetHP) + 1);
            const totalOutcomes = effectiveMaxDamage - effectiveMinDamage + 1;
            knockoutPercent = (successfulOutcomes / totalOutcomes) * 100;
        } else {
            knockoutPercent = 0;
        }
    } else if (minHits === 2) {
        const totalOutcomes = Math.pow(effectiveMaxDamage - effectiveMinDamage + 1, 2);
        let successfulOutcomes = 0;
        
        for (let dmg1 = effectiveMinDamage; dmg1 <= effectiveMaxDamage; dmg1++) {
            const requiredDmg2 = targetHP - dmg1;
            
            if (requiredDmg2 <= 0) {
                successfulOutcomes += effectiveMaxDamage - effectiveMinDamage + 1;
            } else if (requiredDmg2 <= effectiveMaxDamage) {
                successfulOutcomes += Math.max(0, effectiveMaxDamage - Math.max(effectiveMinDamage, requiredDmg2) + 1);
            }
        }
        
        knockoutPercent = (successfulOutcomes / totalOutcomes) * 100;
    } else {
        const avgDamage = (effectiveMinDamage + effectiveMaxDamage) / 2;
        const totalDamageNeeded = targetHP;
        const minTotalDamage = effectiveMinDamage * minHits;
        const maxTotalDamage = effectiveMaxDamage * minHits;
        
        if (minTotalDamage >= totalDamageNeeded) {
            knockoutPercent = 95.0;
        } else if (maxTotalDamage < totalDamageNeeded) {
            knockoutPercent = 5.0;
        } else {
            const ratio = (maxTotalDamage - totalDamageNeeded) / (maxTotalDamage - minTotalDamage);
            knockoutPercent = 5.0 + ratio * 90.0;
        }
    }
    
    knockoutPercent = Math.round(knockoutPercent * 10) / 10;
    knockoutPercent = Math.max(0, Math.min(100, knockoutPercent));
    
    let randLevelText = "";
    
    if (effectiveMinDamage >= targetHP) {
        randLevelText = "確定";
        knockoutPercent = 100.0;
    } else {
        if (knockoutPercent >= 93.75) {
            randLevelText = "超高乱数";
        } else if (knockoutPercent >= 75.0) {
            randLevelText = "高乱数";
        } else if (knockoutPercent >= 62.5) {
            randLevelText = "中高乱数";
        } else if (knockoutPercent >= 37.5) {
            randLevelText = "中乱数";
        } else if (knockoutPercent >= 25.0) {
            randLevelText = "中低乱数";
        } else if (knockoutPercent > 6.3) {
            randLevelText = "低乱数";
        } else if (knockoutPercent > 0) {
            randLevelText = "超低乱数";
        } else {
            const requiredHits = Math.ceil(targetHP / effectiveMinDamage/2);
            return {
                hits: requiredHits,
                percent: null,
                randLevel: "確定",
                effectiveMinDamage: effectiveMinDamage,
                effectiveMaxDamage: effectiveMaxDamage,
                isSubstitute: isSubstitute,
                targetHP: targetHP
            };
        }
    }
    
    return {
        hits: minHits,
        percent: knockoutPercent === 100.0 ? null : knockoutPercent.toFixed(1),
        randLevel: randLevelText,
        effectiveMinDamage: effectiveMinDamage,
        effectiveMaxDamage: effectiveMaxDamage,
        isSubstitute: isSubstitute,
        targetHP: targetHP
    };
}

// 固定回数連続技の乱数計算
// calculateRandText関数の修正版（script.js内の該当部分を置き換え）

// 修正版 calculateRandText 関数（完全版）
function calculateRandText(displayMinDamage, displayMaxDamage, defenderHP, currentMove) {
    if (displayMinDamage === 0 && displayMaxDamage === 0) {
        return { hits: 0, percent: "0.0", randLevel: "" };
    }
    
    // みがわり仮定かチェック
    const isSubstitute = document.getElementById('substituteCheck')?.checked || false;
    let targetHP = defenderHP;
    
    if (isSubstitute) {
        targetHP = Math.floor(defenderHP / 4);
    } else {
        const currentHPInput = document.getElementById('defenderCurrentHP');
        if (currentHPInput && currentHPInput.value) {
            targetHP = parseInt(currentHPInput.value) || defenderHP;
        }
    }
    
    // 連続技の特別処理
    if (currentMove) {
        if (currentMove.class === 'multi_hit') {
            const hitCountSelect = document.getElementById('multiHitCount');
            const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';
            
            if (selectedHitCount === '2-5') {
                // 2-5回の場合は統合版の計算を使用
                const singleMinDamage = Math.floor(displayMinDamage / 2);
                const singleMaxDamage = Math.floor(displayMaxDamage / 5);
                return calculateMultiHitRandTextUnified(singleMinDamage, singleMaxDamage, targetHP, isSubstitute);
            } else {
                // 固定回数の場合
                const hitCount = parseInt(selectedHitCount);
                return calculateFixedMultiHitRandText(displayMinDamage, displayMaxDamage, targetHP, hitCount, isSubstitute);
            }
        } else if (currentMove.class === 'two_hit') {
            return calculateTwoHitRandText(displayMinDamage, displayMaxDamage, targetHP, isSubstitute);
        } else if (currentMove.class === 'three_hit') {
            return calculateThreeHitRandText(displayMinDamage, displayMaxDamage, targetHP, isSubstitute);
        }
    }
    
    // 通常技の処理
    const effectiveMinDamage = displayMinDamage;
    const effectiveMaxDamage = displayMaxDamage;
    
    // ★修正: 確定1発判定（16パターンベース）
    let koCount = 0;
    for (let i = 0; i < 16; i++) {
        const damage = Math.floor(effectiveMinDamage + (effectiveMaxDamage - effectiveMinDamage) * i / 15);
        if (damage >= targetHP) {
            koCount++;
        }
    }
    
    // 全パターンで瀕死の場合
    if (koCount === 16) {
        return {
            hits: 1,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
    
    // 一部パターンで瀕死の場合（乱数1発）
    if (koCount > 0) {
        const successRate = (koCount / 16) * 100;
        
        let randLevel = "";
        if (successRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (successRate >= 75.0) {
            randLevel = "高乱数";
        } else if (successRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (successRate >= 37.5) {
            randLevel = "中乱数";
        } else if (successRate >= 25.0) {
            randLevel = "中低乱数";
        } else if (successRate > 6.3) {
            randLevel = "低乱数";
        } else {
            randLevel = "超低乱数";
        }
        
        return {
            hits: 1,
            percent: successRate.toFixed(1),
            randLevel: randLevel,
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
    
    // どのパターンでも瀕死にならない場合、2発以上が必要
    
    // ★修正: 必要打数計算（16パターンベース）
    // 最小ダメージでの必要回数を計算
    const minDamageValue = Math.floor(effectiveMinDamage + (effectiveMaxDamage - effectiveMinDamage) * 0 / 15);
    const maxDamageValue = Math.floor(effectiveMinDamage + (effectiveMaxDamage - effectiveMinDamage) * 15 / 15);
    
    const minHits = Math.ceil(targetHP / maxDamageValue);
    const maxHits = Math.ceil(targetHP / minDamageValue);
    
    if (!isFinite(minHits) || !isFinite(maxHits)) {
        return { hits: 0, percent: "0.0", randLevel: "不可", isSubstitute: isSubstitute, targetHP: targetHP };
    }
    
    // 確定n発の場合
    if (minHits === maxHits) {
        return {
            hits: minHits,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
    
    // 乱数n発の場合
    let knockoutPercent = 0;
    
    if (minHits === 2) {
        // ★修正: 2発での瀕死率計算（16パターンベース）
        let successfulOutcomes = 0;
        const totalOutcomes = 16 * 16; // 16パターン × 16パターン
        
        for (let i = 0; i < 16; i++) {
            const dmg1 = Math.floor(effectiveMinDamage + (effectiveMaxDamage - effectiveMinDamage) * i / 15);
            const requiredDmg2 = targetHP - dmg1;
            
            if (requiredDmg2 <= 0) {
                // 1発目で瀕死（既に上で処理済み）
                successfulOutcomes += 16;
            } else {
                // 2発目で瀕死させるパターンを数える
                for (let j = 0; j < 16; j++) {
                    const dmg2 = Math.floor(effectiveMinDamage + (effectiveMaxDamage - effectiveMinDamage) * j / 15);
                    if (dmg2 >= requiredDmg2) {
                        successfulOutcomes++;
                    }
                }
            }
        }
        
        knockoutPercent = (successfulOutcomes / totalOutcomes) * 100;
    } else {
        // 3発以上の場合の近似計算
        const avgDamageValue = (minDamageValue + maxDamageValue) / 2;
        const totalDamageNeeded = targetHP;
        const minTotalDamage = minDamageValue * minHits;
        const maxTotalDamage = maxDamageValue * minHits;
        
        if (minTotalDamage >= totalDamageNeeded) {
            knockoutPercent = 95.0;
        } else if (maxTotalDamage < totalDamageNeeded) {
            knockoutPercent = 5.0;
        } else {
            const ratio = (maxTotalDamage - totalDamageNeeded) / (maxTotalDamage - minTotalDamage);
            knockoutPercent = 5.0 + ratio * 90.0;
        }
    }
    
    knockoutPercent = Math.round(knockoutPercent * 10) / 10;
    knockoutPercent = Math.max(0, Math.min(100, knockoutPercent));
    
    let randLevelText = "";
    
    if (knockoutPercent >= 93.75) {
        randLevelText = "超高乱数";
    } else if (knockoutPercent >= 75.0) {
        randLevelText = "高乱数";
    } else if (knockoutPercent >= 62.5) {
        randLevelText = "中高乱数";
    } else if (knockoutPercent >= 37.5) {
        randLevelText = "中乱数";
    } else if (knockoutPercent >= 25.0) {
        randLevelText = "中低乱数";
    } else if (knockoutPercent > 6.3) {
        randLevelText = "低乱数";
    } else if (knockoutPercent > 0) {
        randLevelText = "超低乱数";
    } else {
        const requiredHits = Math.ceil(targetHP / minDamageValue);
        return {
            hits: requiredHits,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
    
    return {
        hits: minHits,
        percent: knockoutPercent === 100.0 ? null : knockoutPercent.toFixed(1),
        randLevel: randLevelText,
        effectiveMinDamage: effectiveMinDamage,
        effectiveMaxDamage: effectiveMaxDamage,
        isSubstitute: isSubstitute,
        targetHP: targetHP
    };
}

// 固定回数連続技の乱数計算(急所、命中考慮）
function calculateFixedMultiHitRandText(displayMinDamage, displayMaxDamage, targetHP, hitCount, isSubstitute) {
    console.log(`固定${hitCount}回攻撃の乱数計算: ダメージ${displayMinDamage}~${displayMaxDamage}, 対象HP${targetHP}`);
    
    const effectiveMinDamage = displayMinDamage;
    const effectiveMaxDamage = displayMaxDamage;
    
    // 確定1発判定
    if (effectiveMinDamage >= targetHP) {
        return {
            hits: 1,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isFixedHit: true,
            hitCount: hitCount
        };
    }
    
    // 乱数1発判定
    if (effectiveMaxDamage >= targetHP) {
        // 各発の個別ダメージを逆算
        const singleMinDamage = Math.floor(effectiveMinDamage / hitCount);
        const singleMaxDamage = Math.ceil(effectiveMaxDamage / hitCount);
        
        // 命中・急所を考慮しない純粋な瀕死率計算
        const successRate = calculatePureFixedHitKORate(singleMinDamage, singleMaxDamage, hitCount, targetHP);
        
        let randLevel = "";
        if (successRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (successRate >= 75.0) {
            randLevel = "高乱数";
        } else if (successRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (successRate >= 37.5) {
            randLevel = "中乱数";
        } else if (successRate >= 25.0) {
            randLevel = "中低乱数";
        } else if (successRate > 6.3) {
            randLevel = "低乱数";
        } else {
            randLevel = "超低乱数";
        }
        
        return {
            hits: 1,
            percent: successRate.toFixed(1),
            randLevel: randLevel,
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isFixedHit: true,
            hitCount: hitCount
        };
    }
    
    // 確定n発の場合
    const requiredHits = Math.ceil(targetHP / effectiveMinDamage);
    return {
        hits: requiredHits,
        percent: null,
        randLevel: "確定",
        effectiveMinDamage: effectiveMinDamage,
        effectiveMaxDamage: effectiveMaxDamage,
        isSubstitute: isSubstitute,
        targetHP: targetHP,
        isFixedHit: true,
        hitCount: hitCount
    };
}

// 命中・急所を考慮しない純粋な固定回数瀕死率計算
function calculatePureFixedHitKORate(singleMinDamage, singleMaxDamage, hitCount, targetHP) {
    const totalMinDamage = singleMinDamage * hitCount;
    const totalMaxDamage = singleMaxDamage * hitCount;
    
    // 確定の場合
    if (totalMinDamage >= targetHP) {
        return 100.0;
    }
    
    // 不可能の場合
    if (totalMaxDamage < targetHP) {
        return 0.0;
    }
    
    // ダメージパターン数
    const damagePatterns = singleMaxDamage - singleMinDamage + 1;
    
    // 小さい範囲の場合は全パターン計算
    if (damagePatterns <= 10 && hitCount <= 5) {
        let koPatterns = 0;
        const totalPatterns = Math.pow(damagePatterns, hitCount);
        
        for (let pattern = 0; pattern < totalPatterns; pattern++) {
            let totalDamage = 0;
            let temp = pattern;
            
            for (let hit = 0; hit < hitCount; hit++) {
                const damageIndex = temp % damagePatterns;
                totalDamage += singleMinDamage + damageIndex;
                temp = Math.floor(temp / damagePatterns);
            }
            
            if (totalDamage >= targetHP) {
                koPatterns++;
            }
        }
        
        return (koPatterns / totalPatterns) * 100;
    } else {
        // 大きい範囲の場合は正規分布近似
        const mean = (singleMinDamage + singleMaxDamage) / 2 * hitCount;
        const variance = Math.pow(singleMaxDamage - singleMinDamage, 2) / 12 * hitCount;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev === 0) {
            return mean >= targetHP ? 100.0 : 0.0;
        }
        
        // 正規分布のCDFを近似
        const z = (targetHP - 0.5 - mean) / stdDev;
        const probability = 1 - normalCDF(z);
        
        return Math.max(0, Math.min(100, probability * 100));
    }
}
// 正規分布の累積分布関数（近似）
function normalCDF(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1.0 + sign * y);
}
// ========================================
// 統合版連続技計算システム
// ========================================

/**
 * 連続技の統合計算クラス（メンテナンス性向上）
 */
class MultiHitCalculator {
    constructor() {
        // 連続技の回数と発生確率（固定データ）
        this.hitDistribution = [
            { hits: 2, probability: 3/8 },  // 37.5%
            { hits: 3, probability: 3/8 },  // 37.5%
            { hits: 4, probability: 1/8 },  // 12.5%
            { hits: 5, probability: 1/8 }   // 12.5%
        ];
        
        // ★修正: 固定の急所率は削除（動的に取得するため）
        // this.criticalRate = 1/16;
        // this.normalRate = 15/16;
    }
    
    /**
     * 急所率を動的に取得
     */
    getCriticalRate() {
        return getCriticalRate(); // グローバル関数を呼び出し
    }
    
    /**
     * 通常攻撃率を動的に取得
     */
    getNormalRate() {
        return 1 - this.getCriticalRate();
    }
    
    /**
     * 連続技の瀕死率を計算（メイン関数）
     * @param {number} singleMinDamage - 1発の最小ダメージ
     * @param {number} singleMaxDamage - 1発の最大ダメージ
     * @param {number} targetHP - 対象HP
     * @param {Object} move - 技データ
     * @returns {Object} 計算結果
     */
    calculateMultiHitKORate(singleMinDamage, singleMaxDamage, targetHP, move) {
        console.log(`=== 連続技統合計算開始: ${move.name} ===`);
        console.log(`1発ダメージ: ${singleMinDamage}~${singleMaxDamage}, 対象HP: ${targetHP}`);
        
        const criticalRate = this.getCriticalRate();
        console.log(`急所率: ${(criticalRate * 100).toFixed(2)}% (${criticalRate === 1/8 ? 'ピントレンズ' : '通常'})`);
        
        // 命中率を計算（各種補正込み）
        const accuracy = this.calculateAccuracy(move);
        
        // 各回数での瀕死確率を計算（命中率なし）
        let totalKOProbability = 0;
        const detailResults = [];
        
        for (const { hits, probability } of this.hitDistribution) {
            const koRate = this.calculateKOForSpecificHits(
                singleMinDamage, 
                singleMaxDamage, 
                hits, 
                targetHP
            );
            
            const weightedKORate = koRate * probability;
            totalKOProbability += weightedKORate;
            
            detailResults.push({
                hits: hits,
                koRate: koRate,
                probability: probability,
                weightedKORate: weightedKORate
            });
            
            console.log(`${hits}回: 瀕死率${(koRate * 100).toFixed(2)}% × ${(probability * 100).toFixed(1)}% = ${(weightedKORate * 100).toFixed(3)}%`);
        }
        
        console.log(`命中前総合瀕死率: ${(totalKOProbability * 100).toFixed(3)}%`);
        // 最後に命中率を適用
        const finalKORate = totalKOProbability * accuracy;
        console.log(`命中率適用後: ${(finalKORate * 100).toFixed(3)}%`);
        console.log(`=== 連続技統合計算完了 ===`);
        
        return {
            koRatePercent: finalKORate * 100,
            accuracy: accuracy,
            preAccuracyRate: totalKOProbability * 100,
            detailResults: detailResults
        };
    }
    
    /**
     * 命中率を計算（各種補正込み）
     * @param {Object} move - 技データ
     * @returns {number} 最終命中率（0-1）
     */
    calculateAccuracy(move) {
        // 天候の取得
        const weather = document.getElementById('weatherSelect').value;
        
        // 必中技の判定
        if (move.accuracy === 0 || (weather === 'rain' && move.name === 'かみなり')) {
            return 1.0;
        }
        
        let accuracy = (move.accuracy || 100) / 100;
        
        // はりきりの効果
        if (document.getElementById('harikiriCheck')?.checked && move.category === 'Physical') {
            accuracy *= 0.8;
        }
        
        // ひかりのこなの効果
        if (defenderPokemon.item && defenderPokemon.item.name === 'ひかりのこな') {
            accuracy *= 0.9;
        }
        
        // 回避ランクの適用
        const evasionRank = parseInt(document.getElementById('defenderEvasionRank')?.value) || 0;
        if (evasionRank !== 0) {
            const evasionMultiplier = getAccuracyMultiplier(-evasionRank);
            accuracy = Math.min(1, accuracy * evasionMultiplier);
        }
        
        return accuracy;
    }
    
    /**
     * 特定回数での瀕死確率を計算（急所考慮、命中率なし）
     * @param {number} singleMinDamage - 1発の最小ダメージ
     * @param {number} singleMaxDamage - 1発の最大ダメージ
     * @param {number} hitCount - 攻撃回数
     * @param {number} targetHP - 対象HP
     * @returns {number} 瀕死確率（0-1）
     */
    calculateKOForSpecificHits(singleMinDamage, singleMaxDamage, hitCount, targetHP) {
        const criticalRate = this.getCriticalRate();
        const normalRate = this.getNormalRate();
        
        console.log(`連続技${hitCount}回攻撃の詳細計算:`);
        console.log(`  1発ダメージ: ${singleMinDamage}~${singleMaxDamage}`);
        console.log(`  急所率: ${(criticalRate * 100).toFixed(2)}% (${criticalRate === 1/8 ? 'ピントレンズ' : '通常'})`);
        console.log(`  対象HP: ${targetHP}`);
        
        // HP状態とその確率を管理（動的プログラミング）
        let states = new Map();
        states.set(targetHP, 1.0);
        
        for (let hit = 0; hit < hitCount; hit++) {
            const newStates = new Map();
            
            for (const [hp, prob] of states) {
                if (hp <= 0) {
                    // 既に瀕死の場合はそのまま維持
                    newStates.set(0, (newStates.get(0) || 0) + prob);
                    continue;
                }
                
                // 通常ダメージの処理
                this.processNormalDamage(hp, prob, singleMinDamage, singleMaxDamage, newStates);
                
                // 急所ダメージの処理
                this.processCriticalDamage(hp, prob, singleMinDamage, singleMaxDamage, newStates);
            }
            
            states = newStates;
        }
        
        const koRate = states.get(0) || 0;
        console.log(`  瀕死率: ${(koRate * 100).toFixed(3)}%`);
        
        return koRate;
    }
    
    /**
     * 通常ダメージの処理
     */
    processNormalDamage(hp, prob, singleMinDamage, singleMaxDamage, newStates) {
        const normalPatterns = singleMaxDamage - singleMinDamage + 1;
        const normalRate = this.getNormalRate(); // ★修正: 動的に取得
        
        for (let i = 0; i < normalPatterns; i++) {
            const damage = singleMinDamage + i;
            const newHP = Math.max(0, hp - damage);
            const patternProb = prob * normalRate / normalPatterns;
            
            newStates.set(newHP, (newStates.get(newHP) || 0) + patternProb);
        }
    }
    
    /**
     * 急所ダメージの処理
     */
    processCriticalDamage(hp, prob, singleMinDamage, singleMaxDamage, newStates) {
        const critMinDamage = singleMinDamage * 2;
        const critMaxDamage = singleMaxDamage * 2;
        const critPatterns = critMaxDamage - critMinDamage + 1;
        const criticalRate = this.getCriticalRate(); // ★修正: 動的に取得
        
        for (let i = 0; i < critPatterns; i++) {
            const damage = critMinDamage + i;
            const newHP = Math.max(0, hp - damage);
            const patternProb = prob * criticalRate / critPatterns;
            
            newStates.set(newHP, (newStates.get(newHP) || 0) + patternProb);
        }
    }
    
    /**
     * 表示用のダメージ範囲を計算
     * @param {number} singleMinDamage - 1発の最小ダメージ
     * @param {number} singleMaxDamage - 1発の最大ダメージ
     * @param {number} constantDamage - 定数ダメージ
     * @returns {Object} 表示用ダメージ範囲
     */
    getDisplayDamageRange(singleMinDamage, singleMaxDamage, constantDamage = 0) {
        return {
            min: singleMinDamage * 2 + constantDamage,  // 最小2回
            max: singleMaxDamage * 5 + constantDamage,  // 最大5回
            text: `${singleMinDamage * 2 + constantDamage}~${singleMaxDamage * 5 + constantDamage}`
        };
    }
}

// ========================================
// 統合後の関数（既存システムとの互換性維持）
// ========================================

// グローバルインスタンス
const multiHitCalculator = new MultiHitCalculator();

/**
 * 統合版: 連続技の乱数計算（既存関数を置き換え）
 */
function calculateMultiHitRandTextUnified(singleMinDamage, singleMaxDamage, targetHP, isSubstitute) {
    try {
        // 定数ダメージを加算
        const constantDamage = calculateTotalConstantDamage(defenderPokemon.baseStats?.hp || targetHP, defenderPokemon.types, 1);
        const effectiveTargetHP = targetHP + constantDamage;
        
        // 統合計算を実行
        const result = multiHitCalculator.calculateMultiHitKORate(
            singleMinDamage, 
            singleMaxDamage, 
            effectiveTargetHP, 
            currentMove
        );
        
        // 表示用ダメージ範囲を取得
        const displayRange = multiHitCalculator.getDisplayDamageRange(singleMinDamage, singleMaxDamage, constantDamage);
        
        // 既存形式の戻り値に変換
        const koRate = result.koRatePercent;
        
        let randLevel = "";
        if (koRate >= 99.5) {
            randLevel = "確定";
        } else if (koRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (koRate >= 75.0) {
            randLevel = "高乱数";
        } else if (koRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (koRate >= 37.5) {
            randLevel = "中乱数";
        } else if (koRate >= 25.0) {
            randLevel = "中低乱数";
        } else if (koRate > 6.3) {
            randLevel = "低乱数";
        } else {
            randLevel = "超低乱数";
        }
        
        return {
            hits: 1,
            percent: koRate >= 99.5 ? null : koRate.toFixed(1),
            randLevel: randLevel,
            effectiveMinDamage: displayRange.min,
            effectiveMaxDamage: displayRange.max,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isMultiHit: true,
            hitCount: "2-5"
        };
        
    } catch (error) {
        console.error('統合版連続技計算でエラー:', error);
        
        // フォールバック計算
        const constantDamage = calculateTotalConstantDamage(defenderPokemon.baseStats?.hp || targetHP, defenderPokemon.types, 1);
        const effectiveMinDamage = singleMinDamage * 2 + constantDamage; // 最小2回
        const effectiveMaxDamage = singleMaxDamage * 5 + constantDamage; // 最大5回
        
        return {
            hits: 1,
            percent: "0.0",
            randLevel: "計算エラー",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP,
            isMultiHit: true,
            hitCount: "2-5"
        };
    }
}


// 連続技の瀕死確率計算（発生確率を考慮）
function calculateMultiHitKOProbabilityWithDistribution(singleMinDamage, singleMaxDamage, effectiveTargetHP) {
    // 連続技の回数と発生確率
    const hitDistribution = [
        { hits: 2, probability: 3/8 },  // 37.5%
        { hits: 3, probability: 3/8 },  // 37.5%
        { hits: 4, probability: 1/8 },  // 12.5%
        { hits: 5, probability: 1/8 }   // 12.5%
    ];
    
    // 技の命中率を取得
    const baseAccuracy = (currentMove.accuracy || 100) / 100;
    
    // はりきりの効果（物理技の命中率0.8倍）
    let finalAccuracy = baseAccuracy;
    if (document.getElementById('harikiriCheck')?.checked && currentMove.category === 'Physical') {
        finalAccuracy *= 0.8;
    }
    
    // ひかりのこなの効果（防御側アイテム）
    if (defenderPokemon.item && defenderPokemon.item.name === 'ひかりのこな') {
        finalAccuracy *= 0.9;
    }
    
    // 回避ランクの適用
    const evasionRank = parseInt(document.getElementById('defenderEvasionRank')?.value) || 0;
    if (evasionRank !== 0) {
        const evasionMultiplier = getAccuracyMultiplier(-evasionRank);
        finalAccuracy = Math.min(1, finalAccuracy * evasionMultiplier);
    }
    
    console.log(`連続技詳細計算: 1発${singleMinDamage}~${singleMaxDamage}, 対象HP${effectiveTargetHP}, 命中率${(finalAccuracy*100).toFixed(1)}%`);
    
    let totalKOProbability = 0;
    
    // 各回数での瀕死確率を計算
    for (const { hits, probability } of hitDistribution) {
        const koRateForHits = calculateKOProbabilityForExactHits(
            singleMinDamage, 
            singleMaxDamage, 
            hits, 
            effectiveTargetHP,
            finalAccuracy
        );
        
        const weightedKORate = koRateForHits * probability;
        totalKOProbability += weightedKORate;
        
        console.log(`${hits}回攻撃: 瀕死率${(koRateForHits * 100).toFixed(2)}% × 発生率${(probability * 100).toFixed(1)}% = ${(weightedKORate * 100).toFixed(3)}%`);
    }
    
    console.log(`総合瀕死率: ${(totalKOProbability * 100).toFixed(3)}%`);
    
    return totalKOProbability * 100;
}

// 特定回数での瀕死確率計算
function calculateKOProbabilityForExactHits(singleMinDamage, singleMaxDamage, hitCount, targetHP, accuracy) {
    // 急所率
    const criticalRate = 1/16;
    const normalRate = 15/16;
    
    // 急所時のダメージ
    const critMinDamage = singleMinDamage * 2;
    const critMaxDamage = singleMaxDamage * 2;
    
    // ダメージパターン数
    const normalPatterns = singleMaxDamage - singleMinDamage + 1;
    const critPatterns = critMaxDamage - critMinDamage + 1;
    
    // 動的プログラミングでHP状態の確率を計算
    let currentStates = { [targetHP]: 1.0 };
    
    for (let hit = 0; hit < hitCount; hit++) {
        const nextStates = {};
        
        for (const [hpStr, prob] of Object.entries(currentStates)) {
            const hp = parseInt(hpStr);
            if (hp <= 0 || prob <= 0) continue;
            
            // 技が外れた場合
            const missProb = prob * (1 - accuracy);
            if (missProb > 0) {
                if (!nextStates[hp]) nextStates[hp] = 0;
                nextStates[hp] += missProb;
            }
            
            // 技が命中した場合
            const hitProb = prob * accuracy;
            if (hitProb > 0) {
                // 通常ダメージ
                for (let i = 0; i < normalPatterns; i++) {
                    const damage = singleMinDamage + i;
                    const newHP = Math.max(0, hp - damage);
                    const patternProb = hitProb * normalRate * (1 / normalPatterns);
                    
                    if (!nextStates[newHP]) nextStates[newHP] = 0;
                    nextStates[newHP] += patternProb;
                }
                
                // 急所ダメージ
                for (let i = 0; i < critPatterns; i++) {
                    const damage = critMinDamage + i;
                    const newHP = Math.max(0, hp - damage);
                    const patternProb = hitProb * criticalRate * (1 / critPatterns);
                    
                    if (!nextStates[newHP]) nextStates[newHP] = 0;
                    nextStates[newHP] += patternProb;
                }
            }
        }
        
        currentStates = nextStates;
    }
    
    // HP0の確率を返す
    return currentStates[0] || 0;
}

// 統合乱数計算関数（直接判定版）
function calculateRandTextIntegrated(minDamage, maxDamage, defenderHP) {
    // みがわり仮定かチェック
    const isSubstitute = document.getElementById('substituteCheck')?.checked || false;
    let targetHP = defenderHP;
    
    if (isSubstitute) {
        targetHP = Math.floor(defenderHP / 4);
    } else {
        const currentHPInput = document.getElementById('defenderCurrentHP');
        if (currentHPInput && currentHPInput.value) {
            targetHP = parseInt(currentHPInput.value) || defenderHP;
        }
    }
    
    // 技のクラスで直接判定
    if (currentMove) {
        if (currentMove.class === 'two_hit') {
            return calculateTwoHitRandText(minDamage, maxDamage, targetHP, isSubstitute);
        } else if (currentMove.class === 'three_hit') {
            return calculateThreeHitRandText(minDamage, maxDamage, targetHP, isSubstitute);
        } else if (currentMove.class === 'multi_hit') {
            // ★安全版統合関数を使用
            try {
                return calculateMultiHitRandTextUnified(minDamage, maxDamage, targetHP, isSubstitute);
            } catch (error) {
                console.error('統合版連続技計算でエラー:', error);
                // フォールバック: 基本的な戻り値を返す
                const constantDamage = calculateTotalConstantDamage(defenderPokemon.baseStats?.hp || targetHP, defenderPokemon.types, 1);
                const effectiveMinDamage = minDamage * 2 + constantDamage; // 最小2回
                const effectiveMaxDamage = maxDamage * 5 + constantDamage; // 最大5回
                
                return {
                    hits: 1,
                    percent: "0.0",
                    randLevel: "計算エラー",
                    effectiveMinDamage: effectiveMinDamage,
                    effectiveMaxDamage: effectiveMaxDamage,
                    isSubstitute: isSubstitute,
                    targetHP: targetHP,
                    isMultiHit: true,
                    hitCount: "2-5"
                };
            }
        }
    }
    
    // 通常技の場合は既存の処理
    return calculateRandText(minDamage, maxDamage, defenderHP);
}

// 新しい連続技乱数計算関数
function performDamageCalculationEnhanced() {
    // ツール情報非表示
    document.querySelector('.tool-info').style.display = 'none';
    // ポワルンのタイプを最新の天候に更新
    updateCastformTypeIfNeeded();

    // 入力チェック
    if (!attackerPokemon.name || !defenderPokemon.name) {
        console.log('ポケモンが選択されていません');
        alert('攻撃側と防御側のポケモンを選択してください');
        return;
    }

    if (!currentMove) {
        console.log('技が選択されていません');
        alert('技を選択してください');
        return;
    }
    
    handleAutoSettingChange();
    
    // 行動制限チェック（まひ・こんらん）
    const paralysisSelect = document.getElementById('paralysisSelect');
    const confusionSelect = document.getElementById('confusionSelect');
    const hasParalysis = paralysisSelect && paralysisSelect.value !== 'none';
    const hasConfusion = confusionSelect && confusionSelect.value !== 'none';
    const hasActionRestriction = hasParalysis || hasConfusion;

    // 複数ターン技が実際に設定されているかチェック
    const hasMultiTurn = hasMultiTurnMoves();
    
    // 定数ダメージの設定があるかチェック
    const statusType = document.getElementById('statusDamageSelect').value;
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    const weather = document.getElementById('weatherSelect').value;
    const curseSelect = document.getElementById('curseSelect');
    const nightmareSelect = document.getElementById('nightmareSelect');
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    
    const curseValue = curseSelect ? curseSelect.value : 'none';
    const nightmareValue = nightmareSelect ? nightmareSelect.value : 'none';
    const leechSeedValue = leechSeedSelect ? leechSeedSelect.value : 'none';
    
    const hasConstantDamage = statusType !== 'none' || spikesLevel > 0 || 
                            (weather === 'sandstorm' || weather === 'hail') ||
                            (curseValue !== 'none' && curseValue !== '') ||
                            (nightmareValue !== 'none' && nightmareValue !== '') ||
                            (leechSeedValue !== 'none' && leechSeedValue !== '');
    
    // 複数ターン表示が必要な条件：
    // 1. 実際に複数ターン技が設定されている
    // 2. 行動制限（まひ・こんらん）がある
    const needsMultiTurnDisplay = hasMultiTurn || hasActionRestriction;
    
    if (needsMultiTurnDisplay) {
        
        // 行動制限がある場合は、multiTurnMovesに技を事前設定
        if (hasActionRestriction) {
            const paralysisValue = hasParalysis ? parseInt(paralysisSelect.value) : 0;
            const confusionValue = hasConfusion ? parseInt(confusionSelect.value) : 0;
            const maxRestrictionTurn = Math.max(paralysisValue || 0, confusionValue || 0);
            const neededTurns = Math.max(maxRestrictionTurn, 2); // 最低2ターン
            
            // multiTurnMoves配列に技を設定
            multiTurnMoves[0] = currentMove; // 1ターン目
            for (let i = 1; i < neededTurns; i++) {
                if (!multiTurnMoves[i]) {
                    multiTurnMoves[i] = currentMove;
                    console.log(`${i + 1}ターン目に${currentMove.name}を設定（行動制限対応）`);
                }
            }
        }
        
        const defenderStats = calculateStats(defenderPokemon);
        displayMultiTurnResults(defenderStats.hp, false);
        return;
    }
    
    // 単発技だが定数ダメージがある場合
    // 内部的に複数ターン計算を使用するが、表示は単発として扱う
    if (hasConstantDamage) {
        console.log('定数ダメージがあるため内部的に複数ターン計算（表示は単発）');
        
        // ★重要: 計算時のみ内部的に設定、表示判定には影響しない
        const tempMultiTurnMoves = [...multiTurnMoves]; // バックアップ
        multiTurnMoves[0] = currentMove;
        multiTurnMoves[1] = currentMove; // 定数ダメージ計算用に2ターン目も設定
        
        // ステータス計算とダメージ計算
        const attackerStats = calculateStats(attackerPokemon);
        const defenderStats = calculateStats(defenderPokemon);
        
        const isPhysical = currentMove.category === "Physical";
        const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
        const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
        
        const atkRankElement = document.getElementById('attackerAtkRank');
        const defRankElement = document.getElementById('defenderDefRank');
        
        const atkRank = atkRankElement ? atkRankElement.value : '±0';
        const defRank = defRankElement ? defRankElement.value : '±0';
        
        // ★修正: 1発分のダメージを計算
        const [baseDamageMin, baseDamageMax] = calculateDamage(
            attackValue,
            defenseValue,
            attackerPokemon.level,
            calculatePower(currentMove),
            currentMove.category,
            currentMove.type,
            attackerPokemon.types,
            defenderPokemon.types,
            atkRank,
            defRank
        );
        
        // ★重要: 連続技でも1発分のダメージをそのまま渡す
        const minDamage = baseDamageMin;
        const maxDamage = baseDamageMax;
        
        // 単発表示として結果を表示（内部的には複数ターン計算を使用）
        displayUnifiedResults(minDamage, maxDamage, defenderStats.hp, false, atkRank, defRank);
        
        // ★重要: 表示後、配列を適切な状態に戻す
        multiTurnMoves[1] = null; // 内部計算用の2ターン目をクリア
        
        return;
    }
    
    // 通常の単発技計算
    for (let i = 1; i < 5; i++) {
        multiTurnMoves[i] = null;
    }
    multiTurnMoves[0] = currentMove;
    
    // ステータス計算とダメージ計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    
    const isPhysical = currentMove.category === "Physical";
    const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
    const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
    
    const atkRankElement = document.getElementById('attackerAtkRank');
    const defRankElement = document.getElementById('defenderDefRank');
    
    const atkRank = atkRankElement ? atkRankElement.value : '±0';
    const defRank = defRankElement ? defRankElement.value : '±0';
    
    // ★修正: 1発分のダメージを計算
    const [baseDamageMin, baseDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        calculatePower(currentMove),
        currentMove.category,
        currentMove.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank
    );
    
    // 連続技でも1発分のダメージをそのまま渡す
    const minDamage = baseDamageMin;
    const maxDamage = baseDamageMax;
    
    // 統合版結果表示を呼び出し
    displayUnifiedResults(minDamage, maxDamage, defenderStats.hp, false, atkRank, defRank);
}

// ダメージ計算での連続攻撃対応（統合版）
function calculateDamageIntegrated(attack, defense, level, power, category, moveType, attackerTypes, defenderTypes, atkRank, defRank) {
    // 1発分の基本ダメージを計算
    const [baseDamageMin, baseDamageMax] = calculateDamage(attack, defense, level, power, category, moveType, attackerTypes, defenderTypes, atkRank, defRank);
    
    // 連続攻撃技の場合はダメージを調整
    if (currentMove) {
        if (currentMove.class === 'two_hit') {
            // 2回攻撃: 固定2倍
            console.log('2回攻撃技のダメージ計算: 2倍');
            return [Math.max(1, baseDamageMin * 2), baseDamageMax * 2];
        } else if (currentMove.class === 'three_hit') {
            // 3回攻撃: 固定3倍
            console.log('3回攻撃技のダメージ計算: 3倍');
            return [Math.max(1, baseDamageMin * 3), baseDamageMax * 3];
        } else if (currentMove.class === 'multi_hit') {
            // 可変回数攻撃: 1発分のダメージをそのまま返す（乱数計算で発生確率を考慮）
            console.log(`可変回数攻撃技のダメージ計算: 1発分 ${baseDamageMin}~${baseDamageMax}`);
            return [baseDamageMin, baseDamageMax]; // ★修正: 1発分のダメージを返す
        }
    }
    
    // 通常技
    return [baseDamageMin, baseDamageMax];
}

// HPバー作成
function createHPBar(minDamage, maxDamage, totalHP, keepDamage = false) {
    const maxDots = 48;
    
    // みがわり仮定かチェック
    const isSubstitute = document.getElementById('substituteCheck')?.checked || false;
    let currentHP = totalHP;
    let displayMaxHP = totalHP;
    
    if (isSubstitute) {
        // みがわりの場合
        currentHP = Math.floor(totalHP / 4);
        displayMaxHP = currentHP; // HPバーの基準もみがわりHPに
    } else {
        // 現在HPを取得
        const currentHPInput = document.getElementById('defenderCurrentHP');
        if (currentHPInput && currentHPInput.value) {
            currentHP = parseInt(currentHPInput.value) || totalHP;
        }
        displayMaxHP = currentHP; // HPバーの基準を現在HPに変更
    }
    
    let displayMinDamage = minDamage;
    let displayMaxDamage = maxDamage;
    
    // 累積ダメージの計算
    if (keepDamage && damageHistory.length > 0) {
        const historyMin = damageHistory.reduce((sum, entry) => sum + entry.minDamage, 0);
        const historyMax = damageHistory.reduce((sum, entry) => sum + entry.maxDamage, 0);
        displayMinDamage = historyMin + minDamage;
        displayMaxDamage = historyMax + maxDamage;
    }
    
    // 定数ダメージを計算
    const constantDamage = calculateTotalConstantDamage(totalHP, defenderPokemon.types, 1);
    
    // ダメージに定数ダメージを追加
    displayMinDamage += constantDamage;
    displayMaxDamage += constantDamage;
    
    // アイテム効果を考慮
    const defenderItem = defenderPokemon.item;
    let healInfo = '';
    let effectiveMinDamage = displayMinDamage;
    let effectiveMaxDamage = displayMaxDamage;
    
    // やどりぎ回復量を計算
    let leechSeedHeal = 0;
    const leechSeed2Select = document.getElementById('leechSeed2Select');
    if (leechSeed2Select && leechSeed2Select.value !== 'none') {
        leechSeedHeal = calculateLeechSeed2HealAmount();
    }
    
    if (defenderItem && !isSubstitute) { // みがわりの場合はアイテム効果なし
        if (defenderItem.name === 'オボンのみ') {
            // HP50%以下で30回復
            const halfHP = totalHP / 2;
            if (totalHP - effectiveMinDamage <= halfHP) {
                const totalHealAmount = 30 + leechSeedHeal;
                healInfo = leechSeedHeal > 0 ? 
                    `<br>(オボンのみ+やどりぎ回復 +${totalHealAmount})` : 
                    '<br>(オボンのみ発動後)';
                effectiveMinDamage = Math.max(0, effectiveMinDamage - totalHealAmount);
                effectiveMaxDamage = Math.max(0, effectiveMaxDamage - totalHealAmount);
            } else if (leechSeedHeal > 0) {
                healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
                effectiveMinDamage = Math.max(0, effectiveMinDamage - leechSeedHeal);
                effectiveMaxDamage = Math.max(0, effectiveMaxDamage - leechSeedHeal);
            }
        } else if (isFigyBerry(defenderItem.name)) {
            // HP50%以下で最大HPの1/8回復
            const halfHP = totalHP / 2;
            const berryHealAmount = Math.floor(totalHP / 8);
            if (totalHP - effectiveMinDamage <= halfHP) {
                const totalHealAmount = berryHealAmount + leechSeedHeal;
                healInfo = leechSeedHeal > 0 ? 
                    `<br>(${defenderItem.name}+やどりぎ回復 +${totalHealAmount})` : 
                    `<br>(${defenderItem.name}発動後)`;
                effectiveMinDamage = Math.max(0, effectiveMinDamage - totalHealAmount);
                effectiveMaxDamage = Math.max(0, effectiveMaxDamage - totalHealAmount);
            } else if (leechSeedHeal > 0) {
                healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
                effectiveMinDamage = Math.max(0, effectiveMinDamage - leechSeedHeal);
                effectiveMaxDamage = Math.max(0, effectiveMaxDamage - leechSeedHeal);
            }
        } else if (defenderItem.name === 'たべのこし') {
            // 毎ターン1/16回復
            const leftoversHealAmount = Math.floor(totalHP / 16);
            const totalHealAmount = leftoversHealAmount + leechSeedHeal;
            healInfo = leechSeedHeal > 0 ? 
                `<br>(たべのこし+やどりぎ回復 +${totalHealAmount})` : 
                '<br>(たべのこし考慮)';
            effectiveMinDamage = Math.max(0, effectiveMinDamage - totalHealAmount);
            effectiveMaxDamage = Math.max(0, effectiveMaxDamage - totalHealAmount);
        } else if (leechSeedHeal > 0) {
            // やどりぎ回復のみ
            healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
            effectiveMinDamage = Math.max(0, effectiveMinDamage - leechSeedHeal);
            effectiveMaxDamage = Math.max(0, effectiveMaxDamage - leechSeedHeal);
        }
    } else if (leechSeedHeal > 0 && !isSubstitute) {
        // アイテムなし、やどりぎ回復のみ
        healInfo = `<br>(やどりぎ回復 +${leechSeedHeal})`;
        effectiveMinDamage = Math.max(0, effectiveMinDamage - leechSeedHeal);
        effectiveMaxDamage = Math.max(0, effectiveMaxDamage - leechSeedHeal);
    }
    
    // 定数ダメージの詳細情報を生成
    let constantDamageInfo = '';
    if (constantDamage > 0 || leechSeedHeal > 0) {
        const damageDetails = [];
        
        // 状態異常ダメージ
        const statusType = document.getElementById('statusDamageSelect').value;
        if (statusType !== 'none') {
            const statusNames = {
                'burn': 'やけど',
                'poison': 'どく', 
                'badlypoison': 'もうどく'
            };
            const statusDamage = calculateStatusDamage(totalHP, statusType, 1);
            if (statusDamage > 0) {
                damageDetails.push(`${statusNames[statusType]} -${statusDamage}`);
            }
        }
        
        // まきびしダメージ
        const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
        const spikesDamage = calculateSpikesDamage(totalHP, spikesLevel, 1);
        if (spikesDamage > 0) {
            damageDetails.push(`まきびし -${spikesDamage}`);
        }
        
        // のろいダメージ
        const curseSelect = document.getElementById('curseSelect');
        if (curseSelect && curseSelect.value !== 'none') {
            const curseDamage = calculateCurseDamage(totalHP);
            damageDetails.push(`のろい -${curseDamage}`);
        }
        
        // あくむダメージ
        const nightmareSelect = document.getElementById('nightmareSelect');
        if (nightmareSelect && nightmareSelect.value !== 'none') {
            const nightmareDamage = calculateNightmareDamage(totalHP);
            damageDetails.push(`あくむ -${nightmareDamage}`);
        }
        
        // やどりぎダメージ
        const leechSeedSelect = document.getElementById('leechSeedSelect');
        if (leechSeedSelect && leechSeedSelect.value !== 'none') {
            const leechSeedDamage = calculateLeechSeedDamage(totalHP);
            damageDetails.push(`やどりぎ -${leechSeedDamage}`);
        }
        
        // 天候ダメージ
        const weather = document.getElementById('weatherSelect').value;
        const weatherDamage = calculateWeatherDamage(totalHP, defenderPokemon.types, weather);
        if (weatherDamage > 0) {
            const weatherNames = {
                'sandstorm': 'すなあらし',
                'hail': 'あられ'
            };
            damageDetails.push(`${weatherNames[weather]} -${weatherDamage}`);
        }
        
        if (damageDetails.length > 0) {
            constantDamageInfo = `<br>(${damageDetails.join(', ')})`;
        }
    }
    
    const remainHPAfterMinDamage = Math.max(0, currentHP - effectiveMinDamage);
    const remainHPAfterMaxDamage = Math.max(0, currentHP - effectiveMaxDamage);
    
    const remainMinDots = Math.ceil((remainHPAfterMinDamage / displayMaxHP) * maxDots);
    const remainMaxDots = Math.ceil((remainHPAfterMaxDamage / displayMaxHP) * maxDots);
    
    const remainMinPercent = (remainHPAfterMinDamage / displayMaxHP * 100).toFixed(1);
    const remainMaxPercent = (remainHPAfterMaxDamage / displayMaxHP * 100).toFixed(1);
    
    const dotPercentage = 100 / maxDots;
    const minDotPercent = remainMinDots * dotPercentage;
    const maxDotPercent = remainMaxDots * dotPercentage;
    
    function generateLayers() {
        let layers = '';
        
        if (remainMinDots >= 25 && remainMaxDots < 25) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f8e038 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            const halfDotPercent = 24 * dotPercentage;
            layers += `<div style="height: 100%; width: ${halfDotPercent}%; background-color: #c8a808 !important; position: absolute; left: 0; top: 0; z-index: 9;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #58d080 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots >= 25 && remainMaxDots >= 25) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #70f8a8 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #58d080 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots >= 10 && remainMaxDots < 10) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f85838 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            const fifthDotPercent = 9 * dotPercentage;
            layers += `<div style="height: 100%; width: ${fifthDotPercent}%; background-color: #a84048 !important; position: absolute; left: 0; top: 0; z-index: 9;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #c8a808 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots >= 10 && remainMinDots < 25 && remainMaxDots >= 10 && remainMaxDots < 25) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f8e038 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #c8a808 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        } else if (remainMinDots < 10 && remainMaxDots < 10) {
            layers += `<div style="height: 100%; width: ${maxDotPercent}%; background-color: #f85838 !important; position: absolute; left: 0; top: 0; z-index: 10;"></div>`;
            layers += `<div style="height: 100%; width: ${minDotPercent}%; background-color: #a84048 !important; position: absolute; left: 0; top: 0; z-index: 8;"></div>`;
        }
        
        return layers;
    }
    
    function generateDotMarkers() {
        let markers = '';
        
        // より精密なドット区切り線の計算
        for (let i = 1; i < maxDots; i++) {
            const position = (i / maxDots) * 100;
            markers += `<div class="dot-marker" style="height: 100%; width: 1px; background-color: rgba(0,0,0,0.2); position: absolute; left: calc(${position}% - 0.5px); top: 0; z-index: 20;"></div>`;
        }
        
        return markers;
    }
    
    let hpBarHtml = '';
    
    if (remainHPAfterMaxDamage == remainHPAfterMinDamage) {
        // HPバー表示文言の生成
        let hpDisplayText = '';
        if (isSubstitute) {
            hpDisplayText = `みがわりHP: ${remainHPAfterMaxDamage}/${displayMaxHP} (${remainMaxPercent}%)${healInfo}${constantDamageInfo}`;
        } else {
            if (currentHP === totalHP) {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}/${currentHP} (${remainMaxPercent}%)${healInfo}${constantDamageInfo}`;
            } else {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}/${currentHP} (現在HPから${remainMaxPercent}%)${healInfo}${constantDamageInfo}`;
            }
        }
        
        hpBarHtml = `
        <div style="margin: 10px 0; width: 100%; position: relative;">
          <div style="height: 15px; width: 100%; background-color: #506858; border-radius: 5px; position: relative; overflow: hidden;">
            ${generateLayers()}
            ${generateDotMarkers()}
          </div>
          <div style="text-align: center; margin-top: 3px; font-size: 0.85em; color: #777;">
            <div>${hpDisplayText}</div>
            <div>ドット: [${remainMaxDots}/48]</div>
          </div>
        </div>
        `;
    } else {
        // HPバー表示文言の生成
        let hpDisplayText = '';
        if (isSubstitute) {
            hpDisplayText = `みがわりHP: ${remainHPAfterMaxDamage}~${remainHPAfterMinDamage}/${displayMaxHP} (${remainMaxPercent}%~${remainMinPercent}%)${healInfo}${constantDamageInfo}`;
        } else {
            if (currentHP === totalHP) {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}~${remainHPAfterMinDamage}/${currentHP} (${remainMaxPercent}%~${remainMinPercent}%)${healInfo}${constantDamageInfo}`;
            } else {
                hpDisplayText = `HP: ${remainHPAfterMaxDamage}~${remainHPAfterMinDamage}/${currentHP} (現在HPから${remainMaxPercent}%~${remainMinPercent}%)${healInfo}${constantDamageInfo}`;
            }
        }
        
        hpBarHtml = `
        <div style="margin: 10px 0; width: 100%; position: relative;">
          <div style="height: 15px; width: 100%; background-color: #506858; border-radius: 5px; position: relative; overflow: hidden;">
            ${generateLayers()}
            ${generateDotMarkers()}
          </div>
          <div style="text-align: center; margin-top: 3px; font-size: 0.85em; color: #777;">
            <div>${hpDisplayText}</div>
            <div>ドット: [${remainMaxDots}~${remainMinDots}/48]</div>
          </div>
        </div>
        `;
    }
    
    return hpBarHtml;
}


// ========================
// 8. 複数ターン技設定の管理
// ========================

// 技を追加する新しい関数
function addMultiTurnMove() {
    const container = document.getElementById('multiTurnMovesContainer');
    const currentMoves = container.querySelectorAll('.multi-turn-move-row').length;
    const nextTurn = currentMoves + 2; // 1ターン目は通常の技欄なので+2
    
    if (nextTurn > 5) return; // 最大5ターンまで
    
    const moveRow = document.createElement('div');
    moveRow.className = 'multi-turn-move-row';
    moveRow.innerHTML = `
        <div class="input-row">
            <label class="inline-label">${nextTurn}ターン目:</label>
            <input type="text" id="multiTurnMove${nextTurn}" placeholder="技を検索">
        </div>
    `;
    
    container.appendChild(moveRow);
    
    // 新しい技入力欄のドロップダウンを設定
    setupMultiTurnMoveDropdown(`multiTurnMove${nextTurn}`, nextTurn - 1);
    
    // 5ターン目まで追加したら「＋技を追加する」ボタンを非表示
    if (nextTurn === 5) {
        document.getElementById('addMoveButton').style.display = 'none';
    }
}

// 複数ターン技設定をクリア
function clearMultiTurnMoves() {
    
    // 配列をクリア
    multiTurnMoves = [null, null, null, null, null];
    
    // DOM要素もクリア
    const container = document.getElementById('multiTurnMovesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    // 追加ボタンを再表示
    const addButton = document.getElementById('addMoveButton');
    if (addButton) {
        addButton.style.display = 'block';
    }
    
}

// 複数ターン技の選択
function hasMultiTurnMoves() {
    
    // 1. DOM入力欄の値をチェック（2-5ターン目）- 最優先
    let hasActualInputMoves = false;
    for (let i = 2; i <= 5; i++) {
        const input = document.getElementById(`multiTurnMove${i}`);
        if (input) {
            const value = input.value ? input.value.trim() : '';
            if (value !== '') {

                hasActualInputMoves = true;
                break;
            }
        }
    }
    
    // 2. multiTurnMoves配列内の技をチェック（ただし、自動設定技は除外）
    let hasActualMultiTurnMoves = hasActualInputMoves;
    if (!hasActualInputMoves) {
        // 現在の設定を確認
        const paralysisSelect = document.getElementById('paralysisSelect');
        const confusionSelect = document.getElementById('confusionSelect');
        const statusDamageSelect = document.getElementById('statusDamageSelect');
        const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
        const weather = document.getElementById('weatherSelect').value;
        
        const paralysisValue = paralysisSelect ? paralysisSelect.value : 'none';
        const confusionValue = confusionSelect ? confusionSelect.value : 'none';
        const statusDamageValue = statusDamageSelect ? statusDamageSelect.value : 'none';
        
        const hasActionRestriction = (paralysisValue !== 'none' && paralysisValue !== '') || 
                                   (confusionValue !== 'none' && confusionValue !== '');
        const hasConstantDamage = statusDamageValue !== 'none' || spikesLevel > 0 || 
                                (weather === 'sandstorm' || weather === 'hail');
        
        // 自動設定が有効でない場合のみ配列をチェック
        if (!hasActionRestriction && !hasConstantDamage) {
            for (let i = 1; i < 5; i++) {
                if (multiTurnMoves[i] && multiTurnMoves[i].name && multiTurnMoves[i].name.trim() !== '') {
                    console.log(`multiTurnMoves[${i}]に技が設定されています:`, multiTurnMoves[i].name);
                    hasActualMultiTurnMoves = true;
                    break;
                }
            }
        }
    }
    
    const result = hasActualMultiTurnMoves;
    
    return result;
}




// ========================
// 9. 瀕死率計算機能の追加
// ========================

// 瀕死率計算のメイン関数（複数ターン対応）
function calculateMultiTurnKORate(defenderHP, turns = 4) {
    // 防御側アイテムの確認
    const defenderItem = defenderPokemon.item;
    
    const hasItem = defenderItem && (
        defenderItem.name === 'たべのこし' || 
        defenderItem.name === 'オボンのみ' ||
        defenderItem.name === 'くろいヘドロ' ||
        isFigyBerry(defenderItem.name)
    );
    
    try {
        console.log('=== calculateMultiTurnKORate開始（統合版） ===');
        console.log('防御側アイテム:', defenderItem ? defenderItem.name : 'なし');
        
        // ★統合版を使用した基本瀕死率計算
        const basicResult = calculateMultiTurnBasicKORateUnified(defenderHP, turns);
        
        // アイテム効果ありの瀕死率と残HP情報
        let itemResult = null;
        if (hasItem) {          
            try {
                itemResult = calculateMultiTurnKORateWithItems(defenderHP, turns);
            } catch (itemError) {
                console.error('アイテム効果計算でエラー:', itemError);
                console.error('アイテムエラースタック:', itemError.stack);
            }
        }

        const result = {
            basic: basicResult.rates,
            withItems: itemResult ? itemResult.rates : null,
            hpInfo: itemResult ? itemResult.hpInfo : null,
            basis: basicResult.basis,
            hpRanges: basicResult.hpRanges
        };
        
        console.log('=== calculateMultiTurnKORate完了（統合版） ===');
        return result;
        
    } catch (error) {
     
        // エラーを再スローして上位で処理
        throw error;
    }
}

// 連続技と通常技が混在する場合の計算関数
function calculateMixedKORateProbability(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results) {
    // HPが0以下になった場合
    if (remainingHP <= 0) {
        // 現在のターン以降すべてに確率を加算
        for (let i = turnIndex; i < results.length; i++) {
            results[i] += currentProbability;
        }
        return;
    }
    
    // すべてのターンを処理した場合
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        // 技が設定されていない場合は次のターンへ
        calculateMixedKORateProbability(remainingHP, moveDataList, turnIndex + 1, totalDamage, currentProbability, results);
        return;
    }
    
    // 各ターンで技の種類を判定
    const move = turnIndex === 0 ? currentMove : multiTurnMoves[turnIndex];
    
    if (move && move.class === 'multi_hit') {
        // 連続技の場合は統合版計算を使用
        console.log(`${turnIndex + 1}ターン目: 連続技処理開始`);
        
        // 1発分のダメージを取得
        const singleMin = moveData.minDamage;
        const singleMax = moveData.maxDamage;
        const constantDamage = calculateTotalConstantDamage(remainingHP, defenderPokemon.types, turnIndex + 1);
        const effectiveTargetHP = remainingHP + constantDamage;
        
        try {
            const result = multiHitCalculator.calculateMultiHitKORate(singleMin, singleMax, effectiveTargetHP, move);
            const koRate = result.koRatePercent / 100;
            
            // この技で倒せる確率を加算
            const koThisTurn = currentProbability * koRate;
            for (let i = turnIndex; i < results.length; i++) {
                results[i] += koThisTurn;
            }
            
            // 生存して次のターンに進む確率
            const surviveRate = 1 - koRate;
            if (surviveRate > 0.001) { // 極小確率はスキップ
                // 連続技で生存した場合の残HPを簡略計算
                // 正確には複雑だが、平均的なダメージで近似
                const avgSingleDamage = (singleMin + singleMax) / 2;
                const avgTotalDamage = avgSingleDamage * 3; // 平均3回として近似
                const estimatedRemainingHP = Math.max(1, remainingHP - avgTotalDamage - constantDamage);
                
                calculateMixedKORateProbability(
                    estimatedRemainingHP,
                    moveDataList,
                    turnIndex + 1,
                    totalDamage + avgTotalDamage,
                    currentProbability * surviveRate,
                    results
                );
            }
            
            console.log(`${turnIndex + 1}ターン目連続技: KO率${(koRate * 100).toFixed(3)}%, 生存率${(surviveRate * 100).toFixed(3)}%`);
            
        } catch (error) {
            console.error(`${turnIndex + 1}ターン目連続技計算エラー:`, error);
            // フォールバック: 通常技として処理
            calculateKORateProbability(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results);
        }
    } else {
        // 通常技の場合は既存の処理
        calculateKORateProbability(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results);
    }
}

function calculateMultiHitKORateProbability(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results) {
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        calculateMultiHitKORateProbability(remainingHP, moveDataList, turnIndex + 1, totalDamage, currentProbability, results);
        return;
    }
    
    // ★修正: オボンのみ持ちかどうかをチェック
    const defenderItem = defenderPokemon.item;
    const isOranBerry = defenderItem && defenderItem.name === 'オボンのみ';
    
    const criticalRate = getCriticalRate();
    const normalRate = 1 - criticalRate;
    
    // ★修正: オボンのみの場合は基本ログを抑制
    if (!isOranBerry) {
        // 通常の連続技ログ出力処理
        if (turnIndex === 0 && (currentMove.class === 'multi_hit' || currentMove.class === 'two_hit' || currentMove.class === 'three_hit')) {
            if (!turnCommonInfoDisplayed.has(turnIndex)) {
                console.log(`=== ${turnIndex + 1}ターン目 共通情報 ===`);
                console.log(`通常ダメージ範囲: ${moveData.minDamage}~${moveData.maxDamage}`);
                console.log(`急所ダメージ範囲: ${moveData.minCritDamage}~${moveData.maxCritDamage}`);
                console.log(`命中率: ${(moveData.accuracy * 100).toFixed(1)}%`);
                
                const criticalText = criticalRate === 1/8 ? '高い確率' : '通常';
                console.log(`急所率: ${(criticalRate * 100).toFixed(2)}% (${criticalText})`);
                
                // 連続技の詳細情報
                if (currentMove.class === 'multi_hit') {
                    const hitCountSelect = document.getElementById('multiHitCount');
                    const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';
                    console.log(`連続技: ${currentMove.name} (${selectedHitCount}回)`);
                } else if (currentMove.class === 'two_hit') {
                    console.log(`連続技: ${currentMove.name} (2回)`);
                } else if (currentMove.class === 'three_hit') {
                    console.log(`連続技: ${currentMove.name} (3回)`);
                }
                
                console.log('--- 各HPパターンでの計算 ---');
                turnCommonInfoDisplayed.add(turnIndex);
            }
        }
    }
    
    // ★修正: 連続技計算処理はオボンのみに関係なく実行
    if (turnIndex === 0 && (currentMove.class === 'multi_hit' || currentMove.class === 'two_hit' || currentMove.class === 'three_hit')) {
        // 連続技の計算処理
        const hitCountSelect = document.getElementById('multiHitCount');
        const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';
        
        if (currentMove.class === 'multi_hit' && selectedHitCount === '2-5') {
            // 2-5回連続技の処理
            const hitDistribution = [
                { hits: 2, probability: 3/8 },
                { hits: 3, probability: 3/8 },
                { hits: 4, probability: 1/8 },
                { hits: 5, probability: 1/8 }
            ];
            
            // ★修正: オボンのみでない場合のみログ出力
            if (!isOranBerry) {
                console.log(`=== 連続技統合計算: ${currentMove.name} ===`);
                console.log(`1発ダメージ: ${Math.floor(moveData.minDamage / 2)}~${Math.floor(moveData.maxDamage / 5)}, 対象HP: ${remainingHP}`);
            }
            
            let totalKOProb = 0;
            
            hitDistribution.forEach(({ hits, probability }) => {
                // 各回数での計算処理
                const singleMinDamage = Math.floor(moveData.minDamage / hits);
                const singleMaxDamage = Math.floor(moveData.maxDamage / hits);
                
                // 実際の瀕死計算
                let hitKOProb = 0;
                
                // 通常攻撃パターン
                const normalAttackProb = Math.pow(normalRate, hits);
                for (let totalNormalDamage = singleMinDamage * hits; totalNormalDamage <= singleMaxDamage * hits; totalNormalDamage++) {
                    if (totalNormalDamage >= remainingHP) {
                        hitKOProb += normalAttackProb / (singleMaxDamage - singleMinDamage + 1);
                    }
                }
                
                // 急所混合パターン（簡略化）
                for (let i = 1; i <= hits; i++) {
                    const critPatternProb = Math.pow(normalRate, hits - i) * Math.pow(criticalRate, i);
                    const critTotalMinDamage = singleMinDamage * (hits - i) + singleMinDamage * 2 * i;
                    const critTotalMaxDamage = singleMaxDamage * (hits - i) + singleMaxDamage * 2 * i;
                    
                    for (let critDamage = critTotalMinDamage; critDamage <= critTotalMaxDamage; critDamage++) {
                        if (critDamage >= remainingHP) {
                            hitKOProb += critPatternProb / (critTotalMaxDamage - critTotalMinDamage + 1);
                        }
                    }
                }
                
                const weightedKOProb = hitKOProb * probability;
                totalKOProb += weightedKOProb;
                
                // ★修正: オボンのみでない場合のみログ出力
                if (!isOranBerry) {
                    console.log(`${hits}回攻撃: 瀕死率${(hitKOProb * 100).toFixed(2)}% × 発生率${(probability * 100).toFixed(1)}% = ${(weightedKOProb * 100).toFixed(3)}%`);
                }
            });
            
            // ★修正: オボンのみでない場合のみログ出力
            if (!isOranBerry) {
                console.log(`総合瀕死率: ${(totalKOProb * 100).toFixed(3)}%`);
                console.log('===============================');
            }
            
        } else {
            // 通常技または2ターン目以降は既存の処理
            calculateKORateProbability(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results);
        }
        
    } else {
        // 通常技または2ターン目以降は既存の処理
        calculateKORateProbability(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results);
    }
}

// 回避ランク
function getAccuracyMultiplier(rank) {
    const multipliers = {
        '-6': { numerator: 10, denominator: 40 },
        '-5': { numerator: 10, denominator: 35 },
        '-4': { numerator: 10, denominator: 30 },
        '-3': { numerator: 10, denominator: 25 },
        '-2': { numerator: 10, denominator: 20 },
        '-1': { numerator: 10, denominator: 15 },
        '±0':  { numerator: 10, denominator: 10 },
        '+1':  { numerator: 15, denominator: 10 },
        '+2':  { numerator: 20, denominator: 10 },
        '+3':  { numerator: 25, denominator: 10 },
        '+4':  { numerator: 30, denominator: 10 },
        '+5':  { numerator: 35, denominator: 10 },
        '+6':  { numerator: 40, denominator: 10 }
    };
    
    const mult = multipliers[rank.toString()];
    return mult ? mult.numerator / mult.denominator : 1.0;
}

// 技のダメージ範囲と確率を計算
function calculateMoveDamageRange(move, turnIndex = 0) {
    if (!move) return null;
    
    // ステータス計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    
    // 攻撃値と防御値を決定
    const isPhysical = move.category === "Physical";
    const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
    const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
    
    // ランク補正取得
    const atkRankElement = document.getElementById('attackerAtkRank');
    const defRankElement = document.getElementById('defenderDefRank');
    
    const atkRank = atkRankElement ? atkRankElement.value : '±0';
    const defRank = defRankElement ? defRankElement.value : '±0';
    
    // 威力計算
    const movePower = calculatePower(move);

    // ★修正: 防御側のアイテムのみを一時的に無効化
    const originalDefenderItem = defenderPokemon.item;
    
    // 基本瀕死率計算時は防御側アイテム効果のみを除外
    defenderPokemon.item = null;
    // 攻撃側のアイテムはそのまま維持
    
    const [baseDamageMin, baseDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        movePower,
        move.category,
        move.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank,
        move
    );
    
    // 防御側アイテムのみを元に戻す
    defenderPokemon.item = originalDefenderItem;
    
    // 1発分のダメージを返す
    let minDamage = baseDamageMin;
    let maxDamage = baseDamageMax;
    
    // 急所ダメージ計算（防御側アイテム効果なし）
    defenderPokemon.item = null; // 一時的にアイテム無効化
    
    const criticalCheckbox = document.getElementById('criticalCheck');
    const originalCritical = criticalCheckbox.checked;
    criticalCheckbox.checked = true;
    
    const [baseCritDamageMin, baseCritDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        movePower,
        move.category,
        move.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank,
        move
    );
    
    // 元の状態に戻す
    criticalCheckbox.checked = originalCritical;
    defenderPokemon.item = originalDefenderItem;
    
    let minCritDamage = baseCritDamageMin;
    let maxCritDamage = baseCritDamageMax;
    
    // 命中率計算
    let finalAccuracy;
    if (move.class === 'multi_hit') {
        finalAccuracy = multiHitCalculator.calculateAccuracy(move);
    } else {
        const weather = document.getElementById('weatherSelect').value;
        
        if (move.accuracy === 0 || (weather === 'rain' && move.name === 'かみなり')) {
            finalAccuracy = 1.0;
        } else {
            let baseAccuracy = (move.accuracy || 100) / 100;
            
            if (document.getElementById('harikiriCheck')?.checked && isPhysical) {
                baseAccuracy *= 0.8;
            }
            
            if (originalDefenderItem && originalDefenderItem.name === 'ひかりのこな') {
                baseAccuracy *= 0.9;
            }
            
            const evasionRank = parseInt(document.getElementById('defenderEvasionRank')?.value) || 0;
            if (evasionRank !== 0) {
                const evasionMultiplier = getAccuracyMultiplier(-evasionRank);
                finalAccuracy = Math.min(1, baseAccuracy * evasionMultiplier);
            } else {
                finalAccuracy = baseAccuracy;
            }
        }

        if (move.class === 'triple_kick') {
            const hitCount = getSelectedTripleKickHitCount();
            finalAccuracy = getTripleKickHitProbabilities(finalAccuracy * 100)[hitCount];
        }

        // まひの効果（1/4で行動不能）
        const paralysisSelect = document.getElementById('paralysisSelect');
        const paralysisStartTurn = paralysisSelect ? parseInt(paralysisSelect.value) : null;
        if (paralysisStartTurn && paralysisStartTurn !== 'none' && !isNaN(paralysisStartTurn) && turnIndex + 1 >= paralysisStartTurn) {
            finalAccuracy *= 0.75;
        }
        
        // こんらんの効果（1/2で行動不能）
        const confusionSelect = document.getElementById('confusionSelect');
        const confusionStartTurn = confusionSelect ? parseInt(confusionSelect.value) : null;
        if (confusionStartTurn && confusionStartTurn !== 'none' && !isNaN(confusionStartTurn) && turnIndex + 1 >= confusionStartTurn) {
            finalAccuracy *= 0.5;
        }
    }
    
    return {
        accuracy: finalAccuracy,
        minDamage: minDamage,
        maxDamage: maxDamage,
        minCritDamage: minCritDamage,
        maxCritDamage: maxCritDamage
    };
}


function getConstantDamageNames() {
    const names = [];
    
    // 状態異常ダメージ
    const statusType = document.getElementById('statusDamageSelect').value;
    if (statusType !== 'none') {
        const statusNames = {
            'burn': 'やけど',
            'poison': 'どく', 
            'badlypoison': 'もうどく'
        };
        if (statusNames[statusType]) {
            names.push(statusNames[statusType]);
        }
    }
    
    // まきびしダメージ
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    if (spikesLevel > 0) {
        names.push('まきびし');
    }
    
    // のろいダメージ
    const curseSelect = document.getElementById('curseSelect');
    if (curseSelect && curseSelect.value !== 'none') {
        names.push('のろい');
    }
    
    // あくむダメージ
    const nightmareSelect = document.getElementById('nightmareSelect');
    if (nightmareSelect && nightmareSelect.value !== 'none') {
        names.push('あくむ');
    }
    
    // やどりぎダメージ
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    if (leechSeedSelect && leechSeedSelect.value !== 'none') {
        names.push('やどりぎ');
    }
    
    // 天候ダメージ
    const weather = document.getElementById('weatherSelect').value;
    if (weather === 'sandstorm' || weather === 'hail') {
        const weatherNames = {
            'sandstorm': 'すなあらし',
            'hail': 'あられ'
        };
        if (weatherNames[weather]) {
            names.push(weatherNames[weather]);
        }
    }
    
    return names;
}

// ================================
// アイテム効果専用のダメージ計算関数
// ================================

/**
 * アイテム効果を考慮したダメージ範囲計算
 */
function calculateMoveDamageRangeWithItems(move, turnIndex = 0) {
    if (!move) return null;
    
    // ステータス計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    
    // 攻撃値と防御値を決定
    const isPhysical = move.category === "Physical";
    const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
    const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
    
    // ランク補正取得
    const atkRankElement = document.getElementById('attackerAtkRank');
    const defRankElement = document.getElementById('defenderDefRank');
    
    const atkRank = atkRankElement ? atkRankElement.value : '±0';
    const defRank = defRankElement ? defRankElement.value : '±0';
    
    // 威力計算
    const movePower = calculatePower(move);

    // ★重要: アイテム効果を含めてダメージ計算
    const [baseDamageMin, baseDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        movePower,
        move.category,
        move.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank,
        move
    );
    
    let minDamage = baseDamageMin;
    let maxDamage = baseDamageMax;
    
    // 急所ダメージ計算（アイテム効果込み）
    const criticalCheckbox = document.getElementById('criticalCheck');
    const originalCritical = criticalCheckbox.checked;
    criticalCheckbox.checked = true;
    
    const [baseCritDamageMin, baseCritDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        movePower,
        move.category,
        move.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank,
        move
    );
    
    criticalCheckbox.checked = originalCritical;
    
    let minCritDamage = baseCritDamageMin;
    let maxCritDamage = baseCritDamageMax;
    
    // 命中率計算（基本版と同じ）
    let finalAccuracy;
    if (move.class === 'multi_hit') {
        finalAccuracy = multiHitCalculator.calculateAccuracy(move);
    } else {
        const weather = document.getElementById('weatherSelect').value;
        
        if (move.accuracy === 0 || (weather === 'rain' && move.name === 'かみなり')) {
            finalAccuracy = 1.0;
        } else {
            let baseAccuracy = (move.accuracy || 100) / 100;
            
            if (document.getElementById('harikiriCheck')?.checked && isPhysical) {
                baseAccuracy *= 0.8;
            }
            
            if (defenderPokemon.item && defenderPokemon.item.name === 'ひかりのこな') {
                baseAccuracy *= 0.9;
            }
            
            const evasionRank = parseInt(document.getElementById('defenderEvasionRank')?.value) || 0;
            if (evasionRank !== 0) {
                const evasionMultiplier = getAccuracyMultiplier(-evasionRank);
                finalAccuracy = Math.min(1, baseAccuracy * evasionMultiplier);
            } else {
                finalAccuracy = baseAccuracy;
            }
        }

        if (move.class === 'triple_kick') {
            const hitCount = getSelectedTripleKickHitCount();
            finalAccuracy = getTripleKickHitProbabilities(finalAccuracy * 100)[hitCount];
        }

        // まひの効果
        const paralysisSelect = document.getElementById('paralysisSelect');
        const paralysisStartTurn = paralysisSelect ? parseInt(paralysisSelect.value) : null;
        if (paralysisStartTurn && paralysisStartTurn !== 'none' && !isNaN(paralysisStartTurn) && turnIndex + 1 >= paralysisStartTurn) {
            finalAccuracy *= 0.75;
        }
        
        // こんらんの効果
        const confusionSelect = document.getElementById('confusionSelect');
        const confusionStartTurn = confusionSelect ? parseInt(confusionSelect.value) : null;
        if (confusionStartTurn && confusionStartTurn !== 'none' && !isNaN(confusionStartTurn) && turnIndex + 1 >= confusionStartTurn) {
            finalAccuracy *= 0.5;
        }
    }
    
    console.log(`ターン${turnIndex + 1}: 1発ダメージ${minDamage}~${maxDamage}（アイテム効果込み）, 最終命中率 = ${(finalAccuracy * 100).toFixed(1)}%`);
    
    return {
        accuracy: finalAccuracy,
        minDamage: minDamage,
        maxDamage: maxDamage,
        minCritDamage: minCritDamage,
        maxCritDamage: maxCritDamage
    };
}

// 急所率設定
function getCriticalRate() {
    // 基本急所率は1/16
    let criticalRate = 1/16;
    
    // ピントレンズを持っている場合は急所率が1段階上昇（1/8）
    if (attackerPokemon.item && attackerPokemon.item.name === 'ピントレンズ') {
        criticalRate = 1/8;
    }
    
    return criticalRate;
}

// ターンごとの共通情報表示フラグを管理
let turnCommonInfoDisplayed = new Set();

// 再帰的に確率を計算（無効化された古い関数）
function calculateKORateProbability_OLD_DISABLED(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results) {
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        calculateKORateProbability(remainingHP, moveDataList, turnIndex + 1, totalDamage, currentProbability, results);
        return;
    }
    
    // ★修正: オボンのみ持ちかどうかをチェック
    const defenderItem = defenderPokemon.item;
    const isOranBerry = defenderItem && defenderItem.name === 'オボンのみ';
    
    const criticalRate = getCriticalRate();
    const normalRate = 1 - criticalRate;
    
    // ★修正: オボンのみでない場合のみログ出力
    if (!isOranBerry && !turnCommonInfoDisplayed.has(turnIndex)) {
        console.log(`=== ${turnIndex + 1}ターン目 共通情報 ===`);
        console.log(`通常ダメージ範囲: ${moveData.minDamage}~${moveData.maxDamage}`);
        console.log(`急所ダメージ範囲: ${moveData.minCritDamage}~${moveData.maxCritDamage}`);
        console.log(`命中率: ${(moveData.accuracy * 100).toFixed(1)}%`);
        
        const criticalText = criticalRate === 1/8 ? '高い確率' : '通常';
        console.log(`急所率: ${(criticalRate * 100).toFixed(2)}% (${criticalText})`);
        console.log('--- 各HPパターンでの計算 ---');
        turnCommonInfoDisplayed.add(turnIndex);
    }
    
    // ★修正: オボンのみでない場合のみ詳細ログ
    const shouldLog = !isOranBerry && currentProbability >= 0.001;
    
    if (shouldLog) {
        // 通常ダメージで倒せるパターン数を計算
        let normalKOPatterns = 0;
        for (let i = 0; i < 16; i++) {
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            if (normalDamage >= remainingHP) {
                normalKOPatterns++;
            }
        }
        
        // 急所ダメージで倒せるパターン数を計算
        let critKOPatterns = 0;
        for (let i = 0; i < 16; i++) {
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            if (critDamage >= remainingHP) {
                critKOPatterns++;
            }
        }
        
        const normalKORate = (normalKOPatterns / 16) * normalRate;
        const critKORate = (critKOPatterns / 16) * criticalRate;
        const totalKORate = normalKORate + critKORate;
        const finalKORate = totalKORate * moveData.accuracy;
        
        console.log(`残HP: ${remainingHP} (確率: ${(currentProbability * 100).toFixed(3)}%)`);
        console.log(`通常ダメージKOパターン: ${normalKOPatterns}/16 (${(normalKORate * 100).toFixed(3)}%)`);
        console.log(`急所ダメージKOパターン: ${critKOPatterns}/16 (${(critKORate * 100).toFixed(3)}%)`);
        console.log(`このパターンでの瀕死率: ${(finalKORate * 100).toFixed(3)}%`);
        addCustomKOLog(remainingHP, currentProbability, moveData, normalKOPatterns, critKOPatterns, normalRate, criticalRate, finalKORate);
    }
    
    // 技が外れた場合
    const missProbability = 1 - moveData.accuracy;
    if (missProbability > 0) {
        calculateKORateProbability(remainingHP, moveDataList, turnIndex + 1, totalDamage, currentProbability * missProbability, results);
    }
    
    // 命中した場合の処理
    const hitProbability = moveData.accuracy;
    if (hitProbability > 0) {
        // 3回攻撃技の特別処理
        if (currentMove && currentMove.class === 'three_hit') {
            calculateThreeHitKORate(remainingHP, moveData, turnIndex, totalDamage, currentProbability * hitProbability, results, moveDataList);
            return;
        }
        
        // 各ダメージパターンを処理
        for (let i = 0; i < 16; i++) {
            // 通常ダメージ
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            const normalProb = (1/16) * normalRate;
            
            if (normalDamage >= remainingHP) {
                const koProb = currentProbability * hitProbability * normalProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                const surviveProb = currentProbability * hitProbability * normalProb;
                calculateKORateProbability(
                    remainingHP - normalDamage,
                    moveDataList,
                    turnIndex + 1,
                    totalDamage + normalDamage,
                    surviveProb,
                    results
                );
            }
            
            // 急所ダメージ
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            const critProb = (1/16) * criticalRate;
            
            if (critDamage >= remainingHP) {
                const koProb = currentProbability * hitProbability * critProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                const surviveProb = currentProbability * hitProbability * critProb;
                calculateKORateProbability(
                    remainingHP - critDamage,
                    moveDataList,
                    turnIndex + 1,
                    totalDamage + critDamage,
                    surviveProb,
                    results
                );
            }
        }
    }
}

// 3回攻撃技の瀕死率計算
function calculateThreeHitKORate(remainingHP, moveData, turnIndex, totalDamage, currentProbability, results, moveDataList) {
    console.log(`=== 3回攻撃技の瀕死率計算開始 ===`);
    console.log(`残HP: ${remainingHP}, 確率: ${(currentProbability * 100).toFixed(3)}%`);
    console.log(`moveData:`, moveData);
    console.log(`通常ダメージ: ${moveData.minDamage}~${moveData.maxDamage}`);
    console.log(`急所ダメージ: ${moveData.minCritDamage}~${moveData.maxCritDamage}`);
    console.log(`急所率: ${(getCriticalRate() * 100).toFixed(2)}%`);
    
    const criticalRate = getCriticalRate();
    const normalRate = 1 - criticalRate;
    
    // 3回の各ヒットを独立して計算
    function processThreeHits(hp, prob, hitIndex) {
        if (hitIndex >= 3) {
            // 3発撃ち終わったが生存している場合、次のターンへ
            calculateKORateProbability(hp, moveDataList, turnIndex + 1, totalDamage, prob, results);
            return;
        }
        
        // 各ダメージパターンを処理
        for (let i = 0; i < 16; i++) {
            // 通常ダメージ
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            const normalProb = (1/16) * normalRate;
            
            if (normalDamage >= hp) {
                // このヒットで瀕死
                const koProb = prob * normalProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                // 生存して次のヒットへ
                processThreeHits(hp - normalDamage, prob * normalProb, hitIndex + 1);
            }
            
            // 急所ダメージ
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            const critProb = (1/16) * criticalRate;
            
            if (critDamage >= hp) {
                // このヒットで瀕死
                const koProb = prob * critProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                // 生存して次のヒットへ
                processThreeHits(hp - critDamage, prob * critProb, hitIndex + 1);
            }
        }
    }
    
    processThreeHits(remainingHP, currentProbability, 0);
    
    console.log(`=== 3回攻撃技計算完了 ===`);
    console.log(`1ターン目瀕死率: ${(results[turnIndex] * 100).toFixed(5)}%`);
}

// 2回攻撃技の瀕死率計算
function calculateTwoHitKORate(remainingHP, moveData, turnIndex, totalDamage, currentProbability, results, moveDataList) {
    console.log(`=== 2回攻撃技の瀕死率計算開始 ===`);
    console.log(`残HP: ${remainingHP}, 確率: ${(currentProbability * 100).toFixed(3)}%`);
    console.log(`moveData:`, moveData);
    console.log(`通常ダメージ: ${moveData.minDamage}~${moveData.maxDamage}`);
    console.log(`急所ダメージ: ${moveData.minCritDamage}~${moveData.maxCritDamage}`);
    console.log(`急所率: ${(getCriticalRate() * 100).toFixed(2)}%`);
    
    const criticalRate = getCriticalRate();
    const normalRate = 1 - criticalRate;
    
    // 2回の各ヒットを独立して計算
    function processTwoHits(hp, prob, hitIndex) {
        if (hitIndex >= 2) {
            // 2発撃ち終わったが生存している場合、次のターンへ
            calculateKORateProbability(hp, moveDataList, turnIndex + 1, totalDamage, prob, results);
            return;
        }
        
        // 各ダメージパターンを処理
        for (let i = 0; i < 16; i++) {
            // 通常ダメージ
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            const normalProb = (1/16) * normalRate;
            
            if (normalDamage >= hp) {
                // このヒットで瀕死
                const koProb = prob * normalProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                // 生存して次のヒットへ
                processTwoHits(hp - normalDamage, prob * normalProb, hitIndex + 1);
            }
            
            // 急所ダメージ
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            const critProb = (1/16) * criticalRate;
            
            if (critDamage >= hp) {
                // このヒットで瀕死
                const koProb = prob * critProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                // 生存して次のヒットへ
                processTwoHits(hp - critDamage, prob * critProb, hitIndex + 1);
            }
        }
    }
    
    processTwoHits(remainingHP, currentProbability, 0);
    
    console.log(`=== 2回攻撃技計算完了 ===`);
    console.log(`1ターン目瀕死率: ${(results[turnIndex] * 100).toFixed(5)}%`);
}

// フィラ系きのみかチェック
function isFigyBerry(itemName) {
   return ['フィラのみ', 'ウイのみ', 'マゴのみ', 'バンジのみ', 'イアのみ'].includes(itemName);
}

// アイテム効果を考慮した複数ターン瀕死率計算
function calculateMultiTurnKORate(defenderHP, turns = 4) {

    // 防御側アイテムの確認
    const defenderItem = defenderPokemon.item;
    
    const hasItem = defenderItem && (
        defenderItem.name === 'たべのこし' || 
        defenderItem.name === 'オボンのみ' ||
        defenderItem.name === 'くろいヘドロ' ||
        defenderItem.name === 'フィラのみ' ||
        defenderItem.name === 'ウイのみ' ||
        defenderItem.name === 'マゴのみ' ||
        defenderItem.name === 'バンジのみ' ||
        defenderItem.name === 'イアのみ'
    );
    
    try {
        
        // アイテム効果なしの瀕死率
        const basicResult = calculateMultiTurnBasicKORateUnified(defenderHP, turns);
        
        // アイテム効果ありの瀕死率と残HP情報
        let itemResult = null;
        if (hasItem) {          
            try {
                itemResult = calculateMultiTurnKORateWithItems(defenderHP, turns);
            } catch (itemError) {
            }
        }

        const result = {
            basic: basicResult.rates,
            withItems: itemResult ? itemResult.rates : null,
            hpInfo: itemResult ? itemResult.hpInfo : null,
            basis: basicResult.basis,
            hpRanges: basicResult.hpRanges
        };
        
        return result;
        
    } catch (error) {       
        // エラーを再スローして上位で処理
        throw error;
    }
}

// アイテム効果なしの定数ダメージのみ計算
function calculateKORateWithConstantDamage(currentHP, maxHP, moveDataList, turnIndex, currentProbability, results, hpInfo) {
    if (currentHP <= 0) {
        for (let i = turnIndex; i < results.length; i++) {
            results[i] += currentProbability;
        }
        return;
    }
    
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        // ターン終了時の処理
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        
        // やどりぎ回復を追加
        let healAmount = 0;
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                healAmount = calculateLeechSeed2HealAmount();
            }
        }
        
        // 正味ダメージ = 定数ダメージ - 回復量
        const netDamage = constantDamage - healAmount;
        let finalHP = currentHP - netDamage;
        
        // 回復で最大HPを超えないように制限
        if (healAmount > 0) {
            finalHP = Math.min(finalHP, maxHP);
        }
        finalHP = Math.max(0, finalHP);
        
        if (hpInfo) {
            hpInfo[turnIndex] = {
                beforeHeal: currentHP,
                afterHeal: finalHP,
                healAmount: healAmount,
                constantDamage: constantDamage,
                netHealing: healAmount - constantDamage,
                healType: healAmount > 0 ? 'やどりぎ回復' : '定数ダメージのみ',
                maxHP: maxHP
            };
        }
        
        calculateKORateWithConstantDamage(finalHP, maxHP, moveDataList, turnIndex + 1, currentProbability, results, hpInfo);
        return;
    }

    // 技が外れた場合
    const missProbability = 1 - moveData.accuracy;
    if (missProbability > 0) {
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        
        // やどりぎ回復を追加
        let healAmount = 0;
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                healAmount = calculateLeechSeed2HealAmount();
            }
        }
        
        const netDamage = constantDamage - healAmount;
        let finalHP = currentHP - netDamage;
        if (healAmount > 0) {
            finalHP = Math.min(finalHP, maxHP);
        }
        finalHP = Math.max(0, finalHP);
        
        calculateKORateWithConstantDamage(finalHP, maxHP, moveDataList, turnIndex + 1, currentProbability * missProbability, results, hpInfo);
    }
    
    // 瀕死率計算
    processKORateCalculation(currentHP, maxHP, moveData, turnIndex, currentProbability, results, hpInfo, 
        (remainingHP, prob) => {
            if (remainingHP <= 0) {
                for (let i = turnIndex; i < results.length; i++) {
                    results[i] += prob;
                }
                return;
            }
            
            const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
            
            // やどりぎ回復を追加
            let healAmount = 0;
            const leechSeed2Select = document.getElementById('leechSeed2Select');
            if (leechSeed2Select) {
                const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
                if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                    healAmount = calculateLeechSeed2HealAmount();
                }
            }
            
            const netDamage = constantDamage - healAmount;
            let finalHP = remainingHP - netDamage;
            if (healAmount > 0) {
                finalHP = Math.min(finalHP, maxHP);
            }
            finalHP = Math.max(0, finalHP);
            
            calculateKORateWithConstantDamage(finalHP, maxHP, moveDataList, turnIndex + 1, prob, results, hpInfo);
        }
    );
}

// たべのこしを考慮した確率計算関数
function calculateKORateWithLeftovers(currentHP, maxHP, moveDataList, turnIndex, currentProbability, results, hpInfo, berryUsed) {
    if (currentHP <= 0) {
        for (let i = turnIndex; i < results.length; i++) {
            results[i] += currentProbability;
        }
        return;
    }
    
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        // ターン終了時の処理
        let healAmount = Math.floor(maxHP / 16); // たべのこし回復
        
        // やどりぎ回復を追加
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                healAmount += calculateLeechSeed2HealAmount();
            }
        }
        
        // 定数ダメージを計算
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        
        // 回復量から定数ダメージを差し引き
        const netHealing = healAmount - constantDamage;
        let finalHP = currentHP + netHealing;
        finalHP = Math.max(0, Math.min(finalHP, maxHP)); // 0以上、最大HP以下に制限
        
        if (hpInfo) {
            const healTypes = [];
            if (Math.floor(maxHP / 16) > 0) healTypes.push('たべのこし');
            if (leechSeed2Select && leechSeed2Select.value !== 'none' && turnIndex + 1 >= parseInt(leechSeed2Select.value)) {
                healTypes.push('やどりぎ回復');
            }
            
            hpInfo[turnIndex] = {
                beforeHeal: currentHP,
                afterHeal: finalHP,
                healAmount: healAmount,
                constantDamage: constantDamage,
                netHealing: netHealing,
                healType: healTypes.length > 0 ? healTypes.join('+') : '定数ダメージのみ',
                maxHP: maxHP
            };
        }
        
        calculateKORateWithLeftovers(finalHP, maxHP, moveDataList, turnIndex + 1, currentProbability, results, hpInfo, berryUsed);
        return;
    }
    
    // 技が外れた場合
    const missProbability = 1 - moveData.accuracy;
    if (missProbability > 0) {
        let healAmount = Math.floor(maxHP / 16); // たべのこし回復
        
        // やどりぎ回復を追加
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                healAmount += calculateLeechSeed2HealAmount();
            }
        }
        
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const netHealing = healAmount - constantDamage;
        let finalHP = currentHP + netHealing;
        finalHP = Math.max(0, Math.min(finalHP, maxHP));
        
        calculateKORateWithLeftovers(finalHP, maxHP, moveDataList, turnIndex + 1, currentProbability * missProbability, results, hpInfo, berryUsed);
    }
    
    // 瀕死率計算
    processKORateCalculation(currentHP, maxHP, moveData, turnIndex, currentProbability, results, hpInfo, 
        (remainingHP, prob) => {
            // 瀕死になった場合はアイテム効果なし
            if (remainingHP <= 0) {
                for (let i = turnIndex; i < results.length; i++) {
                    results[i] += prob;
                }
                return;
            }
            
            let healAmount = Math.floor(maxHP / 16); // たべのこし回復
            
            // やどりぎ回復を追加
            const leechSeed2Select = document.getElementById('leechSeed2Select');
            if (leechSeed2Select) {
                const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
                if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                    healAmount += calculateLeechSeed2HealAmount();
                }
            }
            
            const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
            const netHealing = healAmount - constantDamage;
            let finalHP = remainingHP + netHealing;
            finalHP = Math.max(0, Math.min(finalHP, maxHP));
            
            calculateKORateWithLeftovers(finalHP, maxHP, moveDataList, turnIndex + 1, prob, results, hpInfo, berryUsed);
        }
    );
}

// オボンのみ効果を考慮した確率計算
function calculateKORateWithSitrusBerryOranOnly(currentHP, maxHP, moveDataList, turnIndex, berryUsed, currentProbability, results, hpInfo) {
    
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        calculateKORateWithSitrusBerryOranOnly(currentHP, maxHP, moveDataList, turnIndex + 1, berryUsed, currentProbability, results, hpInfo);
        return;
    }
    
    // 技が外れた場合
    const missProbability = 1 - moveData.accuracy;
    if (missProbability > 0) {
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const finalHP = Math.max(0, currentHP - constantDamage);
        calculateKORateWithSitrusBerryOranOnly(finalHP, maxHP, moveDataList, turnIndex + 1, berryUsed, currentProbability * missProbability, results, hpInfo);
    }
    
    // 技が命中した場合の処理
    const hitProbability = moveData.accuracy;
    
    if (hitProbability > 0) {
        let totalKOProbability = 0;
        const survivalPatterns = [];
        
        // ★修正: デバッグログを削除
        
        // 全16パターンの通常ダメージを個別計算
        for (let i = 0; i < 16; i++) {
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            const normalPatternProb = (1/16) * (15/16);
            
            if (normalDamage >= currentHP) {
                totalKOProbability += normalPatternProb;
            } else {
                const hpAfterDamage = currentHP - normalDamage;
                const surviveProb = currentProbability * hitProbability * normalPatternProb;
                
                // ★修正: デバッグログを削除
                
                survivalPatterns.push({
                    hpAfter: hpAfterDamage,
                    probability: surviveProb,
                    damageType: 'normal'
                });
            }
        }
        
        // 全16パターンの急所ダメージを個別計算
        for (let i = 0; i < 16; i++) {
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            const critPatternProb = (1/16) * (1/16);
            
            if (critDamage >= currentHP) {
                totalKOProbability += critPatternProb;
            } else {
                const hpAfterDamage = currentHP - critDamage;
                const surviveProb = currentProbability * hitProbability * critPatternProb;
                
                // ★修正: デバッグログを削除
                
                survivalPatterns.push({
                    hpAfter: hpAfterDamage,
                    probability: surviveProb,
                    damageType: 'critical'
                });
            }
        }
        
        // 瀕死確率を結果に加算
        const koThisTurn = currentProbability * hitProbability * totalKOProbability;
        if (koThisTurn > 0) {
            for (let i = turnIndex; i < results.length; i++) {
                results[i] += koThisTurn;
            }
        }
        
        // 生存パターンをHP値でグループ化
        const hpGroups = new Map();
        survivalPatterns.forEach(pattern => {
            const hp = pattern.hpAfter;
            if (!hpGroups.has(hp)) {
                hpGroups.set(hp, 0);
            }
            hpGroups.set(hp, hpGroups.get(hp) + pattern.probability);
        });
        
        // グループ化されたHPパターンを処理（ログ抑制版を呼び出し）
        hpGroups.forEach((totalProbability, hpAfterDamage) => {
            processPostDamageHealingOranOnly(hpAfterDamage, maxHP, moveDataList, turnIndex, berryUsed, totalProbability, results, hpInfo);
        });
    }
}


//ダメージ後の回復処理
function analyzeNextTurnSurvivalDebug(currentHP, moveDataList, nextTurnIndex) {
    if (nextTurnIndex >= moveDataList.length || !moveDataList[nextTurnIndex]) {
        return 100; // データがない場合は生存とみなす
    }
    
    const nextMoveData = moveDataList[nextTurnIndex];
    const minDamage = nextMoveData.minDamage;
    const maxDamage = nextMoveData.maxDamage;
    const minCritDamage = nextMoveData.minCritDamage;
    const maxCritDamage = nextMoveData.maxCritDamage;
    
    let survivalCount = 0;
    let normalSurvival = 0;
    let critSurvival = 0;
    
    // 通常ダメージでの生存パターン数
    for (let i = 0; i < 16; i++) {
        const damage = Math.floor(minDamage + (maxDamage - minDamage) * i / 15);
        if (damage < currentHP) {
            normalSurvival++;
            survivalCount++;
        }
    }
    
    // 急所ダメージでの生存パターン数
    for (let i = 0; i < 16; i++) {
        const critDamage = Math.floor(minCritDamage + (maxCritDamage - minCritDamage) * i / 15);
        if (critDamage < currentHP) {
            critSurvival++;
            survivalCount++;
        }
    }
    
    const totalPatterns = 32; // 16通常 + 16急所
    const survivalRate = (survivalCount / totalPatterns) * 100;
    
    // ★デバッグ: 生存率計算の詳細
    console.log(`    【生存率計算】HP${currentHP} vs 2Tダメージ${minDamage}~${maxDamage}(通常), ${minCritDamage}~${maxCritDamage}(急所)`);
    console.log(`    通常生存: ${normalSurvival}/16, 急所生存: ${critSurvival}/16, 総計: ${survivalCount}/32 = ${survivalRate.toFixed(1)}%`);
    
    return survivalRate;
}

// ダメージ後回復処理（デバッグ版）
function processPostDamageHealingDebugSuppressed(hpAfterDamage, maxHP, berryUsed, probability, turnIndex, moveDataList, results, hpInfo) {
    const defenderItem = defenderPokemon.item;
    const hasOranBerry = defenderItem && defenderItem.name === 'オボンのみ';
    
    // 攻撃ダメージで瀕死になった場合はオボンのみは発動しない
    if (hpAfterDamage <= 0) {
        for (let i = turnIndex; i < results.length; i++) {
            results[i] += probability;
        }
        return;
    }
    
    const halfHP = Math.floor(maxHP / 2);
    const oranThreshold = halfHP % 2 === 1 ? halfHP - 1 : halfHP;
    const berryCanActivate = !berryUsed && hpAfterDamage > 0 && hpAfterDamage <= oranThreshold;
    
    // オボンのみ発動可能な場合
    if (berryCanActivate) {
        const healAmount = 30;
        let healedHP = Math.min(hpAfterDamage + healAmount, maxHP);
        
        // やどりぎ回復量を追加
        let additionalHeal = 0;
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                additionalHeal = calculateLeechSeed2HealAmount();
                healedHP = Math.min(healedHP + additionalHeal, maxHP);
            }
        }
        
        // ターン終了時の定数ダメージを適用
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const finalHP = Math.max(0, healedHP - constantDamage);
        const totalHealAmount = healAmount + additionalHeal;
        
        // ★ログ抑制：デバッグログを出力しない
        
        if (hpInfo && !hpInfo[turnIndex]) {
            hpInfo[turnIndex] = {
                beforeHeal: hpAfterDamage,
                afterHeal: finalHP,
                healAmount: totalHealAmount,
                constantDamage: constantDamage,
                netHealing: totalHealAmount - constantDamage,
                healType: additionalHeal > 0 ? 'オボンのみ+やどりぎ回復' : 'オボンのみ',
                berryActivated: true,
                activationTurn: turnIndex + 1,
                maxHP: maxHP
            };
        }
        
        // 次のターンへ（オボンのみ使用済み）
        calculateKORateWithSitrusBerry(finalHP, maxHP, moveDataList, turnIndex + 1, true, probability, results, hpInfo);
        
    } else {
        // オボンのみ未発動または使用済み
        
        // やどりぎ回復のみチェック
        let healAmount = 0;
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                healAmount = calculateLeechSeed2HealAmount();
            }
        }
        
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const finalHP = Math.max(0, hpAfterDamage + healAmount - constantDamage);
        
        if (hpInfo && !hpInfo[turnIndex]) {
            let healType;
            if (berryUsed) {
                healType = healAmount > 0 ? 'オボンのみ(使用済み)+やどりぎ回復' : 'オボンのみ(使用済み)';
            } else {
                healType = healAmount > 0 ? 'やどりぎ回復のみ' : 'オボンのみ(未発動)';
            }
            
            hpInfo[turnIndex] = {
                beforeHeal: hpAfterDamage,
                afterHeal: finalHP,
                healAmount: healAmount,
                constantDamage: constantDamage,
                netHealing: healAmount - constantDamage,
                healType: healType,
                berryActivated: false,
                activationTurn: null,
                maxHP: maxHP
            };
        }
        
        // 次のターンへ
        calculateKORateWithSitrusBerry(finalHP, maxHP, moveDataList, turnIndex + 1, berryUsed, probability, results, hpInfo);
    }
}

// 3. ダメージ後回復処理のログ抑制版
function processPostDamageHealingOranOnly(hpAfterDamage, maxHP, moveDataList, turnIndex, berryUsed, probability, results, hpInfo) {
    // ★修正: オボン専用版 - ログを一切出力しない
    
    if (hpAfterDamage <= 0) {
        return;
    }
    
    let finalHP = hpAfterDamage;
    let healAmount = 0;
    
    // オボンのみ発動判定
    if (!berryUsed && hpAfterDamage <= Math.floor(maxHP / 2)) {
        healAmount = 30;
        finalHP = Math.min(hpAfterDamage + healAmount, maxHP);
        berryUsed = true;
    }
    
    // 定数ダメージ計算
    const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
    finalHP = Math.max(0, finalHP - constantDamage);
    
    if (finalHP <= 0) {
        const koThisTurn = probability;
        if (koThisTurn > 0) {
            for (let i = turnIndex; i < results.length; i++) {
                results[i] += koThisTurn;
            }
        }
        return;
    }
    
    // HP情報を記録
    if (hpInfo && !hpInfo[turnIndex]) {
        let healType;
        if (berryUsed && healAmount > 0) {
            healType = constantDamage > 0 ? 
                'オボンのみ(使用済み)+やどりぎ回復' : 'オボンのみ(使用済み)';
        } else {
            healType = healAmount > 0 ? 'やどりぎ回復のみ' : 'オボンのみ(未発動)';
        }
        
        hpInfo[turnIndex] = {
            beforeHeal: hpAfterDamage,
            afterHeal: finalHP,
            healAmount: healAmount,
            constantDamage: constantDamage,
            netHealing: healAmount - constantDamage,
            healType: healType,
            berryActivated: false,
            activationTurn: null,
            maxHP: maxHP
        };
    }
    
    // 次のターンへ
    calculateKORateWithSitrusBerryOranOnly(finalHP, maxHP, moveDataList, turnIndex + 1, berryUsed, probability, results, hpInfo);
}

// 急所ダメージKOパターン計算の修正版
function calculateCriticalKOPatterns(critMinDamage, critMaxDamage, targetHP) {
    let koPatterns = 0;
    const damageList = [];
    
    console.log(`【急所KO計算】対象HP: ${targetHP}, 急所ダメージ範囲: ${critMinDamage}~${critMaxDamage}`);
    
    for (let i = 0; i < 16; i++) {
        const critDamage = Math.floor(critMinDamage + (critMaxDamage - critMinDamage) * i / 15);
        damageList.push(critDamage);
        
        if (critDamage >= targetHP) {
            koPatterns++;
            console.log(`  パターン${i+1}: ダメージ${critDamage} ≥ HP${targetHP} ✅KO`);
        } else {
            console.log(`  パターン${i+1}: ダメージ${critDamage} < HP${targetHP} ❌生存`);
        }
    }
    
    console.log(`【結果】急所KOパターン: ${koPatterns}/16`);
    console.log(`【検証】ダメージ一覧: [${damageList.join(', ')}]`);
    
    return koPatterns;
}

// オボンのみ効果瀕死率ログ出力
function logOranBerryKOCalculationGeneric(defenderHP, moveDataList, basicKOResult, itemKOResult) {
    const defenderItem = defenderPokemon.item;
    if (!defenderItem || defenderItem.name !== 'オボンのみ') {
        return null;
    }
    
    console.log(`=== オボンのみ効果瀕死率計算 ===`);
    
    // 基本情報
    const maxHP = defenderHP;
    const halfHP = Math.floor(maxHP / 2);
    const oranThreshold = halfHP;
    
    console.log(`最大HP: ${maxHP}, オボン発動条件: HP ≤ ${oranThreshold}`);
    
    const maxTurns = Math.min(moveDataList.length, basicKOResult.rates.length);
    const correctedRates = [...basicKOResult.rates];
    
    // HP状態分布を追跡
    let hpStates = new Map();
    hpStates.set(maxHP, 1.0); // 初期状態：満タンHP確率100%
    
    // ★修正: グローバルなoranUsedフラグではなく、HP状態ごとにオボン使用状況を管理
    let hpStatesWithOranStatus = new Map();
    hpStatesWithOranStatus.set(maxHP, { probability: 1.0, oranUsed: false });
    
    console.log(`=== 各ターンのオボン発動可能性分析 ===`);
    
    for (let turn = 0; turn < maxTurns; turn++) {
        const moveData = moveDataList[turn];
        if (!moveData) continue;
        
        console.log(`--- ${turn + 1}ターン目 ---`);
        
        const minDamage = moveData.minDamage || 0;
        const maxDamage = moveData.maxDamage || 0;
        const minCritDamage = moveData.minCritDamage || minDamage * 1.5;
        const maxCritDamage = moveData.maxCritDamage || maxDamage * 1.5;
        const accuracy = moveData.accuracy || 1.0;
        
        console.log(`ダメージ範囲: ${minDamage}~${maxDamage}（通常）, ${Math.floor(minCritDamage)}~${Math.floor(maxCritDamage)}（急所）`);
        console.log(`【${turn + 1}ターン目分析】`);
        
        if (turn === 0) {
            console.log(`- 開始HP: ${maxHP}`);
            console.log(`- 通常攻撃後HP範囲: ${maxHP - maxDamage}~${maxHP - minDamage}`);
            console.log(`- 急所攻撃後HP範囲: ${maxHP - Math.floor(maxCritDamage)}~${maxHP - Math.floor(minCritDamage)}`);

            // ★修正：通常攻撃と急所攻撃の両方を正しく判定
            const normalMinHP = maxHP - maxDamage;  // 通常攻撃最大ダメージ後のHP（最小HP）
            const normalMaxHP = maxHP - minDamage;  // 通常攻撃最小ダメージ後のHP（最大HP）
            const critMinHP = maxHP - Math.floor(maxCritDamage);  // 急所最大ダメージ後のHP
            const critMaxHP = maxHP - Math.floor(minCritDamage);  // 急所最小ダメージ後のHP

            const normalCanActivate = normalMinHP > 0 && normalMinHP <= oranThreshold;  // 通常攻撃でもオボン発動可能
            const normalAllActivate = normalMaxHP <= oranThreshold;  // 通常攻撃で必ず発動
            const critCanActivate = critMinHP > 0 && critMinHP <= oranThreshold;      // 急所でオボン発動可能
            const critAllActivate = critMaxHP <= oranThreshold;      // 急所で必ず発動

            // ログ表示を正確に分類
            if (normalAllActivate && critAllActivate) {
                console.log(`- オボン発動可能性: 確実（全パターンでHP ≤ ${oranThreshold}）`);
            } else if (normalCanActivate && critCanActivate) {
                console.log(`- オボン発動可能性: 通常・急所両方（一部パターンでHP ≤ ${oranThreshold}）`);
            } else if (normalCanActivate && !critCanActivate) {
                console.log(`- オボン発動可能性: 通常攻撃のみ（一部パターンでHP ≤ ${oranThreshold}）`);
            } else if (!normalCanActivate && critCanActivate) {
                console.log(`- オボン発動可能性: 急所攻撃のみ（HP ≤ ${oranThreshold}となる場合）`);
            } else {
                console.log(`- オボン発動可能性: なし（全パターンでHP > ${oranThreshold}）`);
            }
        }
        
        let turnKORate = 0;
        let oranActivationThisTurn = 0;
        const newHpStatesWithOranStatus = new Map();
        
        const criticalRate = getCriticalRate();
        const normalRate = 1 - criticalRate;
        
        // 各HP状態とオボン使用状況からのパターン計算
        for (const [currentHP, stateInfo] of hpStatesWithOranStatus.entries()) {
            if (currentHP <= 0 || stateInfo.probability <= 0) continue;
            
            const { probability: stateProb, oranUsed } = stateInfo;
            
            // 命中時の処理
            for (let i = 0; i < 16; i++) {
                // 通常ダメージパターン
                const normalDamage = Math.floor(minDamage + (maxDamage - minDamage) * i / 15);
                let hpAfterNormalDamage = currentHP - normalDamage;
                
                if (hpAfterNormalDamage <= 0) {
                    turnKORate += stateProb * normalRate * accuracy * (1/16);
                } else {
                    let finalHP = hpAfterNormalDamage;
                    let newOranUsed = oranUsed; // 現在の状態を継承
                    
                    // ★修正: このHP状態でまだオボンが使用されていない場合のみ発動判定
                    if (!oranUsed && hpAfterNormalDamage <= oranThreshold && hpAfterNormalDamage > 0) {
                        finalHP = Math.min(hpAfterNormalDamage + 30, maxHP);
                        newOranUsed = true; // このパターンではオボンが使用される
                        oranActivationThisTurn += stateProb * normalRate * accuracy * (1/16);
                    }
                    
                    const patternProb = stateProb * normalRate * accuracy * (1/16);
                    const key = `${finalHP}_${newOranUsed}`;
                    
                    if (!newHpStatesWithOranStatus.has(key)) {
                        newHpStatesWithOranStatus.set(key, { 
                            hp: finalHP, 
                            probability: 0, 
                            oranUsed: newOranUsed 
                        });
                    }
                    newHpStatesWithOranStatus.get(key).probability += patternProb;
                }
                
                // 急所ダメージパターン
                const critDamage = Math.floor(minCritDamage + (maxCritDamage - minCritDamage) * i / 15);
                let hpAfterCritDamage = currentHP - critDamage;
                
                if (hpAfterCritDamage <= 0) {
                    turnKORate += stateProb * criticalRate * accuracy * (1/16);
                } else {
                    let finalHP = hpAfterCritDamage;
                    let newOranUsed = oranUsed; // 現在の状態を継承
                    
                    // ★修正: このHP状態でまだオボンが使用されていない場合のみ発動判定
                    if (!oranUsed && hpAfterCritDamage <= oranThreshold && hpAfterCritDamage > 0) {
                        finalHP = Math.min(hpAfterCritDamage + 30, maxHP);
                        newOranUsed = true; // このパターンではオボンが使用される
                        oranActivationThisTurn += stateProb * criticalRate * accuracy * (1/16);
                    }
                    
                    const patternProb = stateProb * criticalRate * accuracy * (1/16);
                    const key = `${finalHP}_${newOranUsed}`;
                    
                    if (!newHpStatesWithOranStatus.has(key)) {
                        newHpStatesWithOranStatus.set(key, { 
                            hp: finalHP, 
                            probability: 0, 
                            oranUsed: newOranUsed 
                        });
                    }
                    newHpStatesWithOranStatus.get(key).probability += patternProb;
                }
            }
            
            // 命中失敗時の処理
            if (accuracy < 1.0) {
                const missProb = stateProb * (1 - accuracy);
                const key = `${currentHP}_${oranUsed}`;
                
                if (!newHpStatesWithOranStatus.has(key)) {
                    newHpStatesWithOranStatus.set(key, { 
                        hp: currentHP, 
                        probability: 0, 
                        oranUsed: oranUsed 
                    });
                }
                newHpStatesWithOranStatus.get(key).probability += missProb;
            }
        }
        
        // ターン結果をログ出力
        if (turn === 1) {
            console.log(`- 1T通常攻撃後の想定HP: ${maxHP - maxDamage}~${maxHP - minDamage}`);
            console.log(`- 2T通常攻撃後HP範囲: ${Math.max(0, maxHP - maxDamage * 2)}~${Math.max(0, maxHP - minDamage * 2)}`);
            console.log(`- 2T累積ダメージ後HP範囲: ${Math.max(0, maxHP - maxDamage * 2)}~${Math.max(0, maxHP - minDamage * 2)}`);
            
            if (maxHP - minDamage * 2 <= oranThreshold) {
                console.log(`- オボン発動: 確実（全パターンでHP ≤ ${oranThreshold}）`);
            } else if (maxHP - maxDamage * 2 <= oranThreshold) {
                console.log(`- オボン発動: 条件次第（一部パターンでHP ≤ ${oranThreshold}）`);
            } else {
                console.log(`- オボン発動: なし（全パターンでHP > ${oranThreshold}）`);
            }
            
            console.log(`- 連続通常攻撃確率: ${(normalRate * 100).toFixed(1)}% × ${(normalRate * 100).toFixed(1)}% = ${(normalRate * normalRate * 100).toFixed(1)}%`);
        }
        
        console.log(`${turn + 1}ターン目瀕死率: ${(turnKORate * 100).toFixed(3)}%`);
        console.log(`${turn + 1}ターン目オボン発動確率: ${(oranActivationThisTurn * 100).toFixed(3)}%`);
        
        // 基本瀕死率との比較調整
        if (turn > 0) {
            const basicTurnKORate = basicKOResult.rates[turn];
            const survivalContribution = basicTurnKORate - turnKORate;
            
            correctedRates[turn] = turnKORate;
            
            console.log(`基本瀕死率: ${(basicTurnKORate * 100).toFixed(3)}% → オボン考慮後: ${(turnKORate * 100).toFixed(3)}%`);
            console.log(`オボンによる生存貢献: ${(survivalContribution * 100).toFixed(3)}%`);
        }
        
        // ★修正: 次のターンへHP状態を更新（オボン使用状況込み）
        hpStatesWithOranStatus.clear();
        for (const [key, stateInfo] of newHpStatesWithOranStatus.entries()) {
            hpStatesWithOranStatus.set(stateInfo.hp, {
                probability: stateInfo.probability,
                oranUsed: stateInfo.oranUsed
            });
        }
        
        // 表示用にHP分布をまとめる（オボン状況は内部管理）
        const hpDistribution = new Map();
        for (const [hp, stateInfo] of hpStatesWithOranStatus.entries()) {
            if (!hpDistribution.has(hp)) {
                hpDistribution.set(hp, 0);
            }
            hpDistribution.set(hp, hpDistribution.get(hp) + stateInfo.probability);
        }
        
        console.log(`${turn + 1}ターン目終了時のHP分布: ${Array.from(hpDistribution.entries()).map(([hp, prob]) => `HP${hp}(${(prob*100).toFixed(1)}%)`).join(', ')}`);
    }
    
    console.log(`=== 最終結果 ===`);
    for (let i = 0; i < maxTurns; i++) {
        console.log(`${i + 1}ターン目: ${(correctedRates[i] * 100).toFixed(1)}%`);
    }
    console.log(`=====================================`);
    
    return correctedRates;
}

// 生存率計算の詳細追跡用
let totalSurvivalContribution = 0;
let survivalPatternDetails = [];
let allDamageAfterPatterns = []; // 全ダメージ後HPパターンを追跡

// アイテム効果を考慮した複数ターン瀕死率計算
function calculateMultiTurnKORateWithItems(defenderHP, turns) {
    const defenderItem = defenderPokemon.item;
    const itemName = defenderItem ? defenderItem.name : null;
    
    // ★オボンのみの場合はログ抑制フラグを設定
    const suppressBasicLogs = (defenderItem && defenderItem.name === 'オボンのみ');
    
    if (!suppressBasicLogs) {
        console.log(`=== 【デバッグ】アイテム効果瀕死率計算開始: ${itemName || 'なし'} ===`);
    }
    
    // 各技のダメージ範囲を事前計算
    const moveDataList = [];
    for (let turn = 0; turn < turns; turn++) {
        const move = turn === 0 ? currentMove : multiTurnMoves[turn];
        
        if (!move) {
            const firstMove = currentMove;
            if (firstMove) {
                const damageData = calculateMoveDamageRange(firstMove, turn);
                moveDataList.push(damageData);
            } else {
                moveDataList.push(null);
            }
            continue;
        }
        
        const damageData = calculateMoveDamageRange(move, turn);
        moveDataList.push(damageData);
    }
    
    // ★修正：オボンのみの場合は基本瀕死率計算のログを抑制
    const basicKOResult = calculateMultiTurnBasicKORateUnified(defenderHP, turns);
    
    // アイテム効果計算の結果配列を初期化
    const results = Array(turns).fill(0);
    const hpInfo = Array(turns).fill(null);
    
    try {
        // アイテム効果を考慮した瀕死率計算
        if (defenderItem.name === 'オボンのみ') {
            // ★修正: オボン専用のログ抑制版を使用
            calculateKORateWithSitrusBerryOranOnly(defenderHP, defenderHP, moveDataList, 0, false, 1.0, results, hpInfo);
            
            // オボンのみの理論計算結果を取得して適用（この部分は詳細ログを維持）
            const correctedRates = logOranBerryKOCalculationGeneric(defenderHP, moveDataList, basicKOResult, { rates: results });
            
            if (correctedRates) {
                for (let i = 0; i < correctedRates.length && i < results.length; i++) {
                    results[i] = correctedRates[i];
                }
            }
            
        } else if (defenderItem.name === 'たべのこし') {
            calculateKORateWithLeftovers(defenderHP, defenderHP, moveDataList, 0, 1.0, results, hpInfo, false);
        } else if (defenderItem.name === 'くろいヘドロ') {
            calculateKORateWithBlackSludge(defenderHP, defenderHP, moveDataList, 0, 1.0, results, hpInfo);
        } else if (isFigyBerry(defenderItem.name)) {
            calculateKORateWithFigyBerry(defenderHP, defenderHP, moveDataList, 0, false, 1.0, results, hpInfo);
        } else {
            for (let i = 0; i < turns; i++) {
                results[i] = basicKOResult.rates[i] || 0;
            }
        }
        
        if (!suppressBasicLogs) {
            console.log(`=== 【デバッグ】アイテム効果瀕死率計算完了: ${itemName || 'なし'} ===`);
        }
        
        return {
            rates: results,
            hpInfo: hpInfo,
            basis: basicKOResult.basis,
            hpRanges: basicKOResult.hpRanges
        };
        
    } catch (error) {
        console.error('アイテム効果計算でエラー:', error);
        throw error;
    }
}

// ログ抑制版の基本瀕死率計算関数
function calculateMultiTurnBasicKORateUnified(defenderHP, maxTurns, suppressLogs = false) {
    turnCommonInfoDisplayed.clear();
    const results = Array(maxTurns).fill(0);
    const calculationBasis = Array(maxTurns).fill(null);
    const remainingHPRanges = Array(maxTurns).fill(null);
    
    // ★修正: suppressLogsフラグでログ制御
    if (!suppressLogs) {
        console.log('=== 統合版基本瀕死率計算開始 ===');
    }
    
    // moveDataListを構築
    const moveDataList = [];
    for (let turn = 0; turn < maxTurns; turn++) {
        const move = turn === 0 ? currentMove : multiTurnMoves[turn];
        
        if (!move) {
            const firstMove = currentMove;
            if (firstMove) {
                const damageData = calculateMoveDamageRange(firstMove, turn);
                moveDataList.push(damageData);
            } else {
                moveDataList.push(null);
            }
            continue;
        }
        
        const damageData = calculateMoveDamageRange(move, turn);
        moveDataList.push(damageData);
    }
    
    // ★修正: 計算根拠（basis）を正しく設定
    for (let turn = 0; turn < maxTurns; turn++) {
        if (moveDataList[turn]) {
            const move = turn === 0 ? currentMove : multiTurnMoves[turn];
            const moveData = moveDataList[turn];
            
            // ダメージ範囲を正確に取得
            const minDamage = moveData.minDamage || 0;
            const maxDamage = moveData.maxDamage || 0;
            const accuracy = moveData.accuracy || 1.0;
            
            // 急所ダメージ範囲を取得（既に計算済み）
            const minCritDamage = moveData.minCritDamage || Math.floor(minDamage * 1.5);
            const maxCritDamage = moveData.maxCritDamage || Math.floor(maxDamage * 1.5);
            
            // ★修正: suppressLogsフラグでログ制御
            if (!suppressLogs) {
                console.log(`${turn + 1}ターン目計算根拠設定: ${move.name} ダメージ${minDamage}~${maxDamage} 急所${minCritDamage}~${maxCritDamage} 命中${Math.round(accuracy * 100)}%`);
            }
            
            // 技クラスを判定
            let isMultiHit = false;
            if (move && move.class === 'multi_hit') {
                isMultiHit = true;
            }
            
            // 計算根拠オブジェクトを作成
            let displayDamageRange;
            if (move && move.class === 'three_hit') {
                displayDamageRange = `${minDamage * 3}~${maxDamage * 3}`;
            } else if (move && move.class === 'two_hit') {
                displayDamageRange = `${minDamage * 2}~${maxDamage * 2}`;
            } else {
                displayDamageRange = `${minDamage}~${maxDamage}`;
            }
            
            calculationBasis[turn] = {
                damageRange: displayDamageRange,
                accuracy: Math.round(accuracy * 100),
                isMultiHit: isMultiHit,
                moveName: move ? move.name : 'unknown',
                statusEffects: []
            };
        }
    }
    
    // 連続技処理の判定
    const hasAnyMultiHit = moveDataList.some((moveData, index) => {
        const move = index === 0 ? currentMove : multiTurnMoves[index];
        return move && move.class === 'multi_hit';
    });
    
    const multiHitTurns = new Set();
    for (let turn = 0; turn < maxTurns; turn++) {
        const move = turn === 0 ? currentMove : multiTurnMoves[turn];
        if (move && move.class === 'multi_hit') {
            multiHitTurns.add(turn);
        }
    }
    
    const leechSeed2Select = document.getElementById('leechSeed2Select');
    const hasLeechSeedHeal = leechSeed2Select && leechSeed2Select.value !== 'none';
    
    if (hasAnyMultiHit) {
        if (!suppressLogs) {
            console.log('=== 連続技混在: 統合計算開始 ===');
        }
        
        if (hasLeechSeedHeal) {
            calculateKORateWithConstantDamage(defenderHP, defenderHP, moveDataList, 0, 1.0, results, null);
        } else {
            calculateMixedKORateProbability(defenderHP, moveDataList, 0, 0, 1.0, results);
        }
    } else {       
        if (hasLeechSeedHeal) {
            calculateKORateWithConstantDamage(defenderHP, defenderHP, moveDataList, 0, 1.0, results, null);
        } else {
            calculateKORateProbability(defenderHP, moveDataList, 0, 0, 1.0, results);
        }
    }
    
    // ★修正: suppressLogsフラグでログ制御
    if (!suppressLogs) {
        const resultSummary = results.map((rate, i) => {
            const percent = rate * 100;
            const decimals = percent < 1 ? 3 : 1;
            return `${i+1}T: ${percent.toFixed(decimals)}%`;
        });
        console.log('統合版最終瀕死率:', resultSummary);
        console.log('=== 統合版基本瀕死率計算完了 ===');
    }
    
    return {
        rates: results,
        basis: calculationBasis,
        hpRanges: remainingHPRanges
    };
}

// アイテム効果を考慮した複数ターン瀕死率計算（修正版）
function calculateMultiTurnKORateWithItems(defenderHP, turns) {
    const defenderItem = defenderPokemon.item;
    const itemName = defenderItem ? defenderItem.name : null;
    
    // オボンのみの場合はログ抑制フラグを設定
    const suppressBasicLogs = (defenderItem && defenderItem.name === 'オボンのみ');
    
    if (!suppressBasicLogs) {
        console.log(`=== 【デバッグ】アイテム効果瀕死率計算開始: ${itemName || 'なし'} ===`);
    }
    
    // 各技のダメージ範囲を事前計算
    const moveDataList = [];
    for (let turn = 0; turn < turns; turn++) {
        const move = turn === 0 ? currentMove : multiTurnMoves[turn];
        
        if (!move) {
            const firstMove = currentMove;
            if (firstMove) {
                const damageData = calculateMoveDamageRange(firstMove, turn);
                moveDataList.push(damageData);
            } else {
                moveDataList.push(null);
            }
            continue;
        }
        
        const damageData = calculateMoveDamageRange(move, turn);
        moveDataList.push(damageData);
    }
    
    // ★修正：基本瀕死率計算のログを抑制（2回目の呼び出しなので）
    const basicKOResult = calculateMultiTurnBasicKORateUnified(defenderHP, turns, true); // suppressLogs = true
    
    // アイテム効果計算の結果配列を初期化
    const results = Array(turns).fill(0);
    const hpInfo = Array(turns).fill(null);
    
    try {
        // アイテム効果を考慮した瀕死率計算
        if (defenderItem.name === 'オボンのみ') {
            // オボン専用のログ抑制版を使用
            calculateKORateWithSitrusBerryOranOnly(defenderHP, defenderHP, moveDataList, 0, false, 1.0, results, hpInfo);
            
            // オボンのみの理論計算結果を取得して適用（この部分は詳細ログを維持）
            const correctedRates = logOranBerryKOCalculationGeneric(defenderHP, moveDataList, basicKOResult, { rates: results });
            
            if (correctedRates) {
                for (let i = 0; i < correctedRates.length && i < results.length; i++) {
                    results[i] = correctedRates[i];
                }
            }
            
        } else if (defenderItem.name === 'たべのこし') {
            calculateKORateWithLeftovers(defenderHP, defenderHP, moveDataList, 0, 1.0, results, hpInfo, false);
        } else if (defenderItem.name === 'くろいヘドロ') {
            calculateKORateWithBlackSludge(defenderHP, defenderHP, moveDataList, 0, 1.0, results, hpInfo);
        } else if (isFigyBerry(defenderItem.name)) {
            calculateKORateWithFigyBerry(defenderHP, defenderHP, moveDataList, 0, false, 1.0, results, hpInfo);
        } else {
            for (let i = 0; i < turns; i++) {
                results[i] = basicKOResult.rates[i] || 0;
            }
        }
        
        if (!suppressBasicLogs) {
            console.log(`=== 【デバッグ】アイテム効果瀕死率計算完了: ${itemName || 'なし'} ===`);
        }
        
        return {
            rates: results,
            hpInfo: hpInfo,
            basis: basicKOResult.basis,
            hpRanges: basicKOResult.hpRanges
        };
        
    } catch (error) {
        console.error('アイテム効果計算でエラー:', error);
        throw error;
    }
}

// 統合版瀕死率表示HTML生成（修正版）
function generateUnifiedKORateHTML(koRates, actualTurns, moveInfo, evasionRankText = '', isMultiTurn = false) {
    if (!koRates || !koRates.basic) return '';
    
    const defenderItem = defenderPokemon.item;
    const hasItemEffect = defenderItem && (
        defenderItem.name === 'たべのこし' || 
        defenderItem.name === 'オボンのみ' ||
        defenderItem.name === 'くろいヘドロ' ||
        isFigyBerry(defenderItem.name)
    );
    
    let html = '<div class="ko-rate-section"><h4>瀕死率詳細</h4>';
    
    // 計算条件の説明
    html += '<div class="calculation-conditions" style="text-align: center; margin-bottom: 10px; font-size: 11px; color: #666;">';
    html += '急所率1/16を考慮';
    if (evasionRankText) {
        html += evasionRankText;
    }
    html += '</div>';
    
    // アイテム情報の表示
    if (hasItemEffect) {
        html += `<div class="item-info" style="text-align: center; margin-bottom: 10px; font-size: 12px; color: #666;">
            持ち物: ${defenderItem.name}
        </div>`;
    }
    
    // ターン数分だけ表示（単発の場合は1ターンのみ）
    const displayTurns = isMultiTurn ? actualTurns : 1;
    
    for (let turn = 0; turn < displayTurns; turn++) {
        const turnNumber = turn + 1;
        
        // 1ターン目は「常に」基本瀕死率を使用
        let displayRate;
        if (turnNumber === 1) {
            displayRate = koRates.basic[turn];
        } else {
            // 2ターン目以降：アイテム効果を考慮した瀕死率
            if (hasItemEffect && koRates.withItems && koRates.withItems[turn] !== undefined) {
                displayRate = koRates.withItems[turn];
            } else {
                displayRate = koRates.basic[turn];
            }
        }
        
        // ★修正: 計算根拠を生成（basis情報が正しく設定されている前提）
        let basis = '';
        if (koRates.basis && koRates.basis[turn]) {
            const b = koRates.basis[turn];
            
            // ダメージ範囲を取得（undefinedチェック付き）
            const damageRange = b.damageRange || 'unknown';
            
            let moveName;
            if (isMultiTurn && moveInfo && moveInfo[turn]) {
                // 複数ターンの場合：定数ダメージ名も追加
                const constantDamageNames = getConstantDamageNamesForTurn(turnNumber);
                moveName = moveInfo[turn].name;
                if (constantDamageNames.length > 0) {
                    moveName += '+' + constantDamageNames.join('+');
                }
            } else {
                // 単発の場合：技名のみ
                moveName = currentMove ? currentMove.name : b.moveName || 'unknown';
            }
            
            // ダメージ範囲を含む基本情報
            basis = `[${moveName} (ダメージ:${damageRange})]<br>`;
            
            // 説明文
            if (turnNumber === 1) {
                if (b.isMultiHit) {
                    basis += `連続技各回数の発生確率と外れ時の両方を考慮<br>`;
                } else {
                    basis += `命中時と外れ時の両方を考慮<br>`;
                }
            } else {
                basis += `前ターンの結果を考慮した累積計算<br>`;
            }
            
            // 命中率情報
            const weather = document.getElementById('weatherSelect').value;
            const hasHarikiri = document.getElementById('harikiriCheck')?.checked;
            
            let accText = `命中${b.accuracy}%`;
            if (weather === 'rain' && (isMultiTurn ? moveInfo[turn].name : currentMove.name) === 'かみなり') {
                accText = '必中（雨天）';
            } else if (b.accuracy === 100 || b.accuracy === 0) {
                if (b.accuracy === 100) {
                    accText = `命中${b.accuracy}%`;
                } else {
                    accText = '必中';
                }
            } else if (hasHarikiri && (isMultiTurn ? moveInfo[turn].category : currentMove.category) === '物理') {
                accText += '（はりきり補正済）';
            }
            
            // 状態異常効果
            if (b.statusEffects && b.statusEffects.length > 0) {
                const statusModifiers = [];
                b.statusEffects.forEach(effect => {
                    if (effect.includes('ひかりのこな')) {
                        statusModifiers.push('ひかりのこな');
                    } else if (effect.includes('まひ')) {
                        statusModifiers.push('まひ');
                    } else if (effect.includes('こんらん')) {
                        statusModifiers.push('こんらん');
                    }
                });
                if (statusModifiers.length > 0) {
                    accText += `×${statusModifiers.join('×')}`;
                }
            }
            
            basis += `×${accText}`;
        } else {
            // basisが設定されていない場合のフォールバック
            const moveName = isMultiTurn && moveInfo && moveInfo[turn] ? 
                moveInfo[turn].name : 
                (currentMove ? currentMove.name : 'unknown');
            
            basis = `[${moveName} (ダメージ:計算中)]<br>`;
            basis += turnNumber === 1 ? '命中時と外れ時の両方を考慮<br>' : '前ターンの結果を考慮した累積計算<br>';
            basis += '×命中率取得中';
        }

        html += `<div class="ko-rate-row">`;
        
        // ターン番号と瀕死率
        html += `<div class="ko-rate-header">`;
        html += `<span class="ko-turn">${turnNumber}ターン:</span>`;
        const percent = displayRate * 100;
        const decimals = percent < 1 ? 3 : 1;
        html += `<span class="ko-basic">${percent.toFixed(decimals)}%</span>`;
        html += `</div>`;
        
        // 計算根拠
        html += `<div class="ko-basis">${basis}</div>`;
        
        html += `</div>`;
    }
    
    // 単発かつアイテム効果がある場合の注釈
    if (!isMultiTurn && hasItemEffect) {
        html += `<div class="item-note" style="margin-top: 10px; font-size: 11px; color: #888;">
            ※ ${defenderItem.name}の効果は1ターン目では発動しません
        </div>`;
    }
    
    html += '</div>';
    return html;
}


// 確率計算関数
function calculateKORateProbability(remainingHP, moveDataList, turnIndex, totalDamage, currentProbability, results) {
    if (remainingHP <= 0) {
        for (let i = turnIndex; i < results.length; i++) {
            results[i] += currentProbability;
        }
        return;
    }
    
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        calculateKORateProbability(remainingHP, moveDataList, turnIndex + 1, totalDamage, currentProbability, results);
        return;
    }
    
    const criticalRate = getCriticalRate();
    const normalRate = 1 - criticalRate;
    
    // ★修正: ターン開始時の情報のみ表示（logOranBerryKOCalculationGeneric スタイル）
    if (!turnCommonInfoDisplayed.has(turnIndex)) {
        turnCommonInfoDisplayed.add(turnIndex);
    }
    
    // ★修正: 重要なパターンのみログ出力（確率0.1%以上、logOranBerryKOCalculationGeneric スタイル）
    const shouldLog = currentProbability >= 0.001;
    
    if (shouldLog) {
        // 通常ダメージで倒せるパターン数を計算
        let normalKOPatterns = 0;
        for (let i = 0; i < 16; i++) {
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            if (normalDamage >= remainingHP) {
                normalKOPatterns++;
            }
        }
        
        // 急所ダメージで倒せるパターン数を計算
        let critKOPatterns = 0;
        for (let i = 0; i < 16; i++) {
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            if (critDamage >= remainingHP) {
                critKOPatterns++;
            }
        }
    }
    
    // 技が外れた場合
    const missProbability = 1 - moveData.accuracy;
    if (missProbability > 0) {
        calculateKORateProbability(remainingHP, moveDataList, turnIndex + 1, totalDamage, currentProbability * missProbability, results);
    }
    
    // 命中した場合の処理
    const hitProbability = moveData.accuracy;
    if (hitProbability > 0) {
        // 3回攻撃技の特別処理
        console.log(`=== KORateProbability関数2(9897行): 3回攻撃技チェック ===`);
        console.log(`currentMove:`, currentMove);
        console.log(`currentMove.class:`, currentMove ? currentMove.class : 'undefined');
        console.log(`moveData.minDamage:`, moveData.minDamage);
        console.log(`moveData.maxDamage:`, moveData.maxDamage);
        console.log(`moveData.minCritDamage:`, moveData.minCritDamage);
        console.log(`moveData.maxCritDamage:`, moveData.maxCritDamage);
        if (currentMove && currentMove.class === 'three_hit') {
            console.log(`3回攻撃技として処理開始（関数2）`);
            calculateThreeHitKORate(remainingHP, moveData, turnIndex, totalDamage, currentProbability * hitProbability, results, moveDataList);
            return;
        }
        
        if (currentMove && currentMove.class === 'two_hit') {
            console.log(`2回攻撃技として処理開始（関数2）`);
            calculateTwoHitKORate(remainingHP, moveData, turnIndex, totalDamage, currentProbability * hitProbability, results, moveDataList);
            return;
        }
        
        // 各ダメージパターンを処理
        for (let i = 0; i < 16; i++) {
            // 通常ダメージ
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            const normalProb = (1/16) * normalRate;
            
            if (normalDamage >= remainingHP) {
                const koProb = currentProbability * hitProbability * normalProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                const surviveProb = currentProbability * hitProbability * normalProb;
                calculateKORateProbability(
                    remainingHP - normalDamage,
                    moveDataList,
                    turnIndex + 1,
                    totalDamage + normalDamage,
                    surviveProb,
                    results
                );
            }
            
            // 急所ダメージ
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            const critProb = (1/16) * criticalRate;
            
            if (critDamage >= remainingHP) {
                const koProb = currentProbability * hitProbability * critProb;
                for (let j = turnIndex; j < results.length; j++) {
                    results[j] += koProb;
                }
            } else {
                const surviveProb = currentProbability * hitProbability * critProb;
                calculateKORateProbability(
                    remainingHP - critDamage,
                    moveDataList,
                    turnIndex + 1,
                    totalDamage + critDamage,
                    surviveProb,
                    results
                );
            }
        }
    }
}

// フィラ系きのみ効果を考慮した確率計算
function calculateKORateWithFigyBerry(currentHP, maxHP, moveDataList, turnIndex, berryUsed, currentProbability, results, hpInfo) {
    if (currentHP <= 0) {
        for (let i = turnIndex; i < results.length; i++) {
            results[i] += currentProbability;
        }
        return;
    }
    
    if (turnIndex >= moveDataList.length) {
        return;
    }
    
    const moveData = moveDataList[turnIndex];
    if (!moveData) {
        // ターン終了時の定数ダメージ処理
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const finalHP = Math.max(0, currentHP - constantDamage);
        const berryName = defenderPokemon.item ? defenderPokemon.item.name : 'フィラ系きのみ';
        
        if (hpInfo) {
            hpInfo[turnIndex] = {
                beforeHeal: currentHP,
                afterHeal: finalHP,
                healAmount: 0,
                constantDamage: constantDamage,
                netHealing: -constantDamage,
                healType: berryUsed ? `${berryName}(使用済み)` : `${berryName}(未発動)`,
                maxHP: maxHP,
                berryActivated: false
            };
        }
        
        calculateKORateWithFigyBerry(finalHP, maxHP, moveDataList, turnIndex + 1, berryUsed, currentProbability, results, hpInfo);
        return;
    }
    
    // 技が外れた場合
    const missProbability = 1 - moveData.accuracy;
    if (missProbability > 0) {
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const finalHP = Math.max(0, currentHP - constantDamage);
        calculateKORateWithFigyBerry(finalHP, maxHP, moveDataList, turnIndex + 1, berryUsed, currentProbability * missProbability, results, hpInfo);
    }
    
    // 技が命中した場合の処理
    const hitProbability = moveData.accuracy;
    
    if (hitProbability > 0) {
        let totalKOProbability = 0;
        
        // 全16パターンの通常ダメージを個別計算
        for (let i = 0; i < 16; i++) {
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            const normalPatternProb = (1/16) * (15/16);
            
            // ★重要：瀞死判定は攻撃ダメージのみで行う
            if (normalDamage >= currentHP) {
                totalKOProbability += normalPatternProb;
            } else {
                const hpAfterDamage = currentHP - normalDamage;
                const surviveProb = currentProbability * hitProbability * normalPatternProb;
                processPostDamageFigyHealingFixed(hpAfterDamage, maxHP, berryUsed, surviveProb, turnIndex, moveDataList, results, hpInfo);
            }
        }
        
        // 全16パターンの急所ダメージを個別計算
        for (let i = 0; i < 16; i++) {
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            const critPatternProb = (1/16) * (1/16);
            
            // ★重要：瀞死判定は攻撃ダメージのみで行う
            if (critDamage >= currentHP) {
                totalKOProbability += critPatternProb;
            } else {
                const hpAfterDamage = currentHP - critDamage;
                const surviveProb = currentProbability * hitProbability * critPatternProb;
                processPostDamageFigyHealingFixed(hpAfterDamage, maxHP, berryUsed, surviveProb, turnIndex, moveDataList, results, hpInfo);
            }
        }
        
        // このターンで瀞死する確率を結果に加算
        const koThisTurn = currentProbability * hitProbability * totalKOProbability;
        if (koThisTurn > 0) {
            for (let i = turnIndex; i < results.length; i++) {
                results[i] += koThisTurn;
            }
        }
    }
}

//フィラ系きのみのダメージ後回復処理
function processPostDamageFigyHealingFixed(hpAfterDamage, maxHP, berryUsed, probability, turnIndex, moveDataList, results, hpInfo) {
    // ★重要: 攻撃ダメージで瀕死になった場合はフィラ系きのみは発動しない
    if (hpAfterDamage <= 0) {
        // 瀕死の場合はアイテム効果なし
        for (let i = turnIndex; i < results.length; i++) {
            results[i] += probability;
        }
        return;
    }
    
    // 生存している場合のみフィラ系きのみ発動チェック
    if (!berryUsed && hpAfterDamage > 0 && hpAfterDamage <= maxHP / 2) {
        const healAmount = Math.floor(maxHP / 8);
        let healedHP = Math.min(hpAfterDamage + healAmount, maxHP);
        
        // やどりぎ回復量を追加
        let additionalHeal = 0;
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                additionalHeal = calculateLeechSeed2HealAmount();
                healedHP = Math.min(healedHP + additionalHeal, maxHP);
            }
        }
        
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const finalHP = Math.max(0, healedHP - constantDamage);
        const totalHealAmount = healAmount + additionalHeal;
        const netHealing = totalHealAmount - constantDamage;
        const berryName = defenderPokemon.item ? defenderPokemon.item.name : 'フィラ系きのみ';
        
        if (hpInfo) {
            hpInfo[turnIndex] = {
                beforeHeal: hpAfterDamage,
                afterHeal: finalHP,
                healAmount: totalHealAmount,
                constantDamage: constantDamage,
                netHealing: netHealing,
                healType: additionalHeal > 0 ? `${berryName}+やどりぎ回復` : berryName,
                berryActivated: true,
                activationTurn: turnIndex + 1,
                maxHP: maxHP
            };
        }
        
        calculateKORateWithFigyBerry(finalHP, maxHP, moveDataList, turnIndex + 1, true, probability, results, hpInfo);
    } else {
        // やどりぎ回復のみチェック
        let healAmount = 0;
        const leechSeed2Select = document.getElementById('leechSeed2Select');
        if (leechSeed2Select) {
            const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
            if (!isNaN(leechSeed2StartTurn) && turnIndex + 1 >= leechSeed2StartTurn) {
                healAmount = calculateLeechSeed2HealAmount();
            }
        }
        
        const constantDamage = calculateTotalConstantDamage(maxHP, defenderPokemon.types, turnIndex + 1);
        const finalHP = Math.max(0, hpAfterDamage + healAmount - constantDamage);
        const netHealing = healAmount - constantDamage;
        const berryName = defenderPokemon.item ? defenderPokemon.item.name : 'フィラ系きのみ';
        
        if (hpInfo && !hpInfo[turnIndex]) {
            let healType;
            if (berryUsed) {
                healType = healAmount > 0 ? `${berryName}(使用済み)+やどりぎ回復` : `${berryName}(使用済み)`;
            } else {
                healType = healAmount > 0 ? 'やどりぎ回復のみ' : `${berryName}(未発動)`;
            }
            
            hpInfo[turnIndex] = {
                beforeHeal: hpAfterDamage,
                afterHeal: finalHP,
                healAmount: healAmount,
                constantDamage: constantDamage,
                netHealing: netHealing,
                healType: healType,
                berryActivated: false,
                activationTurn: null,
                maxHP: maxHP
            };
        }
        
        calculateKORateWithFigyBerry(finalHP, maxHP, moveDataList, turnIndex + 1, berryUsed, probability, results, hpInfo);
    }
}

// 共通の瀕死率計算処理
function processKORateCalculation(currentHP, maxHP, moveData, turnIndex, currentProbability, results, hpInfo, onSurvive) {
    const hitProbability = moveData.accuracy;
    
    // 技が命中した場合の処理
    if (hitProbability > 0) {
        let totalKOProbability = 0;
        
        // 全16パターンの通常ダメージを個別計算
        for (let i = 0; i < 16; i++) {
            const normalDamage = Math.floor(moveData.minDamage + (moveData.maxDamage - moveData.minDamage) * i / 15);
            const normalPatternProb = (1/16) * (15/16); // 通常ダメージの各パターンの確率
            
            if (normalDamage >= currentHP) {
                // 通常ダメージで瀕死
                totalKOProbability += normalPatternProb;
            } else {
                // 通常ダメージで生存 - 個別に次ターンへ
                const remainingHP = Math.max(1, currentHP - normalDamage);
                const surviveProb = currentProbability * hitProbability * normalPatternProb;
                if (surviveProb > 0.0001) { // 極小確率はスキップ
                    onSurvive(remainingHP, surviveProb);
                }
            }
        }
        
        // 全16パターンの急所ダメージを個別計算
        for (let i = 0; i < 16; i++) {
            const critDamage = Math.floor(moveData.minCritDamage + (moveData.maxCritDamage - moveData.minCritDamage) * i / 15);
            const critPatternProb = (1/16) * (1/16); // 急所ダメージの各パターンの確率
            
            if (critDamage >= currentHP) {
                // 急所ダメージで瀕死
                totalKOProbability += critPatternProb;
            } else {
                // 急所ダメージで生存 - 個別に次ターンへ
                const remainingHP = Math.max(1, currentHP - critDamage);
                const surviveProb = currentProbability * hitProbability * critPatternProb;
                if (surviveProb > 0.0001) { // 極小確率はスキップ
                    onSurvive(remainingHP, surviveProb);
                }
            }
        }
        
        // このターンで瀕死する確率を結果に加算
        const koThisTurn = currentProbability * hitProbability * totalKOProbability;
        if (koThisTurn > 0) {
            for (let i = turnIndex; i < results.length; i++) {
                results[i] += koThisTurn;
            }
        }
    }
}

// ========================
// 10. 結果表示の改良
// ========================

function displayEnhancedDamageResult(minDamage, maxDamage, totalHP) {
   // 複数ターン技が設定されているかチェック
   if (hasMultiTurnMoves()) {
       const defenderStats = calculateStats(defenderPokemon);
       displayMultiTurnResults(defenderStats.hp, false);
       return;
   }
   
   // 単発技の場合は統合版を直接呼び出し
   displaySingleTurnResult(minDamage, maxDamage, totalHP);
}

function displayPresentHealingResult(resultDiv, totalHP) {
    const currentHPInput = document.getElementById('defenderCurrentHP');
    const currentHP = currentHPInput && currentHPInput.value ?
        parseInt(currentHPInput.value) || totalHP :
        totalHP;
    const healOutcome = getPresentOutcomes(totalHP).find(outcome => outcome.kind === 'heal');
    const actualHeal = Math.max(0, Math.min(healOutcome.amount, totalHP - currentHP));

    resultDiv.innerHTML = `
        <div class="damage-result">
            <h3>プレゼント回復結果</h3>
            <div class="result-info">
                <p><strong>攻撃側:</strong> ${attackerPokemon.name}</p>
                <p><strong>防御側:</strong> ${defenderPokemon.name} H${currentHP}/${totalHP}</p>
                <p><strong>使用技:</strong> プレゼント (相手を1/4回復, 発生率20%)</p>
            </div>
            <div class="result-info2">
                <p><strong>回復量:</strong> ${actualHeal} (最大${healOutcome.amount})</p>
                <p><strong>回復後HP:</strong> ${currentHP + actualHeal}/${totalHP}</p>
            </div>
        </div>
    `;
}

// 結果表示の統合関数
function displayUnifiedResults(minDamage, maxDamage, totalHP, isMultiTurn = false, atkRank = '±0', defRank = '±0') {
    const resultDiv = document.getElementById('calculationResult');

    if (isPresentHealingSelected(currentMove)) {
        displayPresentHealingResult(resultDiv, totalHP);
        return;
    }
    
    // 1ターン目の技を設定
    multiTurnMoves[0] = currentMove;
    
    // 実際に設定されている技の数を確認
    let actualTurns = 1; // 最低1ターン
    for (let i = 1; i < 5; i++) {
        if (multiTurnMoves[i] && multiTurnMoves[i].name) {
            actualTurns = i + 1;
        }
    }
    
    // 状態異常がある場合は最低2ターン計算
    const paralysisSelect = document.getElementById('paralysisSelect');
    const confusionSelect = document.getElementById('confusionSelect');
    const hasParalysis = paralysisSelect && paralysisSelect.value !== 'none';
    const hasConfusion = confusionSelect && confusionSelect.value !== 'none';
    const hasStatusAbnormality = hasParalysis || hasConfusion;
    
    if (isMultiTurn && hasStatusAbnormality && actualTurns < 2) {
        actualTurns = 2; // 状態異常がある場合は最低2ターン
    }
    
    // 状態異常のみがある場合（技が1つしかない場合）の処理
    if (hasStatusAbnormality && actualTurns === 1) {
        const paralysisValue = hasParalysis ? parseInt(paralysisSelect.value) || 1 : 0;
        const confusionValue = hasConfusion ? parseInt(confusionSelect.value) || 1 : 0;
        const maxStatusTurn = Math.max(paralysisValue, confusionValue);
        actualTurns = Math.max(2, maxStatusTurn);
        
        // 2ターン目以降は1ターン目と同じ技を使用
        for (let i = 1; i < actualTurns; i++) {
            if (!multiTurnMoves[i]) {
                multiTurnMoves[i] = currentMove;
            }
        }
    }
    
    // 状態異常があるが技が設定されていないターンがある場合の追加処理
    if (hasStatusAbnormality) {
        const paralysisValue = hasParalysis ? parseInt(paralysisSelect.value) || 1 : 0;
        const confusionValue = hasConfusion ? parseInt(confusionSelect.value) || 1 : 0;
        const maxStatusTurn = Math.max(paralysisValue || 0, confusionValue || 0);
        const neededTurns = Math.max(actualTurns, maxStatusTurn, 2);

        for (let i = actualTurns; i < neededTurns; i++) {
            if (!multiTurnMoves[i]) {
                multiTurnMoves[i] = currentMove;
            }
        }
        actualTurns = neededTurns;
    }
    
    // ステータス計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    
    // 技の分類に応じて実数値を取得
    const isBeatUp = currentMove.class === 'beat_up';
    const isPhysical = currentMove.category === "Physical";
    const attackerOffensiveStat = isBeatUp ? attackerPokemon.baseStats.a :
        (isPhysical ? attackerStats.a : attackerStats.c);
    const defenderDefensiveStat = isBeatUp ? defenderPokemon.baseStats.b :
        (isPhysical ? defenderStats.b : defenderStats.d);
    
    // 現在HPを取得
    let currentHP = totalHP;
    const isSubstitute = document.getElementById('substituteCheck')?.checked || false;
    
    if (isSubstitute) {
        currentHP = Math.floor(totalHP / 4);
    } else {
        const currentHPInput = document.getElementById('defenderCurrentHP');
        if (currentHPInput && currentHPInput.value) {
            currentHP = parseInt(currentHPInput.value) || totalHP;
        }
    }
    
    // ★修正: 表示用ダメージ範囲は防御側アイテム効果を除外した値を使用
    let displayMinDamage, displayMaxDamage;
    
    // 防御側のアイテムを一時的に除外してダメージ計算
    const originalDefenderItem = defenderPokemon.item;
    defenderPokemon.item = null; // 防御側アイテムのみ除外
    
    // 威力計算（weight_based技などに対応）
    const displayPower = calculatePower(currentMove);
    
    const [baseDisplayMin, baseDisplayMax] = calculateDamage(
        attackerOffensiveStat,
        defenderDefensiveStat,
        attackerPokemon.level,
        displayPower,
        currentMove.category,
        currentMove.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank
    );
    
    // 防御側アイテムを元に戻す
    defenderPokemon.item = originalDefenderItem;
    
    // 連続技の場合の表示用ダメージ範囲計算
    if (currentMove && currentMove.class === 'psywave') {
        displayMinDamage = baseDisplayMin;
        displayMaxDamage = baseDisplayMax;
    } else if (currentMove && currentMove.class === 'multi_hit') {
        const hitCountSelect = document.getElementById('multiHitCount');
        const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';
        const constantDamage = calculateTotalConstantDamage(totalHP, defenderPokemon.types, 1);
        
        if (selectedHitCount === '2-5') {
            // 2-5回の場合
            displayMinDamage = baseDisplayMin * 2 + constantDamage;
            displayMaxDamage = baseDisplayMax * 5 + constantDamage;
        } else {
            // 固定回数の場合
            const hitCount = parseInt(selectedHitCount);
            displayMinDamage = baseDisplayMin * hitCount + constantDamage;
            displayMaxDamage = baseDisplayMax * hitCount + constantDamage;
        }
    } else if (currentMove && currentMove.class === 'two_hit') {
        displayMinDamage = baseDisplayMin * 2;
        displayMaxDamage = baseDisplayMax * 2;
    } else if (currentMove && currentMove.class === 'three_hit') {
        displayMinDamage = baseDisplayMin * 3;
        displayMaxDamage = baseDisplayMax * 3;
    } else {
        displayMinDamage = baseDisplayMin;
        displayMaxDamage = baseDisplayMax;
    }
    
    // 現在の技から命中率を取得
    const moveAccuracy = currentMove ? (currentMove.accuracy || 100) : 100;
    const accuracyText = moveAccuracy < 100 ? `, 命中${moveAccuracy}` : '';
    
    // 定数ダメージを計算
    const constantDamage = calculateTotalConstantDamage(totalHP, defenderPokemon.types, 1);
    
    // 瀕死率計算（実際の技数分だけ）
    let koRatesTurns = actualTurns;
    
    // 状態異常がある場合は、状態異常の最大ターン数まで計算
    if (hasStatusAbnormality) {
        const paralysisValue = paralysisSelect && paralysisSelect.value !== 'none' ? parseInt(paralysisSelect.value) : 0;
        const confusionValue = confusionSelect && confusionSelect.value !== 'none' ? parseInt(confusionSelect.value) : 0;
        const maxStatusTurn = Math.max(paralysisValue || 0, confusionValue || 0);
        koRatesTurns = Math.max(actualTurns, maxStatusTurn, 2);
    }

    // ★★★ 根本修正: 瀕死率計算を分離し、1ターン目は必ず基本瀕死率のみ使用 ★★★
    let basicRand;
    let koRates = null;
    
    // 1. 基本的な乱数計算（表示用）
    if (currentMove && currentMove.class === 'multi_hit' && !isMultiTurn) {
        const hitCountSelect = document.getElementById('multiHitCount');
        const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';

        if (selectedHitCount === '2-5') {
            basicRand = calculateSimpleRandText(displayMinDamage, displayMaxDamage, currentHP, isSubstitute, "2-5");
        } else {
            const hitCount = parseInt(selectedHitCount);
            basicRand = calculateSimpleRandText(displayMinDamage, displayMaxDamage, currentHP, isSubstitute, hitCount);
        }
    } else {
        basicRand = calculateRandText(displayMinDamage, displayMaxDamage, totalHP, currentMove);
    }
    
    // 2. 瀕死率計算（詳細表示用）
    try {
        // ★修正: 基本瀕死率のみを計算
        const basicKOResult = calculateMultiTurnBasicKORateUnified(totalHP, koRatesTurns);
        
        // アイテム効果を考慮した瀕死率を計算（2ターン目以降用）
        let itemKOResult = null;
        const defenderItem = defenderPokemon.item;
        const hasItemEffect = defenderItem && (
            defenderItem.name === 'たべのこし' || 
            defenderItem.name === 'オボンのみ' ||
            defenderItem.name === 'くろいヘドロ' ||
            isFigyBerry(defenderItem.name)
        );
        
        if (hasItemEffect && koRatesTurns > 1) {
            try {
                itemKOResult = calculateMultiTurnKORateWithItems(totalHP, koRatesTurns);
            } catch (itemError) {
                console.error('アイテム効果計算でエラー:', itemError);
                itemKOResult = null;
            }
        }
        
        // ★重要: koRatesオブジェクトを手動で構築し、1ターン目は必ず基本瀕死率を使用
        koRates = {
            basic: basicKOResult.rates.map(rate => rate), // 基本瀕死率をコピー
            withItems: null, // 初期化
            hpInfo: itemKOResult ? itemKOResult.hpInfo : null,
            basis: basicKOResult.basis,
            hpRanges: basicKOResult.hpRanges
        };
        
        // ★修正: アイテム効果ありの場合でも、1ターン目は基本瀕死率を強制使用
        if (itemKOResult && itemKOResult.rates) {
            koRates.withItems = [...itemKOResult.rates]; // アイテム考慮瀕死率をコピー
            
            // ★★★ 最重要: 1ターン目は必ず基本瀕死率で上書き ★★★
            koRates.withItems[0] = basicKOResult.rates[0];

        }
        
    } catch (error) {
        console.error('瀕死率計算でエラー:', error);
        // エラー時は基本的な瀕死率のみ
        koRates = {
            basic: [basicRand.percent ? parseFloat(basicRand.percent) : 0],
            withItems: null,
            hpInfo: null,
            basis: null,
            hpRanges: null
        };
    }
    
    // 平均ダメージ（定数ダメージ込み）
    const avgDamage = (displayMinDamage + displayMaxDamage) / 2;
    
    // HPバー作成
    const hpBarHtml = createHPBar(displayMinDamage, displayMaxDamage, totalHP, false);
    
    // 設定された技の情報を取得
    const moveInfo = [];
    for (let i = 0; i < actualTurns; i++) {
        if (multiTurnMoves[i]) {
            const move = multiTurnMoves[i];
            const displayPower = calculatePower(move);
            
            moveInfo.push({
                turn: i + 1,
                name: move.name,
                power: displayPower,
                type: move.type,
                category: move.category === 'Physical' ? '物理' : '特殊',
                accuracy: move.accuracy || 100
            });
        }
    }
    
    // 1発目の確定/乱数表記を生成
    let koSummaryText = '';
    let targetInfo = '';
    
    if (basicRand.isSubstitute) {
        targetInfo = `(みがわり: ${basicRand.targetHP}HP) `;
    } else if (basicRand.targetHP !== totalHP) {
        targetInfo = `(現在HP: ${basicRand.targetHP}) `;
    }
    
    if (basicRand.percent) {
        koSummaryText = `${targetInfo}${basicRand.randLevel}${basicRand.hits}発 (${basicRand.percent}%)`;
    } else {
        koSummaryText = `${targetInfo}${basicRand.randLevel}${basicRand.hits}発`;
    }
    
    // ランク補正情報を生成
    const getRankText = (rank, type) => {
        if (rank === '±0' || rank === '0') return '';
        return ` / ${rank}`;
    };
    
    const atkRankText = getRankText(atkRank, '攻撃');
    const defRankText = getRankText(defRank, '防御');
    const rankText = atkRankText + defRankText;
    
    // 回避ランク情報を取得
    const evasionRank = document.getElementById('defenderEvasionRank')?.value || '±0';
    const evasionRankText = (evasionRank !== '±0' && evasionRank !== '0') ? ` / 回避ランク${evasionRank}` : '';
    
    // 瀕死率表示のHTML生成
    const koRateHtml = generateUnifiedKORateHTML(koRates, actualTurns, moveInfo, evasionRankText, isMultiTurn);
    
    // タイトルを条件分岐
    const title = isMultiTurn ? '複数ターン瀕死率計算結果' : 'ダメージ計算結果';
    
    // ダメージ範囲の表記
    const damageRangeLabel = isMultiTurn ? '1発目のダメージ範囲' : 'ダメージ範囲';
    
    // ステータス表記の生成
    const offenseStatLabel = isBeatUp ? '種族A' : (isPhysical ? 'A' : 'C');
    const defenseStatLabel = isBeatUp ? '種族B' : (isPhysical ? 'B' : 'D');
    
    // 防御側HP表記の生成
    let defenderHPDisplay = '';
    if (isSubstitute) {
        defenderHPDisplay = `H${currentHP}(みがわり)`;
    } else if (currentHP === totalHP) {
        defenderHPDisplay = `H${currentHP}`;
    } else {
        defenderHPDisplay = `H${currentHP}/${totalHP}`;
    }
    
    // 技表示テキストの生成
    let moveDisplayText = '';
    if (currentMove && currentMove.class === 'psywave') {
        moveDisplayText = `${currentMove.name} (Lvの50～150%, ${currentMove.type}, 特殊${accuracyText})`;
    } else if (currentMove && currentMove.class === 'beat_up') {
        const members = parseBeatUpMembers(
            document.getElementById('beatUpMembers')?.value || '',
            attackerPokemon.level,
            attackerPokemon.baseStats.a
        );
        moveDisplayText = `${currentMove.name} (威力10×${members.length}体, 各手持ちのLv・攻撃種族値を使用${accuracyText})`;
    } else if (currentMove && currentMove.class === 'triple_kick') {
        const probabilities = getTripleKickHitProbabilities(currentMove.accuracy || 100);
        const hitCount = getSelectedTripleKickHitCount();
        const powers = getTripleKickPowers().slice(0, hitCount).join('→');
        moveDisplayText = `${currentMove.name} (威力${powers}, ${hitCount}段結果${(probabilities[hitCount] * 100).toFixed(1)}%, 各段命中${currentMove.accuracy}, ${currentMove.type}, 物理)`;
    } else if (currentMove && currentMove.class === 'multi_hit') {
        const hitCountSelect = document.getElementById('multiHitCount');
        const selectedHitCount = hitCountSelect ? hitCountSelect.value : '2-5';
        
        if (selectedHitCount === '2-5') {
            moveDisplayText = `${currentMove.name} (威力${calculatePower(currentMove)}×2-5発, ${currentMove.type}, ${currentMove.category === 'Physical' ? '物理' : '特殊'}${accuracyText})`;
        } else {
            const hitCount = parseInt(selectedHitCount);
            moveDisplayText = `${currentMove.name} (威力${calculatePower(currentMove)}×${hitCount}発, ${currentMove.type}, ${currentMove.category === 'Physical' ? '物理' : '特殊'}${accuracyText})`;
        }
    } else if (currentMove && currentMove.class === 'two_hit') {
        moveDisplayText = `${currentMove.name} (威力${calculatePower(currentMove)}×2発, ${currentMove.type}, ${currentMove.category === 'Physical' ? '物理' : '特殊'}${accuracyText})`;
    } else if (currentMove && currentMove.class === 'three_hit') {
        moveDisplayText = `${currentMove.name} (威力${calculatePower(currentMove)}×3発, ${currentMove.type}, ${currentMove.category === 'Physical' ? '物理' : '特殊'}${accuracyText})`;
    } else {
        moveDisplayText = `${currentMove.name} (威力${calculatePower(currentMove)}, ${currentMove.type}, ${currentMove.category === 'Physical' ? '物理' : '特殊'}${accuracyText})`;
    }
    
    let resultHtml = `
        <div class="damage-result">
            <div style="position: relative; margin-bottom: 10px;">
                <h3 style="margin: 0; text-align: center;">${title}</h3>
                <button onclick="copyResult(this)" style="position: absolute; top: 0; right: 0; padding: 3px 6px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; min-width: auto; width: auto;">コピー</button>
            </div>
            <div class="result-info">
                <p><strong>攻撃側:</strong> ${attackerPokemon.name} ${offenseStatLabel}${attackerOffensiveStat}</p>
                <p><strong>防御側:</strong> ${defenderPokemon.name} ${defenderHPDisplay}-${defenseStatLabel}${defenderDefensiveStat}</p>
                ${isMultiTurn ? `
                <div class="move-sequence">
                    <strong>技構成:</strong>
                    ${moveInfo.map(move => `
                        <div style="margin-left: 10px; font-size: 13px;">
                            ${move.turn}: ${move.name} (威力${move.power} / 命中${move.accuracy})
                        </div>
                    `).join('')}
                </div>
                ` : `
                <p><strong>使用技:</strong> ${moveDisplayText}</p>
                ${attackerPokemon.item && currentMove && isItemEffectiveForMove(attackerPokemon.item, currentMove) ? 
                    `<p><strong>持ち物:</strong> ${attackerPokemon.item.name}</p>` : ''}
                ${rankText ? `<p><strong>ランク補正:</strong> ${rankText.substring(3)}</p>` : ''}
                `}
            </div>
            <div class="result-info2">
                <p><strong>${damageRangeLabel}:</strong> ${displayMinDamage}～${displayMaxDamage} ${isMultiTurn ? `(平均: ${Math.floor(avgDamage)})` : ''}</p>
                <p><strong>割合:</strong> ${(displayMinDamage / currentHP * 100).toFixed(1)}%～${(displayMaxDamage / currentHP * 100).toFixed(1)}%</p>
                <p>${koSummaryText}</p>
            </div>
            ${hpBarHtml}

            ${koRateHtml}
        </div>
    `;
    resultDiv.innerHTML = resultHtml;
}

function calculateSimpleRandText(minDamage, maxDamage, targetHP, isSubstitute, hitCount) {
    const effectiveMinDamage = minDamage;
    const effectiveMaxDamage = maxDamage;
    
    // 確定1発判定
    if (effectiveMinDamage >= targetHP) {
        return {
            hits: 1,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
    
    // 乱数1発判定
    if (effectiveMaxDamage >= targetHP) {
        const successfulRange = effectiveMaxDamage - Math.max(effectiveMinDamage, targetHP) + 1;
        const totalRange = effectiveMaxDamage - effectiveMinDamage + 1;
        const successRate = (successfulRange / totalRange) * 100;
        
        let randLevel = "";
        if (successRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (successRate >= 75.0) {
            randLevel = "高乱数";
        } else if (successRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (successRate >= 37.5) {
            randLevel = "中乱数";
        } else if (successRate >= 25.0) {
            randLevel = "中低乱数";
        } else if (successRate > 6.3) {
            randLevel = "低乱数";
        } else {
            randLevel = "超低乱数";
        }
        
        return {
            hits: 1,
            percent: successRate.toFixed(1),
            randLevel: randLevel,
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
    
    // 2発以上必要な場合の判定
    const minHits = Math.ceil(targetHP / effectiveMaxDamage); // 最小必要回数
    const maxHits = Math.ceil(targetHP / effectiveMinDamage); // 最大必要回数
    
    if (minHits === maxHits) {
        // 確定n発
        return {
            hits: minHits,
            percent: null,
            randLevel: "確定",
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    } else {
        // 乱数n発（最小回数で表示）
        // 簡易的な乱数計算
        let successRate = 50.0; // デフォルト値
        
        // より正確な計算が必要な場合はここで実装
        if (minHits === 2 && maxHits > 2) {
            // 2発で倒せる確率を計算
            const totalOutcomes = Math.pow(effectiveMaxDamage - effectiveMinDamage + 1, 2);
            let successfulOutcomes = 0;
            
            for (let dmg1 = effectiveMinDamage; dmg1 <= effectiveMaxDamage; dmg1++) {
                const requiredDmg2 = targetHP - dmg1;
                if (requiredDmg2 <= 0) {
                    successfulOutcomes += effectiveMaxDamage - effectiveMinDamage + 1;
                } else if (requiredDmg2 <= effectiveMaxDamage) {
                    successfulOutcomes += Math.max(0, effectiveMaxDamage - Math.max(effectiveMinDamage, requiredDmg2) + 1);
                }
            }
            
            successRate = (successfulOutcomes / totalOutcomes) * 100;
        }
        
        let randLevel = "";
        if (successRate >= 93.75) {
            randLevel = "超高乱数";
        } else if (successRate >= 75.0) {
            randLevel = "高乱数";
        } else if (successRate >= 62.5) {
            randLevel = "中高乱数";
        } else if (successRate >= 37.5) {
            randLevel = "中乱数";
        } else if (successRate >= 25.0) {
            randLevel = "中低乱数";
        } else if (successRate > 6.3) {
            randLevel = "低乱数";
        } else {
            randLevel = "超低乱数";
        }
        
        return {
            hits: minHits,
            percent: successRate.toFixed(1),
            randLevel: randLevel,
            effectiveMinDamage: effectiveMinDamage,
            effectiveMaxDamage: effectiveMaxDamage,
            isSubstitute: isSubstitute,
            targetHP: targetHP
        };
    }
}

function displayMultiTurnResults(totalHP, isSingleMove = false) {
    // 実際に複数ターン技が設定されている場合のみ呼び出される

    // ランク補正取得
    const atkRankElement = document.getElementById('attackerAtkRank');
    const defRankElement = document.getElementById('defenderDefRank');
    
    const atkRank = atkRankElement ? atkRankElement.value : '±0';
    const defRank = defRankElement ? defRankElement.value : '±0';
    
    // 最初の技のダメージ計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    const isPhysical = currentMove.category === "Physical";
    const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
    const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
    
    const [minDamage, maxDamage] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        calculatePower(currentMove),
        currentMove.category,
        currentMove.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank
    );
    
    // 複数ターン表示として処理
    displayUnifiedResults(minDamage, maxDamage, totalHP, true, atkRank, defRank);
}

// 単発ターン結果表示（統合版を呼び出し）
function displaySingleTurnResult(minDamage, maxDamage, totalHP) {
    displayUnifiedResults(minDamage, maxDamage, totalHP, false);
}

// 統合版瀕死率表示HTML生成（単発・複数ターン対応）
function generateUnifiedKORateHTML(koRates, actualTurns, moveInfo, evasionRankText = '', isMultiTurn = false) {
    if (!koRates || !koRates.basic) return '';
    
    const defenderItem = defenderPokemon.item;
    const hasItemEffect = defenderItem && (
        defenderItem.name === 'たべのこし' || 
        defenderItem.name === 'オボンのみ' ||
        defenderItem.name === 'くろいヘドロ' ||
        isFigyBerry(defenderItem.name)
    );
    
    const criticalRate = getCriticalRate();
    let criticalRateText;
    if(criticalRate == 1/16){
        criticalRateText = '1/16';
    }
    else if(criticalRate == 1/8){
        criticalRateText = '1/8';
    }
    let html = '<div class="ko-rate-section"><h4>瀕死率詳細</h4>';
    
    // 計算条件の説明
    html += '<div class="calculation-conditions" style="text-align: center; margin-bottom: 10px; font-size: 11px; color: #666;">';
    html += '急所率' + criticalRateText + 'を考慮';
    if (evasionRankText) {
        html += evasionRankText;
    }
    html += '</div>';
    
    // アイテム情報の表示
    if (hasItemEffect) {
        html += `<div class="item-info" style="text-align: center; margin-bottom: 10px; font-size: 12px; color: #666;">
            持ち物: ${defenderItem.name}
        </div>`;
    }
    
    // ターン数分だけ表示（単発の場合は1ターンのみ）
    const displayTurns = isMultiTurn ? actualTurns : 1;
    
    for (let turn = 0; turn < displayTurns; turn++) {
        const turnNumber = turn + 1;
        
        // ★修正: 1ターン目は「常に」基本瀕死率を使用
        let displayRate;
        if (turnNumber === 1) {
            // 1ターン目：オボンのみ等は瀕死を回避できないため、必ず基本瀕死率
            displayRate = koRates.basic[turn];
        } else {
            // 2ターン目以降：アイテム効果を考慮した瀕死率
            if (hasItemEffect && koRates.withItems && koRates.withItems[turn] !== undefined) {
                displayRate = koRates.withItems[turn];
            } else {
                displayRate = koRates.basic[turn];
            }
        }
        
        // 計算根拠を生成
        let basis = '';
        if (koRates.basis && koRates.basis[turn]) {
            const b = koRates.basis[turn];
            
            // ★修正: koRates.basisから正しいダメージ範囲を取得
            const correctDamageRange = b.damageRange;
            
            let moveName;
            if (isMultiTurn && moveInfo && moveInfo[turn]) {
                // 複数ターンの場合：定数ダメージ名も追加
                const constantDamageNames = getConstantDamageNamesForTurn(turnNumber);
                moveName = moveInfo[turn].name;
                if (constantDamageNames.length > 0) {
                    moveName += '+' + constantDamageNames.join('+');
                }
            } else {
                // 単発の場合：技名のみ
                moveName = currentMove.name;
            }
            
            // ★修正: 正しいダメージ範囲を使用
            basis = `[${moveName} (ダメージ:${correctDamageRange})]<br>`;
            
            // 説明文
            if (turnNumber === 1) {
                if (b.isMultiHit) {
                    basis += `連続技各回数の発生確率と外れ時の両方を考慮<br>`;
                } else {
                    basis += `命中時と外れ時の両方を考慮<br>`;
                }
            } else {
                basis += `前ターンの結果を考慮した累積計算<br>`;
            }
            
            // 命中率情報
            const weather = document.getElementById('weatherSelect').value;
            const hasHarikiri = document.getElementById('harikiriCheck')?.checked;
            
            let accText = `命中${b.accuracy}%`;
            if (weather === 'rain' && (isMultiTurn ? moveInfo[turn].name : currentMove.name) === 'かみなり') {
                accText = '必中（雨天）';
            } else if (b.accuracy === 0) {
                accText = '必中';
            } else if (hasHarikiri && (isMultiTurn ? moveInfo[turn].category : currentMove.category) === '物理') {
                accText += '（はりきり補正済）';
            }
            
            // 状態異常効果
            if (b.statusEffects && b.statusEffects.length > 0) {
                const statusModifiers = [];
                b.statusEffects.forEach(effect => {
                    if (effect.includes('ひかりのこな')) {
                        statusModifiers.push('ひかりのこな');
                    } else if (effect.includes('まひ')) {
                        statusModifiers.push('まひ');
                    } else if (effect.includes('こんらん')) {
                        statusModifiers.push('こんらん');
                    }
                });
                if (statusModifiers.length > 0) {
                    accText += `×${statusModifiers.join('×')}`;
                }
            }
            
            basis += `×${accText}`;
        }

        html += `<div class="ko-rate-row">`;
        
        // ターン番号と瀕死率
        html += `<div class="ko-rate-header">`;
        html += `<span class="ko-turn">${turnNumber}ターン:</span>`;
        const percent = displayRate * 100;
        const decimals = percent < 1 ? 3 : 1;
        html += `<span class="ko-basic">${percent.toFixed(decimals)}%</span>`;
        html += `</div>`;
        
        // 計算根拠
        html += `<div class="ko-basis">${basis}</div>`;
        
        html += `</div>`;
    }
    
    // 単発かつアイテム効果がある場合の注釈
    if (!isMultiTurn && hasItemEffect) {
        html += `<div class="item-effect-note" style="font-size: 11px; color: #666; margin-top: 10px; text-align: center;">`;
        if (defenderItem.name === 'オボンのみ' || isFigyBerry(defenderItem.name)) {
            html += `※ ${defenderItem.name}は瀕死を回避できないため、1ターン瀕死率には影響しません`;
        } else if (defenderItem.name === 'たべのこし') {
            html += `※ ${defenderItem.name}は瀕死を回避できないため、1ターン瀕死率には影響しません`;
        } else {
            html += `※ ${defenderItem.name}の効果は1ターン瀕死率に影響しません`;
        }
        html += `</div>`;
    }
    
    html += '</div>';
    return html;
}

// 特定ターンの定数ダメージ名を取得
function getConstantDamageNames() {
    const names = [];
    
    // 状態異常ダメージ
    const statusType = document.getElementById('statusDamageSelect').value;
    if (statusType !== 'none') {
        const statusNames = {
            'burn': 'やけど',
            'poison': 'どく', 
            'badlypoison': 'もうどく'
        };
        if (statusNames[statusType]) {
            names.push(statusNames[statusType]);
        }
    }
    
    // まきびしダメージ
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    if (spikesLevel > 0) {
        names.push('まきびし');
    }
    
    // のろいダメージ
    const curseSelect = document.getElementById('curseSelect');
    if (curseSelect && curseSelect.value !== 'none') {
        names.push('のろい');
    }
    
    // あくむダメージ
    const nightmareSelect = document.getElementById('nightmareSelect');
    if (nightmareSelect && nightmareSelect.value !== 'none') {
        names.push('あくむ');
    }
    
    // やどりぎダメージ
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    if (leechSeedSelect && leechSeedSelect.value !== 'none') {
        names.push('やどりぎ');
    }

    // やどりぎ回復
    const leechSeed2Select = document.getElementById('leechSeed2Select');
    if (leechSeed2Select && leechSeed2Select.value !== 'none') {
        const leechSeed2HealAmount = calculateLeechSeed2HealAmount();
        damageDetails.push(`やどりぎ回復 +${leechSeed2HealAmount}`);
    }

    // 天候ダメージ
    const weather = document.getElementById('weatherSelect').value;
    if (weather === 'sandstorm' || weather === 'hail') {
        const weatherNames = {
            'sandstorm': 'すなあらし',
            'hail': 'あられ'
        };
        if (weatherNames[weather]) {
            names.push(weatherNames[weather]);
        }
    }
    
    return names;
}

// 特定ターンのダメージ範囲を定数ダメージ込みで計算
function calculateDamageWithConstantForTurn(turnIndex, moveInfo) {
    if (!moveInfo) {
        return { min: 0, max: 0 };
    }
    
    // 元のダメージを計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    
    const isPhysical = moveInfo.category === '物理';
    const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
    const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
    
    const atkRankElement = document.getElementById('attackerAtkRank');
    const defRankElement = document.getElementById('defenderDefRank');
    const atkRank = atkRankElement ? atkRankElement.value : '±0';
    const defRank = defRankElement ? defRankElement.value : '±0';
    
    // 技のパワーを計算（特殊技の場合も考慮）
    const move = multiTurnMoves[turnIndex] || currentMove;
    const movePower = calculatePower(move);
    
    const [baseDamageMin, baseDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        movePower,
        move.category,
        move.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank,
        move
    );
    
    // 定数ダメージを計算
    const constantDamage = calculateTotalConstantDamage(defenderStats.hp, defenderPokemon.types, turnIndex + 1);
    
    return {
        min: baseDamageMin + constantDamage,
        max: baseDamageMax + constantDamage
    };
}

function getConstantDamageNamesForTurn(turnNumber) {
    const names = [];
    
    // 状態異常ダメージ（起点ターン対応）
    const statusType = document.getElementById('statusDamageSelect').value;
    const statusStartTurn = parseInt(document.getElementById('statusDamageStartTurn')?.value) || 1;
    if (statusType !== 'none' && turnNumber >= statusStartTurn) {
        const statusNames = {
            'burn': 'やけど',
            'poison': 'どく', 
            'badlypoison': 'もうどく'
        };
        if (statusNames[statusType]) {
            names.push(statusNames[statusType]);
        }
    }
    
    // まきびしダメージ（1ターン目のみ）
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    if (spikesLevel > 0 && turnNumber === 1) {
        names.push('まきびし');
    }
    
    // のろいダメージ（指定ターン以降）
    const curseSelect = document.getElementById('curseSelect');
    if (curseSelect) {
        const curseStartTurn = parseInt(curseSelect.value);
        if (!isNaN(curseStartTurn) && turnNumber >= curseStartTurn) {
            names.push('のろい');
        }
    }
    
    // あくむダメージ（指定ターン以降）
    const nightmareSelect = document.getElementById('nightmareSelect');
    if (nightmareSelect) {
        const nightmareStartTurn = parseInt(nightmareSelect.value);
        if (!isNaN(nightmareStartTurn) && turnNumber >= nightmareStartTurn) {
            names.push('あくむ');
        }
    }
    
    // やどりぎダメージ（指定ターン以降）
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    if (leechSeedSelect) {
        const leechSeedStartTurn = parseInt(leechSeedSelect.value);
        if (!isNaN(leechSeedStartTurn) && turnNumber >= leechSeedStartTurn) {
            names.push('やどりぎ');
        }
    }
    
    // やどりぎ回復（指定ターン以降）
    const leechSeed2Select = document.getElementById('leechSeed2Select');
    if (leechSeed2Select) {
        const leechSeed2StartTurn = parseInt(leechSeed2Select.value);
        if (!isNaN(leechSeed2StartTurn) && turnNumber >= leechSeed2StartTurn) {
            names.push('やどりぎ回復');
        }
    }
    
    // 天候ダメージ（全ターン）
    const weather = document.getElementById('weatherSelect').value;
    if (weather === 'sandstorm' || weather === 'hail') {
        const weatherNames = {
            'sandstorm': 'すなあらし',
            'hail': 'あられ'
        };
        if (weatherNames[weather]) {
            names.push(weatherNames[weather]);
        }
    }
    
    return names;
}

// 定数ダメージ名を取得するヘルパー関数
function getConstantDamageNames() {
    const names = [];
    
    // 状態異常ダメージ
    const statusType = document.getElementById('statusDamageSelect').value;
    if (statusType !== 'none') {
        const statusNames = {
            'burn': 'やけど',
            'poison': 'どく', 
            'badlypoison': 'もうどく'
        };
        if (statusNames[statusType]) {
            names.push(statusNames[statusType]);
        }
    }
    
    // まきびしダメージ
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    if (spikesLevel > 0) {
        names.push('まきびし');
    }
    
    // のろいダメージ
    const curseSelect = document.getElementById('curseSelect');
    if (curseSelect && curseSelect.value !== 'none') {
        names.push('のろい');
    }
    
    // あくむダメージ
    const nightmareSelect = document.getElementById('nightmareSelect');
    if (nightmareSelect && nightmareSelect.value !== 'none') {
        names.push('あくむ');
    }
    
    // やどりぎダメージ
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    if (leechSeedSelect && leechSeedSelect.value !== 'none') {
        names.push('やどりぎ');
    }
    
    // 天候ダメージ
    const weather = document.getElementById('weatherSelect').value;
    if (weather === 'sandstorm' || weather === 'hail') {
        const weatherNames = {
            'sandstorm': 'すなあらし',
            'hail': 'あられ'
        };
        if (weatherNames[weather]) {
            names.push(weatherNames[weather]);
        }
    }
    
    return names;
}

// ========================
// 11. performDamageCalculation関数
// ========================

function performDamageCalculationEnhancedUnified() {
    // ツール情報非表示
    document.querySelector('.tool-info').style.display = 'none';
    // ポワルンのタイプを最新の天候に更新
    updateCastformTypeIfNeeded();

    // 入力チェック
    if (!attackerPokemon.name || !defenderPokemon.name) {
        console.log('ポケモンが選択されていません');
        alert('攻撃側と防御側のポケモンを選択してください');
        return;
    }

    if (!currentMove) {
        console.log('技が選択されていません');
        alert('技を選択してください');
        return;
    }
    
    handleAutoSettingChange();
    
    // 行動制限チェック（まひ・こんらん）
    const paralysisSelect = document.getElementById('paralysisSelect');
    const confusionSelect = document.getElementById('confusionSelect');
    const hasParalysis = paralysisSelect && paralysisSelect.value !== 'none';
    const hasConfusion = confusionSelect && confusionSelect.value !== 'none';
    const hasActionRestriction = hasParalysis || hasConfusion;

    // 複数ターン技が実際に設定されているかチェック
    const hasMultiTurn = hasMultiTurnMoves();
    
    // 定数ダメージの設定があるかチェック
    const statusType = document.getElementById('statusDamageSelect').value;
    const spikesLevel = parseInt(document.getElementById('spikesLevel').value) || 0;
    const weather = document.getElementById('weatherSelect').value;
    const curseSelect = document.getElementById('curseSelect');
    const nightmareSelect = document.getElementById('nightmareSelect');
    const leechSeedSelect = document.getElementById('leechSeedSelect');
    
    const curseValue = curseSelect ? curseSelect.value : 'none';
    const nightmareValue = nightmareSelect ? nightmareSelect.value : 'none';
    const leechSeedValue = leechSeedSelect ? leechSeedSelect.value : 'none';
    
    const hasConstantDamage = statusType !== 'none' || spikesLevel > 0 || 
                            (weather === 'sandstorm' || weather === 'hail') ||
                            (curseValue !== 'none' && curseValue !== '') ||
                            (nightmareValue !== 'none' && nightmareValue !== '') ||
                            (leechSeedValue !== 'none' && leechSeedValue !== '');
    
    // 複数ターン表示が必要な条件
    const needsMultiTurnDisplay = hasMultiTurn || hasActionRestriction;
    
    if (needsMultiTurnDisplay) {
        
        // 行動制限がある場合は、multiTurnMovesに技を事前設定
        if (hasActionRestriction) {
            const paralysisValue = hasParalysis ? parseInt(paralysisSelect.value) : 0;
            const confusionValue = hasConfusion ? parseInt(confusionSelect.value) : 0;
            const maxRestrictionTurn = Math.max(paralysisValue || 0, confusionValue || 0);
            const neededTurns = Math.max(maxRestrictionTurn, 2); // 最低2ターン
            
            // multiTurnMoves配列に技を設定
            multiTurnMoves[0] = currentMove; // 1ターン目
            for (let i = 1; i < neededTurns; i++) {
                if (!multiTurnMoves[i]) {
                    multiTurnMoves[i] = currentMove;
                    console.log(`${i + 1}ターン目に${currentMove.name}を設定（行動制限対応）`);
                }
            }
        }
        
        const defenderStats = calculateStats(defenderPokemon);
        displayMultiTurnResults(defenderStats.hp, false);
        return;
    }
    
    // 通常の単発技計算
    for (let i = 1; i < 5; i++) {
        multiTurnMoves[i] = null;
    }
    multiTurnMoves[0] = currentMove;
    
    // ステータス計算とダメージ計算
    const attackerStats = calculateStats(attackerPokemon);
    const defenderStats = calculateStats(defenderPokemon);
    
    const isPhysical = currentMove.category === "Physical";
    const attackValue = isPhysical ? attackerStats.a : attackerStats.c;
    const defenseValue = isPhysical ? defenderStats.b : defenderStats.d;
    
    const atkRankElement = document.getElementById('attackerAtkRank');
    const defRankElement = document.getElementById('defenderDefRank');
    
    const atkRank = atkRankElement ? atkRankElement.value : '±0';
    const defRank = defRankElement ? defRankElement.value : '±0';
    
    // ★重要: 常に1発分のダメージを計算
    const [baseDamageMin, baseDamageMax] = calculateDamage(
        attackValue,
        defenseValue,
        attackerPokemon.level,
        calculatePower(currentMove),
        currentMove.category,
        currentMove.type,
        attackerPokemon.types,
        defenderPokemon.types,
        atkRank,
        defRank
    );
    
    const minDamage = baseDamageMin;
    const maxDamage = baseDamageMax;
    
    // 統合版結果表示を呼び出し
    displayUnifiedResults(minDamage, maxDamage, defenderStats.hp, false, atkRank, defRank);
}


// 複数ターン技のドロップダウン設定
function setupMultiTurnMoveDropdown(inputId, turn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'pokemon-dropdown';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);
    
    input.addEventListener('click', function(e) {
        e.stopPropagation();
        this.value = '';
        // クリック時にもクリア
        multiTurnMoves[turn] = null;
        showMoveListForTurn(dropdown, input, turn);
    });
    
    input.addEventListener('input', function() {
        filterMoveListForTurn(this.value, dropdown, input, turn);
    });
    
    // ★修正：完全一致チェックを追加（HP入力欄表示のため）
    input.addEventListener('blur', function() {
        checkExactMoveMatchForTurn(this.value, turn, inputId);
    });
    
    // グローバルクリックで閉じる
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && e.target !== input) {
            dropdown.style.display = 'none';
        }
    });
}

function showMoveListForTurn(dropdown, input, turn) {
    dropdown.innerHTML = '';
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    const displayItems = moveData;
    
    displayItems.forEach(move => {
        const item = createDropdownItem(move.name, () => {
            //console.log(`ドロップダウンから${turn + 1}ターン目技選択: ${move.name}`);
            input.value = move.name;
            dropdown.style.display = 'none';
            
            // ★修正：即座にHP入力欄を表示
            multiTurnMoves[turn] = move;
            selectMoveForTurn(move.name, turn);
            
            // ★重要：blur イベントを防ぐためにフラグを設定
            input._preventBlur = true;
            setTimeout(() => { input._preventBlur = false; }, 300);
        });
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
}

// 複数ターン技用の技フィルタリング
function filterMoveListForTurn(searchText, dropdown, input, turn) {
    if (!searchText) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = '';
    
    const search = searchText.toLowerCase();
    
    // カタカナ・ひらがな変換
    const toHiragana = (text) => {
        return text.replace(/[\u30A1-\u30F6]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    };
    
    const toKatakana = (text) => {
        return text.replace(/[\u3041-\u3096]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        });
    };
    
    const hiraganaSearch = toHiragana(search);
    const katakanaSearch = toKatakana(search);
    
    const filtered = moveData.filter(move => {
        const name = move.name ? move.name.toLowerCase() : '';
        const hiragana = move.hiragana ? move.hiragana.toLowerCase() : '';
        const romaji = move.romaji ? move.romaji.toLowerCase() : '';
        
        // 前方一致検索
        return name.includes(search) || 
               name.includes(hiraganaSearch) ||
               name.includes(katakanaSearch) ||
               hiragana.includes(search) ||
               hiragana.includes(hiraganaSearch) ||
               romaji.includes(search);
    });
    
    const displayItems = filtered;
    
    displayItems.forEach(move => {
        const item = createDropdownItem(move.name, () => {
            input.value = move.name;
            dropdown.style.display = 'none';
            
            // ★修正：即座にHP入力欄を表示
            multiTurnMoves[turn] = move;
            selectMoveForTurn(move.name, turn);
            
            // ★重要：blur イベントを防ぐためにフラグを設定
            input._preventBlur = true;
            setTimeout(() => { input._preventBlur = false; }, 300);
        });
        dropdown.appendChild(item);
    });
    
    const rect = input.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
    
    dropdown.style.display = displayItems.length > 0 ? 'block' : 'none';
}

function checkExactMatch(inputText, side) {
    if (!inputText) {
        selectPokemon(side, "");  // 空欄の場合はリセット
        return;
    }
    
    // カタカナ、ひらがな、ローマ字での完全一致を検索
    const exactMatch = allPokemonData.find(pokemon => {
        return pokemon.name === inputText ||
               pokemon.hiragana === inputText ||
               (pokemon.romaji && pokemon.romaji.toLowerCase() === inputText.toLowerCase());
    });
    
    if (exactMatch) {
        selectPokemon(side, exactMatch.name);
    } else {
        // 一致しない場合もリセット
        selectPokemon(side, "");
    }
}

// HTMLのボタンのonclick属性を更新するための関数
function updateDamageCalculationButton() {
   const button = document.querySelector('.damage-calc-button');
   if (button) {
       button.setAttribute('onclick', 'performDamageCalculationEnhanced()');
   }
}

// 複数ターン技設定のイベントリスナー設定
function setupMultiTurnMoveListeners() {
   // 2-4ターン目の技設定（インデックスは1-3）
   for (let i = 2; i <= 4; i++) {
       setupMultiTurnMoveDropdown(`multiTurnMove${i}`, i - 1);
   }
}

// ========================
// モバイル数値コントロール機能（新規追加）
// ========================

// モバイルコントロールバーの状態管理
let mobileControlState = {
    activeInput: null,
    fieldInfo: null,
    isActive: false
};

/**
 * モバイルコントロール機能の初期化（DOMContentLoaded内で呼び出し）
 */
function initializeMobileControls() {
    // 数値入力欄にイベントリスナーを設定
    setupMobileInputListeners();
    
    // コントロールバーのイベントリスナーを設定
    setupMobileControlListeners();
}

function isTabletOrMobile() {
    // 768px以下、または1100px-1199pxの場合にタブレット/モバイル機能を有効化
    return window.innerWidth <= 768 || 
           (window.innerWidth >= 1100 && window.innerWidth <= 1199);
}

function isChromeBrowser() {
    const userAgent = navigator.userAgent || '';
    const isChrome = /Chrome\/|CriOS\//.test(userAgent);
    const isOtherChromiumBrowser = /Edg\/|EdgiOS\/|OPR\/|Opera\/|SamsungBrowser\//.test(userAgent);
    return isChrome && !isOtherChromiumBrowser;
}

function shouldUseSliderControls() {
    return isTabletOrMobile() || isChromeBrowser();
}
/**
 * 数値入力欄のイベントリスナーを設定
 */
function setupMobileInputListeners() {
    const targetInputs = [
        // 攻撃側実数値
        'attackerRealA', 'attackerRealC',
        'attackerDetailRealHP', 'attackerDetailRealA', 'attackerDetailRealB', 
        'attackerDetailRealC', 'attackerDetailRealD', 'attackerDetailRealS',
        
        // 防御側実数値
        'defenderRealHP', 'defenderRealB', 'defenderRealD', 'defenderCurrentHP',
        'defenderDetailRealHP', 'defenderDetailRealA', 'defenderDetailRealB',
        'defenderDetailRealC', 'defenderDetailRealD', 'defenderDetailRealS',
        
        // 攻撃側個体値
        'attackerIvA', 'attackerIvC',
        'attackerDetailIvHP', 'attackerDetailIvA', 'attackerDetailIvB',
        'attackerDetailIvC', 'attackerDetailIvD', 'attackerDetailIvS',
        
        // 防御側個体値
        'defenderIvHP', 'defenderIvB', 'defenderIvD',
        'defenderDetailIvHP', 'defenderDetailIvA', 'defenderDetailIvB',
        'defenderDetailIvC', 'defenderDetailIvD', 'defenderDetailIvS',
        
        // 攻撃側努力値
        'attackerEvA', 'attackerEvC',
        'attackerDetailEvHP', 'attackerDetailEvA', 'attackerDetailEvB',
        'attackerDetailEvC', 'attackerDetailEvD', 'attackerDetailEvS',
        
        // 防御側努力値
        'defenderEvHP', 'defenderEvB', 'defenderEvD',
        'defenderDetailEvHP', 'defenderDetailEvA', 'defenderDetailEvB',
        'defenderDetailEvC', 'defenderDetailEvD', 'defenderDetailEvS',
        
        // レベル
        'attackerLevel', 'defenderLevel'
    ];
    
    targetInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // ★修正：判定関数を使用
            // モバイル専用のタッチイベント
            input.addEventListener('touchstart', function(e) {
                if (shouldUseSliderControls()) {
                    // タッチデバイスでは既存機能を無効化してモバイルコントロールを使用
                    e.preventDefault();
                    activateMobileControl(this);
                }
            }, { passive: false });
            
            input.addEventListener('touchend', function(e) {
                if (shouldUseSliderControls()) {
                    e.preventDefault();
                    if (mobileControlState.activeInput !== this) {
                        activateMobileControl(this);
                    }
                }
            }, { passive: false });
            
            // ★修正：フォーカスイベントも判定関数を使用
            const originalFocusHandler = function(e) {
                if (shouldUseSliderControls()) {
                    setTimeout(() => {
                        if (mobileControlState.activeInput !== this) {
                            activateMobileControl(this);
                        }
                    }, 50);
                }
            };
            input.addEventListener('focus', originalFocusHandler);
            
            // ★修正：クリック時も判定関数を使用
            input.addEventListener('click', function(e) {
                if (shouldUseSliderControls()) {
                    e.preventDefault();
                    if (mobileControlState.activeInput !== this) {
                        activateMobileControl(this);
                    }
                }
                // デスクトップでは通常のクリック処理を継続
            });
        }
    });
    
    // ★修正：画面外タップ検知も判定関数を使用
    document.addEventListener('touchstart', function(e) {
        if (shouldUseSliderControls() &&
            mobileControlState.isActive &&
            !e.target.closest('.mobile-control-bar') && 
            !e.target.closest('.mobile-control-content') &&
            !e.target.matches('input[type="number"]') &&
            !e.target.closest('.section')) {
            deactivateMobileControl();
        }
    }, { passive: false });
}

/**
 * 実数値入力管理クラスの初期化関数を修正
 */
function initializeRealStatInputsFixed() {
    const config = [
        // メイン画面の実数値入力
        { id: 'attackerRealA', side: 'attacker', stat: 'a', type: 'main' },
        { id: 'attackerRealC', side: 'attacker', stat: 'c', type: 'main' },
        { id: 'defenderRealHP', side: 'defender', stat: 'hp', type: 'main' },
        { id: 'defenderRealB', side: 'defender', stat: 'b', type: 'main' },
        { id: 'defenderRealD', side: 'defender', stat: 'd', type: 'main' },
        
        // 詳細設定の実数値入力
        ...['hp', 'a', 'b', 'c', 'd', 's'].flatMap(stat => [
            { id: `attackerDetailReal${stat.toUpperCase()}`, side: 'attacker', stat, type: 'detail' },
            { id: `defenderDetailReal${stat.toUpperCase()}`, side: 'defender', stat, type: 'detail' }
        ])
    ];

    config.forEach(item => setupRealStatInputFixed(item));
}

/**
 * コントロールバーのイベントリスナーを設定
 */
function setupMobileControlListeners() {
    const minusBtn = document.getElementById('mobileMinus');
    const plusBtn = document.getElementById('mobilePlus');
    const slider = document.getElementById('mobileSlider');
    
    if (!minusBtn || !plusBtn || !slider) return;
    
    // マイナスボタン - イベント伝播を停止
    minusBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        adjustMobileValue(-1);
    });
    
    // プラスボタン - イベント伝播を停止
    plusBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        adjustMobileValue(1);
    });
    
    // スライダー - イベント伝播を停止
    slider.addEventListener('input', function(e) {
        e.stopPropagation();
        updateValueFromSlider();
    });
    
    // 長押し対応
    setupLongPressListeners(minusBtn, -1);
    setupLongPressListeners(plusBtn, 1);
}


/**
 * 長押し機能の設定
 */
function setupLongPressListeners(button, direction) {
    let longPressTimer;
    let longPressInterval;
    
    const startLongPress = () => {
        longPressTimer = setTimeout(() => {
            longPressInterval = setInterval(() => {
                adjustMobileValue(direction);
            }, 100);
        }, 500);
    };
    
    const stopLongPress = () => {
        clearTimeout(longPressTimer);
        clearInterval(longPressInterval);
    };
    
    button.addEventListener('mousedown', startLongPress);
    button.addEventListener('mouseup', stopLongPress);
    button.addEventListener('mouseleave', stopLongPress);
    button.addEventListener('touchstart', startLongPress);
    button.addEventListener('touchend', stopLongPress);
}

/**
 * モバイルコントロールをアクティブ化
 */
function activateMobileControl(input) {
    
    // 既にアクティブな場合はスキップ
    if (mobileControlState.isActive && mobileControlState.activeInput === input) {
        return;
    }
    
    // 前のアクティブ入力のハイライトを削除
    if (mobileControlState.activeInput) {
        mobileControlState.activeInput.classList.remove('mobile-active-input');
    }
    
    // フィールド情報を取得
    const fieldInfo = getFieldInfo(input);

    // 状態を更新
    mobileControlState.activeInput = input;
    mobileControlState.fieldInfo = fieldInfo;
    mobileControlState.isActive = true;
    
    // ハイライトを追加
    input.classList.add('mobile-active-input');
    
    // フォーカスをぼかして仮想キーボードを隠す
    input.blur();
    
    // コントロールバーを更新
    updateMobileControlBar();
    
    // ★重要: スクロール位置を保存
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    
    // UI要素を取得
    const controlBar = document.getElementById('mobileControlBar');
    let overlay = document.querySelector('.mobile-control-overlay');

    
    // オーバーレイが存在しない場合は作成
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-control-overlay';
        document.body.appendChild(overlay);
        
        // ★修正: オーバーレイのタッチイベント（コントロールバー以外のタップで終了）
        overlay.addEventListener('touchstart', function(e) {
            // コントロールバーやその中身に触れた場合は終了しない
            if (!e.target.closest('.mobile-control-bar') && 
                !e.target.closest('.mobile-control-content')) {
                e.preventDefault();
                deactivateMobileControl();
            }
        }, { passive: false });
        
        overlay.addEventListener('click', function(e) {
            // コントロールバーやその中身をクリックした場合は終了しない
            if (!e.target.closest('.mobile-control-bar') && 
                !e.target.closest('.mobile-control-content')) {
                e.preventDefault();
                deactivateMobileControl();
            }
        });
    }
    
    // 表示処理
    if (controlBar) {
        
        // ★重要: body に固定スタイルを適用（レイアウトに影響なし）
        document.body.classList.add('mobile-control-active');
        
        // ★重要: スクロール位置を維持
        document.body.style.top = `-${currentScrollY}px`;
        document.body.style.left = `-${currentScrollX}px`;
        
        // オーバーレイとコントロールバーを表示
        overlay.style.display = 'block';
        controlBar.style.display = 'flex';
        
        // アニメーション用の短い遅延
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            controlBar.classList.add('show');
        });     
    }

}

/**
 * モバイルコントロールを非アクティブ化
 */
function deactivateMobileControl() {
    
    // ★重要: スクロール位置を復元
    const scrollY = parseInt(document.body.style.top || '0') * -1;
    const scrollX = parseInt(document.body.style.left || '0') * -1;
    
    if (mobileControlState.activeInput) {
        mobileControlState.activeInput.classList.remove('mobile-active-input');
    }
    
    mobileControlState.activeInput = null;
    mobileControlState.fieldInfo = null;
    mobileControlState.isActive = false;
    
    // オーバーレイとコントロールバーを非表示
    const controlBar = document.getElementById('mobileControlBar');
    const overlay = document.querySelector('.mobile-control-overlay');
    
    if (controlBar && overlay) {
        // アニメーション付きで非表示
        overlay.classList.remove('show');
        controlBar.classList.remove('show');
        
        // アニメーション完了後にDOM操作
        setTimeout(() => {
            overlay.style.display = 'none';
            controlBar.style.display = 'none';
            
            // ★重要: body スタイルをリセット
            document.body.classList.remove('mobile-control-active');
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.width = '';
            
            // ★重要: スクロール位置を復元
            window.scrollTo(scrollX, scrollY);
            
        }, 400); // アニメーション時間と合わせる
        
    }
}
/**
 * 入力欄の情報を取得
 */
function getFieldInfo(input) {
    const id = input.id;
    let type, stat, side, displayName, min, max, step;
    
    // サイドとステータスを判定（先に実行）
    if (id.includes('attacker')) {
        side = '攻撃側';
    } else if (id.includes('defender')) {
        side = '防御側';
    }
    
    // ステータス判定を詳細に
    if (id.includes('HP') || id.includes('Hp')) {
        stat = 'H';
    } else if (id.endsWith('A') || id.includes('RealA')) {
        stat = 'A';
    } else if (id.endsWith('B') || id.includes('RealB')) {
        stat = 'B';
    } else if (id.endsWith('C') || id.includes('RealC')) {
        stat = 'C';
    } else if (id.endsWith('D') || id.includes('RealD')) {
        stat = 'D';
    } else if (id.endsWith('S') || id.includes('RealS')) {
        stat = 'S';
    } else {
        // フォールバック：末尾の1文字
        const lastChar = id.slice(-1);
        if (['A', 'B', 'C', 'D', 'S'].includes(lastChar)) {
            stat = lastChar;
        }
    }
    
    // 入力欄のタイプを判定
    if (id.includes('Level') || id === 'attackerLevel' || id === 'defenderLevel') {
        // レベル
        type = 'level';
        min = 1;
        max = 100;
        step = 1;
        displayName = `${side}レベル`;
    } else if (id.includes('CurrentHP') || id === 'defenderCurrentHP') {
        // 現在HP
        type = 'currentHP';
        min = parseInt(input.getAttribute('min')) || 1;
        max = parseInt(input.getAttribute('max')) || 999;
        step = 1;
        displayName = '現在HP';
    } else if (id.includes('Real')) {
        type = 'real';
        // 実数値の場合は、ポケモンデータから制限を取得
        min = parseInt(input.getAttribute('min')) || 1;
        max = parseInt(input.getAttribute('max')) || 999;

        // min/maxが設定されていない場合、ポケモンデータから計算（性格補正を考慮）
        if ((min === 1 && max === 999) || !min || !max) {
            const pokemon = side === '攻撃側' ? attackerPokemon : defenderPokemon;
            const statKey = stat.toLowerCase();

            if (pokemon && pokemon.baseStats && pokemon.baseStats[statKey]) {
                const isHP = statKey === 'h' || statKey === 'hp';
                const natureMod = isHP ? 1.0 : (pokemon.natureModifiers[statKey] || 1.0);
                const limits = calculateStatLimitsWithNature(pokemon.baseStats[statKey], pokemon.level || 50, natureMod, isHP);
                min = limits.min;
                max = limits.max;
            }
        }
        step = 1;
        displayName = `${side}${stat}実数値`;
    } else if (id.includes('Iv')) {
        type = 'iv';
        min = 0;
        max = 31;
        step = 1;
        displayName = `${side}${stat}個体値`;
    } else if (id.includes('Ev')) {
        type = 'ev';
        min = 0;
        max = 252;
        step = 4;
        displayName = `${side}${stat}努力値`;
    }
    
    return { type, stat, side, displayName, min, max, step };
}

/**
 * コントロールバーの表示を更新
 */
function updateMobileControlBar() {
    if (!mobileControlState.isActive || !mobileControlState.activeInput) {
        return;
    }
    
    const input = mobileControlState.activeInput;
    const fieldInfo = mobileControlState.fieldInfo;
    const currentValue = parseInt(input.value) || fieldInfo.min;
    
    // フィールド名と現在値を更新
    const fieldNameEl = document.getElementById('mobileFieldName');
    const currentValueEl = document.getElementById('mobileCurrentValue');
    
    if (fieldNameEl) {
        fieldNameEl.textContent = fieldInfo.displayName;
    }
    if (currentValueEl) {
        currentValueEl.textContent = currentValue;
    }
    
    // スライダーの設定を更新
    const slider = document.getElementById('mobileSlider');

    if (slider) {
        const sliderValue = Math.max(fieldInfo.min, Math.min(fieldInfo.max, currentValue));
        
        slider.min = fieldInfo.min;
        slider.max = fieldInfo.max;
        slider.step = fieldInfo.step;
        slider.value = sliderValue;
    }
    
    // ラベルを更新
    const minLabel = document.getElementById('mobileMinLabel');
    const maxLabel = document.getElementById('mobileMaxLabel');
    
    if (minLabel) {
        minLabel.textContent = fieldInfo.min;
    }
    if (maxLabel) {
        maxLabel.textContent = fieldInfo.max;
    }
    

}

/**
 * 値を調整
 */
function adjustMobileValue(direction) {
    
    const input = mobileControlState.activeInput;
    const fieldInfo = mobileControlState.fieldInfo;
    const currentValue = parseInt(input.value) || 0;
    
    // 努力値の場合は4刻みで調整
    let step = fieldInfo.step || 1;
    if (fieldInfo.type === 'ev') {
        step = 4;
    }
    
    const newValue = Math.max(fieldInfo.min, Math.min(fieldInfo.max, currentValue + (direction * step)));

    if (newValue !== currentValue) {
        // 値を更新
        if (input.updateValueSilently) {
            input.updateValueSilently(newValue);
        } else {
            input.value = newValue;
        }
        
        // ★重要：正しいパラメータでhandleRealStatChangeを呼び出す
        if (fieldInfo.type === 'real') {
            const config = {
                id: input.id,
                side: fieldInfo.side === '攻撃側' ? 'attacker' : 'defender',
                stat: fieldInfo.stat.toLowerCase(),
                type: 'detail' // 詳細設定として扱う
            };
            
            console.log(`[DEBUG] Calling handleRealStatChange with config:`, config);
            handleRealStatChange(config, newValue, direction);
        } else if (fieldInfo.type === 'iv') {
            // 個体値の処理
            const side = fieldInfo.side === '攻撃側' ? 'attacker' : 'defender';
            const stat = fieldInfo.stat.toLowerCase();
            updateIVValue(side, stat, newValue);
        } else if (fieldInfo.type === 'ev') {
            // 努力値の処理（方向を考慮）
            const side = fieldInfo.side === '攻撃側' ? 'attacker' : 'defender';
            const stat = fieldInfo.stat.toLowerCase();
            updateEVValueWithDirection(side, stat, currentValue, newValue, direction);
        } else if (fieldInfo.type === 'level') {
            // レベルの処理
            const side = fieldInfo.side === '攻撃側' ? 'attacker' : 'defender';
            const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
            pokemon.level = newValue;
            updateStats(side);
        } else if (fieldInfo.type === 'currentHP') {
            // 現在HPの処理（特に追加処理は不要）
        }

        // 表示を更新
        updateMobileControlBar();
        
        // change イベントを発火
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// 個体値の更新関数
function updateIVValue(side, stat, value) {
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    pokemon.ivValues[stat] = value;
    
    // 対応するメイン画面の個体値も更新
    const mainIvInput = document.getElementById(`${side}Iv${stat.toUpperCase()}`);
    if (mainIvInput) {
        mainIvInput.value = value;
    }
    
    updateStats(side);
}

// 努力値の更新関数
function updateEVValue(side, stat, value) {
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    pokemon.evValues[stat] = value;
    
    // 対応するメイン画面の努力値も更新
    const mainEvInput = document.getElementById(`${side}Ev${stat.toUpperCase()}`);
    if (mainEvInput) {
        mainEvInput.value = value;
    }
    
    updateStats(side);
}

// 方向を考慮した努力値の更新関数
function updateEVValueWithDirection(side, stat, currentValue, targetValue, direction) {
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const currentIV = pokemon.ivValues[stat];
    
    
    let adjustedValue = targetValue;
    
    if (currentIV === 31) {
        // 個体値31：8n-4パターンに調整
        if (targetValue === 0) {
            adjustedValue = 0;
        } else if (targetValue <= 4) {
            adjustedValue = direction > 0 ? 4 : 0;
        } else {
            // 方向に応じて調整
            if (direction > 0) {
                // プラスボタン：上の8n-4値に調整
                const base = Math.ceil((targetValue + 4) / 8);
                adjustedValue = Math.max(4, Math.min(252, base * 8 - 4));
            } else {
                // マイナスボタン：下の8n-4値に調整
                const base = Math.floor((targetValue + 4) / 8);
                let candidate = base * 8 - 4;
                if (candidate >= targetValue) {
                    // 同じかそれより大きい場合は一つ下の8n-4値に
                    candidate = Math.max(0, (base - 1) * 8 - 4);
                }
                adjustedValue = candidate === -4 ? 0 : Math.max(0, Math.min(252, candidate));
            }
        }
    } else if (currentIV === 30) {
        // 個体値30：8nパターンに調整
        if (targetValue === 0) {
            adjustedValue = 0;
        } else if (targetValue <= 8) {
            adjustedValue = direction > 0 ? 8 : 0;
        } else {
            // 方向に応じて調整
            if (direction > 0) {
                // プラスボタン：上の8n値に調整
                const base = Math.ceil(targetValue / 8);
                adjustedValue = Math.max(8, Math.min(248, base * 8));
            } else {
                // マイナスボタン：下の8n値に調整
                const base = Math.floor(targetValue / 8);
                let candidate = base * 8;
                if (candidate >= targetValue) {
                    // 同じかそれより大きい場合は一つ下の8n値に
                    candidate = Math.max(0, (base - 1) * 8);
                }
                adjustedValue = Math.max(0, Math.min(248, candidate));
            }
        }
    } else {
        // その他：4の倍数に調整（方向を考慮）
        if (direction > 0) {
            adjustedValue = Math.ceil(targetValue / 4) * 4;
        } else {
            adjustedValue = Math.floor(targetValue / 4) * 4;
        }
    }
    
    adjustedValue = Math.max(0, Math.min(252, adjustedValue));
    
    
    pokemon.evValues[stat] = adjustedValue;
    
    // 対応するメイン画面の努力値も更新
    const mainEvInput = document.getElementById(`${side}Ev${stat.toUpperCase()}`);
    if (mainEvInput) {
        mainEvInput.value = adjustedValue;
    }
    
    // モバイルコントロールの入力欄も更新
    const input = mobileControlState.activeInput;
    if (input && input.updateValueSilently) {
        input.updateValueSilently(adjustedValue);
    } else if (input) {
        input.value = adjustedValue;
    }
    
    updateStats(side);
    
    // モバイルコントロールバーの表示を更新
    if (mobileControlState.isActive) {
        updateMobileControlBar();
    }
}
/**
 * スライダーから値を更新
 */
function updateValueFromSlider() {
    if (!mobileControlState.isActive || !mobileControlState.activeInput) return;

    const slider = document.getElementById('mobileSlider');
    const input = mobileControlState.activeInput;
    let newValue = parseInt(slider.value);
    const currentValue = parseInt(input.value) || 0;

    // fieldInfoのmin/maxで値を制限
    const fieldInfo = mobileControlState.fieldInfo;
    if (fieldInfo && fieldInfo.min !== undefined && fieldInfo.max !== undefined) {
        newValue = Math.max(fieldInfo.min, Math.min(fieldInfo.max, newValue));
    }

    // 値が変更された場合のみ処理
    if (newValue === currentValue) return;
    
    // 努力値の場合は特殊な調整（方向を考慮）
    if (mobileControlState.fieldInfo.type === 'ev') {
        const direction = newValue > currentValue ? 1 : -1;
        const side = mobileControlState.fieldInfo.side === '攻撃側' ? 'attacker' : 'defender';
        const stat = mobileControlState.fieldInfo.stat.toLowerCase();
        updateEVValueWithDirection(side, stat, currentValue, newValue, direction);
        return; // 専用処理なので早期リターン
    }

    // 実数値入力欄の場合は既存のスピンボタン機能を再現
    if (mobileControlState.fieldInfo.type === 'real') {
        handleRealStatChangeFromMobile(input, newValue, newValue > currentValue ? 1 : -1);
    } else if (mobileControlState.fieldInfo.type === 'level') {
        // レベルの処理
        const side = mobileControlState.fieldInfo.side === '攻撃側' ? 'attacker' : 'defender';
        const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
        pokemon.level = newValue;
        input.value = newValue;
        updateStats(side);
    } else if (mobileControlState.fieldInfo.type === 'currentHP') {
        // 現在HPの処理
        input.value = newValue;
    } else {
        // 個体値・努力値の場合は直接設定
        setValueAndTriggerEvents(input, newValue);
    }

    // 現在値表示を更新
    document.getElementById('mobileCurrentValue').textContent = newValue;
}

/**
 * 努力値を最も近い有効値に調整
 */
function adjustEVValueToNearest(input, targetValue) {
    const inputId = input.id;
    
    // サイドとステータスを判定
    const side = inputId.includes('attacker') ? 'attacker' : 'defender';
    let stat;
    if (inputId.includes('HP') || inputId.includes('Hp')) stat = 'hp';
    else if (inputId.includes('A')) stat = 'a';
    else if (inputId.includes('B')) stat = 'b';
    else if (inputId.includes('C')) stat = 'c';
    else if (inputId.includes('D')) stat = 'd';
    else if (inputId.includes('S')) stat = 's';
    
    if (!stat || !side) {
        // 判定できない場合は4の倍数に調整
        return Math.floor(targetValue / 4) * 4;
    }
    
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const currentIV = pokemon.ivValues[stat];
    
    if (currentIV === 31) {
        // 個体値31：8n-4パターンの最も近い値（下方向を優先）
        if (targetValue <= 2) return 0;
        if (targetValue <= 6) return 4;
        
        // 8n-4の値を計算（下方向優先）
        const base = Math.floor((targetValue + 4) / 8);
        const candidate = Math.max(0, Math.min(252, base * 8 - 4));
        
        // 0との距離も考慮
        if (Math.abs(targetValue - 0) < Math.abs(targetValue - candidate)) {
            return 0;
        }
        return candidate;
        
    } else if (currentIV === 30) {
        // 個体値30：8nパターンの最も近い値（下方向を優先）
        if (targetValue <= 4) return 0;
        
        const base = Math.floor(targetValue / 8);
        const candidate = Math.max(0, Math.min(248, base * 8));
        
        // 0との距離も考慮
        if (Math.abs(targetValue - 0) < Math.abs(targetValue - candidate)) {
            return 0;
        }
        return candidate;
        
    } else {
        // その他：4の倍数に調整
        return Math.floor(targetValue / 4) * 4;
    }
}

/**
 * 努力値の特殊調整（個体値に応じたステップ）
 */
function adjustEVValue(input, currentValue, direction) {
    const inputId = input.id;
    
    // サイドとステータスを判定
    const side = inputId.includes('attacker') ? 'attacker' : 'defender';
    let stat;
    if (inputId.includes('HP') || inputId.includes('Hp')) stat = 'hp';
    else if (inputId.includes('A')) stat = 'a';
    else if (inputId.includes('B')) stat = 'b';
    else if (inputId.includes('C')) stat = 'c';
    else if (inputId.includes('D')) stat = 'd';
    else if (inputId.includes('S')) stat = 's';
    
    if (!stat || !side) {
        // 判定できない場合は通常の4ずつ
        return Math.max(0, Math.min(252, currentValue + (direction * 4)));
    }
    
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const currentIV = pokemon.ivValues[stat];
    
    let newValue, min, max;
    
    if (currentIV === 31) {
        // 個体値31：8n-4パターン（0, 4, 12, 20, 28, ...）
        min = 0;
        max = 252;
        
        if (direction > 0) {
            // 上げる場合
            if (currentValue === 0) {
                newValue = 4; // 0 → 4
            } else {
                // 現在値から次の8n-4値を計算
                const currentBase = Math.floor((currentValue + 4) / 8);
                const nextBase = currentBase + 1;
                newValue = Math.min(252, nextBase * 8 - 4);
            }
        } else {
            // 下げる場合 - ここが修正点
            if (currentValue === 4) {
                newValue = 0; // 4 → 0
            } else if (currentValue === 0) {
                newValue = 0; // 0のまま（これ以上下げられない）
            } else {
                // 現在値から前の8n-4値を計算
                const currentBase = Math.floor((currentValue + 4) / 8);
                const prevBase = currentBase - 1;
                newValue = Math.max(0, prevBase > 0 ? prevBase * 8 - 4 : 0);
            }
        }
    } else if (currentIV === 30) {
        // 個体値30：8nパターン（0, 8, 16, 24, 32, ...）
        min = 0;
        max = 248;
        
        if (direction > 0) {
            // 上げる場合
            if (currentValue === 0) {
                newValue = 8; // 0 → 8
            } else {
                const currentBase = Math.floor(currentValue / 8);
                const nextBase = currentBase + 1;
                newValue = Math.min(248, nextBase * 8);
            }
        } else {
            // 下げる場合
            if (currentValue === 8) {
                newValue = 0; // 8 → 0
            } else if (currentValue === 0) {
                newValue = 0; // 0のまま
            } else {
                const currentBase = Math.floor(currentValue / 8);
                const prevBase = currentBase - 1;
                newValue = Math.max(0, prevBase * 8);
            }
        }
    } else {
        // その他：通常の4ずつ
        newValue = currentValue + (direction * 4);
        newValue = Math.max(0, Math.min(252, newValue));
    }
    
    return newValue;
}

/**
 * 値を調整（既存関数の置き換え）
 */
function adjustMobileValue(direction) {
    if (!mobileControlState.isActive || !mobileControlState.activeInput) return;
    
    const input = mobileControlState.activeInput;
    const fieldInfo = mobileControlState.fieldInfo;
    const currentValue = parseInt(input.value) || fieldInfo.min;
    const step = fieldInfo.step;
    
    let newValue = currentValue + (direction * step);
    newValue = Math.max(fieldInfo.min, Math.min(fieldInfo.max, newValue));
    
    // 実数値入力欄の場合は既存のスピンボタン機能を再現
    if (fieldInfo.type === 'real') {
        handleRealStatChangeFromMobile(input, newValue, direction);
    } else {
        // 個体値・努力値の場合は直接設定
        setValueAndTriggerEvents(input, newValue);
    }
    
    // コントロールバーを更新
    updateMobileControlValue();
}


/**
 * モバイルコントロールの値表示を更新
 */
function updateMobileControlValue() {
    if (!mobileControlState.isActive || !mobileControlState.activeInput) return;
    
    const input = mobileControlState.activeInput;
    const currentValue = parseInt(input.value) || 0;
    
    const currentValueEl = document.getElementById('mobileCurrentValue');
    const slider = document.getElementById('mobileSlider');
    
    if (currentValueEl) currentValueEl.textContent = currentValue;
    if (slider) slider.value = currentValue;
}

/**
 * 実数値変更時の処理（スピンボタン機能の再現）
 */
function handleRealStatChangeFromMobile(input, targetValue, direction) {
    const inputId = input.id;
    let side, stat;
   
    // サイドとステータスを判定
    if (inputId.includes('attacker')) {
        side = 'attacker';
    } else if (inputId.includes('defender')) {
        side = 'defender';
    }
   
    // ★修正：ステータス判定を末尾文字で行うように変更
    if (inputId.includes('HP') || inputId.includes('Hp')) {
        stat = 'hp';
    } else {
        // 末尾の1文字でステータスを判定（より確実）
        const lastChar = inputId.slice(-1);
        switch (lastChar) {
            case 'A':
                stat = 'a';
                break;
            case 'B':
                stat = 'b';
                break;
            case 'C':
                stat = 'c';
                break;
            case 'D':
                stat = 'd';
                break;
            case 'S':
                stat = 's';
                break;
            default:
                // フォールバック：元の方法だが順序を修正
                if (inputId.includes('RealS') || inputId.endsWith('S')) {
                    stat = 's';
                } else if (inputId.includes('RealD') || inputId.endsWith('D')) {
                    stat = 'd';
                } else if (inputId.includes('RealC') || inputId.endsWith('C')) {
                    stat = 'c';
                } else if (inputId.includes('RealB') || inputId.endsWith('B')) {
                    stat = 'b';
                } else if (inputId.includes('RealA') || inputId.endsWith('A')) {
                    stat = 'a';
                }
                break;
        }
    }
   
    console.log(`[DEBUG] handleRealStatChangeFromMobile: inputId=${inputId}, side=${side}, stat=${stat}`);
   
    if (!side || !stat) {
        // 現在HPなど特殊な場合は直接設定
        setValueAndTriggerEvents(input, targetValue);
        return;
    }
   
    // 既存のスピンボタン処理を利用
    const pokemon = side === 'attacker' ? attackerPokemon : defenderPokemon;
    const currentRealStat = calculateCurrentStat(pokemon, stat);
    const limits = calculateStatLimits(pokemon.baseStats[stat], pokemon.level, stat === 'hp');
   
    // 制限チェック
    if (targetValue < limits.min || targetValue > limits.max) {
        setValueAndTriggerEvents(input, Math.max(limits.min, Math.min(limits.max, targetValue)));
        return;
    }
   
    // 個体値1→0の特殊処理
    if (targetValue < currentRealStat && pokemon.ivValues[stat] === 1 && direction < 0) {
        const statWith0IV = calculateStatWithParams(
            pokemon.baseStats[stat],
            pokemon.level,
            0,
            pokemon.evValues[stat],
            pokemon.natureModifiers[stat],
            stat === 'hp'
        );
       
        if (statWith0IV <= targetValue) {
            pokemon.ivValues[stat] = 0;
            updateIVEVInputs(side, stat, 0, pokemon.evValues[stat]);
            updateStats(side);
            return;
        }
    }
   
    // 個体値優先の最適化処理
    const result = findOptimalStatsIVFirst(pokemon, stat, targetValue, direction);
    if (result && isValidResult(result, targetValue, pokemon.baseStats[stat], pokemon.level, stat === 'hp')) {
        applyOptimizationResult(pokemon, side, stat, result);
    } else {
        // 最適化に失敗した場合は直接設定
        setValueAndTriggerEvents(input, targetValue);
    }
}

/**
 * 個体値優先の最適化処理（モバイル用）
 */
function findOptimalStatsIVFirst(pokemon, stat, targetValue, direction) {
    const baseStat = pokemon.baseStats[stat];
    const level = pokemon.level;
    const currentIV = pokemon.ivValues[stat];
    const currentEV = pokemon.evValues[stat];
    const currentNature = pokemon.natureModifiers[stat] || 1.0;
    const isHP = stat === 'hp';
    
    // 実数値を上げる場合（direction > 0）
    if (direction > 0) {
        return optimizeForIncrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
    }
    // 実数値を下げる場合（direction < 0）
    else if (direction < 0) {
        return optimizeForDecrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
    }
    // 方向が不明な場合は従来の処理
    else {
        return findOptimalStats(pokemon, stat, targetValue, baseStat, level);
    }
}
/**
 * 実数値を上げる場合の最適化（個体値優先）
 */
function optimizeForIncrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat) {
    // 1. 個体値が31未満の場合、まず個体値を上げる
    if (currentIV < 31) {
        // 現在の努力値で個体値を上げて目標に到達できるかチェック
        for (let iv = currentIV + 1; iv <= 31; iv++) {
            const statValue = calculateStatWithParams(baseStat, level, iv, currentEV, currentNature, isHP);
            if (statValue === targetValue) {
                return { iv: iv, ev: currentEV, natureMod: currentNature };
            }
            if (statValue > targetValue) {
                // 前の個体値で努力値調整を試す
                const prevIV = iv - 1;
                return adjustWithEV(baseStat, level, isHP, prevIV, currentEV, currentNature, targetValue, stat);
            }
        }
        // 個体値31でも届かない場合、個体値31で努力値調整
        return adjustWithEV(baseStat, level, isHP, 31, currentEV, currentNature, targetValue, stat);
    }
    // 2. 個体値が31の場合、努力値を上げる
    else {
        return adjustWithEV(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
    }
}

/**
 * 実数値を下げる場合の最適化（努力値優先）
 */
function optimizeForDecrease(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat) {
    // 1. 努力値が0より大きい場合、まず努力値を下げる
    if (currentEV > 0) {
        // 現在の個体値で努力値を下げて目標に到達できるかチェック
        for (let ev = currentEV - 4; ev >= 0; ev -= 4) {
            const statValue = calculateStatWithParams(baseStat, level, currentIV, ev, currentNature, isHP);
            if (statValue === targetValue) {
                return { iv: currentIV, ev: ev, natureMod: currentNature };
            }
            if (statValue < targetValue) {
                break;
            }
        }
    }
    
    // 2. 努力値を0にしても目標に届かない場合、個体値を下げる
    if (currentIV > 0) {
        for (let iv = currentIV - 1; iv >= 0; iv--) {
            // 各個体値で最適な努力値を探す
            for (let ev = 0; ev <= 252; ev += 4) {
                const statValue = calculateStatWithParams(baseStat, level, iv, ev, currentNature, isHP);
                if (statValue === targetValue) {
                    return { iv: iv, ev: ev, natureMod: currentNature };
                }
            }
        }
    }
    
    // どうしても達成できない場合は従来の処理にフォールバック
    return findOptimalStats({ 
        baseStats: { [stat]: baseStat }, 
        level: level, 
        ivValues: { [stat]: currentIV }, 
        evValues: { [stat]: currentEV }, 
        natureModifiers: { [stat]: currentNature } 
    }, stat, targetValue, baseStat, level);
}

/**
 * 指定された個体値で努力値を調整して目標値を探す
 */
function adjustWithEV(baseStat, level, isHP, iv, currentEV, currentNature, targetValue, stat) {
    // 現在の努力値から上げる方向で探索
    for (let ev = currentEV; ev <= 252; ev += 4) {
        const statValue = calculateStatWithParams(baseStat, level, iv, ev, currentNature, isHP);
        if (statValue === targetValue) {
            return { iv: iv, ev: ev, natureMod: currentNature };
        }
        if (statValue > targetValue) {
            break;
        }
    }
    
    // 努力値だけでは達成できない場合、性格変更を含む最適化
    return findOptimalStats({ 
        baseStats: { [stat]: baseStat }, 
        level: level, 
        ivValues: { [stat]: iv }, 
        evValues: { [stat]: currentEV }, 
        natureModifiers: { [stat]: currentNature } 
    }, stat, targetValue, baseStat, level);
}

/**
 * 最適化結果を適用
 */
function applyOptimizationResult(pokemon, side, stat, result) {
    pokemon.ivValues[stat] = result.iv;
    pokemon.evValues[stat] = result.ev;
    
    if (result.changeNature && result.natureMod !== undefined && stat !== 'hp') {
        pokemon.natureModifiers[stat] = result.natureMod;
        updateNatureUI(side, stat, result.natureMod);
    }
    
    updateIVEVInputs(side, stat, result.iv, result.ev);
    updateStats(side);
}
/**
 * 性格UIの更新
 */
function updateNatureUI(side, stat, natureMod) {
    // 性格UI更新の処理
    if ((side === 'attacker' && (stat === 'a' || stat === 'c')) ||
        (side === 'defender' && (stat === 'b' || stat === 'd'))) {
        updateMainNatureButtons(side, stat, natureMod);
    }
    
    const plusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Plus`);
    const minusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Minus`);
    
    if (plusCheckbox && minusCheckbox) {
        if (natureMod === 1.1) {
            plusCheckbox.checked = true;
            minusCheckbox.checked = false;
        } else if (natureMod === 0.9) {
            plusCheckbox.checked = false;
            minusCheckbox.checked = true;
        } else {
            plusCheckbox.checked = false;
            minusCheckbox.checked = false;
        }
    }
    
    updateNatureFromModifiers(side);
}

/**
 * 値を設定してイベントを発火
 */
function setValueAndTriggerEvents(input, value) {
    // 値を設定
    if (input.updateValueSilently) {
        input.updateValueSilently(value);
    } else {
        input.value = value;
    }
    
    // 変更イベントを発火
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * スピンボタンの特殊処理を設定（修正版）
 */
function setupSpinButtonHandlingFixed(input, config) {
    // キーボード操作（矢印キー）- デスクトップのみ
    input.addEventListener('keydown', function(e) {
        if (!shouldUseSliderControls() && e.key === 'ArrowDown') {
            setTimeout(() => handleSpinButtonDownFixed(config), 10);
        }
    });

    // マウス操作（スピンボタンクリック）- デスクトップのみ
    input.addEventListener('mousedown', function(e) {
        if (!shouldUseSliderControls() && isSpinButtonDownClickFixed(e, input)) {
            setTimeout(() => handleSpinButtonDownFixed(config), 10);
        }
    });
}

// ★修正：実数値入力の変更ハンドラーも判定関数を使用
function setupRealStatInputFixed({ id, side, stat, type }) {
    const input = document.getElementById(id);
    if (!input) return;

    const updateKey = `${side}_${stat}`;
    let previousValue = parseInt(input.value) || 0;

    const mobileChangeHandler = function(e) {
        if (mobileControlState.isActive && mobileControlState.activeInput === this) {
            return;
        }
        
        // ★修正：判定関数を使用
        if (!shouldUseSliderControls()) {
            const currentValue = parseInt(e.target.value) || 0;
            if (currentValue !== previousValue) {
                if (realStatManager && realStatManager.isUpdating) {
                    realStatManager.isUpdating.add(updateKey);
                }
                handleRealStatChange({ id, side, stat, type }, currentValue, 0);
                if (realStatManager && realStatManager.isUpdating) {
                    realStatManager.isUpdating.delete(updateKey);
                }
                previousValue = currentValue;
            }
        }
    };

    input.addEventListener('change', mobileChangeHandler);

    // ★修正：スピンボタンの特殊処理も保持
    setupSpinButtonHandlingFixed(input, { id, side, stat, type });
}

window.addEventListener('resize', function() {
    // リサイズ時に判定し直して必要に応じてモバイルコントロールを非表示
    if (!shouldUseSliderControls() && mobileControlState.isActive) {
        deactivateMobileControl();
    }
});

/**
 * スピンボタン下向きクリックかどうか判定（修正版）
 */
function isSpinButtonDownClickFixed(event, input) {
    const rect = input.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const isInSpinButtonArea = clickX > rect.width - 20;
    const isLowerHalf = clickY > rect.height / 2;
    
    return isInSpinButtonArea && isLowerHalf;
}

/**
 * スピンボタン下向き操作の処理（修正版）
 */
function handleSpinButtonDownFixed(config) {
    const pokemon = config.side === 'attacker' ? attackerPokemon : defenderPokemon;
    const currentRealStat = calculateCurrentStat(pokemon, config.stat);
    const limits = calculateStatLimits(pokemon.baseStats[config.stat], pokemon.level, config.stat === 'hp');
    
    // 個体値1→0の特殊処理
    if (currentRealStat === limits.min && pokemon.ivValues[config.stat] === 1) {
        const statWith0IV = calculateStatWithParams(
            pokemon.baseStats[config.stat], 
            pokemon.level, 
            0, 
            pokemon.evValues[config.stat], 
            pokemon.natureModifiers[config.stat], 
            config.stat === 'hp'
        );
        
        if (statWith0IV <= currentRealStat) {
            pokemon.ivValues[config.stat] = 0;
            updateIVEVInputs(config.side, config.stat, 0, pokemon.evValues[config.stat]);
            updateStats(config.side);
            return true;
        }
    }
    
    return false;
}

/**
 * 個体値1→0の特別処理（修正版）
 */
function handleSpecialIV1to0CaseFixed(pokemon, config, targetValue, direction) {
    if (pokemon.ivValues[config.stat] !== 1 || direction >= 0) return false;
    
    const statWith0IV = calculateStatWithParams(
        pokemon.baseStats[config.stat], 
        pokemon.level, 
        0, 
        pokemon.evValues[config.stat], 
        pokemon.natureModifiers[config.stat], 
        config.stat === 'hp'
    );
    
    if (statWith0IV <= targetValue) {
        pokemon.ivValues[config.stat] = 0;
        updateIVEVInputs(config.side, config.stat, 0, pokemon.evValues[config.stat]);
        updateStats(config.side);
        return true;
    }
    
    return false;
}

/**
 * 個体値優先の最適化処理（修正版）
 */
function findOptimalStatsIVFirstFixed(pokemon, stat, targetValue, direction) {
    const baseStat = pokemon.baseStats[stat];
    const level = pokemon.level;
    const currentIV = pokemon.ivValues[stat];
    const currentEV = pokemon.evValues[stat];
    const currentNature = pokemon.natureModifiers[stat] || 1.0;
    const isHP = stat === 'hp';
    
    // 実数値を上げる場合（direction > 0）
    if (direction > 0) {
        return optimizeForIncreaseFixed(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
    }
    // 実数値を下げる場合（direction < 0）
    else if (direction < 0) {
        return optimizeForDecreaseFixed(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
    }
    // 方向が不明な場合は従来の処理
    else {
        return findOptimalStats(pokemon, stat, targetValue, baseStat, level);
    }
}

/**
 * 実数値を上げる場合の最適化（個体値優先）（修正版）
 */
function optimizeForIncreaseFixed(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat) {
    // 1. 個体値が31未満の場合、まず個体値を上げる
    if (currentIV < 31) {
        // 現在の努力値で個体値を上げて目標に到達できるかチェック
        for (let iv = currentIV + 1; iv <= 31; iv++) {
            const statValue = calculateStatWithParams(baseStat, level, iv, currentEV, currentNature, isHP);
            if (statValue === targetValue) {
                return { iv: iv, ev: currentEV, natureMod: currentNature };
            }
            if (statValue > targetValue) {
                // 前の個体値で努力値調整を試す
                const prevIV = iv - 1;
                return adjustWithEVFixed(baseStat, level, isHP, prevIV, currentEV, currentNature, targetValue, stat);
            }
        }
        // 個体値31でも届かない場合、個体値31で努力値調整
        return adjustWithEVFixed(baseStat, level, isHP, 31, currentEV, currentNature, targetValue, stat);
    }
    // 2. 個体値が31の場合、努力値を上げる
    else {
        return adjustWithEVFixed(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat);
    }
}

/**
 * 実数値を下げる場合の最適化（努力値優先）（修正版）
 */
function optimizeForDecreaseFixed(baseStat, level, isHP, currentIV, currentEV, currentNature, targetValue, stat) {
    // 1. 努力値が0より大きい場合、まず努力値を下げる
    if (currentEV > 0) {
        // 現在の個体値で努力値を下げて目標に到達できるかチェック
        for (let ev = currentEV - 4; ev >= 0; ev -= 4) {
            const statValue = calculateStatWithParams(baseStat, level, currentIV, ev, currentNature, isHP);
            if (statValue === targetValue) {
                return { iv: currentIV, ev: ev, natureMod: currentNature };
            }
            if (statValue < targetValue) {
                break;
            }
        }
    }
    
    // 2. 努力値を0にしても目標に届かない場合、個体値を下げる
    if (currentIV > 0) {
        for (let iv = currentIV - 1; iv >= 0; iv--) {
            // 各個体値で最適な努力値を探す
            for (let ev = 0; ev <= 252; ev += 4) {
                const statValue = calculateStatWithParams(baseStat, level, iv, ev, currentNature, isHP);
                if (statValue === targetValue) {
                    return { iv: iv, ev: ev, natureMod: currentNature };
                }
            }
        }
    }
    
    // どうしても達成できない場合は従来の処理にフォールバック
    return findOptimalStats({ 
        baseStats: { [stat]: baseStat }, 
        level: level, 
        ivValues: { [stat]: currentIV }, 
        evValues: { [stat]: currentEV }, 
        natureModifiers: { [stat]: currentNature } 
    }, stat, targetValue, baseStat, level);
}

/**
 * 指定された個体値で努力値を調整して目標値を探す（修正版）
 */
function adjustWithEVFixed(baseStat, level, isHP, iv, currentEV, currentNature, targetValue, stat) {
    // 現在の努力値から上げる方向で探索
    for (let ev = currentEV; ev <= 252; ev += 4) {
        const statValue = calculateStatWithParams(baseStat, level, iv, ev, currentNature, isHP);
        if (statValue === targetValue) {
            return { iv: iv, ev: ev, natureMod: currentNature };
        }
        if (statValue > targetValue) {
            break;
        }
    }
    
    // 努力値だけでは達成できない場合、性格変更を含む最適化
    return findOptimalStats({ 
        baseStats: { [stat]: baseStat }, 
        level: level, 
        ivValues: { [stat]: iv }, 
        evValues: { [stat]: currentEV }, 
        natureModifiers: { [stat]: currentNature } 
    }, stat, targetValue, baseStat, level);
}

/**
 * 最適化結果を適用（修正版）
 */
function applyStatResultFixed(pokemon, config, result) {
    pokemon.ivValues[config.stat] = result.iv;
    pokemon.evValues[config.stat] = result.ev;
    
    if (result.changeNature && result.natureMod !== undefined && config.stat !== 'hp') {
        pokemon.natureModifiers[config.stat] = result.natureMod;
        updateNatureUIFixed(config.side, config.stat, result.natureMod);
    }
    
    updateIVEVInputs(config.side, config.stat, result.iv, result.ev);
    updateStats(config.side);
}

/**
 * 性格UI更新（修正版）
 */
function updateNatureUIFixed(side, stat, natureMod) {
    // 性格UI更新の処理
    if ((side === 'attacker' && (stat === 'a' || stat === 'c')) ||
        (side === 'defender' && (stat === 'b' || stat === 'd'))) {
        updateMainNatureButtons(side, stat, natureMod);
    }
    
    const plusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Plus`);
    const minusCheckbox = document.getElementById(`${side}${stat.toUpperCase()}Minus`);
    
    if (plusCheckbox && minusCheckbox) {
        if (natureMod === 1.1) {
            plusCheckbox.checked = true;
            minusCheckbox.checked = false;
        } else if (natureMod === 0.9) {
            plusCheckbox.checked = false;
            minusCheckbox.checked = true;
        } else {
            plusCheckbox.checked = false;
            minusCheckbox.checked = false;
        }
    }
    
    updateNatureFromModifiers(side);
}

/**
 * 変化方向を判定（修正版）
 */
function getChangeDirection(current, previous) {
    if (current > previous) return 1;
    if (current < previous) return -1;
    return 0;
}

/**
 * 既存のsetupRealStatInputListenersを修正版で置き換える
 */
function setupRealStatInputListenersFixed() {
    initializeRealStatInputsFixed();
    setupHPRealStatChangeListener();
}
/**
 * DOMContentLoaded内での呼び出しを修正
 */
function initializeMobileControlsFixed() {
    // 修正版のリスナー設定を呼び出し
    setupMobileInputListeners();
    setupMobileControlListeners();
    
    // 実数値入力の初期化も修正版を使用
    setupRealStatInputListenersFixed();
}
