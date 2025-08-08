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
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main' }}>
        Biblioteca de Ejercicios
      </Typography>
      
      <Stack spacing={3}>
        {/* Filtros */}
        <Box sx={{ 
          p: 3, 
          bgcolor: 'background.paper', 
          borderRadius: 2, 
          boxShadow: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
            Filtros
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Buscar ejercicios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por grupo muscular</InputLabel>
          <Select
            value={muscleGroupFilter}
            label="Filtrar por grupo muscular"
            onChange={(e) => setMuscleGroupFilter(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {muscleGroups.map(group => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por equipo</InputLabel>
          <Select
            value={equipmentFilter}
            label="Filtrar por equipo"
            onChange={(e) => setEquipmentFilter(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {equipmentTypes.map(equipment => (
              <MenuItem key={equipment} value={equipment}>
                {equipment}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
        </Box>

      {/* Lista de ejercicios */}
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
        {filteredExercises.map((exercise) => (
          <Card 
            key={exercise.id}
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { 
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease'
              },
              minWidth: 250,
              flex: '1 1 300px',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
            onClick={() => handleExerciseClick(exercise)}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {exercise.name}
              </Typography>
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
            </CardContent>
          </Card>
        ))}
      </Stack>
        </Stack>
      </Box>
  )
}
