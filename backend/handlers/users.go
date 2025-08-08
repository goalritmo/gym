package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/goalritmo/gym/backend/database"
)

// SupabaseUser representa información básica del usuario de Supabase Auth
type SupabaseUser struct {
	ID       string                 `json:"id"`
	Email    *string                `json:"email"`
	Metadata map[string]interface{} `json:"user_metadata"`
	Role     string                 `json:"role"`
}

// GetCurrentUserHandler obtiene el usuario actual desde Supabase Auth
func GetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Consultar información básica del usuario desde auth.users
	query := `
		SELECT 
			id,
			email,
			COALESCE(raw_user_meta_data, '{}')::jsonb as user_metadata,
			role
		FROM auth.users
		WHERE id = $1
	`

	var user SupabaseUser
	var userMetadataJSON []byte

	err := database.DB.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&userMetadataJSON,
		&user.Role,
	)

	if err != nil {
		http.Error(w, "Usuario no encontrado", http.StatusNotFound)
		return
	}

	// Parsear metadata JSON
	if len(userMetadataJSON) > 0 {
		json.Unmarshal(userMetadataJSON, &user.Metadata)
	}

	json.NewEncoder(w).Encode(user)
}

// GetUserStatsHandler obtiene estadísticas del usuario actual
func GetUserStatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Consultar estadísticas del usuario
	query := `
		SELECT 
			COUNT(DISTINCT w.id) as total_workouts,
			COUNT(DISTINCT ws.id) as total_sessions,
			COUNT(DISTINCT DATE(w.created_at)) as workout_days,
			COALESCE(AVG(ws.effort), 0) as avg_effort,
			COALESCE(AVG(ws.mood), 0) as avg_mood
		FROM workouts w
		FULL OUTER JOIN workout_sessions ws ON ws.user_id = w.user_id 
			AND DATE(ws.session_date) = DATE(w.created_at)
		WHERE w.user_id = $1 OR ws.user_id = $1
	`

	type UserStats struct {
		TotalWorkouts int     `json:"total_workouts"`
		TotalSessions int     `json:"total_sessions"`
		WorkoutDays   int     `json:"workout_days"`
		AvgEffort     float64 `json:"avg_effort"`
		AvgMood       float64 `json:"avg_mood"`
	}

	var stats UserStats
	err := database.DB.QueryRow(query, userID).Scan(
		&stats.TotalWorkouts,
		&stats.TotalSessions,
		&stats.WorkoutDays,
		&stats.AvgEffort,
		&stats.AvgMood,
	)

	if err != nil {
		http.Error(w, "Error obteniendo estadísticas", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(stats)
}