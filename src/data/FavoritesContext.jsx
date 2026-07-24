import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'countries-explorer:favorites'
const FavoritesContext = createContext(null)

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// A favorite's identity is continentSlug+slug, not just slug, so two countries
// that happen to share a slug in different continents can't collide.
function idOf(country) {
  return `${country.continentSlug}/${country.slug}`
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(loadFavorites)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) - favorites just won't persist.
    }
  }, [favorites])

  function isFavorite(country) {
    const id = idOf(country)
    return favorites.some((f) => idOf(f) === id)
  }

  function toggleFavorite(country) {
    setFavorites((prev) => {
      const id = idOf(country)
      return prev.some((f) => idOf(f) === id)
        ? prev.filter((f) => idOf(f) !== id)
        : [...prev, country]
    })
  }

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
