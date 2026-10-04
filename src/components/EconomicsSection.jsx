import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import DefinitionsModal from './DefinitionsModal'
import ChartModal from './ChartModal'
import '../styles/EconomicsSection.css'

function LineChart({ data, yKey, title, containerRef, onClick }) {
  const filteredData = data.filter((d) => d[yKey] !== null && d[yKey] !== undefined)
  const latestEntry = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    const filteredDataEffect = data.filter((d) => d[yKey] !== null && d[yKey] !== undefined)
    if (filteredDataEffect.length === 0) return

    const margin = { top: 20, right: 20, bottom: 30, left: 50 }
    const width = containerRef.current.clientWidth - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const svg = d3
      .select(containerRef.current)
      .html('')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(filteredDataEffect, (d) => d.year))
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredDataEffect, (d) => d[yKey])])
      .range([height, 0])

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[yKey]))

    svg
      .append('path')
      .datum(filteredDataEffect)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 2)
      .attr('d', line)

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'))
    const yAxis = d3.axisLeft(yScale)

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .style('color', 'var(--text)')
      .call(xAxis)

    svg.append('g').style('color', 'var(--text)').call(yAxis)

    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'var(--bg-raised)')
      .style('color', 'var(--text-h)')
      .style('border', '1px solid var(--border)')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('opacity', 0)

    svg
      .selectAll('.dot')
      .data(filteredDataEffect)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.year))
      .attr('cy', (d) => yScale(d[yKey]))
      .attr('r', 4)
      .attr('fill', 'var(--accent)')
      .attr('class', 'dot')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.year}</strong><br/>${yKey}: ${d[yKey].toFixed(2)}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px')
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0)
      })

    return () => {
      tooltip.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, yKey])

  return (
    <div className="chart-container" onClick={onClick} style={{ cursor: 'pointer' }}>
      {latestEntry && (
        <div className="chart-stat">
          <span className="stat-year">{latestEntry.year}</span>
          <span className="stat-value">{latestEntry[yKey].toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      )}
      <h4>{title}</h4>
      <div className="chart" ref={containerRef} />
    </div>
  )
}

function BarChart({ data, yKey, title, containerRef, onClick }) {
  const filteredData = data.filter((d) => d[yKey] !== null && d[yKey] !== undefined)
  const latestEntry = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    const filteredDataEffect = data.filter((d) => d[yKey] !== null && d[yKey] !== undefined)
    if (filteredDataEffect.length === 0) return

    const margin = { top: 20, right: 20, bottom: 30, left: 50 }
    const width = containerRef.current.clientWidth - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const svg = d3
      .select(containerRef.current)
      .html('')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3
      .scaleBand()
      .domain(filteredDataEffect.map((d) => d.year))
      .range([0, width])
      .padding(0.1)

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredDataEffect, (d) => d[yKey])])
      .range([height, 0])

    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'var(--bg-raised)')
      .style('color', 'var(--text-h)')
      .style('border', '1px solid var(--border)')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('opacity', 0)

    svg
      .selectAll('.bar')
      .data(filteredDataEffect)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.year))
      .attr('y', (d) => yScale(d[yKey]))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height - yScale(d[yKey]))
      .attr('fill', 'var(--accent)')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 0.8)
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.year}</strong><br/>${yKey}: ${d[yKey].toFixed(2)}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1)
        tooltip.style('opacity', 0)
      })

    const xAxis = d3.axisBottom(xScale).tickFormat((d) => d)
    const yAxis = d3.axisLeft(yScale)

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .style('color', 'var(--text)')
      .call(xAxis)

    svg.append('g').style('color', 'var(--text)').call(yAxis)

    return () => {
      tooltip.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, yKey])

  return (
    <div className="chart-container" onClick={onClick} style={{ cursor: 'pointer' }}>
      {latestEntry && (
        <div className="chart-stat">
          <span className="stat-year">{latestEntry.year}</span>
          <span className="stat-value">{latestEntry[yKey].toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      )}
      <h4>{title}</h4>
      <div className="chart" ref={containerRef} />
    </div>
  )
}

function HistoricalEvents({ economics }) {
  const [expanded, setExpanded] = useState(false)

  if (!economics || economics.length === 0) {
    return (
      <div className="historical-events">
        <h4>Historical Events</h4>
        <p className="no-data">Data not available</p>
      </div>
    )
  }

  const yearsWithEvents = economics
    .filter((e) => e.main_events && e.main_events.length > 0)
    .map((e) => ({ year: e.year, events: e.main_events }))
    .sort((a, b) => b.year - a.year)

  if (yearsWithEvents.length === 0) {
    return (
      <div className="historical-events">
        <h4>Historical Events</h4>
        <p className="no-data">Data not available</p>
      </div>
    )
  }

  const displayedYears = expanded ? yearsWithEvents : yearsWithEvents.slice(0, 2)
  const hasMore = yearsWithEvents.length > 2

  return (
    <div className="historical-events">
      <h4>Historical Events</h4>
      <div className="events-list">
        {displayedYears.map((yearData) => (
          <div key={yearData.year} className="year-events">
            <h5>{yearData.year}</h5>
            <ul className="events">
              {yearData.events.map((event, i) => (
                <li key={i}>
                  <strong>{event.headline}</strong>
                  <p>{event.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className="more-button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : 'More...'}
        </button>
      )}
    </div>
  )
}

export default function EconomicsSection({ economics }) {
  const lineChartRef1 = useRef(null)
  const lineChartRef2 = useRef(null)
  const lineChartRef3 = useRef(null)
  const barChartRef1 = useRef(null)
  const barChartRef2 = useRef(null)
  const barChartRef3 = useRef(null)
  const [showDefinitions, setShowDefinitions] = useState(false)
  const [selectedChart, setSelectedChart] = useState(null)

  if (!economics || economics.length === 0) return null

  const hasPopulationData = economics.some((e) => e.population !== undefined && e.population !== null)
  const hasExchangeRateData = economics.some((e) => e.exchange_rate_usd !== undefined && e.exchange_rate_usd !== null)

  return (
    <section className="detail-section">
      <div className="section-header">
        <h3>Economics</h3>
        <button
          type="button"
          className="definitions-link"
          onClick={() => setShowDefinitions(true)}
        >
          Understanding these charts
        </button>
      </div>
      <div className="charts-grid">
        <LineChart
          data={economics}
          yKey="gdp_usd_billion"
          title="GDP (USD Billion)"
          containerRef={lineChartRef1}
          onClick={() =>
            setSelectedChart({ type: 'line', data: economics, yKey: 'gdp_usd_billion', title: 'GDP (USD Billion)' })
          }
        />
        <LineChart
          data={economics}
          yKey="gross_debt_pct_gdp"
          title="Gross Debt (% of GDP)"
          containerRef={lineChartRef2}
          onClick={() =>
            setSelectedChart({
              type: 'line',
              data: economics,
              yKey: 'gross_debt_pct_gdp',
              title: 'Gross Debt (% of GDP)',
            })
          }
        />
        {hasExchangeRateData && (
          <LineChart
            data={economics}
            yKey="exchange_rate_usd"
            title="Exchange Rate (per USD)"
            containerRef={lineChartRef3}
            onClick={() =>
              setSelectedChart({
                type: 'line',
                data: economics,
                yKey: 'exchange_rate_usd',
                title: 'Exchange Rate (per USD)',
              })
            }
          />
        )}
        <BarChart
          data={economics}
          yKey="gross_debt_usd_billion"
          title="Gross Debt (USD Billion)"
          containerRef={barChartRef1}
          onClick={() =>
            setSelectedChart({
              type: 'bar',
              data: economics,
              yKey: 'gross_debt_usd_billion',
              title: 'Gross Debt (USD Billion)',
            })
          }
        />
        <BarChart
          data={economics}
          yKey="inflation_cpi_pct"
          title="Inflation (CPI %)"
          containerRef={barChartRef2}
          onClick={() =>
            setSelectedChart({
              type: 'bar',
              data: economics,
              yKey: 'inflation_cpi_pct',
              title: 'Inflation (CPI %)',
            })
          }
        />
        {hasPopulationData && (
          <BarChart
            data={economics}
            yKey="population"
            title="Population"
            containerRef={barChartRef3}
            onClick={() =>
              setSelectedChart({
                type: 'bar',
                data: economics,
                yKey: 'population',
                title: 'Population',
              })
            }
          />
        )}
      </div>

      <HistoricalEvents economics={economics} />

      {showDefinitions && <DefinitionsModal onClose={() => setShowDefinitions(false)} />}

      {selectedChart && <ChartModal chart={selectedChart} onClose={() => setSelectedChart(null)} />}
    </section>
  )
}
