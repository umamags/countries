import { useState, useRef, useEffect } from 'react'

export default function CompareCountrySelector({ value, onChange, allCountries, selectedCountries }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const filteredCountries = ['None', ...allCountries].filter(
    (country) =>
      country.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (country === value || !selectedCountries.includes(country) || country === 'None')
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (country) => {
    onChange(country)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="country-selector" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Select a country"
        value={isOpen ? searchTerm : value}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          if (!isOpen) setIsOpen(true)
        }}
        onFocus={() => {
          setIsOpen(true)
          setSearchTerm('')
        }}
        className="selector-input"
      />
      {isOpen && (
        <ul className="selector-dropdown">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <li key={country}>
                <button type="button" onClick={() => handleSelect(country)}>
                  {country}
                </button>
              </li>
            ))
          ) : (
            <li className="no-results">No countries found</li>
          )}
        </ul>
      )}
    </div>
  )
}
