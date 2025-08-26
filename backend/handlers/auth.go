package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// UpdateLastSignInHandler actualiza el last_sign_in_at del usuario
func UpdateLastSignInHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Actualizar last_sign_in_at
	_, err := database.DB.Exec("UPDATE auth.users SET last_sign_in_at = $1 WHERE id = $2", time.Now(), userID)
	if err != nil {
		http.Error(w, "Error actualizando último acceso", http.StatusInternalServerError)
		return
	}

	// Crear notificaciones individuales para el usuario si no existen
	err = createUserNotifications(userID)
	if err != nil {
		// No fallar si hay error creando notificaciones, solo log
		fmt.Printf("Error creando notificaciones para usuario %s: %v\n", userID, err)
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Last sign in updated"})
}

// createUserNotifications crea notificaciones individuales para el usuario basadas en admin_notifications de los últimos 10 días
func createUserNotifications(userID string) error {
	// Obtener admin_notifications de los últimos 10 días que no tienen notificaciones individuales para este usuario
	query := `
		SELECT an.id, an.title, an.message, an.type
		FROM admin_notifications an
		WHERE an.created_at >= NOW() - INTERVAL '10 days'
		AND NOT EXISTS (
			SELECT 1 FROM notifications n 
			WHERE n.user_id = $1 
			AND n.data::jsonb->>'admin_notification_id' = an.id::text
		)
		ORDER BY an.created_at DESC
	`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		return fmt.Errorf("error consultando admin_notifications: %v", err)
	}
	defer rows.Close()

	var createdCount int
	for rows.Next() {
		var adminID int
		var title, message, notificationType string

		err := rows.Scan(&adminID, &title, &message, &notificationType)
		if err != nil {
			fmt.Printf("Error escaneando admin_notification: %v\n", err)
			continue
		}

		// Preparar datos para la notificación
		notificationData := map[string]interface{}{
			"admin_notification_id": adminID,
			"type":                  notificationType,
		}
		dataJSON, _ := json.Marshal(notificationData)

		// Crear notificación individual
		_, err = database.DB.Exec(`
			INSERT INTO notifications (user_id, type, title, message, data, is_read)
			VALUES ($1, $2, $3, $4, $5, false)
		`, userID, "announcement", title, message, string(dataJSON))

		if err != nil {
			fmt.Printf("Error creando notificación individual para admin_notification %d: %v\n", adminID, err)
		} else {
			createdCount++
		}
	}

	if createdCount > 0 {
		fmt.Printf("Creadas %d notificaciones individuales para usuario %s\n", createdCount, userID)
	}

	return nil
}
