#!/usr/bin/env python3
import json
import csv
from pathlib import Path


def add_economics():
    # Paths
    csv_path = Path('data/countries.csv')
    economics_base = Path('data/economics')
    json_base = Path('public/json')

    # Read CSV
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        countries = list(reader)

    added = 0
    skipped = 0

    for country_info in countries:
        country_name = country_info['country']
        slug = country_info['slug']
        continent = country_info['continent']

        # Path to economics file
        economics_file = economics_base / continent / f"{country_name}-economics.json"

        if not economics_file.exists():
            skipped += 1
            continue

        # Path to country JSON file
        country_json_file = json_base / continent / f"{slug}.json"

        if not country_json_file.exists():
            print(f"Warning: {country_name} JSON not found at {country_json_file}")
            continue

        try:
            # Read economics data
            with open(economics_file) as f:
                economics_data = json.load(f)

            # Read country JSON
            with open(country_json_file) as f:
                country_data = json.load(f)

            # Add economics data array to the end
            country_data['economics'] = economics_data.get('data', [])

            # Write back
            with open(country_json_file, 'w') as f:
                json.dump(country_data, f, indent=2)

            print(f"Added economics to {country_name}")
            added += 1

        except Exception as e:
            print(f"Error processing {country_name}: {e}")

    print(f"\nSummary: Added {added}, Skipped {skipped}")


if __name__ == '__main__':
    add_economics()
