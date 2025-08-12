import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  IconButton,
  Button
} from '@mui/material'
import { 
  Notifications, 
  Info, 
  ThumbUp, 
  Announcement,
  Close,
  CheckCircleOutline
} from '@mui/icons-material'

type NotificationType = 'general' | 'kudos' | 'announcement'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  created_at: string
  read: boolean
  // Para kudos agrupados
  from_users?: {
    id: string
    name: string
    avatar_url?: string
  }[]
  workout?: {
    id: number
    exercise_name: string
    date: string
  }
  // Para anuncios generales
  priority?: 'low' | 'medium' | 'high'
}

type NotificationsModalProps = {
  open: boolean
  onClose: () => void
  onMarkAsRead: (count: number) => void
}

export default function NotificationsModal({ open, onClose, onMarkAsRead }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  const loadNotifications = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Datos de ejemplo - en el futuro vendrán del backend
      const mockData: Notification[] = [
        {
          id: '1',
          type: 'announcement',
          title: 'Gimnasio cerrado por la tarde',
          message: 'El gimnasio estará cerrado hoy de 14:00 a 18:00 por mantenimiento. Disculpen las molestias.',
          created_at: new Date().toISOString(),
          read: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'kudos',
          title: 'Nuevos kudos en tu entrenamiento',
          message: '3 personas dieron kudos a tu entrenamiento de Press de Banca del lunes 10 de agosto',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          read: false,
          from_users: [
            {
              id: '1',
              name: 'María',
              avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
            },
            {
              id: '2',
              name: 'Carlos',
              avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
            },
            {
              id: '3',
              name: 'Ana',
              avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
            }
          ],
          workout: {
            id: 1,
            exercise_name: 'Press de Banca',
            date: '2025-08-10'
          }
        },
        {
          id: '3',
          type: 'kudos',
          title: 'Kudos en tu entrenamiento',
          message: 'Carlos dio kudos a tu entrenamiento de Sentadillas del domingo 9 de agosto',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
          read: true,
          from_users: [
            {
              id: '2',
              name: 'Carlos',
              avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
            }
          ],
          workout: {
            id: 2,
            exercise_name: 'Sentadillas',
            date: '2025-08-09'
          }
        },
        {
          id: '4',
          type: 'general',
          title: 'Nuevo equipamiento disponible',
          message: 'Ya está disponible el nuevo rack de sentadillas en la zona de peso libre.',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
          read: true,
          priority: 'medium'
        }
      ]
      
      setNotifications(mockData)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setError('Error al cargar las notificaciones')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      )
      onMarkAsRead(1)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Hace unos minutos'
    } else if (diffInHours === 1) {
      return 'Hace 1 hora'
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) {
        return 'Ayer'
      } else {
        return `Hace ${diffInDays} días`
      }
    }
  }

  const formatWorkoutDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    })
  }

  const getNotificationIcon = (type: NotificationType, priority?: string) => {
    switch (type) {
      case 'announcement':
        return <Announcement sx={{ color: priority === 'high' ? 'error.main' : 'warning.main' }} />
      case 'kudos':
        return <ThumbUp sx={{ color: 'success.main' }} />
      case 'general':
        return <Info sx={{ color: 'info.main' }} />
      default:
        return <Notifications />
    }
  }

  const getNotificationColor = (type: NotificationType, priority?: string) => {
    switch (type) {
      case 'announcement':
        return priority === 'high' ? 'error' : 'warning'
      case 'kudos':
        return 'success'
      case 'general':
        return 'info'
      default:
        return 'default'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
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
          <Notifications sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Chip 
              label={unreadCount} 
              size="small"
              sx={{ 
                ml: 1, 
                fontWeight: 'bold',
                backgroundColor: '#ff9800',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#f57c00'
                }
              }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, px: 3, pb: 3 }}>
        {isLoading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px' 
          }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : notifications.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              backgroundColor: 'grey.50',
              borderRadius: 2
            }}
          >
            <Notifications sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay notificaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Te notificaremos cuando haya novedades importantes
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                sx={{ 
                  boxShadow: notification.read ? 1 : 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: notification.read ? 'divider' : 'divider',
                  backgroundColor: notification.read ? 'background.paper' : '#fff3e0',
                  opacity: notification.read ? 0.8 : 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header con icono y fecha */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%',
                      backgroundColor: `${getNotificationColor(notification.type, notification.priority)}.light`,
                      mr: 2,
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(notification.created_at)}
                      </Typography>
                    </Box>


                  </Box>

                  {/* Mensaje */}
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {notification.message}
                  </Typography>

                  {/* Información adicional para kudos */}
                  {notification.type === 'kudos' && notification.from_users && notification.workout && (
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      mt: 2
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        Entrenamiento: {notification.workout.exercise_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        {formatWorkoutDate(notification.workout.date)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Kudos de:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {notification.from_users.map((user) => (
                            <Avatar 
                              key={user.id}
                              src={user.avatar_url}
                              sx={{ 
                                width: 24, 
                                height: 24,
                                fontSize: '0.7rem',
                                border: '1px solid white'
                              }}
                            >
                              {user.name.charAt(0)}
                            </Avatar>
                          ))}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThumbUp sx={{ color: 'success.main', fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          {notification.from_users.length} kudos
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Botón marcar como leída */}
                  {!notification.read && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: 2 
                    }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleOutline />}
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1.5,
                          backgroundColor: '#ff9800',
                          color: 'transparent',
                          '&:hover': {
                            backgroundColor: '#f57c00'
                          }
                        }}
                      >
                        Marcar como leída
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
