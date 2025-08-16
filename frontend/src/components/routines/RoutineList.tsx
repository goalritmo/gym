import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
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
  Stop as StopIcon,
  FitnessCenter as FitnessCenterIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import type { RoutineWithExercises, CreateRoutineRequest } from '../../types/routine'
import RoutineForm from './RoutineForm'
import RoutineDetail from './RoutineDetail'

interface RoutineListProps {
  activeRoutine?: any
  routineProgress?: number
}

const RoutineList: React.FC<RoutineListProps> = ({ activeRoutine, routineProgress = 0 }) => {
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
  const [editNameModal, setEditNameModal] = useState<{
    show: boolean
    routineId: number | null
    currentName: string
    newName: string
  }>({
    show: false,
    routineId: null,
    currentName: '',
    newName: ''
  })

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

  const handleViewRoutine = async (routine: RoutineWithExercises) => {
    try {
      // Obtener la rutina completa con ejercicios
      const fullRoutine = await apiClient.getUserRoutine(routine.id) as RoutineWithExercises
      setSelectedRoutine(fullRoutine)
      setOpenDetailDialog(true)
    } catch (error) {
      console.error('Error obteniendo detalles de la rutina:', error)
      setError('Error al cargar los detalles de la rutina')
    }
  }



  const handleEditNameClick = (routine: RoutineWithExercises) => {
    setEditNameModal({
      show: true,
      routineId: routine.id,
      currentName: routine.name,
      newName: routine.name
    })
  }

  const handleSaveRoutineName = async () => {
    if (!editNameModal.routineId || !editNameModal.newName.trim()) {
      return
    }

    try {
      await apiClient.updateUserRoutine(editNameModal.routineId, { name: editNameModal.newName.trim() })
      
      // Actualizar el estado local
      setRoutines(prevRoutines => 
        prevRoutines.map(routine => 
          routine.id === editNameModal.routineId 
            ? { ...routine, name: editNameModal.newName.trim() }
            : routine
        )
      )

      setEditNameModal({ show: false, routineId: null, currentName: '', newName: '' })
    } catch (error) {
      console.error('Error actualizando nombre de la rutina:', error)
      setError('Error al actualizar el nombre de la rutina')
    }
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
                position: 'relative',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              {activeRoutine?.id === routine.id && (
                <Box sx={{
                  position: 'absolute',
                  top: 20,
                  right: 16,
                  backgroundColor: 'warning.main',
                  color: 'white',
                  borderRadius: '12px',
                  px: 1.5,
                  py: 0.5,
                  zIndex: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    {routineProgress}%
                  </Typography>
                </Box>
              )}
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
                      color: activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      cursor: activeRoutine?.id === routine.id ? 'default' : 'pointer',
                      '&:hover': {
                        textDecoration: activeRoutine?.id === routine.id ? 'none' : 'underline'
                      }
                    }}
                    onClick={() => activeRoutine?.id !== routine.id && handleEditNameClick(routine)}
                  >
                    🏋️ {routine.name}
                  </Typography>
                  {activeRoutine?.id !== routine.id && (
                    <IconButton
                      size="small"
                      onClick={() => handleEditNameClick(routine)}
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
                  )}
                </Box>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block',
                    fontStyle: 'italic',
                    opacity: 0.8,
                    mb: 0.5,
                    textAlign: 'left'
                  }}
                >
                  {routine.updated_at && routine.updated_at !== routine.created_at ? 'Actualizada' : 'Creada'} el {new Date(routine.updated_at || routine.created_at).toLocaleDateString('es-ES', {
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
                    color: activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main',
                    borderColor: activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main',
                    '&:hover': {
                      backgroundColor: activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main',
                      color: 'white'
                    },
                    '&:focus': {
                      borderColor: `${activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main'} !important`,
                      outline: 'none'
                    },
                    '&.Mui-focused': {
                      borderColor: `${activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main'} !important`
                    },
                    '&.MuiButton-outlined.Mui-focused': {
                      borderColor: `${activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main'} !important`
                    }
                  }}
                >
                  Ver detalles
                </Button>
                <IconButton
                  size="medium"
                  onClick={() => {
                    if (activeRoutine?.id === routine.id) {
                      // Detener la rutina activa
                      const event = new CustomEvent('stopRoutine', { 
                        detail: { routine: routine } 
                      })
                      window.dispatchEvent(event)
                    } else {
                      // Iniciar rutina directamente sin abrir modal
                      const event = new CustomEvent('startRoutine', { 
                        detail: { routine: routine } 
                      })
                      window.dispatchEvent(event)
                    }
                  }}
                  sx={{ 
                    color: 'white',
                    backgroundColor: activeRoutine?.id === routine.id ? 'warning.main' : 'primary.main',
                    '&:hover': {
                      backgroundColor: activeRoutine?.id === routine.id ? 'warning.light' : 'primary.light',
                      color: 'white'
                    }
                  }}
                >
                  {activeRoutine?.id === routine.id ? <StopIcon /> : <PlayIcon />}
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
                // Cerrar el modal y cambiar a la tab de registrar
                setOpenDetailDialog(false)
                // Emitir un evento personalizado para que AuthenticatedApp lo capture
                const event = new CustomEvent('startRoutine', { 
                  detail: { routine: selectedRoutine } 
                })
                window.dispatchEvent(event)
              }}
              onDelete={() => {
                setOpenDetailDialog(false)
                setDeleteDialogOpen(true)
              }}
              isActiveRoutine={activeRoutine?.id === selectedRoutine?.id}
              completedExercises={[]} // TODO: Obtener ejercicios completados del backend
              routineProgress={routineProgress}
              onExerciseClick={(exercise) => {
                setOpenDetailDialog(false)
                // Navegar al registro con el ejercicio pre-cargado
                const event = new CustomEvent('startRoutineWithExercise', { 
                  detail: { routine: selectedRoutine, exercise: exercise } 
                })
                window.dispatchEvent(event)
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

      {/* Modal de edición de nombre */}
      <Dialog
        open={editNameModal.show}
        onClose={() => setEditNameModal({ show: false, routineId: null, currentName: '', newName: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          fontSize: '1.2rem',
          color: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          Editar nombre de la rutina
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Nombre de la rutina"
            value={editNameModal.newName}
            onChange={(e) => setEditNameModal(prev => ({ ...prev, newName: e.target.value }))}
            variant="outlined"
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setEditNameModal({ show: false, routineId: null, currentName: '', newName: '' })}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveRoutineName}
            disabled={!editNameModal.newName.trim() || editNameModal.newName.trim() === editNameModal.currentName}
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
            Guardar
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
