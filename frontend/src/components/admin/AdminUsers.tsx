import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Avatar
} from '@mui/material'
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material'
import { apiClient } from '../../lib/api'

type AdminUser = {
  id: string
  email: string | null
  name: string | null
  is_admin: boolean
  created_at: string
  last_login: string | null
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterText, setFilterText] = useState('')

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const usersData = await apiClient.getAdminUsers()
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${weekday} ${day} de ${month} de ${year} a las ${hours}:${minutes}`
  }

  // Filtrar usuarios por nombre o email
  const filteredUsers = (users || []).filter(user =>
    (user.name && user.name.toLowerCase().includes(filterText.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(filterText.toLowerCase()))
  )

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Cargando usuarios...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{
      maxWidth: '900px',
      mx: 'auto',
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          👥 Usuarios Registrados
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {filteredUsers.length} de {users.length} usuarios
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Buscar por nombre o email..."
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

      {/* Users List */}
      <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
        <Stack spacing={2}>
          {filteredUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {filterText ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
              </Typography>
            </Box>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: user.is_admin ? 'primary.main' : 'grey.500' }}>
                      <PersonIcon />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {user.name || 'Sin nombre'}
                        </Typography>
                        {user.is_admin && (
                          <Chip 
                            label="Admin" 
                            size="small" 
                            color="primary" 
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Registrado el {formatDate(user.created_at)}
                    </Typography>
                    
                    {user.last_login && (
                      <Typography variant="caption" color="text.secondary">
                        Último acceso: {formatDate(user.last_login)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Box>
    </Box>
  )
}
