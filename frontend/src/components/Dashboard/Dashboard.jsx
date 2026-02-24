import React, { useState, useEffect } from 'react'
import { Box, Grid, Paper, Typography } from '@mui/material'
import { sensorDataAPI } from '../../services/api'
import RealTimeCharts from '../Charts/RealTimeCharts'
import MetricCard from './MetricCard'

function Dashboard() {
  const [latestData, setLatestData] = useState(null)
  const [sensorData, setSensorData] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchLatestData()
    fetchStats()
    const interval = setInterval(() => {
      fetchLatestData()
      fetchStats()
    }, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchLatestData = async () => {
    try {
      const response = await sensorDataAPI.getLatest()
      setLatestData(response.data)
    } catch (error) {
      console.error('Error fetching latest data:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await sensorDataAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
          Current Readings
        </Typography>

        {latestData && (
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Temperature"
                value={latestData.temperature}
                unit="°C"
                color="#ff6b6b"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Humidity"
                value={latestData.humidity}
                unit="%"
                color="#4ecdc4"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Gas Level"
                value={latestData.gas_analog}
                unit="/1024"
                color="#95e1d3"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Light Level (LDR)"
                value={latestData.light_level}
                unit="/1024"
                color="#636e72"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Soil Moisture"
                value={latestData.soil_moisture}
                unit="/1024"
                color="#2d3436"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                title="Last Update"
                value={new Date(latestData.timestamp).toLocaleTimeString()}
                unit=""
                color="#000000"
              />
            </Grid>
          </Grid>
        )}

        {stats && (
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#000000', mb: 1.5 }}>
              Statistics (Last 24 Hours)
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Typography variant="caption" sx={{ color: '#666666', display: 'block' }}>Temperature</Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>
                  Avg: {stats.temperature?.average?.toFixed(1) ?? '—'}°C | Min: {stats.temperature?.min?.toFixed(1) ?? '—'}°C | Max: {stats.temperature?.max?.toFixed(1) ?? '—'}°C
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Typography variant="caption" sx={{ color: '#666666', display: 'block' }}>Humidity</Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>
                  Avg: {stats.humidity?.average?.toFixed(1) ?? '—'}% | Min: {stats.humidity?.min?.toFixed(1) ?? '—'}% | Max: {stats.humidity?.max?.toFixed(1) ?? '—'}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Typography variant="caption" sx={{ color: '#666666', display: 'block' }}>Gas Level</Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>
                  Avg: {stats.gas?.average?.toFixed(0) ?? '—'} | Max: {stats.gas?.max?.toFixed(0) ?? '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Typography variant="caption" sx={{ color: '#666666', display: 'block' }}>Light Level (LDR)</Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>
                  Avg: {stats.light_level?.average?.toFixed(0) ?? '—'} | Max: {stats.light_level?.max?.toFixed(0) ?? '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Typography variant="caption" sx={{ color: '#666666', display: 'block' }}>Soil Moisture</Typography>
                <Typography variant="body2" sx={{ color: '#000000' }}>
                  Avg: {stats.soil_moisture?.average?.toFixed(0) ?? '—'} | Max: {stats.soil_moisture?.max?.toFixed(0) ?? '—'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        <RealTimeCharts />
    </Box>
  )
}

export default Dashboard
