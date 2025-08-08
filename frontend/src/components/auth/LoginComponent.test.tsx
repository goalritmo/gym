import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../contexts/AuthContext'
import LoginComponent from './LoginComponent'

// Wrapper para proporcionar el contexto
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('LoginComponent', () => {
  it('permite acceso con código correcto', async () => {
    const user = userEvent.setup()
    render(<LoginComponent />, { wrapper: TestWrapper })
    
    const input = screen.getByLabelText('Código de acceso')
    const submitButton = screen.getByText('Acceder')
    
    await user.type(input, 'salud')
    await user.click(submitButton)
    
    // El input debería limpiarse después del login exitoso
    expect(input).toHaveValue('')
  })

  it('muestra error con código incorrecto', async () => {
    const user = userEvent.setup()
    render(<LoginComponent />, { wrapper: TestWrapper })
    
    const input = screen.getByLabelText('Código de acceso')
    const submitButton = screen.getByText('Acceder')
    
    await user.type(input, 'incorrecto')
    await user.click(submitButton)
    
    expect(screen.getByText('Código incorrecto. Intenta con salud')).toBeInTheDocument()
  })
})


