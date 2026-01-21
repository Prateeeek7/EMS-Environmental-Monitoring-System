import React, { useState, useEffect } from 'react'
import { Box, Paper, Typography, TextField, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { AlertTriangle, Save } from 'lucide-react'
import { predictionsAPI } from '../../services/api'

function Alerts() {
  const [thresholds, setThresholds] = useState({
    temperature_min: 15,
    temperature_max: 30,
    humidity_min: 40,
    humidity_max: 80,
    gas_max: 300
  })
  const [anomalies, setAnomalies] = useState([])

  useEffect(() => {
    fetchAnomalies()
    const interval = setInterval(fetchAnomalies, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const fetchAnomalies = async () => {
    try {
      const response = await predictionsAPI.getAnomalies(24)
      setAnomalies(response.data.anomalies || [])
    } catch (error) {
      console.error('Error fetching anomalies:', error)
    }
  }

  const handleSave = () => {
    // Save thresholds to backend (implement API endpoint)
    localStorage.setItem('alertThresholds', JSON.stringify(thresholds))
    alert('Thresholds saved successfully')
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
        Alert Configuration
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Threshold Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Temperature Min (°C)"
              type="number"
              value={thresholds.temperature_min}
              onChange={(e) => setThresholds({ ...thresholds, temperature_min: parseFloat(e.target.value) })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Temperature Max (°C)"
              type="number"
              value={thresholds.temperature_max}
              onChange={(e) => setThresholds({ ...thresholds, temperature_max: parseFloat(e.target.value) })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Humidity Min (%)"
              type="number"
              value={thresholds.humidity_min}
              onChange={(e) => setThresholds({ ...thresholds, humidity_min: parseFloat(e.target.value) })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Humidity Max (%)"
              type="number"
              value={thresholds.humidity_max}
              onChange={(e) => setThresholds({ ...thresholds, humidity_max: parseFloat(e.target.value) })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Gas Level Max (/1024)"
              type="number"
              value={thresholds.gas_max}
              onChange={(e) => setThresholds({ ...thresholds, gas_max: parseFloat(e.target.value) })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<Save size={20} />}
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#333333' }
              }}
            >
              Save Thresholds
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Detected Anomalies (Last 24 Hours)
        </Typography>
        {anomalies.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Temperature</TableCell>
                  <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Humidity</TableCell>
                  <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Gas Level</TableCell>
                  <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Anomaly Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {anomalies.slice(0, 20).map((anomaly, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ color: '#000000' }}>{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: '#000000' }}>{anomaly.temperature?.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: '#000000' }}>{anomaly.humidity?.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: '#000000' }}>{anomaly.gas_analog}</TableCell>
                    <TableCell align="right" sx={{ color: '#e74c3c' }}>{anomaly.anomaly_score?.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ color: '#666666' }}>No anomalies detected in the last 24 hours.</Typography>
        )}
      </Paper>
    </Box>
  )
}

export default Alerts
