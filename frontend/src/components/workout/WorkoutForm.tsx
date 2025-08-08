import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Stack, Box, Typography, Chip } from '@mui/material'
import type { Resolver } from 'react-hook-form'
import TimerComponent from '../timer/TimerComponent.tsx'

type Exercise = { id: number; name: string }

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

const schema = z.object({
  exerciseId: z.coerce.number().int().gt(0, 'Seleccioná un ejercicio'),
  weight: z.coerce.number().gt(0, 'Ingresá un peso válido'),
  reps: z.coerce.number().int().gt(0, 'Ingresá repeticiones válidas'),
  serie: z
    .preprocess(emptyToUndefined, z.coerce.number().int().gt(0))
    .optional(),
  seconds: z
    .preprocess(emptyToUndefined, z.coerce.number().int().gt(0))
    .optional(),
  observations: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function WorkoutForm({
  exercises,
  onSubmit,
}: {
  exercises: Exercise[]
  onSubmit: (values: {
    exerciseId: number
    weight: number
    reps: number
    serie?: number
    seconds?: number
    observations?: string
  }) => void
}) {
  const { handleSubmit, control, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      exerciseId: undefined as unknown as number,
      weight: '',
      reps: '',
      serie: '',
      seconds: '',
      observations: '',
    },
  })

  const submit = handleSubmit((data) => onSubmit(data))
  const selectedExerciseId = watch('exerciseId')
  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId)
  
  // Función para capturar el tiempo del cronómetro
  const handleTimerComplete = (seconds: number) => {
    setValue('seconds', seconds)
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative', zIndex: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main' }}>
        Registrar
      </Typography>
      

      
      <form role="form" onSubmit={submit}>
        <Stack spacing={3}>
        <Controller
          control={control}
          name="exerciseId"
          render={({ field }) => (
            <TextField
              select
              label="Ejercicio"
              aria-label="Ejercicio"
              SelectProps={{ 
                native: true,
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: 200,
                      zIndex: 9999
                    }
                  }
                }
              }}
              error={Boolean(errors.exerciseId)}
              helperText={errors.exerciseId?.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))}
              fullWidth
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
                <option value="">Seleccionar ejercicio...</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </TextField>
            )}
          />

        <Controller
          control={control}
          name="weight"
          render={({ field }) => (
            <TextField
              label="Peso (kg)"
              aria-label="Peso (kg)"
              type="number"
              error={Boolean(errors.weight)}
              helperText={errors.weight?.message}
              inputProps={{ 
                step: 'any',
                inputMode: 'decimal',
                pattern: '[0-9]*',
                min: '0'
              }}
              value={field.value ?? ''}
              onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
              sx={{
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                }
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="reps"
          render={({ field }) => (
            <TextField
              label="Repeticiones"
              aria-label="Repeticiones"
              type="number"
              error={Boolean(errors.reps)}
              helperText={errors.reps?.message}
              inputProps={{ 
                inputMode: 'numeric',
                pattern: '[0-9]*',
                min: '0'
              }}
              value={field.value ?? ''}
              onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
              sx={{
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                }
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="serie"
          render={({ field }) => (
            <TextField
              label="Serie"
              aria-label="Serie"
              type="number"
              inputProps={{ 
                inputMode: 'numeric',
                pattern: '[0-9]*',
                min: '0'
              }}
              value={field.value ?? ''}
              onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
              sx={{
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                }
              }}
            />
          )}
        />

        <Box>
          <Typography variant="h6" gutterBottom>
            Cronómetro
          </Typography>
          <TimerComponent onTimeComplete={handleTimerComplete} />
          <Controller
            control={control}
            name="seconds"
            render={({ field }) => (
              <TextField
                label="Segundos"
                aria-label="Segundos"
                type="number"
                inputProps={{ 
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
                value={field.value ?? ''}
                onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                sx={{ 
                  mt: 2,
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
            )}
          />
        </Box>

        <Controller
          control={control}
          name="observations"
          render={({ field }) => (
            <TextField
              label="Observaciones"
              aria-label="Observaciones"
              multiline
              minRows={2}
              value={field.value ?? ''}
              onChange={field.onChange}
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
          )}
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


