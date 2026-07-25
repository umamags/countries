import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useContinent } from '../data/IndexContext'
import { useCountry } from '../data/useCountry'
import { useFavorites } from '../data/FavoritesContext'
import WorldMap from '../components/WorldMap'
import VideoModal from '../components/VideoModal'

function Fact({ label, value }) {
  if (!value) return null
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function NamedList({ title, items, textKey }) {
  if (!items || items.length === 0) return null
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <ul className="named-list">
        {items.map((item, i) => (
          <li key={i}>
            <span className="named-list-name">{item.name}</span>
            {item[textKey] ? <span className="named-list-text"> — {item[textKey]}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function VideoList({ items, onPlay }) {
  if (!items || items.length === 0) return null
  return (
    <section className="detail-section">
      <h3>Suggested Videos</h3>
      <ul className="plain-list">
        {items.map((item, i) => {
          const title = typeof item === 'string' ? item : item.title
          const videoId = typeof item === 'string' ? null : item.video_id
          return (
            <li key={i}>
              {videoId ? (
                <button type="button" className="video-link" onClick={() => onPlay({ title, videoId })}>
                  ▶ {title}
                </button>
              ) : (
                title
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function CountryDetailPage() {
  const { continentSlug, countrySlug } = useParams()
  const { continent, status: indexStatus } = useContinent(continentSlug)
  const { status, data, error } = useCountry(continent?.name, countrySlug)
  const { isFavorite, toggleFavorite } = useFavorites()
  const [activeVideo, setActiveVideo] = useState(null)

  if (indexStatus === 'loading') return <p className="status">Loading…</p>
  if (!continent) return <p className="status status-error">Continent not found.</p>
  if (status === 'loading') return <p className="status">Loading country details…</p>
  if (status === 'error') return <p className="status status-error">Could not load country: {error}</p>

  const favoriteEntry = {
    name: data.country,
    slug: countrySlug,
    continentSlug: continent.slug,
    continentName: continent.name,
  }
  const favorited = isFavorite(favoriteEntry)
  const mapName = continent.countries.find((c) => c.slug === countrySlug)?.map_name

  return (
    <div className="page">
      <Link to={`/continent/${continent.slug}`} className="back-link">
        ← {continent.name}
      </Link>
      <div className="detail-title-row">
        <h1>{data.country}</h1>
        <button
          type="button"
          className={`favorite-button${favorited ? ' is-favorite' : ''}`}
          onClick={() => toggleFavorite(favoriteEntry)}
        >
          {favorited ? '★ Remove from Favorites' : '☆ Add to Favorite'}
        </button>
      </div>

      <div className="map-container map-container-focus">
        <WorldMap mode="country" focusName={mapName} height={220} />
      </div>

      <dl className="facts">
        <Fact label="Continent" value={data.continent} />
        <Fact label="Languages" value={data.languages?.join(', ')} />
        <Fact label="Population" value={data.population} />
        <Fact label="Currency" value={data.currency} />
        <Fact label="Area (km²)" value={data.area} />
        <Fact label="Head of State / Government" value={data.head_of_state} />
      </dl>

      <NamedList title="Main Landmarks" items={data.landmarks} textKey="writeup" />
      <NamedList title="Main Cultural Events" items={data.cultural_events} textKey="writeup" />

      {data.food_writeup && (
        <section className="detail-section">
          <h3>Food & Cuisine</h3>
          <p>{data.food_writeup}</p>
        </section>
      )}

      {data.brief_history && (
        <section className="detail-section">
          <h3>Brief History</h3>
          <p>{data.brief_history}</p>
        </section>
      )}

      <NamedList title="Important People" items={data.important_people} textKey="description" />

      {data.current_conflicts && (
        <section className="detail-section">
          <h3>Current Conflicts</h3>
          <p>{data.current_conflicts}</p>
        </section>
      )}

      <VideoList items={data.five_youtube_video_titles} onPlay={setActiveVideo} />

      {activeVideo && (
        <VideoModal
          title={activeVideo.title}
          videoId={activeVideo.videoId}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  )
}
