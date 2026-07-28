import { useEffect, useState } from 'react'
import { feature, neighbors } from 'topojson-client'
import { colorGraph } from '../utils/graphColor'

// Module-level cache: the topology is static, so every WorldMap on the page
// shares one fetch + one parse instead of re-requesting it per component.
let atlasPromise = null

function colorCountries(geometries, neighborLists) {
  const colors = colorGraph(geometries.length, neighborLists)
  const colorByName = new Map()
  geometries.forEach((g, i) => {
    if (g.properties?.name) colorByName.set(g.properties.name, colors[i])
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
