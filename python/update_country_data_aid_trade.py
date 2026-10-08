#!/usr/bin/env python3
"""
Update country data in public/json from data/aid and data/trade.
Uses data/countries.csv for country-to-slug-continent mapping.
"""

import json
import csv
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

def load_countries_mapping(csv_path: str) -> Dict[str, Tuple[str, str]]:
    """Load countries.csv into a dict: country_name -> (slug, continent)"""
    mapping = {}
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            country = row['country']
            slug = row['slug']
            continent = row['continent']
            mapping[country] = (slug, continent)
    return mapping

def load_country_json(base_path: str, continent: str, slug: str) -> Dict:
    """Load a country JSON file. Return empty dict if not found."""
    file_path = os.path.join(base_path, continent, f"{slug}.json")
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return {}

def save_country_json(base_path: str, continent: str, slug: str, data: Dict) -> None:
    """Save a country JSON file."""
    dir_path = os.path.join(base_path, continent)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, f"{slug}.json")
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  ✓ Saved {file_path}")

def merge_aid_data(country_data: Dict, aid_file_path: str) -> Dict:
    """Merge aid data from file into country data."""
    with open(aid_file_path, 'r') as f:
        aid_file = json.load(f)

    # Initialize aid array if it doesn't exist
    if 'aid' not in country_data:
        country_data['aid'] = []

    # Get existing years in aid array for easy lookup
    existing_years = {item['year']: idx for idx, item in enumerate(country_data['aid'])}

    # Merge in aid data
    for aid_entry in aid_file.get('data', []):
        year = aid_entry['year']
        if year in existing_years:
            # Replace existing entry for this year
            country_data['aid'][existing_years[year]] = aid_entry
        else:
            # Add new entry
            country_data['aid'].append(aid_entry)

    # Sort by year
    country_data['aid'].sort(key=lambda x: x['year'])

    return country_data

def merge_trade_data(country_data: Dict, trade_file_path: str) -> Dict:
    """Merge trade data from file into country data."""
    with open(trade_file_path, 'r') as f:
        trade_file = json.load(f)

    # Trade data replaces entirely (it's a snapshot for a specific year)
    # Remove metadata fields and keep just the trade data
    trade_data = {k: v for k, v in trade_file.items() if k != 'country' and k != 'iso3'}
    country_data['trade'] = trade_data

    return country_data

def process_aid_files(base_path: str, aid_dir: str, countries_mapping: Dict) -> None:
    """Process all aid files and merge them into country data."""
    aid_files = Path(aid_dir).glob('*-aid.json')
    skipped = 0
    processed = 0

    for aid_file in sorted(aid_files):
        # Extract country name from filename (e.g., "Malaysia-aid.json" -> "Malaysia")
        country_name = aid_file.stem.replace('-aid', '')

        if country_name not in countries_mapping:
            print(f"⊘ Skipped {aid_file.name}: country '{country_name}' not in countries.csv")
            skipped += 1
            continue

        slug, continent = countries_mapping[country_name]
        print(f"Processing aid: {country_name} ({continent}/{slug})")

        country_data = load_country_json(base_path, continent, slug)
        country_data = merge_aid_data(country_data, str(aid_file))
        save_country_json(base_path, continent, slug, country_data)
        processed += 1

    print(f"\nAid files: {processed} processed, {skipped} skipped")

def process_trade_files(base_path: str, trade_dir: str, countries_mapping: Dict) -> None:
    """Process all trade files and merge them into country data."""
    trade_files = Path(trade_dir).glob('*-trade.json')
    skipped = 0
    processed = 0

    for trade_file in sorted(trade_files):
        # Extract country name from filename (e.g., "France-trade.json" -> "France")
        country_name = trade_file.stem.replace('-trade', '')

        if country_name not in countries_mapping:
            print(f"⊘ Skipped {trade_file.name}: country '{country_name}' not in countries.csv")
            skipped += 1
            continue

        slug, continent = countries_mapping[country_name]
        print(f"Processing trade: {country_name} ({continent}/{slug})")

        country_data = load_country_json(base_path, continent, slug)
        country_data = merge_trade_data(country_data, str(trade_file))
        save_country_json(base_path, continent, slug, country_data)
        processed += 1

    print(f"\nTrade files: {processed} processed, {skipped} skipped")

def main():
    # Set up paths relative to script location
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    countries_csv = repo_root / 'data' / 'countries.csv'
    aid_dir = repo_root / 'data' / 'aid'
    trade_dir = repo_root / 'data' / 'trade'
    output_base = repo_root / 'public' / 'json'

    # Validate inputs exist
    if not countries_csv.exists():
        print(f"Error: {countries_csv} not found")
        sys.exit(1)
    if not aid_dir.exists():
        print(f"Error: {aid_dir} not found")
        sys.exit(1)
    if not trade_dir.exists():
        print(f"Error: {trade_dir} not found")
        sys.exit(1)
    if not output_base.exists():
        print(f"Error: {output_base} not found")
        sys.exit(1)

    print("Loading countries mapping...")
    countries_mapping = load_countries_mapping(str(countries_csv))
    print(f"Loaded {len(countries_mapping)} countries\n")

    print("=" * 60)
    print("PROCESSING AID DATA")
    print("=" * 60)
    process_aid_files(str(output_base), str(aid_dir), countries_mapping)

    print("\n" + "=" * 60)
    print("PROCESSING TRADE DATA")
    print("=" * 60)
    process_trade_files(str(output_base), str(trade_dir), countries_mapping)

    print("\n" + "=" * 60)
    print("Done!")

if __name__ == '__main__':
    main()
