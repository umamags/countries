import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function ChartModal({ chart, onClose }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!chart || !containerRef.current) return

    const margin = { top: 20, right: 20, bottom: 30, left: 60 }
    const width = Math.min(window.innerWidth - 100, 900) - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    // Clear previous content
    d3.select(containerRef.current).html('')

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (chart.type === 'line') {
      const filteredData = chart.data.filter((d) => d[chart.yKey] !== null && d[chart.yKey] !== undefined)
      if (filteredData.length === 0) return

      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(filteredData, (d) => d.year))
        .range([0, width])

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => d[chart.yKey])])
        .range([height, 0])

      const line = d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d[chart.yKey]))

      svg
        .append('path')
        .datum(filteredData)
        .attr('fill', 'none')
        .attr('stroke', 'var(--accent)')
        .attr('stroke-width', 2.5)
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
        .style('z-index', '1000')

      svg
        .selectAll('.dot')
        .data(filteredData)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.year))
        .attr('cy', (d) => yScale(d[chart.yKey]))
        .attr('r', 5)
        .attr('fill', 'var(--accent)')
        .attr('class', 'dot')
        .on('mouseover', (event, d) => {
          tooltip
            .style('opacity', 1)
            .html(`<strong>${d.year}</strong><br/>${chart.yKey}: ${d[chart.yKey].toFixed(2)}`)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px')
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0)
        })

      return () => {
        tooltip.remove()
      }
    } else if (chart.type === 'bar') {
      const filteredData = chart.data.filter((d) => d[chart.yKey] !== null && d[chart.yKey] !== undefined)
      if (filteredData.length === 0) return

      const xScale = d3
        .scaleBand()
        .domain(filteredData.map((d) => d.year))
        .range([0, width])
        .padding(0.1)

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, (d) => d[chart.yKey])])
        .range([height, 0])

      svg
        .selectAll('.bar')
        .data(filteredData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => xScale(d.year))
        .attr('y', (d) => yScale(d[chart.yKey]))
        .attr('width', xScale.bandwidth())
        .attr('height', (d) => height - yScale(d[chart.yKey]))
        .attr('fill', 'var(--accent)')

      const xAxis = d3.axisBottom(xScale)
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
        .style('z-index', '1000')

      svg
        .selectAll('.bar')
        .on('mouseover', (event, d) => {
          tooltip
            .style('opacity', 1)
            .html(`<strong>${d.year}</strong><br/>${chart.yKey}: ${d[chart.yKey].toFixed(2)}`)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px')
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0)
        })

      return () => {
        tooltip.remove()
      }
    }
  }, [chart])

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <span className="video-modal-title">{chart.title}</span>
          <button type="button" className="video-modal-close" onClick={onClose} aria-label="Close chart">
            ×
          </button>
        </div>
        <div className="chart-modal-content" ref={containerRef} />
      </div>
    </div>
  )
}
