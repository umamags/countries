"""Resolve each country's landmarks to a Wikipedia summary (image + extract),
using the public MediaWiki search API to find the best-matching article title
and the REST summary endpoint to fetch its details.

Unlike resolve_youtube_links.py, there's no daily quota here - Wikipedia's API
is free and unauthenticated (just a descriptive User-Agent is required), so
this can run end-to-end in one sitting. It's still resumable/idempotent
(skips landmarks that already carry a "wiki" key, even if resolution failed
and the key is null) in case a run is interrupted.

Usage:
    python resolve_landmarks.py [--max-landmarks N] [--delay 0.2]
"""

import argparse
import glob
import json
import os
import time
import urllib.parse

import requests

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_DIR = os.path.join(ROOT_DIR, "public", "json")
SEARCH_URL = "https://en.wikipedia.org/w/api.php"
SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"
USER_AGENT = "CountriesExplorer/1.0 (personal hobby project; contact: umamags@gmail.com)"


def find_best_title(query: str) -> str | None:
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "format": "json",
        "srlimit": 1,
    }
    resp = requests.get(SEARCH_URL, params=params, headers={"User-Agent": USER_AGENT}, timeout=20)
    resp.raise_for_status()
    hits = resp.json().get("query", {}).get("search", [])
    return hits[0]["title"] if hits else None


def fetch_summary(title: str) -> dict | None:
    url = SUMMARY_URL.format(urllib.parse.quote(title.replace(" ", "_")))
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()
    if data.get("type") == "disambiguation":
        return None
    extract = data.get("extract")
    if not extract:
        return None
    image = (data.get("originalimage") or data.get("thumbnail") or {}).get("source")
    page_url = data.get("content_urls", {}).get("desktop", {}).get("page")
    return {"extract": extract, "image": image, "url": page_url}


def resolve_landmark(name: str, country: str) -> dict | None:
    title = find_best_title(f"{name} {country}")
    if not title:
        return None
    return fetch_summary(title)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-landmarks", type=int, default=100_000, help="Safety cap on landmarks processed this run")
    parser.add_argument("--delay", type=float, default=0.2, help="Seconds to sleep between landmarks (politeness)")
    args = parser.parse_args()

    country_files = sorted(glob.glob(os.path.join(JSON_DIR, "*", "*.json")))

    processed = 0
    resolved = 0

    for path in country_files:
        if processed >= args.max_landmarks:
            break

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        landmarks = data.get("landmarks") or []
        changed = False

        for landmark in landmarks:
            if processed >= args.max_landmarks:
                break
            if "wiki" in landmark:
                continue  # already attempted in a previous run

            try:
                wiki = resolve_landmark(landmark["name"], data.get("country", ""))
            except requests.RequestException as e:
                print(f"Network error on {landmark['name']!r}: {e} - stopping, re-run to continue.")
                if changed:
                    save(path, data)
                return

            processed += 1
            landmark["wiki"] = wiki
            changed = True
            if wiki:
                resolved += 1
            print(f"{'OK  ' if wiki else 'MISS'} {data.get('country')}: {landmark['name']!r}")
            time.sleep(args.delay)

        if changed:
            save(path, data)

    print(f"\nProcessed {processed} landmarks, resolved {resolved} with image+extract.")


def save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
