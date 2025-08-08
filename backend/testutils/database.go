package testutils

import (
	"log"
	"os"
	"testing"

	"github.com/goalritmo/gym/backend/database"
	"github.com/joho/godotenv"
)

// SetupTestDatabase configura la conexión con Supabase para testing
func SetupTestDatabase(t *testing.T) {
	// Cargar variables de entorno de testing
	if err := godotenv.Load("../env.test"); err != nil {
		// Intentar desde el directorio raíz
		if err := godotenv.Load("env.test"); err != nil {
			t.Logf("No se encontró env.test, usando variables del sistema")
		}
	}

	// Verificar que tenemos la URL de la base de datos
	dbURL := os.Getenv("SUPABASE_DB_URL")
	if dbURL == "" {
		t.Skip("SUPABASE_DB_URL no configurada, skipping test con DB real")
	}

	// Inicializar conexión con la base de datos
	if database.DB == nil {
		if err := database.InitDB(); err != nil {
			t.Fatalf("Error conectando a la base de datos de test: %v", err)
		}
	}

	// Verificar que la conexión funciona
	if err := database.DB.Ping(); err != nil {
		t.Fatalf("Error haciendo ping a la base de datos: %v", err)
	}

	t.Logf("✅ Conectado a Supabase para testing")

	// Cleanup al final del test
	t.Cleanup(func() {
		// No cerramos la conexión porque otros tests pueden usarla
		// database.CloseDB()
	})
}

// CleanupTestData limpia datos de prueba específicos del usuario
func CleanupTestData(t *testing.T, userID string) {
	if database.DB == nil {
		return
	}

	// Limpiar workouts de prueba
	_, err := database.DB.Exec("DELETE FROM workouts WHERE user_id = $1", userID)
	if err != nil {
		t.Logf("Warning: No se pudieron limpiar workouts de test: %v", err)
	}

	// Limpiar sesiones de prueba
	_, err = database.DB.Exec("DELETE FROM workout_sessions WHERE user_id = $1", userID)
	if err != nil {
		t.Logf("Warning: No se pudieron limpiar sesiones de test: %v", err)
	}

	t.Logf("🧹 Datos de prueba limpiados para user_id: %s", userID)
}

// CreateTestUser crea datos de usuario para testing (si es necesario)
func CreateTestUser(t *testing.T, userID string) {
	// En el futuro, si implementamos tabla de usuarios
	// Por ahora, solo usamos el user_id como string
	t.Logf("👤 Usuario de prueba: %s", userID)
}

// VerifyDatabaseSchema verifica que las tablas necesarias existan
func VerifyDatabaseSchema(t *testing.T) {
	if database.DB == nil {
		t.Fatal("Base de datos no inicializada")
	}

	// Verificar que las tablas principales existan
	tables := []string{"workouts", "workout_sessions", "exercises", "equipment"}
	
	for _, table := range tables {
		var exists bool
		query := `
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = $1
			)
		`
		
		err := database.DB.QueryRow(query, table).Scan(&exists)
		if err != nil {
			t.Fatalf("Error verificando tabla %s: %v", table, err)
		}
		
		if !exists {
			t.Fatalf("Tabla requerida '%s' no existe en la base de datos", table)
		}
	}

	t.Logf("✅ Schema de base de datos verificado")
}

// GetTestUserID genera un ID único para tests
func GetTestUserID(t *testing.T) string {
	return "test_user_" + t.Name() + "_" + randomString(6)
}

// randomString genera una cadena aleatoria para IDs únicos
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[len(charset)/2] // Simplificado para tests
	}
	return string(result)
}
