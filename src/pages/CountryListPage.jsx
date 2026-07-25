import { Link, useParams } from 'react-router-dom'
import { useContinent, useCountriesIndex } from '../data/IndexContext'
import { useFavorites } from '../data/FavoritesContext'
import WorldMap from '../components/WorldMap'

export default function CountryListPage() {
  const { continentSlug } = useParams()
  const { status: indexStatus } = useCountriesIndex()
  const { continent } = useContinent(continentSlug)
  const { isFavorite, toggleFavorite } = useFavorites()

  if (indexStatus === 'loading') return <p className="status">Loading…</p>
  if (!continent) return <p className="status status-error">Continent not found.</p>

  const highlightNames = continent.countries.map((c) => c.map_name).filter(Boolean)

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← All continents
      </Link>
      <h1>{continent.name}</h1>
      <p className="subtitle">
        {continent.countryCount} {continent.countryCount === 1 ? 'country' : 'countries'}
      </p>
      <div className="map-container">
        <WorldMap mode="continent" highlightNames={highlightNames} />
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
