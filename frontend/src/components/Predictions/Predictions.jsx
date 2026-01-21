import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField } from '@mui/material'
import { TrendingUp } from 'lucide-react'
import { predictionsAPI } from '../../services/api'
import Plot from 'react-plotly.js'

function Predictions() {
  const [hours, setHours] = useState(24)
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchPredictions = async (target) => {
    setLoading(true)
    try {
      let response
      if (target === 'temperature') {
        response = await predictionsAPI.predictTemperature(hours)
      } else if (target === 'humidity') {
        response = await predictionsAPI.predictHumidity(hours)
      } else {
        response = await predictionsAPI.predictGas(hours)
      }
      setPredictions({ ...predictions, [target]: response.data })
    } catch (error) {
      console.error(`Error fetching ${target} predictions:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handlePredict = async () => {
    await Promise.all([
      fetchPredictions('temperature'),
      fetchPredictions('humidity'),
      fetchPredictions('gas')
    ])
  }

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

      {predictions && (
        <Grid container spacing={3}>
          {['temperature', 'humidity', 'gas'].map((target) => {
            const pred = predictions[target]
            if (!pred) return null

            const colors = {
              temperature: '#ff6b6b',
              humidity: '#4ecdc4',
              gas: '#95e1d3'
            }

            return (
              <Grid item xs={12} key={target}>
                <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2, textTransform: 'capitalize' }}>
                    {target} Predictions
                  </Typography>
                  <Plot
                    data={[
                      {
                        x: pred.timestamps.map(t => new Date(t)),
                        y: pred.predictions,
                        type: 'scatter',
                        mode: 'lines',
                        name: `Predicted ${target}`,
                        line: { color: colors[target], width: 2, dash: 'dash' }
                      }
                    ]}
                    layout={{
                      title: '',
                      xaxis: { title: 'Time', color: '#000000' },
                      yaxis: { title: target === 'gas' ? 'Gas Level' : target === 'temperature' ? 'Temperature (°C)' : 'Humidity (%)', color: '#000000' },
                      plot_bgcolor: '#ffffff',
                      paper_bgcolor: '#ffffff',
                      font: { color: '#000000' },
                      showlegend: true,
                      height: 400,
                      margin: { l: 60, r: 60, t: 20, b: 60 }
                    }}
                    style={{ width: '100%', height: '400px' }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      Mean: {pred.mean.toFixed(2)} | Min: {pred.min.toFixed(2)} | Max: {pred.max.toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}

export default Predictions
