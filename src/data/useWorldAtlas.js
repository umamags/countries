import { useEffect, useState } from 'react'
import { feature } from 'topojson-client'

// Module-level cache: the topology is static, so every WorldMap on the page
// shares one fetch + one parse instead of re-requesting it per component.
let atlasPromise = null

function loadWorldAtlas() {
  if (!atlasPromise) {
    atlasPromise = fetch(`${import.meta.env.BASE_URL}maps/countries-50m.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load countries-50m.json (${res.status})`)
        return res.json()
      })
      .then((topology) => feature(topology, topology.objects.countries))
  }
  return atlasPromise
}

export function useWorldAtlas() {
  const [state, setState] = useState({ status: 'loading', featureCollection: null })

  useEffect(() => {
    let cancelled = false
    loadWorldAtlas()
      .then((featureCollection) => {
        if (!cancelled) setState({ status: 'ready', featureCollection })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', featureCollection: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
