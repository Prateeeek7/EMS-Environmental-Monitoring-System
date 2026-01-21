/**
 * API Service
 * Handles all API calls to the backend
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Sensor Data API
export const sensorDataAPI = {
  getLatest: () => api.get('/latest'),
  getAll: (limit = 100) => api.get(`/sensor-data?limit=${limit}`),
  getStats: () => api.get('/stats'),
  postData: (data) => api.post('/sensor-data', data)
}

// Predictions API
export const predictionsAPI = {
  predictTemperature: (hours = 24) => api.get(`/predict/temperature?hours=${hours}`),
  predictHumidity: (hours = 24) => api.get(`/predict/humidity?hours=${hours}`),
  predictGas: (hours = 24) => api.get(`/predict/gas?hours=${hours}`),
  getAnomalies: (window = 24) => api.get(`/anomalies?window=${window}`)
}

// Analytics API
export const analyticsAPI = {
  getStatistics: (startDate, endDate) => 
    api.get(`/analytics/statistics?start_date=${startDate}&end_date=${endDate}`),
  getCorrelation: (startDate, endDate) => 
    api.get(`/analytics/correlation?start_date=${startDate}&end_date=${endDate}`),
  getBaseline: (days = 7) => 
    api.get(`/analytics/baseline?days=${days}`),
  getReport: (startDate, endDate) => 
    api.get(`/analytics/report?start_date=${startDate}&end_date=${endDate}`)
}

// Reports API
export const reportsAPI = {
  generateReport: (startDate, endDate, format = 'json') => 
    api.post('/reports/generate', {
      start_date: startDate,
      end_date: endDate,
      format: format
    }, {
      responseType: format === 'pdf' ? 'blob' : 'json'
    })
}

// Export API
export const exportAPI = {
  exportCSV: (params) => 
    api.post('/export/csv', params, { responseType: 'blob' }),
  exportJSON: (params) => 
    api.post('/export/json', params, { responseType: 'blob' }),
  exportExcel: (params) => 
    api.post('/export/excel', params, { responseType: 'blob' })
}

// Experiments API
export const experimentsAPI = {
  list: (params) => api.get('/experiments', { params }),
  get: (id) => api.get(`/experiments/${id}`),
  create: (data) => api.post('/experiments', data),
  update: (id, data) => api.put(`/experiments/${id}`, data),
  delete: (id) => api.delete(`/experiments/${id}`),
  addAnnotation: (id, data) => api.post(`/experiments/${id}/annotations`, data),
  getAnnotations: (id) => api.get(`/experiments/${id}/annotations`),
  deleteAnnotation: (id) => api.delete(`/annotations/${id}`)
}

// Statistics API
export const statisticsAPI = {
  tTest: (data) => api.post('/statistics/t-test', data),
  anova: (data) => api.post('/statistics/anova', data),
  regression: (data) => api.post('/statistics/regression', data),
  distribution: (params) => api.get('/statistics/distribution', { params })
}

export default api
