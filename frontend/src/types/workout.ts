export type Workout = {
  id: number
  exercise_name: string
  weight: number
  reps: number
  serie: number | null
  seconds: number | null
  observations: string | null
  exercise_session_id: number
  created_at: string
}

export type WorkoutSession = {
  id: number
  session_date: string
  session_name: string
  effort: number
  mood: number
  created_at: string
}

export type WorkoutDay = {
  date: string
  session: WorkoutSession
  workouts: Workout[]
  exerciseGroups: ExerciseGroup[]
}

export type ExerciseGroup = {
  exerciseName: string
  workouts: Workout[]
}

import type { TabType } from '../constants/tabs'

export type WorkoutHistoryProps = {
  workoutSessions: WorkoutSession[]
  workouts: Workout[]
  onDelete: (id: number) => void
  onUpdateSession: (sessionId: number, updates: Partial<WorkoutSession>) => void
  onTabChange?: (tab: TabType) => void
}
