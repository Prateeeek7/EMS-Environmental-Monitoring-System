import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField, Tabs, Tab, Select, MenuItem, InputLabel, FormControl } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { TrendingUp, BarChart, Activity } from 'lucide-react'
import { statisticsAPI } from '../../services/api'
import TTestResults from './TTestResults'
import RegressionAnalysis from './RegressionAnalysis'
import DistributionAnalysis from './DistributionAnalysis'

function StatisticalAnalysis() {
  const [tabValue, setTabValue] = useState(0)
  const [metric, setMetric] = useState('temperature')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const metrics = [
    { value: 'temperature', label: 'Temperature' },
    { value: 'humidity', label: 'Humidity' },
    { value: 'gas_analog', label: 'Gas Level (Analog)' }
  ]

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setResult(null)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
        Statistical Analysis
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Metric</InputLabel>
              <Select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                label="Metric"
              >
                {metrics.map((m) => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: '1px solid #e0e0e0' }}>
          <Tab label="T-Test" icon={<BarChart size={20} />} iconPosition="start" />
          <Tab label="Regression" icon={<TrendingUp size={20} />} iconPosition="start" />
          <Tab label="Distribution" icon={<Activity size={20} />} iconPosition="start" />
        </Tabs>

        {tabValue === 0 && (
          <TTestResults metric={metric} onResultChange={setResult} />
        )}
        {tabValue === 1 && (
          <RegressionAnalysis metric={metric} onResultChange={setResult} />
        )}
        {tabValue === 2 && (
          <DistributionAnalysis metric={metric} onResultChange={setResult} />
        )}
      </Paper>
    </Box>
  )
}

export default StatisticalAnalysis
