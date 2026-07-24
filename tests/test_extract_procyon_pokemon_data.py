import struct
from pathlib import Path

import pytest

from extract_procyon_pokemon_data import (
    RomLayout,
    decode_gen3_japanese,
    extract_moves_data,
    extract_pokemon_data,
    kana_to_hiragana,
    romanize,
    write_pokemon_data,
)


def _put(data: bytearray, offset: int, payload: bytes) -> None:
    data[offset : offset + len(payload)] = payload


def _name(*codes: int, size: int) -> bytes:
    value = bytes((*codes, 0xFF))
    return value.ljust(size, b"\xFF")


@pytest.fixture
def layout() -> RomLayout:
    return RomLayout(
        species_count=3,
        species_name_table=0x100,
        species_name_stride=8,
        base_stats_table=0x200,
        base_stats_stride=28,
        species_to_dex_table=0x300,
        pokedex_data_table=0x400,
        pokedex_data_stride=28,
        type_name_table=0x500,
        type_name_stride=6,
        ability_name_table=0xA00,
        ability_name_stride=9,
        move_name_table=0x700,
        move_name_stride=16,
        learnset_pointer_table=0x800,
        machine_compatibility_table=0xC00,
        machine_move_table=0xD00,
        move_data_table=0xE00,
        move_data_stride=12,
    )


def _synthetic_rom(path: Path, layout: RomLayout) -> None:
    data = bytearray(b"\xFF" * 0x1400)
    _put(data, layout.machine_compatibility_table, bytes((layout.species_count + 1) * 8))
    _put(data, layout.machine_move_table, bytes(58 * 2))

    # Type 0: ノーマル, type 13: でんき
    _put(data, layout.type_name_table, _name(0x69, 0xAE, 0x6F, 0x79, size=6))
    _put(
        data,
        layout.type_name_table + 13 * layout.type_name_stride,
        _name(0x44, 0x2E, 0x07, size=6),
    )

    # Ability 9: せいでんき, ability 31: ひらいしん
    _put(
        data,
        layout.ability_name_table + 9 * layout.ability_name_stride,
        _name(0x0E, 0x02, 0x44, 0x2E, 0x07, size=9),
    )
    _put(
        data,
        layout.ability_name_table + 31 * layout.ability_name_stride,
        _name(0x1B, 0x27, 0x02, 0x0C, 0x2E, size=9),
    )

    # Move 1: たいあたり, move 2: でんこうせっか
    _put(
        data,
        layout.move_name_table + layout.move_name_stride,
        _name(0x10, 0x02, 0x01, 0x10, 0x28, size=16),
    )
    _put(
        data,
        layout.move_name_table + 2 * layout.move_name_stride,
        _name(0x44, 0x2E, 0x0A, 0x03, 0x0E, 0x50, 0x06, size=16),
    )
    _put(
        data,
        layout.move_name_table + 3 * layout.move_name_stride,
        _name(0x02, 0x01, 0x02, 0x38, 0x28, size=16),
    )
    _put(
        data,
        layout.move_data_table + layout.move_data_stride,
        bytes((0, 50, 0, 95, 30, 0, 0, 0, 0, 0, 0, 0)),
    )
    _put(
        data,
        layout.move_data_table + 2 * layout.move_data_stride,
        bytes((0, 90, 13, 100, 15, 0, 32, 0, 0, 0, 2, 0)),
    )
    _put(
        data,
        layout.move_data_table + 3 * layout.move_data_stride,
        bytes((0, 50, 0, 95, 30, 0, 0, 0, 0, 0, 0, 0)),
    )

    # Species 1 is valid and maps to dex 2.
    _put(
        data,
        layout.species_name_table + layout.species_name_stride,
        _name(0x9C, 0x56, 0x61, 0x85, 0x53, size=8),
    )
    stats = bytearray(28)
    stats[:8] = bytes((35, 55, 40, 90, 50, 50, 13, 13))
    stats[22:24] = bytes((9, 31))
    _put(data, layout.base_stats_table + layout.base_stats_stride, stats)
    struct.pack_into("<H", data, layout.species_to_dex_table, 2)
    struct.pack_into(
        "<HH",
        data,
        layout.pokedex_data_table + 2 * layout.pokedex_data_stride + 6,
        4,
        60,
    )

    # Species 2 has no stats and must not appear in the output.
    struct.pack_into("<H", data, layout.species_to_dex_table + 2, 1)

    # Species 3 is valid, maps to dex 3, and has duplicate type/ability slots.
    _put(
        data,
        layout.species_name_table + 3 * layout.species_name_stride,
        _name(0x96, 0x8D, 0xAE, 0x79, size=8),
    )
    stats = bytearray(28)
    stats[:8] = bytes((50, 43, 43, 59, 63, 50, 0, 0))
    stats[22:24] = bytes((9, 9))
    _put(data, layout.base_stats_table + 3 * layout.base_stats_stride, stats)
    struct.pack_into("<H", data, layout.species_to_dex_table + 4, 3)
    struct.pack_into(
        "<HH",
        data,
        layout.pokedex_data_table + 3 * layout.pokedex_data_stride + 6,
        4,
        63,
    )

    list1_offset = 0x900
    struct.pack_into("<3H", data, list1_offset, 1, 2, 0xFFFF)
    struct.pack_into(
        "<I",
        data,
        layout.learnset_pointer_table + 4,
        layout.rom_base + list1_offset,
    )
    struct.pack_into(
        "<Q",
        data,
        layout.machine_compatibility_table + 8,
        1 << 50,
    )
    struct.pack_into(
        "<H",
        data,
        layout.machine_move_table + 50 * 2,
        3,
    )
    list3_offset = 0x910
    struct.pack_into("<2H", data, list3_offset, 1, 0xFFFF)
    struct.pack_into(
        "<I",
        data,
        layout.learnset_pointer_table + 12,
        layout.rom_base + list3_offset,
    )
    path.write_bytes(data)


def test_decode_and_search_strings() -> None:
    encoded = bytes((0x9C, 0x56, 0x61, 0x85, 0x53, 0xFF))
    assert decode_gen3_japanese(encoded) == "\u30d4\u30ab\u30c1\u30e5\u30a6"
    assert kana_to_hiragana("\u30d4\u30ab\u30c1\u30e5\u30a6") == "\u3074\u304b\u3061\u3085\u3046"
    assert romanize("\u30d4\u30ab\u30c1\u30e5\u30a6") == "pikachuu"
    assert romanize("\u30df\u30e5\u30a6\u30c4\u30fc") == "myuutsu-"


def test_extract_matches_all_pokemon_data_schema(
    tmp_path: Path, layout: RomLayout
) -> None:
    rom = tmp_path / "fixture.gba"
    _synthetic_rom(rom, layout)

    result = extract_pokemon_data(rom, layout)

    assert len(result) == 2
    assert list(result[0]) == [
        "name",
        "basestats",
        "type",
        "ability",
        "hiragana",
        "romaji",
        "moves",
        "weight",
    ]
    assert result[0] == {
        "name": "\u30d4\u30ab\u30c1\u30e5\u30a6",
        "basestats": [35, 55, 40, 50, 50, 90],
        "type": ["\u3067\u3093\u304d"],
        "ability": ["\u305b\u3044\u3067\u3093\u304d", "\u3072\u3089\u3044\u3057\u3093"],
        "hiragana": "\u3074\u304b\u3061\u3085\u3046",
        "romaji": "pikachuu",
        "moves": [
            "\u305f\u3044\u3042\u305f\u308a",
            "\u3067\u3093\u3053\u3046\u305b\u3063\u304b",
            "\u3044\u3042\u3044\u304e\u308a",
        ],
        "weight": 6.0,
    }
    assert result[1]["type"] == ["\u30ce\u30fc\u30de\u30eb"]
    assert result[1]["ability"] == ["\u305b\u3044\u3067\u3093\u304d"]
    assert result[1]["weight"] == 6.3


def test_extract_move_metadata_for_learnsets_and_hms(
    tmp_path: Path, layout: RomLayout
) -> None:
    rom = tmp_path / "fixture.gba"
    _synthetic_rom(rom, layout)

    result = extract_moves_data(rom, layout)

    assert len(result) == 3
    assert list(result[0]) == [
        "name",
        "romaji",
        "type",
        "power",
        "accuracy",
        "category",
        "class",
        "target",
    ]
    assert result[1] == {
        "name": "\u3067\u3093\u3053\u3046\u305b\u3063\u304b",
        "romaji": "denkousekka",
        "type": "\u3067\u3093\u304d",
        "power": 90,
        "accuracy": 100,
        "category": "Special",
        "class": "standard",
        "target": 2,
    }
    assert result[2]["name"] == "\u3044\u3042\u3044\u304e\u308a"


def test_unterminated_learnset_is_rejected(
    tmp_path: Path, layout: RomLayout
) -> None:
    rom = tmp_path / "fixture.gba"
    _synthetic_rom(rom, layout)
    data = bytearray(rom.read_bytes())
    data[0x900:] = b"\x01\x00" * ((len(data) - 0x900) // 2)
    rom.write_bytes(data)

    with pytest.raises(ValueError, match="unterminated learnset"):
        extract_pokemon_data(rom, layout)


def test_json_output_uses_reproducible_lf_newlines(
    tmp_path: Path, layout: RomLayout
) -> None:
    rom = tmp_path / "fixture.gba"
    output = tmp_path / "all_pokemon_data.json"
    _synthetic_rom(rom, layout)

    write_pokemon_data(rom, output, layout)

    assert b"\r\n" not in output.read_bytes()
