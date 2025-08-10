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
  TextField,
  Snackbar,
  Backdrop,
  CircularProgress,
  Alert,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import DeleteIcon from '@mui/icons-material/Delete'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import ModeEditIcon from '@mui/icons-material/ModeEdit'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import { TABS } from '../../constants/tabs'
import type { Workout, WorkoutDay, ExerciseGroup, WorkoutHistoryProps } from '../../types/workout'

export default function WorkoutHistory({ workoutSessions, workouts, onDelete, onUpdateSession, onTabChange }: WorkoutHistoryProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [selectedExercise, setSelectedExercise] = useState<Workout[] | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: number | null }>({
    show: false,
    workoutId: null
  })
  const [editSessionModal, setEditSessionModal] = useState<{ show: boolean; sessionId: number | null; currentName: string }>({
    show: false,
    sessionId: null,
    currentName: ''
  })
  const [newSessionName, setNewSessionName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null)
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<number | null>(null)

  const formatDate = (dateString: string) => {
    // Si la fecha termina en Z (UTC), la convertimos a zona horaria local
    let date: Date
    if (dateString.endsWith('Z')) {
      // Parsear la fecha UTC y convertirla a zona horaria local
      const utcDate = new Date(dateString)
      // Crear una nueva fecha en zona horaria local
      date = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000))
    } else {
      date = new Date(dateString)
    }
    
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

      // Filtrar workouts por fecha de sesión - simplificado
      const sessionWorkouts = workouts.filter(w => {
        // Usar solo la fecha sin tiempo para comparar
        const workoutDate = w.created_at.split('T')[0]
        const sessionDate = session.session_date.split('T')[0]
        return workoutDate === sessionDate
      })
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

      // Solo agregar días que tengan workouts
      if (sessionWorkouts.length > 0) {
        days.push({
          date: session.session_date,
          session,
          workouts: sessionWorkouts,
          exerciseGroups
        });
      }
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

  const handleEffortChange = async (sessionId: number, newValue: number) => {
    setLoadingSessionId(sessionId);
    try {
      await onUpdateSession(sessionId, { effort: newValue });
      setSuccessMessage('Esfuerzo actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando esfuerzo:', error);
      setErrorMessage('Error al actualizar el esfuerzo');
    } finally {
      setLoadingSessionId(null);
    }
  }

  const handleMoodChange = async (sessionId: number, newValue: number) => {
    setLoadingSessionId(sessionId);
    try {
      await onUpdateSession(sessionId, { mood: newValue });
      setSuccessMessage('Ánimo actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando ánimo:', error);
      setErrorMessage('Error al actualizar el ánimo');
    } finally {
      setLoadingSessionId(null);
    }
  }

  const handleEditSessionName = (sessionId: number, currentName: string) => {
    setEditSessionModal({ show: true, sessionId, currentName })
    setNewSessionName(currentName)
  }

  const handleSaveSessionName = async () => {
    if (editSessionModal.sessionId && newSessionName.trim()) {
      setLoadingSessionId(editSessionModal.sessionId);
      try {
        await onUpdateSession(editSessionModal.sessionId, { session_name: newSessionName.trim() });
        setEditSessionModal({ show: false, sessionId: null, currentName: '' })
        setNewSessionName('')
        setSuccessMessage('Nombre actualizado exitosamente')
      } catch (error) {
        console.error('❌ Error actualizando nombre de sesión:', error);
        setErrorMessage('Error al actualizar el nombre');
        // No cerrar modal ni mostrar éxito si hay error
      } finally {
        setLoadingSessionId(null);
      }
    }
  }

  const handleCancelEditSession = () => {
    setEditSessionModal({ show: false, sessionId: null, currentName: '' })
    setNewSessionName('')
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

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.workoutId) {
      setDeletingWorkoutId(deleteConfirmation.workoutId)
      try {
        await onDelete(deleteConfirmation.workoutId)
        setDeleteConfirmation({ show: false, workoutId: null })
      } catch (error) {
        console.error('❌ Error eliminando workout:', error)
      } finally {
        setDeletingWorkoutId(null)
      }
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

  if (workoutDays.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
          Entrenamientos
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '40vh'
        }}>
          <Paper sx={{ 
            p: 5, 
            textAlign: 'center',
            width: '100%',
            borderRadius: 3,
            boxShadow: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}>
          <Box sx={{ mb: 1 }}>
            <FitnessCenterIcon sx={{ 
              fontSize: 80, 
              color: 'primary.main',
              opacity: 0.7,
            }} />
          </Box>
          
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: 'text.primary',
            mb: 1
          }}>
            ¡Comienza tu entrenamiento!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            No hay entrenamientos registrados aún
          </Typography>
          
          <Box 
            onClick={() => onTabChange?.(TABS.WORKOUT)} // Cambiar a tab Registrar
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 1,
              p: 2,
              mb: 2,
              bgcolor: 'rgba(25, 118, 210, 0.1)',
              borderRadius: 2,
              border: '1px solid rgba(25, 118, 210, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.2)',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
              }
            }}>
            <AllInclusiveIcon sx={{ color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Registrar
            </Typography>
          </Box>
        </Paper>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DatePicker
            label="Filtrar por fecha"
            value={dateFilter}
            onChange={(newValue: Date | null) => setDateFilter(newValue)}
            shouldDisableDate={shouldDisableDate}
            views={['year', 'month', 'day']}
            openTo="day"
            slotProps={{
              popper: {
                sx: {

                  '& .MuiDateCalendar-viewTransitionContainer': {
                    '& .MuiPickersArrowSwitcher-root': {
                      display: 'flex'
                    }
                  },
                  '& .MuiPickersLayout-toolbar': {
                    display: 'none !important'
                  },
                  '& .MuiDateCalendar-header': {
                    display: 'none !important'
                  },
                  '& .MuiPickersCalendarHeader-label': {
                    display: 'none !important'
                  },
                  '& .MuiPickersCalendarHeader-labelContainer': {
                    display: 'none !important'
                  },
                  '& .MuiPickersCalendarHeader-root': {
                    display: 'none !important'
                  },
                  '& .MuiTypography-h4': {
                    display: 'none !important'
                  },
                  '& .MuiPickersCalendarHeader-switchViewButton': {
                    display: 'none !important'
                  },
                  '& .MuiPickersLayout-actionBar': {
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    px: 3,
                    py: 2,
                    '& .MuiButton-root': {
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      '&:first-of-type': {
                        // Botón Cancelar
                        color: '#666',
                        backgroundColor: 'transparent',
                        border: '1px solid #ddd',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          borderColor: '#bbb'
                        }
                      },
                      '&:last-of-type': {
                        // Botón OK
                        color: 'white',
                        backgroundColor: '#1976d2',
                        border: '1px solid #1976d2',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                          borderColor: '#1565c0'
                        }
                      }
                    }
                  }
                }
              },
              textField: {
                sx: {
                  width: '100%',
                                   '& .MuiOutlinedInput-root': {
                   bgcolor: 'transparent !important',
                   border: '1px solid #1976d2 !important',
                   borderRadius: 2,
                   '&:hover': {
                     bgcolor: 'rgba(25, 118, 210, 0.04) !important',
                     borderColor: '#1976d2 !important',
                   },
                   '&.Mui-focused': {
                     bgcolor: 'transparent !important',
                     borderColor: '#1976d2 !important',
                   },
                   '& .MuiOutlinedInput-notchedOutline': {
                     backgroundColor: 'transparent !important',
                     borderColor: '#1976d2 !important'
                   }
                 },
                 '& .MuiInputBase-root': {
                   backgroundColor: 'transparent !important'
                 },
                                   '& .MuiInputBase-input': {
                   color: 'white !important',
                   fontSize: '1rem',
                   fontWeight: 500,
                   backgroundColor: 'transparent !important'
                 },
                 '& .MuiInputAdornment-root': {
                   color: 'white !important',
                   backgroundColor: 'transparent !important'
                 },
                 '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                   color: 'white !important',
                   fontSize: '1.4rem',
                   backgroundColor: 'transparent !important'
                 },
                  '& .MuiInputBase-inputAdornedEnd': {
                    backgroundColor: 'transparent !important'
                  },
                                   '& .MuiInputLabel-root': {
                   color: 'white !important',
                   fontWeight: 600,
                   fontSize: '1rem',
                   backgroundColor: 'transparent !important',
                   px: 1,
                   borderRadius: 1,
                   '&.Mui-focused': {
                     transform: 'translate(14px, -9px) scale(0)',
                     opacity: 0
                   },
                   '&.MuiInputLabel-shrink': {
                     transform: 'translate(14px, -9px) scale(0)',
                     opacity: 0
                   }
                 },
                 '& .MuiFormLabel-root': {
                   color: 'white !important',
                   backgroundColor: 'transparent !important',
                   px: 1,
                   borderRadius: 1
                 }
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

        {/* Cards de entrenamientos */}
        <Box sx={{ mx: 2 }}>
          {filteredWorkoutDays.map((day) => (
          <Box key={day.date} sx={{ position: 'relative', mb: 2 }}>
            <Card sx={{ 
              boxShadow: 2, 
              width: '100%',
              cursor: 'pointer',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              filter: loadingSessionId === day.session.id ? 'blur(1px)' : 'none',
              transition: 'filter 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
            onClick={() => toggleDayExpansion(day.date)}
            >
            <CardContent sx={{ pl: 2, pr: 2, pt: 2, pb: 2 }}>
              {/* Header del día */}
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ pl: 0, ml: 0 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'left' }}>
                      {formatDate(day.date)}
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
                        handleEditSessionName(day.session.id, day.session.session_name);
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                        {day.session.session_name}
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
                      {day.workouts.length} {day.workouts.length === 1 ? 'ejercicio' : 'ejercicios'}
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
              <Box sx={{ mb: 2 }}>
                {/* Esfuerzo */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 1 
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography variant="body2" color="text.secondary">
                    Esfuerzo
                  </Typography>
                  <Rating 
                    value={day.session.effort} 
                    onChange={(_, newValue) => handleEffortChange(day.session.id, newValue || 0)}
                    size="small"
                    max={5}
                    sx={{ '& .MuiRating-iconFilled': { color: '#ffc107' } }}
                  />
                </Box>
                
                {/* Ánimo */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography variant="body2" color="text.secondary">
                    Ánimo
                  </Typography>
                  <Rating 
                    value={day.session.mood} 
                    onChange={(_, newValue) => handleMoodChange(day.session.id, newValue || 0)}
                    size="small"
                    max={5}
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
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
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
          
          {/* Loader overlay */}
          {loadingSessionId === day.session.id && (
            <Backdrop
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 2,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              open={true}
            >
              <CircularProgress size={40} sx={{ color: 'primary.main' }} />
            </Backdrop>
          )}
          </Box>
                  ))}
        </Box>
      </Stack>

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
                <Card key={index} sx={{ 
                  boxShadow: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative'
                }}>
                  {/* Loader para eliminación */}
                  {deletingWorkoutId === workout.id && (
                    <Backdrop
                      sx={{
                        color: '#fff',
                        zIndex: (theme) => theme.zIndex.modal + 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        position: 'absolute',
                        borderRadius: 2
                      }}
                      open={true}
                    >
                      <CircularProgress color="inherit" size={24} />
                    </Backdrop>
                  )}
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

      {/* Confirmación de eliminación */}
      <Dialog
        open={deleteConfirmation.show}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
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

      {/* Modal de edición del nombre de sesión */}
      <Dialog
        open={editSessionModal.show}
        onClose={handleCancelEditSession}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar nombre</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la sesión"
            type="text"
            fullWidth
            variant="outlined"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveSessionName();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 1, gap: 2 }}>
          <Button 
            onClick={handleCancelEditSession}
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
            onClick={handleSaveSessionName}
            variant="contained"
            disabled={!newSessionName.trim()}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              },
              '&:disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificación de éxito para edición de sesión */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 6,
          width: { xs: '95%', sm: '90%', md: '70%' },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99998
        }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            border: '1px solid #4caf50',
            '& .MuiAlert-icon': {
              color: '#2e7d32'
            }
          }}
        >
          ✅ {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 6,
          width: { xs: '95%', sm: '90%', md: '70%' },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor: '#ffebee',
            color: '#c62828',
            border: '1px solid #f44336',
            '& .MuiAlert-icon': {
              color: '#c62828'
            }
          }}
        >
          ❌ {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
