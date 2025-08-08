import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'

type Equipment = {
  id: number
  name: string
  category: string
  observations: string | null
  image_url: string | null
  created_at: string
}

type EquipmentListProps = {
  equipment: Equipment[]
}

export default function EquipmentList({ equipment }: EquipmentListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Obtener categorías únicas para el filtro
  const categories = useMemo(() => {
    const cats = equipment.map(item => item.category)
    return [...new Set(cats)].sort()
  }, [equipment])

  // Filtrar equipamiento
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !categoryFilter || item.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
  }, [equipment, searchTerm, categoryFilter])

  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedEquipment(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES')
  }

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

  if (equipment.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No hay equipos disponibles
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
              placeholder="Buscar equipamiento..."
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
            <FormControl>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  mb: 1
                }}
              >
                Categoría
              </Typography>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {capitalizeFirstLetter(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Equipamiento */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 2
        }}>
          {filteredEquipment.map((item) => (
            <Card 
              key={item.id}
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
              onClick={() => handleEquipmentClick(item)}
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
                    {item.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    sx={{ 
                      color: 'primary.main',
                      ml: 0.5
                    }}
                  >
                    <InfoIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2, justifyContent: 'center' }}>
                    <Chip 
                      label={capitalizeFirstLetter(item.category)} 
                      color="primary" 
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Stack>
                  
                  {item.observations && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 1,
                        textAlign: 'center'
                      }}
                    >
                      {item.observations}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>

      {/* Dialog para mostrar detalles completos */}
      {selectedEquipment && (
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
                {selectedEquipment.name}
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
            <Stack spacing={2}>
              {selectedEquipment.image_url && (
                <Box sx={{ pt: 3.5 }}>
                  <img
                    src={selectedEquipment.image_url}
                    alt={selectedEquipment.name}
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      maxHeight: 300, 
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                </Box>
              )}
              
              <Box sx={{ pt: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Información del Equipo
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Categoría:
                    </Typography>
                    <Chip 
                      label={capitalizeFirstLetter(selectedEquipment.category)} 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Observaciones:
                    </Typography>
                    <Typography>
                      {selectedEquipment.observations || 'Sin observaciones'}
                    </Typography>
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
