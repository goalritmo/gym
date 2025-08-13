import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface UserSettings {
  showWorkoutSection: boolean
  favoriteExercises: number[]
  uncNotificationsEnabled: boolean
  showOwnWorkoutsInSocial: boolean
}

interface UserSettingsContextType {
  settings: UserSettings
  toggleWorkoutSection: () => void
  setFavoriteExercises: (exercises: number[]) => void
  toggleUncNotifications: () => void
  toggleShowOwnWorkoutsInSocial: () => void
  initializeAllExercisesAsFavorites: (exerciseIds: number[]) => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

const defaultSettings: UserSettings = {
  showWorkoutSection: true, // Por defecto mostrar sección de registro
  favoriteExercises: [], // Se llenará automáticamente con todos los ejercicios
  uncNotificationsEnabled: true, // Por defecto habilitadas para usuarios UNC
  showOwnWorkoutsInSocial: true // Por defecto mostrar ejercicios propios en social
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)

  // Cargar configuraciones desde localStorage al montar
  useEffect(() => {
    const savedSettings = localStorage.getItem('user-settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        console.log('🔍 Configuraciones cargadas desde localStorage:', parsedSettings)
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

  const toggleShowOwnWorkoutsInSocial = () => {
    setSettings(prev => ({ 
      ...prev, 
      showOwnWorkoutsInSocial: !prev.showOwnWorkoutsInSocial
    }))
  }

  const initializeAllExercisesAsFavorites = (exerciseIds: number[]) => {
    // Solo inicializar si no hay ejercicios favoritos configurados
    if (settings.favoriteExercises.length === 0) {
      console.log('🔍 Inicializando todos los ejercicios como favoritos:', exerciseIds)
      setSettings(prev => ({ 
        ...prev, 
        favoriteExercises: exerciseIds
      }))
    }
  }

  const value: UserSettingsContextType = {
    settings, 
    toggleWorkoutSection,
    setFavoriteExercises,
    toggleUncNotifications,
    toggleShowOwnWorkoutsInSocial,
    initializeAllExercisesAsFavorites
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
