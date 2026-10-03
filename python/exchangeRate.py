#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def check_exchange_rates():
    json_base = Path('public/json')

    has_exchange_rate = []
    missing_exchange_rate = []
    null_2025_exchange_rate = []

    # Iterate through all continents
    for continent_dir in json_base.iterdir():
        if not continent_dir.is_dir() or continent_dir.name == 'maps':
            continue

        continent = continent_dir.name

        # Iterate through all country JSON files
        for country_file in continent_dir.glob('*.json'):
            try:
                with open(country_file) as f:
                    country_data = json.load(f)

                country_name = country_data.get('country', country_file.stem)

                # Check if exchange_rate_usd exists in economics data at all
                has_rate_anywhere = False
                if 'economics' in country_data:
                    for year_data in country_data['economics']:
                        if 'exchange_rate_usd' in year_data:
                            has_rate_anywhere = True
                            break

                if not has_rate_anywhere:
                    # No exchange_rate_usd field found
                    missing_exchange_rate.append(f"{country_name} ({continent})")
                else:
                    # Check if 2025 has exchange_rate_usd
                    economics = country_data.get('economics', [])
                    latest_year = economics[-1] if economics else None

                    if latest_year and latest_year.get('year') == 2025:
                        rate_2025 = latest_year.get('exchange_rate_usd')
                        if rate_2025 is None:
                            null_2025_exchange_rate.append(f"{country_name} ({continent})")
                        else:
                            has_exchange_rate.append(f"{country_name} ({continent})")
                    else:
                        has_exchange_rate.append(f"{country_name} ({continent})")

            except Exception as e:
                print(f"Error reading {country_file}: {e}")

    # Display results
    print("=" * 80)
    print(f"EXCHANGE RATE AVAILABILITY CHECK")
    print("=" * 80)

    print(f"\n✓ Countries WITH exchange_rate_usd (2025): {len(has_exchange_rate)}")
    print(f"⚠ Countries WITH NULL exchange_rate_usd (2025): {len(null_2025_exchange_rate)}")
    print(f"✗ Countries WITHOUT exchange_rate_usd at all: {len(missing_exchange_rate)}")

    if null_2025_exchange_rate:
        print("\n" + "=" * 80)
        print("COUNTRIES WITH NULL EXCHANGE RATE IN 2025:")
        print("=" * 80)
        for country in sorted(null_2025_exchange_rate):
            print(f"  • {country}")

    if missing_exchange_rate:
        print("\n" + "=" * 80)
        print("COUNTRIES MISSING EXCHANGE RATE DATA COMPLETELY:")
        print("=" * 80)
        for country in sorted(missing_exchange_rate):
            print(f"  • {country}")

    if not null_2025_exchange_rate and not missing_exchange_rate:
        print("\n✓ All countries have exchange rate data for 2025!")

    print("\n" + "=" * 80)
    total_missing = len(null_2025_exchange_rate) + len(missing_exchange_rate)
    print(f"SUMMARY: {total_missing} countries missing or null exchange_rate_usd")
    print(f"  - {len(null_2025_exchange_rate)} with NULL in 2025")
    print(f"  - {len(missing_exchange_rate)} missing completely")
    print("=" * 80)


def update_exchange_rates():
    exchange_rates_base = Path('data/exchange_rates')
    json_base = Path('public/json')

    if not exchange_rates_base.exists():
        print(f"Error: {exchange_rates_base} directory not found")
        return

    updated = 0
    skipped = 0
    errors = 0

    # Load exchange rate data from exchange_rates folder
    exchange_rate_data = {}
    for profile_file in exchange_rates_base.glob('*-profile.json'):
        try:
            with open(profile_file) as f:
                data = json.load(f)
            country_name = data.get('country')
            if country_name:
                exchange_rate_data[country_name] = data.get('data', [])
        except Exception as e:
            print(f"Error reading {profile_file}: {e}")

    print("=" * 80)
    print("UPDATING EXCHANGE RATES FROM data/exchange_rates")
    print("=" * 80)
    print(f"\nLoaded exchange rate data for {len(exchange_rate_data)} countries\n")

    # Update country JSON files with exchange rate data
    for continent_dir in json_base.iterdir():
        if not continent_dir.is_dir() or continent_dir.name == 'maps':
            continue

        continent = continent_dir.name

        for country_file in continent_dir.glob('*.json'):
            try:
                with open(country_file) as f:
                    country_data = json.load(f)

                country_name = country_data.get('country')
                if not country_name:
                    continue

                # Check if we have exchange rate data for this country
                if country_name not in exchange_rate_data:
                    skipped += 1
                    continue

                fx_data = exchange_rate_data[country_name]
                fx_by_year = {item['year']: item.get('fx_lcu_per_usd_annual_avg') for item in fx_data}

                # Update economics data with exchange rates
                if 'economics' in country_data:
                    for econ_entry in country_data['economics']:
                        year = econ_entry['year']
                        if year in fx_by_year:
                            econ_entry['exchange_rate_usd'] = fx_by_year[year]

                # Write updated data back to file
                with open(country_file, 'w') as f:
                    json.dump(country_data, f, indent=2)

                print(f"✓ Updated {country_name}")
                updated += 1

            except Exception as e:
                print(f"✗ Error processing {country_file}: {e}")
                errors += 1

    print("\n" + "=" * 80)
    print(f"SUMMARY:")
    print(f"  Updated: {updated}")
    print(f"  Skipped: {skipped} (no exchange rate data)")
    print(f"  Errors: {errors}")
    print("=" * 80)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--update':
        update_exchange_rates()
    else:
        check_exchange_rates()
