# katinukiPD

プロキオンROMから、`3genDamageCalculator` の
`all_pokemon_data.json` と同じ形でポケモンデータを抽出したものです。

## 収録ファイル

- `all_pokemon_data.json`: 抽出済みデータ（313体）
- `pokemon_moves.json`: 習得可能な技の抽出済みデータ（652種）
- `extract_procyon_pokemon_data.py`: 再抽出スクリプト
- `tests/`: ROMを同梱せずに実行できるテスト

JSONの各要素は次の項目を持ちます。

```json
{
  "name": "バジール",
  "basestats": [50, 43, 43, 63, 50, 59],
  "type": ["くさ"],
  "ability": ["しんりょく", "せいでんき"],
  "hiragana": "ばじーる",
  "romaji": "baji-ru",
  "moves": ["とっしん"],
  "weight": 6.3
}
```

`basestats` の順番は、参照元と同じ
`HP, こうげき, ぼうぎょ, とくこう, とくぼう, すばやさ` です。

## 抽出元

動作確認に使用したROM:

- `Procyon_plus_v0.2_fixed.gba`
- SHA-256: `221ED952306E3D5EF2D48A9356159DA129DF0858140E2AFC19BC20FF1098D36D`

主なROMテーブル:

| データ | ROMオフセット | 形式 |
|---|---:|---|
| 種族名 | `0x1060BA0` | 8 bytes/種族 |
| 種族値・タイプ・特性ID | `0x21118C` | 28 bytes/種族 |
| 種族ID→図鑑番号 | `0x20E9F6` | 2 bytes/種族 |
| 図鑑データ（体重） | `0x40E2D0` | 28 bytes/図鑑番号、体重は`+8` |
| タイプ名 | `0x411E1C` | 6 bytes/タイプ |
| 拡張特性名 | `0x13FF000` | 9 bytes/特性 |
| 技名 | `0x1000000` | 16 bytes/技 |
| 技データ | `0x1010000` | 12 bytes/技 |
| 習得可能技ポインタ | `0xB20000` | 412ポインタ、各リストはu16・`0xFFFF`終端 |
| マシン互換bit | `0x20F5D0` | 8 bytes/種族、bit 50～57がHM |
| マシン対応技ID | `0x419F9C` | 2 bytes/マシン |

ROM内の411種族スロットから、名前があり、6種族値のいずれかが非0で、
有効な図鑑番号を持つ313体だけを出力しています。空欄、ダミー、未使用スロットは
含めていません。

技は、とっくんそうち用に生成済みの習得可能技テーブルを読み、各種族の
マシン互換bitからHM01～08を追加します。重複する技IDは追加しません。

`pokemon_moves.json` は、313体のうち少なくとも1体が習得できる技だけを収録します。
技名、ローマ字、タイプ、威力、命中、物理・特殊・変化、計算クラス、単体・範囲を
12バイト技データから生成しています。同名で内部IDが異なる「ウインドミル」は、
参照元JSONが技IDを持たないため、小さい方のIDを採用しています。

## 再抽出

Python 3.10以降で実行します。

```powershell
python .\extract_procyon_pokemon_data.py `
  "C:\path\to\Procyon_plus_v0.2_fixed.gba" `
  ".\all_pokemon_data.json" `
  ".\pokemon_moves.json"
```

スクリプトはROMを読み取るだけです。入力ROMへの書き込み、上書き、リネームは
行いません。

## テスト

```powershell
python -m pytest -q
```

開発時のテストだけ`pytest`を使用します。JSONの利用や再抽出に追加パッケージは
不要です。
