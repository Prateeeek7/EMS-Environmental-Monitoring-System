import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, AppBar, Toolbar, Typography, Tabs, Tab } from '@mui/material'
import { Activity, BarChart, TrendingUp, AlertTriangle } from 'lucide-react'

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determine current tab based on route
  const getTabValue = () => {
    const path = location.pathname
    if (path === '/dashboard' || path === '/') return 0
    if (path === '/reports') return 1
    if (path === '/predictions') return 2
    if (path === '/alerts') return 3
    if (path === '/zones') return 4
    return 0
  }
  
  const [tabValue, setTabValue] = useState(getTabValue())

  useEffect(() => {
    setTabValue(getTabValue())
  }, [location.pathname])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    const routes = ['/dashboard', '/reports', '/predictions', '/alerts', '/zones']
    navigate(routes[newValue])
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <AppBar position="static" sx={{ backgroundColor: '#000000', color: '#ffffff' }}>
        <Toolbar>
          <Activity size={24} style={{ marginRight: 16 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Environmental Monitoring Dashboard
          </Typography>
        </Toolbar>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          textColor="inherit" 
          indicatorColor="secondary" 
          sx={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
        >
          <Tab label="Dashboard" icon={<BarChart size={20} />} iconPosition="start" />
          <Tab label="Reports" icon={<TrendingUp size={20} />} iconPosition="start" />
          <Tab label="Predictions" icon={<TrendingUp size={20} />} iconPosition="start" />
          <Tab label="Alerts" icon={<AlertTriangle size={20} />} iconPosition="start" />
        </Tabs>
      </AppBar>
      <Box component="main">
        {children}
      </Box>
    </Box>
  )
}

export default Layout
