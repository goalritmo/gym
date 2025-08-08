import React, { useState } from 'react'
import { TextField, Button, Stack, Typography, Alert, Box } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginComponent() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (login(code)) {
      setCode('')
    } else {
      setError('Código incorrecto. Intenta con salud')
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      flexGrow: 1,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 1,
      mx: 1,
      my: 1
    }}>
      <Box sx={{ 
        bgcolor: 'white', 
        p: 3, 
        borderRadius: 2, 
        boxShadow: 3,
        maxWidth: '90%',
        width: '100%'
      }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          Gym App
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
          Ingresa el código de acceso
        </Typography>
        
        <form role="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            <TextField
              id="code-input"
              label="Código de acceso"
              aria-label="Código"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ingresa el código"
              fullWidth
              autoFocus
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth
              size="large"
            >
              Acceder
            </Button>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
          </Stack>
        </form>
      </Box>
    </Box>
  )
}


