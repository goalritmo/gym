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

type SocialWorkout = {
  id: number
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  date: string
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
  }, [settings.socialEnabled])

  const loadSocialWorkouts = async () => {
    setIsLoading(true)
    setError('')
    
    // Si el usuario no tiene habilitada la funcionalidad social, no cargar nada
    if (!settings.socialEnabled) {
      setSocialWorkouts([])
      setIsLoading(false)
      return
    }
    
    try {
      // Por ahora usaremos datos de ejemplo hasta que el backend esté listo
      const mockData: SocialWorkout[] = [
        {
          id: 1,
          user: {
            id: '1',
            name: 'María',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
          },
          date: new Date().toISOString(),
          exercises: [
            {
              exercise_name: 'Press de Banca',
              weight: 80,
              reps: 8,
              seconds: 120,
              serie: 1
            },
            {
              exercise_name: 'Press de Banca',
              weight: 80,
              reps: 6,
              seconds: 90,
              serie: 2
            },
            {
              exercise_name: 'Press de Banca',
              weight: 75,
              reps: 8,
              seconds: 100,
              serie: 3
            }
          ],
          total_exercises: 1,
          total_series: 3,
          likes: 3,
          isLiked: false
        },
        {
          id: 2,
          user: {
            id: '2',
            name: 'Carlos',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
          },
          date: new Date().toISOString(),
          exercises: [
            {
              exercise_name: 'Sentadillas',
              weight: 100,
              reps: 10,
              serie: 1
            },
            {
              exercise_name: 'Sentadillas',
              weight: 100,
              reps: 8,
              serie: 2
            },
            {
              exercise_name: 'Peso Muerto',
              weight: 120,
              reps: 6,
              serie: 1
            },
            {
              exercise_name: 'Peso Muerto',
              weight: 120,
              reps: 6,
              serie: 2
            }
          ],
          total_exercises: 2,
          total_series: 4,
          likes: 1,
          isLiked: true
        },
        {
          id: 3,
          user: {
            id: '3',
            name: 'Ana',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
          },
          date: new Date().toISOString(),
          exercises: [
            {
              exercise_name: 'Remo al mentón',
              weight: 45,
              reps: 12,
              seconds: 90,
              serie: 1
            },
            {
              exercise_name: 'Remo al mentón',
              weight: 45,
              reps: 10,
              seconds: 85,
              serie: 2
            }
          ],
          total_exercises: 1,
          total_series: 2,
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
      console.error('Error al dar kudos:', error)
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
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    })
  }

  // Si el usuario no tiene habilitada la funcionalidad social, mostrar mensaje de privacidad
  if (!settings.socialEnabled) {
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
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
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
              {/* Header con usuario y fecha */}
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
                    {formatWorkoutDate(workout.date)} • {formatDate(workout.date)}
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
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Entrenamiento del día
                </Typography>
                
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
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

                {/* Píldoras de ejercicios únicos */}
                <Box sx={{ mt: 2 }}>
                  {Array.from(new Set(workout.exercises.map(e => e.exercise_name))).map((exerciseName, index) => (
                    <Chip 
                      key={index}
                      label={exerciseName}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        mr: 1, 
                        mb: 1,
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
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
