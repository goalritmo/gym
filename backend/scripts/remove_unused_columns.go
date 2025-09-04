package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Cargar variables de entorno
	supabaseURL := os.Getenv("SUPABASE_DB_URL")
	if supabaseURL == "" {
		log.Fatal("SUPABASE_DB_URL no está configurada")
	}

	// Conectar a la base de datos
	db, err := sql.Open("postgres", supabaseURL)
	if err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	defer db.Close()

	// Verificar conexión
	if err = db.Ping(); err != nil {
		log.Fatalf("Error haciendo ping a la base de datos: %v", err)
	}

	fmt.Println("✅ Conexión a la base de datos establecida")

	// Verificar estructura actual de la tabla
	fmt.Println("🔍 Verificando estructura actual de user_settings...")
	rows, err := db.Query(`
		SELECT column_name, data_type, is_nullable 
		FROM information_schema.columns 
		WHERE table_name = 'user_settings' 
		ORDER BY ordinal_position
	`)
	if err != nil {
		log.Fatalf("Error consultando estructura de la tabla: %v", err)
	}
	defer rows.Close()

	fmt.Println("Columnas actuales en user_settings:")
	for rows.Next() {
		var columnName, dataType, isNullable string
		err := rows.Scan(&columnName, &dataType, &isNullable)
		if err != nil {
			log.Fatalf("Error escaneando columna: %v", err)
		}
		fmt.Printf("  - %s (%s, nullable: %s)\n", columnName, dataType, isNullable)
	}

	// Eliminar columnas no utilizadas
	columnsToRemove := []string{
		"unc_notifications_enabled",
		"show_routines_tab",
		"show_own_workouts_in_social",
	}

	for _, column := range columnsToRemove {
		fmt.Printf("🗑️  Eliminando columna: %s\n", column)
		
		// Verificar si la columna existe antes de eliminarla
		var exists bool
		checkQuery := `
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'user_settings' AND column_name = $1
			)
		`
		err := db.QueryRow(checkQuery, column).Scan(&exists)
		if err != nil {
			log.Printf("⚠️  Error verificando existencia de columna %s: %v\n", column, err)
			continue
		}

		if !exists {
			fmt.Printf("ℹ️  La columna %s ya no existe\n", column)
			continue
		}

		// Eliminar la columna
		dropQuery := fmt.Sprintf("ALTER TABLE user_settings DROP COLUMN IF EXISTS %s", column)
		_, err = db.Exec(dropQuery)
		if err != nil {
			log.Printf("⚠️  Error eliminando columna %s: %v\n", column, err)
		} else {
			fmt.Printf("✅ Columna %s eliminada exitosamente\n", column)
		}
	}

	// Verificar estructura final
	fmt.Println("\n🔍 Verificando estructura final de user_settings...")
	rows, err = db.Query(`
		SELECT column_name, data_type, is_nullable 
		FROM information_schema.columns 
		WHERE table_name = 'user_settings' 
		ORDER BY ordinal_position
	`)
	if err != nil {
		log.Fatalf("Error consultando estructura final: %v", err)
	}
	defer rows.Close()

	fmt.Println("Columnas finales en user_settings:")
	for rows.Next() {
		var columnName, dataType, isNullable string
		err := rows.Scan(&columnName, &dataType, &isNullable)
		if err != nil {
			log.Fatalf("Error escaneando columna: %v", err)
		}
		fmt.Printf("  - %s (%s, nullable: %s)\n", columnName, dataType, isNullable)
	}

	fmt.Println("\n✅ Migración completada")
}
