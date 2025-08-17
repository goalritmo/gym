import { useState, useEffect, useRef } from 'react'
import { Button, Box, Typography } from '@mui/material'

type TimerComponentProps = {
  onTimeComplete?: (seconds: number) => void
  onTimeUpdate?: (seconds: number, isRunning: boolean) => void
  disabled?: boolean
  autoStart?: boolean
  timerMode?: 'rest' | 'series'
  onTimerModeChange?: (mode: 'rest' | 'series') => void
}

export default function TimerComponent({ 
  onTimeComplete, 
  onTimeUpdate, 
  disabled = false,
  autoStart = false,
  timerMode = 'rest',
  onTimerModeChange
}: TimerComponentProps) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isCaptured, setIsCaptured] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1
          // Notificar el tiempo actual cada segundo
          if (onTimeUpdate) {
            onTimeUpdate(newTime, true)
          }
          return newTime
        })
      }, 1000) as unknown as number
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Notificar cuando se pausa
      if (onTimeUpdate) {
        onTimeUpdate(time, false)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, onTimeUpdate]) // Removido 'time' de las dependencias

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleToggleTimer = () => {
    if (!isRunning) {
      if (isCaptured) {
        // Reiniciar el cronómetro
        setIsRunning(true)
        setIsCaptured(false)
        setTime(0)
      } else {
        // Iniciar el cronómetro por primera vez
        setIsRunning(true)
        // Cambiar a modo serie cuando se inicia
        if (timerMode === 'rest' && onTimerModeChange) {
          onTimerModeChange('series')
        }
      }
    } else {
      // Parar y registrar los segundos
      setIsRunning(false)
      setIsCaptured(true)
      if (onTimeComplete) {
        onTimeComplete(time)
      }
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'row',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: 3,
      width: '100%'
    }}>
      {/* Display del tiempo */}
      <Typography 
        variant="h4" 
        component="div" 
        sx={{ 
          fontFamily: 'monospace',
          color: isRunning ? (timerMode === 'series' ? 'warning.main' : 'primary.main') : isCaptured ? 'success.main' : 'text.primary',
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          minWidth: '140px'
        }}
      >
        {formatTime(time)}
      </Typography>
      
      {/* Botón centrado */}
      <Button 
        variant="contained" 
        onClick={handleToggleTimer}
        disabled={disabled}
        size="large"
        sx={{ 
          minWidth: 140,
          py: 1.5,
          px: 3,
          borderRadius: 1.5,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          backgroundColor: isCaptured ? 'success.main' : (timerMode === 'rest' ? 'warning.main' : 'warning.main'),
          '&:hover': {
            backgroundColor: isCaptured ? 'success.dark' : (timerMode === 'rest' ? 'warning.dark' : 'warning.dark')
          }
        }}
      >
        {!isRunning ? (isCaptured ? 'Reiniciar' : 'Iniciar') : 'Parar'}
      </Button>
    </Box>
  )
}
