import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField, Checkbox, FormControlLabel, FormGroup, Select, MenuItem, InputLabel, FormControl } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

function DataExport() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
  const [endDate, setEndDate] = useState(new Date())
  const [deviceId, setDeviceId] = useState('')
  const [selectedMetrics, setSelectedMetrics] = useState(['temperature', 'humidity', 'gas_analog', 'gas_digital'])
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeStatistics, setIncludeStatistics] = useState(true)
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')

  const metrics = [
    { value: 'id', label: 'ID' },
    { value: 'timestamp', label: 'Timestamp' },
    { value: 'device_id', label: 'Device ID' },
    { value: 'temperature', label: 'Temperature' },
    { value: 'humidity', label: 'Humidity' },
    { value: 'gas_analog', label: 'Gas Level (Analog)' },
    { value: 'gas_digital', label: 'Gas Level (Digital)' }
  ]

  const handleMetricChange = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }

  const handleExport = async (format) => {
    setLoading(true)
    try {
      const payload = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        device_id: deviceId || null,
        metrics: selectedMetrics,
        include_metadata: includeMetadata,
        include_statistics: includeStatistics
      }

      let url, method
      if (format === 'csv') {
        url = `${API_BASE_URL}/export/csv`
        method = 'POST'
      } else if (format === 'json') {
        url = `${API_BASE_URL}/export/json`
        method = 'POST'
      } else if (format === 'excel') {
        url = `${API_BASE_URL}/export/excel`
        method = 'POST'
      }

      const response = await axios({
        method,
        url,
        data: payload,
        responseType: 'blob'
      })

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url_blob = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url_blob
      
      const extension = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'xlsx'
      const filename = `sensor_data_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${extension}`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url_blob)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
        Data Export
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Export Settings
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Device ID (optional)"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                fullWidth
                placeholder="Leave empty for all devices"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  label="Export Format"
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>

        <Typography variant="subtitle1" gutterBottom sx={{ color: '#000000', mb: 1, mt: 2 }}>
          Select Metrics
        </Typography>
        <FormGroup>
          <Grid container spacing={1}>
            {metrics.map((metric) => (
              <Grid item xs={12} sm={6} md={4} key={metric.value}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedMetrics.includes(metric.value)}
                      onChange={() => handleMetricChange(metric.value)}
                      sx={{ color: '#000000', '&.Mui-checked': { color: '#000000' } }}
                    />
                  }
                  label={metric.label}
                  sx={{ color: '#000000' }}
                />
              </Grid>
            ))}
          </Grid>
        </FormGroup>

        <Typography variant="subtitle1" gutterBottom sx={{ color: '#000000', mb: 1, mt: 2 }}>
          Export Options
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                sx={{ color: '#000000', '&.Mui-checked': { color: '#000000' } }}
              />
            }
            label="Include Metadata"
            sx={{ color: '#000000' }}
          />
          {exportFormat === 'excel' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeStatistics}
                  onChange={(e) => setIncludeStatistics(e.target.checked)}
                  sx={{ color: '#000000', '&.Mui-checked': { color: '#000000' } }}
                />
              }
              label="Include Statistics Sheet"
              sx={{ color: '#000000' }}
            />
          )}
        </FormGroup>
      </Paper>

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Export Data
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={() => handleExport('csv')}
              disabled={loading || selectedMetrics.length === 0}
              startIcon={<FileText size={20} />}
              fullWidth
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#333333' }
              }}
            >
              Export CSV
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={() => handleExport('json')}
              disabled={loading || selectedMetrics.length === 0}
              startIcon={<Table size={20} />}
              fullWidth
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#333333' }
              }}
            >
              Export JSON
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={() => handleExport('excel')}
              disabled={loading || selectedMetrics.length === 0}
              startIcon={<FileSpreadsheet size={20} />}
              fullWidth
              sx={{
                backgroundColor: '#000000',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#333333' }
              }}
            >
              Export Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default DataExport
