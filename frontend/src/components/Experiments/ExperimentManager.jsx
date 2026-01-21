import React, { useState, useEffect } from 'react'
import { Box, Paper, Typography, Button, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Plus, Edit, Delete, Eye } from 'lucide-react'
import { experimentsAPI } from '../../services/api'
import ExperimentViewer from './ExperimentViewer'

function ExperimentManager() {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewer, setOpenViewer] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date(),
    end_date: new Date(),
    tags: '',
    conditions: ''
  })

  useEffect(() => {
    fetchExperiments()
  }, [])

  const fetchExperiments = async () => {
    setLoading(true)
    try {
      const response = await experimentsAPI.list()
      setExperiments(response.data)
    } catch (error) {
      console.error('Error fetching experiments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(),
      tags: '',
      conditions: ''
    })
    setSelectedExperiment(null)
    setOpenDialog(true)
  }

  const handleEdit = (experiment) => {
    setFormData({
      title: experiment.title,
      description: experiment.description || '',
      start_date: new Date(experiment.start_date),
      end_date: new Date(experiment.end_date),
      tags: experiment.tags || '',
      conditions: experiment.conditions || ''
    })
    setSelectedExperiment(experiment)
    setOpenDialog(true)
  }

  const handleSave = async () => {
    try {
      const data = {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
        tags: formData.tags,
        conditions: formData.conditions
      }

      if (selectedExperiment) {
        await experimentsAPI.update(selectedExperiment.id, data)
      } else {
        await experimentsAPI.create(data)
      }
      
      setOpenDialog(false)
      fetchExperiments()
    } catch (error) {
      console.error('Error saving experiment:', error)
      alert('Error saving experiment. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this experiment?')) {
      try {
        await experimentsAPI.delete(id)
        fetchExperiments()
      } catch (error) {
        console.error('Error deleting experiment:', error)
        alert('Error deleting experiment. Please try again.')
      }
    }
  }

  const handleView = async (experiment) => {
    try {
      const response = await experimentsAPI.get(experiment.id)
      setSelectedExperiment(response.data)
      setOpenViewer(true)
    } catch (error) {
      console.error('Error fetching experiment:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#000000' }}>
          Experiment Management
        </Typography>
        <Button
          variant="contained"
          onClick={handleCreate}
          startIcon={<Plus size={20} />}
          sx={{
            backgroundColor: '#000000',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#333333' }
          }}
        >
          New Experiment
        </Button>
      </Box>

      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        {loading ? (
          <Typography sx={{ color: '#666666' }}>Loading experiments...</Typography>
        ) : experiments.length === 0 ? (
          <Typography sx={{ color: '#666666' }}>No experiments found. Create a new experiment to get started.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Start Date</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>End Date</TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>Tags</TableCell>
                  <TableCell align="right" sx={{ color: '#000000', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.id}>
                    <TableCell sx={{ color: '#000000' }}>{experiment.title}</TableCell>
                    <TableCell sx={{ color: '#000000' }}>{new Date(experiment.start_date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: '#000000' }}>{new Date(experiment.end_date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: '#000000' }}>{experiment.tags || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleView(experiment)} size="small" sx={{ color: '#000000' }}>
                        <Eye size={20} />
                      </IconButton>
                      <IconButton onClick={() => handleEdit(experiment)} size="small" sx={{ color: '#000000' }}>
                        <Edit size={20} />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(experiment.id)} size="small" sx={{ color: '#000000' }}>
                        <Delete size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: '#000000' }}>
          {selectedExperiment ? 'Edit Experiment' : 'New Experiment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(newValue) => setFormData({ ...formData, start_date: newValue })}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tags (comma-separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                fullWidth
                placeholder="e.g., greenhouse, trial-1, control"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Experimental Conditions"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder="e.g., Temperature: 25°C, Humidity: 60%"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#000000' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.title || !formData.start_date || !formData.end_date}
            sx={{
              backgroundColor: '#000000',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#333333' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {selectedExperiment && (
        <ExperimentViewer
          experiment={selectedExperiment}
          open={openViewer}
          onClose={() => setOpenViewer(false)}
          onUpdate={fetchExperiments}
        />
      )}
    </Box>
  )
}

export default ExperimentManager
