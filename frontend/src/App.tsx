import './App.css'
import LoginComponent from './components/auth/LoginComponent'
import WorkoutForm from './components/workout/WorkoutForm'

function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Gym</h1>
      <LoginComponent />
      <hr />
      <WorkoutForm exercises={[{ id: 1, name: 'Press de Banca' }]} onSubmit={() => {}} />
    </div>
  )
}

export default App
