"""Extract Procyon Pokemon data in 3genDamageCalculator's JSON shape."""

from __future__ import annotations

import argparse
import json
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class RomLayout:
    rom_base: int = 0x08000000
    species_count: int = 411
    pokedex_count: int = 386
    move_count: int = 680
    species_name_table: int = 0x01060BA0
    species_name_stride: int = 8
    base_stats_table: int = 0x0021118C
    base_stats_stride: int = 28
    species_to_dex_table: int = 0x0020E9F6
    pokedex_data_table: int = 0x0040E2D0
    pokedex_data_stride: int = 28
    type_name_table: int = 0x00411E1C
    type_name_stride: int = 6
    ability_name_table: int = 0x013FF000
    ability_name_stride: int = 9
    move_name_table: int = 0x01000000
    move_name_stride: int = 16
    learnset_pointer_table: int = 0x00B20000
    machine_compatibility_table: int = 0x0020F5D0
    machine_move_table: int = 0x00419F9C
    move_data_table: int = 0x01010000
    move_data_stride: int = 12


DEFAULT_LAYOUT = RomLayout()


_HIRAGANA = (
    "\u3042\u3044\u3046\u3048\u304a"
    "\u304b\u304d\u304f\u3051\u3053"
    "\u3055\u3057\u3059\u305b\u305d"
    "\u305f\u3061\u3064\u3066\u3068"
    "\u306a\u306b\u306c\u306d\u306e"
    "\u306f\u3072\u3075\u3078\u307b"
    "\u307e\u307f\u3080\u3081\u3082"
    "\u3084\u3086\u3088"
    "\u3089\u308a\u308b\u308c\u308d"
    "\u308f\u3092\u3093"
    "\u3041\u3043\u3045\u3047\u3049"
    "\u3083\u3085\u3087"
    "\u304c\u304e\u3050\u3052\u3054"
    "\u3056\u3058\u305a\u305c\u305e"
    "\u3060\u3062\u3065\u3067\u3069"
    "\u3070\u3073\u3076\u3079\u307c"
    "\u3071\u3074\u3077\u307a\u307d"
    "\u3063"
)
_KATAKANA = (
    "\u30a2\u30a4\u30a6\u30a8\u30aa"
    "\u30ab\u30ad\u30af\u30b1\u30b3"
    "\u30b5\u30b7\u30b9\u30bb\u30bd"
    "\u30bf\u30c1\u30c4\u30c6\u30c8"
    "\u30ca\u30cb\u30cc\u30cd\u30ce"
    "\u30cf\u30d2\u30d5\u30d8\u30db"
    "\u30de\u30df\u30e0\u30e1\u30e2"
    "\u30e4\u30e6\u30e8"
    "\u30e9\u30ea\u30eb\u30ec\u30ed"
    "\u30ef\u30f2\u30f3"
    "\u30a1\u30a3\u30a5\u30a7\u30a9"
    "\u30e3\u30e5\u30e7"
    "\u30ac\u30ae\u30b0\u30b2\u30b4"
    "\u30b6\u30b8\u30ba\u30bc\u30be"
    "\u30c0\u30c2\u30c5\u30c7\u30c9"
    "\u30d0\u30d3\u30d6\u30d9\u30dc"
    "\u30d1\u30d4\u30d7\u30da\u30dd"
    "\u30c3"
)

_CHARMAP = {0x00: " "}
_CHARMAP.update({code: char for code, char in enumerate(_HIRAGANA, 0x01)})
_CHARMAP.update({code: char for code, char in enumerate(_KATAKANA, 0x51)})
_CHARMAP.update({code: str(code - 0xA1) for code in range(0xA1, 0xAB)})
_CHARMAP.update(
    {
        0xAB: "\uff01",
        0xAC: "\uff1f",
        0xAD: "\u3002",
        0xAE: "\u30fc",
        0xAF: "\u30fb",
        0xB0: "\u2026",
        0xB1: "\u300e",
        0xB2: "\u300f",
        0xB3: "\u2018",
        0xB4: "\u2019",
        0xB5: "\u2642",
        0xB6: "\u2640",
        0xB7: "$",
        0xB8: ",",
        0xB9: "*",
        0xBA: "/",
    }
)
_CHARMAP.update({code: chr(ord("A") + code - 0xBB) for code in range(0xBB, 0xD5)})
_CHARMAP.update({code: chr(ord("a") + code - 0xD5) for code in range(0xD5, 0xEF)})
_CHARMAP.update(
    {
        0xEF: "\u25b6",
        0xF0: ":",
        0xF1: "\u30f4",
        0xF2: "\u00d6",
        0xF3: "\u00dc",
        0xF4: "\u00e4",
        0xF5: "\u00f6",
        0xF6: "\u00fc",
    }
)


def decode_gen3_japanese(data: bytes) -> str:
    """Decode a fixed-width Japanese Gen 3 string through its 0xFF terminator."""
    result: list[str] = []
    for value in data:
        if value == 0xFF:
            break
        try:
            result.append(_CHARMAP[value])
        except KeyError as exc:
            raise ValueError(f"unsupported Gen 3 character byte: 0x{value:02X}") from exc
    return "".join(result).rstrip()


def kana_to_hiragana(text: str) -> str:
    """Convert full-width katakana to hiragana while preserving the long mark."""
    return "".join(
        chr(ord(char) - 0x60) if "\u30a1" <= char <= "\u30f6" else char
        for char in text
    )


_ROMAJI_SINGLE = {
    "\u3042": "a",
    "\u3044": "i",
    "\u3046": "u",
    "\u3048": "e",
    "\u304a": "o",
    "\u304b": "ka",
    "\u304d": "ki",
    "\u304f": "ku",
    "\u3051": "ke",
    "\u3053": "ko",
    "\u3055": "sa",
    "\u3057": "shi",
    "\u3059": "su",
    "\u305b": "se",
    "\u305d": "so",
    "\u305f": "ta",
    "\u3061": "chi",
    "\u3064": "tsu",
    "\u3066": "te",
    "\u3068": "to",
    "\u306a": "na",
    "\u306b": "ni",
    "\u306c": "nu",
    "\u306d": "ne",
    "\u306e": "no",
    "\u306f": "ha",
    "\u3072": "hi",
    "\u3075": "fu",
    "\u3078": "he",
    "\u307b": "ho",
    "\u307e": "ma",
    "\u307f": "mi",
    "\u3080": "mu",
    "\u3081": "me",
    "\u3082": "mo",
    "\u3084": "ya",
    "\u3086": "yu",
    "\u3088": "yo",
    "\u3089": "ra",
    "\u308a": "ri",
    "\u308b": "ru",
    "\u308c": "re",
    "\u308d": "ro",
    "\u308f": "wa",
    "\u3092": "wo",
    "\u3093": "n",
    "\u304c": "ga",
    "\u304e": "gi",
    "\u3050": "gu",
    "\u3052": "ge",
    "\u3054": "go",
    "\u3056": "za",
    "\u3058": "ji",
    "\u305a": "zu",
    "\u305c": "ze",
    "\u305e": "zo",
    "\u3060": "da",
    "\u3062": "ji",
    "\u3065": "zu",
    "\u3067": "de",
    "\u3069": "do",
    "\u3070": "ba",
    "\u3073": "bi",
    "\u3076": "bu",
    "\u3079": "be",
    "\u307c": "bo",
    "\u3071": "pa",
    "\u3074": "pi",
    "\u3077": "pu",
    "\u307a": "pe",
    "\u307d": "po",
    "\u3041": "a",
    "\u3043": "i",
    "\u3045": "u",
    "\u3047": "e",
    "\u3049": "o",
    "\u3083": "ya",
    "\u3085": "yu",
    "\u3087": "yo",
    "\u3094": "vu",
}

_ROMAJI_PAIRS = {
    "\u304d\u3083": "kya",
    "\u304d\u3085": "kyu",
    "\u304d\u3087": "kyo",
    "\u3057\u3083": "sha",
    "\u3057\u3085": "shu",
    "\u3057\u3087": "sho",
    "\u3061\u3083": "cha",
    "\u3061\u3085": "chu",
    "\u3061\u3087": "cho",
    "\u306b\u3083": "nya",
    "\u306b\u3085": "nyu",
    "\u306b\u3087": "nyo",
    "\u3072\u3083": "hya",
    "\u3072\u3085": "hyu",
    "\u3072\u3087": "hyo",
    "\u307f\u3083": "mya",
    "\u307f\u3085": "myu",
    "\u307f\u3087": "myo",
    "\u308a\u3083": "rya",
    "\u308a\u3085": "ryu",
    "\u308a\u3087": "ryo",
    "\u304e\u3083": "gya",
    "\u304e\u3085": "gyu",
    "\u304e\u3087": "gyo",
    "\u3058\u3083": "ja",
    "\u3058\u3085": "ju",
    "\u3058\u3087": "jo",
    "\u3073\u3083": "bya",
    "\u3073\u3085": "byu",
    "\u3073\u3087": "byo",
    "\u3074\u3083": "pya",
    "\u3074\u3085": "pyu",
    "\u3074\u3087": "pyo",
    "\u3075\u3041": "fa",
    "\u3075\u3043": "fi",
    "\u3075\u3047": "fe",
    "\u3075\u3049": "fo",
    "\u3066\u3043": "ti",
    "\u3067\u3043": "di",
    "\u3068\u3045": "tu",
    "\u3069\u3045": "du",
    "\u3046\u3043": "wi",
    "\u3046\u3047": "we",
    "\u3046\u3049": "wo",
    "\u3094\u3041": "va",
    "\u3094\u3043": "vi",
    "\u3094\u3047": "ve",
    "\u3094\u3049": "vo",
}


def romanize(text: str) -> str:
    """Return a deterministic Hepburn-like search key."""
    source = kana_to_hiragana(text)
    result: list[str] = []
    index = 0
    geminate = False
    while index < len(source):
        char = source[index]
        if char == "\u3063":
            geminate = True
            index += 1
            continue
        pair = source[index : index + 2]
        if pair in _ROMAJI_PAIRS:
            syllable = _ROMAJI_PAIRS[pair]
            index += 2
        elif char in _ROMAJI_SINGLE:
            syllable = _ROMAJI_SINGLE[char]
            index += 1
        elif char == "\u30fc":
            result.append("-")
            index += 1
            continue
        else:
            result.append(char.lower())
            index += 1
            continue
        if geminate and syllable:
            result.append("t" if syllable.startswith("ch") else syllable[0])
        result.append(syllable)
        geminate = False
    return "".join(result)


def _slice(data: bytes, offset: int, size: int, label: str) -> bytes:
    end = offset + size
    if offset < 0 or end > len(data):
        raise ValueError(f"{label} is outside the ROM at 0x{offset:X}")
    return data[offset:end]


def _u16(data: bytes, offset: int, label: str) -> int:
    return struct.unpack("<H", _slice(data, offset, 2, label))[0]


def _u32(data: bytes, offset: int, label: str) -> int:
    return struct.unpack("<I", _slice(data, offset, 4, label))[0]


def _table_name(data: bytes, table: int, stride: int, item_id: int, label: str) -> str:
    return decode_gen3_japanese(
        _slice(data, table + item_id * stride, stride, label)
    )


def _unique_names(
    data: bytes,
    ids: tuple[int, ...],
    table: int,
    stride: int,
    label: str,
    *,
    ignore_zero: bool = False,
) -> list[str]:
    result: list[str] = []
    for item_id in ids:
        if ignore_zero and item_id == 0:
            continue
        name = _table_name(data, table, stride, item_id, label)
        if name and name not in result:
            result.append(name)
    return result


def _learnset_move_ids(data: bytes, species_id: int, layout: RomLayout) -> list[int]:
    pointer = _u32(
        data,
        layout.learnset_pointer_table + species_id * 4,
        "learnset pointer",
    )
    if pointer == 0:
        return []
    offset = pointer - layout.rom_base
    if offset < 0 or offset >= len(data):
        raise ValueError(
            f"invalid learnset pointer for species {species_id}: 0x{pointer:08X}"
        )
    result: list[int] = []
    max_entries = min(layout.move_count + 1, (len(data) - offset) // 2)
    for index in range(max_entries):
        move_id = _u16(data, offset + index * 2, "learnset entry")
        if move_id == 0xFFFF:
            return result
        if not 0 < move_id < layout.move_count:
            raise ValueError(
                f"invalid move ID {move_id} in species {species_id} learnset"
            )
        result.append(move_id)
    raise ValueError(f"unterminated learnset for species {species_id}")


def _hm_move_ids(data: bytes, species_id: int, layout: RomLayout) -> list[int]:
    compatibility = struct.unpack(
        "<Q",
        _slice(
            data,
            layout.machine_compatibility_table + species_id * 8,
            8,
            "machine compatibility",
        ),
    )[0]
    result: list[int] = []
    for machine_index in range(50, 58):
        if not compatibility & (1 << machine_index):
            continue
        move_id = _u16(
            data,
            layout.machine_move_table + machine_index * 2,
            "machine move",
        )
        if move_id == 0:
            continue
        if not 0 < move_id < layout.move_count:
            raise ValueError(f"invalid HM move ID: {move_id}")
        if move_id not in result:
            result.append(move_id)
    return result


def _species_move_ids(data: bytes, species_id: int, layout: RomLayout) -> list[int]:
    result = _learnset_move_ids(data, species_id, layout)
    for move_id in _hm_move_ids(data, species_id, layout):
        if move_id not in result:
            result.append(move_id)
    return result


def _active_species(
    data: bytes, layout: RomLayout
) -> list[tuple[int, int, str, bytes]]:
    result: list[tuple[int, int, str, bytes]] = []
    seen_dex_numbers: set[int] = set()
    for species_id in range(1, layout.species_count + 1):
        stats = _slice(
            data,
            layout.base_stats_table + species_id * layout.base_stats_stride,
            layout.base_stats_stride,
            "base stats",
        )
        name = _table_name(
            data,
            layout.species_name_table,
            layout.species_name_stride,
            species_id,
            "species name",
        )
        dex_number = _u16(
            data,
            layout.species_to_dex_table + (species_id - 1) * 2,
            "species-to-dex mapping",
        )
        if not name or not any(stats[:6]) or not 1 <= dex_number <= layout.pokedex_count:
            continue
        if dex_number in seen_dex_numbers:
            raise ValueError(f"duplicate active Pokedex number: {dex_number}")
        seen_dex_numbers.add(dex_number)
        result.append((dex_number, species_id, name, stats))
    return sorted(result)


def extract_pokemon_data(
    rom_path: str | Path, layout: RomLayout = DEFAULT_LAYOUT
) -> list[dict[str, Any]]:
    """Extract active species, ordered by Pokedex number."""
    data = Path(rom_path).read_bytes()
    extracted: list[tuple[int, dict[str, Any]]] = []

    for dex_number, species_id, name, stats in _active_species(data, layout):
        type_names = _unique_names(
            data,
            (stats[6], stats[7]),
            layout.type_name_table,
            layout.type_name_stride,
            "type name",
        )
        ability_names = _unique_names(
            data,
            (stats[22], stats[23]),
            layout.ability_name_table,
            layout.ability_name_stride,
            "ability name",
            ignore_zero=True,
        )
        move_names = [
            _table_name(
                data,
                layout.move_name_table,
                layout.move_name_stride,
                move_id,
                "move name",
            )
            for move_id in _species_move_ids(data, species_id, layout)
        ]
        weight_hg = _u16(
            data,
            layout.pokedex_data_table
            + dex_number * layout.pokedex_data_stride
            + 8,
            "Pokedex weight",
        )
        hiragana = kana_to_hiragana(name)
        extracted.append(
            (
                dex_number,
                {
                    "name": name,
                    "basestats": [
                        stats[0],
                        stats[1],
                        stats[2],
                        stats[4],
                        stats[5],
                        stats[3],
                    ],
                    "type": type_names,
                    "ability": ability_names,
                    "hiragana": hiragana,
                    "romaji": romanize(hiragana),
                    "moves": move_names,
                    "weight": weight_hg / 10,
                },
            )
        )

    return [entry for _, entry in sorted(extracted, key=lambda item: item[0])]


_MOVE_CLASS_BY_EFFECT = {
    29: "multi_hit",
    40: "harf",
    41: "fixed",
    44: "two_hit",
    77: "two_hit",
    81: "variable",
    87: "fixed",
    88: "two_fold",
    91: "itamiwake",
    99: "pinch_up",
    109: "noroi",
    117: "variable",
    122: "variable",
    128: "two_fold",
    135: "awaken_power",
    146: "two_fold",
    148: "absolute",
    149: "two_fold",
    150: "two_fold",
    151: "solarbeam",
    154: "variable",
    161: "special_case",
    169: "two_fold",
    185: "two_fold",
    189: "variable",
    190: "pinch_down",
    203: "weather_ball",
    234: "two_fold",
}


def _move_class(move_id: int, effect: int) -> str:
    if move_id == 120:
        return "jibaku"
    if move_id == 153:
        return "b_harf"
    return _MOVE_CLASS_BY_EFFECT.get(effect, "standard")


def _move_category(power: int, damage_class_control: int) -> str:
    if power == 0:
        return "Status"
    if damage_class_control & 2:
        return "Special"
    return "Physical"


def extract_moves_data(
    rom_path: str | Path, layout: RomLayout = DEFAULT_LAYOUT
) -> list[dict[str, Any]]:
    """Extract metadata for every move learnable by an active species."""
    data = Path(rom_path).read_bytes()
    move_ids: set[int] = set()
    for _, species_id, _, _ in _active_species(data, layout):
        move_ids.update(_species_move_ids(data, species_id, layout))

    result: list[dict[str, Any]] = []
    seen_names: set[str] = set()
    for move_id in sorted(move_ids):
        name = _table_name(
            data,
            layout.move_name_table,
            layout.move_name_stride,
            move_id,
            "move name",
        )
        if not name:
            raise ValueError(f"empty name for learnable move ID {move_id}")
        if name in seen_names:
            continue
        seen_names.add(name)
        record = _slice(
            data,
            layout.move_data_table + move_id * layout.move_data_stride,
            layout.move_data_stride,
            "move data",
        )
        effect = record[0]
        power = record[1]
        type_id = record[2]
        accuracy = record[3]
        target_flags = record[6]
        damage_class_control = record[10]
        entry: dict[str, Any] = {
            "name": name,
            "romaji": romanize(name),
            "type": _table_name(
                data,
                layout.type_name_table,
                layout.type_name_stride,
                type_id,
                "type name",
            ),
            "power": power,
            "accuracy": accuracy,
            "category": _move_category(power, damage_class_control),
            "class": _move_class(move_id, effect),
            "target": 2 if target_flags in (8, 32) else 1,
        }
        if effect == 41:
            entry["fixed_value"] = 20 if move_id == 49 else 40
        elif effect == 87:
            entry["fixed_value"] = "level"
        result.append(entry)
    return result


def _write_json(output_path: str | Path, result: Any) -> None:
    with Path(output_path).open("w", encoding="utf-8", newline="\n") as output:
        output.write(json.dumps(result, ensure_ascii=False, indent=2) + "\n")


def write_pokemon_data(
    rom_path: str | Path,
    output_path: str | Path,
    layout: RomLayout = DEFAULT_LAYOUT,
) -> int:
    result = extract_pokemon_data(rom_path, layout)
    _write_json(output_path, result)
    return len(result)


def write_moves_data(
    rom_path: str | Path,
    output_path: str | Path,
    layout: RomLayout = DEFAULT_LAYOUT,
) -> int:
    result = extract_moves_data(rom_path, layout)
    _write_json(output_path, result)
    return len(result)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("rom", type=Path, help="input Procyon .gba")
    parser.add_argument(
        "pokemon_output",
        type=Path,
        nargs="?",
        default=Path("all_pokemon_data.json"),
        help="Pokemon JSON path",
    )
    parser.add_argument(
        "moves_output",
        type=Path,
        nargs="?",
        default=Path("pokemon_moves.json"),
        help="move JSON path",
    )
    args = parser.parse_args()
    pokemon_count = write_pokemon_data(args.rom, args.pokemon_output)
    move_count = write_moves_data(args.rom, args.moves_output)
    print(f"wrote {pokemon_count} Pokemon to {args.pokemon_output}")
    print(f"wrote {move_count} moves to {args.moves_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
