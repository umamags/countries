import { useEffect, useState } from 'react'
import { feature, neighbors } from 'topojson-client'

// Module-level cache: the topology is static, so every WorldMap on the page
// shares one fetch + one parse instead of re-requesting it per component.
let atlasPromise = null

const MAP_COLOR_COUNT = 4

// DSATUR graph coloring: repeatedly color the country with the most
// distinct colors already among its neighbors (breaking ties by degree),
// always picking its lowest available color. This guarantees no two
// bordering countries ever share a color - the same guarantee real
// political maps rely on (four-color theorem) - unlike a per-country
// color picked independently (e.g. hashed from the name), which has no
// such guarantee and can't be validated for colorblind-safety at map
// scale (~240 countries, any two of which could end up adjacent).
function colorCountries(geometries, neighborLists) {
  const n = geometries.length
  const color = new Array(n).fill(-1)
  const neighborColors = Array.from({ length: n }, () => new Set())
  const uncolored = new Set(Array.from({ length: n }, (_, i) => i))

  while (uncolored.size > 0) {
    let best = -1
    let bestSaturation = -1
    let bestDegree = -1
    for (const i of uncolored) {
      const saturation = neighborColors[i].size
      const degree = neighborLists[i].length
      if (saturation > bestSaturation || (saturation === bestSaturation && degree > bestDegree)) {
        best = i
        bestSaturation = saturation
        bestDegree = degree
      }
    }

    const used = neighborColors[best]
    let c = 0
    while (used.has(c) && c < MAP_COLOR_COUNT) c++
    // Verified empirically for this exact dataset: DSATUR never needs a 5th
    // color. If a future topology update ever did, leave it uncolored
    // (renders as neutral gray) rather than reusing a neighbor's color and
    // silently breaking the adjacency guarantee.
    color[best] = c < MAP_COLOR_COUNT ? c : -1
    uncolored.delete(best)
    if (color[best] >= 0) {
      for (const j of neighborLists[best]) neighborColors[j].add(color[best])
    }
  }

  const colorByName = new Map()
  geometries.forEach((g, i) => {
    if (g.properties?.name) colorByName.set(g.properties.name, color[i])
  })
  return colorByName
}

function loadWorldAtlas() {
  if (!atlasPromise) {
    atlasPromise = fetch(`${import.meta.env.BASE_URL}maps/countries-50m.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load countries-50m.json (${res.status})`)
        return res.json()
      })
      .then((topology) => {
        const geometries = topology.objects.countries.geometries
        const featureCollection = feature(topology, topology.objects.countries)
        const colorByName = colorCountries(geometries, neighbors(geometries))
        return { featureCollection, colorByName }
      })
  }
  return atlasPromise
}

export function useWorldAtlas() {
  const [state, setState] = useState({ status: 'loading', featureCollection: null, colorByName: null })

  useEffect(() => {
    let cancelled = false
    loadWorldAtlas()
      .then(({ featureCollection, colorByName }) => {
        if (!cancelled) setState({ status: 'ready', featureCollection, colorByName })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', featureCollection: null, colorByName: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
