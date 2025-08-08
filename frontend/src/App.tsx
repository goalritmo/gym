import { useState } from 'react'
import './App.css'
import LoginComponent from './components/auth/LoginComponent.tsx'
import WorkoutForm from './components/workout/WorkoutForm.tsx'
import TimerComponent from './components/timer/TimerComponent.tsx'
import ExerciseList from './components/exercises/ExerciseList.tsx'
import EquipmentDetail from './components/equipment/EquipmentDetail.tsx'
import WorkoutHistory from './components/workout/WorkoutHistory.tsx'

function App() {
  const [showEquipmentDetail, setShowEquipmentDetail] = useState(false)
  return (
    <div style={{ padding: 16 }}>
      <h1>Gym</h1>
      <LoginComponent />
      <hr />
      <WorkoutForm exercises={[{ id: 1, name: 'Press de Banca' }]} onSubmit={() => {}} />
      <hr />
      <TimerComponent />
      <hr />
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
      <hr />
      <button onClick={() => setShowEquipmentDetail(true)}>
        Ver Detalle de Equipo
      </button>
      {showEquipmentDetail && (
        <EquipmentDetail 
          equipment={{
            id: 1,
            name: 'Barra Olímpica',
            category: 'BARRA',
            observations: 'Barra estándar de 20kg',
            image_url: 'https://example.com/barra.jpg',
            created_at: '2024-01-01T00:00:00Z'
          }}
          onClose={() => setShowEquipmentDetail(false)}
        />
      )}
      <hr />
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
    </div>
  )
}

export default App
