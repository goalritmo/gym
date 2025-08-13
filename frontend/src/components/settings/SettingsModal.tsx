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
  IconButton
} from '@mui/material'
import {
  Settings,
  Timer,
  TimerOff,
  Close
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
    toggleWorkoutSection,
    setFavoriteExercises,
    toggleUncNotifications
  } = useUserSettings()
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)

  // Actualizar configuraciones temporales cuando cambien las reales
  useEffect(() => {
    setTempSettings(settings)
  }, [settings])

  const handleToggleWorkoutSection = () => {
    setTempSettings(prev => ({
      ...prev,
      showWorkoutSection: !prev.showWorkoutSection
    }))
    setHasChanges(true)
  }

  const handleToggleUncNotifications = () => {
    setTempSettings(prev => ({
      ...prev,
      uncNotificationsEnabled: !prev.uncNotificationsEnabled
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
    if (tempSettings.showWorkoutSection !== settings.showWorkoutSection) {
      toggleWorkoutSection()
    }
    if (tempSettings.uncNotificationsEnabled !== settings.uncNotificationsEnabled) {
      toggleUncNotifications()
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
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Configuración
          </Typography>
        </Box>
        <IconButton
          onClick={handleCancel}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'grey.100'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Sección NOTIFICACIONES UNC */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            NOTIFICACIONES
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.uncNotificationsEnabled}
                onChange={handleToggleUncNotifications}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Notificaciones de la UNC
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tempSettings.uncNotificationsEnabled
                      ? 'Recibirás notificaciones sobre el gimnasio de la UNC'
                      : 'No recibirás notificaciones sobre el gimnasio de la UNC'
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

        {/* Sección EJERCICIOS FAVORITOS */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            EJERCICIOS FAVORITOS
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona los ejercicios que quieres que aparezcan en el selector
          </Typography>

          {exercises.length > 0 ? (
            <Box>
              <Box sx={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1
              }}>
                {exercises.map(exercise => (
                  <FormControlLabel
                    key={exercise.id}
                    control={
                      <Switch
                        checked={tempSettings.favoriteExercises.includes(exercise.id)}
                        onChange={() => handleToggleFavoriteExercise(exercise.id)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={exercise.name}
                    sx={{
                      m: 0,
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  />
                ))}
              </Box>
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
