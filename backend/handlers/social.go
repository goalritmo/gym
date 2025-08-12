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
		fmt.Printf("Error: user_id no encontrado en contexto\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Por ahora, asumir que la funcionalidad social está habilitada para todos
	// En el futuro, esto se verificará contra la tabla user_settings

	// Obtener la fecha de hoy en la zona horaria local
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		loc = time.FixedZone("UTC-3", -3*60*60)
	}
	today := time.Now().In(loc).Format("2006-01-02")

	fmt.Printf("Consultando entrenamientos sociales para fecha: %s, usuario: %s\n", today, userID)

	// Query para obtener entrenamientos sociales del día
	query := `
		SELECT 
			ws.id as session_id,
			ws.user_id,
			COALESCE(up.name, 'Usuario') as user_name,
			COALESCE(up.avatar_url, '') as user_avatar_url,
			ws.created_at as workout_date,
			COALESCE(COUNT(DISTINCT w.exercise_id), 0) as total_exercises,
			COALESCE(COUNT(w.id), 0) as total_series,
			COALESCE(
				json_agg(
					json_build_object(
						'exercise_name', e.name,
						'weight', w.weight,
						'reps', w.reps,
						'seconds', w.seconds,
						'serie', w.serie
					) ORDER BY w.serie
				) FILTER (WHERE w.id IS NOT NULL),
				'[]'::json
			) as exercises
		FROM workout_sessions ws
		LEFT JOIN user_profiles up ON ws.user_id = up.user_id
		LEFT JOIN workouts w ON ws.id = w.exercise_session_id
		LEFT JOIN exercises e ON w.exercise_id = e.id
		WHERE DATE(ws.created_at) = $1
		AND ws.user_id != $2
		GROUP BY ws.id, ws.user_id, ws.created_at, up.name, up.avatar_url
		ORDER BY ws.created_at DESC
	`

	fmt.Printf("Ejecutando query con parámetros: fecha=%s, userID=%s\n", today, userID)
	
	rows, err := database.DB.Query(query, today, userID)
	if err != nil {
		fmt.Printf("Error consultando entrenamientos sociales: %v\n", err)
		http.Error(w, "Error consultando entrenamientos sociales", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query ejecutada exitosamente, procesando resultados...\n")

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

	fmt.Printf("Encontrados %d entrenamientos sociales\n", len(socialWorkouts))
	json.NewEncoder(w).Encode(socialWorkouts)
}

// DebugHandler es un endpoint temporal para debug
func DebugHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Listar todas las tablas disponibles
	var allTables []string
	rows, err := database.DB.Query(`
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		ORDER BY table_name
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var tableName string
			if err := rows.Scan(&tableName); err == nil {
				allTables = append(allTables, tableName)
			}
		}
	}

	// Verificar si las tablas existen
	tables := []string{"workout_sessions", "workouts", "exercises", "users", "auth.users", "public.users"}
	tableInfo := make(map[string]interface{})

	for _, table := range tables {
		var count int
		err := database.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM %s", table)).Scan(&count)
		if err != nil {
			tableInfo[table] = map[string]interface{}{
				"exists": false,
				"error":  err.Error(),
			}
		} else {
			tableInfo[table] = map[string]interface{}{
				"exists": true,
				"count":  count,
			}
		}
	}

	// Verificar estructura de workout_sessions
	var sessionColumns []string
	rows, err = database.DB.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'workout_sessions' 
		ORDER BY ordinal_position
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var colName, dataType string
			if err := rows.Scan(&colName, &dataType); err == nil {
				sessionColumns = append(sessionColumns, fmt.Sprintf("%s (%s)", colName, dataType))
			}
		}
	}

	// Verificar estructura de workouts
	var workoutColumns []string
	rows2, err := database.DB.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'workouts' 
		ORDER BY ordinal_position
	`)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var colName, dataType string
			if err := rows2.Scan(&colName, &dataType); err == nil {
				workoutColumns = append(workoutColumns, fmt.Sprintf("%s (%s)", colName, dataType))
			}
		}
	}

	response := map[string]interface{}{
		"all_tables": allTables,
		"tables": tableInfo,
		"workout_sessions_columns": sessionColumns,
		"workouts_columns": workoutColumns,
	}

	json.NewEncoder(w).Encode(response)
}
