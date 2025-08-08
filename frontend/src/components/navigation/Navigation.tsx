import { Tabs, Tab, Box } from '@mui/material'

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
      <Tabs 
        value={activeTab} 
        onChange={handleChange} 
        variant="scrollable"
        scrollButtons="auto"
        sx={{ 
          backgroundColor: '#1565c0',
          '& .MuiTabs-scrollButtons': {
            color: 'white',
          },
          '& .MuiTabs-scrollButtons.Mui-disabled': {
            opacity: 0.3,
          }
        }}
        textColor="inherit"
        indicatorColor="secondary"
      >
        <Tab label="Entrenamiento" />
        <Tab label="Ejercicios" />
        <Tab label="Equipamiento" />
        <Tab label="Historial" />
      </Tabs>
    </Box>
  )
}
