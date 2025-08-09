import { useState, useEffect, useRef } from 'react'
import { Button, Stack, Typography } from '@mui/material'

type TimerComponentProps = {
  onTimeComplete?: (seconds: number) => void
}

export default function TimerComponent({ onTimeComplete }: TimerComponentProps) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1)
      }, 1000) as unknown as number
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleToggleTimer = () => {
    if (!isRunning) {
      // Iniciar el cronómetro
      setIsRunning(true)
    } else {
      // Pausar y registrar los segundos
      setIsRunning(false)
      if (onTimeComplete) {
        onTimeComplete(time)
      }
      // Resetear automáticamente
      setTime(0)
    }
  }

  return (
    <Stack spacing={2} alignItems="center">
      <Typography variant="h2" component="div">
        {formatTime(time)}
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={handleToggleTimer}
        size="large"
        sx={{ 
          minWidth: 120,
          py: 1.5,
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}
      >
        {!isRunning ? 'Iniciar' : 'Capturar'}
      </Button>
    </Stack>
  )
}
