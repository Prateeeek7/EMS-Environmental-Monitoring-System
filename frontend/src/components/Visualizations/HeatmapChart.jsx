import React from 'react'
import { Paper, Box, Typography } from '@mui/material'
import Plot from 'react-plotly.js'

function HeatmapChart({ data, title = 'Temporal Heatmap' }) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography sx={{ color: '#666666' }}>No data available for heatmap</Typography>
      </Paper>
    )
  }

  // Process data for heatmap
  const processDataForHeatmap = (data, metric) => {
    const processedData = []
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const days = Array.from({ length: 7 }, (_, i) => i)
    
    // Initialize matrix
    const matrix = Array(7).fill(null).map(() => Array(24).fill(0))
    const counts = Array(7).fill(null).map(() => Array(24).fill(0))
    
    // Fill matrix with data
    data.forEach(item => {
      const date = new Date(item.timestamp)
      const day = date.getDay()
      const hour = date.getHours()
      const value = item[metric]
      
      if (value !== null && value !== undefined && !isNaN(value)) {
        matrix[day][hour] += value
        counts[day][hour] += 1
      }
    })
    
    // Calculate averages
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (counts[d][h] > 0) {
          matrix[d][h] = matrix[d][h] / counts[d][h]
        }
      }
    }
    
    return matrix
  }

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)

  const tempMatrix = processDataForHeatmap(data, 'temperature')
  const humidityMatrix = processDataForHeatmap(data, 'humidity')

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          {title} - Temperature
        </Typography>
        <Plot
          data={[
            {
              z: tempMatrix,
              x: hourLabels,
              y: dayLabels,
              type: 'heatmap',
              colorscale: 'RdBu',
              showscale: true,
              colorbar: {
                title: 'Temperature (°C)',
                titlefont: { color: '#000000' },
                tickfont: { color: '#000000' }
              }
            }
          ]}
          layout={{
            title: '',
            xaxis: { title: 'Hour', color: '#000000' },
            yaxis: { title: 'Day of Week', color: '#000000' },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            font: { color: '#000000' },
            height: 400,
            margin: { l: 100, r: 60, t: 20, b: 60 }
          }}
          style={{ width: '100%', height: '400px' }}
        />
      </Paper>

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          {title} - Humidity
        </Typography>
        <Plot
          data={[
            {
              z: humidityMatrix,
              x: hourLabels,
              y: dayLabels,
              type: 'heatmap',
              colorscale: 'Blues',
              showscale: true,
              colorbar: {
                title: 'Humidity (%)',
                titlefont: { color: '#000000' },
                tickfont: { color: '#000000' }
              }
            }
          ]}
          layout={{
            title: '',
            xaxis: { title: 'Hour', color: '#000000' },
            yaxis: { title: 'Day of Week', color: '#000000' },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            font: { color: '#000000' },
            height: 400,
            margin: { l: 100, r: 60, t: 20, b: 60 }
          }}
          style={{ width: '100%', height: '400px' }}
        />
      </Paper>
    </Box>
  )
}

export default HeatmapChart
