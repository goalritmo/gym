import { useState } from 'react'
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
    <Box>
      <Typography variant="h5" gutterBottom>
        Equipamiento Disponible
      </Typography>
      
      <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 3 }}>
        {equipment.map((item) => (
          <Box key={item.id} sx={{ flex: '1 1 300px', minWidth: 300 }}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { boxShadow: 3 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => handleEquipmentClick(item)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">
                      {item.name}
                    </Typography>
                    <IconButton size="small" color="primary">
                      <InfoIcon />
                    </IconButton>
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <Chip label={item.category} color="primary" size="small" />
                  </Stack>
                  
                  {item.observations && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.observations}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.created_at)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>

      {/* Dialog para mostrar detalles completos */}
      {selectedEquipment && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedEquipment.name}
            <Button
              onClick={handleCloseDialog}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              Cerrar
            </Button>
          </DialogTitle>
          
          <DialogContent>
            <Stack spacing={2}>
              {selectedEquipment.image_url && (
                <Box>
                  <img
                    src={selectedEquipment.image_url}
                    alt={selectedEquipment.name}
                    style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'cover' }}
                  />
                </Box>
              )}
              
              <Box>
                <Typography variant="h6" gutterBottom>
                  Información del Equipo
                </Typography>
                
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Categoría:
                    </Typography>
                    <Chip label={selectedEquipment.category} color="primary" />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Observaciones:
                    </Typography>
                    <Typography>
                      {selectedEquipment.observations || 'Sin observaciones'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Fecha de creación:
                    </Typography>
                    <Typography>
                      {formatDate(selectedEquipment.created_at)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
