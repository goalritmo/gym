package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// SocialWorkout representa un entrenamiento para la vista social
type SocialWorkout struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	UserName      string    `json:"user_name"`
	UserAvatarURL string    `json:"user_avatar_url"`
	Date          string    `json:"date"`
	TotalExercises int      `json:"total_exercises"`
	TotalSeries   int       `json:"total_series"`
	Exercises     []SocialExercise `json:"exercises"`
	Likes         int       `json:"likes"`
	IsLiked       bool      `json:"is_liked"`
}

// SocialExercise representa un ejercicio en la vista social
type SocialExercise struct {
	ExerciseName string  `json:"exercise_name"`
	Weight       float64 `json:"weight"`
	Reps         int     `json:"reps"`
	Seconds      *int    `json:"seconds"`
	Serie        int     `json:"serie"`
}

// GetSocialWorkoutsHandler obtiene entrenamientos sociales de todos los usuarios
func GetSocialWorkoutsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Verificar si el usuario tiene habilitada la funcionalidad social
	var socialEnabled bool
	err := database.DB.QueryRow(`
		SELECT social_enabled FROM user_settings WHERE user_id = $1
	`, userID).Scan(&socialEnabled)
	
	if err != nil {
		// Si no existe configuración, asumir que está habilitado por defecto
		socialEnabled = true
	}

	if !socialEnabled {
		http.Error(w, "Social functionality is disabled for this user", http.StatusForbidden)
		return
	}

	// Obtener la fecha de hoy en la zona horaria local
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		loc = time.FixedZone("UTC-3", -3*60*60)
	}
	today := time.Now().In(loc).Format("2006-01-02")

	// Query para obtener entrenamientos sociales del día
	query := `
		SELECT 
			ws.id as session_id,
			ws.user_id,
			u.name as user_name,
			u.avatar_url as user_avatar_url,
			DATE(ws.created_at) as workout_date,
			COUNT(DISTINCT w.exercise_id) as total_exercises,
			COUNT(w.id) as total_series,
			json_agg(
				json_build_object(
					'exercise_name', e.name,
					'weight', w.weight,
					'reps', w.reps,
					'seconds', w.seconds,
					'serie', w.serie
				) ORDER BY w.serie
			) as exercises
		FROM workout_sessions ws
		JOIN workouts w ON ws.id = w.exercise_session_id
		JOIN exercises e ON w.exercise_id = e.id
		JOIN users u ON ws.user_id = u.id
		JOIN user_settings us ON ws.user_id = us.user_id
		WHERE DATE(ws.created_at) = $1
		AND us.social_enabled = true
		AND ws.user_id != $2
		GROUP BY ws.id, ws.user_id, u.name, u.avatar_url, DATE(ws.created_at)
		ORDER BY ws.created_at DESC
	`

	rows, err := database.DB.Query(query, today, userID)
	if err != nil {
		fmt.Printf("Error consultando entrenamientos sociales: %v\n", err)
		http.Error(w, "Error consultando entrenamientos sociales", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var socialWorkouts []SocialWorkout
	for rows.Next() {
		var workout SocialWorkout
		var exercisesJSON string
		
		err := rows.Scan(
			&workout.ID,
			&workout.UserID,
			&workout.UserName,
			&workout.UserAvatarURL,
			&workout.Date,
			&workout.TotalExercises,
			&workout.TotalSeries,
			&exercisesJSON,
		)
		if err != nil {
			fmt.Printf("Error escaneando entrenamiento social: %v\n", err)
			continue
		}

		// Parsear el JSON de ejercicios
		if err := json.Unmarshal([]byte(exercisesJSON), &workout.Exercises); err != nil {
			fmt.Printf("Error parseando ejercicios: %v\n", err)
			continue
		}

		// Por ahora, likes y isLiked son mock data
		workout.Likes = 0
		workout.IsLiked = false

		socialWorkouts = append(socialWorkouts, workout)
	}

	json.NewEncoder(w).Encode(socialWorkouts)
}
