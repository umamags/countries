#!/usr/bin/env python3
import json
import csv
from pathlib import Path


def add_news_and_currency():
    # Paths
    csv_path = Path('data/countries.csv')
    news_base = Path('data/news')
    json_base = Path('public/json')

    # Read CSV
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        countries = list(reader)

    # Countries that have profile data
    profile_countries = {'China', 'Germany', 'India', 'Japan', 'United States of America'}

    updated = 0
    skipped = 0

    for country_info in countries:
        country_name = country_info['country']
        slug = country_info['slug']
        continent = country_info['continent']

        # Skip if not in the 5 countries with profile data
        if country_name not in profile_countries:
            skipped += 1
            continue

        # Path to profile file
        profile_file = news_base / f"{country_name}-profile.json"

        if not profile_file.exists():
            print(f"⚠ Warning: Profile file not found for {country_name}")
            continue

        # Path to country JSON file
        country_json_file = json_base / continent / f"{slug}.json"

        if not country_json_file.exists():
            print(f"⚠ Warning: Country JSON not found at {country_json_file}")
            continue

        try:
            # Read profile data
            with open(profile_file) as f:
                profile_data = json.load(f)

            # Read country JSON
            with open(country_json_file) as f:
                country_data = json.load(f)

            # Check if economics section exists
            if 'economics' not in country_data:
                print(f"⚠ Warning: No economics section in {country_name}")
                continue

            economics = country_data['economics']
            profile_years = {item['year']: item for item in profile_data.get('data', [])}

            # Update economics with profile data
            for econ_entry in economics:
                year = econ_entry['year']
                if year in profile_years:
                    profile_entry = profile_years[year]

                    # Add population
                    if 'population' in profile_entry:
                        econ_entry['population'] = profile_entry['population']

                    # Add exchange rate (convert from fx_lcu_per_usd to exchange_rate_usd)
                    if 'fx_lcu_per_usd_annual_avg' in profile_entry:
                        econ_entry['exchange_rate_usd'] = profile_entry['fx_lcu_per_usd_annual_avg']

                    # Add main events
                    if 'geopolitical_news' in profile_entry:
                        econ_entry['main_events'] = profile_entry['geopolitical_news']

            # Write back
            with open(country_json_file, 'w') as f:
                json.dump(country_data, f, indent=2)

            print(f"✓ Updated {country_name}")
            updated += 1

        except Exception as e:
            print(f"✗ Error processing {country_name}: {e}")

    print(f"\nSummary: Updated {updated}, Skipped {skipped}")


if __name__ == '__main__':
    add_news_and_currency()
