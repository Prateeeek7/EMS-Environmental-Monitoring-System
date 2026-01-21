import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField, Chip, Select, MenuItem, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { TrendingUp, BarChart } from 'lucide-react'
import axios from 'axios'
import ComparisonChart from './ComparisonChart'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

function DeviceComparison() {
  const [deviceIds, setDeviceIds] = useState([''])
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())
  const [comparisonData, setComparisonData] = useState(null)
  const [statisticalResult, setStatisticalResult] = useState(null)
  const [selectedMetric, setSelectedMetric] = useState('temperature')
  const [loading, setLoading] = useState(false)

  const metrics = [
    { value: 'temperature', label: 'Temperature' },
    { value: 'humidity', label: 'Humidity' },
    { value: 'gas_analog', label: 'Gas Level' }
  ]

  const handleDeviceIdChange = (index, value) => {
    const newDeviceIds = [...deviceIds]
    newDeviceIds[index] = value
    setDeviceIds(newDeviceIds)
  }

  const addDeviceId = () => {
    setDeviceIds([...deviceIds, ''])
  }

  const removeDeviceId = (index) => {
    if (deviceIds.length > 1) {
      const newDeviceIds = deviceIds.filter((_, i) => i !== index)
      setDeviceIds(newDeviceIds)
    }
  }

  const handleCompare = async () => {
    const validDeviceIds = deviceIds.filter(id => id.trim() !== '')
    if (validDeviceIds.length < 2) {
      alert('Please enter at least 2 device IDs')
      return
    }

    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/comparison/devices`, {
        params: {
          device_ids: validDeviceIds.join(','),
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      })
      setComparisonData(response.data)
    } catch (error) {
      console.error('Error comparing devices:', error)
      alert('Error comparing devices. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatisticalComparison = async () => {
    const validDeviceIds = deviceIds.filter(id => id.trim() !== '')
    if (validDeviceIds.length < 2) {
      alert('Please enter at least 2 device IDs')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/comparison/statistical`, {
        device_ids: validDeviceIds,
        metric: selectedMetric,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        method: validDeviceIds.length === 2 ? 't-test' : 'anova'
      })
      setStatisticalResult(response.data)
    } catch (error) {
      console.error('Error performing statistical comparison:', error)
      alert('Error performing statistical comparison. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
        Device Comparison
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Comparison Settings
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {deviceIds.map((deviceId, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label={`Device ID ${index + 1}`}
                  value={deviceId}
                  onChange={(e) => handleDeviceIdChange(index, e.target.value)}
                  fullWidth
                />
                {deviceIds.length > 1 && (
                  <Button
                    variant="outlined"
                    onClick={() => removeDeviceId(index)}
                    sx={{
                      borderColor: '#000000',
                      color: '#000000',
                      minWidth: 'auto',
                      px: 2
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={addDeviceId}
              sx={{
                borderColor: '#000000',
                color: '#000000',
                '&:hover': { borderColor: '#333333', backgroundColor: '#f5f5f5' }
              }}
            >
              Add Device
            </Button>
          </Grid>
        </Grid>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              onClick={handleCompare}
              disabled={loading}
              startIcon={<BarChart size={20} />}
              fullWidth
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#333333' }
              }}
            >
              Compare Devices
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              onClick={handleStatisticalComparison}
              disabled={loading}
              startIcon={<TrendingUp size={20} />}
              fullWidth
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#333333' }
              }}
            >
              Statistical Comparison
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {comparisonData && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
            Comparison Results
          </Typography>
          <ComparisonChart data={comparisonData} />
        </Paper>
      )}

      {statisticalResult && (
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
            Statistical Comparison Results
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Method</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{statisticalResult.method.toUpperCase()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Metric</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{statisticalResult.metric}</TableCell>
                </TableRow>
                {statisticalResult.method === 't-test' && (
                  <>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>T-Statistic</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{statisticalResult.result.t_statistic.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>P-Value</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{statisticalResult.result.p_value.toFixed(4)}</TableCell>
                    </TableRow>
                  </>
                )}
                {statisticalResult.method === 'anova' && (
                  <>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>F-Statistic</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{statisticalResult.result.f_statistic.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>P-Value</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{statisticalResult.result.p_value.toFixed(4)}</TableCell>
                    </TableRow>
                  </>
                )}
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Significant</TableCell>
                  <TableCell sx={{ color: statisticalResult.result.significant ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
                    {statisticalResult.result.interpretation}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  )
}

export default DeviceComparison
