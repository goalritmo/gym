import React, { useEffect } from 'react'
import { Box, Button, Typography, Alert, CircularProgress, Stack, Paper } from '@mui/material'
import { useHealthCheck, useWorkouts, useCurrentUser } from '../../hooks/useApi'
import { useAuth } from '../../contexts/AuthContext'

export default function ApiTest() {
  const { user, isAuthenticated } = useAuth()
  const healthCheck = useHealthCheck()
  const workouts = useWorkouts()
  const currentUser = useCurrentUser()

  useEffect(() => {
    // Test health check (no auth required)
    healthCheck.execute()
  }, [])

  const testAuthenticatedEndpoints = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate first!')
      return
    }

    // Test authenticated endpoints
    await Promise.all([
      workouts.execute(),
      currentUser.execute()
    ])
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 API Integration Test
      </Typography>

      <Stack spacing={3}>
        {/* Auth Status */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🔐 Authentication Status
          </Typography>
          <Typography>
            Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}
          </Typography>
          {user && (
            <Typography>
              User: {user.email || user.id}
            </Typography>
          )}
        </Paper>

        {/* Health Check */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ❤️ Backend Health Check
          </Typography>
          {healthCheck.loading && <CircularProgress size={20} />}
          {healthCheck.error && (
            <Alert severity="error">Error: {healthCheck.error}</Alert>
          )}
          {healthCheck.data && (
            <Alert severity="success">
              Backend: {JSON.stringify(healthCheck.data, null, 2)}
            </Alert>
          )}
          <Button 
            variant="outlined" 
            onClick={() => healthCheck.execute()}
            sx={{ mt: 1 }}
          >
            Test Health
          </Button>
        </Paper>

        {/* Authenticated Endpoints */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🔒 Authenticated Endpoints
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={testAuthenticatedEndpoints}
            disabled={!isAuthenticated}
            sx={{ mb: 2 }}
          >
            Test Authenticated APIs
          </Button>

          {/* Workouts */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Workouts:</Typography>
            {workouts.loading && <CircularProgress size={20} />}
            {workouts.error && (
              <Alert severity="error">Error: {workouts.error}</Alert>
            )}
            {workouts.data && (
              <Alert severity="success">
                Workouts: {JSON.stringify(workouts.data, null, 2)}
              </Alert>
            )}
          </Box>

          {/* Current User */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Current User (Backend):</Typography>
            {currentUser.loading && <CircularProgress size={20} />}
            {currentUser.error && (
              <Alert severity="error">Error: {currentUser.error}</Alert>
            )}
            {currentUser.data && (
              <Alert severity="success">
                User: {JSON.stringify(currentUser.data, null, 2)}
              </Alert>
            )}
          </Box>
        </Paper>
      </Stack>
    </Box>
  )
}
