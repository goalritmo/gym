import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import DeleteIcon from '@mui/icons-material/Delete'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import type { Workout, WorkoutDay, ExerciseGroup, WorkoutHistoryProps } from '../../types/workout'

export default function WorkoutHistory({ workoutSessions, workouts, onDelete, onUpdateSession }: WorkoutHistoryProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [selectedExercise, setSelectedExercise] = useState<Workout[] | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: number | null }>({
    show: false,
    workoutId: null
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
    return date.toLocaleDateString('es-ES', options)
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long'
    }
    return date.toLocaleDateString('es-ES', options)
  }

  // Agrupar workouts por sesión y crear días
  const workoutDays = useMemo(() => {
    const days: WorkoutDay[] = [];
    
    workoutSessions.forEach(session => {
      const sessionWorkouts = workouts.filter(w => 
        new Date(w.created_at).toDateString() === new Date(session.session_date).toDateString()
      );
      
      // Agrupar ejercicios por nombre
      const exerciseGroups: ExerciseGroup[] = [];
      const exerciseMap = new Map<string, Workout[]>();

      sessionWorkouts.forEach(workout => {
        const exerciseName = workout.exercise_name;
        if (!exerciseMap.has(exerciseName)) {
          exerciseMap.set(exerciseName, []);
        }
        exerciseMap.get(exerciseName)!.push(workout);
      });

      exerciseMap.forEach((workouts, exerciseName) => {
        exerciseGroups.push({
          exerciseName,
          workouts
        });
      });

      days.push({
        date: session.session_date,
        session,
        workouts: sessionWorkouts,
        exerciseGroups
      });
    });

    return days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workoutSessions, workouts]);

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDays(newExpanded)
  }

  const handleEffortChange = (sessionId: number, newValue: number) => {
    onUpdateSession(sessionId, { effort: newValue });
  }

  const handleMoodChange = (sessionId: number, newValue: number) => {
    onUpdateSession(sessionId, { mood: newValue });
  }

  const handleExerciseClick = (exerciseGroup: ExerciseGroup) => {
    setSelectedExercise(exerciseGroup.workouts);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
  };

  const handleDeleteClick = (workoutId: number) => {
    setDeleteConfirmation({ show: true, workoutId })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.workoutId) {
      onDelete(deleteConfirmation.workoutId)
      setDeleteConfirmation({ show: false, workoutId: null })
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmation({ show: false, workoutId: null })
  }

  // Filtrar días por fecha
  const filteredWorkoutDays = workoutDays.filter(day => {
    if (!dateFilter) return true;
    const dayDate = new Date(day.date);
    return dayDate.toDateString() === dateFilter.toDateString();
  });

  // Obtener fechas con ejercicios para el calendario
  const datesWithWorkouts = useMemo(() => {
    return workoutSessions.map(session => new Date(session.session_date));
  }, [workoutSessions]);

  // Función para verificar si una fecha tiene ejercicios
  const shouldDisableDate = (date: Date) => {
    return !datesWithWorkouts.some(sessionDate => 
      sessionDate.toDateString() === date.toDateString()
    );
  };

  if (workoutSessions.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        px: 3
      }}>
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center',
          width: '100%',
          maxWidth: 500,
          borderRadius: 3,
          boxShadow: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}>
          <Box sx={{ mb: 3 }}>
            <FitnessCenterIcon sx={{ 
              fontSize: 80, 
              color: 'primary.main',
              opacity: 0.7,
              mb: 2
            }} />
          </Box>
          
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: 'text.primary',
            mb: 2
          }}>
            ¡Comienza tu primer entrenamiento!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            No hay entrenamientos registrados aún. Ve al menú y selecciona <strong>Entrenatiempo</strong> para comenzar a registrar tus ejercicios.
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            p: 2,
            bgcolor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(25, 118, 210, 0.2)'
          }}>
            <AllInclusiveIcon sx={{ color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Menú → Entrenatiempo
            </Typography>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold', px: 2 }}>
        Mis Entrenamientos
      </Typography>

      {/* Filtro de fecha */}
      <Box sx={{ 
        p: 3, 
        mx: 2,
        bgcolor: 'primary.main', 
        borderRadius: 3, 
        boxShadow: 3,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        mb: 3
      }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            label="Filtrar por fecha"
            value={dateFilter}
            onChange={(newValue: Date | null) => setDateFilter(newValue)}
            shouldDisableDate={shouldDisableDate}
            slotProps={{
              textField: {
                sx: {
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 1)'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: '#333',
                    fontSize: '1rem',
                    fontWeight: 500
                  },
                  '& .MuiInputAdornment-root': {
                    color: 'white'
                  },
                  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                    color: 'white',
                    fontSize: '1.25rem'
                  }
                },
                InputLabelProps: {
                  style: { color: 'white' }
                }
              },
              day: {
                sx: {
                  '&.MuiPickersDay-root': {
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark'
                      }
                    },
                    '&:not(.Mui-disabled)': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark'
                      }
                    }
                  }
                }
              }
            }}
          />
        </LocalizationProvider>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        mx: 2
      }}>
        {filteredWorkoutDays.map((day) => (
          <Card key={day.date} sx={{ 
            mb: 2, 
            boxShadow: 2, 
            width: '100%',
            cursor: 'pointer',
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease-in-out'
            }
          }}
          onClick={() => toggleDayExpansion(day.date)}
          >
            <CardContent>
              {/* Header del día */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ pl: 0, ml: 0 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatDate(day.date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 2 }}>
                    {day.session.session_name} • {day.workouts.length} {day.workouts.length === 1 ? 'ejercicio' : 'ejercicios'}
                  </Typography>
                </Box>
                
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDayExpansion(day.date);
                  }}
                  size="small"
                >
                  {expandedDays.has(day.date) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Esfuerzo y Estado de Ánimo */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2, ml: 2 }}>
                <Box onClick={(e) => e.stopPropagation()}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Esfuerzo
                  </Typography>
                  <Rating 
                    value={day.session.effort} 
                    onChange={(_, newValue) => handleEffortChange(day.session.id, newValue || 0)}
                    size="small"
                    max={3}
                    sx={{ '& .MuiRating-iconFilled': { color: '#ffc107' } }}
                  />
                </Box>
                <Box onClick={(e) => e.stopPropagation()}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ánimo
                  </Typography>
                  <Rating 
                    value={day.session.mood} 
                    onChange={(_, newValue) => handleMoodChange(day.session.id, newValue || 0)}
                    size="small"
                    max={3}
                    sx={{ '& .MuiRating-iconFilled': { color: '#ff9800' } }}
                  />
                </Box>
              </Box>

              {/* Ejercicios del día */}
              <Collapse in={expandedDays.has(day.date)}>
                <Stack spacing={2} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  {day.exerciseGroups.map((exerciseGroup) => (
                    <Card 
                      key={exerciseGroup.exerciseName} 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExerciseClick(exerciseGroup);
                      }}
                    >
                      <CardContent sx={{ py: 2, px: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                            {exerciseGroup.exerciseName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exerciseGroup.workouts.length} {exerciseGroup.workouts.length === 1 ? 'serie' : 'series'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Modal para mostrar series del ejercicio */}
      <Dialog 
        open={!!selectedExercise} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: { xs: '330px' },
            maxHeight: { xs: '90vh' },
            m: { xs: 1, sm: 2 },
            width: { xs: '330px' },
            height: { xs: 'auto' }
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            px: { xs: 2, sm: 4 },
            pb: 2,
            pt: 3
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {selectedExercise?.[0]?.exercise_name}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, sm: 4 }, pt: 4 }}>
          <Box sx={{ mt: 2 }}>
            <Stack spacing={3}>
              {selectedExercise?.map((workout, index) => (
                <Card key={index} sx={{ boxShadow: 2 }}>
                  <CardContent sx={{ py: 2, px: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold' }}>
                        Serie {workout.serie || index + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateShort(workout.created_at)}
                        </Typography>
                        <IconButton
                          onClick={() => handleDeleteClick(workout.id)}
                          color="error"
                          size="small"
                          aria-label="eliminar serie"
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'error.light',
                              color: 'white'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ width: '100%', mb: 2 }}>
                      <Chip 
                        label={`${workout.weight} kg`} 
                        color="primary" 
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          minWidth: '60px',
                          '&:hover': {
                            backgroundColor: 'primary.dark'
                          }
                        }}
                      />
                      <Chip 
                        label={`${workout.reps} reps`} 
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          minWidth: '60px',
                          '&:hover': {
                            backgroundColor: '#388e3c'
                          }
                        }}
                      />
                      {workout.seconds && (
                        <Chip 
                          label={`${workout.seconds}s`} 
                          variant="outlined" 
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            borderColor: '#4caf50',
                            color: '#4caf50',
                            minWidth: '50px',
                            '&:hover': {
                              backgroundColor: '#4caf50',
                              color: 'white'
                            }
                          }}
                        />
                      )}
                    </Stack>
                    
                    {workout.observations && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        "{workout.observations}"
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: { xs: 2, sm: 4 }, pt: 0 }}>
          <Button onClick={handleCloseModal} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog
        open={deleteConfirmation.show}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            ¿Estás seguro de que quieres eliminar esta serie? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 4 }, pt: 0 }}>
          <Button onClick={handleCancelDelete} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
