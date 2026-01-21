import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Paper, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Plus, Delete } from 'lucide-react'
import { experimentsAPI } from '../../services/api'

function ExperimentViewer({ experiment, open, onClose, onUpdate }) {
  const [annotations, setAnnotations] = useState(experiment?.annotations || [])
  const [newAnnotation, setNewAnnotation] = useState({
    timestamp: new Date(),
    note: ''
  })
  const [showAnnotationForm, setShowAnnotationForm] = useState(false)

  useEffect(() => {
    if (experiment?.annotations) {
      setAnnotations(experiment.annotations)
    }
  }, [experiment])

  const handleAddAnnotation = async () => {
    if (!newAnnotation.note.trim()) {
      alert('Please enter a note')
      return
    }

    try {
      await experimentsAPI.addAnnotation(experiment.id, {
        timestamp: newAnnotation.timestamp.toISOString(),
        note: newAnnotation.note
      })
      
      // Refresh annotations
      const response = await experimentsAPI.getAnnotations(experiment.id)
      setAnnotations(response.data)
      
      setNewAnnotation({ timestamp: new Date(), note: '' })
      setShowAnnotationForm(false)
      
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding annotation:', error)
      alert('Error adding annotation. Please try again.')
    }
  }

  const handleDeleteAnnotation = async (annotationId) => {
    if (window.confirm('Are you sure you want to delete this annotation?')) {
      try {
        await experimentsAPI.deleteAnnotation(annotationId)
        setAnnotations(annotations.filter(a => a.id !== annotationId))
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error('Error deleting annotation:', error)
        alert('Error deleting annotation. Please try again.')
      }
    }
  }

  if (!experiment) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ color: '#000000' }}>
        {experiment.title}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle2" sx={{ color: '#666666', mb: 1 }}>Description</Typography>
              <Typography variant="body1" sx={{ color: '#000000' }}>
                {experiment.description || 'No description'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle2" sx={{ color: '#666666', mb: 1 }}>Period</Typography>
              <Typography variant="body1" sx={{ color: '#000000' }}>
                {new Date(experiment.start_date).toLocaleDateString()} - {new Date(experiment.end_date).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
          {experiment.tags && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ color: '#666666', mb: 1 }}>Tags</Typography>
                <Typography variant="body1" sx={{ color: '#000000' }}>
                  {experiment.tags}
                </Typography>
              </Paper>
            </Grid>
          )}
          {experiment.conditions && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ color: '#666666', mb: 1 }}>Conditions</Typography>
                <Typography variant="body1" sx={{ color: '#000000' }}>
                  {experiment.conditions}
                </Typography>
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#000000' }}>
                Annotations
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setShowAnnotationForm(!showAnnotationForm)}
                startIcon={<Plus size={20} />}
                sx={{
                  borderColor: '#000000',
                  color: '#000000',
                  '&:hover': { borderColor: '#333333', backgroundColor: '#f5f5f5' }
                }}
              >
                Add Annotation
              </Button>
            </Box>

            {showAnnotationForm && (
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Timestamp"
                        value={newAnnotation.timestamp}
                        onChange={(newValue) => setNewAnnotation({ ...newAnnotation, timestamp: newValue })}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Note"
                      value={newAnnotation.note}
                      onChange={(e) => setNewAnnotation({ ...newAnnotation, note: e.target.value })}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleAddAnnotation}
                      sx={{
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        '&:hover': { backgroundColor: '#333333' }
                      }}
                    >
                      Save Annotation
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {annotations.length === 0 ? (
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography sx={{ color: '#666666' }}>No annotations</Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ backgroundColor: '#f5f5f5' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Timestamp</TableCell>
                      <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Note</TableCell>
                      <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {annotations.map((annotation) => (
                      <TableRow key={annotation.id}>
                        <TableCell sx={{ color: '#000000' }}>
                          {new Date(annotation.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: '#000000' }}>{annotation.note}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => handleDeleteAnnotation(annotation.id)}
                            size="small"
                            sx={{ color: '#000000' }}
                          >
                            <Delete size={20} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#000000' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExperimentViewer
