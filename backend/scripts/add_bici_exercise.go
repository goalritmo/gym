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

	// Verificar si Bici ya existe
	var count int
	checkQuery := `SELECT COUNT(*) FROM exercises WHERE name = 'Bici'`
	err = db.QueryRow(checkQuery).Scan(&count)
	if err != nil {
		log.Fatalf("Error verificando si Bici existe: %v", err)
	}

	if count > 0 {
		fmt.Println("✅ Bici ya existe en la base de datos")
		return
	}

	// Insertar Bici
	insertQuery := `
		INSERT INTO exercises (name, bodyweight, is_sport) 
		VALUES ('Bici', false, false)
		RETURNING id
	`

	var biciID int
	err = db.QueryRow(insertQuery).Scan(&biciID)
	if err != nil {
		log.Fatalf("Error insertando Bici: %v", err)
	}

	fmt.Printf("✅ Bici agregado exitosamente con ID: %d\n", biciID)

	// Verificar que se insertó correctamente
	var name string
	var bodyweight, isSport bool
	verifyQuery := `SELECT name, bodyweight, is_sport FROM exercises WHERE id = $1`
	err = db.QueryRow(verifyQuery, biciID).Scan(&name, &bodyweight, &isSport)
	if err != nil {
		log.Fatalf("Error verificando Bici: %v", err)
	}

	fmt.Printf("✅ Bici verificado: name=%s, bodyweight=%t, is_sport=%t\n", name, bodyweight, isSport)
}
