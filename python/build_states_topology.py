"""Build the states/provinces TopoJSON used by StateMap.jsx.

mapshaper is the tool actually doing the work here (filtering, Douglas-
Peucker simplification, and shared-arc TopoJSON construction) - it's a
Node.js CLI, not a Python library, and there's no validated pure-Python
equivalent (the `topojson` PyPI package exists but wasn't the one used to
produce the currently-shipped public/maps/states-pilot.json, so swapping to
it would risk different output). This script just orchestrates the exact
mapshaper invocation used to build that file, via `npx mapshaper`, so the
pipeline is reproducible and runnable from the same `python/` workflow as
the rest of the data scripts.

Requires Node/npm (for `npx`) - nothing else. The 10m source file is ~40MB
and is cached locally after the first run so repeat invocations don't
re-download it.

Usage:
    # Regenerate the exact pilot (India, France, Egypt, Chile, New Zealand):
    python build_states_topology.py

    # A different set of countries:
    python build_states_topology.py --countries "Japan,Germany,Brazil"

    # Every country Natural Earth has admin-1 data for (~1.9MB output,
    # 253 countries/territories - see the impact-analysis numbers from the
    # chat log for match-rate details against this app's own country list):
    python build_states_topology.py --all

    # Custom simplification level (mapshaper -simplify percentage) or output path:
    python build_states_topology.py --simplify 15% --output ../public/maps/states-pilot.json
"""

import argparse
import json
import os
import subprocess

import requests

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache", "ne_10m_admin_1.geojson")
SOURCE_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
    "geojson/ne_10m_admin_1_states_provinces.geojson"
)
DEFAULT_OUTPUT = os.path.join(ROOT_DIR, "public", "maps", "states-pilot.json")
DEFAULT_COUNTRIES = ["India", "France", "Egypt", "Chile", "New Zealand"]
KEPT_FIELDS = "admin,name,name_local,iso_3166_2,type"


def ensure_source_file() -> str:
    if os.path.exists(CACHE_PATH):
        print(f"Using cached source: {CACHE_PATH}")
        return CACHE_PATH

    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    print(f"Downloading {SOURCE_URL} (~40MB, one-time)...")
    resp = requests.get(SOURCE_URL, timeout=120)
    resp.raise_for_status()
    with open(CACHE_PATH, "wb") as f:
        f.write(resp.content)
    print(f"Cached to {CACHE_PATH}")
    return CACHE_PATH


def run_mapshaper(source_path: str, countries: list, simplify_pct: str, output_path: str):
    cmd = ["npx", "--yes", "mapshaper", source_path]

    if countries:
        clauses = " || ".join(f"admin=='{c}'" for c in countries)
        cmd += ["-filter", clauses]

    cmd += ["-simplify", "dp", simplify_pct, "keep-shapes"]
    cmd += ["-filter-fields", KEPT_FIELDS]
    cmd += ["-o", "format=topojson", output_path]

    print("Running:", " ".join(cmd))
    subprocess.run(cmd, check=True)


def summarize(output_path: str):
    with open(output_path, "r", encoding="utf-8") as f:
        topo = json.load(f)
    object_name = next(iter(topo["objects"]))
    geometries = topo["objects"][object_name]["geometries"]
    countries = sorted({g["properties"]["admin"] for g in geometries if g["properties"].get("admin")})
    size_kb = os.path.getsize(output_path) / 1024
    print(f"\nWrote {output_path} ({size_kb:.0f} KB)")
    print(f"{len(geometries)} regions across {len(countries)} countries:")
    for c in countries:
        count = sum(1 for g in geometries if g["properties"]["admin"] == c)
        print(f"  {c}: {count}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--countries", help="Comma-separated country names (matching the 'admin' field)")
    parser.add_argument("--all", action="store_true", help="Include every country in the source data (~1.9MB output)")
    parser.add_argument("--simplify", default="10%", help="mapshaper -simplify dp percentage (default: 10%%)")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output path (default: {DEFAULT_OUTPUT})")
    args = parser.parse_args()

    if args.all:
        countries = []
    elif args.countries:
        countries = [c.strip() for c in args.countries.split(",")]
    else:
        countries = DEFAULT_COUNTRIES

    source_path = ensure_source_file()
    run_mapshaper(source_path, countries, args.simplify, args.output)
    summarize(args.output)


if __name__ == "__main__":
    main()
