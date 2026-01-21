import React from 'react'
import { Paper, Box, Typography } from '@mui/material'
import Plot from 'react-plotly.js'

function ScatterPlot({ data, xMetric, yMetric, title, showRegression = true }) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography sx={{ color: '#666666' }}>No data available for scatter plot</Typography>
      </Paper>
    )
  }

  // Extract data
  const xData = data.map(item => item[xMetric]).filter(val => val !== null && val !== undefined && !isNaN(val))
  const yData = data.map(item => item[yMetric]).filter(val => val !== null && val !== undefined && !isNaN(val))
  
  // Filter to matching lengths
  const filteredData = data.filter(item => 
    item[xMetric] !== null && item[xMetric] !== undefined && !isNaN(item[xMetric]) &&
    item[yMetric] !== null && item[yMetric] !== undefined && !isNaN(item[yMetric])
  )
  
  const x = filteredData.map(item => item[xMetric])
  const y = filteredData.map(item => item[yMetric])

  // Calculate regression line (simple linear regression)
  const calculateRegression = (x, y) => {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept
      return sum + (yi - predicted) ** 2
    }, 0)
    const ssTot = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0)
    const rSquared = 1 - (ssRes / ssTot)

    // Generate regression line points
    const minX = Math.min(...x)
    const maxX = Math.max(...x)
    const regX = [minX, maxX]
    const regY = [slope * minX + intercept, slope * maxX + intercept]

    return { regX, regY, slope, intercept, rSquared }
  }

  const plotData = [
    {
      x,
      y,
      type: 'scatter',
      mode: 'markers',
      name: 'Data Points',
      marker: { 
        color: '#ff6b6b',
        size: 8,
        opacity: 0.6
      }
    }
  ]

  if (showRegression && x.length > 1) {
    const regression = calculateRegression(x, y)
    plotData.push({
      x: regression.regX,
      y: regression.regY,
      type: 'scatter',
      mode: 'lines',
      name: `Regression (R² = ${regression.rSquared.toFixed(3)})`,
      line: { 
        color: '#4ecdc4',
        width: 2,
        dash: 'dash'
      }
    })
  }

  const metricLabels = {
    temperature: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    gas_analog: 'Gas Level (/1024)',
    gas_digital: 'Gas Level (Digital)'
  }

  return (
    <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
        {title || `${metricLabels[xMetric] || xMetric} vs ${metricLabels[yMetric] || yMetric}`}
      </Typography>
      <Plot
        data={plotData}
        layout={{
          title: '',
          xaxis: { title: metricLabels[xMetric] || xMetric, color: '#000000' },
          yaxis: { title: metricLabels[yMetric] || yMetric, color: '#000000' },
          plot_bgcolor: '#ffffff',
          paper_bgcolor: '#ffffff',
          font: { color: '#000000' },
          showlegend: true,
          height: 400,
          margin: { l: 60, r: 60, t: 20, b: 60 }
        }}
        style={{ width: '100%', height: '400px' }}
      />
    </Paper>
  )
}

export default ScatterPlot
