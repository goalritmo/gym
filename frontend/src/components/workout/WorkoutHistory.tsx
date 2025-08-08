import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Stack, 
  Collapse, 
  Rating, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

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

type WorkoutDay = {
  date: string
  workouts: Workout[]
  totalExercises: number
  effort: number
  mood: number
}

type ExerciseGroup = {
  exerciseName: string;
  workouts: Workout[];
};

type WorkoutHistoryProps = {
  workouts: Workout[]
  onDelete: (id: number) => void
}

export default function WorkoutHistory({ workouts, onDelete }: WorkoutHistoryProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [selectedExercise, setSelectedExercise] = useState<Workout[] | null>(null);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [dateFilter, setDateFilter] = useState<Date | null>(null)

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

  // Agrupar ejercicios por día
  const groupedWorkoutDays = workoutDays.map(day => {
    const exerciseGroups: ExerciseGroup[] = [];
    const exerciseMap = new Map<string, Workout[]>();

    day.workouts.forEach(workout => {
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

    return {
      ...day,
      exerciseGroups
    };
  });

  // Inicializar estado cuando cambien los workouts
  React.useEffect(() => {
    // Agrupar workouts por día
    const groupedDays = workouts.reduce((days: WorkoutDay[], workout) => {
      const date = new Date(workout.created_at).toDateString()
      const existingDay = days.find(day => day.date === date)
      
      if (existingDay) {
        existingDay.workouts.push(workout)
        existingDay.totalExercises += 1
      } else {
        days.push({
          date,
          workouts: [workout],
          totalExercises: 1,
          effort: 0, // Valor por defecto
          mood: 0    // Valor por defecto
        })
      }
      
      return days
    }, []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setWorkoutDays(groupedDays)
  }, [workouts])

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDays(newExpanded)
  }

  const handleEffortChange = (date: string, newValue: number) => {
    setWorkoutDays(prev => prev.map(day => 
      day.date === date ? { ...day, effort: newValue === day.effort ? 0 : newValue } : day
    ))
  }

  const handleMoodChange = (date: string, newValue: number) => {
    setWorkoutDays(prev => prev.map(day => 
      day.date === date ? { ...day, mood: newValue === day.mood ? 0 : newValue } : day
    ))
  }

  const handleExerciseClick = (exerciseGroup: ExerciseGroup) => {
    setSelectedExercise(exerciseGroup.workouts);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
  };

  // Filtrar días por fecha
  const filteredWorkoutDays = groupedWorkoutDays.filter(day => {
    if (!dateFilter) return true;
    const dayDate = new Date(day.date);
    return dayDate.toDateString() === dateFilter.toDateString();
  });

  // Obtener fechas con ejercicios para el calendario
  const datesWithWorkouts = useMemo(() => {
    return workoutDays.map(day => new Date(day.date));
  }, [workoutDays]);

  // Función para verificar si una fecha tiene ejercicios
  const shouldDisableDate = (date: Date) => {
    return !datesWithWorkouts.some(workoutDate => 
      workoutDate.toDateString() === date.toDateString()
    );
  };

  // Función para obtener el número de ejercicios de una fecha
  const getWorkoutCount = (date: Date) => {
    const day = workoutDays.find(day => 
      new Date(day.date).toDateString() === date.toDateString()
    );
    return day ? day.totalExercises : 0;
  };

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
    <Box sx={{ p: 2, pl: 0 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 'bold', pl: 2 }}>
        Entrenamientos
      </Typography>

      {/* Filtro de fecha */}
      <Box sx={{ 
        p: 4, 
        bgcolor: 'primary.main', 
        borderRadius: 3, 
        boxShadow: 3,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        mb: 3,
        maxWidth: 800,
        mx: 'auto',
        px: 2
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
        maxWidth: 800,
        mx: 'auto'
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
                    Rutina de Fullbody • {day.totalExercises} ejercicios
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
                    value={day.effort} 
                    onChange={(_, newValue) => handleEffortChange(day.date, newValue || 0)}
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
                    value={day.mood} 
                    onChange={(_, newValue) => handleMoodChange(day.date, newValue || 0)}
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
                          onClick={() => onDelete(workout.id)}
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
    </Box>
  );
};
