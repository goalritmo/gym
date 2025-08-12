import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Stack, 
  Chip, 
  CircularProgress,
  Alert,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material'
import { FitnessCenter, AccessTime, TrendingUp, Settings, ThumbUp, ThumbUpOutlined } from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type SocialWorkout = {
  id: number
  exercise_name: string
  weight: number
  reps: number
  seconds?: number
  serie: number
  created_at: string
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  likes: number
  isLiked: boolean
}

type SocialListProps = {
  onOpenSettings?: () => void
}

export default function SocialList({ onOpenSettings }: SocialListProps) {
  const { settings } = useUserSettings()
  const [socialWorkouts, setSocialWorkouts] = useState<SocialWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    loadSocialWorkouts()
  }, [settings.canViewOthersWorkouts])

  const loadSocialWorkouts = async () => {
    setIsLoading(true)
    setError('')
    
    // Si el usuario no puede ver otros entrenamientos, no cargar nada
    if (!settings.canViewOthersWorkouts) {
      setSocialWorkouts([])
      setIsLoading(false)
      return
    }
    
    try {
      // Por ahora usaremos datos de ejemplo hasta que el backend esté listo
      const mockData: SocialWorkout[] = [
        {
          id: 1,
          exercise_name: 'Press de Banca',
          weight: 80,
          reps: 8,
          seconds: 120,
          serie: 1,
          created_at: new Date().toISOString(),
          user: {
            id: '1',
            name: 'María',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
          },
          likes: 3,
          isLiked: false
        },
        {
          id: 2,
          exercise_name: 'Sentadillas',
          weight: 100,
          reps: 10,
          serie: 2,
          created_at: new Date().toISOString(),
          user: {
            id: '2',
            name: 'Carlos',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
          },
          likes: 1,
          isLiked: true
        },
        {
          id: 3,
          exercise_name: 'Remo al mentón',
          weight: 45,
          reps: 12,
          seconds: 90,
          serie: 1,
          created_at: new Date().toISOString(),
          user: {
            id: '3',
            name: 'Ana',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
          },
          likes: 0,
          isLiked: false
        }
      ]
      
      setSocialWorkouts(mockData)
    } catch (error) {
      console.error('Error cargando entrenamientos sociales:', error)
      setError('Error al cargar los entrenamientos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (workoutId: number) => {
    try {
      // Simular llamada al backend
      setSocialWorkouts(prev => 
        prev.map(workout => 
          workout.id === workoutId 
            ? { 
                ...workout, 
                likes: workout.isLiked ? workout.likes - 1 : workout.likes + 1,
                isLiked: !workout.isLiked 
              }
            : workout
        )
      )

      // En el futuro, aquí se enviaría la notificación al usuario del workout
      const currentWorkout = socialWorkouts.find(w => w.id === workoutId)
      console.log(`Kudos ${currentWorkout?.isLiked ? 'removido' : 'agregado'} al workout ${workoutId}`)
    } catch (error) {
      console.error('Error al dar like:', error)
      // Revertir el cambio si hay error
      setSocialWorkouts(prev => 
        prev.map(workout => 
          workout.id === workoutId 
            ? { 
                ...workout, 
                likes: workout.isLiked ? workout.likes + 1 : workout.likes - 1,
                isLiked: !workout.isLiked 
              }
            : workout
        )
      )
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Si el usuario no puede ver otros entrenamientos, mostrar mensaje de privacidad
  if (!settings.canViewOthersWorkouts) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'grey.50',
            borderRadius: 2
          }}
        >
          <TrendingUp sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Privacidad activada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Para ver entrenamientos de otros usuarios, debes permitir que otros vean los tuyos en la configuración.
          </Typography>
          {onOpenSettings && (
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={onOpenSettings}
              sx={{ mt: 2 }}
            >
              Ir a Configuración
            </Button>
          )}
        </Paper>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (socialWorkouts.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'grey.50',
            borderRadius: 2
          }}
        >
          <TrendingUp sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay entrenamientos hoy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sé el primero en compartir tu entrenamiento del día
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          textAlign: 'center', 
          color: 'primary.main', 
          fontWeight: 'bold' 
        }}
      >
        Social
      </Typography>

      <Stack spacing={2}>
        {socialWorkouts.map((workout) => (
          <Card 
            key={workout.id} 
            sx={{ 
              boxShadow: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header con usuario */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={workout.user.avatar_url}
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2,
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {workout.user.name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {workout.user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(workout.created_at)}
                  </Typography>
                </Box>
              </Box>

              {/* Detalles del entrenamiento */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {workout.exercise_name}
                </Typography>
                
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip 
                    icon={<FitnessCenter />}
                    label={`${workout.weight} kg`} 
                    color="primary" 
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip 
                    label={`${workout.reps} reps`} 
                    color="secondary" 
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                  {workout.seconds && (
                    <Chip 
                      icon={<AccessTime />}
                      label={formatTime(workout.seconds)} 
                      color="info" 
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  )}
                  <Chip 
                    label={`Serie ${workout.serie}`} 
                    variant="outlined" 
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Stack>
              </Box>

              {/* Sección de likes */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {workout.likes} {workout.likes === 1 ? 'kudos' : 'kudos'}
                  </Typography>
                </Box>
                
                <Tooltip title={workout.isLiked ? 'Quitar kudos' : 'Dar kudos'}>
                  <IconButton
                    onClick={() => handleLike(workout.id)}
                    sx={{ 
                      color: workout.isLiked ? 'success.main' : 'text.secondary',
                      '&:hover': {
                        color: workout.isLiked ? 'success.dark' : 'success.main',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {workout.isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
