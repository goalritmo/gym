import { Box, Snackbar, Alert } from '@mui/material'
import { useState, useEffect } from 'react'
import Navigation from '../navigation/Navigation'
import WorkoutForm from '../workout/WorkoutForm'
import ExerciseList from '../exercises/ExerciseList'
import EquipmentList from '../equipment/EquipmentList'
import WorkoutHistory from '../workout/WorkoutHistory'
import FloatingNavButton from '../navigation/FloatingNavButton'
import type { Workout, WorkoutSession } from '../../types/workout'
import { useTab } from '../../contexts/TabContext'
import { apiClient } from '../../lib/api'
import { TABS, type TabType } from '../../constants/tabs'

export default function AuthenticatedApp() {
  const { activeTab, setActiveTab } = useTab()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [isSubmittingWorkout, setIsSubmittingWorkout] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Función para cargar datos desde el backend
  const loadData = async () => {
    try {
      console.log('Cargando datos desde el backend...')
      
      // Cargar workouts, sesiones y ejercicios en paralelo
      const [workoutsData, sessionsData, exercisesData] = await Promise.all([
        apiClient.getWorkouts(),
        apiClient.getWorkoutSessions(),
        apiClient.getExercises()
      ])
      
      console.log('Workouts cargados:', workoutsData)
      console.log('Sesiones cargadas:', sessionsData)
      console.log('Ejercicios cargados:', exercisesData)
      
      setWorkouts(Array.isArray(workoutsData) ? workoutsData : [])
      setWorkoutSessions(Array.isArray(sessionsData) ? sessionsData : [])
      setExercises(Array.isArray(exercisesData) ? exercisesData : [])
    } catch (error) {
      console.error('Error cargando datos del backend:', error)
      
      // Fallback a localStorage si el backend falla
      console.log('Intentando cargar desde localStorage...')
      const savedWorkouts = localStorage.getItem('gym-workouts')
      const savedSessions = localStorage.getItem('gym-workout-sessions')
      
      if (savedWorkouts) {
        setWorkouts(JSON.parse(savedWorkouts))
      }
      
      if (savedSessions) {
        setWorkoutSessions(JSON.parse(savedSessions))
      }
      
      // Solo usar ejercicios por defecto si no hay ninguno cargado
      console.log('⚠️ No se pudieron cargar ejercicios del backend. Usando array vacío.')
      setExercises([])
    }
  }

  // Cargar datos desde el backend al montar el componente
  useEffect(() => {
    loadData()
  }, [])

  // Guardar workouts cuando cambien
  useEffect(() => {
    if (workouts.length > 0) {
      localStorage.setItem('gym-workouts', JSON.stringify(workouts))
    }
  }, [workouts])

  // Guardar sessions cuando cambien
  useEffect(() => {
    if (workoutSessions.length > 0) {
      localStorage.setItem('gym-workout-sessions', JSON.stringify(workoutSessions))
    }
  }, [workoutSessions])

  const handleTabChange = (newValue: TabType) => {
    setActiveTab(newValue)
  }

  // Función para manejar el envío del formulario de workout
  const handleWorkoutSubmit = async (data: any): Promise<void> => {
    setIsSubmittingWorkout(true)
    try {
      const today = new Date().toISOString()
      const todayDate = today.split('T')[0] + 'T00:00:00Z'

      // Buscar si ya existe una sesión para hoy (primero en estado local)
      let currentSession = workoutSessions.find(session => 
        session.session_date.split('T')[0] === today.split('T')[0]
      )

      // Si no existe, crear una nueva sesión en el backend
      if (!currentSession) {
        console.log('Creando nueva sesión en el backend...')
        const newSessionData = {
          session_date: todayDate,
          session_name: 'Entrenamiento del día',
          effort: 2,
          mood: 2
        }
        
        const newSession = await apiClient.createWorkoutSession(newSessionData) as WorkoutSession
        currentSession = newSession
        console.log('Sesión creada:', currentSession)
        setWorkoutSessions(prev => [...prev, currentSession!])
      }

      // Crear el nuevo workout en el backend
      console.log('Creando workout en el backend...')
      const workoutData = {
        exercise_id: data.exercise_id,
        weight: data.weight || 0,
        reps: data.reps || 0,
        serie: data.serie || null,
        seconds: data.seconds || null,
        observations: data.observations || null,
        exercise_session_id: currentSession.id
      }

      const newWorkout = await apiClient.createWorkout(workoutData) as Workout
      console.log('Workout creado en backend:', newWorkout)
      
      console.log('✅ Workout guardado exitosamente en Supabase')
      
      // Refrescar la página después de 1 segundo para que se vea el mensaje de éxito
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('❌ Error guardando workout:', error)
      throw error // Re-lanzar el error para que el formulario lo capture
    } finally {
      setIsSubmittingWorkout(false)
    }
  }

  // Función para eliminar un workout
  const handleDeleteWorkout = async (workoutId: number) => {
    try {
      console.log('Eliminando workout del backend...', workoutId)
      await apiClient.deleteWorkout(workoutId)
      
      // Actualizar estado local
      setWorkouts(prev => prev.filter(w => w.id !== workoutId))
      console.log('✅ Workout eliminado exitosamente')
      setDeleteMessage('Entrenamiento eliminado exitosamente')
    } catch (error) {
      console.error('❌ Error eliminando workout:', error)
      setDeleteError('Error al eliminar el entrenamiento')
    }
  }

  // Función para actualizar una sesión
  const handleUpdateSession = async (sessionId: number, updates: Partial<WorkoutSession>) => {
    try {
      console.log('Actualizando sesión en el backend...', sessionId, updates)
      const result = await apiClient.updateWorkoutSession(sessionId, updates)
      console.log('🔍 Respuesta del backend:', result)
      
      // Solo actualizar estado local si el backend confirma éxito
      setWorkoutSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, ...updates }
            : session
        )
      )
      console.log('✅ Sesión actualizada exitosamente')
      return result
    } catch (error) {
      console.error('❌ Error actualizando sesión:', error)
      throw error // Propagar el error para que el frontend lo maneje
    }
  }



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <Box sx={{ 
        flexGrow: 1, 
        p: 2,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        '&::-moz-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {/* Pestaña Entrenamiento */}
        {activeTab === TABS.WORKOUT && (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <WorkoutForm 
              exercises={exercises} 
              onSubmit={handleWorkoutSubmit}
              isLoading={isSubmittingWorkout}
            />
          </Box>
        )}

        {/* Pestaña Ejercicios */}
        {activeTab === TABS.EXERCISES && (
          <Box>
            <ExerciseList 
              exercises={[
                { 
                  id: 1, 
                  name: 'Press de Banca', 
                  muscle_group: 'Pecho', 
                  primary_muscles: ['Pectoral Mayor', 'Tríceps'],
                  secondary_muscles: ['Deltoides Anterior', 'Serrato Anterior'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
                },
                { 
                  id: 2, 
                  name: 'Sentadilla', 
                  muscle_group: 'Piernas', 
                  primary_muscles: ['Cuádriceps', 'Glúteos'],
                  secondary_muscles: ['Isquiotibiales', 'Gastrocnemio', 'Core'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U'
                },
                { 
                  id: 3, 
                  name: 'Peso Muerto', 
                  muscle_group: 'Espalda', 
                  primary_muscles: ['Erector Espinal', 'Glúteos', 'Isquiotibiales'],
                  secondary_muscles: ['Trapecio', 'Romboides', 'Core'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
                },
                { 
                  id: 4, 
                  name: 'Press Militar', 
                  muscle_group: 'Hombros', 
                  primary_muscles: ['Deltoides Anterior', 'Deltoides Medio'],
                  secondary_muscles: ['Tríceps', 'Trapecio Superior'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI'
                },
                { 
                  id: 5, 
                  name: 'Curl de Bíceps', 
                  muscle_group: 'Brazos', 
                  primary_muscles: ['Bíceps Braquial'],
                  secondary_muscles: ['Braquiorradial', 'Braquial'],
                  equipment: 'Mancuernas',
                  video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oa'
                },
              ]} 
              onSelectExercise={(exercise) => console.log('Ejercicio seleccionado:', exercise)} 
            />
          </Box>
        )}

        {/* Pestaña Equipamiento */}
        {activeTab === TABS.EQUIPMENT && (
          <Box>
            <EquipmentList 
              equipment={[
                {
                  id: 1,
                  name: 'Barra Olímpica',
                  category: 'BARRA',
                  observations: 'Barra estándar de 20kg con roscas para discos',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                  created_at: '2024-01-01T00:00:00Z'
                },
                {
                  id: 2,
                  name: 'Mancuernas Ajustables',
                  category: 'MANCUERNAS',
                  observations: 'Par de mancuernas ajustables de 5-25kg',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-02T00:00:00Z'
                },
                {
                  id: 3,
                  name: 'Rack de Sentadillas',
                  category: 'RACK',
                  observations: 'Rack de potencia con soporte para sentadillas y press de banca',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-03T00:00:00Z'
                },
                {
                  id: 4,
                  name: 'Banco de Ejercicios',
                  category: 'BANCO',
                  observations: 'Banco ajustable para press de banca y ejercicios variados',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-04T00:00:00Z'
                },
                {
                  id: 5,
                  name: 'Cinta de Correr',
                  category: 'CARDIO',
                  observations: 'Cinta de correr profesional con inclinación ajustable',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-05T00:00:00Z'
                }
              ]}
            />
          </Box>
        )}

        {/* Pestaña Historial */}
        {activeTab === TABS.HISTORY && (
          <Box>
            <WorkoutHistory 
              workoutSessions={workoutSessions}
              workouts={workouts}
              onDelete={handleDeleteWorkout}
              onUpdateSession={handleUpdateSession}
              onTabChange={handleTabChange}
            />
          </Box>
        )}
      </Box>

      {/* Notificaciones para eliminación */}
      <Snackbar
        open={!!deleteMessage}
        autoHideDuration={3000}
        onClose={() => setDeleteMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 6,
          width: { xs: '95%', sm: '90%', md: '70%' },
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            border: '1px solid #4caf50',
            '& .MuiAlert-icon': {
              color: '#2e7d32'
            }
          }}
        >
          ✅ {deleteMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!deleteError}
        autoHideDuration={4000}
        onClose={() => setDeleteError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 6,
          width: { xs: '95%', sm: '90%', md: '70%' },
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor: '#ffebee',
            color: '#c62828',
            border: '1px solid #f44336',
            '& .MuiAlert-icon': {
              color: '#c62828'
            }
          }}
        >
          ❌ {deleteError}
        </Alert>
      </Snackbar>

      {/* Botón flotante para navegación rápida */}
      <FloatingNavButton 
        currentTab={activeTab} 
        onTabChange={handleTabChange} 
      />
    </Box>
  )
}
