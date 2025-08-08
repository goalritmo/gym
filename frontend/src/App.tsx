import './App.css'
import LoginComponent from './components/auth/LoginComponent.tsx'
import WorkoutForm from './components/workout/WorkoutForm.tsx'
import TimerComponent from './components/timer/TimerComponent.tsx'
import ExerciseList from './components/exercises/ExerciseList.tsx'

function App() {
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
    </div>
  )
}

export default App
