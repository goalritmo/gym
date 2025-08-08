import { useState } from 'react'
import { Box, IconButton, AppBar, Toolbar, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import Navigation from '../navigation/Navigation'
import WorkoutForm from '../workout/WorkoutForm'
import ExerciseList from '../exercises/ExerciseList'
import EquipmentList from '../equipment/EquipmentList'
import WorkoutHistory from '../workout/WorkoutHistory'
import { useAuth } from '../../contexts/AuthContext'

export default function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState(0)
  const { logout } = useAuth()

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar sx={{ minHeight: '56px' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '18px' }}>
            Gym App
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            aria-label="cerrar sesión"
            size="large"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <Box sx={{ flexGrow: 1, py: 2, overflow: 'auto' }}>
        {/* Pestaña Entrenamiento */}
        {activeTab === 0 && (
          <Box>
            <WorkoutForm 
              exercises={[{ id: 1, name: 'Press de Banca' }]} 
              onSubmit={(data) => console.log('Entrenamiento guardado:', data)} 
            />
          </Box>
        )}

        {/* Pestaña Ejercicios */}
        {activeTab === 1 && (
          <Box>
            <ExerciseList 
              exercises={[
                { id: 1, name: 'Press de Banca', muscle_group: 'Pecho', equipment: 'Barra' },
                { id: 2, name: 'Sentadilla', muscle_group: 'Piernas', equipment: 'Barra' },
                { id: 3, name: 'Peso Muerto', muscle_group: 'Espalda', equipment: 'Barra' },
                { id: 4, name: 'Press Militar', muscle_group: 'Hombros', equipment: 'Barra' },
                { id: 5, name: 'Curl de Bíceps', muscle_group: 'Brazos', equipment: 'Mancuernas' },
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
                  observations: 'Barra estándar de 20kg',
                  image_url: 'https://example.com/barra.jpg',
                  created_at: '2024-01-01T00:00:00Z'
                },
                {
                  id: 2,
                  name: 'Mancuernas',
                  category: 'MANCUERNAS',
                  observations: 'Par de mancuernas de 10kg',
                  image_url: null,
                  created_at: '2024-01-02T00:00:00Z'
                },
                {
                  id: 3,
                  name: 'Rack de Sentadillas',
                  category: 'RACK',
                  observations: null,
                  image_url: 'https://example.com/rack.jpg',
                  created_at: '2024-01-03T00:00:00Z'
                }
              ]}
            />
          </Box>
        )}

        {/* Pestaña Historial */}
        {activeTab === 3 && (
          <Box>
            <WorkoutHistory 
              workouts={[
                {
                  id: 1,
                  exercise_name: 'Press de Banca',
                  weight: 80,
                  reps: 8,
                  serie: 1,
                  seconds: 45,
                  observations: 'Buena técnica',
                  created_at: '2024-01-15T10:30:00Z'
                },
                {
                  id: 2,
                  exercise_name: 'Sentadilla',
                  weight: 100,
                  reps: 6,
                  serie: 2,
                  seconds: null,
                  observations: null,
                  created_at: '2024-01-15T10:45:00Z'
                },
                {
                  id: 3,
                  exercise_name: 'Peso Muerto',
                  weight: 120,
                  reps: 5,
                  serie: 3,
                  seconds: 60,
                  observations: 'Peso máximo',
                  created_at: '2024-01-14T09:15:00Z'
                }
              ]}
              onDelete={(id) => console.log('Eliminar entrenamiento:', id)}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}
