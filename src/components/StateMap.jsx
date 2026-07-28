import { useMemo } from 'react'
import { geoCentroid, geoDistance, geoMercator, geoPath } from 'd3-geo'
import { useStatesAtlas } from '../data/useStatesAtlas'

const WIDTH = 600
const PADDING = 16
const CLUSTER_THRESHOLD_RAD = (8 * Math.PI) / 180

// Union-Find: groups indices into connected components under `connected`.
function connectedComponents(n, connected) {
  const parent = Array.from({ length: n }, (_, i) => i)
  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (connected(i, j)) {
        const ri = find(i)
        const rj = find(j)
        if (ri !== rj) parent[ri] = rj
      }
    }
  }
  const groups = new Map()
  for (let i = 0; i < n; i++) {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root).push(i)
  }
  return [...groups.values()]
}

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

// Shift a longitude to be continuous with `reference` instead of wrapping
// at +/-180 - purely for choosing a sane cluster/rotation center; see the
// note on rotate() below for why this must NOT be used to reshape the
// geometry actually handed to the projection.
function normalizeLongitude(lon, reference) {
  let normalized = lon
  while (normalized - reference > 180) normalized -= 360
  while (normalized - reference < -180) normalized += 360
  return normalized
}

/**
 * Picks out the "mainland" cluster of a country's admin-1 regions, and a
 * rotation longitude to view it by. Some countries' admin-1 sets include
 * remote overseas territories (New Zealand's Tokelau, ~3800km away;
 * France's French Guiana; Chile's Easter Island) whose bounding box would
 * dominate fitExtent and squeeze the main territory into an unreadable
 * sliver - the same problem the country-level map solved by fitting to
 * pins instead of the whole geometry. Here there are no pins to fall back
 * to, so instead: chain-cluster regions that are close to *each other*
 * (connected components under an 8-degree threshold, not just close to one
 * fixed anchor) and keep the largest cluster. A fixed-radius "most
 * neighbors" anchor was tried first and rejected: a single
 * centrally-located remote island can rack up more raw neighbors within a
 * generous radius than any one mainland region, without actually being
 * part of the mainland's own tightly-chained cluster (New Zealand's
 * Chatham Islands did exactly this).
 *
 * A region can be genuinely nearby by great-circle distance yet stored
 * with antimeridian-wrapped coordinates (Chatham Islands sit at -176°,
 * right next to mainland regions at +172°). The fix is NOT to rewrite
 * those coordinates into an out-of-range representation (e.g. +184) -
 * every d3-geo projection normalizes longitude back into (-180, 180] as
 * part of its spherical math, silently undoing any such shift, and
 * Mercator's raw output isn't periodic across that seam even though its
 * input is (a point at -176° and one at +178° project to wildly different
 * x, despite being 6 degrees apart). The actual fix is to rotate() the
 * projection so the antimeridian seam falls away from the region being
 * shown - then every point in view projects continuously, and fitExtent's
 * own bounds computation (which respects the projection's rotation) works
 * correctly with no coordinate rewriting needed.
 */
function pickCluster(features) {
  if (features.length <= 1) return { core: features, rotateLon: features[0] ? geoCentroid(features[0])[0] : 0 }

  const referenceLon = median(features.map((f) => geoCentroid(f)[0]))
  const centroids = features.map((f) => {
    const [lon, lat] = geoCentroid(f)
    return [normalizeLongitude(lon, referenceLon), lat]
  })

  const clusters = connectedComponents(
    features.length,
    (i, j) => geoDistance(centroids[i], centroids[j]) < CLUSTER_THRESHOLD_RAD
  )
  const largestCluster = clusters.reduce((a, b) => (b.length > a.length ? b : a))
  const rotateLon = median(largestCluster.map((i) => centroids[i][0]))

  return { core: largestCluster.map((i) => features[i]), rotateLon }
}

/**
 * Colored state/province map for a single country, same DSATUR approach as
 * the world map (see useStatesAtlas) - no two neighboring states share a
 * color, using the same validated 4-color palette. Pilot dataset only
 * covers a handful of countries; renders nothing if `countryName` isn't in
 * it, so it's safe to drop into any country page unconditionally.
 */
export default function StateMap({ countryName, height = 320 }) {
  const { status, featureCollection, colorByCountry } = useStatesAtlas()

  const countryFeatures = useMemo(() => {
    if (!featureCollection) return []
    return featureCollection.features.filter((f) => f.properties && f.properties.admin === countryName)
  }, [featureCollection, countryName])

  const colorByName = colorByCountry ? colorByCountry.get(countryName) : null

  const path = useMemo(() => {
    if (countryFeatures.length === 0) return null
    const { core, rotateLon } = pickCluster(countryFeatures)
    const projection = geoMercator()
      .rotate([-rotateLon, 0])
      .fitExtent(
        [
          [PADDING, PADDING],
          [WIDTH - PADDING, height - PADDING],
        ],
        { type: 'FeatureCollection', features: core }
      )
    return geoPath(projection)
  }, [countryFeatures, height])

  if (status === 'error' || (status === 'ready' && countryFeatures.length === 0)) return null

  return (
    <section className="detail-section">
      <h3>States &amp; Provinces</h3>
      <div className="map-container map-container-focus">
        {status === 'loading' ? (
          <p className="map-status">Loading map…</p>
        ) : (
          <svg
            className="world-map world-map-focus"
            viewBox={`0 0 ${WIDTH} ${height}`}
            role="img"
            aria-label={`States and provinces of ${countryName}`}
          >
            {countryFeatures.map((f) => {
              const name = f.properties ? f.properties.name : undefined
              const colorIndex = colorByName ? colorByName.get(name) : undefined
              const colorClass = colorIndex != null && colorIndex >= 0 ? `map-country-color-${colorIndex}` : ''
              return (
                <path key={name} d={path(f)} className={`map-country ${colorClass}`}>
                  <title>{name}</title>
                </path>
              )
            })}
          </svg>
        )}
      </div>
    </section>
  )
}
