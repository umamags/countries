import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useContinent, useCountriesIndex } from '../data/IndexContext'
import { useFavorites } from '../data/FavoritesContext'
import WorldMap from '../components/WorldMap'
import Breadcrumb from '../components/Breadcrumb'

export default function CountryListPage() {
  const { continentSlug } = useParams()
  const navigate = useNavigate()
  const { status: indexStatus, continents } = useCountriesIndex()
  const { continent } = useContinent(continentSlug)
  const { isFavorite, toggleFavorite } = useFavorites()

  const countryByName = useMemo(() => {
    const map = new Map()
    for (const c of continents) {
      for (const country of c.countries) {
        if (country.map_name) {
          map.set(country.map_name, { slug: country.slug, continentSlug: c.slug, name: country.name })
        }
      }
    }
    return map
  }, [continents])

  if (indexStatus === 'loading') return <p className="status">Loading…</p>
  if (!continent) return <p className="status status-error">Continent not found.</p>

  const highlightNames = continent.countries.map((c) => c.map_name).filter(Boolean)

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: continent.name }]} />
      <h1>{continent.name}</h1>
      <p className="subtitle">
        {continent.countryCount} {continent.countryCount === 1 ? 'country' : 'countries'}
      </p>
      <div className="map-container">
        <WorldMap
          mode="continent"
          highlightNames={highlightNames}
          countryByName={countryByName}
          onCountryClick={(country) => navigate(`/continent/${country.continentSlug}/country/${country.slug}`)}
        />
      </div>
      <div className="grid grid-countries">
        {continent.countries.map((country) => {
          const favoriteEntry = {
            name: country.name,
            slug: country.slug,
            continentSlug: continent.slug,
            continentName: continent.name,
          }
          const favorited = isFavorite(favoriteEntry)
          return (
            <div key={country.slug} className="card country-card">
              <Link to={`/continent/${continent.slug}/country/${country.slug}`}>{country.name}</Link>
              <button
                type="button"
                className={`star-button${favorited ? ' is-favorite' : ''}`}
                aria-label={favorited ? `Remove ${country.name} from favorites` : `Add ${country.name} to favorites`}
                onClick={() => toggleFavorite(favoriteEntry)}
              >
                {favorited ? '★' : '☆'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
