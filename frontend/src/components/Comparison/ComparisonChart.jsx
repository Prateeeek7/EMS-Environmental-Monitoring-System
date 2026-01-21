import React from 'react'
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import Plot from 'react-plotly.js'

function ComparisonChart({ data }) {
  if (!data || !data.time_series) {
    return <Typography sx={{ color: '#666666' }}>No data available for comparison</Typography>
  }

  const deviceIds = data.device_ids || []
  const timeSeries = data.time_series || {}
  const statistics = data.statistics || {}

  // Prepare plot data for temperature
  const temperatureData = deviceIds.map(deviceId => {
    const deviceData = timeSeries[deviceId]
    if (!deviceData) return null
    return {
      x: deviceData.timestamps,
      y: deviceData.temperature,
      type: 'scatter',
      mode: 'lines',
      name: `Device ${deviceId}`,
      line: { width: 2 }
    }
  }).filter(Boolean)

  // Prepare plot data for humidity
  const humidityData = deviceIds.map(deviceId => {
    const deviceData = timeSeries[deviceId]
    if (!deviceData) return null
    return {
      x: deviceData.timestamps,
      y: deviceData.humidity,
      type: 'scatter',
      mode: 'lines',
      name: `Device ${deviceId}`,
      line: { width: 2 }
    }
  }).filter(Boolean)

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Temperature Comparison
        </Typography>
        <Plot
          data={temperatureData}
          layout={{
            title: '',
            xaxis: { title: 'Time', color: '#000000' },
            yaxis: { title: 'Temperature (°C)', color: '#000000' },
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

      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Humidity Comparison
        </Typography>
        <Plot
          data={humidityData}
          layout={{
            title: '',
            xaxis: { title: 'Time', color: '#000000' },
            yaxis: { title: 'Humidity (%)', color: '#000000' },
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
          Statistics Comparison
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Device</TableCell>
                <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Temp Mean</TableCell>
                <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Temp Std</TableCell>
                <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Humidity Mean</TableCell>
                <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Humidity Std</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deviceIds.map(deviceId => {
                const stats = statistics[deviceId]
                if (!stats) return null
                return (
                  <TableRow key={deviceId}>
                    <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Device {deviceId}</TableCell>
                    <TableCell align="right" sx={{ color: '#000000' }}>
                      {stats.temperature?.mean?.toFixed(2) || '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#000000' }}>
                      {stats.temperature?.std?.toFixed(2) || '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#000000' }}>
                      {stats.humidity?.mean?.toFixed(2) || '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#000000' }}>
                      {stats.humidity?.std?.toFixed(2) || '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default ComparisonChart
