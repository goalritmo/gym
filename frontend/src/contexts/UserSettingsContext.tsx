import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type UserSettings = {
  showWorkoutsInSocial: boolean
  canViewOthersWorkouts: boolean
}

type UserSettingsContextType = {
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => void
  toggleSocialVisibility: () => void
  toggleViewOthersWorkouts: () => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

const defaultSettings: UserSettings = {
  showWorkoutsInSocial: true, // Por defecto mostrar en social
  canViewOthersWorkouts: true // Por defecto poder ver otros
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

  const toggleSocialVisibility = () => {
    setSettings(prev => {
      const newShowWorkouts = !prev.showWorkoutsInSocial
      // Si no quiere mostrar sus entrenamientos, tampoco puede ver los de otros
      const newCanViewOthers = newShowWorkouts ? prev.canViewOthersWorkouts : false
      
      return { 
        ...prev, 
        showWorkoutsInSocial: newShowWorkouts,
        canViewOthersWorkouts: newCanViewOthers
      }
    })
  }

  const toggleViewOthersWorkouts = () => {
    setSettings(prev => {
      const newCanViewOthers = !prev.canViewOthersWorkouts
      // Si quiere ver otros entrenamientos, debe mostrar los suyos
      const newShowWorkouts = newCanViewOthers ? true : prev.showWorkoutsInSocial
      
      return { 
        ...prev, 
        canViewOthersWorkouts: newCanViewOthers,
        showWorkoutsInSocial: newShowWorkouts
      }
    })
  }

  return (
    <UserSettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      toggleSocialVisibility,
      toggleViewOthersWorkouts
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
