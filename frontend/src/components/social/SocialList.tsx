import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Switch
} from '@mui/material'
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type SocialWorkout = {
  id: number
  user_id: string
  user_name: string
  user_avatar?: string
  workout_day_id: number
  workout_date: string
  total_exercises: number
  total_series: number
  exercises: SocialExercise[]
  kudos_count: number
  has_kudos: boolean
}

type SocialExercise = {
  exercise_name: string
  total_series: number
  serie: number
  weight: number
  reps: number
  seconds?: number
}

export default function SocialList() {
  const { user } = useAuth()
  const { settings } = useUserSettings()
  const [socialWorkouts, setSocialWorkouts] = useState<SocialWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingKudos, setLoadingKudos] = useState<Set<number>>(new Set())

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      date.setDate(date.getDate() + 1) // Compensar offset de timezone
      
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      
      const weekday = weekdays[date.getDay()]
      const day = date.getDate()
      const month = months[date.getMonth()]
      
      return `${weekday} ${day} de ${month}`
    } catch (error) {
      console.error('Error formateando fecha:', error)
      return dateString
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Hace un momento'
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `Hace ${diffInHours} horas`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return 'Ayer'
      if (diffInDays < 7) return `Hace ${diffInDays} días`
      
      return formatDate(dateString)
    } catch (error) {
      console.error('Error formateando tiempo relativo:', error)
      return dateString
    }
  }

  const loadSocialWorkouts = async () => {
    try {
      setLoading(true)
      const workouts = await apiClient.getSocialWorkouts(10, 0)
      setSocialWorkouts(Array.isArray(workouts) ? workouts : [])
    } catch (error) {
      console.error('Error cargando entrenamientos sociales:', error)
      setError('Error al cargar el feed social')
    } finally {
      setLoading(false)
    }
  }

  const handleKudos = async (workoutId: number) => {
    if (!user) return
    
    try {
      setLoadingKudos(prev => new Set(prev).add(workoutId))
      
      // Aquí iría la llamada a la API para dar/quitar kudos
      // Por ahora simulamos la funcionalidad
      setSocialWorkouts(prev => prev.map(workout => {
        if (workout.id === workoutId) {
          return {
            ...workout,
            has_kudos: !workout.has_kudos,
            kudos_count: workout.has_kudos ? workout.kudos_count - 1 : workout.kudos_count + 1
          }
        }
        return workout
      }))
      
      // TODO: Implementar API call cuando esté lista
      // await apiClient.toggleKudos(workoutId)
      
    } catch (error) {
      console.error('Error dando kudos:', error)
      setError('Error al dar kudos')
    } finally {
      setLoadingKudos(prev => {
        const newSet = new Set(prev)
        newSet.delete(workoutId)
        return newSet
      })
    }
  }

  // Filtrar y agrupar workouts por día
  const groupedWorkouts = useMemo(() => {
    const groups: { [key: string]: SocialWorkout[] } = {}
    
    // Filtrar workouts propios si la opción está desactivada
    const filteredWorkouts = settings.showOwnWorkoutsInSocial 
      ? socialWorkouts 
      : socialWorkouts.filter(workout => workout.user_id !== user?.id)
    
    filteredWorkouts.forEach(workout => {
      const dayKey = workout.workout_date
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(workout)
    })
    
    return Object.entries(groups).map(([date, workouts]) => ({
      date,
      workouts: workouts.sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime())
    }))
  }, [socialWorkouts, settings.showOwnWorkoutsInSocial, user?.id])

  useEffect(() => {
    loadSocialWorkouts()
  }, [])

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 200px)',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Cargando feed social...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
          <Box sx={{ p: 1 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
          Feed Social
        </Typography>
      
      <Stack spacing={3}>
        {groupedWorkouts.length > 0 ? (
          groupedWorkouts.map(({ date, workouts }) => (
            <Box key={date}>
              {/* Header del día */}
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary', 
                mb: 2, 
                px: 1,
                textAlign: 'center'
              }}>
                {formatDate(date)}
              </Typography>
              
              {/* Workouts del día */}
              <Stack spacing={2}>
                {workouts.map((workout) => (
                  <Card key={workout.id} sx={{ 
                    boxShadow: 2, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header del workout */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={workout.user_avatar}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            bgcolor: workout.user_avatar ? 'transparent' : 'primary.main'
                          }}
                        >
                          {!workout.user_avatar && workout.user_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {workout.user_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatRelativeTime(workout.workout_date)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {workout.total_exercises}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {workout.total_exercises === 1 ? 'ejercicio' : 'ejercicios'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Acciones */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {workout.kudos_count} {workout.kudos_count === 1 ? 'kudo' : 'kudos'}
                          </Typography>
                        </Box>
                        
                        <Tooltip title={workout.has_kudos ? 'Quitar kudo' : 'Dar kudo'}>
                          <IconButton
                            onClick={() => handleKudos(workout.id)}
                            disabled={loadingKudos.has(workout.id)}
                            sx={{
                              color: workout.has_kudos ? 'error.main' : 'text.secondary',
                              '&:hover': {
                                color: workout.has_kudos ? 'error.dark' : 'primary.main'
                              }
                            }}
                          >
                            {loadingKudos.has(workout.id) ? (
                              <CircularProgress size={20} />
                            ) : workout.has_kudos ? (
                              <ThumbUpIcon />
                            ) : (
                              <ThumbUpOutlinedIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No hay entrenamientos registrados
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
