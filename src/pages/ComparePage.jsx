import { useState, useMemo, useEffect } from 'react'
import { useCountriesIndex } from '../data/IndexContext'
import Breadcrumb from '../components/Breadcrumb'
import CompareCountrySelector from '../components/CompareCountrySelector'
import CompareTable from '../components/CompareTable'
import CompareCharts from '../components/CompareCharts'
import CompareEvents from '../components/CompareEvents'
import '../styles/ComparePage.css'

const DEFAULT_COUNTRIES = ['United States of America', 'India', 'China', 'Germany', 'Australia']
const DEFAULT_ATTRIBUTES = ['languages', 'population', 'currency', 'area', 'gdp_usd_billion']

export default function ComparePage() {
  const { continents } = useCountriesIndex()
  const [selectedCountries, setSelectedCountries] = useState(DEFAULT_COUNTRIES)
  const [selectedAttributes, setSelectedAttributes] = useState(DEFAULT_ATTRIBUTES)
  const [includeCharts, setIncludeCharts] = useState(false)
  const [selectedCountriesData, setSelectedCountriesData] = useState([])

  const countryIndexData = useMemo(() => {
    const map = new Map()
    for (const continent of continents) {
      for (const country of continent.countries) {
        map.set(country.name, { ...country, continent: continent.name })
      }
    }
    return map
  }, [continents])

  const allCountries = useMemo(() => Array.from(countryIndexData.keys()).sort(), [countryIndexData])

  // Fetch full country data for each selected country
  useEffect(() => {
    const loadCountriesData = async () => {
      const data = []
      for (const countryName of selectedCountries) {
        if (countryIndexData.has(countryName)) {
          const indexData = countryIndexData.get(countryName)
          try {
            const response = await fetch(
              `${import.meta.env.BASE_URL}json/${indexData.continent}/${indexData.slug}.json`
            )
            const countryData = await response.json()
            data.push({
              name: countryName,
              ...indexData,
              ...countryData,
            })
          } catch (error) {
            console.error(`Failed to load data for ${countryName}:`, error)
            data.push({
              name: countryName,
              ...indexData,
            })
          }
        }
      }
      setSelectedCountriesData(data)
    }

    loadCountriesData()
  }, [selectedCountries, countryIndexData])

  const handleCountryChange = (index, countryName) => {
    const newSelected = [...selectedCountries]
    newSelected[index] = countryName === 'None' ? null : countryName
    setSelectedCountries(newSelected)
  }

  const toggleAttribute = (attribute) => {
    setSelectedAttributes((prev) =>
      prev.includes(attribute) ? prev.filter((a) => a !== attribute) : [...prev, attribute]
    )
  }

  const allAvailableAttributes = [
    'languages',
    'population',
    'currency',
    'area',
    'head_of_state',
    'gdp_usd_billion',
    'gross_debt_pct_gdp',
    'exchange_rate_usd',
    'inflation_cpi_pct',
    'gross_debt_usd_billion',
    'historical_events',
    'sport',
  ]

  const activeCountries = selectedCountriesData.filter((c) => c !== null && c !== undefined)
  const canCompare = activeCountries.length >= 2

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Compare Countries' }]} />
      <h1>Compare Countries</h1>

      <div className="compare-controls">
        <div className="country-selectors">
          <h3>Select Countries (up to 5)</h3>
          <div className="selectors-grid">
            {selectedCountries.map((country, index) => (
              <CompareCountrySelector
                key={index}
                value={country}
                onChange={(name) => handleCountryChange(index, name)}
                allCountries={allCountries}
                selectedCountries={selectedCountries}
              />
            ))}
          </div>
        </div>

        <div className="attribute-selectors">
          <h3>Attributes to Compare</h3>
          <div className="attributes-list">
            {allAvailableAttributes.map((attr) => (
              <label key={attr} className="attribute-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAttributes.includes(attr)}
                  onChange={() => toggleAttribute(attr)}
                />
                <span>{attr.replace(/_/g, ' ').toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="charts-toggle">
          <label className="chart-checkbox">
            <input type="checkbox" checked={includeCharts} onChange={(e) => setIncludeCharts(e.target.checked)} />
            <span>Include Economics Charts</span>
          </label>
        </div>
      </div>

      {!canCompare && (
        <div className="compare-error">
          <p>Please select at least 2 countries to compare.</p>
        </div>
      )}

      {canCompare && (
        <>
          <CompareTable countries={activeCountries} attributes={selectedAttributes} />

          {includeCharts && <CompareCharts countries={activeCountries} />}

          {(selectedAttributes.includes('historical_events') || selectedAttributes.includes('sport')) && (
            <CompareEvents countries={activeCountries} />
          )}
        </>
      )}
    </div>
  )
}
