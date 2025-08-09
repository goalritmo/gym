import React, { useState } from 'react'
import { TextField, Button, Stack, Typography, Alert, Box, Divider } from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginComponent() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { login, signInWithGoogle, isLoading } = useAuth()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (login(code)) {
      setCode('')
    } else {
      setError('Código incorrecto. Intenta con "salud"')
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError('Error al iniciar sesión con Google. Inténtalo de nuevo.')
        console.error('Google sign in error:', error)
      }
    } catch (error) {
      setError('Error inesperado. Inténtalo de nuevo.')
      console.error('Unexpected error:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100%',
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
        <Typography sx={{ mb: 3 }} variant="h4" component="h1" gutterBottom textAlign="center">
          Gym App
        </Typography>
        
        <Stack spacing={3}>
          {/* Google OAuth Login */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            sx={{
              borderColor: '#4285f4',
              color: '#4285f4',
              '&:hover': {
                borderColor: '#3367d6',
                backgroundColor: 'rgba(66, 133, 244, 0.04)'
              }
            }}
          >
            {isGoogleLoading ? 'Iniciando sesión...' : 'Continuar con Google'}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              o
            </Typography>
          </Divider>

          {/* Legacy Code Login */}
          <form role="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                id="code-input"
                label="Código de acceso (desarrollo)"
                aria-label="Código"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ingresa 'salud' para desarrollo"
                fullWidth
                size="small"
              />
              
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                size="medium"
                disabled={isLoading}
              >
                Acceso rápido
              </Button>
            </Stack>
          </form>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Stack>
      </Box>
    </Box>
  )
}


