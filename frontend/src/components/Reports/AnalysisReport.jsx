import React, { useState } from 'react'
import { Box, Paper, Typography, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { TextField } from '@mui/material'
import { Download, FileText } from 'lucide-react'
import { analyticsAPI, reportsAPI } from '../../services/api'
import ReportVisualizations from './ReportVisualizations'

function AnalysisReport() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
  const [endDate, setEndDate] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      const response = await analyticsAPI.getReport(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      setReportData(response.data)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = async () => {
    try {
      const response = await reportsAPI.generateReport(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        'pdf'
      )
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF. Please try again.')
    }
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#ffffff', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
        Analysis Report
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000000', mb: 2 }}>
          Select Time Period
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading}
                startIcon={<FileText size={20} />}
                sx={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#333333' }
                }}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {reportData && (
        <>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#000000' }}>
                Report Statistics
              </Typography>
              <Button
                variant="outlined"
                onClick={exportPDF}
                startIcon={<Download size={20} />}
                sx={{
                  borderColor: '#000000',
                  color: '#000000',
                  '&:hover': { borderColor: '#333333', backgroundColor: '#f5f5f5' }
                }}
              >
                Export PDF
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Metric</TableCell>
                    <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Count</TableCell>
                    <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Mean</TableCell>
                    <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Median</TableCell>
                    <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Std Dev</TableCell>
                    <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Min</TableCell>
                    <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Max</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {['temperature', 'humidity', 'gas_analog'].map((metric) => {
                    const stats = reportData.statistics[metric]
                    return (
                      <TableRow key={metric}>
                        <TableCell sx={{ color: '#000000', textTransform: 'capitalize' }}>{metric}</TableCell>
                        <TableCell align="right" sx={{ color: '#000000' }}>{stats.count}</TableCell>
                        <TableCell align="right" sx={{ color: '#000000' }}>{stats.mean.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#000000' }}>{stats.median.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#000000' }}>{stats.std.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#000000' }}>{stats.min.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#000000' }}>{stats.max.toFixed(2)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <ReportVisualizations reportData={reportData} />
        </>
      )}
    </Box>
  )
}

export default AnalysisReport
