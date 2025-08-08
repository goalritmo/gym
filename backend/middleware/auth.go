package middleware

import (
	"context"
	"net/http"
	"strings"
)

// AuthMiddleware valida el código de acceso "salud"
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Permitir preflight requests
		if r.Method == "OPTIONS" {
			next.ServeHTTP(w, r)
			return
		}

		// Permitir health check sin autenticación
		if strings.HasSuffix(r.URL.Path, "/health") {
			next.ServeHTTP(w, r)
			return
		}

		// Obtener código de autorización del header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header requerido", http.StatusUnauthorized)
			return
		}

		// Verificar formato "Bearer <code>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Formato de autorización inválido", http.StatusUnauthorized)
			return
		}

		code := parts[1]
		if code != "salud" {
			http.Error(w, "Código de acceso inválido", http.StatusUnauthorized)
			return
		}

		// Agregar user_id al contexto (simulado para MVP)
		ctx := context.WithValue(r.Context(), "user_id", "user_mock_id")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
