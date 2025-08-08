import React, { useState } from 'react'

type Exercise = { id: number; name: string }
type WorkoutFormValues = {
  exerciseId: number | null
  weight: number | null
  reps: number | null
  serie?: number | null
  seconds?: number | null
  observations?: string
}

export default function WorkoutForm({
  exercises,
  onSubmit,
}: {
  exercises: Exercise[]
  onSubmit: (values: Required<Omit<WorkoutFormValues, 'serie' | 'seconds' | 'observations'>> &
    Pick<WorkoutFormValues, 'serie' | 'seconds' | 'observations'>) => void
}) {
  const [values, setValues] = useState<WorkoutFormValues>({
    exerciseId: null,
    weight: null,
    reps: null,
    serie: null,
    seconds: null,
    observations: '',
  })
  const [errors, setErrors] = useState<{ exercise?: string; weight?: string; reps?: string }>({})

  const handleChange = (field: keyof WorkoutFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value
    setValues((prev) => ({
      ...prev,
      [field]: v === '' ? null : field === 'observations' ? v : Number(v),
    }))
  }

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!values.exerciseId) nextErrors.exercise = 'Seleccioná un ejercicio'
    if (!values.weight || values.weight <= 0) nextErrors.weight = 'Ingresá un peso válido'
    if (!values.reps || values.reps <= 0) nextErrors.reps = 'Ingresá repeticiones válidas'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      exerciseId: values.exerciseId!,
      weight: values.weight!,
      reps: values.reps!,
      serie: values.serie ?? undefined,
      seconds: values.seconds ?? undefined,
      observations: values.observations ?? undefined,
    })
  }

  return (
    <form role="form" onSubmit={submit}>
      <label htmlFor="exercise">Ejercicio</label>
      <select id="exercise" aria-label="Ejercicio" value={values.exerciseId ?? ''} onChange={handleChange('exerciseId')}>
        <option value="">Seleccionar...</option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
      {errors.exercise && <p>{errors.exercise}</p>}

      <label htmlFor="weight">Peso (kg)</label>
      <input id="weight" aria-label="Peso (kg)" type="number" value={values.weight ?? ''} onChange={handleChange('weight')} />
      {errors.weight && <p>{errors.weight}</p>}

      <label htmlFor="reps">Repeticiones</label>
      <input id="reps" aria-label="Repeticiones" type="number" value={values.reps ?? ''} onChange={handleChange('reps')} />
      {errors.reps && <p>{errors.reps}</p>}

      <label htmlFor="serie">Serie</label>
      <input id="serie" aria-label="Serie" type="number" value={values.serie ?? ''} onChange={handleChange('serie')} />

      <label htmlFor="seconds">Segundos</label>
      <input id="seconds" aria-label="Segundos" type="number" value={values.seconds ?? ''} onChange={handleChange('seconds')} />

      <label htmlFor="observations">Observaciones</label>
      <textarea id="observations" aria-label="Observaciones" value={values.observations ?? ''} onChange={handleChange('observations')} />

      <button type="submit">Guardar</button>
    </form>
  )
}


