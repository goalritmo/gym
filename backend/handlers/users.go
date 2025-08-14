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
	IsAdmin  bool                   `json:"is_admin"`
}

// GetCurrentUserHandler obtiene el usuario actual desde Supabase Auth
func GetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Consultar información básica del usuario desde auth.users y user_profiles
	query := `
		SELECT 
			u.id,
			u.email,
			COALESCE(u.raw_user_meta_data, '{}')::jsonb as user_metadata,
			u.role,
			COALESCE(up.is_admin, false) as is_admin
		FROM auth.users u
		LEFT JOIN user_profiles up ON u.id = up.user_id
		WHERE u.id = $1
	`

	var user SupabaseUser
	var userMetadataJSON []byte

	err := database.DB.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&userMetadataJSON,
		&user.Role,
		&user.IsAdmin,
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

// AdminUser representa información de usuario para el panel de administrador
type AdminUser struct {
	ID        string  `json:"id"`
	Email     *string `json:"email"`
	Name      *string `json:"name"`
	IsAdmin   bool    `json:"is_admin"`
	CreatedAt string  `json:"created_at"`
	LastLogin *string `json:"last_login"`
}

// GetAdminUsersHandler obtiene todos los usuarios para el panel de administrador
func GetAdminUsersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Consultar todos los usuarios con información básica
	query := `
		SELECT 
			u.id,
			u.email,
			COALESCE(up.name, 'Sin nombre') as name,
			COALESCE(up.is_admin, false) as is_admin,
			u.created_at,
			u.last_sign_in_at
		FROM auth.users u
		LEFT JOIN user_profiles up ON u.id = up.user_id
		WHERE u.email_confirmed_at IS NOT NULL
		ORDER BY u.created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "Error obteniendo usuarios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []AdminUser
	for rows.Next() {
		var user AdminUser
		var lastSignInAt *string
		
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&user.IsAdmin,
			&user.CreatedAt,
			&lastSignInAt,
		)
		
		if err != nil {
			continue // Saltar usuarios con errores
		}
		
		// Formatear last_login
		if lastSignInAt != nil {
			user.LastLogin = lastSignInAt
		}
		
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error procesando usuarios", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(users)
}