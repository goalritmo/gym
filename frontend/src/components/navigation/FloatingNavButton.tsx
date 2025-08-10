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
    const handleVisibility = () => {
      const currentScrollY = window.scrollY
      const documentHeight = document.documentElement.scrollHeight
      const windowHeight = window.innerHeight
      const scrollPercentage = (currentScrollY + windowHeight) / documentHeight
      
      // Ocultar cuando esté cerca del final del contenido (último 20%)
      if (scrollPercentage > 0.8) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
    }

    // Verificar visibilidad inicial
    handleVisibility()

    // Agregar listener con throttling para mejor rendimiento
    let ticking = false
    const throttledHandleVisibility = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleVisibility()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleVisibility, { passive: true })
    window.addEventListener('resize', throttledHandleVisibility, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledHandleVisibility)
      window.removeEventListener('resize', throttledHandleVisibility)
    }
  }, [])

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
