package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"github.com/goalritmo/gym/backend/database"
)

type UserSettings struct {
	HasConfiguredFavorites  bool    `json:"has_configured_favorites"`
	FavoriteExercises       []int   `json:"favorite_exercises"`
}

// GetUserSettingsHandler obtiene las configuraciones del usuario
func GetUserSettingsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	fmt.Printf("🔍 GetUserSettingsHandler called for user: %s\n", userID)

	// Intentar obtener configuraciones existentes
	var settings UserSettings
	query := `
		SELECT has_configured_favorites, favorite_exercises
		FROM user_settings
		WHERE user_id = $1
	`
	
	err := database.DB.QueryRow(query, userID).Scan(
		&settings.HasConfiguredFavorites,
		&settings.FavoriteExercises,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Si no existen configuraciones, crear con valores por defecto
			fmt.Printf("🔍 No existing settings found for user %s, creating defaults\n", userID)
			settings = UserSettings{
				HasConfiguredFavorites:  false,
				FavoriteExercises:       []int{},
			}
			
			insertQuery := `
				INSERT INTO user_settings (user_id, has_configured_favorites, favorite_exercises)
				VALUES ($1, $2, $3)
			`
			_, err = database.DB.Exec(insertQuery, userID, settings.HasConfiguredFavorites, settings.FavoriteExercises)
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
	} else {
		fmt.Printf("🔍 Found existing settings for user %s: %+v\n", userID, settings)
	}

	fmt.Printf("🔍 Returning settings for user %s: %+v\n", userID, settings)
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

	fmt.Printf("🔍 UpdateUserSettingsHandler called for user: %s\n", userID)

	var settings UserSettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	fmt.Printf("🔍 Updating settings for user %s: %+v\n", userID, settings)

	// Upsert: insertar si no existe, actualizar si existe
	query := `
		INSERT INTO user_settings (user_id, has_configured_favorites, favorite_exercises)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id) 
		DO UPDATE SET 
			has_configured_favorites = EXCLUDED.has_configured_favorites,
			favorite_exercises = EXCLUDED.favorite_exercises,
			updated_at = NOW()
	`

	_, err := database.DB.Exec(query, userID, settings.HasConfiguredFavorites, settings.FavoriteExercises)
	if err != nil {
		fmt.Printf("Error actualizando configuraciones: %v\n", err)
		http.Error(w, "Error actualizando configuraciones", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Configuraciones actualizadas"})
}
