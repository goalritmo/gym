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
  Tooltip
} from '@mui/material'
import {
  Timer as TimerIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  AccessTime as AccessTimeIcon,
  Notes as NotesIcon
} from '@mui/icons-material'
import type { RoutineWithExercises } from '../../types/routine'

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
    if (!routine.exercises || routine.exercises.length === 0) return 0
    return routine.exercises.reduce((total, exercise) => {
      return total + (exercise.rest_time_seconds * (exercise.sets - 1))
    }, 0)
  }

  const getTotalSets = () => {
    if (!routine.exercises || routine.exercises.length === 0) return 0
    return routine.exercises.reduce((total, exercise) => total + exercise.sets, 0)
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
          borderColor: 'primary.main',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
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
                  mb: 1,
                  color: 'primary.main',
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
                {routine.is_active && (
                  <Chip
                    label="Activa"
                    color="success"
                    size="medium"
                    sx={{ fontWeight: 700 }}
                  />
                )}
                <Chip
                  label={`${routine.exercises?.length || 0} ejercicios`}
                  color="primary"
                  variant="filled"
                  size="medium"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`${getTotalSets()} series total`}
                  color="secondary"
                  variant="filled"
                  size="medium"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`~${formatTime(getTotalTime())} descanso`}
                  color="warning"
                  variant="filled"
                  size="medium"
                  icon={<AccessTimeIcon />}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexShrink: 0
            }}>
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
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Lista de ejercicios */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Ejercicios de la rutina
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {routine.exercises && routine.exercises.length > 0 ? (
          routine.exercises.map((exercise, index) => (
          <Card 
            key={exercise.id} 
            elevation={2}
            sx={{ 
              border: '2px solid',
              borderColor: 'grey.300',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header del ejercicio */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 2,
                mb: 2
              }}>
                {/* Número del ejercicio */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {index + 1}
                </Box>
                
                {/* Información del ejercicio */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      color: 'text.primary'
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
                      label={`${exercise.sets} series`}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={`${exercise.reps} reps`}
                      size="small"
                      color="secondary"
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                    {exercise.weight && exercise.weight > 0 && (
                      <Chip
                        label={`${exercise.weight} kg`}
                        size="small"
                        color="info"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    <Chip
                      label={`${formatTime(exercise.rest_time_seconds)} descanso`}
                      size="small"
                      color="warning"
                      variant="filled"
                      icon={<TimerIcon />}
                      sx={{ fontWeight: 600 }}
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
        ))
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
        backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '2px solid',
        borderColor: 'secondary.main',
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
              color: 'secondary.main',
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
              borderColor: 'primary.light',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>
                {routine.exercises?.length || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                🏋️ Ejercicios
              </Typography>
            </Box>
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'white',
              border: '2px solid',
              borderColor: 'secondary.light',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 800, mb: 1 }}>
                {getTotalSets()}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                🔄 Series total
              </Typography>
            </Box>
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              borderRadius: '12px',
              backgroundColor: 'white',
              border: '2px solid',
              borderColor: 'warning.light',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h3" color="warning.main" sx={{ fontWeight: 800, mb: 1 }}>
                {formatTime(getTotalTime())}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                ⏱️ Tiempo descanso
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
