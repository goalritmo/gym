import { useState, useEffect } from 'react'
import { Fab, Zoom } from '@mui/material'
import { AllInclusive, People, FitnessCenter } from '@mui/icons-material'

import { TABS, type TabType } from '../../constants/tabs'

type FloatingNavButtonProps = {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  activeRoutine?: any
}

export default function FloatingNavButton({ currentTab, onTabChange, activeRoutine }: FloatingNavButtonProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Mostrar el botón en WORKOUT, HISTORY, SOCIAL y ROUTINES (cuando hay rutina activa)
    if (currentTab === TABS.WORKOUT || currentTab === TABS.HISTORY || currentTab === TABS.SOCIAL || (currentTab === TABS.ROUTINES && activeRoutine)) {
      // En historial y social, siempre mostrar el botón
      if (currentTab === TABS.HISTORY || currentTab === TABS.SOCIAL) {
        setIsVisible(true)
        return
      }

      // En Mis Rutinas con rutina activa, siempre mostrar el botón
      if (currentTab === TABS.ROUTINES && activeRoutine) {
        setIsVisible(true)
        return
      }

      // En el formulario de registro, ocultar después de 3 segundos
      if (currentTab === TABS.WORKOUT) {
        setIsVisible(true)
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, 3000)

        return () => {
          clearTimeout(timer)
        }
      }
    } else {
      // En otras tabs (EXERCISES, EQUIPMENT, NOTIFICATIONS), ocultar el botón
      setIsVisible(false)
    }
  }, [currentTab, activeRoutine])

  const handleClick = () => {
    if (currentTab === TABS.ROUTINES && activeRoutine) {
      onTabChange(TABS.WORKOUT)
    } else if (currentTab === TABS.WORKOUT) {
      onTabChange(TABS.HISTORY)
    } else if (currentTab === TABS.HISTORY) {
      onTabChange(TABS.SOCIAL)
    } else if (currentTab === TABS.SOCIAL) {
      onTabChange(TABS.WORKOUT)
    }
  }

  const getIcon = () => {
    if (currentTab === TABS.ROUTINES && activeRoutine) {
      return <AllInclusive />
    } else if (currentTab === TABS.WORKOUT) {
      return <FitnessCenter />
    } else if (currentTab === TABS.HISTORY) {
      return <People />
    } else if (currentTab === TABS.SOCIAL) {
      return <AllInclusive />
    }
    return <AllInclusive />
  }

  const getTooltip = () => {
    if (currentTab === TABS.ROUTINES && activeRoutine) {
      return 'Registrar entrenamiento'
    } else if (currentTab === TABS.WORKOUT) {
      return 'Ver historial'
    } else if (currentTab === TABS.HISTORY) {
      return 'Ver social'
    } else if (currentTab === TABS.SOCIAL) {
      return 'Registrar entrenamiento'
    }
    return 'Registrar entrenamiento'
  }

  return (
    <Zoom in={isVisible}>
      <Fab
        color={currentTab === TABS.ROUTINES && activeRoutine ? "warning" : "primary"}
        aria-label={getTooltip()}
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: currentTab === TABS.ROUTINES && activeRoutine 
            ? '0 4px 12px rgba(255, 152, 0, 0.3)' 
            : '0 4px 12px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            boxShadow: currentTab === TABS.ROUTINES && activeRoutine 
              ? '0 6px 16px rgba(255, 152, 0, 0.4)' 
              : '0 6px 16px rgba(25, 118, 210, 0.4)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        {getIcon()}
      </Fab>
    </Zoom>
  )
}
