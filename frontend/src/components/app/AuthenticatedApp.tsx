import { Box } from '@mui/material'
import { useState, useEffect } from 'react'
import Navigation from '../navigation/Navigation'
import WorkoutForm from '../workout/WorkoutForm'
import ExerciseList from '../exercises/ExerciseList'
import EquipmentList from '../equipment/EquipmentList'
import WorkoutHistory from '../workout/WorkoutHistory'
import type { Workout, WorkoutSession } from '../../types/workout'
import { useTab } from '../../contexts/TabContext'

// Lista de ejercicios disponibles
const exercises = [
  { id: 1, name: 'Press de Banca' },
  { id: 2, name: 'Sentadilla' },
  { id: 3, name: 'Peso Muerto' },
  { id: 4, name: 'Press Militar' },
  { id: 5, name: 'Curl de Bíceps' },
  { id: 6, name: 'Extensiones de Tríceps' },
  { id: 7, name: 'Remo con Barra' },
  { id: 8, name: 'Pull-ups' }
]

export default function AuthenticatedApp() {
  const { activeTab, setActiveTab } = useTab()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])

  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    const savedWorkouts = localStorage.getItem('gym-workouts')
    const savedSessions = localStorage.getItem('gym-workout-sessions')
    
    if (savedWorkouts) {
      setWorkouts(JSON.parse(savedWorkouts))
    }
    
    if (savedSessions) {
      setWorkoutSessions(JSON.parse(savedSessions))
    }
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

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue)
  }

  // Función para manejar el envío del formulario de workout
  const handleWorkoutSubmit = (data: any) => {
    const today = new Date().toISOString()
    const todayDate = today.split('T')[0] + 'T00:00:00Z'

    // Buscar si ya existe una sesión para hoy
    let currentSession = workoutSessions.find(session => 
      session.session_date.split('T')[0] === today.split('T')[0]
    )

    // Si no existe, crear una nueva sesión
    if (!currentSession) {
      const newSessionId = Math.max(0, ...workoutSessions.map(s => s.id)) + 1
      currentSession = {
        id: newSessionId,
        session_date: todayDate,
        session_name: 'Entrenamiento del día',
        effort: 2,
        mood: 2,
        created_at: today
      }
      setWorkoutSessions(prev => [...prev, currentSession!])
    }

    // Crear el nuevo workout
    const newWorkoutId = Math.max(0, ...workouts.map(w => w.id)) + 1
    const newWorkout: Workout = {
      id: newWorkoutId,
      exercise_name: exercises.find(e => e.id === data.exerciseId)?.name || 'Ejercicio desconocido',
      weight: data.weight || 0,
      reps: data.reps || 0,
      serie: data.serie || null,
      seconds: data.seconds || null,
      observations: data.observations || null,
      exercise_session_id: currentSession.id,
      created_at: today
    }

    setWorkouts(prev => [...prev, newWorkout])
    console.log('Workout guardado:', newWorkout)
  }

  // Función para eliminar un workout
  const handleDeleteWorkout = (workoutId: number) => {
    setWorkouts(prev => prev.filter(w => w.id !== workoutId))
  }

  // Función para actualizar una sesión
  const handleUpdateSession = (sessionId: number, updates: Partial<WorkoutSession>) => {
    setWorkoutSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates }
          : session
      )
    )
  }



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <Box sx={{ 
        flexGrow: 1, 
        py: 2, 
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
        {activeTab === 0 && (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <WorkoutForm 
              exercises={exercises} 
              onSubmit={handleWorkoutSubmit} 
            />
          </Box>
        )}

        {/* Pestaña Ejercicios */}
        {activeTab === 1 && (
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
        {activeTab === 2 && (
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
        {activeTab === 3 && (
          <Box>
            <WorkoutHistory 
              workoutSessions={workoutSessions}
              workouts={workouts}
              onDelete={handleDeleteWorkout}
              onUpdateSession={handleUpdateSession}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
