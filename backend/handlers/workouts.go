package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
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



	query := `
		SELECT w.id, w.user_id, w.workout_day_id, w.exercise_id, e.name as exercise_name, 
			   w.weight, w.reps, w.serie, w.seconds, w.observations, w.created_at
		FROM workouts w
		JOIN exercises e ON w.exercise_id = e.id
		WHERE w.user_id = $1
	`
	args := []interface{}{userID}
	argIndex := 2

	if date != "" {
		// Filtrar por fecha usando la fecha de creación del workout
		query += fmt.Sprintf(" AND DATE(w.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires') = $%d", argIndex)
		args = append(args, date)
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
			&workout.WorkoutDayID,
			&workout.ExerciseID,
			&workout.ExerciseName,
			&workout.Weight,
			&workout.Reps,
			&workout.Serie,
			&workout.Seconds,
			&workout.Observations,
			&workout.CreatedAt,
		)
		if err != nil {
			fmt.Printf("Error escaneando workout: %v\n", err)
			continue
		}

		// Convertir fecha a zona horaria de Argentina
		workout.CreatedAt = convertToArgentinaTime(workout.CreatedAt)
		workouts = append(workouts, workout)
	}

	fmt.Printf("Encontrados %d workouts\n", len(workouts))

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(workouts)
}

// GetWorkoutDaysHandler obtiene la lista de días de entrenamiento
func GetWorkoutDaysHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id no encontrado en contexto en GetWorkoutDaysHandler\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}



	query := `
		SELECT id, user_id, date, name, effort, mood, created_at, updated_at
		FROM workout_days 
		WHERE user_id = $1 
		ORDER BY date DESC
	`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		fmt.Printf("Error consultando días de entrenamiento: %v\n", err)
		http.Error(w, "Error consultando días de entrenamiento", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query ejecutada exitosamente, procesando resultados...\n")

	var workoutDays []models.WorkoutDay
	for rows.Next() {
		var day models.WorkoutDay
		err := rows.Scan(
			&day.ID,
			&day.UserID,
			&day.Date,
			&day.Name,
			&day.Effort,
			&day.Mood,
			&day.CreatedAt,
			&day.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("Error escaneando día de entrenamiento: %v\n", err)
			continue
		}

		// Convertir fechas a zona horaria de Argentina
		day.CreatedAt = convertToArgentinaTime(day.CreatedAt)
		day.UpdatedAt = convertToArgentinaTime(day.UpdatedAt)
		workoutDays = append(workoutDays, day)
	}

	fmt.Printf("Encontrados %d días de entrenamiento\n", len(workoutDays))

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(workoutDays)
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
	// Leer el body completo para debug
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Printf("Error leyendo body: %v\n", err)
		http.Error(w, "Error leyendo request", http.StatusBadRequest)
		return
	}
	
	fmt.Printf("🔍 DEBUG - JSON raw recibido: %s\n", string(bodyBytes))
	
	// Decodificar JSON
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		fmt.Printf("Error decodificando JSON: %v\n", err)
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	fmt.Printf("🔍 DEBUG - Backend recibió: Weight=%v (tipo: %T), Reps=%d\n", req.Weight, req.Weight, req.Reps)
	
	// Validaciones
	if req.Reps <= 0 {
		http.Error(w, "Repeticiones deben ser mayores a 0", http.StatusBadRequest)
		return
	}
	
	// Validar peso si se proporciona
	if req.Weight != nil {
		fmt.Printf("🔍 DEBUG - Weight no es nil, valor: %f\n", *req.Weight)
		if *req.Weight <= 0 {
			http.Error(w, "Peso debe ser mayor a 0 si se proporciona", http.StatusBadRequest)
			return
		}
	} else {
		fmt.Printf("🔍 DEBUG - Weight es nil (correcto)\n")
	}

	// Verificar que el ejercicio existe
	var exerciseExists bool
	err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM exercises WHERE id = $1)", req.ExerciseID).Scan(&exerciseExists)
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

	// Obtener fecha actual en zona horaria de Argentina
	argentinaLocation, err = time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		argentinaLocation = time.FixedZone("UTC-3", -3*60*60)
	}
	now := time.Now().In(argentinaLocation)
	today := now.Format("2006-01-02")

	var workoutDayID int

	fmt.Printf("🔍 DEBUG: Fecha actual en Argentina: %s\n", now.Format("2006-01-02 15:04:05"))
	fmt.Printf("🔍 DEBUG: Buscando día de entrenamiento para fecha: %s, userID: %s\n", today, userID)

	// Verificar si ya existe un día de entrenamiento para hoy
	sessionQuery := `SELECT id FROM workout_days WHERE user_id = $1 AND date = $2`
	var existingID int
	err = database.DB.QueryRow(sessionQuery, userID, today).Scan(&existingID)
	
	if err != nil {
		fmt.Printf("🔍 DEBUG: No existe día de entrenamiento para hoy, creando nuevo... Error: %v\n", err)
		// No existe día de entrenamiento para hoy, crear uno nuevo
		createDayQuery := `
			INSERT INTO workout_days (user_id, date, name, effort, mood) 
			VALUES ($1, $2, $3, 0, 0) 
			RETURNING id
		`
		dayName := "Entrenamiento del día"
		err = database.DB.QueryRow(createDayQuery, userID, today, dayName).Scan(&workoutDayID)
		if err != nil {
			fmt.Printf("Error creando día de entrenamiento: %v\n", err)
			http.Error(w, "Error creando día de entrenamiento", http.StatusInternalServerError)
			return
		}
		fmt.Printf("Día de entrenamiento creado con ID: %d\n", workoutDayID)
	} else {
		workoutDayID = existingID
		fmt.Printf("🔍 DEBUG: Día de entrenamiento existente encontrado con ID: %d\n", workoutDayID)
	}

	// Insertar workout asociado al día de entrenamiento
	query := `
		INSERT INTO workouts (user_id, workout_day_id, exercise_id, weight, reps, serie, seconds, observations)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, workout_day_id, created_at
	`

	var workout models.Workout
	workout.UserID = userID
	workout.WorkoutDayID = workoutDayID
	workout.ExerciseID = req.ExerciseID
	// Manejar peso opcional
	if req.Weight != nil {
		workout.Weight = *req.Weight
	} else {
		workout.Weight = 0 // Valor por defecto cuando no se proporciona peso
	}
	workout.Reps = req.Reps
	workout.Observations = req.Observations

	// Obtener valores de los punteros de forma segura
	var serieValue int = 1
	if req.Serie != nil {
		serieValue = *req.Serie
	}

	// Obtener valor de peso de forma segura
	var weightValue float64 = 0
	if req.Weight != nil {
		weightValue = *req.Weight
	}
	
	fmt.Printf("Insertando workout con workoutDayID: %d, weight: %f\n", workoutDayID, weightValue)
	err = database.DB.QueryRow(
		query,
		userID, workoutDayID, req.ExerciseID, weightValue, req.Reps,
		serieValue, req.Seconds, req.Observations,
	).Scan(&workout.ID, &workout.WorkoutDayID, &workout.CreatedAt)

	if err != nil {
		fmt.Printf("Error creando workout: %v\n", err)
		http.Error(w, "Error creando workout", http.StatusInternalServerError)
		return
	}
	
	// Convertir fecha a zona horaria de Argentina antes de devolver
	workout.CreatedAt = convertToArgentinaTime(workout.CreatedAt)
	
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
	if req.Reps <= 0 {
		http.Error(w, "Repeticiones deben ser mayores a 0", http.StatusBadRequest)
		return
	}
	
	// Validar peso si se proporciona
	if req.Weight != nil && *req.Weight <= 0 {
		http.Error(w, "Peso debe ser mayor a 0 si se proporciona", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE workouts 
		SET weight = $1, reps = $2, serie = $3, seconds = $4, observations = $5
		WHERE id = $6 AND user_id = $7
		RETURNING id, exercise_id, weight, reps, serie, seconds, observations, workout_day_id, created_at
	`

	var serieValue int = 1
	if req.Serie != nil {
		serieValue = *req.Serie
	}

	// Obtener valor de peso de forma segura
	var weightValue float64 = 0
	if req.Weight != nil {
		weightValue = *req.Weight
	}

	var workout models.Workout
	err = database.DB.QueryRow(
		query,
		weightValue, req.Reps, serieValue, req.Seconds, req.Observations,
		id, userID,
	).Scan(
		&workout.ID, &workout.ExerciseID, &workout.Weight, &workout.Reps,
		&workout.Serie, &workout.Seconds, &workout.Observations,
		&workout.WorkoutDayID, &workout.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Workout no encontrado o error actualizando", http.StatusNotFound)
		return
	}

	workout.UserID = userID
	workout.CreatedAt = convertToArgentinaTime(workout.CreatedAt)
	json.NewEncoder(w).Encode(workout)
}

// UpdateWorkoutDayNameHandler actualiza el nombre de un día de entrenamiento
func UpdateWorkoutDayNameHandler(w http.ResponseWriter, r *http.Request) {
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

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validaciones
	if req.Name == "" {
		http.Error(w, "El nombre no puede estar vacío", http.StatusBadRequest)
		return
	}

	if len(req.Name) > 100 {
		http.Error(w, "El nombre no puede tener más de 100 caracteres", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE workout_days 
		SET name = $1
		WHERE id = $2 AND user_id = $3
		RETURNING id, user_id, date, name, effort, mood, created_at
	`

	var workoutDay struct {
		ID        int       `json:"id"`
		UserID    string    `json:"user_id"`
		Date      time.Time `json:"date"`
		Name      string    `json:"name"`
		Effort    *int      `json:"effort"`
		Mood      *int      `json:"mood"`
		CreatedAt time.Time `json:"created_at"`
	}

	err = database.DB.QueryRow(query, req.Name, id, userID).Scan(
		&workoutDay.ID, &workoutDay.UserID, &workoutDay.Date,
		&workoutDay.Name, &workoutDay.Effort, &workoutDay.Mood, &workoutDay.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Día de entrenamiento no encontrado", http.StatusNotFound)
		} else {
			http.Error(w, "Error actualizando el día de entrenamiento", http.StatusInternalServerError)
		}
		return
	}

	workoutDay.CreatedAt = convertToArgentinaTime(workoutDay.CreatedAt)
	json.NewEncoder(w).Encode(workoutDay)
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

	// Verificar que el workout existe y pertenece al usuario
	var workoutExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM workouts WHERE id = $1 AND user_id = $2)", id, userID).Scan(&workoutExists)
	if err != nil {
		http.Error(w, "Error verificando workout", http.StatusInternalServerError)
		return
	}
	if !workoutExists {
		http.Error(w, "Workout no encontrado", http.StatusNotFound)
		return
	}

	// Eliminar el workout
	_, err = database.DB.Exec("DELETE FROM workouts WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		http.Error(w, "Error eliminando workout", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}


