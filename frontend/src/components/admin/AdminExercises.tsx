import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  FitnessCenter as ExerciseIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

type AdminExercise = {
  id: number
  name: string
  muscle_group: string
  equipment: string
  primary_muscles: string[] | null
  secondary_muscles: string[] | null
  video_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type CreateExerciseForm = {
  name: string
}



export function AdminExercises() {
  const { isAdmin } = useAuth()
  const [exercises, setExercises] = useState<AdminExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [form, setForm] = useState<CreateExerciseForm>({
    name: ''
  })

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔍 Cargando ejercicios...')
      const data = await apiClient.getAdminExercises() as AdminExercise[]
      console.log('🔍 Ejercicios cargados:', data)
      setExercises(data || [])
      setError('')
    } catch (error) {
      console.error('Error cargando ejercicios:', error)
      setError('Error al cargar los ejercicios')
      setExercises([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  const handleCreateExercise = async () => {
    if (!form.name.trim()) {
      setError('El nombre del ejercicio es requerido')
      return
    }

    try {
      setCreating(true)
      await apiClient.createAdminExercise({
        name: form.name,
        muscle_group: 'General',
        equipment: 'Peso libre',
        primary_muscles: [],
        secondary_muscles: [],
        video_url: undefined
      })
      setForm({
        name: ''
      })
      setOpenDialog(false)
      await loadExercises() // Recargar lista
    } catch (error) {
      console.error('Error creando ejercicio:', error)
      setError('Error al crear el ejercicio')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${weekday} ${day} de ${month} a las ${hours}:${minutes}`
  }

  // Filtrar ejercicios por nombre
  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(filterText.toLowerCase())
  )

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Cargando ejercicios...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      maxWidth: '900px', 
      mx: 'auto',
      px: { xs: 2, sm: 3, md: 4 },
      height: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Ejercicios del Sistema
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ fontWeight: 600 }}
          >
            Agregar
          </Button>
        )}
      </Box>

      {/* Filter */}
      <TextField
        fullWidth
        placeholder="Buscar ejercicios por nombre..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
        }}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Exercises List */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            background: '#a8a8a8',
          },
        },
      }}>
        <Stack spacing={2}>
          {filteredExercises.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {filterText ? 'No se encontraron ejercicios con ese nombre' : 'No hay ejercicios creados'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            filteredExercises.map((exercise) => (
            <Card key={exercise.id} sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Icon */}
                  <Box sx={{ mt: 0.5 }}>
                    <ExerciseIcon sx={{ color: 'primary.main' }} />
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {exercise.name}
                    </Typography>
                    


                    <Typography variant="caption" color="text.secondary">
                      Creado el {formatDate(exercise.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
      </Box>

      {/* Create Exercise Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontWeight: 'bold'
        }}>
          <AddIcon sx={{ color: 'primary.main' }} />
          Agregar Ejercicio
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del Ejercicio"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              placeholder="Ej: Press de banca"
              autoFocus
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateExercise}
            disabled={creating || !form.name.trim()}
            startIcon={creating ? <CircularProgress size={16} /> : undefined}
          >
            {creating ? 'Creando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
