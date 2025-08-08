package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthMiddleware_ValidCode(t *testing.T) {
	// Handler de prueba
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verificar que el user_id esté en el contexto
		userID := r.Context().Value("user_id")
		if userID != "user_mock_id" {
			t.Errorf("user_id incorrecto en contexto: got %v want %v", userID, "user_mock_id")
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Crear middleware con handler de prueba
	handler := AuthMiddleware(testHandler)

	// Crear request con código válido
	req, err := http.NewRequest("GET", "/api/workouts", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer salud")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Verificar respuesta exitosa
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler devolvió status code incorrecto: got %v want %v",
			status, http.StatusOK)
	}
}

func TestAuthMiddleware_InvalidCode(t *testing.T) {
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := AuthMiddleware(testHandler)

	req, err := http.NewRequest("GET", "/api/workouts", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer wrong_code")

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Verificar que se rechace el acceso
	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler devolvió status code incorrecto: got %v want %v",
			status, http.StatusUnauthorized)
	}
}

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := AuthMiddleware(testHandler)

	req, err := http.NewRequest("GET", "/api/workouts", nil)
	if err != nil {
		t.Fatal(err)
	}
	// No agregar header de autorización

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Verificar que se rechace el acceso
	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler devolvió status code incorrecto: got %v want %v",
			status, http.StatusUnauthorized)
	}
}

func TestAuthMiddleware_HealthEndpoint(t *testing.T) {
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	handler := AuthMiddleware(testHandler)

	req, err := http.NewRequest("GET", "/api/health", nil)
	if err != nil {
		t.Fatal(err)
	}
	// No agregar header de autorización para health check

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Verificar que el health check pase sin autenticación
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler devolvió status code incorrecto: got %v want %v",
			status, http.StatusOK)
	}
}

func TestAuthMiddleware_OptionsRequest(t *testing.T) {
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := AuthMiddleware(testHandler)

	req, err := http.NewRequest("OPTIONS", "/api/workouts", nil)
	if err != nil {
		t.Fatal(err)
	}
	// No agregar header de autorización para OPTIONS (preflight)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	// Verificar que OPTIONS pase sin autenticación
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler devolvió status code incorrecto: got %v want %v",
			status, http.StatusOK)
	}
}
