"""Resolve the AI-suggested video titles in each country's JSON file to real
YouTube videos, using the YouTube Data API v3 `search` endpoint.

`five_youtube_video_titles` currently holds invented title strings (see
getCountryData.py) - there was never a real link behind them. This script
looks up the top 2 titles per country (to stay within the free API quota:
100 units/day = 100 searches/day) and rewrites each resolved entry in place
from a plain string to `{"title": ..., "video_id": ... | null}`.

Already-resolved entries (dict form) are skipped, so the script is safe to
re-run across multiple days as the daily quota resets - it always picks up
where it left off. If the API reports quota exhaustion, the script stops
immediately without marking anything as attempted.

Usage:
    export YOUTUBE_API_KEY=...
    python resolve_youtube_links.py [--max-calls 90] [--top-n 2]
"""

import argparse
import glob
import json
import os
import sys
import time

import requests

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_DIR = os.path.join(ROOT_DIR, "public", "json")
SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


def search_video_id(api_key: str, query: str) -> str | None:
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 1,
        "key": api_key,
    }
    resp = requests.get(SEARCH_URL, params=params, timeout=10)
    if resp.status_code == 403:
        raise RuntimeError(f"Quota/permission error from YouTube API: {resp.text[:300]}")
    resp.raise_for_status()
    items = resp.json().get("items", [])
    return items[0]["id"]["videoId"] if items else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--top-n", type=int, default=2, help="Titles per country to resolve (default: 2)")
    parser.add_argument("--max-calls", type=int, default=90, help="Stop after this many API calls this run (default: 90, under the 100/day free quota)")
    args = parser.parse_args()

    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        print("Set the YOUTUBE_API_KEY environment variable first.", file=sys.stderr)
        sys.exit(1)

    country_files = sorted(glob.glob(os.path.join(JSON_DIR, "*", "*.json")))

    calls_made = 0
    resolved = 0
    skipped_quota_hit = False

    for path in country_files:
        if calls_made >= args.max_calls:
            break

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        titles = data.get("five_youtube_video_titles") or []
        changed = False

        for i, item in enumerate(titles):
            if i >= args.top_n:
                break
            if isinstance(item, dict):
                continue  # already attempted in a previous run
            if calls_made >= args.max_calls:
                break

            query = f"{item} {data.get('country', '')}"
            try:
                video_id = search_video_id(api_key, query)
            except RuntimeError as e:
                print(f"Stopping: {e}")
                skipped_quota_hit = True
                break

            calls_made += 1
            titles[i] = {"title": item, "video_id": video_id}
            changed = True
            if video_id:
                resolved += 1
            print(f"{'OK ' if video_id else 'MISS'} {data.get('country')}: {item!r} -> {video_id}")
            time.sleep(0.1)

        if changed:
            data["five_youtube_video_titles"] = titles
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        if skipped_quota_hit:
            break

    print(f"\nMade {calls_made} API calls, resolved {resolved} real video links.")
    if skipped_quota_hit:
        print("Stopped early due to a quota/permission error - re-run tomorrow to continue.")
    elif calls_made >= args.max_calls:
        print("Hit --max-calls for this run - re-run to continue with the next batch.")
    else:
        print("All countries processed.")


if __name__ == "__main__":
    main()
