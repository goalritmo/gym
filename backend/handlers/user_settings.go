package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"github.com/goalritmo/gym/backend/database"
)

type UserSettings struct {
	ShowOwnWorkoutsInSocial bool `json:"show_own_workouts_in_social"`
	UncNotificationsEnabled bool `json:"unc_notifications_enabled"`
	ShowRoutinesTab         bool `json:"show_routines_tab"`
}

// GetUserSettingsHandler obtiene las configuraciones del usuario
func GetUserSettingsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Intentar obtener configuraciones existentes
	var settings UserSettings
	query := `
		SELECT show_own_workouts_in_social, unc_notifications_enabled, show_routines_tab
		FROM user_settings
		WHERE user_id = $1
	`
	
	err := database.DB.QueryRow(query, userID).Scan(
		&settings.ShowOwnWorkoutsInSocial,
		&settings.UncNotificationsEnabled,
		&settings.ShowRoutinesTab,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Si no existen configuraciones, crear con valores por defecto
			settings = UserSettings{
				ShowOwnWorkoutsInSocial: true,
				UncNotificationsEnabled: true,
				ShowRoutinesTab:         false,
			}
			
			insertQuery := `
				INSERT INTO user_settings (user_id, show_own_workouts_in_social, unc_notifications_enabled, show_routines_tab)
				VALUES ($1, $2, $3, $4)
			`
			_, err = database.DB.Exec(insertQuery, userID, settings.ShowOwnWorkoutsInSocial, settings.UncNotificationsEnabled, settings.ShowRoutinesTab)
			if err != nil {
				fmt.Printf("Error creando configuraciones por defecto: %v\n", err)
				http.Error(w, "Error creando configuraciones", http.StatusInternalServerError)
				return
			}
		} else {
			fmt.Printf("Error consultando configuraciones: %v\n", err)
			http.Error(w, "Error consultando configuraciones", http.StatusInternalServerError)
			return
		}
	}

	json.NewEncoder(w).Encode(settings)
}

// UpdateUserSettingsHandler actualiza las configuraciones del usuario
func UpdateUserSettingsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var settings UserSettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Upsert: insertar si no existe, actualizar si existe
	query := `
		INSERT INTO user_settings (user_id, show_own_workouts_in_social, unc_notifications_enabled, show_routines_tab)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) 
		DO UPDATE SET 
			show_own_workouts_in_social = EXCLUDED.show_own_workouts_in_social,
			unc_notifications_enabled = EXCLUDED.unc_notifications_enabled,
			show_routines_tab = EXCLUDED.show_routines_tab,
			updated_at = NOW()
	`

	_, err := database.DB.Exec(query, userID, settings.ShowOwnWorkoutsInSocial, settings.UncNotificationsEnabled, settings.ShowRoutinesTab)
	if err != nil {
		fmt.Printf("Error actualizando configuraciones: %v\n", err)
		http.Error(w, "Error actualizando configuraciones", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Configuraciones actualizadas"})
}
