import React from 'react'
import { Paper, Typography, Box } from '@mui/material'

function MetricCard({ title, value, unit, color }) {
  return (
    <Paper
      sx={{
        p: 3,
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        height: '100%'
      }}
    >
      <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
        <Typography
          variant="h4"
          sx={{
            color: color, // Chart color
            fontWeight: 600,
            mr: 1
          }}
        >
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Typography>
        {unit && (
          <Typography variant="body2" sx={{ color: '#666666' }}>
            {unit}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default MetricCard
