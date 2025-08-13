import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Autocomplete
} from '@mui/material'
import {
  Add as AddIcon,
  FitnessCenter as ExerciseIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'

type AdminExercise = {
  id: number
  name: string
  muscle_group: string
  primary_muscles: string[] | null
  secondary_muscles: string[] | null
  equipment: string
  video_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type CreateExerciseForm = {
  name: string
  muscle_group: string
  primary_muscles: string[]
  secondary_muscles: string[]
  equipment: string
  video_url: string
}

const muscleGroups = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 
  'Piernas', 'Glúteos', 'Abdominales', 'Cardio', 'Flexibilidad'
]

const equipmentOptions = [
  'Peso libre', 'Máquina', 'Cuerpo', 'Bandas de resistencia', 
  'Pesas rusas', 'Pelota medicinal', 'TRX', 'Otro'
]

export function AdminExercises() {
  const [exercises, setExercises] = useState<AdminExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CreateExerciseForm>({
    name: '',
    muscle_group: '',
    primary_muscles: [],
    secondary_muscles: [],
    equipment: '',
    video_url: ''
  })

  const loadExercises = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminExercises() as AdminExercise[]
      setExercises(data || [])
      setError('')
    } catch (error) {
      console.error('Error cargando ejercicios:', error)
      setError('Error al cargar los ejercicios')
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [])

  const handleCreateExercise = async () => {
    if (!form.name.trim() || !form.muscle_group || !form.equipment) {
      setError('El nombre, grupo muscular y equipo son requeridos')
      return
    }

    try {
      setCreating(true)
      await apiClient.createAdminExercise({
        ...form,
        video_url: form.video_url || undefined
      })
      setForm({
        name: '',
        muscle_group: '',
        primary_muscles: [],
        secondary_muscles: [],
        equipment: '',
        video_url: ''
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
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '300px'
      }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  return (
    <Box>
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ fontWeight: 600 }}
        >
          Nuevo Ejercicio
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Exercises List */}
      <Stack spacing={2}>
        {exercises.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No hay ejercicios creados
              </Typography>
            </CardContent>
          </Card>
        ) : (
          exercises.map((exercise) => (
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {exercise.name}
                      </Typography>
                      <Chip
                        label={exercise.muscle_group}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={exercise.equipment}
                        color="secondary"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      {exercise.primary_muscles && exercise.primary_muscles.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Músculos principales:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {exercise.primary_muscles.map((muscle, index) => (
                              <Chip
                                key={index}
                                label={muscle}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Músculos secundarios:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {exercise.secondary_muscles.map((muscle, index) => (
                              <Chip
                                key={index}
                                label={muscle}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {exercise.video_url && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Video: {exercise.video_url}
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      Creado: {formatDate(exercise.created_at)}
                      {exercise.updated_at !== exercise.created_at && 
                        ` • Actualizado: ${formatDate(exercise.updated_at)}`
                      }
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

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
          Crear Nuevo Ejercicio
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
            />

            <FormControl fullWidth required>
              <InputLabel>Grupo Muscular</InputLabel>
              <Select
                value={form.muscle_group}
                onChange={(e) => setForm(prev => ({ ...prev, muscle_group: e.target.value }))}
                label="Grupo Muscular"
              >
                {muscleGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              options={muscleGroups}
              value={form.primary_muscles}
              onChange={(_, newValue) => setForm(prev => ({ ...prev, primary_muscles: newValue }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Músculos Principales"
                  placeholder="Seleccionar músculos..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="primary"
                  />
                ))
              }
            />

            <Autocomplete
              multiple
              options={muscleGroups}
              value={form.secondary_muscles}
              onChange={(_, newValue) => setForm(prev => ({ ...prev, secondary_muscles: newValue }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Músculos Secundarios"
                  placeholder="Seleccionar músculos..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="secondary"
                  />
                ))
              }
            />

            <FormControl fullWidth required>
              <InputLabel>Equipo</InputLabel>
              <Select
                value={form.equipment}
                onChange={(e) => setForm(prev => ({ ...prev, equipment: e.target.value }))}
                label="Equipo"
              >
                {equipmentOptions.map((equipment) => (
                  <MenuItem key={equipment} value={equipment}>
                    {equipment}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="URL del Video (opcional)"
              value={form.video_url}
              onChange={(e) => setForm(prev => ({ ...prev, video_url: e.target.value }))}
              fullWidth
              placeholder="https://ejemplo.com/video"
              helperText="Enlace a un video demostrativo del ejercicio"
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
            disabled={creating || !form.name.trim() || !form.muscle_group || !form.equipment}
            startIcon={creating ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {creating ? 'Creando...' : 'Crear Ejercicio'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
