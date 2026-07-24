import json
from pathlib import Path


EXPECTED_KEYS = [
    "name",
    "basestats",
    "type",
    "ability",
    "hiragana",
    "romaji",
    "moves",
    "weight",
]


def _load() -> list[dict]:
    path = Path(__file__).resolve().parents[1] / "all_pokemon_data.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _load_moves() -> list[dict]:
    path = Path(__file__).resolve().parents[1] / "pokemon_moves.json"
    return json.loads(path.read_text(encoding="utf-8"))


def test_generated_json_has_the_reference_schema() -> None:
    data = _load()
    assert len(data) == 313
    assert all(list(entry) == EXPECTED_KEYS for entry in data)
    assert len({entry["name"] for entry in data}) == len(data)
    assert all(entry["name"] for entry in data)
    assert all(len(entry["basestats"]) == 6 for entry in data)
    assert all(entry["type"] for entry in data)
    assert all(entry["ability"] for entry in data)
    assert all(entry["moves"] for entry in data)
    assert all(isinstance(entry["weight"], (int, float)) for entry in data)


def test_generated_json_contains_known_procyon_values() -> None:
    data = _load()
    by_name = {entry["name"]: entry for entry in data}

    basil = by_name["\u30d0\u30b8\u30fc\u30eb"]
    assert basil["basestats"] == [50, 43, 43, 63, 50, 59]
    assert basil["type"] == ["\u304f\u3055"]
    assert basil["weight"] == 6.3

    pikachu = by_name["\u30d4\u30ab\u30c1\u30e5\u30a6"]
    assert pikachu["romaji"] == "pikachuu"
    assert "10\u307e\u3093\u30dc\u30eb\u30c8" in pikachu["moves"]
    assert "\u304b\u3044\u308a\u304d" in pikachu["moves"]
    assert "\u30d5\u30e9\u30c3\u30b7\u30e5" in pikachu["moves"]
    assert "\u3044\u308f\u304f\u3060\u304d" in pikachu["moves"]


def test_move_json_covers_every_learnable_move_name() -> None:
    pokemon = _load()
    moves = _load_moves()
    required_keys = {
        "name",
        "romaji",
        "type",
        "power",
        "accuracy",
        "category",
        "class",
        "target",
    }
    learnable_names = {
        move_name for entry in pokemon for move_name in entry["moves"]
    }

    assert len(moves) == 652
    assert len({move["name"] for move in moves}) == len(moves)
    assert {move["name"] for move in moves} == learnable_names
    assert all(required_keys <= move.keys() for move in moves)

    by_name = {move["name"]: move for move in moves}
    surf = by_name["\u306a\u307f\u306e\u308a"]
    assert surf["type"] == "\u307f\u305a"
    assert surf["power"] == 90
    assert surf["category"] == "Special"
    assert surf["class"] == "two_fold"
    assert surf["target"] == 2
