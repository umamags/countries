"""Option-A pilot enrichment: add a `cities` array and per-landmark
`wiki.coordinates` to a small, explicit set of country JSON files, so their
country-page map can plot city + landmark pins instead of just a silhouette.

This is deliberately NOT a full 195-country pipeline - it's scoped to the
pilot countries passed on the command line, with a hand-picked city list per
country (major cities aren't derivable from anything already in the repo,
and standing up a full Natural Earth "populated places" layer isn't
justified for a 3-country pilot). Coordinates for both cities and landmarks
come from the same Wikipedia summary API already used by resolve_landmarks.py.

Usage:
    python add_map_pins.py
"""

import glob
import json
import os
import time
import urllib.parse

import requests

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_DIR = os.path.join(ROOT_DIR, "public", "json")
SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"
USER_AGENT = "CountriesExplorer/1.0 (personal hobby project; contact: umamags@gmail.com)"

# country name -> [(city name, is_capital), ...], major cities picked by hand
PILOT_CITIES = {
    "United States of America": [
        ("Washington, D.C.", True),
        ("New York City", False),
        ("Los Angeles", False),
        ("Chicago", False),
        ("Houston", False),
    ],
    "Germany": [
        ("Berlin", True),
        ("Munich", False),
        ("Hamburg", False),
        ("Cologne", False),
        ("Frankfurt", False),
    ],
    "France": [
        ("Paris", True),
        ("Marseille", False),
        ("Lyon", False),
        ("Toulouse", False),
        ("Nice", False),
    ],
}


def fetch_coordinates(title: str) -> dict | None:
    url = SUMMARY_URL.format(urllib.parse.quote(title.replace(" ", "_")))
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    coords = resp.json().get("coordinates")
    return {"lat": coords["lat"], "lon": coords["lon"]} if coords else None


def find_country_file(country_name: str) -> str | None:
    for path in glob.glob(os.path.join(JSON_DIR, "*", "*.json")):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("country") == country_name:
            return path
    return None


def add_cities(data: dict, country_name: str) -> None:
    cities = []
    for city_name, is_capital in PILOT_CITIES[country_name]:
        coords = fetch_coordinates(city_name)
        if coords:
            cities.append({"name": city_name, "capital": is_capital, **coords})
            print(f"  city OK   {city_name} -> {coords}")
        else:
            print(f"  city MISS {city_name}")
        time.sleep(0.2)
    data["cities"] = cities


def add_landmark_coordinates(data: dict) -> None:
    for landmark in data.get("landmarks") or []:
        wiki = landmark.get("wiki")
        if not wiki or not wiki.get("url"):
            continue
        if "coordinates" in wiki:
            continue  # already done
        title = urllib.parse.unquote(wiki["url"].rsplit("/", 1)[-1])
        coords = fetch_coordinates(title)
        wiki["coordinates"] = coords
        print(f"  landmark {'OK  ' if coords else 'MISS'} {landmark['name']} -> {coords}")
        time.sleep(0.2)


def main():
    for country_name in PILOT_CITIES:
        path = find_country_file(country_name)
        if not path:
            print(f"Could not find JSON file for {country_name!r}, skipping.")
            continue

        print(f"{country_name} ({path}):")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        add_cities(data, country_name)
        add_landmark_coordinates(data)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  wrote {path}\n")


if __name__ == "__main__":
    main()
