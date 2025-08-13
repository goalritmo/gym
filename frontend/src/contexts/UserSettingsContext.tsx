import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface UserSettings {
  showWorkoutSection: boolean
  favoriteExercises: number[]
  uncNotificationsEnabled: boolean
}

interface UserSettingsContextType {
  settings: UserSettings
  toggleWorkoutSection: () => void
  setFavoriteExercises: (exercises: number[]) => void
  toggleUncNotifications: () => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

const defaultSettings: UserSettings = {
  showWorkoutSection: true, // Por defecto mostrar sección de registro
  favoriteExercises: [], // Sin ejercicios favoritos por defecto
  uncNotificationsEnabled: true // Por defecto habilitadas para usuarios UNC
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)

  // Cargar configuraciones desde localStorage al montar
  useEffect(() => {
    const savedSettings = localStorage.getItem('user-settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })
      } catch (error) {
        console.error('Error parsing user settings:', error)
        setSettings(defaultSettings)
      }
    }
  }, [])

  // Guardar configuraciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('user-settings', JSON.stringify(settings))
  }, [settings])

  const toggleWorkoutSection = () => {
    setSettings(prev => ({ 
      ...prev, 
      showWorkoutSection: !prev.showWorkoutSection
    }))
  }

  const setFavoriteExercises = (exerciseIds: number[]) => {
    setSettings(prev => ({ 
      ...prev, 
      favoriteExercises: exerciseIds
    }))
  }

  const toggleUncNotifications = () => {
    setSettings(prev => ({ 
      ...prev, 
      uncNotificationsEnabled: !prev.uncNotificationsEnabled
    }))
  }

  const value: UserSettingsContextType = {
    settings, 
    toggleWorkoutSection,
    setFavoriteExercises,
    toggleUncNotifications
  }

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}
