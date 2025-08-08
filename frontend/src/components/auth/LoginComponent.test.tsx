import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import LoginComponent from './LoginComponent'

describe('LoginComponent', () => {
  it('permite acceso con código correcto', () => {
    render(<LoginComponent />)

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'salud' } })
    fireEvent.click(screen.getByRole('button', { name: 'Acceder' }))

    expect(screen.getByText('Acceso permitido')).toBeInTheDocument()
  })

  it('muestra error con código incorrecto', () => {
    render(<LoginComponent />)

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Acceder' }))

    expect(screen.getByText('Código incorrecto')).toBeInTheDocument()
  })
})


