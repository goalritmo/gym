import { useState, useEffect, useMemo } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material'
import { 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  ModeEdit as ModeEditIcon,
  FitnessCenter
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import type { Workout, WorkoutDay, ExerciseGroup, WorkoutDayWithExercises } from '../../types/workout'

export default function WorkoutHistory() {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState<Date | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: number | null }>({ show: false, workoutId: null })
  const [loadingWorkoutId, setLoadingWorkoutId] = useState<number | null>(null)

  // Función para normalizar fecha a zona horaria de Argentina
  const normalizeDate = (dateString: string) => {
    console.log('🔍 normalizeDate - Input:', dateString)
    
    if (dateString.includes('T')) {
      // Es un timestamp completo, ajustar a Argentina
      const date = new Date(dateString)
      const argentinaOffset = -3 * 60 * 60 * 1000 // -3 horas en milisegundos
      const argentinaTime = new Date(date.getTime() + argentinaOffset)
      console.log('🔍 normalizeDate - Adjusted to Argentina:', argentinaTime.toISOString())
      return argentinaTime
    } else {
      // Es solo una fecha (YYYY-MM-DD), crear en zona horaria de Argentina
      const [year, month, day] = dateString.split('-').map(Number)
      // Crear fecha en UTC pero representando el día en Argentina
      const argentinaTime = new Date(Date.UTC(year, month - 1, day, 3, 0, 0)) // 3:00 UTC = 00:00 Argentina
      console.log('🔍 normalizeDate - Created in Argentina timezone:', argentinaTime.toISOString())
      return argentinaTime
    }
  }

  const formatDate = (dateString: string) => {
    const date = normalizeDate(dateString)
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    
    return `${weekday} ${day} de ${month}`
  }

  const formatDateShort = (dateString: string) => {
    const date = normalizeDate(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long'
    }
    return date.toLocaleDateString('es-ES', options)
  }

  // Agrupar workouts por día y crear días con ejercicios
  const workoutDaysWithExercises = useMemo(() => {
    const days: WorkoutDayWithExercises[] = [];

    console.log('🔍 Debug workoutDays:', {
      workoutDays: workoutDays.map(d => ({ 
        id: d.id, 
        date: d.date 
      })),
      workouts: workouts.map(w => ({ 
        id: w.id, 
        created_at: w.created_at, 
        workout_day_id: w.workout_day_id
      }))
    });

    // Agrupar workouts por workout_day_id
    const workoutsByDay = new Map<number, Workout[]>();
    workouts.forEach(workout => {
      const dayId = workout.workout_day_id;
      if (!workoutsByDay.has(dayId)) {
        workoutsByDay.set(dayId, []);
      }
      workoutsByDay.get(dayId)!.push(workout);
    });

    console.log('🔍 Workouts agrupados por day_id:', Object.fromEntries(workoutsByDay));

    workoutDays.forEach(day => {
      // Filtrar workouts por workout_day_id
      const dayWorkouts = workoutsByDay.get(day.id) || [];
      
      console.log(`🔍 Día ${day.id}: encontró ${dayWorkouts.length} workouts`)
      
      // Agrupar ejercicios por nombre
      const exerciseGroups: ExerciseGroup[] = [];
      const exerciseMap = new Map<string, Workout[]>();

      dayWorkouts.forEach(workout => {
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

      // Solo agregar días que tengan workouts
      if (dayWorkouts.length > 0) {
        days.push({
          workoutDay: day,
          exerciseGroups,
          totalWorkouts: dayWorkouts.length
        });
      }
    });

    console.log('🔍 WorkoutHistory Debug:', {
      workoutDaysCount: workoutDays.length,
      workoutsCount: workouts.length,
      workoutDaysWithExercisesCount: days.length,
      dateFilter: dateFilter?.toISOString().split('T')[0]
    });

    return days;
  }, [workoutDays, workouts, dateFilter]);

  // Filtrar días por fecha si hay filtro
  const filteredWorkoutDays = useMemo(() => {
    if (!dateFilter) return workoutDaysWithExercises;
    
    const filterDate = dateFilter.toISOString().split('T')[0];
    return workoutDaysWithExercises.filter(day => day.workoutDay.date === filterDate);
  }, [workoutDaysWithExercises, dateFilter]);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [workoutDaysData, workoutsData] = await Promise.all([
        apiClient.getWorkoutDays(),
        apiClient.getWorkouts()
      ]);
      
      setWorkoutDays(workoutDaysData as WorkoutDay[]);
      setWorkouts(workoutsData as Workout[]);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setError('Error cargando entrenamientos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de UI
  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const handleDeleteWorkout = async (workoutId: number) => {
    setLoadingWorkoutId(workoutId);
    try {
      await apiClient.deleteWorkout(workoutId);
      setWorkouts(prev => prev.filter(w => w.id !== workoutId));
      setDeleteConfirmation({ show: false, workoutId: null });
    } catch (error: any) {
      console.error('Error eliminando workout:', error);
      setError('Error eliminando ejercicio');
    } finally {
      setLoadingWorkoutId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.workoutId) {
      handleDeleteWorkout(deleteConfirmation.workoutId);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ show: false, workoutId: null });
  };

  const handleEditSessionName = (dayId: number, currentName: string) => {
    // TODO: Implementar edición de nombre de sesión
    console.log('Editar nombre de sesión:', dayId, currentName);
  };

  const handleCloseModal = () => {
    setExpandedDays(new Set());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
        Entrenamientos
      </Typography>
      
      <Stack spacing={3}>
        {/* Filtro de fecha */}
        <Box sx={{ 
          p: 3, 
          mx: 2,
          bgcolor: 'primary.main', 
          borderRadius: 3, 
          boxShadow: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            type="date"
            placeholder="DD/MM/YYYY"
            value={dateFilter ? dateFilter.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              try {
                const dateValue = e.target.value;
                console.log('🔍 Date input onChange:', dateValue);
                if (dateValue) {
                  setDateFilter(new Date(dateValue + 'T00:00:00'));
                } else {
                  setDateFilter(null);
                }
              } catch (error) {
                console.error('❌ Error en date input onChange:', error);
                setDateFilter(null);
              }
            }}
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'transparent',
                border: '1px solid white',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-focused': {
                  bgcolor: 'transparent',
                  borderColor: 'white',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent'
                }
              },
              '& .MuiInputBase-input': {
                color: 'white',
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none',
                '&::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1)',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px'
                },
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1,
                  textTransform: 'uppercase'
                }
              }
            }}
          />

        </Box>
      </Box>

        {/* Cards de entrenamientos */}
        <Box sx={{ mx: 2 }}>
          {filteredWorkoutDays.map((day) => (
          <Box key={day.workoutDay.date} sx={{ position: 'relative', mb: 2 }}>
            <Card sx={{ 
              boxShadow: 2, 
              width: '100%',
              cursor: 'pointer',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              filter: loadingWorkoutId === day.workoutDay.id ? 'blur(1px)' : 'none',
              transition: 'filter 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
            onClick={() => toggleDayExpansion(day.workoutDay.date)}
            >
            <CardContent sx={{ pl: 2, pr: 2, pt: 2, pb: 2 }}>
              {/* Header del día */}
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ pl: 0, ml: 0 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'left' }}>
                      {formatDate(day.workoutDay.date)}
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mt: 0.5,
                        cursor: 'pointer',
                        borderRadius: 1,
                        p: 0.5,
                        mx: -0.5,
                        transition: 'background-color 0.2s',
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSessionName(day.workoutDay.id, day.workoutDay.name);
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                        {day.workoutDay.name}
                      </Typography>
                      <ModeEditIcon 
                        sx={{ 
                          ml: 1, 
                          fontSize: '1rem',
                          color: 'text.secondary',
                          opacity: 0.6,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                      {day.totalWorkouts} {day.totalWorkouts === 1 ? 'ejercicio' : 'ejercicios'}
                    </Typography>
                  </Box>
                
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDayExpansion(day.workoutDay.date);
                  }}
                  size="small"
                >
                  {expandedDays.has(day.workoutDay.date) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Esfuerzo y Estado de Ánimo */}
              <Box sx={{ mb: 2 }}>
                {/* Esfuerzo */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                  }}
                >
                  <FitnessCenter sx={{ mr: 1, color: 'warning.main', fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 500 }}>
                    Esfuerzo: {day.workoutDay.effort}/10
                  </Typography>
                </Box>
                
                {/* Estado de ánimo */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    border: '1px solid rgba(156, 39, 176, 0.3)'
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'purple', fontWeight: 500 }}>
                    Estado de ánimo: {day.workoutDay.mood}/10
                  </Typography>
                </Box>
              </Box>

              {/* Resumen de ejercicios */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {day.exerciseGroups.map((group, index) => (
                  <Chip
                    key={index}
                    label={`${group.exerciseName} (${group.workouts.length})`}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Modal con detalles */}
          <Dialog
            open={expandedDays.has(day.workoutDay.date)}
            onClose={handleCloseModal}
            maxWidth="md"
            fullWidth
            sx={{ zIndex: 99998 }}
          >
            <DialogTitle sx={{ 
              pb: 1, 
              borderBottom: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {formatDate(day.workoutDay.date)}
              </Typography>
              <IconButton onClick={handleCloseModal} size="small">
                <ExpandLessIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {day.workoutDay.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {day.totalWorkouts} {day.totalWorkouts === 1 ? 'ejercicio' : 'ejercicios'} • 
                  Esfuerzo: {day.workoutDay.effort}/10 • 
                  Estado de ánimo: {day.workoutDay.mood}/10
                </Typography>
              </Box>

              <Stack spacing={2}>
                {day.exerciseGroups.map((group, groupIndex) => (
                  <Box key={groupIndex}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'primary.main', 
                      mb: 2,
                      pb: 1,
                      borderBottom: 2,
                      borderColor: 'primary.main'
                    }}>
                      {group.exerciseName}
                    </Typography>
                    
                    <Stack spacing={1}>
                      {group.workouts.map((workout, workoutIndex) => (
                        <Card key={workoutIndex} sx={{ 
                          boxShadow: 1, 
                          border: '1px solid',
                          borderColor: 'divider',
                          position: 'relative',
                          filter: loadingWorkoutId === workout.id ? 'blur(1px)' : 'none',
                          transition: 'filter 0.2s ease-in-out'
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                Serie {workout.serie}
                              </Typography>
                              
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmation({ show: true, workoutId: workout.id });
                                }}
                                size="small"
                                sx={{ 
                                  color: 'error.main',
                                  opacity: 0.7,
                                  '&:hover': { opacity: 1 }
                                }}
                                disabled={loadingWorkoutId === workout.id}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Chip 
                                label={`${workout.weight}kg`} 
                                variant="outlined" 
                                size="small"
                                sx={{ 
                                  fontWeight: 'bold',
                                  borderColor: '#2196f3',
                                  color: '#2196f3',
                                  minWidth: '60px',
                                  '&:hover': {
                                    backgroundColor: '#2196f3',
                                    color: 'white'
                                  }
                                }}
                              />
                              <Chip 
                                label={`${workout.reps} reps`} 
                                variant="outlined" 
                                size="small"
                                sx={{ 
                                  fontWeight: 'bold',
                                  borderColor: '#4caf50',
                                  color: '#4caf50',
                                  minWidth: '60px',
                                  '&:hover': {
                                    backgroundColor: '#4caf50',
                                    color: 'white'
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
                ))}
              </Stack>
            </DialogContent>
            
            <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 1, justifyContent: 'center' }}>
              <Button 
                onClick={handleCloseModal}
                variant="contained"
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
        ))}

        {filteredWorkoutDays.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {dateFilter ? 'No hay entrenamientos para esta fecha' : 'No hay entrenamientos registrados'}
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Confirmación de eliminación */}
      <Dialog
        open={deleteConfirmation.show}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        sx={{ zIndex: 99997 }}
      >
        <DialogTitle id="delete-dialog-title">Confirmar eliminación</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography id="delete-dialog-description">
            ¿Estás seguro de que quieres eliminar esta serie? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 1, gap: 2 }}>
          <Button 
            onClick={handleCancelDelete}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              color: '#666',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#bbb'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#c62828'
              }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
