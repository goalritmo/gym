import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import type { ReactNode } from 'react'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          fontSize: '14px',
          fontWeight: 500,
        },
      },
    },
  },
})

type AppLayoutProps = {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Ancho fijo para simular móvil en desktop
        '@media (min-width: 768px)': {
          width: '375px',
          maxWidth: '375px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid #ccc',
          borderRadius: '20px',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          height: '667px',
          backgroundColor: 'white',
        }
      }}>
        <Container 
          maxWidth={false}
          sx={{ 
            flexGrow: 1, 
            py: 2,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: 'white',
          }}
        >
          {children}
        </Container>
      </Box>
    </ThemeProvider>
  )
}
