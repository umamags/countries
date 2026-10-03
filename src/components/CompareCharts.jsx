import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import '../styles/CompareCharts.css'

function CombinedLineChart({ countries, yKey, title, containerRef }) {
  useEffect(() => {
    if (!countries || countries.length === 0 || !containerRef.current) return

    const margin = { top: 20, right: 20, bottom: 30, left: 60 }
    const width = containerRef.current.clientWidth - margin.left - margin.right
    const height = 280 - margin.top - margin.bottom

    const svg = d3
      .select(containerRef.current)
      .html('')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Prepare combined data
    const allYears = new Set()
    countries.forEach((c) => {
      c.economics?.forEach((e) => {
        if (e[yKey] !== null && e[yKey] !== undefined) allYears.add(e.year)
      })
    })

    const years = Array.from(allYears).sort((a, b) => a - b)
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(countries.map((c) => c.name))

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, width])

    const allValues = []
    countries.forEach((c) => {
      c.economics?.forEach((e) => {
        if (e[yKey] !== null && e[yKey] !== undefined) allValues.push(e[yKey])
      })
    })

    const yScale = d3.scaleLinear().domain([0, d3.max(allValues)]).range([height, 0])

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[yKey]))

    // Draw lines for each country
    countries.forEach((country) => {
      const data = (country.economics || []).filter((d) => d[yKey] !== null && d[yKey] !== undefined)
      if (data.length === 0) return

      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', colorScale(country.name))
        .attr('stroke-width', 2)
        .attr('d', line)
    })

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'))
    const yAxis = d3.axisLeft(yScale)

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .style('color', 'var(--text)')
      .call(xAxis)

    svg.append('g').style('color', 'var(--text)').call(yAxis)

    // Legend
    const legend = svg
      .selectAll('.legend')
      .data(countries)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(0,${i * 20})`)

    legend
      .append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', (d) => colorScale(d.name))

    legend
      .append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', 'var(--text-h)')
      .text((d) => d.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, yKey])

  return (
    <div className="compare-chart-container">
      <h4>{title}</h4>
      <div className="compare-chart" ref={containerRef} />
    </div>
  )
}

function CombinedBarChart({ countries, yKey, title, containerRef }) {
  useEffect(() => {
    if (!countries || countries.length === 0 || !containerRef.current) return

    const margin = { top: 20, right: 20, bottom: 30, left: 60 }
    const width = containerRef.current.clientWidth - margin.left - margin.right
    const height = 280 - margin.top - margin.bottom

    const svg = d3
      .select(containerRef.current)
      .html('')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Prepare data - latest year for each country
    const data = countries
      .map((c) => {
        const econ = c.economics || []
        const latest = econ.length > 0 ? econ[econ.length - 1] : null
        return latest && latest[yKey] !== null && latest[yKey] !== undefined
          ? { name: c.name, year: latest.year, value: latest[yKey] }
          : null
      })
      .filter(Boolean)

    if (data.length === 0) return

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(countries.map((c) => c.name))

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, width])
      .padding(0.1)

    const yScale = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value)]).range([height, 0])

    svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.name))
      .attr('y', (d) => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height - yScale(d.value))
      .attr('fill', (d) => colorScale(d.name))

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .style('color', 'var(--text)')
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px')

    svg.append('g').style('color', 'var(--text)').call(yAxis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, yKey])

  return (
    <div className="compare-chart-container">
      <h4>{title}</h4>
      <div className="compare-chart" ref={containerRef} />
    </div>
  )
}

export default function CompareCharts({ countries }) {
  const refs = {
    gdp: useRef(null),
    debt: useRef(null),
    exchange: useRef(null),
    debtUsd: useRef(null),
    inflation: useRef(null),
    population: useRef(null),
  }

  return (
    <div className="compare-section">
      <h2>Economics Charts</h2>
      <div className="compare-charts-grid">
        <CombinedLineChart countries={countries} yKey="gdp_usd_billion" title="GDP (USD Billion)" containerRef={refs.gdp} />
        <CombinedLineChart
          countries={countries}
          yKey="gross_debt_pct_gdp"
          title="Gross Debt (% of GDP)"
          containerRef={refs.debt}
        />
        <CombinedLineChart
          countries={countries}
          yKey="exchange_rate_usd"
          title="Exchange Rate (per USD)"
          containerRef={refs.exchange}
        />
        <CombinedBarChart
          countries={countries}
          yKey="gross_debt_usd_billion"
          title="Gross Debt (USD Billion)"
          containerRef={refs.debtUsd}
        />
        <CombinedBarChart countries={countries} yKey="inflation_cpi_pct" title="Inflation (CPI %)" containerRef={refs.inflation} />
        <CombinedBarChart countries={countries} yKey="population" title="Population" containerRef={refs.population} />
      </div>
    </div>
  )
}
