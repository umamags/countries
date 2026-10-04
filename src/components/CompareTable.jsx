import { Link } from 'react-router-dom'

export default function CompareTable({ countries, attributes }) {
  const getAttributeValue = (country, attribute) => {
    if (attribute === 'historical_events' || attribute === 'sport' || attribute === 'national_anthem') {
      return '—'
    }

    // Special handling for GDP and exchange rate - get from latest year in economics
    if (attribute === 'gdp_usd_billion' || attribute === 'exchange_rate_usd') {
      const economics = country.economics || []
      const latest = economics.length > 0 ? economics[economics.length - 1] : null
      const value = latest ? latest[attribute] : null
      if (value === null || value === undefined) return 'N/A'
      return value.toFixed(2)
    }

    const value = country[attribute]

    if (value === null || value === undefined) return 'N/A'
    if (attribute === 'languages' && Array.isArray(value)) return value.join(', ')
    if (attribute === 'population' || attribute === 'area') {
      return value
    }
    if (typeof value === 'number') return value.toFixed(2)
    return value
  }

  const attributeLabels = {
    languages: 'Languages',
    population: 'Population (in millions)',
    currency: 'Currency',
    area: 'Area (km²)',
    head_of_state: 'Head of State',
    gdp_usd_billion: 'GDP (USD Billion)',
    gross_debt_pct_gdp: 'Gross Debt (% of GDP)',
    exchange_rate_usd: 'Exchange Rate (per USD)',
    inflation_cpi_pct: 'Inflation (CPI %)',
    gross_debt_usd_billion: 'Gross Debt (USD Billion)',
    national_anthem: 'National Anthem',
    national_animal: 'National Animal',
    national_bird: 'National Bird',
    historical_events: 'Historical Events',
    sport: 'Sports',
  }

  return (
    <div className="compare-section">
      <h2>Comparison Table</h2>
      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Attribute</th>
              {countries.map((country) => (
                <th key={country.name}>
                  <Link to={`/continent/${country.continent.toLowerCase().replace(/\s+/g, '-')}/country/${country.slug}`}>
                    {country.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attribute) => (
              <tr key={attribute}>
                <td className="attribute-name">{attributeLabels[attribute] || attribute}</td>
                {countries.map((country) => (
                  <td key={country.name} className="attribute-value">
                    {getAttributeValue(country, attribute)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
