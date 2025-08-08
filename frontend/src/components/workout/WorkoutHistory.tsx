import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  IconButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

type Workout = {
  id: number
  exercise_name: string
  weight: number
  reps: number
  serie: number | null
  seconds: number | null
  observations: string | null
  created_at: string
}

type WorkoutHistoryProps = {
  workouts: Workout[]
  onDelete: (id: number) => void
}

export default function WorkoutHistory({ workouts, onDelete }: WorkoutHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES')
  }

  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (workouts.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No hay entrenamientos registrados
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" gutterBottom>
        Historial de Entrenamientos
      </Typography>
      
      {sortedWorkouts.map((workout) => (
        <Card key={workout.id} sx={{ position: 'relative' }}>
          <CardContent>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  {workout.exercise_name}
                </Typography>
                <IconButton
                  onClick={() => onDelete(workout.id)}
                  color="error"
                  size="small"
                  aria-label="eliminar"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              
              <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                <Chip label={`${workout.weight} kg`} color="primary" />
                <Chip label={`${workout.reps} reps`} color="secondary" />
                {workout.serie && (
                  <Chip label={`Serie ${workout.serie}`} variant="outlined" />
                )}
                {workout.seconds && (
                  <Chip label={`${workout.seconds}s`} variant="outlined" />
                )}
              </Stack>
              
              {workout.observations && (
                <Typography variant="body2" color="text.secondary">
                  {workout.observations}
                </Typography>
              )}
              
              <Typography variant="caption" color="text.secondary">
                {formatDate(workout.created_at)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
