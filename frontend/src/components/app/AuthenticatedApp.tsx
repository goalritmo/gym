import { Box } from '@mui/material'
import Navigation from '../navigation/Navigation'
import WorkoutForm from '../workout/WorkoutForm'
import ExerciseList from '../exercises/ExerciseList'
import EquipmentList from '../equipment/EquipmentList'
import WorkoutHistory from '../workout/WorkoutHistory'
import ApiTest from '../debug/ApiTest'
import { useAuth } from '../../contexts/AuthContext'
import { useTab } from '../../contexts/TabContext'

export default function AuthenticatedApp() {
  const { activeTab, setActiveTab } = useTab()
  const { logout } = useAuth()

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} />
      
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
              exercises={[
                { id: 1, name: 'Press de Banca' },
                { id: 2, name: 'Sentadilla' },
                { id: 3, name: 'Peso Muerto' },
                { id: 4, name: 'Press Militar' },
                { id: 5, name: 'Curl de Bíceps' },
                { id: 6, name: 'Extensiones de Tríceps' },
                { id: 7, name: 'Remo con Barra' },
                { id: 8, name: 'Pull-ups' }
              ]} 
              onSubmit={(data) => console.log('Entrenamiento guardado:', data)} 
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

        {/* Pestaña API Test */}
        {activeTab === 3 && (
          <Box>
            <ApiTest />
          </Box>
        )}

        {/* Pestaña Historial */}
        {activeTab === 4 && (
          <Box>
            <WorkoutHistory 
              workoutSessions={[
                {
                  id: 1,
                  session_date: '2024-01-15T00:00:00Z',
                  session_name: 'Rutina de Fullbody',
                  effort: 2,
                  mood: 3,
                  created_at: '2024-01-15T10:00:00Z'
                },
                {
                  id: 2,
                  session_date: '2024-01-14T00:00:00Z',
                  session_name: 'Rutina de Fullbody',
                  effort: 3,
                  mood: 2,
                  created_at: '2024-01-14T09:00:00Z'
                }
              ]}
              workouts={[
                {
                  id: 1,
                  exercise_name: 'Press de Banca',
                  weight: 80,
                  reps: 8,
                  serie: 1,
                  seconds: 45,
                  observations: 'Buena técnica',
                  created_at: '2024-01-15T10:30:00Z',
                  exercise_session_id: 1
                },
                {
                  id: 2,
                  exercise_name: 'Sentadilla',
                  weight: 100,
                  reps: 6,
                  serie: 2,
                  seconds: null,
                  observations: null,
                  created_at: '2024-01-15T10:45:00Z',
                  exercise_session_id: 1
                },
                {
                  id: 3,
                  exercise_name: 'Peso Muerto',
                  weight: 120,
                  reps: 5,
                  serie: 3,
                  seconds: 60,
                  observations: 'Peso máximo',
                  created_at: '2024-01-14T09:15:00Z',
                  exercise_session_id: 2
                }
              ]}
              onDelete={(id) => console.log('Eliminar entrenamiento:', id)}
              onUpdateSession={(sessionId, updates) => console.log('Actualizar sesión:', sessionId, updates)}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
