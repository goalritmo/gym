package handlers

import (
	"encoding/json"
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

	json.NewEncoder(w).Encode(map[string]string{"message": "Last sign in updated"})
}
