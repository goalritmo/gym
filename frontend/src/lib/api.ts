import { supabase } from './supabase'

const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3210'
  // Asegurar que siempre termine con /api
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
}

const API_BASE_URL = getApiBaseUrl()

interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  requireAuth?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No auth session found')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  private async request<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true
    } = config

    const url = `${this.baseUrl}${endpoint}`
    
    let requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    }

    // Add auth headers if required
    if (requireAuth) {
      try {
        const authHeaders = await this.getAuthHeaders()
        requestHeaders = { ...requestHeaders, ...authHeaders }
      } catch (error) {
        throw new Error('Authentication required')
      }
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    }

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, requestConfig)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return {} as T
      }
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error)
      throw error
    }
  }

  // Health check (no auth required)
  async health() {
    return this.request('/health', { requireAuth: false })
  }

  // Workouts API
  async getWorkouts() {
    return this.request('/workouts')
  }

  async createWorkout(workout: any) {
    return this.request('/workouts', {
      method: 'POST',
      body: workout
    })
  }

  async updateWorkout(id: number, workout: any) {
    return this.request(`/workouts/${id}`, {
      method: 'PUT',
      body: workout
    })
  }

  async deleteWorkout(id: number) {
    return this.request(`/workouts/${id}`, {
      method: 'DELETE'
    })
  }

  // Workout Sessions API
  async getWorkoutSessions() {
    return this.request('/workout-sessions')
  }

  async createWorkoutSession(session: any) {
    return this.request('/workout-sessions', {
      method: 'POST',
      body: session
    })
  }

  async updateWorkoutSession(id: number, session: any) {
    return this.request(`/workout-sessions/${id}`, {
      method: 'PUT',
      body: session
    })
  }

  // Exercises API
  async getExercises() {
    return this.request('/exercises')
  }

  async getExercise(id: number) {
    return this.request(`/exercises/${id}`)
  }

  // Equipment API
  async getEquipment() {
    return this.request('/equipment')
  }

  async getEquipmentById(id: number) {
    return this.request(`/equipment/${id}`)
  }

  // User API
  async getCurrentUser() {
    return this.request('/me')
  }

  async getUserStats() {
    return this.request('/me/stats')
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export types for use in components
export type { ApiRequestConfig }