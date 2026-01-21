import React from 'react'
import { Box, Paper, Typography, Grid } from '@mui/material'
import { MapPin } from 'lucide-react'

function Zones() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000000', mb: 3 }}>
        Multi-Zone Monitoring
      </Typography>

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="body1" sx={{ color: '#666666' }}>
          Multi-zone monitoring feature will be available once multiple devices are configured.
        </Typography>
      </Paper>
    </Box>
  )
}

export default Zones
