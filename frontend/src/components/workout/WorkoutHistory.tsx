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
  ModeEdit as ModeEditIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import type { Workout, WorkoutDay, ExerciseGroup, WorkoutDayWithExercises } from '../../types/workout'

export default function WorkoutHistory() {
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: number | null }>({ show: false, workoutId: null })
  const [loadingWorkoutId, setLoadingWorkoutId] = useState<number | null>(null)
  const [exerciseModal, setExerciseModal] = useState<{ show: boolean; exerciseGroup: ExerciseGroup | null; workoutDay: WorkoutDay | null }>({ show: false, exerciseGroup: null, workoutDay: null })



  const formatDate = (dateString: string) => {
    try {
      // Ajustar la fecha para compensar el problema del día de atraso
      const date = new Date(dateString);
      date.setDate(date.getDate() + 1);
      
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      
      const weekday = weekdays[date.getDay()]
      const day = date.getDate()
      const month = months[date.getMonth()]
      
      return `${weekday} ${day} de ${month}`
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return dateString;
    }
  }

  // Agrupar workouts por día y crear días con ejercicios
  const workoutDaysWithExercises = useMemo(() => {
    const days: WorkoutDayWithExercises[] = [];

    // Verificar que los arrays no sean null/undefined
    const safeWorkoutDays = workoutDays || [];
    const safeWorkouts = workouts || [];

    console.log('🔍 Debug workoutDays:', {
      workoutDays: safeWorkoutDays.map(d => ({ 
        id: d.id, 
        date: d.date 
      })),
      workouts: safeWorkouts.map(w => ({ 
        id: w.id, 
        created_at: w.created_at, 
        workout_day_id: w.workout_day_id
      }))
    });

    // Agrupar workouts por workout_day_id
    const workoutsByDay = new Map<number, Workout[]>();
    safeWorkouts.forEach(workout => {
      const dayId = workout.workout_day_id;
      if (!workoutsByDay.has(dayId)) {
        workoutsByDay.set(dayId, []);
      }
      workoutsByDay.get(dayId)!.push(workout);
    });

    console.log('🔍 Workouts agrupados por day_id:', Object.fromEntries(workoutsByDay));

    safeWorkoutDays.forEach(day => {
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
      workoutDaysCount: safeWorkoutDays.length,
      workoutsCount: safeWorkouts.length,
      workoutDaysWithExercisesCount: days.length
    });

    return days;
  }, [workoutDays, workouts]);

  // Filtrar y ordenar días
  const filteredAndSortedWorkoutDays = useMemo(() => {
    let filtered = workoutDaysWithExercises;
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(day => {
        // Buscar en nombre de ejercicios
        const exerciseMatch = day.exerciseGroups.some(group => 
          group.exerciseName.toLowerCase().includes(searchLower)
        );
        
        // Buscar en observaciones de workouts
        const observationMatch = day.exerciseGroups.some(group =>
          group.workouts.some(workout => 
            workout.observations && workout.observations.toLowerCase().includes(searchLower)
          )
        );
        
        // Buscar en peso, reps, etc.
        const workoutDataMatch = day.exerciseGroups.some(group =>
          group.workouts.some(workout => 
            workout.weight.toString().includes(searchLower) ||
            workout.reps.toString().includes(searchLower) ||
            (workout.seconds && workout.seconds.toString().includes(searchLower))
          )
        );
        
        return exerciseMatch || observationMatch || workoutDataMatch;
      });
    }
    
    // Ordenar por fecha
    filtered.sort((a, b) => {
      const dateA = new Date(a.workoutDay.date);
      const dateB = new Date(b.workoutDay.date);
      
      if (sortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });
    
    return filtered;
  }, [workoutDaysWithExercises, searchTerm, sortOrder]);

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
      
      setWorkoutDays(workoutDaysData as WorkoutDay[] || []);
      setWorkouts(workoutsData as Workout[] || []);
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
    console.log('🔍 handleDeleteWorkout llamado con ID:', workoutId)
    setLoadingWorkoutId(workoutId)
    try {
      console.log('🔍 Llamando a apiClient.deleteWorkout...')
      await apiClient.deleteWorkout(workoutId)
      console.log('🔍 Workout eliminado exitosamente')
      // Recargar datos después de eliminar
      await loadData()
      console.log('🔍 Datos recargados')
    } catch (error) {
      console.error('❌ Error eliminando workout:', error)
      setError('Error eliminando el ejercicio')
    } finally {
      setLoadingWorkoutId(null)
      setDeleteConfirmation({ show: false, workoutId: null })
    }
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.workoutId) {
      handleDeleteWorkout(deleteConfirmation.workoutId)
    }
  }

  const handleEditSessionName = (dayId: number, currentName: string) => {
    // TODO: Implementar edición de nombre de sesión
    console.log('Editar nombre de sesión:', dayId, currentName);
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
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
        Entrenamientos
      </Typography>
      
      <Stack spacing={3}>
        {/* Buscador y ordenamiento */}
        <Box sx={{ 
          p: 3, 
          mx: 0.5,
          bgcolor: 'primary.main', 
          borderRadius: 3, 
          boxShadow: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar ejercicios, peso, reps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1
                }
              }
            }}
          />
          
          <Button
            variant="outlined"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {sortOrder === 'newest' ? 'Más recientes' : 'Más antiguos'}
          </Button>
        </Box>
      </Box>

        {/* Cards de entrenamientos */}
        <Box sx={{ mx: 0.5 }}>
          {filteredAndSortedWorkoutDays.map((day) => (
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

              {/* Resumen de ejercicios */}
              {expandedDays.has(day.workoutDay.date) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  {day.exerciseGroups.map((group, index) => (
                    <Card
                      key={index}
                      onClick={() => setExerciseModal({ show: true, exerciseGroup: group, workoutDay: day.workoutDay })}
                      sx={{
                        boxShadow: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        width: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-2px)',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {group.exerciseName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {group.workouts.length} {group.workouts.length === 1 ? 'serie' : 'series'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Modal de confirmación de eliminación */}
          <Dialog
            open={deleteConfirmation.show}
            onClose={() => {
              setDeleteConfirmation({ show: false, workoutId: null });
              // Mantener cerrada la sección expandida
              setExpandedDays(new Set());
            }}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
              <Typography>
                ¿Estás seguro de que quieres eliminar este ejercicio? Esta acción no se puede deshacer.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setDeleteConfirmation({ show: false, workoutId: null });
                // Mantener cerrada la sección expandida
                setExpandedDays(new Set());
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                color="error" 
                variant="contained"
                disabled={loadingWorkoutId !== null}
              >
                Eliminar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de ejercicio individual */}
          <Dialog
            open={exerciseModal.show}
            onClose={() => setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null })}
            maxWidth="md"
            fullWidth
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
                {exerciseModal.exerciseGroup?.exerciseName}
              </Typography>
              <IconButton 
                onClick={() => setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null })}
                size="small"
              >
                <ExpandLessIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ margin: '8px 0px -16px' }}>
                  {exerciseModal.workoutDay ? formatDate(exerciseModal.workoutDay.date) : ''}
                </Typography>
              </Box>

              <Stack spacing={2}>
                {exerciseModal.exerciseGroup?.workouts.map((workout, workoutIndex) => (
                  <Card key={workoutIndex} sx={{ 
                    boxShadow: 1, 
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    filter: loadingWorkoutId === workout.id ? 'blur(1px)' : 'none',
                    transition: 'filter 0.2s ease-in-out'
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Serie {workout.serie}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} alignItems="center">
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
                        </Box>
                        
                        <IconButton
                          onClick={(e) => {
                            console.log('🔍 Botón eliminar clickeado para workout ID:', workout.id)
                            e.stopPropagation();
                            setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null });
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
                      
                      {workout.observations && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                          "{workout.observations}"
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </DialogContent>
            
            <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 1, justifyContent: 'center' }}>
              <Button 
                onClick={() => setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null })}
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
        </Box>

        {filteredAndSortedWorkoutDays.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No se encontraron entrenamientos con esa búsqueda' : 'No hay entrenamientos registrados'}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
