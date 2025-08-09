import { useForm } from 'react-hook-form'
import { TextField, Button, Stack, Box, Typography, Alert, Snackbar, CircularProgress, Backdrop } from '@mui/material'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { AccessTime } from '@mui/icons-material'
import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import TimerComponent from '../timer/TimerComponent'

type Exercise = {
  id: number
  name: string
}

// Esquema de validación con Zod
const workoutFormSchema = z.object({
  exerciseId: z.coerce.number().min(1, 'Selecciona un ejercicio'),
  weight: z.coerce.number().min(0.1, 'El peso debe ser mayor a 0'),
  reps: z.coerce.number().int().min(1, 'Debe ser al menos 1 repe'),
  serie: z.coerce.number().int().min(1, 'Debe ser al menos 1 serie'),
  seconds: z.coerce.number().min(0, 'Los segundos deben ser mayores a 0').optional(),
  observations: z.string().default('')
})

type WorkoutFormData = z.infer<typeof workoutFormSchema>

type WorkoutFormProps = {
  exercises: Exercise[]
  onSubmit: (data: WorkoutFormData) => Promise<void>
  isLoading?: boolean
}

export default function WorkoutForm({ exercises, onSubmit, isLoading = false }: WorkoutFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      exerciseId: 0,
      weight: '',
      reps: '',
      serie: 1,
      seconds: '',
      observations: ''
    }
  })
  
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Estado para detectar si los ejercicios están cargando
  const isLoadingExercises = exercises.length === 0

  const selectedExerciseId = watch('exerciseId')

  const submit = handleSubmit(async (data: WorkoutFormData) => {
    console.log('🔥 Form submitted with data:', data)
    console.log('🔍 Current form values:', {
      exerciseId: watch('exerciseId'),
      weight: watch('weight'),
      reps: watch('reps'),
      serie: watch('serie'),
      seconds: watch('seconds'),
      observations: watch('observations')
    })
    try {
      await onSubmit(data)
      setShowSuccess(true)
      reset({
        exerciseId: 0,
        weight: '',
        reps: '',
        serie: 1,
        seconds: '',
        observations: ''
      }) // Limpiar el formulario después de guardar exitosamente
    } catch (error) {
      console.error('Error submitting workout:', error)
      alert('Error al guardar el entrenamiento. Revisa la consola para más detalles.')
    }
  }, (errors) => {
    console.log('❌ Form validation errors:', errors)
  })

  // Función para capturar el tiempo del cronómetro
  const handleTimerComplete = (seconds: number) => {
    setValue('seconds', seconds)
  }

  return (
    <>
    <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative', zIndex: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Registrar
      </Typography>
      

      
      <form role="form" onSubmit={submit}>
        <Stack spacing={3}>
        <FormControl fullWidth error={Boolean(errors.exerciseId)} disabled={isLoading || exercises.length === 0}>
          <InputLabel id="exercise-select-label">Ejercicio</InputLabel>
          <Select
            labelId="exercise-select-label"
            label="Ejercicio"
            value={selectedExerciseId}
            {...register('exerciseId', { valueAsNumber: true })}
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
            <MenuItem value={0} disabled={exercises.length === 0}>
              {exercises.length === 0 ? 'Cargando ejercicios...' : 'Seleccionar ejercicio...'}
            </MenuItem>
            {exercises.map((ex) => (
              <MenuItem key={ex.id} value={ex.id}>
                {ex.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Peso, Reps y Serie en la misma fila */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexDirection: { xs: 'row' }
        }}>
          <TextField
            label="Peso (kg)"
            type="number"
            disabled={isLoading}
            error={Boolean(errors.weight)}
            helperText={errors.weight?.message}
            inputProps={{ 
              step: 'any',
              inputMode: 'decimal',
              pattern: '[0-9]*',
              min: '0'
            }}
            {...register('weight', { valueAsNumber: true })}
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

          <TextField
            label="Reps"
            type="number"
            disabled={isLoading}
            error={Boolean(errors.reps)}
            helperText={errors.reps?.message}
            inputProps={{ 
              inputMode: 'numeric',
              pattern: '[0-9]*',
              min: '0'
            }}
            {...register('reps', { valueAsNumber: true })}
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

          <FormControl 
            fullWidth 
            error={Boolean(errors.serie)} 
            disabled={isLoading}
            sx={{ flex: 1 }}
          >
            <InputLabel id="serie-select-label">Serie</InputLabel>
            <Select
              labelId="serie-select-label"
              label="Serie"
              value={watch('serie')}
              {...register('serie', { valueAsNumber: true })}
            >
              {[1, 2, 3, 4, 5].map((serie) => (
                <MenuItem key={serie} value={serie}>
                  {serie}
                </MenuItem>
              ))}
            </Select>
            {errors.serie && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.serie.message}
              </Typography>
            )}
          </FormControl>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime color="primary" />
            Tiempo de Serie
          </Typography>
          
          {/* Mensaje educativo */}
          <Alert 
            severity="info" 
            icon={false}
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              bgcolor: 'rgba(33, 150, 243, 0.04)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              p: 2, // Reducir padding del contenedor
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'left'
              }
            }}
          >
            <Typography variant="caption" sx={{ 
              fontWeight: 600, 
              color: 'primary.main', 
              mb: 1, 
              textAlign: 'left', 
              fontSize: '0.8rem',
              display: 'block'
            }}>
              💡 Tips para maximizar resultados
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ 
              lineHeight: 1.6, 
              width: '100%', 
              textAlign: 'left', 
              fontSize: '0.75rem',
              display: 'block',
              mb: 1
            }}>
              <strong>Más tiempo bajo tensión = más ganancia muscular.</strong> Este registro te va a permitir mejorar la técnica y comparar tu progreso.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 0.8, 
              mt: 1, 
              justifyContent: 'space-between',
              width: '100%',
              '& > div': {
                bgcolor: 'rgba(255,255,255,0.8)',
                px: 0.8,
                py: 0.6,
                borderRadius: 1,
                border: '1px solid rgba(33, 150, 243, 0.1)',
                textAlign: 'center',
                flex: 1,
                minWidth: 0
              }
            }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main', display: 'block', fontSize: '0.7rem' }}>
                  Fuerza:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'warning.main', display: 'block', mt: 0.3, fontSize: '0.65rem' }}>
                  20-40s
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main', display: 'block', fontSize: '0.7rem' }}>
                  Hipertrofia:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'warning.main', display: 'block', mt: 0.3, fontSize: '0.65rem' }}>
                  40-60s
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main', display: 'block', fontSize: '0.7rem' }}>
                  Resistencia:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'warning.main', display: 'block', mt: 0.3, fontSize: '0.65rem' }}>
                  60s+
                </Typography>
              </Box>
            </Box>
          </Alert>

          {/* Cronómetro y campo de segundos */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'flex-end', 
            gap: 2,
            justifyContent: 'space-between'
          }}>
            {/* Cronómetro */}
            <Box sx={{ flex: '1 1 auto', width: '100%', maxWidth: '300px' }}>
              <TimerComponent onTimeComplete={handleTimerComplete} disabled={isLoading} />
            </Box>
            
            {/* Input de segundos */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: '140px'
            }}>
              <TextField
                label="Segundos"
                type="number"
                disabled={isLoading}
                error={Boolean(errors.seconds)}
                helperText={errors.seconds?.message}
                inputProps={{ 
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  min: 0
                }}
                {...register('seconds', { valueAsNumber: true })}
                sx={{ 
                  width: '120px',
                  '& .MuiInputBase-root': {
                    minWidth: '120px'
                  },
                  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                    display: 'none'
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        <TextField
          label="Observaciones"
          multiline
          minRows={2}
          disabled={isLoading}
          {...register('observations')}
          sx={{
            '& .MuiInputLabel-root': {
              backgroundColor: 'white',
              px: 1,
              zIndex: 1
            },
            '& .MuiInputLabel-shrink': {
              backgroundColor: 'white',
              px: 1,
              zIndex: 1
            }
          }}
        />

        <Button 
          type="submit" 
          variant="contained" 
          size="large"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ 
            mt: 2, 
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            minWidth: 140
          }}
        >
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </Stack>
    </form>

    {/* Notificación de éxito */}
    <Snackbar
      open={showSuccess}
      autoHideDuration={3000}
      onClose={() => setShowSuccess(false)}
      message="✅ Entrenamiento guardado exitosamente"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    />

    </Box>

    {/* Loader para cuando están cargando los ejercicios */}
    <Backdrop
      sx={{
        color: 'primary.main',
        zIndex: (theme) => theme.zIndex.modal + 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(4px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      open={isLoadingExercises}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Cargando...
        </Typography>
      </Box>
    </Backdrop>
    </>
  )
}


