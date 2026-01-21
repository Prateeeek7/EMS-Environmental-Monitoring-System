import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Activity } from 'lucide-react'
import { statisticsAPI } from '../../services/api'
import BoxPlot from '../Visualizations/BoxPlot'

function DistributionAnalysis({ metric, onResultChange }) {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])

  const handleAnalysis = async () => {
    setLoading(true)
    try {
      const response = await statisticsAPI.distribution({
        metric: metric,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      })
      setResult(response.data)
      if (onResultChange) onResultChange(response.data)
    } catch (error) {
      console.error('Error analyzing distribution:', error)
      alert('Error analyzing distribution. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
        Distribution Analysis
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
        </Grid>
      </LocalizationProvider>

      <Button
        variant="contained"
        onClick={handleAnalysis}
        disabled={loading}
        startIcon={<Activity size={20} />}
        sx={{
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': { backgroundColor: '#333333' },
          mb: 3
        }}
      >
        Analyze Distribution
      </Button>

      {result && (
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5', mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
            Distribution Statistics
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Mean</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.mean.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Median</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.median.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Standard Deviation</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.std.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Min</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.min.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Max</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.max.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Q25 (25th Percentile)</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.q25.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Q75 (75th Percentile)</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.q75.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Skewness</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.skewness.toFixed(4)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Kurtosis</TableCell>
                  <TableCell sx={{ color: '#000000' }}>{result.result.kurtosis.toFixed(4)}</TableCell>
                </TableRow>
                {result.result.normality_test && (
                  <>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Normality Test</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{result.result.normality_test.test}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>P-Value</TableCell>
                      <TableCell sx={{ color: '#000000' }}>{result.result.normality_test.p_value.toFixed(4)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Normal Distribution</TableCell>
                      <TableCell sx={{ color: result.result.normality_test.is_normal ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                        {result.result.normality_test.is_normal ? 'Yes' : 'No'}
                      </TableCell>
                    </TableRow>
                  </>
                )}
                {result.result.confidence_interval && (
                  <>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Confidence Interval ({result.result.confidence_interval.confidence * 100}%)</TableCell>
                      <TableCell sx={{ color: '#000000' }}>
                        [{result.result.confidence_interval.lower.toFixed(2)}, {result.result.confidence_interval.upper.toFixed(2)}]
                      </TableCell>
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

export default DistributionAnalysis
