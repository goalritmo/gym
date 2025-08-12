package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
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

	// Obtener parámetros de paginación
	limit := 10
	offset := 0
	
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	fmt.Printf("Consultando entrenamientos sociales con límite: %d, offset: %d, usuario: %s\n", limit, offset, userID)

	// Query para obtener todos los entrenamientos con paginación
	query := `
		SELECT 
			ws.id as session_id,
			ws.user_id,
			COALESCE(up.name, 'Usuario') as user_name,
			COALESCE(up.avatar_url, '') as user_avatar_url,
			ws.created_at as workout_date,
			COALESCE(COUNT(DISTINCT w.exercise_id), 0) as total_exercises,
			COALESCE(COUNT(w.id), 0) as total_series,
			'[]'::json as exercises
		FROM workout_sessions ws
		LEFT JOIN user_profiles up ON ws.user_id = up.user_id
		LEFT JOIN workouts w ON w.exercise_session_id = '00000000-0000-0000-0000-' || LPAD(ws.id::text, 12, '0')
		WHERE ws.user_id != $1
		GROUP BY ws.id, ws.user_id, ws.created_at, up.name, up.avatar_url
		ORDER BY ws.created_at DESC
		LIMIT $2 OFFSET $3
	`

	fmt.Printf("Query: %s\n", query)
	fmt.Printf("Ejecutando query con parámetros: userID=%s, limit=%d, offset=%d\n", userID, limit, offset)
	
	rows, err := database.DB.Query(query, userID, limit, offset)
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
		
		var workoutDate time.Time
		err := rows.Scan(
			&workout.ID,
			&workout.UserID,
			&workout.UserName,
			&workout.UserAvatarURL,
			&workoutDate,
			&workout.TotalExercises,
			&workout.TotalSeries,
			&exercisesJSON,
		)
		if err != nil {
			fmt.Printf("Error escaneando entrenamiento social: %v\n", err)
			continue
		}

		// Convertir fecha a zona horaria de Argentina
		workout.Date = convertToArgentinaTime(workoutDate).Format(time.RFC3339)

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

	// Verificar datos de user_profiles
	var userProfiles []map[string]interface{}
	profileRows, err := database.DB.Query(`
		SELECT user_id, name, avatar_url, created_at 
		FROM user_profiles 
		ORDER BY created_at DESC
	`)
	if err == nil {
		defer profileRows.Close()
		for profileRows.Next() {
			var userID, name, avatarURL, createdAt string
			if err := profileRows.Scan(&userID, &name, &avatarURL, &createdAt); err == nil {
				userProfiles = append(userProfiles, map[string]interface{}{
					"user_id": userID,
					"name": name,
					"avatar_url": avatarURL,
					"created_at": createdAt,
				})
			}
		}
	}
	
	response := map[string]interface{}{
		"all_tables": allTables,
		"tables": tableInfo,
		"workout_sessions_columns": sessionColumns,
		"workouts_columns": workoutColumns,
		"user_profiles": userProfiles,
	}

	json.NewEncoder(w).Encode(response)
}
