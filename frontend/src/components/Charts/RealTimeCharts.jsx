import React, { useState, useEffect } from 'react'
import { Paper, Box, Typography } from '@mui/material'
import Plot from 'react-plotly.js'
import { sensorDataAPI } from '../../services/api'

function RealTimeCharts() {
  const [sensorData, setSensorData] = useState([])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const response = await sensorDataAPI.getAll(500)
      const data = response.data.map(item => ({
        timestamp: new Date(item.timestamp),
        temperature: item.temperature,
        humidity: item.humidity,
        gas_analog: item.gas_analog
      }))
      setSensorData(data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  if (sensorData.length === 0) {
    return (
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography sx={{ color: '#666666' }}>Loading data...</Typography>
      </Paper>
    )
  }

  const timestamps = sensorData.map(d => d.timestamp)
  const temperatures = sensorData.map(d => d.temperature)
  const humidities = sensorData.map(d => d.humidity)
  const gasLevels = sensorData.map(d => d.gas_analog)

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Temperature and Humidity Trends
        </Typography>
        <Plot
          data={[
            {
              x: timestamps,
              y: temperatures,
              type: 'scatter',
              mode: 'lines',
              name: 'Temperature',
              line: { color: '#ff6b6b', width: 2 },
              yaxis: 'y'
            },
            {
              x: timestamps,
              y: humidities,
              type: 'scatter',
              mode: 'lines',
              name: 'Humidity',
              line: { color: '#4ecdc4', width: 2 },
              yaxis: 'y2'
            }
          ]}
          layout={{
            title: '',
            xaxis: { title: 'Time', color: '#000000' },
            yaxis: { title: 'Temperature (°C)', side: 'left', color: '#ff6b6b' },
            yaxis2: { title: 'Humidity (%)', side: 'right', overlaying: 'y', color: '#4ecdc4' },
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

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Gas Level Trends
        </Typography>
        <Plot
          data={[
            {
              x: timestamps,
              y: gasLevels,
              type: 'scatter',
              mode: 'lines',
              name: 'Gas Level',
              line: { color: '#95e1d3', width: 2 },
              fill: 'tozeroy',
              fillcolor: 'rgba(149, 225, 211, 0.2)'
            }
          ]}
          layout={{
            title: '',
            xaxis: { title: 'Time', color: '#000000' },
            yaxis: { title: 'Gas Level (/1024)', color: '#000000' },
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
    </Box>
  )
}

export default RealTimeCharts
