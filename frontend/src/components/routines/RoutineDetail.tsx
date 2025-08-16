import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  FitnessCenter as FitnessCenterIcon,
  Timer as TimerIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  AccessTime as AccessTimeIcon,
  Notes as NotesIcon
} from '@mui/icons-material'
import { RoutineWithExercises } from '../../types/routine'

interface RoutineDetailProps {
  routine: RoutineWithExercises
  onClose: () => void
  onEdit?: () => void
  onStart?: () => void
}

const RoutineDetail: React.FC<RoutineDetailProps> = ({ 
  routine, 
  onClose, 
  onEdit, 
  onStart 
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTotalTime = () => {
    return routine.exercises.reduce((total, exercise) => {
      return total + (exercise.rest_time_seconds * (exercise.sets - 1))
    }, 0)
  }

  const getTotalSets = () => {
    return routine.exercises.reduce((total, exercise) => total + exercise.sets, 0)
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header de la rutina */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
            {routine.name}
          </Typography>
          {routine.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {routine.description}
            </Typography>
          )}
          <Box display="flex" gap={1} flexWrap="wrap">
            {routine.is_active && (
              <Chip
                label="Activa"
                color="success"
                size="small"
              />
            )}
            <Chip
              label={`${routine.exercises.length} ejercicios`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`${getTotalSets()} series total`}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`~${formatTime(getTotalTime())} descanso`}
              variant="outlined"
              size="small"
              icon={<AccessTimeIcon />}
            />
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          {onStart && (
            <Tooltip title="Comenzar rutina">
              <IconButton
                color="primary"
                onClick={onStart}
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                <PlayIcon />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Editar rutina">
              <IconButton
                color="primary"
                onClick={onEdit}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Lista de ejercicios */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Ejercicios de la rutina
      </Typography>

      <List sx={{ p: 0 }}>
        {routine.exercises.map((exercise, index) => (
          <Card key={exercise.id} sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {exercise.exercise_name}
                    </Typography>
                  }
                  secondary={
                    <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip
                        label={`${exercise.sets} series`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${exercise.reps} reps`}
                        size="small"
                        variant="outlined"
                      />
                      {exercise.weight && exercise.weight > 0 && (
                        <Chip
                          label={`${exercise.weight} kg`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label={`${formatTime(exercise.rest_time_seconds)} descanso`}
                        size="small"
                        variant="outlined"
                        icon={<TimerIcon />}
                      />
                    </Box>
                  }
                />
              </Box>

              {exercise.notes && (
                <Box display="flex" alignItems="flex-start" sx={{ mt: 2 }}>
                  <NotesIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {exercise.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </List>

      {/* Resumen de la rutina */}
      <Card sx={{ mt: 3, backgroundColor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Resumen de la rutina
          </Typography>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {routine.exercises.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ejercicios
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {getTotalSets()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Series total
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {formatTime(getTotalTime())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tiempo descanso
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onClose}>
          Cerrar
        </Button>
      </Box>
    </Box>
  )
}

export default RoutineDetail
