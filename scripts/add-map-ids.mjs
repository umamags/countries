/**
 * Matches each country in public/json/index.json to a feature in
 * public/maps/countries-50m.json (Natural Earth admin-0, via world-atlas),
 * and writes the result back into index.json as `map_name`.
 *
 * Matching is done by name rather than the topojson's numeric ISO id
 * because a few features (e.g. Kosovo) carry no id at all. Natural Earth's
 * names don't always match our data's names - NAME_OVERRIDES bridges the
 * known mismatches. Countries with no reasonable match at 50m resolution
 * (mostly small island territories) are left with map_name: null; the UI
 * treats that as "no map available".
 *
 * Usage: node scripts/add-map-ids.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const INDEX_PATH = path.join(ROOT_DIR, 'public', 'json', 'index.json')
const TOPOLOGY_PATH = path.join(ROOT_DIR, 'public', 'maps', 'countries-50m.json')

// Our country name -> Natural Earth name, for the countries whose spelling
// or abbreviation differs between the two datasets.
const NAME_OVERRIDES = {
  'Cape Verde': 'Cabo Verde',
  'Central African Republic': 'Central African Rep.',
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Equatorial Guinea': 'Eq. Guinea',
  Eswatini: 'eSwatini',
  'Republic of the Congo': 'Congo',
  'Sao Tome and Principe': 'São Tomé and Principe',
  'South Sudan': 'S. Sudan',
  'Western Sahara': 'W. Sahara',
  'Cook Islands': 'Cook Is.',
  'Federated States of Micronesia': 'Micronesia',
  'French Polynesia': 'Fr. Polynesia',
  'Marshall Islands': 'Marshall Is.',
  'Solomon Islands': 'Solomon Is.',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'Czech Republic': 'Czechia',
  'North Macedonia': 'Macedonia',
  'Vatican City': 'Vatican',
}

function main() {
  const topology = JSON.parse(fs.readFileSync(TOPOLOGY_PATH, 'utf-8'))
  const topoNames = new Set(
    topology.objects.countries.geometries.map((g) => g.properties?.name).filter(Boolean)
  )

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))

  let matched = 0
  let total = 0
  const unmatched = []

  for (const continent of index.continents) {
    for (const country of continent.countries) {
      total++
      const lookupName = NAME_OVERRIDES[country.name] ?? country.name
      const found = topoNames.has(lookupName)
      country.map_name = found ? lookupName : null
      if (found) matched++
      else unmatched.push(`${continent.name} / ${country.name}`)
    }
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf-8')

  console.log(`Matched ${matched}/${total} countries to map features.`)
  if (unmatched.length > 0) {
    console.log('No map available for:')
    unmatched.forEach((name) => console.log(`  - ${name}`))
  }
}

main()
