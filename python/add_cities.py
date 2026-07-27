"""Add a `cities` array (top 5 by population, capital always included) to
every country JSON, sourced from Natural Earth's populated-places layer -
the same public-domain source family as the world map's country boundaries.

Unlike the landmark/video enrichment scripts, this needs no API calls: the
whole populated-places dataset is one ~850KB fetch, filtered and matched
locally. Country name matching mirrors the approach already used for the
world map's map_name field - direct match first, then NAME_OVERRIDES for
Natural Earth's own naming quirks. A handful of small island nations
(Nauru, Niue, Cook Islands, Christmas Island, Cocos Islands) have no
populated-places entries at this resolution and are simply left without a
`cities` field - the UI already treats that as "no pins to draw".

Usage:
    python add_cities.py
"""

import glob
import json
import os
import re

import requests

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_DIR = os.path.join(ROOT_DIR, "public", "json")
POPULATED_PLACES_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
    "geojson/ne_50m_populated_places_simple.geojson"
)
USER_AGENT = "CountriesExplorer/1.0 (personal hobby project; contact: umamags@gmail.com)"
CITIES_PER_COUNTRY = 5

NAME_OVERRIDES = {
    "Bahamas": "The Bahamas",
    "Czech Republic": "Czechia",
    "Democratic Republic of the Congo": "Congo (Kinshasa)",
    "Republic of the Congo": "Congo (Brazzaville)",
    "Gambia": "The Gambia",
    "Guinea-Bissau": "Guinea Bissau",
    "Timor-Leste": "East Timor",
    "Vatican City": "Vatican",
    "Eswatini": "eSwatini",
    "Côte d'Ivoire": "Ivory Coast",
}


def load_places_by_country() -> dict:
    resp = requests.get(POPULATED_PLACES_URL, headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()
    features = resp.json()["features"]
    by_country = {}
    for f in features:
        p = f["properties"]
        by_country.setdefault(p["adm0name"], []).append(p)
    return by_country


def pick_cities(places: list) -> list:
    capital = next((p for p in places if p.get("adm0cap") == 1), None)
    ranked = sorted(places, key=lambda p: p.get("pop_max", 0), reverse=True)

    picked = []
    seen_names = set()
    if capital:
        picked.append(capital)
        seen_names.add(capital["name"])
    for p in ranked:
        if len(picked) >= CITIES_PER_COUNTRY:
            break
        if p["name"] in seen_names:
            continue
        picked.append(p)
        seen_names.add(p["name"])

    return [
        {
            # Natural Earth's raw `name` field occasionally has stray double
            # spaces (e.g. "Washington,  D.C."); collapse them for display.
            "name": re.sub(r"\s+", " ", p["name"]).strip(),
            "capital": bool(p.get("adm0cap")),
            "lat": p["latitude"],
            "lon": p["longitude"],
        }
        for p in picked
    ]


def main():
    places_by_country = load_places_by_country()

    matched = 0
    unmatched = []

    for path in sorted(glob.glob(os.path.join(JSON_DIR, "*", "*.json"))):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        country_name = data.get("country", "")
        lookup_name = NAME_OVERRIDES.get(country_name, country_name)
        places = places_by_country.get(lookup_name)

        if not places:
            unmatched.append(country_name)
            continue

        data["cities"] = pick_cities(places)
        matched += 1
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Added cities to {matched} countries.")
    if unmatched:
        print("No populated-places match (left without a cities field):")
        for name in unmatched:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
