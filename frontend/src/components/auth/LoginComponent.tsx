import { useState } from 'react'
import { Button, Typography, Alert, Box } from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginComponent() {
  const [error, setError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { signInWithGoogle } = useAuth()



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
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          textAlign="center"
          sx={{ 
            mb: 3, 
            fontWeight: 'bold', 
            color: '#000' 
          }}
        >
          Gym App
        </Typography>
        
        {/* Google OAuth Login */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          variant="outlined"
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          sx={{
            borderColor: '#4285f4',
            fontWeight: 'bold',
            color: '#4285f4',
            '&:hover': {
              borderColor: '#3367d6',
              backgroundColor: 'rgba(66, 133, 244, 0.04)'
            }
          }}
        >
          {isGoogleLoading ? 'Iniciando...' : 'Continuar'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  )
}


