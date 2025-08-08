import './App.css'
import LoginComponent from './components/auth/LoginComponent.tsx'
import WorkoutForm from './components/workout/WorkoutForm.tsx'
import TimerComponent from './components/timer/TimerComponent.tsx'

function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Gym</h1>
      <LoginComponent />
      <hr />
      <WorkoutForm exercises={[{ id: 1, name: 'Press de Banca' }]} onSubmit={() => {}} />
      <hr />
      <TimerComponent />
    </div>
  )
}

export default App
