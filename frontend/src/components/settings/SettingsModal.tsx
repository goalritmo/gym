import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  Alert,
  Chip,
  Stack
} from '@mui/material'
import { 
  Settings, 
  People, 
  PersonOff, 
  Timer, 
  TimerOff, 
  Star,
  StarBorder
} from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type Exercise = {
  id: number
  name: string
}

type SettingsModalProps = {
  open: boolean
  onClose: () => void
  exercises?: Exercise[] // Lista de ejercicios disponibles
}

export default function SettingsModal({ open, onClose, exercises = [] }: SettingsModalProps) {
  const { 
    settings, 
    toggleSocial, 
    toggleWorkoutSection, 
    setFavoriteExercises 
  } = useUserSettings()
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)

  // Actualizar configuraciones temporales cuando cambien las reales
  useEffect(() => {
    setTempSettings(settings)
  }, [settings])

  const handleToggleSocial = () => {
    setTempSettings(prev => ({ 
      ...prev, 
      socialEnabled: !prev.socialEnabled
    }))
    setHasChanges(true)
  }

  const handleToggleWorkoutSection = () => {
    setTempSettings(prev => ({ 
      ...prev, 
      showWorkoutSection: !prev.showWorkoutSection
    }))
    setHasChanges(true)
  }

  const handleToggleFavoriteExercise = (exerciseId: number) => {
    const isFavorite = tempSettings.favoriteExercises.includes(exerciseId)
    const newFavorites = isFavorite 
      ? tempSettings.favoriteExercises.filter(id => id !== exerciseId)
      : [...tempSettings.favoriteExercises, exerciseId]
    
    setTempSettings(prev => ({
      ...prev,
      favoriteExercises: newFavorites
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // Aplicar cambios
    if (tempSettings.socialEnabled !== settings.socialEnabled) {
      toggleSocial()
    }
    if (tempSettings.showWorkoutSection !== settings.showWorkoutSection) {
      toggleWorkoutSection()
    }
    if (JSON.stringify(tempSettings.favoriteExercises) !== JSON.stringify(settings.favoriteExercises)) {
      setFavoriteExercises(tempSettings.favoriteExercises)
    }
    setHasChanges(false)
    onClose()
  }

  const handleCancel = () => {
    setTempSettings(settings)
    setHasChanges(false)
    onClose()
  }

  const getExerciseName = (id: number) => {
    return exercises.find(ex => ex.id === id)?.name || `Ejercicio ${id}`
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <Settings sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Configuración
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Sección REGISTRO */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            REGISTRO
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.showWorkoutSection}
                onChange={handleToggleWorkoutSection}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tempSettings.showWorkoutSection ? (
                  <Timer sx={{ color: 'primary.main', fontSize: 20 }} />
                ) : (
                  <TimerOff sx={{ color: 'text.secondary', fontSize: 20 }} />
                )}
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Mostrar sección de tiempo de serie
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tempSettings.showWorkoutSection 
                      ? 'El cronómetro aparece en el formulario de registro'
                      : 'La sección de tiempo de serie está oculta'
                    }
                  </Typography>
                </Box>
              </Box>
            }
            sx={{ 
              alignItems: 'flex-start',
              width: '100%',
              m: 0,
              p: 2,
              borderRadius: 1,
              backgroundColor: 'grey.50',
              '&:hover': {
                backgroundColor: 'grey.100'
              }
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Sección SOCIAL */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            SOCIAL
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.socialEnabled}
                onChange={handleToggleSocial}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tempSettings.socialEnabled ? (
                  <People sx={{ color: 'primary.main', fontSize: 20 }} />
                ) : (
                  <PersonOff sx={{ color: 'text.secondary', fontSize: 20 }} />
                )}
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Habilitar funcionalidad social
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tempSettings.socialEnabled 
                      ? 'Puedes ver y compartir entrenamientos con otros usuarios'
                      : 'Tus entrenamientos son privados y no puedes ver otros'
                    }
                  </Typography>
                </Box>
              </Box>
            }
            sx={{ 
              alignItems: 'flex-start',
              width: '100%',
              m: 0,
              p: 2,
              borderRadius: 1,
              backgroundColor: 'grey.50',
              '&:hover': {
                backgroundColor: 'grey.100'
              }
            }}
          />
        </Box>



        {/* Sección EJERCICIOS FAVORITOS */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            EJERCICIOS FAVORITOS
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona los ejercicios que quieres que aparezcan primero en el selector
          </Typography>

          {exercises.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Ejercicios favoritos ({tempSettings.favoriteExercises.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                {tempSettings.favoriteExercises.map(exerciseId => (
                  <Chip
                    key={exerciseId}
                    label={getExerciseName(exerciseId)}
                    onDelete={() => handleToggleFavoriteExercise(exerciseId)}
                    color="primary"
                    size="small"
                    icon={<Star />}
                  />
                ))}
                {tempSettings.favoriteExercises.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No hay ejercicios favoritos seleccionados
                  </Typography>
                )}
              </Stack>

              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Todos los ejercicios:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {exercises.map(exercise => (
                  <Chip
                    key={exercise.id}
                    label={exercise.name}
                    onClick={() => handleToggleFavoriteExercise(exercise.id)}
                    variant={tempSettings.favoriteExercises.includes(exercise.id) ? "filled" : "outlined"}
                    color={tempSettings.favoriteExercises.includes(exercise.id) ? "primary" : "default"}
                    size="small"
                    icon={tempSettings.favoriteExercises.includes(exercise.id) ? <Star /> : <StarBorder />}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: tempSettings.favoriteExercises.includes(exercise.id) 
                          ? 'primary.dark' 
                          : 'grey.100'
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                Los ejercicios se cargarán automáticamente cuando estén disponibles
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Nota:</strong> Los ejercicios favoritos aparecerán primero en el selector 
            cuando registres un entrenamiento.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleCancel}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges}
          sx={{ minWidth: 100 }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
