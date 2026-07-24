import { createContext, useContext, useEffect, useState } from 'react'

const IndexContext = createContext(null)

export function IndexProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', continents: [] })

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}json/index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load index.json (${res.status})`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', continents: data.continents })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', continents: [], error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <IndexContext.Provider value={state}>{children}</IndexContext.Provider>
}

export function useCountriesIndex() {
  const ctx = useContext(IndexContext)
  if (!ctx) throw new Error('useCountriesIndex must be used within IndexProvider')
  return ctx
}

export function useContinent(continentSlug) {
  const { continents, status, error } = useCountriesIndex()
  const continent = continents.find((c) => c.slug === continentSlug)
  return { continent, status, error }
}
