import { useState, useEffect, useRef } from 'react'
import { Button, Box, Typography } from '@mui/material'

type TimerComponentProps = {
  onTimeComplete?: (seconds: number) => void
  onTimeUpdate?: (seconds: number, isRunning: boolean) => void
  disabled?: boolean
}

export default function TimerComponent({ onTimeComplete, onTimeUpdate, disabled = false }: TimerComponentProps) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
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
  }, [isRunning, onTimeUpdate, time])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleToggleTimer = () => {
    if (!isRunning) {
      // Iniciar el cronómetro
      setIsRunning(true)
      setIsCaptured(false)
      setTime(0)
    } else {
      // Pausar y registrar los segundos
      setIsRunning(false)
      setIsCaptured(true)
      if (onTimeComplete) {
        onTimeComplete(time)
      }
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Display del tiempo */}
      <Typography 
        variant="h4" 
        component="div" 
        sx={{ 
          fontFamily: 'monospace',
          color: isRunning ? 'primary.main' : isCaptured ? 'warning.main' : 'text.primary',
          flex: 1,
          textAlign: 'center'
        }}
      >
        {formatTime(time)}
      </Typography>
      
      {/* Botón a la derecha */}
      <Button 
        variant="contained" 
        onClick={handleToggleTimer}
        disabled={disabled}
        size="large"
        sx={{ 
          minWidth: 120,
          py: 1.5,
          borderRadius: 1.5,
          fontSize: '1rem',
          fontWeight: 'bold',
          backgroundColor: isCaptured ? 'warning.main' : 'primary.main',
          '&:hover': {
            backgroundColor: isCaptured ? 'warning.dark' : 'primary.dark'
          }
        }}
      >
        {!isRunning ? 'Iniciar' : 'Capturar'}
      </Button>
    </Box>
  )
}
