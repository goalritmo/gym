import { useState, useCallback } from 'react'
import { apiClient } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const { isAuthenticated } = useAuth()

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, error: 'No authenticated' }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await apiFunction(...args)
      setState({ data: result, loading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({ data: null, loading: false, error: errorMessage })
      return null
    }
  }, [apiFunction, isAuthenticated])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { ...state, execute, reset }
}

// Convenience hooks for common API operations
export function useWorkouts() {
  return useApi(() => apiClient.getWorkouts())
}

export function useCreateWorkout() {
  return useApi((workout: any) => apiClient.createWorkout(workout))
}

export function useUpdateWorkout() {
  return useApi((id: number, workout: any) => apiClient.updateWorkout(id, workout))
}

export function useDeleteWorkout() {
  return useApi((id: number) => apiClient.deleteWorkout(id))
}

export function useWorkoutSessions() {
  return useApi(() => apiClient.getWorkoutSessions())
}

export function useCreateWorkoutSession() {
  return useApi((session: any) => apiClient.createWorkoutSession(session))
}

export function useExercises() {
  return useApi(() => apiClient.getExercises())
}

export function useEquipment() {
  return useApi(() => apiClient.getEquipment())
}

export function useCurrentUser() {
  return useApi(() => apiClient.getCurrentUser())
}

export function useUserStats() {
  return useApi(() => apiClient.getUserStats())
}

export function useHealthCheck() {
  return useApi(() => apiClient.health())
}
