import { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Collapse,
  Fade
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import ListAltIcon from '@mui/icons-material/ListAlt'

import HistoryIcon from '@mui/icons-material/History'
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import UserAvatar from '../user/UserAvatar'
import { TABS, type TabType } from '../../constants/tabs'

type NavigationProps = {
  activeTab: TabType
  onTabChange: (newValue: TabType) => void
  onLogout: () => void
}

export default function Navigation({ activeTab, onTabChange }: Omit<NavigationProps, 'onLogout'>) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [showToolbarElements, setShowToolbarElements] = useState(false)
  const timeoutsRef = useRef<number[]>([])

  // Limpiar timeouts cuando el componente se desmonte
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // Mostrar elementos de la barra al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToolbarElements(true)
    }, 50) as unknown as number
    timeoutsRef.current.push(timer)
    
    return () => clearTimeout(timer)
  }, [])

  // Animar elementos de la barra cuando cambie el tab
  useEffect(() => {
    setShowToolbarElements(false)
    const timer = setTimeout(() => {
      setShowToolbarElements(true)
    }, 80) as unknown as number
    timeoutsRef.current.push(timer)
    
    return () => clearTimeout(timer)
  }, [activeTab])

  const handleDrawerToggle = () => {
    // Limpiar timeouts existentes
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    
    if (!drawerOpen) {
      setDrawerOpen(true)
      // Animación escalonada: mostrar items uno por uno
      setVisibleItems([])
      menuItems.forEach((_, index) => {
        const timeoutId = setTimeout(() => {
          setVisibleItems(prev => [...prev, index])
        }, index * 80) as unknown as number // 80ms entre cada item
        timeoutsRef.current.push(timeoutId)
      })
    } else {
      setDrawerOpen(false)
      setVisibleItems([])
    }
  }

  const handleTabChange = (newValue: TabType) => {
    onTabChange(newValue)
    setDrawerOpen(false)
    setVisibleItems([])
  }

  const menuItems = [
    { label: 'Entrenatiempo', icon: <AllInclusiveIcon />, value: TABS.WORKOUT },
    { label: 'Todos los Ejercicios', icon: <ListAltIcon />, value: TABS.EXERCISES },
    { label: 'Todo el Equipamiento', icon: <FitnessCenterIcon />, value: TABS.EQUIPMENT },
    { label: 'Mis Entrenamientos', icon: <HistoryIcon />, value: TABS.HISTORY },
  ]

  return (
    <Box sx={{ 
      flexGrow: 1, 
      position: 'relative',
      '@keyframes slideInFromLeft': {
        '0%': {
          transform: 'translateX(-60px)',
          opacity: 0
        },
        '30%': {
          transform: 'translateX(-40px)',
          opacity: 0.1
        },
        '60%': {
          transform: 'translateX(-10px)',
          opacity: 0.4
        },
        '85%': {
          transform: 'translateX(8px)',
          opacity: 0.8
        },
        '100%': {
          transform: 'translateX(0)',
          opacity: 1
        }
      },
      '@keyframes slideInFromTop': {
        '0%': {
          transform: 'translateY(-30px)',
          opacity: 0
        },
        '30%': {
          transform: 'translateY(-20px)',
          opacity: 0.1
        },
        '60%': {
          transform: 'translateY(-5px)',
          opacity: 0.4
        },
        '85%': {
          transform: 'translateY(4px)',
          opacity: 0.8
        },
        '100%': {
          transform: 'translateY(0)',
          opacity: 1
        }
      },
      '@keyframes slideInFromRight': {
        '0%': {
          transform: 'translateX(60px)',
          opacity: 0
        },
        '30%': {
          transform: 'translateX(40px)',
          opacity: 0.1
        },
        '60%': {
          transform: 'translateX(10px)',
          opacity: 0.4
        },
        '85%': {
          transform: 'translateX(-6px)',
          opacity: 0.8
        },
        '100%': {
          transform: 'translateX(0)',
          opacity: 1
        }
      }
    }}>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          {showToolbarElements && (
            <Box sx={{ 
              transform: 'translateX(0)',
              transition: 'all 0.3s ease-in-out',
              animation: 'slideInFromLeft 0.3s ease-out'
            }}>
              <IconButton
                color="inherit"
                aria-label="abrir menú"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
          
          {showToolbarElements && (
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                textAlign: 'center',
                fontWeight: 'bold',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease-in-out',
                animation: 'slideInFromTop 0.3s ease-out'
              }}
            >
              Gym App
            </Typography>
          )}
          
          {showToolbarElements && (
            <Box sx={{ 
              transform: 'translateX(0)',
              transition: 'all 0.3s ease-in-out',
              animation: 'slideInFromRight 0.3s ease-out'
            }}>
              <UserAvatar />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Collapse in={drawerOpen} timeout="auto" unmountOnExit>
        <Box 
          sx={{ 
            backgroundColor: '#1976d2',
            color: 'white',
            width: '100%',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }} 
          role="presentation" 
          onClick={handleDrawerToggle}
        >
          <List>
            {menuItems.map((item, index) => (
              <Fade 
                key={item.value} 
                in={visibleItems.includes(index)} 
                timeout={300}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={activeTab === item.value}
                    onClick={() => handleTabChange(item.value)}
                    sx={{
                      color: 'white',
                      transform: visibleItems.includes(index) ? 'translateY(0)' : 'translateY(-15px)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#1565c0',
                        '&:hover': {
                          backgroundColor: '#0d47a1',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      sx={{ 
                        color: 'white',
                        fontWeight: activeTab === item.value ? 'bold' : 'normal'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Fade>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  )
}
