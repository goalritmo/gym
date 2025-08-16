import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  IconButton
} from '@mui/material'
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useUserSettings } from '../../contexts/UserSettingsContext'


type SocialWorkout = {
  session_id: number
  user_id: string
  user_name: string
  user_avatar_url?: string
  workout_date: string
  created_at: string
  total_exercises: number
  total_sets: number
  exercises: SocialExercise[]
  kudos_count: number
  has_kudos: boolean
}

type SocialExercise = {
  exercise_name: string
  total_sets: number
  set: number
  weight: number
  reps: number
  seconds?: number
}

export default function SocialList() {
  const { user } = useAuth()
  const { setOnSocialSettingsChange } = useUserSettings()
  const [socialWorkouts, setSocialWorkouts] = useState<SocialWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingKudos, setLoadingKudos] = useState<Set<number>>(new Set())

  

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      
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
      if (diffInMinutes === 1) return 'Hace 1 minuto'
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours === 1) return 'Hace 1 hora'
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

  const loadSocialWorkouts = useCallback(async () => {
    try {
      setLoading(true)
      const workouts = await apiClient.getSocialWorkouts(10, 0)
      console.log('🔍 Workouts cargados desde API:', workouts)
      console.log('🔍 Tipo de respuesta:', typeof workouts)
      console.log('🔍 Es array?', Array.isArray(workouts))
      
      if (Array.isArray(workouts) && workouts.length > 0) {
        console.log('🔍 Primer workout detalle:', {
          sessionId: workouts[0].session_id,
          kudosCount: workouts[0].kudos_count,
          hasKudos: workouts[0].has_kudos,
          totalExercises: workouts[0].total_exercises
        })
      }
      
      if (workouts === null || workouts === undefined) {
        console.log('🔍 API devolvió null/undefined, estableciendo array vacío')
        setSocialWorkouts([])
      } else if (Array.isArray(workouts)) {
        console.log('🔍 Estableciendo workouts:', workouts.length)
        setSocialWorkouts(workouts)
      } else {
        console.log('🔍 Respuesta no es array, estableciendo array vacío')
        setSocialWorkouts([])
      }
    } catch (error) {
      console.error('Error cargando entrenamientos sociales:', error)
      setError('Error al cargar el feed social')
    } finally {
      setLoading(false)
    }
  }, []) // Dependencies for useCallback

  const handleKudos = async (workoutId: number) => {
    if (!user) return
    
    // Solo permitir dar kudos si no se ha dado ya
    const workout = socialWorkouts.find(w => w.session_id === workoutId)
    if (!workout || workout.has_kudos) return
    
    try {
      setLoadingKudos(prev => new Set(prev).add(workoutId))
      
      // Llamada a la API para dar kudos
      await apiClient.giveKudos(workoutId)
      
      // Actualizar estado local
      setSocialWorkouts(prev => prev.map(workout => {
        if (workout.session_id === workoutId) {
          return {
            ...workout,
            has_kudos: true,
            kudos_count: workout.kudos_count + 1
          }
        }
        return workout
      }))
      
    } catch (error) {
      console.error('Error dando kudos:', error)
      // Mostrar error más específico
      const errorMessage = error instanceof Error ? error.message : 'Error al dar kudos'
      setError(`Error al dar kudos: ${errorMessage}`)
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
    
    console.log('🔍 Debug SocialList:', {
      totalWorkouts: socialWorkouts.length,
      workouts: socialWorkouts.map(w => ({ sessionId: w.session_id, userId: w.user_id, userName: w.user_name }))
    })
    
    socialWorkouts.forEach(workout => {
      // Agrupar por fecha de creación (created_at) en zona horaria local
      const workoutDate = new Date(workout.created_at)
      // Agregar un día para corregir el offset de zona horaria
      workoutDate.setDate(workoutDate.getDate() + 1)
      
      const year = workoutDate.getFullYear()
      const month = String(workoutDate.getMonth() + 1).padStart(2, '0')
      const day = String(workoutDate.getDate()).padStart(2, '0')
      const dayKey = `${year}-${month}-${day}` // YYYY-MM-DD con día agregado
      
      console.log('🔍 Debug agrupamiento:', {
        sessionId: workout.session_id,
        userName: workout.user_name,
        created_at: workout.created_at,
        workoutDate: workoutDate.toISOString(),
        dayKey: dayKey
      })
      
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(workout)
    })
    
    return Object.entries(groups)
      .map(([date, workouts]) => ({
        date,
        workouts: workouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ordenar grupos por fecha
  }, [socialWorkouts])

  useEffect(() => {
    loadSocialWorkouts()
  }, [loadSocialWorkouts])

  // Registrar callback para recargar cuando cambien las configuraciones sociales
  useEffect(() => {
    setOnSocialSettingsChange(() => loadSocialWorkouts)
    
    // Cleanup: remover callback cuando se desmonte el componente
    return () => {
      setOnSocialSettingsChange(() => {})
    }
  }, [setOnSocialSettingsChange, loadSocialWorkouts])

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
                  <Card key={workout.session_id} sx={{ 
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
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            bgcolor: 'primary.main'
                          }}
                        >
                          {workout.user_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {workout.user_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatRelativeTime(workout.created_at)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
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
                                                  <Typography variant="body2" color="text.secondary">
                            {workout.kudos_count === 0 
                              ? 'Dar el primer kudos' 
                              : `${workout.kudos_count} kudos`
                            }
                          </Typography>
                        
                        <IconButton
                          onClick={() => handleKudos(workout.session_id)}
                          disabled={loadingKudos.has(workout.session_id) || workout.has_kudos}
                          sx={{
                            color: workout.has_kudos ? '#FF9800' : 'text.secondary',
                            mr: -1, // Compensar padding del CardContent
                            '&:hover': {
                              color: workout.has_kudos ? '#FF9800' : 'primary.main'
                            }
                          }}
                        >
                          {loadingKudos.has(workout.session_id) ? (
                            <CircularProgress size={20} />
                          ) : workout.has_kudos ? (
                            <ThumbUpIcon />
                          ) : (
                            <ThumbUpOutlinedIcon />
                          )}
                        </IconButton>
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
