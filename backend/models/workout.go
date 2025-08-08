package models

import (
	"time"
)

// Workout representa una serie individual de ejercicio
type Workout struct {
	ID                int       `json:"id" db:"id"`
	UserID            string    `json:"user_id" db:"user_id"`
	ExerciseID        int       `json:"exercise_id" db:"exercise_id"`
	ExerciseName      string    `json:"exercise_name" db:"exercise_name"`
	Weight            float64   `json:"weight" db:"weight"`
	Reps              int       `json:"reps" db:"reps"`
	Serie             *int      `json:"serie" db:"serie"`
	Seconds           *int      `json:"seconds" db:"seconds"`
	Observations      *string   `json:"observations" db:"observations"`
	ExerciseSessionID string    `json:"exercise_session_id" db:"exercise_session_id"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

// WorkoutSession representa una sesión de entrenamiento completa
type WorkoutSession struct {
	ID             int       `json:"id" db:"id"`
	UserID         string    `json:"user_id" db:"user_id"`
	SessionDate    time.Time `json:"session_date" db:"session_date"`
	SessionName    string    `json:"session_name" db:"session_name"`
	TotalExercises int       `json:"total_exercises" db:"total_exercises"`
	Effort         int       `json:"effort" db:"effort"`
	Mood           int       `json:"mood" db:"mood"`
	Notes          *string   `json:"notes" db:"notes"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// CreateWorkoutRequest representa la estructura para crear un workout
type CreateWorkoutRequest struct {
	ExerciseID   int     `json:"exercise_id" validate:"required"`
	Weight       float64 `json:"weight" validate:"required,gt=0"`
	Reps         int     `json:"reps" validate:"required,gt=0"`
	Serie        *int    `json:"serie" validate:"omitempty,gt=0"`
	Seconds      *int    `json:"seconds" validate:"omitempty,gt=0"`
	Observations *string `json:"observations"`
}

// CreateWorkoutSessionRequest representa la estructura para crear una sesión
type CreateWorkoutSessionRequest struct {
	SessionDate time.Time `json:"session_date" validate:"required"`
	SessionName string    `json:"session_name"`
	Notes       *string   `json:"notes"`
}

// UpdateWorkoutSessionRequest representa la estructura para actualizar una sesión
type UpdateWorkoutSessionRequest struct {
	Effort *int    `json:"effort" validate:"omitempty,gte=0,lte=3"`
	Mood   *int    `json:"mood" validate:"omitempty,gte=0,lte=3"`
	Notes  *string `json:"notes"`
}
