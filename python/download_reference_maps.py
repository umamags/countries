"""Download a CIA World Factbook reference map for every country and store
it locally under public/maps/countries/<Continent>/<slug>.<ext>, recording
{image, source_url, attribution, license} as `reference_map` in that
country's JSON.

CIA WFB maps were chosen as the *only* source (not a general Commons
search) because they cover nearly every country/territory in one visually
consistent, uniformly public-domain series - see the pilot analysis. A
country with no confident CIA WFB match is simply left without a
reference_map; CountryDetailPage already falls back to the vector map with
city/landmark pins when that field is absent, so no frontend change is
needed for the fallback itself.

Resumable: skips any country whose JSON already has a reference_map (with
its image file present on disk).

Usage:
    python download_reference_maps.py [--max-countries N]
"""

import argparse
import glob
import json
import os
import re
import time
import urllib.parse

import requests

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_DIR = os.path.join(ROOT_DIR, "public", "json")
MAPS_DIR = os.path.join(ROOT_DIR, "public", "maps", "countries")
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "CountriesExplorer/1.0 (personal hobby project; contact: umamags@gmail.com)"
MAX_BYTES = 2_000_000

# Words too generic to carry any matching signal on their own.
STOPWORDS = {"the", "of", "and"}


def search_candidates(country_name: str) -> list:
    params = {
        "action": "query",
        "list": "search",
        "srsearch": f"{country_name} CIA World Factbook map",
        "srnamespace": 6,
        "srlimit": 10,
        "format": "json",
    }
    resp = requests.get(COMMONS_API, params=params, headers={"User-Agent": USER_AGENT}, timeout=20)
    resp.raise_for_status()
    hits = resp.json().get("query", {}).get("search", [])

    name_words = {w.lower() for w in re.findall(r"[A-Za-z]+", country_name)} - STOPWORDS
    # A single generic word overlapping (e.g. just "America" out of "United
    # States of America") isn't enough signal - it matched a Central America
    # regional map once. Require 2 words when the name has that many.
    required_overlap = min(2, len(name_words)) if name_words else 0

    candidates = []
    for hit in hits:
        title = hit["title"]
        title_words = {w.lower() for w in re.findall(r"[A-Za-z]+", title)}
        if len(name_words & title_words) < required_overlap:
            continue
        candidates.append(title)
    return candidates


def fetch_imageinfo(file_title: str) -> dict | None:
    params = {
        "action": "query",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "format": "json",
    }
    resp = requests.get(COMMONS_API, params=params, headers={"User-Agent": USER_AGENT}, timeout=20)
    resp.raise_for_status()
    pages = resp.json().get("query", {}).get("pages", {})
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        return info
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-countries", type=int, default=1000)
    args = parser.parse_args()

    processed = 0
    resolved = 0
    unmatched = []

    for path in sorted(glob.glob(os.path.join(JSON_DIR, "*", "*.json"))):
        if processed >= args.max_countries:
            break

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        continent_folder = os.path.basename(os.path.dirname(path))
        slug = os.path.splitext(os.path.basename(path))[0]
        country_name = data.get("country", "")

        out_dir = os.path.join(MAPS_DIR, continent_folder)
        existing = glob.glob(os.path.join(out_dir, f"{slug}.*"))
        if data.get("reference_map") and existing:
            continue  # already resolved in a previous run

        processed += 1
        try:
            title = None
            info = None
            for candidate in search_candidates(country_name):
                candidate_info = fetch_imageinfo(candidate)
                if not candidate_info or not candidate_info.get("url"):
                    continue
                meta = candidate_info.get("extmetadata", {})
                credit = meta.get("Credit", {}).get("value", "")
                desc = meta.get("ImageDescription", {}).get("value", "")
                # Require actual confirmation this is a Factbook map, not just
                # a title-word coincidence (a stale redirect once sent a
                # plausible-looking title to an unrelated generic map file).
                if "factbook" not in (credit + desc).lower():
                    continue
                title, info = candidate, candidate_info
                break

            if not title:
                print(f"MISS  {country_name}: no confirmed CIA WFB match")
                unmatched.append(country_name)
                continue

            image_url = info["url"]
            size = info.get("size", 0)
            if size and size > MAX_BYTES:
                print(f"MISS  {country_name}: {title!r} too large ({size} bytes)")
                unmatched.append(country_name)
                continue

            ext = os.path.splitext(urllib.parse.urlparse(image_url).path)[1] or ".png"
            img_resp = requests.get(image_url, headers={"User-Agent": USER_AGENT}, timeout=30)
            img_resp.raise_for_status()

            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f"{slug}{ext}")
            with open(out_path, "wb") as f:
                f.write(img_resp.content)

            meta = info.get("extmetadata", {})
            license_name = meta.get("LicenseShortName", {}).get("value", "Public domain")
            file_page = f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"

            data["reference_map"] = {
                "image": f"maps/countries/{continent_folder}/{slug}{ext}",
                "source_url": file_page,
                "attribution": "CIA, The World Factbook",
                "license": license_name,
            }
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            resolved += 1
            print(f"OK    {country_name}: {title!r} ({len(img_resp.content)} bytes)")
        except requests.RequestException as e:
            print(f"ERROR {country_name}: {e}")
            unmatched.append(country_name)

        time.sleep(0.2)

    print(f"\nProcessed {processed} countries, resolved {resolved} reference maps.")
    if unmatched:
        print(f"{len(unmatched)} countries fall back to the vector map:")
        for name in unmatched:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
