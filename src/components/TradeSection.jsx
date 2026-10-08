import '../styles/TradeSection.css'

export default function TradeSection({ trade }) {
  if (!trade || (!trade.top_exports && !trade.top_imports)) {
    return null
  }

  return (
    <section className="detail-section trade-section">
      <h3>Trade</h3>

      {trade.top_exports && trade.top_exports.length > 0 && (
        <div className="trade-subsection">
          <h4>Top Exports</h4>
          {trade.total_exports_usd_billion && (
            <p className="trade-total">
              Total exports: <strong>${trade.total_exports_usd_billion.toFixed(2)}B USD</strong> ({trade.year})
            </p>
          )}
          <table className="trade-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>HS Code</th>
                <th>Product</th>
                <th className="trade-value">Value (USD Billion)</th>
              </tr>
            </thead>
            <tbody>
              {trade.top_exports.map((item) => (
                <tr key={item.rank}>
                  <td className="trade-rank">{item.rank}</td>
                  <td className="trade-code">{item.hs_code}</td>
                  <td className="trade-product">{item.product}</td>
                  <td className="trade-value">${item.value_usd_billion.toFixed(2)}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trade.top_imports && trade.top_imports.length > 0 && (
        <div className="trade-subsection">
          <h4>Top Imports</h4>
          {trade.total_imports_usd_billion && (
            <p className="trade-total">
              Total imports: <strong>${trade.total_imports_usd_billion.toFixed(2)}B USD</strong> ({trade.year})
            </p>
          )}
          <table className="trade-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>HS Code</th>
                <th>Product</th>
                <th className="trade-value">Value (USD Billion)</th>
              </tr>
            </thead>
            <tbody>
              {trade.top_imports.map((item) => (
                <tr key={item.rank}>
                  <td className="trade-rank">{item.rank}</td>
                  <td className="trade-code">{item.hs_code}</td>
                  <td className="trade-product">{item.product}</td>
                  <td className="trade-value">${item.value_usd_billion.toFixed(2)}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trade.source && (
        <p className="trade-source">
          <em>Source: {trade.source}</em>
        </p>
      )}
    </section>
  )
}
