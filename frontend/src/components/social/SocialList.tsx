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
  Tooltip,
  Divider
} from '@mui/material'
import { FitnessCenter, TrendingUp, Settings, ThumbUp, ThumbUpOutlined } from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import { apiClient } from '../../lib/api'

type SocialWorkout = {
  session_id: number
  user_id: string
  user_name: string
  user_avatar_url?: string
  workout_date: string
  exercises: {
    exercise_name: string
    weight: number
    reps: number
    seconds?: number
    serie: number
  }[]
  total_exercises: number
  total_series: number
  likes: number
  is_liked: boolean
}

type SocialListProps = {
  onOpenSettings?: () => void
}

export default function SocialList({ onOpenSettings }: SocialListProps) {
  const { settings } = useUserSettings()
  const [socialWorkouts, setSocialWorkouts] = useState<SocialWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 10

  useEffect(() => {
    loadSocialWorkouts()
  }, [settings.socialEnabled])

  const loadSocialWorkouts = async (isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setOffset(0)
    }
    setError('')
    
    // Si el usuario no tiene habilitada la funcionalidad social, no cargar nada
    if (!settings.socialEnabled) {
      setSocialWorkouts([])
      setIsLoading(false)
      setIsLoadingMore(false)
      return
    }
    
    try {
      const currentOffset = isLoadMore ? offset : 0
      const data = await apiClient.getSocialWorkouts(limit, currentOffset)
      console.log('🔍 Social workouts recibidos:', data)
      
      if (isLoadMore) {
        setSocialWorkouts(prev => [...(prev || []), ...(data || [])])
        setOffset(prev => prev + limit)
      } else {
        setSocialWorkouts(data || [])
        setOffset(limit)
      }
      
      // Si recibimos menos de 'limit' items, no hay más datos
      setHasMore((data || []).length === limit)
    } catch (error: any) {
      console.error('Error cargando entrenamientos sociales:', error)
      if (error.response?.status === 403) {
        setError('La funcionalidad social está deshabilitada para tu cuenta')
      } else {
        setError('Error cargando entrenamientos sociales')
      }
      if (!isLoadMore) {
        setSocialWorkouts([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleLike = async (workoutId: number) => {
    try {
      // Simular llamada al backend
      setSocialWorkouts(prev => 
        prev.map(workout => 
          workout.session_id === workoutId 
            ? { 
                ...workout, 
                likes: workout.is_liked ? workout.likes - 1 : workout.likes + 1,
                is_liked: !workout.is_liked 
              }
            : workout
        )
      )

      // En el futuro, aquí se enviaría la notificación al usuario del workout
      const currentWorkout = socialWorkouts.find(w => w.session_id === workoutId)
      console.log(`Kudos ${currentWorkout?.is_liked ? 'removido' : 'agregado'} al workout ${workoutId}`)
    } catch (error) {
      console.error('Error al dar kudos:', error)
      // Revertir el cambio si hay error
      setSocialWorkouts(prev => 
        prev.map(workout => 
          workout.session_id === workoutId 
            ? { 
                ...workout, 
                likes: workout.is_liked ? workout.likes + 1 : workout.likes - 1,
                is_liked: !workout.is_liked 
              }
            : workout
        )
      )
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
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatWorkoutDate = (dateString: string): string => {
    const date = new Date(dateString)
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    
    return `${weekday} ${day} de ${month}`
  }

  // Si el usuario no tiene habilitada la funcionalidad social, mostrar mensaje de privacidad
  if (!settings.socialEnabled) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            py: 4, 
            textAlign: 'center',
            backgroundColor: 'grey.50',
            borderRadius: 2
          }}
        >
          <TrendingUp sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Funcionalidad Deshabilitada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Para ver y compartir entrenamientos con otros usuarios, habilita la funcionalidad social en la configuración.
          </Typography>
          {onOpenSettings && (
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={onOpenSettings}
              sx={{ mt: 2 }}
            >
              Habilitar
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

  // Asegurar que socialWorkouts nunca sea null
  const safeSocialWorkouts = socialWorkouts || []
  
  console.log('🔍 Estado de socialWorkouts:', { socialWorkouts: safeSocialWorkouts, length: safeSocialWorkouts.length })
  
  if (safeSocialWorkouts.length === 0) {
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
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
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

      <Stack spacing={3}>
        {safeSocialWorkouts.map((workout) => (
          <Card 
            key={workout.session_id} 
            sx={{ 
              boxShadow: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header con usuario y fecha */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Avatar 
                  src={workout.user_avatar_url && workout.user_avatar_url.trim() !== '' ? workout.user_avatar_url : undefined}
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2,
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {workout.user_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
                    {workout.user_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    {formatWorkoutDate(workout.workout_date)} • {formatDate(workout.workout_date)}
                  </Typography>
                </Box>
              </Box>

              {/* Resumen del entrenamiento */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    textAlign: 'left'
                  }}
                >
                  Entrenamiento del día
                </Typography>
                
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2, justifyContent: 'flex-start' }}>
                  <Chip 
                    icon={<FitnessCenter />}
                    label={`${workout.total_exercises} ejercicio${workout.total_exercises > 1 ? 's' : ''}`} 
                    color="primary" 
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip 
                    label={`${workout.total_series} serie${workout.total_series > 1 ? 's' : ''}`} 
                    color="secondary" 
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Stack>

              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Sección de kudos */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {workout.likes} {workout.likes === 1 ? 'kudos' : 'kudos'}
                  </Typography>
                </Box>
                
                <Tooltip title={workout.is_liked ? 'Quitar kudos' : 'Dar kudos'}>
                  <IconButton
                    onClick={() => handleLike(workout.session_id)}
                    sx={{ 
                      color: workout.is_liked ? 'success.main' : 'text.secondary',
                      '&:hover': {
                        color: workout.is_liked ? 'success.dark' : 'success.main',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {workout.is_liked ? <ThumbUp /> : <ThumbUpOutlined />}
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        ))}
        
        {/* Botón "Cargar más" */}
        {hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => loadSocialWorkouts(true)}
              disabled={isLoadingMore}
              startIcon={isLoadingMore ? <CircularProgress size={20} /> : null}
            >
              {isLoadingMore ? 'Cargando...' : 'Cargar más'}
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
