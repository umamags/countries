#!/usr/bin/env python3
import json
import csv
from pathlib import Path


def update_commentaries():
    csv_path = Path('data/countries.csv')
    commentaries_base = Path('data/commentaries')
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
    print("UPDATING COMMENTARY SECTIONS")
    print("=" * 80)

    for country_info in countries:
        country_name = country_info['country']
        slug = country_info['slug']
        continent = country_info['continent']

        # Path to commentary file
        commentary_file = commentaries_base / f"{country_name}-commentary.json"

        # Skip if commentary file doesn't exist
        if not commentary_file.exists():
            skipped += 1
            continue

        # Path to country JSON file
        country_json_file = json_base / continent / f"{slug}.json"

        if not country_json_file.exists():
            print(f"⚠ Warning: Country JSON not found at {country_json_file}")
            errors += 1
            continue

        try:
            # Read commentary data
            with open(commentary_file) as f:
                commentary_data = json.load(f)

            # Read country JSON
            with open(country_json_file) as f:
                country_data = json.load(f)

            # Update with commentary data
            country_data['commentary'] = {
                'inflation_management': commentary_data.get('inflation_management'),
                'debt_management': commentary_data.get('debt_management'),
                'key_events': commentary_data.get('key_events'),
                'outlook_next_decade': commentary_data.get('outlook_next_decade'),
                'caveat': commentary_data.get('caveat'),
            }

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
    print(f"  Skipped: {skipped} (no commentary file)")
    print(f"  Errors: {errors}")
    print("=" * 80)


if __name__ == '__main__':
    update_commentaries()
