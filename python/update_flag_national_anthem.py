#!/usr/bin/env python3
import json
import csv
from pathlib import Path


def update_symbols():
    csv_path = Path('data/countries.csv')
    symbols_base = Path('data/symbols')
    json_base = Path('public/json')

    # Read CSV to get country mappings
    countries = []
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        countries = list(reader)

    updated = 0
    skipped = 0
    errors = 0

    print("=" * 80)
    print("UPDATING FLAG, NATIONAL ANTHEM, ANIMAL AND BIRD ATTRIBUTES")
    print("=" * 80)

    for country_info in countries:
        country_name = country_info['country']
        slug = country_info['slug']
        continent = country_info['continent']

        # Path to symbols file
        symbols_file = symbols_base / f"{country_name}-symbols.json"

        # Skip if symbols file doesn't exist
        if not symbols_file.exists():
            skipped += 1
            continue

        # Path to country JSON file
        country_json_file = json_base / continent / f"{slug}.json"

        if not country_json_file.exists():
            print(f"⚠ Warning: Country JSON not found at {country_json_file}")
            errors += 1
            continue

        try:
            # Read symbols data
            with open(symbols_file) as f:
                symbols_data = json.load(f)

            # Read country JSON
            with open(country_json_file) as f:
                country_data = json.load(f)

            # Update with symbols data
            country_data['flag'] = symbols_data.get('flag')
            country_data['national_anthem'] = symbols_data.get('national_anthem')
            country_data['national_anthem_url'] = symbols_data.get('national_anthem_url')
            country_data['national_animal'] = symbols_data.get('national_animal')
            country_data['national_bird'] = symbols_data.get('national_bird')

            # Write back
            with open(country_json_file, 'w') as f:
                json.dump(country_data, f, indent=2)

            print(f"✓ Updated {country_name}")
            updated += 1

        except Exception as e:
            print(f"✗ Error processing {country_name}: {e}")
            errors += 1

    print("\n" + "=" * 80)
    print(f"SUMMARY:")
    print(f"  Updated: {updated}")
    print(f"  Skipped: {skipped} (no symbols file)")
    print(f"  Errors: {errors}")
    print("=" * 80)


if __name__ == '__main__':
    update_symbols()
