import { useState, useEffect, useRef } from 'react'
import { Button, Box, Typography } from '@mui/material'

type TimerComponentProps = {
  onTimeComplete?: (seconds: number) => void
  onTimeUpdate?: (seconds: number, isRunning: boolean) => void
  onCapturedChange?: (isCaptured: boolean) => void
  disabled?: boolean
  timerMode?: 'rest' | 'series'
  onTimerModeChange?: (mode: 'rest' | 'series') => void
}

export default function TimerComponent({ 
  onTimeComplete, 
  onTimeUpdate, 
  onCapturedChange,
  disabled = false,
  timerMode = 'rest',
  onTimerModeChange
}: TimerComponentProps) {
  const [restTime, setRestTime] = useState(0)
  const [seriesTime, setSeriesTime] = useState(0)
  const [isRestRunning, setIsRestRunning] = useState(false)
  const [isSeriesRunning, setIsSeriesRunning] = useState(false)
  const [isRestCaptured, setIsRestCaptured] = useState(false)
  const [isSeriesCaptured, setIsSeriesCaptured] = useState(false)
  const restIntervalRef = useRef<number | null>(null)
  const seriesIntervalRef = useRef<number | null>(null)

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Cronómetro de descanso
  useEffect(() => {
    if (isRestRunning) {
      restIntervalRef.current = setInterval(() => {
        setRestTime(prevTime => {
          const newTime = prevTime + 1
          if (onTimeUpdate && timerMode === 'rest') {
            onTimeUpdate(newTime, true)
          }
          return newTime
        })
      }, 1000) as unknown as number
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
        restIntervalRef.current = null
      }
      if (onTimeUpdate && timerMode === 'rest') {
        onTimeUpdate(restTime, false)
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
    }
  }, [isRestRunning, onTimeUpdate, timerMode, restTime])

  // Cronómetro de entrenamiento
  useEffect(() => {
    if (isSeriesRunning) {
      seriesIntervalRef.current = setInterval(() => {
        setSeriesTime(prevTime => {
          const newTime = prevTime + 1
          if (onTimeUpdate && timerMode === 'series') {
            onTimeUpdate(newTime, true)
          }
          return newTime
        })
      }, 1000) as unknown as number
    } else {
      if (seriesIntervalRef.current) {
        clearInterval(seriesIntervalRef.current)
        seriesIntervalRef.current = null
      }
      if (onTimeUpdate && timerMode === 'series') {
        onTimeUpdate(seriesTime, false)
      }
    }

    return () => {
      if (seriesIntervalRef.current) {
        clearInterval(seriesIntervalRef.current)
      }
    }
  }, [isSeriesRunning, onTimeUpdate, timerMode, seriesTime])

  const handleRestTimer = () => {
    if (!isRestRunning) {
      if (isRestCaptured) {
        // Reiniciar el cronómetro de descanso
        setIsRestRunning(true)
        setIsRestCaptured(false)
        setRestTime(0)
      } else {
        // Iniciar el cronómetro de descanso
        setIsRestRunning(true)
        if (onTimerModeChange) {
          onTimerModeChange('rest')
        }
      }
    } else {
      // Parar el cronómetro de descanso
      setIsRestRunning(false)
      setIsRestCaptured(true)
      if (onCapturedChange) {
        onCapturedChange(true)
      }
      if (onTimeComplete) {
        onTimeComplete(restTime)
      }
    }
  }

  const handleSeriesTimer = () => {
    if (!isSeriesRunning) {
      if (isSeriesCaptured) {
        // Reiniciar el cronómetro de entrenamiento
        setIsSeriesRunning(true)
        setIsSeriesCaptured(false)
        setSeriesTime(0)
      } else {
        // Iniciar el cronómetro de entrenamiento
        setIsSeriesRunning(true)
        if (onTimerModeChange) {
          onTimerModeChange('series')
        }
      }
    } else {
      // Parar el cronómetro de entrenamiento
      setIsSeriesRunning(false)
      setIsSeriesCaptured(true)
      if (onCapturedChange) {
        onCapturedChange(true)
      }
      if (onTimeComplete) {
        onTimeComplete(seriesTime)
      }
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: 3,
      width: '100%'
    }}>
      {/* Cronómetro de Descanso */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        gap: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: timerMode === 'rest' ? 'primary.50' : 'grey.50',
        border: '2px solid',
        borderColor: timerMode === 'rest' ? 'primary.main' : 'grey.300',
        width: '100%'
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          color: timerMode === 'rest' ? 'primary.main' : 'text.secondary'
        }}>
          Descansando
        </Typography>
        
        <Typography 
          variant="h3" 
          component="div" 
          sx={{ 
            fontFamily: 'monospace',
            color: isRestRunning ? 'primary.main' : isRestCaptured ? 'success.main' : 'text.primary',
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            minWidth: '140px'
          }}
        >
          {formatTime(restTime)}
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={handleRestTimer}
          disabled={disabled}
          size="large"
          sx={{ 
            minWidth: 120,
            py: 1.5,
            px: 3,
            borderRadius: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: isRestCaptured ? 'success.main' : 'primary.main',
            '&:hover': {
              backgroundColor: isRestCaptured ? 'success.dark' : 'primary.dark'
            }
          }}
        >
          {!isRestRunning ? 'Iniciar' : 'Parar'}
        </Button>
      </Box>

      {/* Cronómetro de Entrenamiento */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        gap: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: timerMode === 'series' ? 'warning.50' : 'grey.50',
        border: '2px solid',
        borderColor: timerMode === 'series' ? 'warning.main' : 'grey.300',
        width: '100%'
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          color: timerMode === 'series' ? 'warning.main' : 'text.secondary'
        }}>
          Entrenando
        </Typography>
        
        <Typography 
          variant="h3" 
          component="div" 
          sx={{ 
            fontFamily: 'monospace',
            color: isSeriesRunning ? 'warning.main' : isSeriesCaptured ? 'success.main' : 'text.primary',
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            minWidth: '140px'
          }}
        >
          {formatTime(seriesTime)}
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={handleSeriesTimer}
          disabled={disabled}
          size="large"
          sx={{ 
            minWidth: 120,
            py: 1.5,
            px: 3,
            borderRadius: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: isSeriesCaptured ? 'success.main' : 'warning.main',
            '&:hover': {
              backgroundColor: isSeriesCaptured ? 'success.dark' : 'warning.dark'
            }
          }}
        >
          {!isSeriesRunning ? 'Iniciar' : 'Parar'}
        </Button>
      </Box>
    </Box>
  )
}
