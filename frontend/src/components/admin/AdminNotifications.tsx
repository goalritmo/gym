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
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'

type AdminNotification = {
  id: number
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  created_at: string
  updated_at: string
}

type CreateNotificationForm = {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
}

const notificationTypeIcons = {
  info: <InfoIcon sx={{ color: 'info.main' }} />,
  warning: <WarningIcon sx={{ color: 'warning.main' }} />,
  success: <SuccessIcon sx={{ color: 'success.main' }} />,
  error: <ErrorIcon sx={{ color: 'error.main' }} />
}

const notificationTypeColors = {
  info: 'info',
  warning: 'warning',
  success: 'success',
  error: 'error'
} as const

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CreateNotificationForm>({
    title: '',
    message: '',
    type: 'info'
  })

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminNotifications() as AdminNotification[]
      setNotifications(data || [])
      setError('')
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setError('Error al cargar las notificaciones')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleCreateNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError('El título y mensaje son requeridos')
      return
    }

    try {
      setCreating(true)
      await apiClient.createAdminNotification(form)
      setForm({
        title: '',
        message: '',
        type: 'info'
      })
      setOpenDialog(false)
      await loadNotifications() // Recargar lista
    } catch (error) {
      console.error('Error creando notificación:', error)
      setError('Error al crear la notificación')
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
          Notificaciones del Sistema
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ fontWeight: 600 }}
        >
          Agregar
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      <Stack spacing={2}>
        {notifications.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No hay notificaciones creadas
              </Typography>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} sx={{ 
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
                    {notificationTypeIcons[notification.type]}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.type}
                        color={notificationTypeColors[notification.type]}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label="Sistema"
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {notification.message}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Creada: {formatDate(notification.created_at)}
                      {notification.updated_at !== notification.created_at && 
                        ` • Actualizada: ${formatDate(notification.updated_at)}`
                      }
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Create Notification Dialog */}
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
          Agregar Notificación
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              placeholder="Ej: Mantenimiento programado"
            />

            <TextField
              label="Mensaje"
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              fullWidth
              required
              multiline
              rows={4}
              placeholder="Describe el mensaje de la notificación..."
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Notificación</InputLabel>
              <Select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                label="Tipo de Notificación"
              >
                <MenuItem value="info">Información</MenuItem>
                <MenuItem value="warning">Advertencia</MenuItem>
                <MenuItem value="success">Éxito</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>


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
            onClick={handleCreateNotification}
            disabled={creating || !form.title.trim() || !form.message.trim()}
            startIcon={creating ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {creating ? 'Creando...' : 'Crear Notificación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
