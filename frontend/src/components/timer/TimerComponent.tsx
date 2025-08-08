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
      }, 1000)
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

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
    // Capturar el tiempo cuando se pausa
    if (onTimeComplete) {
      onTimeComplete(time)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
  }

  return (
    <Stack spacing={2} alignItems="center">
      <Typography variant="h2" component="div">
        {formatTime(time)}
      </Typography>
      
      <Stack direction="row" spacing={2}>
        {!isRunning ? (
          <Button variant="contained" onClick={handleStart}>
            Iniciar
          </Button>
        ) : (
          <Button variant="contained" onClick={handlePause}>
            Pausar
          </Button>
        )}
        
        <Button variant="outlined" onClick={handleReset}>
          Resetear
        </Button>
      </Stack>
    </Stack>
  )
}
