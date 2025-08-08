package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// SupabaseAuthMiddleware valida JWT tokens de Supabase
func SupabaseAuthMiddleware(next http.Handler) http.Handler {
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

		// Obtener token JWT del header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header requerido", http.StatusUnauthorized)
			return
		}

		// Verificar formato "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Formato de autorización inválido", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Para desarrollo/testing, permitir token "salud"
		if tokenString == "salud" {
			ctx := context.WithValue(r.Context(), "user_id", "00000000-0000-0000-0000-000000000001")
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// Validar JWT de Supabase
		userID, err := validateSupabaseJWT(tokenString)
		if err != nil {
			http.Error(w, fmt.Sprintf("Token inválido: %v", err), http.StatusUnauthorized)
			return
		}

		// Agregar user_id al contexto
		ctx := context.WithValue(r.Context(), "user_id", userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// validateSupabaseJWT valida un JWT token de Supabase usando JWT Signing Keys
func validateSupabaseJWT(tokenString string) (string, error) {
	// Con los nuevos JWT Signing Keys, necesitamos hacer validación más robusta
	// Por ahora, para desarrollo, seguimos soportando el JWT secret legacy
	
	// Primero intentar con JWT secret (legacy/desarrollo)
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret != "" {
		userID, err := validateWithSecret(tokenString, jwtSecret)
		if err == nil {
			return userID, nil
		}
	}

	// En producción, deberías implementar JWKS (JSON Web Key Set) validation
	// Para ahora, retornamos un error explicativo
	return "", fmt.Errorf("JWT validation failed - considera configurar JWKS para producción")
}

// validateWithSecret valida JWT con secret (legacy/desarrollo)
func validateWithSecret(tokenString, secret string) (string, error) {
	// Parsear y validar el token con secret
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verificar que el método de firma sea el esperado
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return "", err
	}

	// Verificar que el token sea válido
	if !token.Valid {
		return "", fmt.Errorf("token inválido")
	}

	// Extraer claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("claims inválidos")
	}

	// Verificar expiración
	if exp, ok := claims["exp"].(float64); ok {
		if time.Now().Unix() > int64(exp) {
			return "", fmt.Errorf("token expirado")
		}
	}

	// Extraer user_id (sub claim)
	if sub, ok := claims["sub"].(string); ok {
		return sub, nil
	}

	return "", fmt.Errorf("user_id no encontrado en token")
}

// GetUserInfoFromSupabase obtiene información del usuario desde Supabase Auth
func GetUserInfoFromSupabase(userID string) (*SupabaseUser, error) {
	// Esta función haría una llamada a la API de Supabase Auth
	// Por ahora, retornamos información básica
	return &SupabaseUser{
		ID:    userID,
		Email: "", // Se obtendría de Supabase
	}, nil
}

// SupabaseUser representa la información básica del usuario de Supabase
type SupabaseUser struct {
	ID       string          `json:"id"`
	Email    string          `json:"email"`
	Metadata json.RawMessage `json:"user_metadata"`
	AppData  json.RawMessage `json:"app_metadata"`
}
