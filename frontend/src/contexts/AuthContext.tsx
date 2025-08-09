import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { auth } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (code: string) => boolean // Legacy method for backwards compatibility
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
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Legacy login method for backwards compatibility
  const login = (code: string): boolean => {
    // Keep simple code access for development
    if (code === 'salud') {
      // Create a mock session for development
      const mockUser = { id: 'dev-user', email: 'dev@example.com' } as User
      const mockSession = { user: mockUser, access_token: 'dev-token' } as Session
      setUser(mockUser)
      setSession(mockSession)
      return true
    }
    return false
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await auth.signInWithGoogle()
      return { error }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { error }
    }
  }

  const logout = async () => {
    try {
      await auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAuthenticated, 
      isLoading, 
      login, 
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
