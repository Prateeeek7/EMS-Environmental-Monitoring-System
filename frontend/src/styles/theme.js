/**
 * Monotone Theme Configuration
 * Grayscale/black-white UI, colors only in charts
 */

export const theme = {
  colors: {
    // UI Colors (monotone)
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#cccccc',
    borderLight: '#e0e0e0',
    
    // Button colors (grayscale)
    button: '#f5f5f5',
    buttonHover: '#e0e0e0',
    buttonActive: '#d0d0d0',
    buttonText: '#000000',
    
    // Chart colors (full spectrum for data visualization)
    chart: {
      temperature: '#ff6b6b',
      humidity: '#4ecdc4',
      gas: '#95e1d3',
      prediction: '#9b59b6',
      anomaly: '#e74c3c',
      background: '#ffffff',
      grid: '#e0e0e0'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px'
    }
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  }
}
