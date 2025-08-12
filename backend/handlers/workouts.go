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

// convertToArgentinaTime convierte una fecha UTC a la zona horaria de Argentina
func convertToArgentinaTime(utcTime time.Time) time.Time {
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		// Fallback a UTC-3 si no se puede cargar la zona horaria
		loc = time.FixedZone("UTC-3", -3*60*60)
	}
	return utcTime.In(loc)
}

// GetWorkoutsHandler obtiene la lista de workouts
func GetWorkoutsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id no encontrado en contexto en GetWorkoutsHandler\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Obtener parámetros de query
	date := r.URL.Query().Get("date")
	exerciseSessionID := r.URL.Query().Get("exercise_session_id")

	fmt.Printf("Consultando workouts para usuario: %s, fecha: %s, sessionID: %s\n", userID, date, exerciseSessionID)

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

	fmt.Printf("Ejecutando query con %d parámetros\n", len(args))

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		fmt.Printf("Error consultando workouts: %v\n", err)
		http.Error(w, "Error consultando workouts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query ejecutada exitosamente, procesando resultados...\n")

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
			fmt.Printf("Error escaneando workout: %v\n", err)
			http.Error(w, "Error escaneando workout", http.StatusInternalServerError)
			return
		}
		
		// Convertir fecha a zona horaria de Argentina
		workout.CreatedAt = convertToArgentinaTime(workout.CreatedAt)
		
		workouts = append(workouts, workout)
	}

	fmt.Printf("Encontrados %d workouts\n", len(workouts))
	json.NewEncoder(w).Encode(workouts)
}

// CreateWorkoutHandler crea un nuevo workout
func CreateWorkoutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id no encontrado en contexto en CreateWorkoutHandler\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	fmt.Printf("Creando workout para usuario: %s\n", userID)

	var req models.CreateWorkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("Error decodificando JSON: %v\n", err)
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	fmt.Printf("Datos del workout: exercise_id=%d, weight=%.2f, reps=%d\n", req.ExerciseID, req.Weight, req.Reps)

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
		fmt.Printf("Error verificando ejercicio: %v\n", err)
		http.Error(w, "Error verificando ejercicio", http.StatusInternalServerError)
		return
	}
	if !exerciseExists {
		fmt.Printf("Ejercicio no encontrado: %d\n", req.ExerciseID)
		http.Error(w, "Ejercicio no encontrado", http.StatusBadRequest)
		return
	}
	fmt.Printf("Ejercicio verificado correctamente\n")

	// Buscar o crear workout_session para hoy (en timezone de Argentina)
	argentinaLocation, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		// Si falla, usar UTC-3 (hora de Argentina) como fallback
		argentinaLocation = time.FixedZone("UTC-3", -3*60*60)
	}
	now := time.Now().In(argentinaLocation)
	today := now.Format("2006-01-02")
	var sessionID int
	
	fmt.Printf("Buscando sesión para fecha: %s\n", today)

	// Verificar si ya existe una sesión para hoy
	sessionQuery := `SELECT id, session_date FROM workout_sessions WHERE user_id = $1 AND DATE(session_date) = $2 LIMIT 1`
	var sessionDate string
	err = database.DB.QueryRow(sessionQuery, userID, today).Scan(&sessionID, &sessionDate)
	
	if err != nil {
		fmt.Printf("No existe sesión para hoy, creando nueva...\n")
		fmt.Printf("Intentando insertar con userID: %s, today: %s\n", userID, today)
		// No existe sesión para hoy, crear una nueva
		createSessionQuery := `
			INSERT INTO workout_sessions (user_id, session_date, session_name, total_exercises, effort, mood) 
			VALUES ($1, $2, $3, 0, 0, 0) 
			RETURNING id
		`
		sessionName := "Entrenamiento del día"
		fmt.Printf("Query: %s\n", createSessionQuery)
		fmt.Printf("Parámetros: userID=%s, today=%s, sessionName=%s\n", userID, today, sessionName)
		err = database.DB.QueryRow(createSessionQuery, userID, today, sessionName).Scan(&sessionID)
		if err != nil {
			fmt.Printf("Error creando sesión de entrenamiento: %v\n", err)
			fmt.Printf("Tipo de error: %T\n", err)
			http.Error(w, "Error creando sesión de entrenamiento", http.StatusInternalServerError)
			return
		}
		fmt.Printf("Sesión creada con ID: %d\n", sessionID)
	} else {
		fmt.Printf("Sesión existente encontrada con ID: %d\n", sessionID)
	}

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
	

	
	// Convertir sessionID (bigint) a formato UUID
	sessionUUID := fmt.Sprintf("00000000-0000-0000-0000-%012d", sessionID)
	fmt.Printf("Insertando workout con sessionID: %d, UUID: %s\n", sessionID, sessionUUID)
	err = database.DB.QueryRow(
		query,
		userID, req.ExerciseID, req.Weight, req.Reps,
		serieValue, secondsValue, req.Observations, sessionUUID,
	).Scan(&workout.ID, &workout.ExerciseSessionID, &workout.CreatedAt)

	if err != nil {
		fmt.Printf("Error creando workout: %v\n", err)
		http.Error(w, "Error creando workout", http.StatusInternalServerError)
		return
	}
	
	fmt.Printf("Workout creado exitosamente con ID: %d\n", workout.ID)

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

	// Primero verificar que el workout existe y pertenece al usuario
	var workoutExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM workouts WHERE id = $1 AND user_id = $2)", id, userID).Scan(&workoutExists)
	if err != nil {
		fmt.Printf("Error verificando workout %d: %v\n", id, err)
		http.Error(w, "Error verificando workout", http.StatusInternalServerError)
		return
	}
	
	fmt.Printf("Workout %d existe: %v\n", id, workoutExists)
	
	if !workoutExists {
		fmt.Printf("Workout %d no encontrado para usuario %s\n", id, userID)
		http.Error(w, "Workout no encontrado", http.StatusNotFound)
		return
	}

	result, err := database.DB.Exec("DELETE FROM workouts WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		fmt.Printf("Error eliminando workout %d: %v\n", id, err)
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
		fmt.Printf("Error: user_id no encontrado en contexto en GetWorkoutSessionsHandler\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	fmt.Printf("Consultando sesiones de entrenamiento para usuario: %s\n", userID)

	query := `
		SELECT id, user_id, session_date, session_name, total_exercises, 
			   effort, mood, notes, created_at, updated_at
		FROM workout_sessions
		WHERE user_id = $1
		ORDER BY session_date DESC
	`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		fmt.Printf("Error consultando sesiones: %v\n", err)
		http.Error(w, "Error consultando sesiones", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query ejecutada exitosamente, procesando resultados...\n")

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
			fmt.Printf("Error escaneando sesión: %v\n", err)
			http.Error(w, "Error escaneando sesión", http.StatusInternalServerError)
			return
		}
		
		// Convertir fechas a zona horaria de Argentina
		session.SessionDate = convertToArgentinaTime(session.SessionDate)
		session.CreatedAt = convertToArgentinaTime(session.CreatedAt)
		session.UpdatedAt = convertToArgentinaTime(session.UpdatedAt)
		
		sessions = append(sessions, session)
	}

	fmt.Printf("Encontradas %d sesiones de entrenamiento\n", len(sessions))
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

	fmt.Printf("🔍 Intentando actualizar sesión ID: %d, usuario: %s\n", id, userID)

	var req models.UpdateWorkoutSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Construir query dinámicamente
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.SessionName != nil {
		setParts = append(setParts, fmt.Sprintf("session_name = $%d", argIndex))
		args = append(args, *req.SessionName)
		argIndex++
	}

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
