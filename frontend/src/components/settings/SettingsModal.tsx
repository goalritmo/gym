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
  Alert
} from '@mui/material'
import { Settings, People, PersonOff } from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type SettingsModalProps = {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, toggleSocial } = useUserSettings()
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

  const handleSave = () => {
    // Aplicar cambios
    if (tempSettings.socialEnabled !== settings.socialEnabled) {
      toggleSocial()
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
            Funcionalidad Social
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

        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Nota:</strong> Cuando la funcionalidad social está deshabilitada, 
            no podrás ver entrenamientos de otros usuarios ni ellos podrán ver los tuyos.
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
