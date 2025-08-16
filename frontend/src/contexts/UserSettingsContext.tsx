import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { apiClient } from '../lib/api'

interface ApiUserSettings {
  show_own_workouts_in_social: boolean
  unc_notifications_enabled: boolean
}

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
  onSocialSettingsChange?: () => void
  setOnSocialSettingsChange: (callback: () => void) => void
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
  const [onSocialSettingsChange, setOnSocialSettingsChange] = useState<(() => void) | undefined>(undefined)

  // Función para cargar configuraciones desde la API
  const loadSettings = useCallback(async () => {
    try {
      const apiSettings = await apiClient.getUserSettings()

      
      // Combinar configuraciones de API con localStorage para ejercicios favoritos
      const savedSettings = localStorage.getItem('user-settings')
      let localSettings: Partial<UserSettings> = {}
      if (savedSettings) {
        try {
          localSettings = JSON.parse(savedSettings)
        } catch (error) {
          console.error('Error parsing local settings:', error)
        }
      }
      
      const apiSettingsTyped = apiSettings as ApiUserSettings
      setSettings({ 
        ...defaultSettings, 
        showOwnWorkoutsInSocial: apiSettingsTyped.show_own_workouts_in_social,
        uncNotificationsEnabled: apiSettingsTyped.unc_notifications_enabled,
        favoriteExercises: localSettings.favoriteExercises || [],
        showWorkoutSection: localSettings.showWorkoutSection !== undefined ? localSettings.showWorkoutSection : defaultSettings.showWorkoutSection
      })
    } catch (error) {
      console.error('Error loading user settings from API:', error)
      // Fallback a localStorage
      const savedSettings = localStorage.getItem('user-settings')
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings)
          setSettings({ ...defaultSettings, ...parsedSettings })
        } catch (error) {
          console.error('Error parsing user settings:', error)
          setSettings(defaultSettings)
        }
      } else {
        setSettings(defaultSettings)
      }
    }
  }, [])

  // Cargar configuraciones desde la API al montar
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Guardar configuraciones en localStorage (solo ejercicios favoritos y showWorkoutSection)
  useEffect(() => {
    const settingsToSave = {
      favoriteExercises: settings.favoriteExercises,
      showWorkoutSection: settings.showWorkoutSection
    }
    localStorage.setItem('user-settings', JSON.stringify(settingsToSave))
  }, [settings.favoriteExercises, settings.showWorkoutSection])

  const toggleWorkoutSection = useCallback(() => {
    setSettings(prev => ({ 
      ...prev, 
      showWorkoutSection: !prev.showWorkoutSection
    }))
  }, [])

  const setFavoriteExercises = useCallback((exerciseIds: number[]) => {
    setSettings(prev => ({ 
      ...prev, 
      favoriteExercises: exerciseIds
    }))
  }, [])

  const toggleUncNotifications = useCallback(async () => {
    const newValue = !settings.uncNotificationsEnabled
    setSettings(prev => ({ 
      ...prev, 
      uncNotificationsEnabled: newValue
    }))
    
    try {
      await apiClient.updateUserSettings({ unc_notifications_enabled: newValue })
    } catch (error) {
      console.error('Error updating UNC notifications setting:', error)
    }
  }, [settings.uncNotificationsEnabled])

  const toggleShowOwnWorkoutsInSocial = useCallback(async () => {
    const newValue = !settings.showOwnWorkoutsInSocial
    setSettings(prev => ({ 
      ...prev, 
      showOwnWorkoutsInSocial: newValue
    }))
    
    try {
      await apiClient.updateUserSettings({ show_own_workouts_in_social: newValue })
      // Ejecutar callback para recargar social si existe
      if (onSocialSettingsChange) {
        onSocialSettingsChange()
      }
    } catch (error) {
      console.error('Error updating show own workouts setting:', error)
    }
  }, [settings.showOwnWorkoutsInSocial, onSocialSettingsChange])

  const initializeAllExercisesAsFavorites = useCallback((exerciseIds: number[]) => {
    // Solo inicializar si no hay ejercicios favoritos configurados
    if (settings.favoriteExercises.length === 0 && exerciseIds.length > 0) {
      setSettings(prev => ({ 
        ...prev, 
        favoriteExercises: exerciseIds
      }))
    }
  }, [settings.favoriteExercises.length])

  const value: UserSettingsContextType = {
    settings, 
    toggleWorkoutSection,
    setFavoriteExercises,
    toggleUncNotifications,
    toggleShowOwnWorkoutsInSocial,
    initializeAllExercisesAsFavorites,
    onSocialSettingsChange,
    setOnSocialSettingsChange
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
