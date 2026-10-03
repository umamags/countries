import { useState } from 'react'
import '../styles/CompareEvents.css'

export default function CompareEvents({ countries }) {
  const [expandedYears, setExpandedYears] = useState({})

  const toggleYear = (key) => {
    setExpandedYears((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getYearsWithEvents = (country) => {
    const years = new Set()
    country.economics?.forEach((e) => {
      if (e.main_events && e.main_events.length > 0) {
        years.add(e.year)
      }
      if (e.sport) {
        years.add(e.year)
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }

  const getEventsForYear = (country, year) => {
    const entry = country.economics?.find((e) => e.year === year)
    return entry ? { main_events: entry.main_events || [], sport: entry.sport || null } : { main_events: [], sport: null }
  }

  const countryYearsMap = {}
  countries.forEach((country) => {
    countryYearsMap[country.name] = getYearsWithEvents(country)
  })

  const allYears = [...new Set(Object.values(countryYearsMap).flat())].sort((a, b) => b - a)

  if (allYears.length === 0) {
    return null
  }

  return (
    <div className="compare-section">
      <h2>Historical Events & Sports</h2>
      <div className="events-comparison">
        {allYears.map((year) => {
          const hasAnyEvent = countries.some((c) => {
            const events = getEventsForYear(c, year)
            return events.main_events.length > 0 || events.sport
          })

          if (!hasAnyEvent) return null

          const key = `year-${year}`
          const isExpanded = expandedYears[key]

          return (
            <div key={key} className="year-events-row">
              <button
                type="button"
                className={`year-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleYear(key)}
              >
                {year}
                <span className="toggle-icon">{isExpanded ? '−' : '+'}</span>
              </button>

              {isExpanded && (
                <div className="year-events-grid">
                  {countries.map((country) => {
                    const events = getEventsForYear(country, year)
                    const hasEvents = events.main_events.length > 0 || events.sport

                    return (
                      <div key={country.name} className="country-events">
                        <h5>{country.name}</h5>
                        {hasEvents ? (
                          <div className="events-content">
                            {events.main_events.length > 0 && (
                              <div className="event-section">
                                <h6>Geopolitical Events</h6>
                                <ul>
                                  {events.main_events.map((event, i) => (
                                    <li key={i}>
                                      <strong>{event.headline}</strong>
                                      <p>{event.summary}</p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {events.sport && (
                              <div className="event-section">
                                <h6>Sports</h6>
                                <div className="sport-event">
                                  <strong>{events.sport.headline}</strong>
                                  <p>{events.sport.summary}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="no-events">No events recorded</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
