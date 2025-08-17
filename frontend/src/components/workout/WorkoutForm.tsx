import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import TimerComponent from '../timer/TimerComponent'

type Exercise = {
  id: number
  name: string
  bodyweight?: boolean
}
import { 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Stack, 
  TextField, 
  Typography,
  Alert,
  IconButton
} from '@mui/material'
import { 
  FitnessCenter as FitnessCenterIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Stop as StopIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useState, useEffect } from 'react'

// Esquema de validación con Zod
const workoutFormSchema = z.object({
  exercise_id: z.coerce.number().refine(val => val > 0, ' ').optional(),
  weight: z.string().transform((val) => {
    if (val === '' || val === '0') return undefined
    const num = parseFloat(val)
    return isNaN(num) ? undefined : num
  }).refine((val) => val === undefined || (val > 0 && val <= 1000), ' ').optional(), // Máximo 1000 kg, opcional
  reps: z.coerce.number().int().refine(val => val > 0 && val <= 100, ' ').optional(), // Máximo 100 reps, opcional para Running
  set: z.coerce.number().int().min(1, ' '),
  seconds: z.coerce.number().min(0).max(3600).optional(), // Máximo 1 hora (3600 segundos)
  observations: z.string().default('')
})

type WorkoutFormData = z.infer<typeof workoutFormSchema>

type WorkoutFormProps = {
  exercises: Exercise[]
  onSubmit: (data: WorkoutFormData) => Promise<void>
  isLoading?: boolean
  activeRoutine?: any
  isRoutinePaused?: boolean
  onStopRoutine?: () => void
  preloadedExercise?: any
}

export default function WorkoutForm({ 
  exercises, 
  onSubmit, 
  isLoading = false,
  activeRoutine,
  isRoutinePaused = false,
  onStopRoutine,
  preloadedExercise
}: WorkoutFormProps) {
  const { 
    settings, 
    toggleExerciseCompleted, 
    getCompletedExercisesForRoutine, 
    getRoutineProgress 
  } = useUserSettings()
  
  // Filtrar ejercicios favoritos si están configurados
  const filteredExercises = settings.favoriteExercises.length > 0 
    ? exercises.filter(exercise => settings.favoriteExercises.includes(exercise.id))
    : exercises
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      exercise_id: undefined,
      weight: '',
      reps: '',
      set: 1,
      seconds: '',
      observations: ''
    }
  })
  
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Estado para trackear el tiempo del cronómetro
  const [currentTimerTime, setCurrentTimerTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showTimeTip, setShowTimeTip] = useState(false)
  
  // Estado para controlar la expansión de la box de rutina
  const [showRoutineExercises, setShowRoutineExercises] = useState(false)
  
  // Estado para detectar si los ejercicios están cargando
  const isLoadingExercises = filteredExercises.length === 0
  
  // Obtener fecha actual y ejercicios completados
  const today = new Date().toISOString().split('T')[0]
  const completedExercises = activeRoutine 
    ? getCompletedExercisesForRoutine(today, activeRoutine.id)
    : {}
  
  // Calcular progreso real de la rutina
  const realRoutineProgress = activeRoutine 
    ? getRoutineProgress(today, activeRoutine.id, activeRoutine)
    : 0
  
  // Detectar si la rutina está completa
  const isRoutineComplete = realRoutineProgress === 100

  // Detectar si el ejercicio seleccionado es Running (ID: 18)
  const selectedExerciseId = watch('exercise_id')
  
  const isRunningExercise = selectedExerciseId === 18
  
  // Detectar ejercicios de peso corporal usando el campo bodyweight del ejercicio
  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId)
  const isBodyweightExercise = selectedExercise?.bodyweight || false

  // Establecer reps = 1 automáticamente cuando se selecciona Running
  useEffect(() => {
    if (isRunningExercise) {
      setValue('reps', 1)
    }
  }, [isRunningExercise, setValue])

  // Limpiar peso cuando se selecciona ejercicio de peso corporal
  useEffect(() => {
    if (isBodyweightExercise) {
      setValue('weight', '') // Dejar vacío para ejercicios de peso corporal
    }
  }, [isBodyweightExercise, setValue])

  // Pre-cargar ejercicio cuando se recibe desde la rutina
  useEffect(() => {
    if (preloadedExercise) {
      console.log('Pre-cargando ejercicio:', preloadedExercise)
      console.log('exercise_id a establecer:', preloadedExercise.exercise_id)
      setValue('exercise_id', preloadedExercise.exercise_id)
      setValue('weight', preloadedExercise.weight?.toString() || '')
      setValue('reps', preloadedExercise.reps || '')
      // Si hay currentSet (auto-completado), usar ese valor, sino usar 1
      setValue('set', preloadedExercise.currentSet || 1)
      setValue('seconds', preloadedExercise.rest_time_seconds?.toString() || '')
      setValue('observations', preloadedExercise.notes || '')
      
      // Debug adicional después de establecer valores
      setTimeout(() => {
        console.log('Valor actual de exercise_id después de setValue:', watch('exercise_id'))
      }, 100)
    }
  }, [preloadedExercise, setValue, watch])

  // Función para validar y limitar valores en tiempo real
  const handleNumberInput = (field: 'weight' | 'reps' | 'seconds', value: string) => {
    // Si el valor está vacío, permitir que se borre
    if (value === '') {
      setValue(field, '')
      return
    }

    // Normalizar el valor: convertir coma a punto para parseFloat
    const normalizedValue = value.replace(',', '.')
    const numValue = parseFloat(normalizedValue)
    
    if (isNaN(numValue)) {
      setValue(field, '')
      return
    }

    let maxLimit: number
    let minLimit: number

    switch (field) {
      case 'weight':
        // Para Running, cambiar límites a distancia (km)
        if (isRunningExercise) {
          maxLimit = 100 // 100 km máximo
          minLimit = 0.1 // 100 metros mínimo
        } else {
          maxLimit = 1000
          minLimit = 0.1
        }
        // Permitir valores vacíos para peso opcional
        if (value === '') {
          setValue(field, '')
          return
        }
        break
      case 'reps':
        maxLimit = 100
        minLimit = 1
        break
      case 'seconds':
        maxLimit = 3600
        minLimit = 0
        break
      default:
        return
    }

    if (numValue > maxLimit) {
      setValue(field, maxLimit.toString())
    } else if (numValue < minLimit && value !== '') {
      setValue(field, minLimit.toString())
    } else {
      // Mantener el formato original (coma o punto) que usó el usuario
      setValue(field, value)
    }
  }

  const submit = handleSubmit(async (data: WorkoutFormData) => {
    try {
      // Si el cronómetro está corriendo, usar el tiempo actual del cronómetro
      if (isTimerRunning && currentTimerTime > 0) {
        data.seconds = currentTimerTime
      }
      
      // Crear objeto de datos sin el campo weight si está vacío
      const workoutData: any = {
        exercise_id: data.exercise_id,
        reps: isRunningExercise ? 1 : data.reps, // Para Running, enviar 1 como valor mínimo
        set: data.set,
        seconds: data.seconds,
        observations: data.observations
      }
      
      // Solo incluir weight si tiene un valor válido mayor a 0
      if (data.weight !== undefined && data.weight !== null && data.weight > 0) {
        workoutData.weight = data.weight
      }
      
      await onSubmit(workoutData)
      setShowSuccess(true)
      reset({
        exercise_id: '',
        weight: '',
        reps: '',
        set: 1,
        seconds: '',
        observations: ''
      })
      
      // Resetear el cronómetro
      setCurrentTimerTime(0)
      setIsTimerRunning(false)
      
      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error al guardar el workout:', error)
      setErrorMessage('Error al guardar el entrenamiento. Por favor, intenta de nuevo.')
    }
  })

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative', zIndex: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Registrar
      </Typography>
      
      {/* Barra de progreso de rutina activa */}
      {activeRoutine && (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: isRoutineComplete ? 'success.main' : (isRoutinePaused ? 'primary.main' : 'warning.main'), 
          borderRadius: 2,
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>

          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'left' }}>
              🏋️ {isRoutinePaused ? 'A la espera' : activeRoutine.name}
            </Typography>
            
            <IconButton
              size="small"
              onClick={onStopRoutine}
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              {isRoutineComplete ? <CloseIcon /> : <StopIcon />}
            </IconButton>
          </Box>
          
          <Box sx={{ 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: 1,
            height: 8,
            mb: 1
          }}>
            <Box sx={{ 
              width: `${realRoutineProgress}%`, 
              backgroundColor: 'white', 
              borderRadius: 1,
              height: '100%',
              transition: 'width 0.3s ease'
            }} />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              {realRoutineProgress}% completa
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!showRoutineExercises && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  onClick={() => {
                    // Expandir/contraer la lista de ejercicios
                    setShowRoutineExercises(!showRoutineExercises)
                  }}
                >
                  {isRoutineComplete ? '¡Felicitaciones!' : (isRoutinePaused ? 'Elegir rutina' : 'Ver rutina')}
                </Typography>
              )}
              
              <IconButton
                size="small"
                onClick={() => setShowRoutineExercises(!showRoutineExercises)}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                {showRoutineExercises ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </Box>
          </Box>
          
          {/* Lista expandible de ejercicios de la rutina */}
          {showRoutineExercises && activeRoutine?.exercises && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: 2,
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Ejercicios restantes:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {activeRoutine.exercises.map((exercise: any, index: number) => {
                  const completedSets = completedExercises[exercise.exercise_id] || []
                  
                  return (
                    <Box
                      key={`${exercise.exercise_id}-${index}`}
                      sx={{
                        p: 1.5,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'white', flex: 1, textAlign: 'left' }}>
                          {exercise.exercise_name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {Array.from({ length: exercise.sets }, (_, setIndex) => {
                            const setNumber = setIndex + 1
                            const isCompleted = completedSets.includes(setNumber)
                            
                            return (
                              <Box
                                key={setNumber}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  border: '2px solid',
                                  borderColor: isCompleted ? 'warning.main' : 'rgba(255,255,255,0.5)',
                                  backgroundColor: isCompleted ? 'warning.main' : 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    borderColor: isCompleted ? 'warning.dark' : 'warning.main',
                                    backgroundColor: isCompleted ? 'warning.dark' : 'rgba(255,152,0,0.2)'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleExerciseCompleted(today, activeRoutine.id, exercise.exercise_id, setNumber)
                                }}
                              >
                                {isCompleted && (
                                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                    ✓
                                  </Typography>
                                )}
                              </Box>
                            )
                          })}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {exercise.sets} {exercise.sets === 1 ? 'serie' : 'series'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          •
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {exercise.reps} {exercise.reps === 1 ? 'rep' : 'reps'}
                        </Typography>
                        {exercise.weight && (
                          <>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              •
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              {exercise.weight}kg
                            </Typography>
                          </>
                        )}
                      </Box>
                      
                                              <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.5)',
                            '&:hover': {
                              borderColor: 'warning.main',
                              backgroundColor: 'rgba(255,152,0,0.1)'
                            }
                          }}
                          onClick={() => {
                            // Pre-cargar el ejercicio en el formulario
                            setValue('exercise_id', exercise.exercise_id)
                            setValue('weight', exercise.weight?.toString() || '')
                            setValue('reps', exercise.reps || '')
                            setValue('set', 1)
                            setValue('seconds', exercise.rest_time_seconds?.toString() || '')
                            setValue('observations', exercise.notes || '')
                            
                            // Cerrar la lista expandible
                            setShowRoutineExercises(false)
                          }}
                        >
                          Cargar en el registro
                        </Button>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      <form role="form" onSubmit={submit}>
        <Stack spacing={3}>
        <FormControl fullWidth error={Boolean(errors.exercise_id)} disabled={isLoading || filteredExercises.length === 0}>
          <InputLabel id="exercise-select-label">Ejercicio</InputLabel>
          <Select
            labelId="exercise-select-label"
            label="Ejercicio"
            value={watch('exercise_id') || ''}
            {...register('exercise_id', { valueAsNumber: true })}
            sx={{
              '& .MuiInputLabel-root': {
                transform: 'translate(14px, -9px) scale(0.75)',
                backgroundColor: 'white',
                px: 1,
                color: 'primary.main'
              },
              '& .MuiInputLabel-shrink': {
                transform: 'translate(14px, -9px) scale(0.75)',
                backgroundColor: 'white',
                px: 1,
                color: 'primary.main'
              }
            }}
          >
            <MenuItem value="" disabled>
              {filteredExercises.length === 0 ? 'Cargando ejercicios...' : 'Seleccionar ejercicio...'}
            </MenuItem>
            {filteredExercises.map((ex) => (
              <MenuItem key={ex.id} value={ex.id}>
                {ex.name}
                {ex.name.toLowerCase().includes('running') && ' ⭐'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Peso/Distancia, Reps y Serie en la misma fila */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexDirection: { xs: 'row' }
        }}>
          <TextField
            label={isRunningExercise ? "Distancia (km)" : (isBodyweightExercise ? "Peso (opcional)" : "Peso (kg)")}
            type="number"
            disabled={isLoading}
            error={Boolean(errors.weight)}
            value={watch('weight') === undefined || watch('weight') === null ? '' : watch('weight')}
            onChange={(e) => handleNumberInput('weight', e.target.value)}
            inputProps={{ 
              step: 'any',
              inputMode: 'decimal',
              min: isRunningExercise ? 0.1 : 0.1,
              max: isRunningExercise ? 100 : 1000
            }}
            sx={{
              flex: isRunningExercise ? 2 : 1, // 2/3 del espacio para Running
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                display: 'none'
              },
              '& input[type=number]': {
                MozAppearance: 'textfield'
              }
            }}
          />

          {/* Ocultar campo Reps para Running */}
          {!isRunningExercise && (
            <TextField
              label="Reps"
              type="number"
              disabled={isLoading}
              error={Boolean(errors.reps)}
              value={watch('reps') || ''}
              onChange={(e) => handleNumberInput('reps', e.target.value)}
              inputProps={{ 
                inputMode: 'numeric',
                min: 1,
                max: 100
              }}
              sx={{
                flex: 1,
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                }
              }}
            />
          )}

          <FormControl 
            fullWidth 
            error={Boolean(errors.set)}
            disabled={isLoading || isRunningExercise} // Bloquear para Running
            sx={{ flex: 1 }}
          >
            <InputLabel id="serie-select-label">Serie</InputLabel>
            <Select
              labelId="serie-select-label"
              label="Serie"
              value={watch('set')}
              {...register('set', { valueAsNumber: true })}
            >
              {[1, 2, 3, 4, 5].map((serie) => (
                <MenuItem key={serie} value={serie}>
                  {serie}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Tiempo de Serie */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showTimeTip ? 1 : 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Tiempo de Serie
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowTimeTip(!showTimeTip)}
              sx={{ 
                color: 'primary.main',
                transform: showTimeTip ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <KeyboardArrowDown />
            </IconButton>
          </Box>
          
          {showTimeTip && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>💡 Tip:</strong> Usa el cronómetro para medir el tiempo de descanso entre series. 
                El tiempo se guardará automáticamente cuando envíes el formulario.
              </Typography>
            </Alert>
          )}
          
          <TimerComponent 
            onTimeComplete={(seconds) => setValue('seconds', seconds)}
            onTimeUpdate={(seconds, isRunning) => {
              setCurrentTimerTime(seconds)
              setIsTimerRunning(isRunning)
            }}
            disabled={isLoading}
          />
        </Box>

        {/* Observaciones */}
        <TextField
          label="Observaciones (opcional)"
          multiline
          rows={3}
          disabled={isLoading}
          error={Boolean(errors.observations)}
          {...register('observations')}
          sx={{
            '& .MuiInputLabel-root': {
              color: 'primary.main'
            }
          }}
        />

        {/* Botón de envío */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading || isLoadingExercises}
          startIcon={<FitnessCenterIcon />}
          sx={{
            py: 1.5,
            fontWeight: 600,
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
            }
          }}
        >
          {isLoading ? 'Guardando...' : 'Guardar Entrenamiento'}
        </Button>
      </Stack>
      </form>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          onClose={() => setShowSuccess(false)}
        >
          ¡Entrenamiento guardado exitosamente! 🎉
        </Alert>
      )}

      {/* Mensaje de error */}
      {errorMessage && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          onClose={() => setErrorMessage('')}
        >
          {errorMessage}
        </Alert>
      )}
    </Box>
  )
}


