import { useState, useEffect } from 'react'
import { countryNameToCode } from '../utils/countryCodes'

const languageMap = {
  ar: 'ar', zh: 'zh', es: 'es', fr: 'fr', de: 'de', hi: 'hi', ja: 'ja',
  ko: 'ko', pt: 'pt', ru: 'ru', it: 'it', nl: 'nl', sv: 'sv', pl: 'pl',
  tr: 'tr', vi: 'vi', th: 'th', id: 'id', fil: 'tl', bn: 'bn', pa: 'pa',
}

const translateWithMyMemory = async (text, sourceLanguage) => {
  try {
    const langCode = languageMap[sourceLanguage] || sourceLanguage
    if (!langCode || langCode === 'en') return null

    const params = new URLSearchParams({
      q: text,
      langpair: `${langCode}|en`,
    })
    const url = `https://api.mymemory.translated.net/get?${params}`
    const result = await fetch(url)
    const data = await result.json()

    // Only return translation if confidence is high (match > 0.7)
    if (data.responseData?.match >= 0.7) {
      return data.responseData.translatedText
    }
    return null
  } catch {
    return null
  }
}

const translateWithLibreTranslate = async (text, sourceLanguage) => {
  try {
    const langCode = languageMap[sourceLanguage] || sourceLanguage
    if (!langCode || langCode === 'en') return null

    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: langCode,
        target: 'en',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.translatedText || null
  } catch {
    return null
  }
}

const translateText = async (text, sourceLanguage) => {
  if (!text) return null
  if (sourceLanguage === 'en') return null

  // Try MyMemory first (faster, more reliable)
  let translated = await translateWithMyMemory(text, sourceLanguage)
  if (translated) return translated

  // Fallback to LibreTranslate
  translated = await translateWithLibreTranslate(text, sourceLanguage)
  return translated || null
}

export default function NewsSection({ countryName }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [translations, setTranslations] = useState({})

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)

        const countryCode = countryNameToCode[countryName]
        if (!countryCode) {
          setError('Country not supported')
          setLoading(false)
          return
        }

        const apiKey = import.meta.env.VITE_NEWSDATA_IO
        if (!apiKey) {
          setError('News API key not configured')
          setLoading(false)
          return
        }

        const response = await fetch(
          `https://newsdata.io/api/1/news?country=${countryCode}&language=en&apikey=${apiKey}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch news')
        }

        const data = await response.json()

        if (data.results) {
          const newsItems = data.results.slice(0, 5)
          setNews(newsItems)

          // Parallelize all translations at once
          const translationPromises = newsItems.map(async (item) => {
            if (item.description) {
              const translated = await translateText(item.description, item.language)
              if (translated) {
                return { link: item.link, translation: translated }
              }
            }
            return null
          })

          const results = await Promise.all(translationPromises)
          const translationMap = {}
          results.forEach((result) => {
            if (result) {
              translationMap[result.link] = result.translation
            }
          })
          setTranslations(translationMap)
        } else {
          setError('No news found')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [countryName])

  if (loading) {
    return (
      <section className="detail-section">
        <h3>News</h3>
        <p className="news-status">Loading news…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="detail-section">
        <h3>News</h3>
        <p className="news-status news-error">Could not load news: {error}</p>
      </section>
    )
  }

  if (news.length === 0) {
    return (
      <section className="detail-section">
        <h3>News</h3>
        <p className="news-status">No news available</p>
      </section>
    )
  }

  return (
    <section className="detail-section">
      <h3>News</h3>
      <ul className="news-list">
        {news.map((item, i) => (
          <li key={i} className="news-item">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-title">
              {item.title}
            </a>
            {item.description && (
              <div className="news-summary">
                {translations[item.link] ? (
                  <>
                    <div className="news-text-block">
                      <div className="news-text-label">{item.language?.toUpperCase() || 'Local'}</div>
                      <p className="news-text">{item.description}</p>
                    </div>
                    <div className="news-text-block">
                      <div className="news-text-label">English</div>
                      <p className="news-text">{translations[item.link]}</p>
                    </div>
                  </>
                ) : (
                  <div className="news-text-block">
                    <p className="news-text">{item.description}</p>
                  </div>
                )}
              </div>
            )}
            <div className="news-meta">
              <span className="news-source">{item.source_name}</span>
              <span className="news-date">{new Date(item.pubDate).toLocaleDateString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
