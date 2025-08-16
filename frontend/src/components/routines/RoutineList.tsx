import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Fab,
  TextField,
  InputAdornment
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  FitnessCenter as FitnessCenterIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import type { RoutineWithExercises, CreateRoutineRequest } from '../../types/routine'
import RoutineForm from './RoutineForm'
import RoutineDetail from './RoutineDetail'

const RoutineList: React.FC = () => {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDetailDialog, setOpenDetailDialog] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRoutineId, setDeletingRoutineId] = useState<number | null>(null)
  const [filterText, setFilterText] = useState('')

  const loadRoutines = useCallback(async () => {
    console.log('🔄 RoutineList - loadRoutines ejecutándose')
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getUserRoutines()
      
      // Validar que data sea un array
      if (Array.isArray(data)) {
        console.log('✅ RoutineList - Datos válidos recibidos:', data.length, 'rutinas')
        setRoutines(data as RoutineWithExercises[])
      } else if (data === null || data === undefined) {
        // Si no hay rutinas, establecer array vacío
        console.log('ℹ️ RoutineList - No hay rutinas (null/undefined)')
        setRoutines([])
      } else {
        console.warn('⚠️ RoutineList - API devolvió datos no válidos:', data)
        setRoutines([])
      }
    } catch (err) {
      console.error('❌ RoutineList - Error cargando rutinas:', err)
      setError('Error al cargar las rutinas')
      setRoutines([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('🔄 RoutineList - useEffect ejecutándose, loadRoutines:', loadRoutines)
    loadRoutines()
  }, [loadRoutines])

  const handleCreateRoutine = async (routineData: CreateRoutineRequest) => {
    try {
      await apiClient.createUserRoutine(routineData)
      setOpenCreateDialog(false)
      loadRoutines()
    } catch (err) {
      console.error('Error creando rutina:', err)
      setError('Error al crear la rutina')
    }
  }

  const handleEditRoutine = async (id: number, routineData: Partial<CreateRoutineRequest>): Promise<void> => {
    try {
      await apiClient.updateUserRoutine(id, routineData)
      setOpenEditDialog(false)
      setSelectedRoutine(null)
      loadRoutines()
    } catch (err) {
      console.error('Error actualizando rutina:', err)
      setError('Error al actualizar la rutina')
    }
  }

  // Filtrar rutinas por nombre o descripción
  const filteredRoutines = routines.filter(routine =>
    routine.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (routine.description && routine.description.toLowerCase().includes(filterText.toLowerCase()))
  )

  const handleDeleteRoutine = async (id: number) => {
    try {
      setDeletingRoutineId(id)
      await apiClient.deleteUserRoutine(id)
      setDeleteDialogOpen(false)
      setDeletingRoutineId(null)
      loadRoutines()
    } catch (err) {
      console.error('Error eliminando rutina:', err)
      setError('Error al eliminar la rutina')
      setDeletingRoutineId(null)
    }
  }

  const handleViewRoutine = (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine)
    setOpenDetailDialog(true)
  }

  const handleEditClick = (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine)
    setOpenEditDialog(true)
  }



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
        Mis Rutinas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {(!routines || routines.length === 0) ? (
        <Card 
          elevation={3}
          sx={{ 
            textAlign: 'center', 
            py: 6,
            mx: { xs: 1, sm: 0 },
            border: '2px solid',
            borderColor: 'grey.300',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          }}
        >
          <CardContent>
            <FitnessCenterIcon sx={{ 
              fontSize: 80, 
              color: 'primary.main', 
              mb: 3,
              opacity: 0.7
            }} />
            <Typography 
              variant="h4" 
              color="primary.main" 
              gutterBottom
              sx={{ fontWeight: 700, mb: 2 }}
            >
              0 rutinas creadas
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                maxWidth: '400px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Crea tu primera rutina personalizada para organizar mejor tus entrenamientos y alcanzar tus objetivos
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{ 
                fontWeight: 600,
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
               Crear
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {/* Campo de búsqueda */}
          <TextField
            fullWidth
            placeholder="Buscar rutinas por nombre o descripción..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ 
            display: 'grid', 
            gap: 2,
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(auto-fill, minmax(250px, 1fr))', 
              md: 'repeat(auto-fill, minmax(280px, 1fr))' 
            },
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            {filteredRoutines?.map((routine) => (
            <Card 
              key={routine.id} 
              elevation={2}
              sx={{ 
                height: 'fit-content',
                width: '100%',
                border: '2px solid',
                borderColor: 'grey.300',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mb: 2
                }}>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'primary.main',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                    onClick={() => handleEditClick(routine)}
                  >
                    {routine.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(routine)}
                    sx={{ 
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block',
                    fontStyle: 'italic',
                    opacity: 0.8,
                    mb: 2,
                    textAlign: 'left'
                  }}
                >
                  Creada el {new Date(routine.created_at).toLocaleDateString('es-ES', {
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>

                {routine.description && (
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      fontStyle: 'italic',
                      lineHeight: 1.5
                    }}
                  >
                    {routine.description}
                  </Typography>
                )}

                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap', 
                  mb: 2,
                  alignItems: 'center'
                }}>
                  <Chip
                    label={`${routine.total_exercises} ejercicios`}
                    color="primary"
                    variant="filled"
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ 
                justifyContent: 'space-between', 
                px: 3, 
                pb: 3,
                pt: 0
              }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleViewRoutine(routine)}
                  sx={{ 
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    color: 'primary.main',
                    borderColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  Ver detalles
                </Button>
                <IconButton
                  size="medium"
                  onClick={() => handleViewRoutine(routine)}
                  sx={{ 
                    color: 'primary.main',
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  <PlayIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
        </Box>
      )}

      {/* Dialog para crear rutina */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crear Nueva Rutina</DialogTitle>
        <DialogContent>
          <RoutineForm
            onSubmit={handleCreateRoutine}
            onCancel={() => setOpenCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar rutina */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Rutina</DialogTitle>
        <DialogContent>
          {selectedRoutine && (
            <RoutineForm
              routine={selectedRoutine}
              onSubmit={(data) => handleEditRoutine(selectedRoutine.id, data)}
              onCancel={() => setOpenEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles de rutina */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalles de la Rutina</DialogTitle>
        <DialogContent>
          {selectedRoutine && (
            <RoutineDetail
              routine={selectedRoutine}
              onClose={() => setOpenDetailDialog(false)}
              onEdit={() => {
                setOpenDetailDialog(false)
                setOpenEditDialog(true)
              }}
              onStart={() => {
                // TODO: Implementar funcionalidad de comenzar rutina
                console.log('Comenzando rutina:', selectedRoutine.name)
                setOpenDetailDialog(false)
              }}
              onDelete={() => {
                setOpenDetailDialog(false)
                setDeleteDialogOpen(true)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar la rutina "{selectedRoutine?.name}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => selectedRoutine && handleDeleteRoutine(selectedRoutine.id)}
            color="error"
            disabled={deletingRoutineId === selectedRoutine?.id}
          >
            {deletingRoutineId === selectedRoutine?.id ? (
              <CircularProgress size={20} />
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Botón flotante para crear rutina */}
      <Fab
        color="primary"
        aria-label="crear rutina"
        onClick={() => setOpenCreateDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}

export default RoutineList
