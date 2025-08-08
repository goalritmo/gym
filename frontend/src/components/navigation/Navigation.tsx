import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material'





type NavigationProps = {
  activeTab: number
  onTabChange: (newValue: number) => void
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue)
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Gym App
          </Typography>
        </Toolbar>
        <Tabs 
          value={activeTab} 
          onChange={handleChange} 
          centered
          sx={{ backgroundColor: '#1565c0' }}
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label="Login" />
          <Tab label="Entrenamiento" />
          <Tab label="Ejercicios" />
          <Tab label="Equipamiento" />
          <Tab label="Historial" />
        </Tabs>
      </AppBar>
    </Box>
  )
}
