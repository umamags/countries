import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import '../styles/EconomicsSection.css'

function LineChart({ data, yKey, title, containerRef }) {
  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    const filteredData = data.filter((d) => d[yKey] !== null && d[yKey] !== undefined)
    if (filteredData.length === 0) return

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
      .domain(d3.extent(filteredData, (d) => d.year))
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d[yKey])])
      .range([height, 0])

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[yKey]))

    svg
      .append('path')
      .datum(filteredData)
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
      .data(filteredData)
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
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="chart" ref={containerRef} />
    </div>
  )
}

function BarChart({ data, yKey, title, containerRef }) {
  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    const filteredData = data.filter((d) => d[yKey] !== null && d[yKey] !== undefined)
    if (filteredData.length === 0) return

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
      .domain(filteredData.map((d) => d.year))
      .range([0, width])
      .padding(0.1)

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d[yKey])])
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
      .data(filteredData)
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
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="chart" ref={containerRef} />
    </div>
  )
}

export default function EconomicsSection({ economics }) {
  const lineChartRef1 = useRef(null)
  const lineChartRef2 = useRef(null)
  const barChartRef1 = useRef(null)
  const barChartRef2 = useRef(null)

  if (!economics || economics.length === 0) return null

  return (
    <section className="detail-section">
      <h3>Economics</h3>
      <div className="charts-grid">
        <LineChart data={economics} yKey="gdp_usd_billion" title="GDP (USD Billion)" containerRef={lineChartRef1} />
        <LineChart
          data={economics}
          yKey="gross_debt_pct_gdp"
          title="Gross Debt (% of GDP)"
          containerRef={lineChartRef2}
        />
        <BarChart
          data={economics}
          yKey="gross_debt_usd_billion"
          title="Gross Debt (USD Billion)"
          containerRef={barChartRef1}
        />
        <BarChart data={economics} yKey="inflation_cpi_pct" title="Inflation (CPI %)" containerRef={barChartRef2} />
      </div>
    </section>
  )
}
