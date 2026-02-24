import React from 'react'
import { Paper, Typography, Box } from '@mui/material'

function MetricCard({ title, value, unit, color }) {
  return (
    <Paper
      sx={{
        p: 1.5,
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        height: '100%',
        minHeight: 72
      }}
    >
      <Typography variant="caption" sx={{ color: '#666666', display: 'block', mb: 0.5 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Typography
          variant="h6"
          sx={{
            color: color,
            fontWeight: 600,
            mr: 0.5,
            fontSize: { xs: '0.95rem', sm: '1rem' }
          }}
        >
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Typography>
        {unit && (
          <Typography variant="caption" sx={{ color: '#666666' }}>
            {unit}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default MetricCard
