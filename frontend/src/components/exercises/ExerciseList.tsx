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
} from '@mui/material'

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
                      {group}
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
                      {equipment}
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
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {exercise.name}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Chip 
                      label={exercise.muscle_group} 
                      size="small" 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip 
                      label={exercise.equipment} 
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
    </Box>
  )
}
