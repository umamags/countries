import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCountriesIndex } from '../data/IndexContext'

const MAX_RESULTS = 8

export default function SearchBox() {
  const { continents } = useCountriesIndex()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const allCountries = useMemo(
    () =>
      continents.flatMap((continent) =>
        continent.countries.map((country) => ({
          ...country,
          continentSlug: continent.slug,
          continentName: continent.name,
        })),
      ),
    [continents],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allCountries.filter((c) => c.name.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
  }, [query, allCountries])

  function goToCountry(country) {
    navigate(`/continent/${country.continentSlug}/country/${country.slug}`)
    setQuery('')
    setOpen(false)
  }

  const showDropdown = open && query.trim().length > 0

  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Search countries…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            e.currentTarget.blur()
          } else if (e.key === 'Enter' && results.length > 0) {
            goToCountry(results[0])
          }
        }}
        aria-label="Search countries"
      />
      {showDropdown && (
        <ul className="search-results">
          {results.length === 0 ? (
            <li className="search-empty">No countries found</li>
          ) : (
            results.map((country) => (
              <li key={`${country.continentSlug}-${country.slug}`}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => goToCountry(country)}>
                  <span>{country.name}</span>
                  <span className="search-result-continent">{country.continentName}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
