import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type UserSettings = {
  socialEnabled: boolean
  showWorkoutSection: boolean
  favoriteExercises: number[] // IDs de ejercicios favoritos
}

type UserSettingsContextType = {
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => void
  toggleSocial: () => void
  toggleWorkoutSection: () => void
  toggleFavoriteExercise: (exerciseId: number) => void
  setFavoriteExercises: (exerciseIds: number[]) => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

const defaultSettings: UserSettings = {
  socialEnabled: true, // Por defecto habilitado
  showWorkoutSection: true, // Por defecto mostrar sección de registro
  favoriteExercises: [] // Sin ejercicios favoritos por defecto
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

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const toggleSocial = () => {
    setSettings(prev => ({ 
      ...prev, 
      socialEnabled: !prev.socialEnabled
    }))
  }

  const toggleWorkoutSection = () => {
    setSettings(prev => ({ 
      ...prev, 
      showWorkoutSection: !prev.showWorkoutSection
    }))
  }

  const toggleFavoriteExercise = (exerciseId: number) => {
    setSettings(prev => {
      const isFavorite = prev.favoriteExercises.includes(exerciseId)
      const newFavorites = isFavorite 
        ? prev.favoriteExercises.filter(id => id !== exerciseId)
        : [...prev.favoriteExercises, exerciseId]
      
      return {
        ...prev,
        favoriteExercises: newFavorites
      }
    })
  }

  const setFavoriteExercises = (exerciseIds: number[]) => {
    setSettings(prev => ({
      ...prev,
      favoriteExercises: exerciseIds
    }))
  }

  return (
    <UserSettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      toggleSocial,
      toggleWorkoutSection,
      toggleFavoriteExercise,
      setFavoriteExercises
    }}>
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
