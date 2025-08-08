import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'

type Exercise = {
  id: number
  name: string
  muscle_group: string
  equipment: string
}

type ExerciseListProps = {
  exercises: Exercise[]
  onSelectExercise: (exercise: Exercise) => void
}

export default function ExerciseList({ exercises, onSelectExercise }: ExerciseListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [openDialog, setOpenDialog] = useState(false)

  // Obtener valores únicos para los filtros
  const muscleGroups = useMemo(() => {
    const groups = exercises.map(ex => ex.muscle_group)
    return [...new Set(groups)].sort()
  }, [exercises])

  const equipmentTypes = useMemo(() => {
    const types = exercises.map(ex => ex.equipment)
    return [...new Set(types)].sort()
  }, [exercises])

  // Filtrar ejercicios
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMuscleGroup = !muscleGroupFilter || exercise.muscle_group === muscleGroupFilter
      const matchesEquipment = !equipmentFilter || exercise.equipment === equipmentFilter
      
      return matchesSearch && matchesMuscleGroup && matchesEquipment
    })
  }, [exercises, searchTerm, muscleGroupFilter, equipmentFilter])

  const handleExerciseClick = (exercise: Exercise) => {
    onSelectExercise(exercise)
  }

  const handleInfoClick = (exercise: Exercise, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedExercise(exercise)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedExercise(null)
  }

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

  if (exercises.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron ejercicios
        </Typography>
      </Box>
    )
  }

  if (filteredExercises.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No se encontraron ejercicios que coincidan con la búsqueda
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Hacer consulta
      </Typography>
      
      <Stack spacing={3}>
        {/* Filtros */}
        <Box sx={{ 
          p: 4, 
          bgcolor: 'primary.main', 
          borderRadius: 3, 
          boxShadow: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        }}>
          <Stack spacing={3}>
            <TextField
              placeholder="Buscar ejercicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
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
                  fontSize: '1rem'
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#666',
                  opacity: 1
                }
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3
            }}>
              <FormControl sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  Grupo muscular
                </Typography>
                <Select
                  value={muscleGroupFilter}
                  onChange={(e) => setMuscleGroupFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 1)'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white'
                    },
                    '& .MuiSelect-select': {
                      color: '#333',
                      fontSize: '1rem'
                    }
                  }}
                >
                  <MenuItem value="">Elegir</MenuItem>
                  {muscleGroups.map(group => (
                    <MenuItem key={group} value={group}>
                      {capitalizeFirstLetter(group)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  Equipamiento
                </Typography>
                <Select
                  value={equipmentFilter}
                  onChange={(e) => setEquipmentFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 1)'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white'
                    },
                    '& .MuiSelect-select': {
                      color: '#333',
                      fontSize: '1rem'
                    }
                  }}
                >
                  <MenuItem value="">Elegir</MenuItem>
                  {equipmentTypes.map(equipment => (
                    <MenuItem key={equipment} value={equipment}>
                      {capitalizeFirstLetter(equipment)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Box>

        {/* Todos los ejercicios */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 2
        }}>
          {filteredExercises.map((exercise) => (
            <Card 
              key={exercise.id}
              sx={{ 
                cursor: 'pointer', 
                height: '100%',
                '&:hover': { 
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
              onClick={() => handleExerciseClick(exercise)}
            >
              <CardContent sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                textAlign: 'center'
              }}>
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      textAlign: 'center'
                    }}
                  >
                    {exercise.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={(e) => handleInfoClick(exercise, e)}
                    sx={{ 
                      color: 'primary.main',
                      ml: 0.5
                    }}
                  >
                    <InfoIcon />
                  </IconButton>
                </Box>
                <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ justifyContent: 'center' }}>
                    <Chip 
                      label={capitalizeFirstLetter(exercise.muscle_group)} 
                      size="small" 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip 
                      label={capitalizeFirstLetter(exercise.equipment)} 
                      size="small" 
                      variant="outlined" 
                      sx={{ borderColor: 'primary.main' }}
                    />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>

      {/* Modal informativo mejorado */}
      {selectedExercise && (
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxWidth: { xs: '100vw', sm: '90vw', md: '500px' },
              maxHeight: { xs: '100vh', sm: '80vh', md: '70vh' },
              m: { xs: 0, sm: 2 },
              width: { xs: '100vw', sm: '90vw', md: '500px' },
              height: { xs: '100vh', sm: 'auto', md: 'auto' }
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            pb: 2,
            px: { xs: 2, sm: 3 }
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {selectedExercise.name}
              </Typography>
              <IconButton 
                onClick={handleCloseDialog}
                sx={{ 
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <InfoIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={3}>
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Información del Ejercicio
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Grupo Muscular:
                    </Typography>
                    <Chip 
                      label={capitalizeFirstLetter(selectedExercise.muscle_group)} 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Equipamiento:
                    </Typography>
                    <Chip 
                      label={capitalizeFirstLetter(selectedExercise.equipment)} 
                      variant="outlined" 
                      sx={{ borderColor: 'primary.main' }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
            <Button 
              onClick={handleCloseDialog}
              variant="contained"
              sx={{ 
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                py: { xs: 0.5, sm: 1 }
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
