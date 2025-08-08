package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/models"
)

// GetWorkoutsHandler obtiene la lista de workouts
func GetWorkoutsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := r.Context().Value("user_id").(string)

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

	userID := r.Context().Value("user_id").(string)

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
	err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM exercises WHERE id = $1)", req.ExerciseID).Scan(&exerciseExists)
	if err != nil || !exerciseExists {
		http.Error(w, "Ejercicio no encontrado", http.StatusBadRequest)
		return
	}

	// Insertar workout
	query := `
		INSERT INTO workouts (user_id, exercise_id, weight, reps, serie, seconds, observations, exercise_session_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, gen_random_uuid())
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

	err = database.DB.QueryRow(
		query,
		userID, req.ExerciseID, req.Weight, req.Reps,
		req.Serie, req.Seconds, req.Observations,
	).Scan(&workout.ID, &workout.ExerciseSessionID, &workout.CreatedAt)

	if err != nil {
		http.Error(w, "Error creando workout", http.StatusInternalServerError)
		return
	}

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

	userID := r.Context().Value("user_id").(string)

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

	userID := r.Context().Value("user_id").(string)

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

	userID := r.Context().Value("user_id").(string)

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

	userID := r.Context().Value("user_id").(string)

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

	userID := r.Context().Value("user_id").(string)

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
