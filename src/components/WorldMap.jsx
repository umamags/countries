import { useMemo, useState } from 'react'
import { geoMercator, geoNaturalEarth1, geoPath } from 'd3-geo'
import { useWorldAtlas } from '../data/useWorldAtlas'

const WIDTH = 600
const PADDING = 16

/**
 * Renders countries from the shared world topology (see useWorldAtlas).
 * mode="country" zooms into a single country's own shape (`focusName`);
 * mode="continent" shows the whole world with a set of countries picked
 * out in the accent color (`highlightNames`); mode="explore" shows the
 * whole world and highlights whichever group (`groupByName`, a name ->
 * {key, label} map) the pointer is over, calling `onGroupClick` on click -
 * used for the homepage, where any of 7 continents can be moused over.
 * (A static 7-color choropleth was tried first and rejected: it fails the
 * dataviz skill's own CVD/normal-vision gates once every continent pair can
 * end up adjacent on the map, which caps safe simultaneous categorical
 * hues at 3. A single highlighted-vs-neutral state sidesteps that.)
 * `focusName` may be null/undefined for countries the 50m dataset has no
 * shape for (e.g. Tuvalu) - that's treated as "no map available", not
 * "show the whole world".
 */
export default function WorldMap({ mode, highlightNames, focusName, groupByName, onGroupClick, height = 320 }) {
  const { status, featureCollection } = useWorldAtlas()
  const [hoveredGroup, setHoveredGroup] = useState(null)
  const highlightSet = useMemo(() => new Set(highlightNames ?? []), [highlightNames])
  const isCountryMode = mode === 'country'
  const isExploreMode = mode === 'explore'

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
        const name = f.properties?.name
        const group = isExploreMode ? groupByName?.get(name) : undefined
        const isHighlighted = isCountryMode
          ? true
          : isExploreMode
            ? Boolean(group) && group.key === hoveredGroup
            : highlightSet.has(name)

        return (
          <path
            key={name ?? f.id}
            d={path(f)}
            className={`map-country${isHighlighted ? ' is-highlighted' : ''}${group ? ' is-groupable' : ''}`}
            onMouseEnter={group ? () => setHoveredGroup(group.key) : undefined}
            onMouseLeave={group ? () => setHoveredGroup(null) : undefined}
            onClick={group && onGroupClick ? () => onGroupClick(group.key) : undefined}
          >
            {group && <title>{`${name} — ${group.label}`}</title>}
          </path>
        )
      })}
    </svg>
  )
}
