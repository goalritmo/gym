import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Componente de prueba para usar el contexto
function TestComponent() {
  const { isAuthenticated, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Autenticado' : 'No autenticado'}
      </div>
      <button onClick={() => login('salud')} data-testid="login-correct">
        Login Correcto
      </button>
      <button onClick={() => login('0000')} data-testid="login-incorrect">
        Login Incorrecto
      </button>
      <button onClick={logout} data-testid="logout">
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  it('proporciona estado de autenticación inicial', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado')
  })

  it('permite login con código correcto', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const loginButton = screen.getByTestId('login-correct')
    fireEvent.click(loginButton)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Autenticado')
  })

  it('rechaza login con código incorrecto', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const loginButton = screen.getByTestId('login-incorrect')
    fireEvent.click(loginButton)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado')
  })

  it('permite logout', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    // Primero hacer login
    const loginButton = screen.getByTestId('login-correct')
    fireEvent.click(loginButton)
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Autenticado')
    
    // Luego hacer logout
    const logoutButton = screen.getByTestId('logout')
    fireEvent.click(logoutButton)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado')
  })
})
