import React from 'react'
import { Paper, Box, Typography } from '@mui/material'
import Plot from 'react-plotly.js'

function BoxPlot({ data, metric, title, groupBy = null }) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography sx={{ color: '#666666' }}>No data available for box plot</Typography>
      </Paper>
    )
  }

  const metricLabels = {
    temperature: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    gas_analog: 'Gas Level (/1024)',
    gas_digital: 'Gas Level (Digital)'
  }

  let plotData = []

  if (groupBy) {
    // Group data by specified field
    const groups = {}
    data.forEach(item => {
      const groupValue = item[groupBy]
      if (!groups[groupValue]) {
        groups[groupValue] = []
      }
      const value = item[metric]
      if (value !== null && value !== undefined && !isNaN(value)) {
        groups[groupValue].push(value)
      }
    })

    // Create box plot for each group
    Object.keys(groups).sort().forEach(groupName => {
      plotData.push({
        y: groups[groupName],
        type: 'box',
        name: groupName,
        boxmean: 'sd',
        marker: { color: '#95e1d3' }
      })
    })
  } else {
    // Single box plot
    const values = data
      .map(item => item[metric])
      .filter(val => val !== null && val !== undefined && !isNaN(val))
    
    plotData = [{
      y: values,
      type: 'box',
      name: metricLabels[metric] || metric,
      boxmean: 'sd',
      marker: { color: '#ff6b6b' }
    }]
  }

  return (
    <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
        {title || `Distribution: ${metricLabels[metric] || metric}`}
      </Typography>
      <Plot
        data={plotData}
        layout={{
          title: '',
          yaxis: { title: metricLabels[metric] || metric, color: '#000000' },
          xaxis: { title: groupBy || '', color: '#000000' },
          plot_bgcolor: '#ffffff',
          paper_bgcolor: '#ffffff',
          font: { color: '#000000' },
          showlegend: groupBy ? true : false,
          height: 400,
          margin: { l: 60, r: 60, t: 20, b: 60 }
        }}
        style={{ width: '100%', height: '400px' }}
      />
    </Paper>
  )
}

export default BoxPlot
