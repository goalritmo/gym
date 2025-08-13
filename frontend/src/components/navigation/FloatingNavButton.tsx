import { useState, useEffect } from 'react'
import { Fab, Zoom } from '@mui/material'
import { History, AllInclusive } from '@mui/icons-material'

import { TABS, type TabType } from '../../constants/tabs'

type FloatingNavButtonProps = {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
}

export default function FloatingNavButton({ currentTab, onTabChange }: FloatingNavButtonProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Solo mostrar el botón en WORKOUT e HISTORY
    if (currentTab === TABS.WORKOUT || currentTab === TABS.HISTORY) {
      // En historial, siempre mostrar el botón
      if (currentTab === TABS.HISTORY) {
        setIsVisible(true)
        return
      }

      // En el formulario de registro, ocultar después de 5 segundos
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
  }, [currentTab])

  const handleClick = () => {
    if (currentTab === TABS.WORKOUT) {
      onTabChange(TABS.HISTORY)
    } else {
      onTabChange(TABS.WORKOUT)
    }
  }

  const getIcon = () => {
    if (currentTab === TABS.WORKOUT) {
      return <History />
    } else {
      return <AllInclusive />
    }
  }

  const getTooltip = () => {
    if (currentTab === TABS.WORKOUT) {
      return 'Ver historial'
    } else {
      return 'Registrar entrenamiento'
    }
  }

  return (
    <Zoom in={isVisible}>
      <Fab
        color="primary"
        aria-label={getTooltip()}
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
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
