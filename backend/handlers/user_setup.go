package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// UserSetupRequest representa la solicitud para configurar un usuario
type UserSetupRequest struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Name   string `json:"name"`
}

// UserSetupHandler crea los registros necesarios para un usuario recién registrado
func UserSetupHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Verificar que el usuario está autenticado
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Decodificar la solicitud
	var req UserSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verificar que el user_id coincide con el usuario autenticado
	if req.UserID != userID {
		http.Error(w, "Unauthorized: user_id mismatch", http.StatusUnauthorized)
		return
	}

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		fmt.Printf("Error iniciando transacción: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Extraer nombre del email si no se proporciona
	userName := req.Name
	if userName == "" {
		// Extraer nombre del email (parte antes del @)
		userName = extractNameFromEmail(req.Email)
	}

	fmt.Printf("Configurando usuario: %s (%s) con nombre: %s\n", req.UserID, req.Email, userName)

	// 1. Crear perfil de usuario
	_, err = tx.Exec(`
		INSERT INTO user_profiles (user_id, name, is_admin, role)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE SET
			name = EXCLUDED.name,
			is_admin = EXCLUDED.is_admin,
			role = EXCLUDED.role
	`, req.UserID, userName, false, "user")

	if err != nil {
		fmt.Printf("Error creando perfil: %v\n", err)
		http.Error(w, "Error creating user profile", http.StatusInternalServerError)
		return
	}

	// 2. Crear configuración de usuario
	_, err = tx.Exec(`
		INSERT INTO user_settings (user_id, show_own_workouts_in_social, unc_notifications_enabled)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id) DO UPDATE SET
			show_own_workouts_in_social = EXCLUDED.show_own_workouts_in_social,
			unc_notifications_enabled = EXCLUDED.unc_notifications_enabled
	`, req.UserID, true, true)

	if err != nil {
		fmt.Printf("Error creando configuración: %v\n", err)
		http.Error(w, "Error creating user settings", http.StatusInternalServerError)
		return
	}

	// 3. Crear notificación de bienvenida
	_, err = tx.Exec(`
		INSERT INTO notifications (user_id, title, message, type, created_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, type) DO NOTHING
	`, req.UserID, "¡Bienvenido a GoalRitmo!", "Gracias por unirte a nuestra comunidad fitness. ¡Comienza tu viaje hacia una vida más saludable!", "welcome", time.Now())

	if err != nil {
		fmt.Printf("Error creando notificación: %v\n", err)
		// No es crítico si falla la notificación
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		fmt.Printf("Error confirmando transacción: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Usuario configurado exitosamente: %s\n", req.UserID)

	// Responder con éxito
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User setup completed successfully",
		"user_id": req.UserID,
		"name":    userName,
	})
}

// extractNameFromEmail extrae el nombre del email
func extractNameFromEmail(email string) string {
	// Buscar el @ y tomar la parte antes
	for i, char := range email {
		if char == '@' {
			return email[:i]
		}
	}
	return email
}
