import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { AdminNotifications } from './AdminNotifications'
import { AdminExercises } from './AdminExercises'
import { apiClient } from '../../lib/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

type AdminPanelProps = {
  open: boolean
  onClose: () => void
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  useEffect(() => {
    // Verificar permisos de administrador al cargar
    const checkAdminPermissions = async () => {
      try {
        setLoading(true)
        // Intentar acceder a un endpoint de admin para verificar permisos
        await apiClient.getAdminNotifications()
        setError('')
      } catch (error) {
        console.error('Error verificando permisos de administrador:', error)
        setError('No tienes permisos de administrador para acceder a este panel.')
      } finally {
        setLoading(false)
      }
    }

    checkAdminPermissions()
  }, [])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            🛠️ Panel de Administrador
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {loading ? (
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
              Verificando permisos de administrador...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ fontSize: '1rem' }}>
              {error}
            </Alert>
          </Box>
        ) : (
          <Box sx={{ height: '100%' }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="admin tabs"
                sx={{
                  '& .MuiTab-root': {
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    minHeight: 64
                  }
                }}
              >
                <Tab 
                  label="📢 Notificaciones" 
                  id="admin-tab-0"
                  aria-controls="admin-tabpanel-0"
                />
                <Tab 
                  label="💪 Ejercicios" 
                  id="admin-tab-1"
                  aria-controls="admin-tabpanel-1"
                />
              </Tabs>
            </Box>

            {/* Tab Panels */}
            <Box sx={{ height: 'calc(100% - 64px)', overflow: 'auto' }}>
              <TabPanel value={activeTab} index={0}>
                <AdminNotifications />
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                <AdminExercises />
              </TabPanel>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
