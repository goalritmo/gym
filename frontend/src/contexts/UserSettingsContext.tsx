import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type UserSettings = {
  socialEnabled: boolean
}

type UserSettingsContextType = {
  settings: UserSettings
  updateSettings: (newSettings: Partial<UserSettings>) => void
  toggleSocial: () => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

const defaultSettings: UserSettings = {
  socialEnabled: true // Por defecto habilitado
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

  return (
    <UserSettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      toggleSocial
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
