import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { auth } from '../lib/supabase'
import { apiClient } from '../lib/api'
import type { User, Session } from '@supabase/supabase-js'

type UserInfo = {
  id: string
  email?: string
  user_metadata: Record<string, any>
  is_admin: boolean
  role: string
  profile_name?: string
}

type AuthContextType = {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  isSigningIn: boolean
  isAdmin: boolean
  userRole: string
  signInWithGoogle: () => Promise<{ error?: any }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState('user')

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ session, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(
      async (_, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
        // Reset signing in state when auth state changes
        setIsSigningIn(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Obtener información del usuario incluyendo is_admin cuando cambie el usuario
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        try {
          const userInfo = await apiClient.getCurrentUser() as UserInfo
          setIsAdmin(userInfo.is_admin || false)
          setUserRole(userInfo.role || 'user')
          
          // Actualizar último acceso
          try {
            await apiClient.updateLastSignIn()
            console.log('Último acceso actualizado')
          } catch (error) {
            console.log('Error actualizando último acceso:', error)
            // No es crítico si falla, solo log
          }
          
          // Configurar usuario solo si no tiene perfil (usuario nuevo)
          console.log('DEBUG: Verificando si necesita setup. profile_name:', userInfo.profile_name, 'is_admin:', userInfo.is_admin)
          if (!userInfo.profile_name && !userInfo.is_admin) {
            console.log('DEBUG: Usuario necesita setup, ejecutando setupUser...')
            try {
              const userName = user.user_metadata?.name || user.user_metadata?.full_name
              console.log('DEBUG: Llamando setupUser con:', { userId: user.id, email: user.email, userName })
              await apiClient.setupUser(user.id, user.email || '', userName)
              console.log('Usuario configurado exitosamente')
            } catch (error) {
              console.log('Error configurando usuario:', error)
              // No es crítico si falla, solo log
            }
          } else {
            console.log('DEBUG: Usuario no necesita setup')
          }
        } catch (error) {
          console.error('Error fetching user info:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
        setUserRole('user')
      }
    }

    fetchUserInfo()
  }, [user])



  const signInWithGoogle = async () => {
    setIsSigningIn(true)
    try {
      const { error } = await auth.signInWithGoogle()
      // No reseteamos isSigningIn aquí porque la redirección ocurre inmediatamente
      // El estado se reseteará cuando el usuario regrese y se detecte el cambio de auth
      return { error }
    } catch (error) {
      console.error('Google sign in error:', error)
      setIsSigningIn(false) // Solo resetear en caso de error
      return { error }
    }
  }

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      await auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAuthenticated, 
      isLoading, 
      isLoggingOut,
      isSigningIn,
      isAdmin,
      userRole,
      signInWithGoogle, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
