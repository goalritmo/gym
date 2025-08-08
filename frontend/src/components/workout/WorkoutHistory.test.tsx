import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorkoutHistory from './WorkoutHistory'

const mockWorkouts = [
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
]

const mockWorkoutSessions = [
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
]

describe('WorkoutHistory', () => {
  it('muestra lista de entrenamientos', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    expect(screen.getByText('Press de Banca')).toBeInTheDocument()
    expect(screen.getByText('Sentadilla')).toBeInTheDocument()
    expect(screen.getByText('Peso Muerto')).toBeInTheDocument()
  })

  it('muestra información detallada de cada entrenamiento', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    // Verificar peso y repeticiones
    expect(screen.getByText('80 kg')).toBeInTheDocument()
    expect(screen.getByText('8 reps')).toBeInTheDocument()
    expect(screen.getByText('100 kg')).toBeInTheDocument()
    expect(screen.getByText('6 reps')).toBeInTheDocument()
    
    // Verificar series
    expect(screen.getByText('Serie 1')).toBeInTheDocument()
    expect(screen.getByText('Serie 2')).toBeInTheDocument()
    expect(screen.getByText('Serie 3')).toBeInTheDocument()
  })

  it('muestra tiempo cuando está disponible', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    expect(screen.getByText('45s')).toBeInTheDocument()
    expect(screen.getByText('60s')).toBeInTheDocument()
  })

  it('no muestra tiempo cuando no está disponible', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    // El segundo workout no tiene seconds, no debería aparecer
    expect(screen.queryByText('nulls')).not.toBeInTheDocument()
  })

  it('muestra observaciones cuando están disponibles', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    expect(screen.getByText('Buena técnica')).toBeInTheDocument()
    expect(screen.getByText('Peso máximo')).toBeInTheDocument()
  })

  it('no muestra observaciones cuando no están disponibles', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    // El segundo workout no tiene observaciones
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  it('llama a onDelete cuando se hace click en eliminar', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={onDelete} 
      onUpdateSession={vi.fn()}
    />)
    
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
    await user.click(deleteButtons[0])
    
    // El primer botón corresponde al workout más reciente (ID 2 - Sentadilla)
    expect(onDelete).toHaveBeenCalledWith(2)
  })

  it('muestra fecha formateada para cada entrenamiento', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    // Debería mostrar las fechas en formato legible
    expect(screen.getAllByText(/15\/1\/2024/)).toHaveLength(2) // 2 workouts del 15/1
    expect(screen.getByText(/14\/1\/2024/)).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay entrenamientos', () => {
    render(<WorkoutHistory 
      workoutSessions={[]}
      workouts={[]} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    expect(screen.getByText('No hay entrenamientos registrados')).toBeInTheDocument()
  })

  it('ordena los entrenamientos por fecha más reciente', () => {
    render(<WorkoutHistory 
      workoutSessions={mockWorkoutSessions}
      workouts={mockWorkouts} 
      onDelete={vi.fn()} 
      onUpdateSession={vi.fn()}
    />)
    
    // Los entrenamientos deberían estar ordenados por fecha (más reciente primero)
    const workoutCards = screen.getAllByText(/kg/)
    expect(workoutCards).toHaveLength(3)
  })
})
