import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import AidLoansDefinitionsModal from './AidLoansDefinitionsModal'
import ChartModal from './ChartModal'
import '../styles/AidLoansSection.css'

function BarChart({ data, containerRef, onClick }) {
  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    const filteredDataEffect = data.filter(
      (d) => d.oda_received_usd_million !== null && d.oda_received_usd_million !== undefined
    )
    if (filteredDataEffect.length === 0) return

    const margin = { top: 20, right: 20, bottom: 30, left: 60 }
    const width = containerRef.current.clientWidth - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const svg = d3
      .select(containerRef.current)
      .html('')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('style', 'cursor: pointer')
      .on('click', onClick)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3
      .scaleBand()
      .domain(filteredDataEffect.map((d) => d.year))
      .range([0, width])
      .padding(0.2)

    const minValue = Math.min(
      0,
      d3.min(filteredDataEffect, (d) => d.oda_loans_net_usd_million || 0)
    )
    const maxValue = d3.max(filteredDataEffect, (d) => d.oda_received_usd_million || 0)

    const yScale = d3.scaleLinear().domain([minValue, maxValue]).range([height, 0])

    // ODA Received bars (larger)
    svg
      .selectAll('.bar-received')
      .data(filteredDataEffect)
      .enter()
      .append('rect')
      .attr('class', 'bar-received')
      .attr('x', (d) => xScale(d.year))
      .attr('y', (d) => yScale(Math.max(0, d.oda_received_usd_million || 0)))
      .attr('width', xScale.bandwidth() / 2)
      .attr('height', (d) => height - yScale(Math.max(0, d.oda_received_usd_million || 0)))
      .attr('fill', 'var(--accent)')

    // ODA Loans bars (smaller)
    svg
      .selectAll('.bar-loans')
      .data(filteredDataEffect)
      .enter()
      .append('rect')
      .attr('class', 'bar-loans')
      .attr('x', (d) => xScale(d.year) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(Math.max(0, d.oda_loans_net_usd_million || 0)))
      .attr('width', xScale.bandwidth() / 2)
      .attr('height', (d) => height - yScale(Math.max(0, d.oda_loans_net_usd_million || 0)))
      .attr('fill', 'var(--accent-muted)')

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .style('color', 'var(--text)')
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '11px')

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
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000')

    // Add interactivity to received bars
    svg
      .selectAll('.bar-received')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.year}</strong><br/>ODA Received: $${(d.oda_received_usd_million || 0).toFixed(1)}M`
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px')
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0)
      })

    // Add interactivity to loans bars
    svg
      .selectAll('.bar-loans')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.year}</strong><br/>ODA Loans (net): $${(d.oda_loans_net_usd_million || 0).toFixed(1)}M`
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px')
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0)
      })

    return () => {
      tooltip.remove()
    }
  }, [data, onClick])
}

export default function AidLoansSection({ aid }) {
  const containerRef = useRef(null)
  const [showDefinitions, setShowDefinitions] = useState(false)
  const [expandedChart, setExpandedChart] = useState(null)

  if (!aid || aid.length === 0) {
    return null
  }

  const handleChartClick = () => {
    setExpandedChart({
      type: 'bar',
      data: aid,
      title: 'Aid and Loans',
      yKey: 'oda_received_usd_million',
    })
  }

  return (
    <section className="detail-section aid-loans-section">
      <div className="aid-loans-header">
        <h3>Aid and Loans</h3>
        <button
          type="button"
          className="definitions-button"
          onClick={() => setShowDefinitions(true)}
          title="What is this chart?"
        >
          ?
        </button>
      </div>

      <div className="chart-container" ref={containerRef}>
        <BarChart data={aid} containerRef={containerRef} onClick={handleChartClick} />
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'var(--accent)' }}></span>
          <span>ODA Received (USD million)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'var(--accent-muted)' }}></span>
          <span>ODA Loans (net, USD million)</span>
        </div>
      </div>

      {showDefinitions && <AidLoansDefinitionsModal onClose={() => setShowDefinitions(false)} />}

      {expandedChart && <ChartModal chart={expandedChart} onClose={() => setExpandedChart(null)} />}
    </section>
  )
}
