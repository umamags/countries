import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useContinent } from '../data/IndexContext'
import { useCountry } from '../data/useCountry'
import { useFavorites } from '../data/FavoritesContext'
import WorldMap from '../components/WorldMap'
import StateMap from '../components/StateMap'
import VideoModal from '../components/VideoModal'
import FlagModal from '../components/FlagModal'
import Breadcrumb from '../components/Breadcrumb'
import CommentarySection from '../components/CommentarySection'
import EconomicsSection from '../components/EconomicsSection'
import TradeSection from '../components/TradeSection'
import AidLoansSection from '../components/AidLoansSection'
import { slugify } from '../utils/slug'

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

function LandmarkList({ items, continentSlug, countrySlug }) {
  if (!items || items.length === 0) return null
  return (
    <section className="detail-section">
      <h3>Main Landmarks</h3>
      <ul className="named-list">
        {items.map((item, i) => (
          <li key={i}>
            <Link
              className="named-list-name landmark-link"
              to={`/continent/${continentSlug}/country/${countrySlug}/landmark/${slugify(item.name)}`}
            >
              {item.name}
            </Link>
            {item.writeup ? <span className="named-list-text"> — {item.writeup}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function CulturalEventList({ items }) {
  if (!items || items.length === 0) return null
  return (
    <section className="detail-section">
      <h3>Main Cultural Events</h3>
      <ul className="named-list">
        {items.map((item, i) => (
          <li key={i}>
            {item.wiki?.url ? (
              <a
                className="named-list-name event-link"
                href={item.wiki.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.name}
              </a>
            ) : (
              <span className="named-list-name">{item.name}</span>
            )}
            {item.writeup ? <span className="named-list-text"> — {item.writeup}</span> : null}
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
  const [showFlagModal, setShowFlagModal] = useState(false)
  const navigate = useNavigate()

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
  const landmarkPins = (data.landmarks || [])
    .filter((l) => l.wiki?.coordinates)
    .map((l) => ({
      name: l.name,
      lat: l.wiki.coordinates.lat,
      lon: l.wiki.coordinates.lon,
      slug: slugify(l.name),
    }))

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: continent.name, to: `/continent/${continent.slug}` },
          { label: data.country },
        ]}
      />
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

      {data.reference_map ? (
        <div className="reference-map">
          <img
            src={`${import.meta.env.BASE_URL}${data.reference_map.image}`}
            alt={`Reference map of ${data.country} showing major cities`}
            className="reference-map-image"
          />
          <a
            className="reference-map-credit"
            href={data.reference_map.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {data.reference_map.attribution} ↗
          </a>
        </div>
      ) : (
        <div className="map-container map-container-focus">
          <WorldMap
            mode="country"
            focusName={mapName}
            height={data.cities ? 340 : 220}
            cities={data.cities}
            landmarks={landmarkPins}
            onLandmarkClick={(slug) =>
              navigate(`/continent/${continent.slug}/country/${countrySlug}/landmark/${slug}`)
            }
          />
        </div>
      )}

      <StateMap countryName={data.country} height={340} />

      {data.flag && (
        <div className="flag-section">
          <button
            type="button"
            className="flag-button"
            onClick={() => setShowFlagModal(true)}
            title="Click to enlarge"
          >
            <img src={data.flag.image_small} alt={`Flag of ${data.country}`} className="flag-image-small" />
          </button>
        </div>
      )}

      <dl className="facts">
        <Fact label="Continent" value={data.continent} />
        <Fact label="Languages" value={data.languages?.join(', ')} />
        <Fact label="Population" value={data.population} />
        <Fact label="Currency" value={data.currency} />
        <Fact label="Area (km²)" value={data.area} />
        <Fact label="Head of State / Government" value={data.head_of_state} />
      </dl>

      {data.national_anthem && (
        <section className="detail-section">
          <h3>National Anthem</h3>
          {data.national_anthem_url ? (
            <p>
              <a href={data.national_anthem_url} target="_blank" rel="noopener noreferrer">
                {data.national_anthem} ↗
              </a>
            </p>
          ) : (
            <p>{data.national_anthem}</p>
          )}
        </section>
      )}

      {(data.national_animal || data.national_bird) && (
        <section className="detail-section">
          <h3>National Symbols</h3>
          <dl className="symbols-list">
            {data.national_animal && (
              <>
                <dt>National Animal</dt>
                <dd>{data.national_animal}</dd>
              </>
            )}
            {data.national_bird && (
              <>
                <dt>National Bird</dt>
                <dd>{data.national_bird}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      <LandmarkList items={data.landmarks} continentSlug={continent.slug} countrySlug={countrySlug} />
      <CulturalEventList items={data.cultural_events} />

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

      <TradeSection trade={data.trade} />

      <AidLoansSection aid={data.aid} />

      <CommentarySection commentary={data.commentary} />

      <EconomicsSection economics={data.economics} />

      <VideoList items={data.five_youtube_video_titles} onPlay={setActiveVideo} />

      {activeVideo && (
        <VideoModal
          title={activeVideo.title}
          videoId={activeVideo.videoId}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {showFlagModal && (
        <FlagModal flag={data.flag} countryName={data.country} onClose={() => setShowFlagModal(false)} />
      )}
    </div>
  )
}
