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
  Stack
} from '@mui/material'
import { Settings, Visibility, VisibilityOff, Group, GroupOff } from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type SettingsModalProps = {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, toggleSocialVisibility, toggleViewOthersWorkouts } = useUserSettings()
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)

  // Actualizar configuraciones temporales cuando cambien las reales
  useEffect(() => {
    setTempSettings(settings)
  }, [settings])

  const handleToggleSocial = () => {
    setTempSettings(prev => {
      const newShowWorkouts = !prev.showWorkoutsInSocial
      // Si no quiere mostrar sus entrenamientos, tampoco puede ver los de otros
      const newCanViewOthers = newShowWorkouts ? prev.canViewOthersWorkouts : false
      
      return { 
        ...prev, 
        showWorkoutsInSocial: newShowWorkouts,
        canViewOthersWorkouts: newCanViewOthers
      }
    })
    setHasChanges(true)
  }

  const handleToggleViewOthers = () => {
    setTempSettings(prev => {
      const newCanViewOthers = !prev.canViewOthersWorkouts
      // Si quiere ver otros entrenamientos, debe mostrar los suyos
      const newShowWorkouts = newCanViewOthers ? true : prev.showWorkoutsInSocial
      
      return { 
        ...prev, 
        canViewOthersWorkouts: newCanViewOthers,
        showWorkoutsInSocial: newShowWorkouts
      }
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    // Aplicar cambios
    if (tempSettings.showWorkoutsInSocial !== settings.showWorkoutsInSocial) {
      toggleSocialVisibility()
    }
    if (tempSettings.canViewOthersWorkouts !== settings.canViewOthersWorkouts) {
      toggleViewOthersWorkouts()
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Privacidad Social
          </Typography>
          
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={tempSettings.showWorkoutsInSocial}
                  onChange={handleToggleSocial}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tempSettings.showWorkoutsInSocial ? (
                    <Visibility sx={{ color: 'primary.main', fontSize: 20 }} />
                  ) : (
                    <VisibilityOff sx={{ color: 'text.secondary', fontSize: 20 }} />
                  )}
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Mostrar mis entrenamientos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tempSettings.showWorkoutsInSocial 
                        ? 'Otros usuarios podrán ver tus entrenamientos del día'
                        : 'Tus entrenamientos serán privados'
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

            <FormControlLabel
              control={
                <Switch
                  checked={tempSettings.canViewOthersWorkouts}
                  onChange={handleToggleViewOthers}
                  color="primary"
                  disabled={!tempSettings.showWorkoutsInSocial}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tempSettings.canViewOthersWorkouts ? (
                    <Group sx={{ color: 'primary.main', fontSize: 20 }} />
                  ) : (
                    <GroupOff sx={{ color: 'text.secondary', fontSize: 20 }} />
                  )}
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Ver entrenamientos de otros
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tempSettings.canViewOthersWorkouts 
                        ? 'Puedes ver los entrenamientos de otros usuarios'
                        : 'No puedes ver entrenamientos de otros usuarios'
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
                backgroundColor: tempSettings.showWorkoutsInSocial ? 'grey.50' : 'grey.100',
                opacity: tempSettings.showWorkoutsInSocial ? 1 : 0.6,
                '&:hover': {
                  backgroundColor: tempSettings.showWorkoutsInSocial ? 'grey.100' : 'grey.100'
                }
              }}
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Nota:</strong> Para ver entrenamientos de otros usuarios, debes permitir que otros vean los tuyos. 
            Esta es una regla de reciprocidad para mantener la privacidad justa.
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
