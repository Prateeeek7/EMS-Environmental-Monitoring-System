import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField, Select, MenuItem, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { TrendingUp } from 'lucide-react'
import { statisticsAPI } from '../../services/api'
import Plot from 'react-plotly.js'

function RegressionAnalysis({ metric, onResultChange }) {
  const [xMetric, setXMetric] = useState('temperature')
  const [yMetric, setYMetric] = useState('humidity')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())
  const [regressionType, setRegressionType] = useState('linear')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const metrics = [
    { value: 'temperature', label: 'Temperature' },
    { value: 'humidity', label: 'Humidity' },
    { value: 'gas_analog', label: 'Gas Level' }
  ]

  const handleAnalysis = async () => {
    setLoading(true)
    try {
      const response = await statisticsAPI.regression({
        x_metric: xMetric,
        y_metric: yMetric,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        type: regressionType
      })
      setResult(response.data)
      if (onResultChange) onResultChange(response.data)
    } catch (error) {
      console.error('Error performing regression:', error)
      alert('Error performing regression. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
        Regression Analysis
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>X Metric</InputLabel>
            <Select value={xMetric} onChange={(e) => setXMetric(e.target.value)} label="X Metric">
              {metrics.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Y Metric</InputLabel>
            <Select value={yMetric} onChange={(e) => setYMetric(e.target.value)} label="Y Metric">
              {metrics.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Regression Type</InputLabel>
            <Select value={regressionType} onChange={(e) => setRegressionType(e.target.value)} label="Regression Type">
              <MenuItem value="linear">Linear</MenuItem>
              <MenuItem value="polynomial">Polynomial</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        onClick={handleAnalysis}
        disabled={loading}
        startIcon={<TrendingUp size={20} />}
        sx={{
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': { backgroundColor: '#333333' },
          mb: 3
        }}
      >
        Perform Regression
      </Button>

      {result && (
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
            Results
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>R-Squared</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.r_squared.toFixed(4)}</TableCell>
                </TableRow>
                {result.regression_type === 'linear' && (
                  <>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Slope</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{result.result.slope.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Intercept</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{result.result.intercept.toFixed(4)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  )
}

export default RegressionAnalysis
