"""Add `wiki.coordinates` to every already-resolved landmark across all
countries (resolve_landmarks.py already found each landmark's canonical
Wikipedia title - this just fetches its coordinates, skipping the search
step since the title is already known).

Was originally scoped to 3 pilot countries in add_map_pins.py; this is that
same lookup generalized to every country, so every country's fallback
vector map can show landmark pins, not just the pilot's.

No quota, resumable (skips landmarks that already have a coordinates key,
even if null).

Usage:
    python add_landmark_coordinates.py
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


def fetch_coordinates(title: str) -> dict | None:
    url = SUMMARY_URL.format(urllib.parse.quote(title.replace(" ", "_")))
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    coords = resp.json().get("coordinates")
    return {"lat": coords["lat"], "lon": coords["lon"]} if coords else None


def main():
    country_files = sorted(glob.glob(os.path.join(JSON_DIR, "*", "*.json")))

    processed = 0
    resolved = 0

    for path in country_files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        changed = False
        for landmark in data.get("landmarks") or []:
            wiki = landmark.get("wiki")
            if not wiki or not wiki.get("url"):
                continue
            if "coordinates" in wiki:
                continue

            title = urllib.parse.unquote(wiki["url"].rsplit("/", 1)[-1])
            try:
                coords = fetch_coordinates(title)
            except requests.RequestException as e:
                print(f"Network error on {landmark['name']!r}: {e} - stopping, re-run to continue.")
                if changed:
                    save(path, data)
                return

            wiki["coordinates"] = coords
            processed += 1
            changed = True
            if coords:
                resolved += 1
            print(f"{'OK  ' if coords else 'MISS'} {data.get('country')}: {landmark['name']}")
            time.sleep(0.15)

        if changed:
            save(path, data)

    print(f"\nProcessed {processed} landmarks, resolved {resolved} coordinates.")


def save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
