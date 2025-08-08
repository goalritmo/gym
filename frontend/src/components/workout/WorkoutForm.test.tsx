import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutForm from './WorkoutForm.tsx'

const exercises = [{ id: 1, name: 'Press de Banca' }]

describe('WorkoutForm', () => {
  it('envía datos válidos', () => {
    const onSubmit = vi.fn()
    render(<WorkoutForm exercises={exercises} onSubmit={onSubmit} />)

    // Seleccionar ejercicio
    fireEvent.change(screen.getByLabelText('Ejercicio'), { target: { value: '1' } })
    // Campos requeridos
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '80' } })
    fireEvent.change(screen.getByLabelText('Repeticiones'), { target: { value: '8' } })
    // Opcionales
    fireEvent.change(screen.getByLabelText('Serie'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Segundos'), { target: { value: '45' } })
    fireEvent.change(screen.getByLabelText('Observaciones'), { target: { value: 'Buena técnica' } })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSubmit).toHaveBeenCalledWith({
      exerciseId: 1,
      weight: 80,
      reps: 8,
      serie: 1,
      seconds: 45,
      observations: 'Buena técnica',
    })
  })

  it('muestra errores si faltan requeridos', () => {
    const onSubmit = vi.fn()
    render(<WorkoutForm exercises={exercises} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByText('Seleccioná un ejercicio')).toBeInTheDocument()
    expect(screen.getByText('Ingresá un peso válido')).toBeInTheDocument()
    expect(screen.getByText('Ingresá repeticiones válidas')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})


