package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// AdminNotification representa una notificación del administrador
type AdminNotification struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Message     string    `json:"message"`
	Type        string    `json:"type"` // 'info', 'warning', 'success', 'error'
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AdminExercise representa un ejercicio para el panel de admin
type AdminExercise struct {
	ID               int      `json:"id"`
	Name             string   `json:"name"`
	MuscleGroup      string   `json:"muscle_group"`
	PrimaryMuscles   []string `json:"primary_muscles"`
	SecondaryMuscles []string `json:"secondary_muscles"`
	Equipment        string   `json:"equipment"`
	VideoURL         *string  `json:"video_url"`
	IsActive         bool     `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CreateNotificationRequest representa la solicitud para crear una notificación
type CreateNotificationRequest struct {
	Title    string `json:"title"`
	Message  string `json:"message"`
	Type     string `json:"type"`
	IsActive bool   `json:"is_active"`
}

// CreateExerciseRequest representa la solicitud para crear un ejercicio
type CreateExerciseRequest struct {
	Name             string   `json:"name"`
	MuscleGroup      string   `json:"muscle_group"`
	PrimaryMuscles   []string `json:"primary_muscles"`
	SecondaryMuscles []string `json:"secondary_muscles"`
	Equipment        string   `json:"equipment"`
	VideoURL         *string  `json:"video_url"`
}

// Middleware para verificar si el usuario es administrador
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value("user_id").(string)
		if !ok || userID == "" {
			http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
			return
		}

		// Verificar si el usuario es administrador
		var isAdmin bool
		query := `SELECT COALESCE(is_admin, false) FROM user_profiles WHERE user_id = $1`
		err := database.DB.QueryRow(query, userID).Scan(&isAdmin)
		if err != nil {
			// Si no existe el perfil, crear uno por defecto (no admin)
			_, err = database.DB.Exec(`INSERT INTO user_profiles (user_id, is_admin) VALUES ($1, false) ON CONFLICT (user_id) DO NOTHING`, userID)
			if err != nil {
				http.Error(w, "Error verificando permisos de administrador", http.StatusInternalServerError)
				return
			}
			isAdmin = false
		}

		if !isAdmin {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// GetAdminNotificationsHandler obtiene todas las notificaciones del administrador
func GetAdminNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := `
		SELECT 
			id, title, message, type, is_active, created_at, updated_at
		FROM admin_notifications
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "Error obteniendo notificaciones", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var notifications []AdminNotification
	for rows.Next() {
		var notification AdminNotification
		err := rows.Scan(
			&notification.ID,
			&notification.Title,
			&notification.Message,
			&notification.Type,
			&notification.IsActive,
			&notification.CreatedAt,
			&notification.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando notificación", http.StatusInternalServerError)
			return
		}
		notifications = append(notifications, notification)
	}

	json.NewEncoder(w).Encode(notifications)
}

// CreateNotificationHandler crea una nueva notificación del administrador
func CreateNotificationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req CreateNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error decodificando solicitud", http.StatusBadRequest)
		return
	}

	// Validar campos requeridos
	if req.Title == "" || req.Message == "" {
		http.Error(w, "Título y mensaje son requeridos", http.StatusBadRequest)
		return
	}

	// Validar tipo de notificación
	validTypes := map[string]bool{"info": true, "warning": true, "success": true, "error": true}
	if !validTypes[req.Type] {
		req.Type = "info" // Valor por defecto
	}

	query := `
		INSERT INTO admin_notifications (title, message, type, is_active)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`

	var notification AdminNotification
	err := database.DB.QueryRow(query, req.Title, req.Message, req.Type, req.IsActive).Scan(
		&notification.ID,
		&notification.CreatedAt,
		&notification.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Error creando notificación", http.StatusInternalServerError)
		return
	}

	notification.Title = req.Title
	notification.Message = req.Message
	notification.Type = req.Type
	notification.IsActive = req.IsActive

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(notification)
}

// GetAdminExercisesHandler obtiene todos los ejercicios para el panel de admin
func GetAdminExercisesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := `
		SELECT 
			id, name, muscle_group, primary_muscles, secondary_muscles, 
			equipment, video_url, created_at, updated_at
		FROM exercises
		ORDER BY name ASC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "Error obteniendo ejercicios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var exercises []AdminExercise
	for rows.Next() {
		var exercise AdminExercise
		var primaryMusclesJSON, secondaryMusclesJSON []byte
		
		err := rows.Scan(
			&exercise.ID,
			&exercise.Name,
			&exercise.MuscleGroup,
			&primaryMusclesJSON,
			&secondaryMusclesJSON,
			&exercise.Equipment,
			&exercise.VideoURL,
			&exercise.CreatedAt,
			&exercise.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando ejercicio", http.StatusInternalServerError)
			return
		}

		// Parsear arrays JSON
		json.Unmarshal(primaryMusclesJSON, &exercise.PrimaryMuscles)
		json.Unmarshal(secondaryMusclesJSON, &exercise.SecondaryMuscles)
		exercise.IsActive = true // Por defecto todos los ejercicios están activos

		exercises = append(exercises, exercise)
	}

	json.NewEncoder(w).Encode(exercises)
}

// CreateExerciseHandler crea un nuevo ejercicio
func CreateExerciseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req CreateExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error decodificando solicitud", http.StatusBadRequest)
		return
	}

	// Validar campos requeridos
	if req.Name == "" || req.MuscleGroup == "" || req.Equipment == "" {
		http.Error(w, "Nombre, grupo muscular y equipo son requeridos", http.StatusBadRequest)
		return
	}

	// Convertir arrays a JSON
	primaryMusclesJSON, _ := json.Marshal(req.PrimaryMuscles)
	secondaryMusclesJSON, _ := json.Marshal(req.SecondaryMuscles)

	query := `
		INSERT INTO exercises (name, muscle_group, primary_muscles, secondary_muscles, equipment, video_url)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	var exercise AdminExercise
	err := database.DB.QueryRow(query, 
		req.Name, 
		req.MuscleGroup, 
		primaryMusclesJSON, 
		secondaryMusclesJSON, 
		req.Equipment, 
		req.VideoURL,
	).Scan(&exercise.ID, &exercise.CreatedAt, &exercise.UpdatedAt)

	if err != nil {
		http.Error(w, fmt.Sprintf("Error creando ejercicio: %v", err), http.StatusInternalServerError)
		return
	}

	exercise.Name = req.Name
	exercise.MuscleGroup = req.MuscleGroup
	exercise.PrimaryMuscles = req.PrimaryMuscles
	exercise.SecondaryMuscles = req.SecondaryMuscles
	exercise.Equipment = req.Equipment
	exercise.VideoURL = req.VideoURL
	exercise.IsActive = true

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(exercise)
}
