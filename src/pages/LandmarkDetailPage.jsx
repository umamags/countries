import { Link, useParams } from 'react-router-dom'
import { useContinent } from '../data/IndexContext'
import { useCountry } from '../data/useCountry'
import { slugify } from '../utils/slug'

export default function LandmarkDetailPage() {
  const { continentSlug, countrySlug, landmarkSlug } = useParams()
  const { continent, status: indexStatus } = useContinent(continentSlug)
  const { status, data, error } = useCountry(continent?.name, countrySlug)

  if (indexStatus === 'loading') return <p className="status">Loading…</p>
  if (!continent) return <p className="status status-error">Continent not found.</p>
  if (status === 'loading') return <p className="status">Loading landmark…</p>
  if (status === 'error') return <p className="status status-error">Could not load country: {error}</p>

  const landmark = data.landmarks?.find((l) => slugify(l.name) === landmarkSlug)
  if (!landmark) return <p className="status status-error">Landmark not found.</p>

  const wiki = landmark.wiki

  return (
    <div className="page">
      <Link to={`/continent/${continent.slug}/country/${countrySlug}`} className="back-link">
        ← {data.country}
      </Link>
      <h1>{landmark.name}</h1>

      {wiki?.image && <img className="landmark-image" src={wiki.image} alt={landmark.name} />}

      <p className="landmark-description">{wiki?.extract || landmark.writeup}</p>

      {wiki?.url && (
        <a className="landmark-source" href={wiki.url} target="_blank" rel="noopener noreferrer">
          Read more on Wikipedia ↗
        </a>
      )}
    </div>
  )
}
