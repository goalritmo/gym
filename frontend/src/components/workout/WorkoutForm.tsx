import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Stack } from '@mui/material'
import type { Resolver } from 'react-hook-form'

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
  const { handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      exerciseId: undefined as unknown as number,
      weight: undefined as unknown as number,
      reps: undefined as unknown as number,
      serie: undefined,
      seconds: undefined,
      observations: '',
    },
  })

  const submit = handleSubmit((data) => onSubmit(data))

  return (
    <form role="form" onSubmit={submit}>
      <Stack spacing={2}>
        <Controller
          control={control}
          name="exerciseId"
          render={({ field }) => (
            <TextField
              select
              label="Ejercicio"
              aria-label="Ejercicio"
              SelectProps={{ native: true }}
              error={Boolean(errors.exerciseId)}
              helperText={errors.exerciseId?.message}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(Number((e.target as HTMLInputElement).value))}
            >
              <option value="">Seleccionar...</option>
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
              inputProps={{ step: 'any' }}
              value={field.value ?? ''}
              onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
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
              value={field.value ?? ''}
              onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
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
              value={field.value ?? ''}
              onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
            />
          )}
        />

        <Controller
          control={control}
          name="seconds"
          render={({ field }) => (
            <TextField
              label="Segundos"
              aria-label="Segundos"
              type="number"
              value={field.value ?? ''}
              onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
            />
          )}
        />

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
            />
          )}
        />

        <Button type="submit" variant="contained">
          Guardar
        </Button>
      </Stack>
    </form>
  )
}


