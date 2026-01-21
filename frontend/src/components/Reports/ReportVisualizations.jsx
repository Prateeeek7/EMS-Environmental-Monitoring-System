import React from 'react'
import { Paper, Box, Typography, Grid } from '@mui/material'
import Plot from 'react-plotly.js'

function ReportVisualizations({ reportData }) {
  if (!reportData || !reportData.time_series) {
    return null
  }

  const { timestamps, temperature, humidity, gas_analog } = reportData.time_series
  const ts = timestamps.map(t => new Date(t))

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
              Time Series Analysis
            </Typography>
            <Plot
              data={[
                {
                  x: ts,
                  y: temperature,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Temperature',
                  line: { color: '#ff6b6b', width: 2 }
                },
                {
                  x: ts,
                  y: humidity,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Humidity',
                  line: { color: '#4ecdc4', width: 2 }
                },
                {
                  x: ts,
                  y: gas_analog,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Gas Level',
                  line: { color: '#95e1d3', width: 2 }
                }
              ]}
              layout={{
                title: '',
                xaxis: { title: 'Time', color: '#000000' },
                yaxis: { title: 'Value', color: '#000000' },
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
              Correlation Matrix
            </Typography>
            <Plot
              data={[
                {
                  z: [
                    [reportData.correlation.temperature?.temperature || 1, reportData.correlation.temperature?.humidity || 0, reportData.correlation.temperature?.gas_analog || 0],
                    [reportData.correlation.humidity?.temperature || 0, reportData.correlation.humidity?.humidity || 1, reportData.correlation.humidity?.gas_analog || 0],
                    [reportData.correlation.gas_analog?.temperature || 0, reportData.correlation.gas_analog?.humidity || 0, reportData.correlation.gas_analog?.gas_analog || 1]
                  ],
                  x: ['Temperature', 'Humidity', 'Gas Level'],
                  y: ['Temperature', 'Humidity', 'Gas Level'],
                  type: 'heatmap',
                  colorscale: 'RdBu',
                  zmid: 0,
                  text: [
                    [1, reportData.correlation.temperature?.humidity?.toFixed(2) || 0, reportData.correlation.temperature?.gas_analog?.toFixed(2) || 0],
                    [reportData.correlation.humidity?.temperature?.toFixed(2) || 0, 1, reportData.correlation.humidity?.gas_analog?.toFixed(2) || 0],
                    [reportData.correlation.gas_analog?.temperature?.toFixed(2) || 0, reportData.correlation.gas_analog?.humidity?.toFixed(2) || 0, 1]
                  ],
                  texttemplate: '%{text}',
                  textfont: { size: 14, color: '#000000' }
                }
              ]}
              layout={{
                title: '',
                plot_bgcolor: '#ffffff',
                paper_bgcolor: '#ffffff',
                font: { color: '#000000' },
                height: 400,
                margin: { l: 80, r: 80, t: 20, b: 80 }
              }}
              style={{ width: '100%', height: '400px' }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
              Temperature Distribution
            </Typography>
            <Plot
              data={[
                {
                  x: temperature,
                  type: 'histogram',
                  name: 'Temperature',
                  marker: { color: '#ff6b6b' },
                  nbinsx: 30
                }
              ]}
              layout={{
                title: '',
                xaxis: { title: 'Temperature (°C)', color: '#000000' },
                yaxis: { title: 'Frequency', color: '#000000' },
                plot_bgcolor: '#ffffff',
                paper_bgcolor: '#ffffff',
                font: { color: '#000000' },
                showlegend: false,
                height: 400,
                margin: { l: 60, r: 60, t: 20, b: 60 }
              }}
              style={{ width: '100%', height: '400px' }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ReportVisualizations
