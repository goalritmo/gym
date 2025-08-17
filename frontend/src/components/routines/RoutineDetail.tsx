import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Checkbox,
  LinearProgress
} from '@mui/material'
import {
  Timer as TimerIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Notes as NotesIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import type { RoutineWithExercises } from '../../types/routine'
import { useUserSettings } from '../../contexts/UserSettingsContext'

interface RoutineDetailProps {
  routine: RoutineWithExercises
  onClose: () => void
  onEdit?: () => void
  onStart?: () => void
  onDelete?: () => void
  isActiveRoutine?: boolean
  routineProgress?: number
  onExerciseClick?: (exercise: any) => void
}

const RoutineDetail: React.FC<RoutineDetailProps> = ({ 
  routine, 
  onClose, 
  onEdit, 
  onStart,
  onDelete,
  isActiveRoutine = false,
  routineProgress,
  onExerciseClick
}) => {
  const { toggleExerciseCompleted, getCompletedExercisesForRoutine, getRoutineProgress } = useUserSettings()
  
  // Obtener fecha actual y ejercicios completados
  const today = new Date().toISOString().split('T')[0]
  const completedExercisesForRoutine = getCompletedExercisesForRoutine(today, routine.id)
  const realRoutineProgress = getRoutineProgress(today, routine.id, routine)
  
  // Detectar si la rutina está completa
  const isRoutineComplete = realRoutineProgress === 100
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Funciones para calcular el resumen basado en ejercicios completados manualmente
  const getTotalSets = () => {
    if (!routine.exercises || routine.exercises.length === 0) return 0
    return routine.exercises.reduce((total, exercise) => total + exercise.sets, 0)
  }

  const getTotalReps = () => {
    if (!routine.exercises || routine.exercises.length === 0) return 0
    return routine.exercises.reduce((total, exercise) => total + (exercise.reps * exercise.sets), 0)
  }

  // Funciones para calcular el progreso real basado en checkboxes
  const getCompletedExercises = () => {
    if (!routine.exercises || routine.exercises.length === 0) return 0
    return routine.exercises.filter(exercise => {
      const completedSets = completedExercisesForRoutine[exercise.exercise_id] || []
      return completedSets.length === exercise.sets
    }).length
  }

  const getCompletedSets = () => {
    if (!routine.exercises || routine.exercises.length === 0) return 0
    return routine.exercises.reduce((total, exercise) => {
      const completedSets = completedExercisesForRoutine[exercise.exercise_id] || []
      return total + completedSets.length
    }, 0)
  }

  const getCompletedReps = () => {
    if (!routine.exercises || routine.exercises.length === 0) return 0
    return routine.exercises.reduce((total, exercise) => {
      const completedSets = completedExercisesForRoutine[exercise.exercise_id] || []
      return total + (exercise.reps * completedSets.length)
    }, 0)
  }

  return (
    <Box sx={{ 
      p: 2,
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box'
    }}>


      {/* Header de la rutina */}
      <Card 
        elevation={3}
        sx={{ 
          mb: 3,
          border: '2px solid',
          borderColor: isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'primary.main'),
          borderRadius: '16px',
          background: isRoutineComplete 
            ? 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
            : (isActiveRoutine 
              ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
              : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)')
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                component="h2" 
                sx={{ 
                  fontWeight: 800,
                  color: isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'primary.main'),
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {routine.name}
              </Typography>
              {routine.description && (
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    fontStyle: 'italic',
                    fontSize: '1.1rem'
                  }}
                >
                  {routine.description}
                </Typography>
              )}
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <Chip
                  label={`${routine.exercises?.length || 0} ${(routine.exercises?.length || 0) === 1 ? 'ejercicio' : 'ejercicios'}`}
                  color={isRoutineComplete ? "success" : (isActiveRoutine ? "warning" : "primary")}
                  variant="filled"
                  size="medium"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`${getTotalSets()} ${getTotalSets() === 1 ? 'serie' : 'series'}`}
                  color={isRoutineComplete ? "success" : (isActiveRoutine ? "warning" : "primary")}
                  variant="filled"
                  size="medium"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`${getTotalReps()} ${getTotalReps() === 1 ? 'rep' : 'reps'}`}
                  color={isRoutineComplete ? "success" : (isActiveRoutine ? "warning" : "primary")}
                  variant="filled"
                  size="medium"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexShrink: 0
            }}>
          {onDelete && (!isActiveRoutine || isRoutineComplete) && (
            <Tooltip title="Eliminar rutina">
              <IconButton
                color="error"
                onClick={onDelete}
                sx={{ 
                  backgroundColor: 'transparent',
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: 'white'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (!isActiveRoutine || isRoutineComplete) && (
            <Tooltip title="Editar rutina">
              <IconButton
                color={isRoutineComplete ? "success" : "primary"}
                onClick={onEdit}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {onStart && !isRoutineComplete && (
            <Tooltip title={isActiveRoutine ? "Rutina en progreso" : "Comenzar rutina"}>
              <IconButton
                color={isActiveRoutine ? "warning" : "primary"}
                onClick={onStart}
                disabled={isActiveRoutine}
                sx={{ 
                  backgroundColor: isActiveRoutine ? 'warning.main' : 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: isActiveRoutine ? 'warning.dark' : 'primary.dark'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'warning.main',
                    color: 'white'
                  }
                }}
              >
                {isActiveRoutine ? <StopIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Barra de progreso */}
      {routineProgress !== undefined && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Progreso de la rutina
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'text.secondary') }}>
              {realRoutineProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={realRoutineProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'primary.main')
              }
            }}
          />
        </Box>
      )}

      {/* Lista de ejercicios */}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.isArray(routine.exercises) && routine.exercises.length > 0 ? (
          routine.exercises.map((exercise) => {
            const completedSets = completedExercisesForRoutine[exercise.exercise_id] || []
            const isCompleted = completedSets.length === exercise.sets
            return (
              <Card 
                key={exercise.id} 
                elevation={2}
                sx={{ 
                  border: '2px solid',
                  borderColor: isCompleted ? 'success.main' : 'grey.300',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: isActiveRoutine ? 'pointer' : 'default',
                  '&:hover': {
                    borderColor: isCompleted ? 'success.dark' : (isActiveRoutine ? 'primary.main' : 'grey.300'),
                    boxShadow: isActiveRoutine ? '0 8px 25px rgba(0,0,0,0.15)' : 'none',
                    transform: isActiveRoutine ? 'translateY(-2px)' : 'none'
                  }
                }}
                onClick={() => isActiveRoutine && onExerciseClick?.(exercise)}
              >
            <CardContent sx={{ p: 3 }}>
              {/* Header del ejercicio */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 2,
                mb: 2
              }}>
                {/* Checkboxes por serie */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                  {Array.from({ length: exercise.sets }, (_, setIndex) => {
                    const setNumber = setIndex + 1
                    const completedSets = completedExercisesForRoutine[exercise.exercise_id] || []
                    const isSetCompleted = completedSets.includes(setNumber)
                    
                    return (
                      <Checkbox
                        key={setNumber}
                        checked={isSetCompleted}
                        disabled={!isActiveRoutine}
                        onChange={() => {
                          if (isActiveRoutine) {
                            toggleExerciseCompleted(today, routine.id, exercise.exercise_id, setNumber)
                          }
                        }}
                        sx={{
                          color: isRoutineComplete ? 'success.main' : 'warning.main',
                          '&.Mui-checked': {
                            color: isRoutineComplete ? 'success.main' : 'warning.main',
                          },
                          '&.Mui-disabled': {
                            color: isSetCompleted ? (isRoutineComplete ? 'success.main' : 'warning.main') : 'grey.400',
                          },
                          p: 0.5
                        }}
                      />
                    )
                  })}
                </Box>
                

                
                {/* Información del ejercicio */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      color: isActiveRoutine ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {exercise.exercise_name}
                  </Typography>
                  
                  {/* Chips de información */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <Chip
                      label={`${exercise.sets} ${exercise.sets === 1 ? 'serie' : 'series'}`}
                      size="small"
                      color={isRoutineComplete ? "success" : (isCompleted ? "warning" : (isActiveRoutine ? "primary" : "default"))}
                      variant="filled"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: !isActiveRoutine && !isCompleted ? 'grey.300' : undefined,
                        color: !isActiveRoutine && !isCompleted ? 'grey.600' : undefined
                      }}
                    />
                    <Chip
                      label={`${exercise.reps} ${exercise.reps === 1 ? 'rep' : 'reps'}`}
                      size="small"
                      color={isRoutineComplete ? "success" : (isCompleted ? "warning" : (isActiveRoutine ? "primary" : "default"))}
                      variant="filled"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: !isActiveRoutine && !isCompleted ? 'grey.300' : undefined,
                        color: !isActiveRoutine && !isCompleted ? 'grey.600' : undefined
                      }}
                    />
                    {exercise.weight && exercise.weight > 0 && (
                      <Chip
                        label={`${exercise.weight} kg`}
                        size="small"
                        color={isRoutineComplete ? "success" : (isCompleted ? "warning" : (isActiveRoutine ? "primary" : "default"))}
                        variant="filled"
                        sx={{ 
                          fontWeight: 600,
                          backgroundColor: !isActiveRoutine && !isCompleted ? 'grey.300' : undefined,
                          color: !isActiveRoutine && !isCompleted ? 'grey.600' : undefined
                        }}
                      />
                    )}
                    <Chip
                      label={`${formatTime(exercise.rest_time_seconds)} descanso`}
                      size="small"
                      color={isRoutineComplete ? "success" : (isCompleted ? "warning" : (isActiveRoutine ? "primary" : "default"))}
                      variant="filled"
                      icon={<TimerIcon />}
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: !isActiveRoutine && !isCompleted ? 'grey.300' : undefined,
                        color: !isActiveRoutine && !isCompleted ? 'grey.600' : undefined
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Notas del ejercicio */}
              {exercise.notes && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 1,
                  mt: 2,
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <NotesIcon sx={{ 
                    color: 'text.secondary', 
                    fontSize: 20,
                    mt: 0.25
                  }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontStyle: 'italic' }}
                  >
                    {exercise.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
            )
          })
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary'
          }}>
            <Typography variant="h6">
              No hay ejercicios en esta rutina
            </Typography>
          </Box>
        )}
      </Box>

      {/* Resumen de la rutina */}
      <Card sx={{ 
        mt: 3, 
        backgroundColor: isRoutineComplete 
          ? 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
          : (isActiveRoutine 
            ? 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'),
        border: '2px solid',
        borderColor: isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'grey.400'),
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 800,
              color: isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'text.secondary'),
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            📊 Resumen de la rutina
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: 3,
            '@media (max-width: 600px)': {
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 2
            }
          }}>
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'white',
              border: '2px solid',
              borderColor: isRoutineComplete ? 'success.light' : (isActiveRoutine ? 'warning.light' : 'grey.300'),
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                          <Typography variant="h3" color={isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'text.secondary')} sx={{ fontWeight: 800, mb: 1 }}>
              {getCompletedExercises()}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
              🏋️ {(getCompletedExercises() === 1 ? 'Ejercicio' : 'Ejercicios')} completados
            </Typography>
            </Box>
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'white',
              border: '2px solid',
              borderColor: isRoutineComplete ? 'success.light' : (isActiveRoutine ? 'warning.light' : 'grey.300'),
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h3" color={isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'text.secondary')} sx={{ fontWeight: 800, mb: 1 }}>
                {getCompletedSets()}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                🔄 {(getCompletedSets() === 1 ? 'Serie' : 'Series')} completadas
              </Typography>
            </Box>
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'white',
              border: '2px solid',
              borderColor: isRoutineComplete ? 'success.light' : (isActiveRoutine ? 'warning.light' : 'grey.300'),
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h3" color={isRoutineComplete ? 'success.main' : (isActiveRoutine ? 'warning.main' : 'text.secondary')} sx={{ fontWeight: 800, mb: 1 }}>
                {getCompletedReps()}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                🔄 {(getCompletedReps() === 1 ? 'Rep' : 'Reps')} completadas
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent={isRoutineComplete ? "center" : "space-between"} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onClose}>
          Cerrar
        </Button>
        {!isRoutineComplete && onStart && (
          <Button
            variant="contained"
            onClick={onStart}
            disabled={isActiveRoutine}
            startIcon={isActiveRoutine ? <StopIcon /> : <PlayIcon />}
            sx={{
              backgroundColor: isActiveRoutine ? 'warning.main' : 'primary.main',
              '&:hover': {
                backgroundColor: isActiveRoutine ? 'warning.light' : 'primary.light'
              }
            }}
          >
            {isActiveRoutine ? 'Parar' : 'Iniciar'}
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default RoutineDetail
