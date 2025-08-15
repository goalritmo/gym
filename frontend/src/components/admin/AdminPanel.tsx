import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { AdminNotifications } from './AdminNotifications'
import { AdminExercises } from './AdminExercises'
import { AdminUsers } from './AdminUsers'
import { useAuth } from '../../contexts/AuthContext'

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
  const { userRole } = useAuth()

  // Determinar qué pestañas están disponibles según el rol
  const getAvailableTabs = () => {
    const tabs = []
    
    if (userRole === 'admin' || userRole === 'staff' || userRole === 'profe') {
      tabs.push('notifications')
    }
    if (userRole === 'admin' || userRole === 'profe') {
      tabs.push('exercises')
    }
    if (userRole === 'admin') {
      tabs.push('users')
    }
    
    return tabs
  }

  const availableTabs = getAvailableTabs()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Resetear activeTab si está fuera del rango válido
  useEffect(() => {
    if (activeTab >= availableTabs.length) {
      setActiveTab(0)
    }
  }, [activeTab, availableTabs.length])

  useEffect(() => {
    // No necesitamos verificar permisos aquí porque el usuario ya pasó la verificación del menú
    setLoading(false)
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
            {userRole === 'staff' ? '🛠️ Panel de Staff' : 
             userRole === 'profe' ? '👍 Panel de Profesor' : 
             '🛠️ Panel de Administrador'}
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
        ) : (
          <Box sx={{ height: '100%' }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ 
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#a8a8a8',
                  },
                },
              }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  aria-label="admin tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: 64,
                      minWidth: 'auto',
                      px: 3
                    }
                  }}
                >
                  {availableTabs.map((tab, index) => {
                    const tabConfig = {
                      notifications: { label: "📢 Notificaciones", id: `admin-tab-${index}`, controls: `admin-tabpanel-${index}` },
                      exercises: { label: "💪 Ejercicios", id: `admin-tab-${index}`, controls: `admin-tabpanel-${index}` },
                      users: { label: "👥 Usuarios", id: `admin-tab-${index}`, controls: `admin-tabpanel-${index}` }
                    }
                    
                    return (
                      <Tab 
                        key={tab}
                        label={tabConfig[tab as keyof typeof tabConfig].label}
                        id={tabConfig[tab as keyof typeof tabConfig].id}
                        aria-controls={tabConfig[tab as keyof typeof tabConfig].controls}
                      />
                    )
                  })}
                </Tabs>
              </Box>
            </Box>

            {/* Tab Panels */}
            <Box sx={{ height: 'calc(100% - 64px)', overflow: 'hidden' }}>
              {availableTabs.map((tab, index) => {
                const panelConfig = {
                  notifications: <AdminNotifications />,
                  exercises: <AdminExercises />,
                  users: <AdminUsers />
                }
                
                return (
                  <TabPanel key={tab} value={activeTab} index={index}>
                    <Box sx={{ height: '100%' }}>
                      {panelConfig[tab as keyof typeof panelConfig]}
                    </Box>
                  </TabPanel>
                )
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
