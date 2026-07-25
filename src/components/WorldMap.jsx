import { useMemo } from 'react'
import { geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo'
import { useWorldAtlas } from '../data/useWorldAtlas'

const WIDTH = 600
const PADDING = 16

/**
 * Renders countries from the shared world topology (see useWorldAtlas).
 * mode="country" zooms into a single country's own shape (`focusName`);
 * mode="continent" shows the whole world with a set of countries picked
 * out in the accent color (`highlightNames`). `focusName` may be null/
 * undefined for countries the 50m dataset has no shape for (e.g. Tuvalu) -
 * that's treated as "no map available", not "show the whole world".
 */
export default function WorldMap({ mode, highlightNames, focusName, height = 320 }) {
  const { status, featureCollection } = useWorldAtlas()
  const highlightSet = useMemo(() => new Set(highlightNames ?? []), [highlightNames])
  const isCountryMode = mode === 'country'

  const { path, features, notFound } = useMemo(() => {
    if (!featureCollection) return { path: null, features: [], notFound: false }

    if (isCountryMode) {
      if (!focusName) return { path: null, features: [], notFound: true }
      const focusFeature = featureCollection.features.find((f) => f.properties?.name === focusName)
      if (!focusFeature) return { path: null, features: [], notFound: true }
      const projection = geoMercator().fitExtent(
        [
          [PADDING, PADDING],
          [WIDTH - PADDING, height - PADDING],
        ],
        focusFeature
      )
      return { path: geoPath(projection), features: [focusFeature], notFound: false }
    }

    const projection = geoNaturalEarth1().fitSize([WIDTH, height], featureCollection)
    return { path: geoPath(projection), features: featureCollection.features, notFound: false }
  }, [featureCollection, isCountryMode, focusName, height])

  if (status === 'loading') return <p className="map-status">Loading map…</p>
  if (status === 'error') return <p className="map-status">Map not available.</p>
  if (notFound) return <p className="map-status">No map available for this location.</p>

  return (
    <svg
      className={`world-map${isCountryMode ? ' world-map-focus' : ''}`}
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label={isCountryMode ? `Map of ${focusName}` : 'World map'}
    >
      {features.map((f) => {
        const isHighlighted = isCountryMode || highlightSet.has(f.properties?.name)
        return (
          <path
            key={f.properties?.name ?? f.id}
            d={path(f)}
            className={`map-country${isHighlighted ? ' is-highlighted' : ''}`}
          />
        )
      })}
    </svg>
  )
}
