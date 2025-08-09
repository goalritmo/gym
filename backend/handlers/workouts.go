package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/models"
)

// GetWorkoutsHandler obtiene la lista de workouts
func GetWorkoutsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Obtener parámetros de query
	date := r.URL.Query().Get("date")
	exerciseSessionID := r.URL.Query().Get("exercise_session_id")

	query := `
		SELECT w.id, w.user_id, w.exercise_id, e.name as exercise_name, 
			   w.weight, w.reps, w.serie, w.seconds, w.observations, 
			   w.exercise_session_id, w.created_at
		FROM workouts w
		JOIN exercises e ON w.exercise_id = e.id
		WHERE w.user_id = $1
	`
	args := []interface{}{userID}
	argIndex := 2

	if date != "" {
		query += fmt.Sprintf(" AND DATE(w.created_at) = $%d", argIndex)
		args = append(args, date)
		argIndex++
	}

	if exerciseSessionID != "" {
		query += fmt.Sprintf(" AND w.exercise_session_id = $%d", argIndex)
		args = append(args, exerciseSessionID)
		argIndex++
	}

	query += " ORDER BY w.created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Error consultando workouts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var workouts []models.Workout
	for rows.Next() {
		var workout models.Workout
		err := rows.Scan(
			&workout.ID,
			&workout.UserID,
			&workout.ExerciseID,
			&workout.ExerciseName,
			&workout.Weight,
			&workout.Reps,
			&workout.Serie,
			&workout.Seconds,
			&workout.Observations,
			&workout.ExerciseSessionID,
			&workout.CreatedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando workout", http.StatusInternalServerError)
			return
		}
		workouts = append(workouts, workout)
	}

	json.NewEncoder(w).Encode(workouts)
}

// CreateWorkoutHandler crea un nuevo workout
func CreateWorkoutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req models.CreateWorkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}



	// Validaciones básicas
	if req.Weight <= 0 {
		http.Error(w, "El peso debe ser mayor a 0", http.StatusBadRequest)
		return
	}
	if req.Reps <= 0 {
		http.Error(w, "Las repeticiones deben ser mayores a 0", http.StatusBadRequest)
		return
	}

	// Verificar que el ejercicio existe
	var exerciseExists bool
	var err error
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM exercises WHERE id = $1)", req.ExerciseID).Scan(&exerciseExists)
	if err != nil {
		http.Error(w, "Error verificando ejercicio", http.StatusInternalServerError)
		return
	}
	if !exerciseExists {
		http.Error(w, "Ejercicio no encontrado", http.StatusBadRequest)
		return
	}

	// Buscar o crear workout_session para hoy
	today := time.Now().Format("2006-01-02")
	var sessionID int
	
	// Verificar si ya existe una sesión para hoy
	sessionQuery := `SELECT id FROM workout_sessions WHERE user_id = $1 AND DATE(session_date) = $2 LIMIT 1`
	err = database.DB.QueryRow(sessionQuery, userID, today).Scan(&sessionID)
	
	if err != nil {
		// No existe sesión para hoy, crear una nueva
		fmt.Printf("🔄 Creando nueva sesión para usuario %s, fecha %s\n", userID, today)
		createSessionQuery := `
			INSERT INTO workout_sessions (user_id, session_date, session_name, total_exercises, effort, mood) 
			VALUES ($1, $2, $3, 0, 0, 0) 
			RETURNING id
		`
		sessionName := "Entrenamiento del día"
		err = database.DB.QueryRow(createSessionQuery, userID, today, sessionName).Scan(&sessionID)
		if err != nil {
			fmt.Printf("❌ Error creando sesión: %v\n", err)
			http.Error(w, "Error creando sesión de entrenamiento", http.StatusInternalServerError)
			return
		}
		fmt.Printf("✅ Sesión creada con ID: %d\n", sessionID)
	} else {
		fmt.Printf("✅ Sesión existente encontrada con ID: %d\n", sessionID)
	}

	// Generar un UUID único para este workout
	var sessionUUID string
	uuidQuery := `SELECT gen_random_uuid()`
	err = database.DB.QueryRow(uuidQuery).Scan(&sessionUUID)
	if err != nil {
		fmt.Printf("❌ Error generando UUID: %v\n", err)
		http.Error(w, "Error generando identificador único", http.StatusInternalServerError)
		return
	}
	
	fmt.Printf("✅ UUID generado para workout: %s\n", sessionUUID)

	// Insertar workout asociado a la sesión
	query := `
		INSERT INTO workouts (user_id, exercise_id, weight, reps, serie, seconds, observations, exercise_session_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, exercise_session_id, created_at
	`

	var workout models.Workout
	workout.UserID = userID
	workout.ExerciseID = req.ExerciseID
	workout.Weight = req.Weight
	workout.Reps = req.Reps
	workout.Serie = req.Serie
	workout.Seconds = req.Seconds
	workout.Observations = req.Observations

	// Obtener valores de los punteros de forma segura
	var serieValue, secondsValue int
	if req.Serie != nil {
		serieValue = *req.Serie
	}
	if req.Seconds != nil {
		secondsValue = *req.Seconds
	}
	

	
	err = database.DB.QueryRow(
		query,
		userID, req.ExerciseID, req.Weight, req.Reps,
		serieValue, secondsValue, req.Observations, sessionUUID,
	).Scan(&workout.ID, &workout.ExerciseSessionID, &workout.CreatedAt)

	if err != nil {
		fmt.Printf("❌ Error creando workout: %v\n", err)
		fmt.Printf("📋 Datos del workout: userID=%s, exerciseID=%d, sessionUUID=%s\n", userID, req.ExerciseID, sessionUUID)
		http.Error(w, "Error creando workout", http.StatusInternalServerError)
		return
	}
	
	fmt.Printf("✅ Workout creado exitosamente con ID: %d\n", workout.ID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(workout)
}

// UpdateWorkoutHandler actualiza un workout existente
func UpdateWorkoutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req models.CreateWorkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validaciones
	if req.Weight <= 0 || req.Reps <= 0 {
		http.Error(w, "Peso y repeticiones deben ser mayores a 0", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE workouts 
		SET weight = $1, reps = $2, serie = $3, seconds = $4, observations = $5
		WHERE id = $6 AND user_id = $7
		RETURNING id, exercise_id, weight, reps, serie, seconds, observations, exercise_session_id, created_at
	`

	var workout models.Workout
	err = database.DB.QueryRow(
		query,
		req.Weight, req.Reps, req.Serie, req.Seconds, req.Observations,
		id, userID,
	).Scan(
		&workout.ID, &workout.ExerciseID, &workout.Weight, &workout.Reps,
		&workout.Serie, &workout.Seconds, &workout.Observations,
		&workout.ExerciseSessionID, &workout.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Workout no encontrado o error actualizando", http.StatusNotFound)
		return
	}

	workout.UserID = userID
	json.NewEncoder(w).Encode(workout)
}

// DeleteWorkoutHandler elimina un workout
func DeleteWorkoutHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	result, err := database.DB.Exec("DELETE FROM workouts WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		http.Error(w, "Error eliminando workout", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, "Workout no encontrado", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetWorkoutSessionsHandler obtiene la lista de sesiones de entrenamiento
func GetWorkoutSessionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT id, user_id, session_date, session_name, total_exercises, 
			   effort, mood, notes, created_at, updated_at
		FROM workout_sessions
		WHERE user_id = $1
		ORDER BY session_date DESC
	`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		http.Error(w, "Error consultando sesiones", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var sessions []models.WorkoutSession
	for rows.Next() {
		var session models.WorkoutSession
		err := rows.Scan(
			&session.ID,
			&session.UserID,
			&session.SessionDate,
			&session.SessionName,
			&session.TotalExercises,
			&session.Effort,
			&session.Mood,
			&session.Notes,
			&session.CreatedAt,
			&session.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando sesión", http.StatusInternalServerError)
			return
		}
		sessions = append(sessions, session)
	}

	json.NewEncoder(w).Encode(sessions)
}

// CreateWorkoutSessionHandler crea una nueva sesión de entrenamiento
func CreateWorkoutSessionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req models.CreateWorkoutSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.SessionName == "" {
		req.SessionName = "Rutina de Fullbody"
	}

	query := `
		INSERT INTO workout_sessions (user_id, session_date, session_name, notes)
		VALUES ($1, $2, $3, $4)
		RETURNING id, session_date, session_name, total_exercises, effort, mood, notes, created_at, updated_at
	`

	var session models.WorkoutSession
	session.UserID = userID

	err := database.DB.QueryRow(
		query,
		userID, req.SessionDate, req.SessionName, req.Notes,
	).Scan(
		&session.ID, &session.SessionDate, &session.SessionName,
		&session.TotalExercises, &session.Effort, &session.Mood,
		&session.Notes, &session.CreatedAt, &session.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Error creando sesión", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(session)
}

// UpdateWorkoutSessionHandler actualiza una sesión de entrenamiento
func UpdateWorkoutSessionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req models.UpdateWorkoutSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Construir query dinámicamente
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Effort != nil {
		setParts = append(setParts, fmt.Sprintf("effort = $%d", argIndex))
		args = append(args, *req.Effort)
		argIndex++
	}

	if req.Mood != nil {
		setParts = append(setParts, fmt.Sprintf("mood = $%d", argIndex))
		args = append(args, *req.Mood)
		argIndex++
	}

	if req.Notes != nil {
		setParts = append(setParts, fmt.Sprintf("notes = $%d", argIndex))
		args = append(args, *req.Notes)
		argIndex++
	}

	if len(setParts) == 0 {
		http.Error(w, "No hay campos para actualizar", http.StatusBadRequest)
		return
	}

	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	query := fmt.Sprintf(`
		UPDATE workout_sessions 
		SET %s
		WHERE id = $%d AND user_id = $%d
		RETURNING id, session_date, session_name, total_exercises, effort, mood, notes, created_at, updated_at
	`, strings.Join(setParts, ", "), argIndex, argIndex+1)

	args = append(args, id, userID)

	var session models.WorkoutSession
	err = database.DB.QueryRow(query, args...).Scan(
		&session.ID, &session.SessionDate, &session.SessionName,
		&session.TotalExercises, &session.Effort, &session.Mood,
		&session.Notes, &session.CreatedAt, &session.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Sesión no encontrada o error actualizando", http.StatusNotFound)
		return
	}

	session.UserID = userID
	json.NewEncoder(w).Encode(session)
}
