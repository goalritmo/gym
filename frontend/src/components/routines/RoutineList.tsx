import React, { useState, useEffect } from 'react'
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
  Fab
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  FitnessCenter as FitnessCenterIcon
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

  const loadRoutines = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getUserRoutines()
      
      // Validar que data sea un array
      if (Array.isArray(data)) {
        setRoutines(data as RoutineWithExercises[])
      } else {
        console.warn('API devolvió datos no válidos:', data)
        setRoutines([])
      }
    } catch (err) {
      console.error('Error cargando rutinas:', err)
      setError('Error al cargar las rutinas')
      setRoutines([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoutines()
  }, [])

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

  const handleDeleteClick = (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine)
    setDeleteDialogOpen(true)
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
        <Card sx={{ textAlign: 'center', py: 4, mx: 0.5 }}>
          <CardContent>
            <FitnessCenterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes rutinas creadas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Crea tu primera rutina personalizada para organizar mejor tus entrenamientos
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Crear
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box display="grid" gap={2} sx={{ 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(350px, 1fr))' },
          mx: 0.5
        }}>
          {routines?.map((routine) => (
            <Card key={routine.id} sx={{ height: 'fit-content' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {routine.name}
                  </Typography>
                  <Box>
                    {routine.is_active && (
                      <Chip
                        label="Activa"
                        color="success"
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleViewRoutine(routine)}
                      sx={{ color: 'primary.main' }}
                    >
                      <PlayIcon />
                    </IconButton>
                  </Box>
                </Box>

                {routine.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {routine.description}
                  </Typography>
                )}

                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  <Chip
                    label={`${routine.total_exercises} ejercicios`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`Creada ${new Date(routine.created_at).toLocaleDateString('es-ES')}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(routine)}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(routine)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleViewRoutine(routine)}
                >
                  Ver detalles
                </Button>
              </CardActions>
            </Card>
          ))}
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
