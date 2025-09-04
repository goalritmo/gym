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

	// Buscar todos los ejercicios que contengan "bici" o "running"
	query := `SELECT id, name, bodyweight, is_sport FROM exercises WHERE LOWER(name) LIKE '%bici%' OR LOWER(name) LIKE '%running%' ORDER BY id`
	rows, err := db.Query(query)
	if err != nil {
		log.Fatalf("Error consultando ejercicios: %v", err)
	}
	defer rows.Close()

	fmt.Println("🔍 Ejercicios encontrados:")
	for rows.Next() {
		var id int
		var name string
		var bodyweight, isSport bool
		err := rows.Scan(&id, &name, &bodyweight, &isSport)
		if err != nil {
			log.Fatalf("Error escaneando ejercicio: %v", err)
		}
		fmt.Printf("  ID: %d, Name: %s, Bodyweight: %t, IsSport: %t\n", id, name, bodyweight, isSport)
	}
}
