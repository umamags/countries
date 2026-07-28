import { useEffect, useState } from 'react'
import { feature, neighbors } from 'topojson-client'
import { colorGraph } from '../utils/graphColor'

// Module-level cache, same pattern as useWorldAtlas: fetched once, shared by
// every StateMap on the page. Pilot dataset (5 countries) - see the impact
// analysis for what a full worldwide version would need.
let statesPromise = null

function loadStatesAtlas() {
  if (!statesPromise) {
    statesPromise = fetch(`${import.meta.env.BASE_URL}maps/states-pilot.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load states-pilot.json (${res.status})`)
        return res.json()
      })
      .then((topology) => {
        const objectName = Object.keys(topology.objects)[0]
        const geometries = topology.objects[objectName].geometries
        const featureCollection = feature(topology, topology.objects[objectName])
        const neighborLists = neighbors(geometries)

        const byCountry = new Map()
        geometries.forEach((g, i) => {
          const country = g.properties ? g.properties.admin : null
          if (!country) return
          if (!byCountry.has(country)) byCountry.set(country, [])
          byCountry.get(country).push(i)
        })

        // Map<countryName, Map<stateName, colorIndex>> - each country's
        // states are colored as their own independent subgraph (reusing a
        // color between e.g. an Indian state and a Chilean region is
        // harmless, since they're never shown together).
        const colorByCountry = new Map()
        for (const entry of byCountry.entries()) {
          const country = entry[0]
          const indices = entry[1]
          const localIndex = new Map(indices.map((gi, li) => [gi, li]))
          const localNeighbors = indices.map((gi) =>
            neighborLists[gi].filter((n) => localIndex.has(n)).map((n) => localIndex.get(n))
          )
          const colors = colorGraph(indices.length, localNeighbors)
          const colorByName = new Map()
          indices.forEach((gi, li) => {
            const name = geometries[gi].properties ? geometries[gi].properties.name : null
            if (name) colorByName.set(name, colors[li])
          })
          colorByCountry.set(country, colorByName)
        }

        return { featureCollection, colorByCountry }
      })
  }
  return statesPromise
}

export function useStatesAtlas() {
  const [state, setState] = useState({ status: 'loading', featureCollection: null, colorByCountry: null })

  useEffect(() => {
    let cancelled = false
    loadStatesAtlas()
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', featureCollection: result.featureCollection, colorByCountry: result.colorByCountry })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', featureCollection: null, colorByCountry: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
