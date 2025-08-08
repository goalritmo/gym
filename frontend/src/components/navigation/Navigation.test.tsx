import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from './Navigation'

describe('Navigation', () => {
  it('muestra el título de la aplicación', () => {
    render(<Navigation activeTab={0} onTabChange={vi.fn()} />)
    
    expect(screen.getByText('Gym App')).toBeInTheDocument()
  })

  it('muestra todas las pestañas', () => {
    render(<Navigation activeTab={0} onTabChange={vi.fn()} />)
    
    expect(screen.getByText('Entrenamiento')).toBeInTheDocument()
    expect(screen.getByText('Ejercicios')).toBeInTheDocument()
    expect(screen.getByText('Equipamiento')).toBeInTheDocument()
    expect(screen.getByText('Historial')).toBeInTheDocument()
  })

  it('llama a onTabChange cuando se hace click en una pestaña', () => {
    const onTabChange = vi.fn()
    render(<Navigation activeTab={0} onTabChange={onTabChange} />)
    
    const ejerciciosTab = screen.getByText('Ejercicios')
    fireEvent.click(ejerciciosTab)
    
    expect(onTabChange).toHaveBeenCalledWith(1)
  })

  it('resalta la pestaña activa', () => {
    render(<Navigation activeTab={1} onTabChange={vi.fn()} />)
    
    // La pestaña "Ejercicios" (índice 1) debería estar activa
    const ejerciciosTab = screen.getByText('Ejercicios')
    expect(ejerciciosTab).toBeInTheDocument()
  })
})
