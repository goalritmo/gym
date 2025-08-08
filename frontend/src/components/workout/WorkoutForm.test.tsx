import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutForm from './WorkoutForm.tsx'

const exercises = [{ id: 1, name: 'Press de Banca' }]

describe('WorkoutForm', () => {
  it('envía datos válidos', () => {
    const onSubmit = vi.fn()
    render(<WorkoutForm exercises={exercises} onSubmit={onSubmit} />)

    // Seleccionar ejercicio (combobox de MUI)
    fireEvent.change(screen.getByRole('combobox', { name: 'Ejercicio' }), { target: { value: '1' } })
    // Campos requeridos
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Peso (kg)' }), { target: { value: '80' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Repeticiones' }), { target: { value: '8' } })
    // Opcionales
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Serie' }), { target: { value: '1' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Segundos' }), { target: { value: '45' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Observaciones' }), { target: { value: 'Buena técnica' } })

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

  it('muestra errores si faltan requeridos', async () => {
    const onSubmit = vi.fn()
    render(<WorkoutForm exercises={exercises} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    // Verificamos que aparezcan mensajes de error (string genérico de zod para NaN)
    const errs = await screen.findAllByText(/invalid input/i)
    expect(errs.length).toBeGreaterThanOrEqual(2)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})


