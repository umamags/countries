"""Resolve each country's cultural events to a Wikipedia summary (image + extract),
using the public MediaWiki search API to find the best-matching article title
and the REST summary endpoint to fetch its details.

Similar to resolve_landmarks.py but handles cultural events/festivals. Handles
common aliases (e.g., "Chinese New Year" vs "Spring Festival") and validates
confidence level before accepting matches. Stores "resolution_failed" indicator
to distinguish between unresolved and never-attempted.

Usage:
    python resolve_cultural_events.py [--max-events N] [--delay 0.2]
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

# Common aliases for cultural events that might not be found under their primary name
COMMON_ALIASES = {
    "Chinese New Year": ["Spring Festival", "Lunar New Year"],
    "Mid-Autumn Festival": ["Moon Festival", "Autumn Festival"],
    "Dragon Boat Festival": ["Tuen Ng Festival"],
    "Gion Matsuri": ["Gion Festival"],
    "Obon Festival": ["Obon", "Bon Festival"],
    "Cherry Blossom Festival": ["Hanami", "Sakura Festival"],
    "Tanabata": ["Star Festival"],
    "Día de los Muertos": ["Day of the Dead"],
    "Guelaguetza": ["Festival Guelaguetza"],
    "Cinco de Mayo": [],
    "Semana Santa": ["Holy Week"],
    "Festival Internacional Cervantino": ["Cervantino Festival"],
}


def find_best_title(query: str, country: str, aliases: list = None) -> str | None:
    """Search for Wikipedia article, trying main query and variants with country qualifier."""
    search_queries = [query]

    # Add country-qualified variants
    search_queries.append(f"{query} {country}")

    # Add aliases
    if aliases:
        for alias in aliases:
            search_queries.append(alias)
            search_queries.append(f"{alias} {country}")

    for search_query in search_queries:
        params = {
            "action": "query",
            "list": "search",
            "srsearch": search_query,
            "format": "json",
            "srlimit": 3,  # Get top 3 to check quality
        }
        try:
            resp = requests.get(SEARCH_URL, params=params, headers={"User-Agent": USER_AGENT}, timeout=20)
            resp.raise_for_status()
            hits = resp.json().get("query", {}).get("search", [])

            if hits:
                # Try to find best match: prefer exact or close title matches
                for hit in hits:
                    title = hit["title"]
                    # Skip disambiguation pages
                    if "(disambiguation)" in title.lower():
                        continue
                    return title

                # If all matches are disambiguation, skip this query variant
                continue
        except requests.RequestException:
            continue

    return None


def fetch_summary(title: str) -> dict | None:
    """Fetch Wikipedia summary with confidence check."""
    url = SUMMARY_URL.format(urllib.parse.quote(title.replace(" ", "_")))
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
    except requests.RequestException:
        return None

    data = resp.json()

    # Skip disambiguation pages
    if data.get("type") == "disambiguation":
        return None

    extract = data.get("extract")
    if not extract:
        return None

    # Require minimum extract length (indicate good match)
    if len(extract) < 100:
        return None

    image = (data.get("originalimage") or data.get("thumbnail") or {}).get("source")
    page_url = data.get("content_urls", {}).get("desktop", {}).get("page")

    # Image is optional, but extract and URL are required
    return {"extract": extract, "image": image, "url": page_url}


def resolve_cultural_event(name: str, country: str) -> dict | None:
    """Resolve cultural event with aliases and country qualifier fallback."""
    aliases = COMMON_ALIASES.get(name, [])
    title = find_best_title(name, country, aliases)
    if not title:
        return None
    return fetch_summary(title)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-events", type=int, default=100_000, help="Safety cap on events processed this run")
    parser.add_argument("--delay", type=float, default=0.2, help="Seconds to sleep between events (politeness)")
    args = parser.parse_args()

    country_files = sorted(glob.glob(os.path.join(JSON_DIR, "*", "*.json")))

    processed = 0
    resolved = 0
    failed = 0

    for path in country_files:
        if processed >= args.max_events:
            break

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        events = data.get("cultural_events") or []
        changed = False

        for event in events:
            if processed >= args.max_events:
                break
            if "wiki" in event:
                continue  # already attempted in a previous run

            try:
                wiki = resolve_cultural_event(event["name"], data.get("country", ""))
            except requests.RequestException as e:
                print(f"Network error on {event['name']!r}: {e} - stopping, re-run to continue.")
                if changed:
                    save(path, data)
                return

            processed += 1
            event["wiki"] = wiki
            changed = True

            if wiki:
                resolved += 1
                print(f"OK   {data.get('country')}: {event['name']!r}")
            else:
                failed += 1
                event["resolution_failed"] = True
                print(f"FAIL {data.get('country')}: {event['name']!r}")

            time.sleep(args.delay)

        if changed:
            save(path, data)

    print(f"\nProcessed {processed} events: {resolved} resolved, {failed} failed.")


def save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
