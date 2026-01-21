import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { TrendingUp } from 'lucide-react'
import { statisticsAPI } from '../../services/api'

function TTestResults({ metric, onResultChange }) {
  const [period1Start, setPeriod1Start] = useState(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
  const [period1End, setPeriod1End] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [period2Start, setPeriod2Start] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [period2End, setPeriod2End] = useState(new Date())
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const response = await statisticsAPI.tTest({
        metric: metric,
        period1_start: period1Start.toISOString().split('T')[0],
        period1_end: period1End.toISOString().split('T')[0],
        period2_start: period2Start.toISOString().split('T')[0],
        period2_end: period2End.toISOString().split('T')[0]
      })
      setResult(response.data)
      if (onResultChange) onResultChange(response.data)
    } catch (error) {
      console.error('Error performing t-test:', error)
      alert('Error performing t-test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
        T-Test: Compare Two Time Periods
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ color: '#000000', mb: 1 }}>Period 1</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={period1Start}
                  onChange={(newValue) => setPeriod1Start(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={period1End}
                  onChange={(newValue) => setPeriod1End(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ color: '#000000', mb: 1 }}>Period 2</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={period2Start}
                  onChange={(newValue) => setPeriod2Start(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={period2End}
                  onChange={(newValue) => setPeriod2End(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </LocalizationProvider>

      <Button
        variant="contained"
        onClick={handleTest}
        disabled={loading}
        startIcon={<TrendingUp size={20} />}
        sx={{
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': { backgroundColor: '#333333' },
          mb: 3
        }}
      >
        Perform T-Test
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
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>T-Statistic</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.t_statistic.toFixed(4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>P-Value</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.p_value.toFixed(4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Period 1 Mean</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.mean1.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Period 2 Mean</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.mean2.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Significant</TableCell>
                  <TableCell sx={{ color: result.result.significant ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
                    {result.result.interpretation}
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

export default TTestResults
