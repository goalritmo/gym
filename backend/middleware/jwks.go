package middleware

import (
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWKS representa un JSON Web Key Set
type JWKS struct {
	Keys []JWK `json:"keys"`
}

// JWK representa una JSON Web Key
type JWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
	X5c []string `json:"x5c"`
}

// jwksCache almacena las claves en caché
var jwksCache *JWKS
var jwksCacheTime time.Time

// validateSupabaseJWTWithJWKS valida un JWT usando JWKS de Supabase
func validateSupabaseJWTWithJWKS(tokenString string) (string, error) {
	// Obtener JWKS de Supabase
	jwks, err := getSupabaseJWKS()
	if err != nil {
		return "", fmt.Errorf("error obteniendo JWKS: %v", err)
	}

	// Parsear el token para obtener el kid (key ID)
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verificar que use RS256 (RSA)
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
		}

		// Obtener kid del header
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid no encontrado en token header")
		}

		// Buscar la clave pública correspondiente
		publicKey, err := getPublicKeyFromJWKS(jwks, kid)
		if err != nil {
			return nil, fmt.Errorf("error obteniendo clave pública: %v", err)
		}

		return publicKey, nil
	})

	if err != nil {
		return "", err
	}

	if !token.Valid {
		return "", fmt.Errorf("token inválido")
	}

	// Extraer claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("claims inválidos")
	}

	// Verificar issuer
	if iss, ok := claims["iss"].(string); ok {
		supabaseURL := os.Getenv("SUPABASE_URL")
		expectedIss := fmt.Sprintf("%s/auth/v1", supabaseURL)
		if iss != expectedIss {
			return "", fmt.Errorf("issuer inválido: %s", iss)
		}
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

// getSupabaseJWKS obtiene las claves JWKS de Supabase
func getSupabaseJWKS() (*JWKS, error) {
	// Usar caché si es reciente (5 minutos)
	if jwksCache != nil && time.Since(jwksCacheTime) < 5*time.Minute {
		return jwksCache, nil
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL no configurado")
	}

	jwksURL := fmt.Sprintf("%s/auth/v1/jwks", supabaseURL)

	// Hacer request HTTP
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("error haciendo request a JWKS: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("JWKS endpoint retornó status %d", resp.StatusCode)
	}

	// Leer respuesta
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error leyendo respuesta JWKS: %v", err)
	}

	// Parsear JSON
	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("error parseando JWKS JSON: %v", err)
	}

	// Actualizar caché
	jwksCache = &jwks
	jwksCacheTime = time.Now()

	return &jwks, nil
}

// getPublicKeyFromJWKS extrae la clave pública RSA del JWKS
func getPublicKeyFromJWKS(jwks *JWKS, kid string) (*rsa.PublicKey, error) {
	// Buscar la clave con el kid correspondiente
	for _, key := range jwks.Keys {
		if key.Kid == kid {
			// Por simplicidad, esta función está simplificada
			// En una implementación completa, necesitarías convertir
			// los valores N y E del JWK a una clave RSA pública
			return nil, fmt.Errorf("conversión JWK a RSA no implementada - usar JWT secret para desarrollo")
		}
	}

	return nil, fmt.Errorf("clave con kid %s no encontrada", kid)
}

// validateSupabaseJWTModern es la función principal que maneja ambos métodos
func validateSupabaseJWTModern(tokenString string) (string, error) {
	// Para desarrollo, intentar primero con JWT secret
	if jwtSecret := os.Getenv("SUPABASE_JWT_SECRET"); jwtSecret != "" {
		userID, err := validateWithSecret(tokenString, jwtSecret)
		if err == nil {
			return userID, nil
		}
	}

	// Para producción, usar JWKS
	// Nota: La implementación completa de JWKS requiere más trabajo
	// Por ahora, retornamos un mensaje informativo
	return "", fmt.Errorf("JWKS validation no implementada completamente - usar SUPABASE_JWT_SECRET para desarrollo")
}
