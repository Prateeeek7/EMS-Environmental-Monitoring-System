import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField } from '@mui/material'
import { TrendingUp } from 'lucide-react'
import { predictionsAPI } from '../../services/api'
import Plot from 'react-plotly.js'

const PARAM_CONFIG = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#e74c3c', dash: 'solid' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#3498db', dash: 'dash' },
  { key: 'gas', label: 'Gas', unit: '', color: '#2ecc71', dash: 'dot' },
  { key: 'light_level', label: 'Light', unit: '', color: '#f39c12', dash: 'dashdot' },
  { key: 'soil_moisture', label: 'Soil moisture', unit: '%', color: '#9b59b6', dash: 'longdash' }
]

function normalizeToScale(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return []
  const safe = arr.map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : null))
  const values = safe.filter((v) => v !== null)
  if (values.length === 0) return arr.map(() => 50)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return arr.map((v) => (typeof v === 'number' && Number.isFinite(v) ? ((v - min) / range) * 100 : 50))
}

function Predictions() {
  const [hours, setHours] = useState(24)
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchPredictions = async (target) => {
    try {
      let response
      switch (target) {
        case 'temperature':
          response = await predictionsAPI.predictTemperature(hours)
          break
        case 'humidity':
          response = await predictionsAPI.predictHumidity(hours)
          break
        case 'gas':
          response = await predictionsAPI.predictGas(hours)
          break
        case 'light_level':
          response = await predictionsAPI.predictLightLevel(hours)
          break
        case 'soil_moisture':
          response = await predictionsAPI.predictSoilMoisture(hours)
          break
        default:
          return { target, data: null }
      }
      return { target, data: response?.data ?? null }
    } catch (error) {
      console.error(`Error fetching ${target} predictions:`, error)
      return { target, data: null }
    }
  }

  const handlePredict = async () => {
    setLoading(true)
    setPredictions(null)
    try {
      const results = await Promise.all(
        PARAM_CONFIG.map(({ key }) => fetchPredictions(key))
      )
      const next = {}
      results.forEach(({ target, data }) => {
        if (data) next[target] = data
      })
      setPredictions(next)
    } finally {
      setLoading(false)
    }
  }

  const hasAnyPredictions = predictions && Object.keys(predictions).length > 0

  const plotData = hasAnyPredictions
    ? PARAM_CONFIG.filter(({ key }) => {
        const pred = predictions[key]
        if (!pred || !Array.isArray(pred.predictions) || !Array.isArray(pred.timestamps)) return false
        if (pred.predictions.length === 0 || pred.predictions.length !== pred.timestamps.length) return false
        return true
      }).map(({ key, label, unit, color, dash }) => {
        const pred = predictions[key]
        const yRaw = pred.predictions
        const ts = (pred.timestamps || []).map((t) => new Date(t))
        if (ts.length !== yRaw.length) return null
        const yNorm = normalizeToScale(yRaw)
        const unitStr = unit ? ` ${unit}` : ''
        return {
          x: ts,
          y: yNorm,
          type: 'scatter',
          mode: 'lines',
          name: label,
          line: { color, width: 2.5, dash },
          hovertemplate: `${label}: %{customdata}${unitStr}<extra></extra>`,
          customdata: yRaw.map((v) => (Number.isFinite(Number(v)) ? Number(v).toFixed(2) : '—'))
        }
      }).filter(Boolean)
    : []

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
        Predictive Analytics
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              label="Prediction Horizon (hours)"
              type="number"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 24)}
              inputProps={{ min: 1, max: 168 }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              onClick={handlePredict}
              disabled={loading}
              startIcon={<TrendingUp size={20} />}
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#333333' }
              }}
            >
              Generate Predictions
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
          Loading predictions…
        </Typography>
      )}

      {hasAnyPredictions && (
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#000000' }}>
            All parameters — Predictions
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
            Next {hours} hour{hours !== 1 ? 's' : ''} from now (from {new Date().toLocaleString()})
          </Typography>
          <Plot
            data={plotData}
            layout={{
              xaxis: { title: 'Time', color: '#000000' },
              yaxis: {
                title: 'Relative value (0–100 normalized)',
                color: '#000000',
                range: [0, 100]
              },
              plot_bgcolor: '#ffffff',
              paper_bgcolor: '#ffffff',
              font: { color: '#000000' },
              showlegend: true,
              legend: { x: 1.02, xanchor: 'left', bgcolor: 'rgba(255,255,255,0.8)' },
              height: 440,
              margin: { l: 60, r: 140, t: 20, b: 60 }
            }}
            style={{ width: '100%', height: '440px' }}
          />
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {PARAM_CONFIG.map(({ key, label, unit }) => {
              const pred = predictions[key]
              if (!pred) return null
              const mean = Number(pred.mean)
              const min = Number(pred.min)
              const max = Number(pred.max)
              const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : '—')
              return (
                <Typography key={key} variant="body2" sx={{ color: '#666666' }}>
                  <Box component="span" sx={{ fontWeight: 600, color: '#000' }}>{label}:</Box>{' '}
                  Mean {fmt(mean)}{unit} | Min {fmt(min)}{unit} | Max {fmt(max)}{unit}
                </Typography>
              )
            })}
          </Box>
        </Paper>
      )}
    </Box>
  )
}

export default Predictions
