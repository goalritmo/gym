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
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AdminExercise representa un ejercicio para el panel de admin
type AdminExercise struct {
	ID               int       `json:"id"`
	Name             string    `json:"name"`
	MuscleGroup      string    `json:"muscle_group"`
	Equipment        string    `json:"equipment"`
	PrimaryMuscles   []string  `json:"primary_muscles"`
	SecondaryMuscles []string  `json:"secondary_muscles"`
	VideoURL         *string   `json:"video_url"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CreateNotificationRequest representa la solicitud para crear una notificación
type CreateNotificationRequest struct {
	Title    string `json:"title"`
	Message  string `json:"message"`
	Type     string `json:"type"`
}

// CreateExerciseRequest representa la solicitud para crear un ejercicio
type CreateExerciseRequest struct {
	Name             string   `json:"name"`
	MuscleGroup      string   `json:"muscle_group"`
	Equipment        string   `json:"equipment"`
	PrimaryMuscles   []string `json:"primary_muscles"`
	SecondaryMuscles []string `json:"secondary_muscles"`
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

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Error iniciando transacción", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// 1. Crear la notificación del sistema
	adminQuery := `
		INSERT INTO admin_notifications (title, message, type)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`

	var notification AdminNotification
	err = tx.QueryRow(adminQuery, req.Title, req.Message, req.Type).Scan(
		&notification.ID,
		&notification.CreatedAt,
		&notification.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Error creando notificación del sistema", http.StatusInternalServerError)
		return
	}

	// 2. Obtener todos los usuarios activos
	usersQuery := `SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL`
	userRows, err := tx.Query(usersQuery)
	if err != nil {
		http.Error(w, "Error obteniendo usuarios", http.StatusInternalServerError)
		return
	}
	defer userRows.Close()

	var userIDs []string
	for userRows.Next() {
		var userID string
		if err := userRows.Scan(&userID); err != nil {
			continue
		}
		userIDs = append(userIDs, userID)
	}

	// 3. Crear notificaciones individuales para cada usuario
	if len(userIDs) > 0 {
		// Preparar datos para la notificación
		notificationData := map[string]interface{}{
			"admin_notification_id": notification.ID,
			"type":                  req.Type,
		}
		dataJSON, _ := json.Marshal(notificationData)

		// Crear notificaciones en lote
		userNotificationsQuery := `
			INSERT INTO notifications (user_id, type, title, message, data, is_read)
			VALUES ($1, $2, $3, $4, $5, false)
		`

		stmt, err := tx.Prepare(userNotificationsQuery)
		if err != nil {
			http.Error(w, "Error preparando notificaciones de usuarios", http.StatusInternalServerError)
			return
		}
		defer stmt.Close()

		for _, userID := range userIDs {
			_, err = stmt.Exec(userID, "announcement", req.Title, req.Message, string(dataJSON))
			if err != nil {
				fmt.Printf("Error creando notificación para usuario %s: %v\n", userID, err)
				// Continuar con otros usuarios aunque falle uno
			}
		}
	}

	// Confirmar transacción
	if err := tx.Commit(); err != nil {
		http.Error(w, "Error confirmando transacción", http.StatusInternalServerError)
		return
	}

	notification.Title = req.Title
	notification.Message = req.Message
	notification.Type = req.Type

	fmt.Printf("Notificación del sistema creada con ID %d para %d usuarios\n", notification.ID, len(userIDs))

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(notification)
}

// GetAdminExercisesHandler obtiene todos los ejercicios para el panel de admin
func GetAdminExercisesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := `
		SELECT 
			id, name, muscle_group, equipment, primary_muscles, secondary_muscles,
			video_url, is_active, created_at, updated_at
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
		
		err := rows.Scan(
			&exercise.ID,
			&exercise.Name,
			&exercise.MuscleGroup,
			&exercise.Equipment,
			&exercise.PrimaryMuscles,
			&exercise.SecondaryMuscles,
			&exercise.VideoURL,
			&exercise.IsActive,
			&exercise.CreatedAt,
			&exercise.UpdatedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando ejercicio", http.StatusInternalServerError)
			return
		}

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

	query := `
		INSERT INTO exercises (name, muscle_group, equipment, primary_muscles, secondary_muscles, video_url)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	var exercise AdminExercise
	err := database.DB.QueryRow(query, 
		req.Name, 
		req.MuscleGroup, 
		req.Equipment, 
		req.PrimaryMuscles,
		req.SecondaryMuscles,
		req.VideoURL,
	).Scan(&exercise.ID, &exercise.CreatedAt, &exercise.UpdatedAt)

	if err != nil {
		http.Error(w, fmt.Sprintf("Error creando ejercicio: %v", err), http.StatusInternalServerError)
		return
	}

	exercise.Name = req.Name
	exercise.MuscleGroup = req.MuscleGroup
	exercise.Equipment = req.Equipment
	exercise.PrimaryMuscles = req.PrimaryMuscles
	exercise.SecondaryMuscles = req.SecondaryMuscles
	exercise.VideoURL = req.VideoURL
	exercise.IsActive = true

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(exercise)
}
