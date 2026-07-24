import { useEffect, useState } from 'react'

export function useCountry(continentFolderName, countrySlug) {
  const [state, setState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    if (!continentFolderName || !countrySlug) return
    let cancelled = false
    setState({ status: 'loading', data: null })
    const url = `${import.meta.env.BASE_URL}json/${encodeURIComponent(continentFolderName)}/${countrySlug}.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${countrySlug}.json (${res.status})`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', data: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [continentFolderName, countrySlug])

  return state
}
