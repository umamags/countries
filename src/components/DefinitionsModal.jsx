import { useEffect, useState } from 'react'

export default function DefinitionsModal({ onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}definitions/gdp.md`)
        if (!response.ok) throw new Error('Failed to load definitions')
        const text = await response.text()
        setContent(text)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDefinitions()
  }, [])

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="definitions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <span className="video-modal-title">Understanding These Charts</span>
          <button type="button" className="video-modal-close" onClick={onClose} aria-label="Close definitions">
            ×
          </button>
        </div>
        <div className="definitions-content">
          {loading && <p>Loading definitions...</p>}
          {error && <p className="error">Error: {error}</p>}
          {!loading && !error && (
            <div className="definitions-text">
              {content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph.trim()}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
