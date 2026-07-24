import { Link } from 'react-router-dom'
import { useCountriesIndex } from '../data/IndexContext'
import { useFavorites } from '../data/FavoritesContext'

export default function ContinentsPage() {
  const { status, continents, error } = useCountriesIndex()
  const { favorites, toggleFavorite } = useFavorites()

  if (status === 'loading') return <p className="status">Loading continents…</p>
  if (status === 'error') return <p className="status status-error">Could not load data: {error}</p>

  return (
    <div className="page">
      <h1>Explore the World</h1>
      <p className="subtitle">Choose a continent to see its countries.</p>
      <div className="grid grid-continents">
        {continents.map((continent) => (
          <Link key={continent.slug} to={`/continent/${continent.slug}`} className="card continent-card">
            <h2>{continent.name}</h2>
            <span className="badge">
              {continent.countryCount} {continent.countryCount === 1 ? 'country' : 'countries'}
            </span>
          </Link>
        ))}
      </div>

      {favorites.length > 0 && (
        <section className="favorites-section">
          <h2>Favorites</h2>
          <div className="grid grid-countries">
            {favorites.map((country) => (
              <div key={`${country.continentSlug}-${country.slug}`} className="card country-card favorite-card">
                <Link to={`/continent/${country.continentSlug}/country/${country.slug}`}>{country.name}</Link>
                <button
                  type="button"
                  className="star-button"
                  aria-label={`Remove ${country.name} from favorites`}
                  onClick={() => toggleFavorite(country)}
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
