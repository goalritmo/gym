import { useForm } from 'react-hook-form'
import { TextField, Button, Stack, Box, Typography, Alert } from '@mui/material'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { AccessTime, TrendingUp } from '@mui/icons-material'
import TimerComponent from '../timer/TimerComponent'

type Exercise = {
  id: number
  name: string
}

type WorkoutFormData = {
  exerciseId: number
  weight: number
  reps: number
  serie?: number
  seconds?: number
  observations?: string
}

type WorkoutFormProps = {
  exercises: Exercise[]
  onSubmit: (data: WorkoutFormData) => void
}

export default function WorkoutForm({ exercises, onSubmit }: WorkoutFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<WorkoutFormData>({
    defaultValues: {
      exerciseId: 0,
      weight: 0,
      reps: 0,
      serie: 0,
      seconds: 0,
      observations: ''
    }
  })

  const selectedExerciseId = watch('exerciseId')

  const submit = handleSubmit((data) => onSubmit(data))

  // Función para capturar el tiempo del cronómetro
  const handleTimerComplete = (seconds: number) => {
    setValue('seconds', seconds)
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative', zIndex: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Registrar
      </Typography>
      

      
      <form role="form" onSubmit={submit}>
        <Stack spacing={3}>
        <FormControl fullWidth error={Boolean(errors.exerciseId)}>
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
            <MenuItem value="">Seleccionar ejercicio...</MenuItem>
            {exercises.map((ex) => (
              <MenuItem key={ex.id} value={ex.id}>
                {ex.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Peso (kg)"
          type="number"
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
            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
              display: 'none'
            },
            '& input[type=number]': {
              MozAppearance: 'textfield'
            }
          }}
        />

        <TextField
          label="Repeticiones"
          type="number"
          error={Boolean(errors.reps)}
          helperText={errors.reps?.message}
          inputProps={{ 
            inputMode: 'numeric',
            pattern: '[0-9]*',
            min: '0'
          }}
          {...register('reps', { valueAsNumber: true })}
          sx={{
            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
              display: 'none'
            },
            '& input[type=number]': {
              MozAppearance: 'textfield'
            }
          }}
        />

        <TextField
          label="Serie"
          type="number"
          inputProps={{ 
            inputMode: 'numeric',
            pattern: '[0-9]*',
            min: '0'
          }}
          {...register('serie', { valueAsNumber: true })}
          sx={{
            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
              display: 'none'
            },
            '& input[type=number]': {
              MozAppearance: 'textfield'
            }
          }}
        />

        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime color="primary" />
            Tiempo de Serie
          </Typography>
          
          {/* Mensaje educativo */}
          <Alert 
            severity="info" 
            icon={<TrendingUp />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              ⏱️ <strong>¿Por qué medir el tiempo de cada serie?</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Control de intensidad:</strong> Series más lentas = mayor tiempo bajo tensión, más hipertrofia<br/>
              • <strong>Progreso medible:</strong> Comparar rendimiento entre entrenamientos con el mismo tiempo<br/>
              • <strong>Técnica:</strong> Controlar la velocidad ayuda a mantener buena forma y prevenir lesiones<br/>
              • <strong>Objetivos:</strong> 20-40s (fuerza), 40-60s (hipertrofia), 60s+ (resistencia)
            </Typography>
          </Alert>

          {/* Cronómetro y campo de segundos */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-end' }, 
            gap: 3,
            justifyContent: 'space-between'
          }}>
            {/* Cronómetro */}
            <Box sx={{ flex: '1 1 auto', width: '100%', maxWidth: '300px' }}>
              <TimerComponent onTimeComplete={handleTimerComplete} />
            </Box>
            
            {/* Input de segundos */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: '140px'
            }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Tiempo manual
              </Typography>
              <TextField
                label="Segundos"
                type="number"
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
          sx={{ 
            mt: 2, 
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Guardar
        </Button>
      </Stack>
    </form>
    </Box>
  )
}


