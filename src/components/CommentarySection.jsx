import { useState } from 'react'
import '../styles/CommentarySection.css'

function CommentaryBox({ title, content, colorClass, events, expanded, onToggle }) {
  return (
    <div className={`commentary-box ${colorClass}`}>
      <h4>{title}</h4>
      {content ? (
        <p className="box-content">{content}</p>
      ) : (
        <p className="no-data">Data not available</p>
      )}

      {events && events.length > 0 && (
        <div className="events-section">
          <button
            type="button"
            className="events-toggle"
            onClick={onToggle}
          >
            {expanded ? '▼ Hide Key Events' : '▶ Key Events'}
          </button>
          {expanded && (
            <div className="events-list">
              {events.map((event, index) => (
                <div key={index} className="event-item">
                  <span className="event-period">{event.period}</span>
                  <p className="event-text">{event.event}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommentarySection({ commentary }) {
  const [expandedEvents, setExpandedEvents] = useState(false)

  if (!commentary) {
    return (
      <section className="detail-section">
        <h3>Commentary</h3>
        <p className="no-data">Data not available</p>
      </section>
    )
  }

  // Sort events in reverse chronological order
  const sortedEvents = [...(commentary.key_events || [])].sort((a, b) => {
    // Extract the year from the period (e.g., "2008" or "2021-23" -> take the last year)
    const getYear = (period) => {
      const match = period.match(/(\d{4})/)
      return match ? parseInt(match[1]) : 0
    }
    return getYear(b.period) - getYear(a.period)
  })

  return (
    <section className="detail-section">
      <h3>Commentary</h3>
      <div className="commentary-grid">
        <CommentaryBox
          title="Inflation Management"
          content={commentary.inflation_management}
          colorClass="color-inflation"
          events={sortedEvents}
          expanded={expandedEvents}
          onToggle={() => setExpandedEvents(!expandedEvents)}
        />
        <CommentaryBox
          title="Debt Management"
          content={commentary.debt_management}
          colorClass="color-debt"
        />
        <CommentaryBox
          title="Outlook Next Decade"
          content={commentary.outlook_next_decade}
          colorClass="color-outlook"
        />
        <CommentaryBox
          title="Caveat"
          content={commentary.caveat}
          colorClass="color-caveat"
        />
      </div>
    </section>
  )
}
