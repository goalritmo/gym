import { Box, Snackbar, Alert, Backdrop, CircularProgress, Typography } from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import WorkoutForm from '../workout/WorkoutForm'
import WorkoutHistory from '../workout/WorkoutHistory'
import ExerciseList from '../exercises/ExerciseList'
import EquipmentList from '../equipment/EquipmentList'
import SocialList from '../social/SocialList'
import RoutineList from '../routines/RoutineList'
import AdminPanel from '../admin/AdminPanel'
import Navigation from '../navigation/Navigation'
import SettingsModal from '../settings/SettingsModal'
import NotificationsModal from '../notifications/NotificationsModal'
import { TABS, type TabType } from '../../constants/tabs'
import { UserSettingsProvider, useUserSettings } from '../../contexts/UserSettingsContext'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import type { Workout, WorkoutDay } from '../../types/workout'
import { useTab } from '../../contexts/TabContext'
import { apiClient } from '../../lib/api'
import FloatingNavButton from '../navigation/FloatingNavButton'

type Exercise = {
  id: number
  name: string
  bodyweight?: boolean
}

function AuthenticatedAppContent() {
  const { activeTab, setActiveTab } = useTab()
  const { isLoggingOut, isSigningIn } = useAuth()
  const { initializeAllExercisesAsFavorites } = useUserSettings()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isSubmittingWorkout, setIsSubmittingWorkout] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Función para cargar el contador de notificaciones no leídas
  const loadUnreadNotificationsCount = useCallback(async () => {
    try {
      const response = await apiClient.getUnreadNotificationsCount() as { unread_count: number }
      setUnreadNotifications(response.unread_count || 0)
    } catch (error) {
      console.error('Error cargando contador de notificaciones:', error)
      setUnreadNotifications(0)
    }
  }, [])

  // Función para cargar datos desde el backend
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Cargar workouts, workout days y ejercicios en paralelo
      const [workoutsData, workoutDaysData, exercisesData] = await Promise.all([
        apiClient.getWorkouts(),
        apiClient.getWorkoutDays(),
        apiClient.getExercises()
      ])
      
      setWorkouts(Array.isArray(workoutsData) ? workoutsData : [])
      setWorkoutDays(Array.isArray(workoutDaysData) ? workoutDaysData : [])
      setExercises(Array.isArray(exercisesData) ? exercisesData : [])
      
      // Inicializar todos los ejercicios como favoritos si no hay configuración previa
      if (Array.isArray(exercisesData) && exercisesData.length > 0) {
        const exerciseIds = exercisesData.map(ex => ex.id)
        initializeAllExercisesAsFavorites(exerciseIds)
      }
    } catch (error) {
      console.error('Error cargando datos del backend:', error)
      
      // Fallback a localStorage si el backend falla
      const savedWorkouts = localStorage.getItem('gym-workouts')
      const savedWorkoutDays = localStorage.getItem('gym-workout-days')
      
      if (savedWorkouts) {
        setWorkouts(JSON.parse(savedWorkouts))
      }
      
      if (savedWorkoutDays) {
        setWorkoutDays(JSON.parse(savedWorkoutDays))
      }
      
      // Solo usar ejercicios por defecto si no hay ninguno cargado
      setExercises([])
    } finally {
      setIsLoading(false)
    }
  }, [initializeAllExercisesAsFavorites])

  // Cargar datos desde el backend al montar el componente
  useEffect(() => {
    // Solo cargar datos si no están ya cargados
    if (workouts.length === 0 && workoutDays.length === 0 && exercises.length === 0) {
      loadData()
    }
  }, [loadData])

  // Cargar contador de notificaciones no leídas al montar el componente
  useEffect(() => {
    loadUnreadNotificationsCount()
  }, [loadUnreadNotificationsCount])

  // Guardar workouts cuando cambien
  useEffect(() => {
    if (workouts.length > 0) {
      localStorage.setItem('gym-workouts', JSON.stringify(workouts))
    }
  }, [workouts])

  // Guardar workout days cuando cambien
  useEffect(() => {
    if (workoutDays.length > 0) {
      localStorage.setItem('gym-workout-days', JSON.stringify(workoutDays))
    }
  }, [workoutDays])

  const handleTabChange = (newValue: TabType) => {
    setActiveTab(newValue)
  }

  const handleOpenSettings = () => {
    setSettingsModalOpen(true)
  }

  const handleCloseSettings = () => {
    setSettingsModalOpen(false)
  }

  const handleOpenNotifications = async () => {
    // Recargar contador antes de abrir el modal
    await loadUnreadNotificationsCount()
    setNotificationsModalOpen(true)
  }

  const handleCloseNotifications = () => {
    setNotificationsModalOpen(false)
  }

  // Estado para la rutina activa
  const [activeRoutine, setActiveRoutine] = useState<any>(null)
  const [routineProgress, setRoutineProgress] = useState(0)
  const [isRoutinePaused, setIsRoutinePaused] = useState(false)

  // Función para manejar el inicio de una rutina
  const handleStartRoutine = (routine: any) => {
    // Cambiar a la tab de registrar
    setActiveTab(TABS.WORKOUT)
    // Establecer la rutina activa
    setActiveRoutine(routine)
    setRoutineProgress(0)
    setIsRoutinePaused(false)
    console.log('Iniciando rutina:', routine.name)
  }

  // Función para pausar la rutina (limpiar campos pero mantener la box)
  const handlePauseRoutine = () => {
    setIsRoutinePaused(true)
    setRoutineProgress(0)
  }

  // Función para detener completamente la rutina
  const handleStopRoutine = () => {
    setActiveRoutine(null)
    setIsRoutinePaused(false)
    setRoutineProgress(0)
  }

  // Event listener para el inicio de rutinas
  useEffect(() => {
    const handleRoutineStart = (event: CustomEvent) => {
      handleStartRoutine(event.detail.routine)
    }

    const handleViewRoutine = (_event: CustomEvent) => {
      setActiveTab(TABS.ROUTINES)
      // Aquí podrías abrir el modal de detalles de la rutina
      // Por ahora solo cambia a la tab de rutinas
    }

    window.addEventListener('startRoutine', handleRoutineStart as EventListener)
    window.addEventListener('viewRoutine', handleViewRoutine as EventListener)
    
    return () => {
      window.removeEventListener('startRoutine', handleRoutineStart as EventListener)
      window.removeEventListener('viewRoutine', handleViewRoutine as EventListener)
    }
  }, [])

  // Función para manejar el envío del formulario de workout
  const handleWorkoutSubmit = async (data: any): Promise<void> => {
    setIsSubmittingWorkout(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Buscar si ya existe un workout day para hoy
      let currentWorkoutDay = workoutDays.find(day => 
        day.date === today
      )

      // Si no existe, crear uno nuevo en el backend
      if (!currentWorkoutDay) {
        // Por ahora, crear el workout day directamente al crear el workout
        // El backend se encargará de crear el workout day si no existe
      }

      // Crear el nuevo workout en el backend
      const workoutData: any = {
        exercise_id: data.exercise_id,
        reps: data.reps || 0,
        set: data.set || 1,
        seconds: data.seconds || undefined,
        observations: data.observations || ''
      }

      // Solo incluir weight si tiene un valor válido mayor a 0
      if (data.weight !== undefined && data.weight !== null && data.weight > 0) {
        workoutData.weight = data.weight
      }

      await apiClient.createWorkout(workoutData) as Workout
      
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





  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Navigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onOpenSettings={handleOpenSettings}
          onOpenNotifications={handleOpenNotifications}
          onOpenAdminPanel={() => setAdminPanelOpen(true)}
          unreadNotifications={unreadNotifications}
        />
      
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
          <Box sx={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 200px)' }}>
            <WorkoutForm 
              exercises={exercises} 
              onSubmit={handleWorkoutSubmit}
              isLoading={isSubmittingWorkout}
              activeRoutine={activeRoutine}
              isRoutinePaused={isRoutinePaused}
              routineProgress={routineProgress}
              onPauseRoutine={handlePauseRoutine}
              onStopRoutine={handleStopRoutine}
            />
          </Box>
        )}

        {/* Pestaña Ejercicios */}
        {activeTab === TABS.EXERCISES && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
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
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
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
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <WorkoutHistory />
          </Box>
        )}

        {/* Pestaña Social */}
        {activeTab === TABS.SOCIAL && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <SocialList />
          </Box>
        )}

        {/* Pestaña Mis Rutinas */}
        {activeTab === TABS.ROUTINES && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <RoutineList activeRoutine={activeRoutine} routineProgress={routineProgress} />
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
          transform: 'translateX(-50%)',
          zIndex: 99998
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
          transform: 'translateX(-50%)',
          zIndex: 99999
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

      {/* Loader completo para carga inicial y logout */}
      <Backdrop
        sx={{
          color: 'primary.main',
          zIndex: 99999,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        open={isLoading || isLoggingOut || isSigningIn}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress size={48} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {isLoggingOut ? 'Cerrando sesión...' : isSigningIn ? 'Iniciando sesión...' : 'Cargando...'}
          </Typography>
        </Box>
      </Backdrop>

      {/* Botón flotante para navegación rápida */}
      <FloatingNavButton 
        currentTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      {/* Modal de configuración */}
      <SettingsModal 
        open={settingsModalOpen} 
        onClose={handleCloseSettings}
        exercises={exercises}
      />

      {/* Modal de notificaciones */}
      <NotificationsModal 
        open={notificationsModalOpen} 
        onClose={handleCloseNotifications}
        onMarkAsRead={async () => {
          // Recargar el contador real desde el backend
          await loadUnreadNotificationsCount()
        }}
      />

      {/* Modal del Panel de Administrador */}
      {adminPanelOpen && (
        <AdminPanel 
          open={adminPanelOpen} 
          onClose={() => setAdminPanelOpen(false)}
        />
      )}
    </Box>
  )
}

export default function AuthenticatedApp() {
  return (
    <UserSettingsProvider>
      <AuthProvider>
        <AuthenticatedAppContent />
      </AuthProvider>
    </UserSettingsProvider>
  )
}
