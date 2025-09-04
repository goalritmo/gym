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

	// Buscar Bici
	var id int
	var name string
	var bodyweight, isSport bool
	query := `SELECT id, name, bodyweight, is_sport FROM exercises WHERE name = 'Bici'`
	err = db.QueryRow(query).Scan(&id, &name, &bodyweight, &isSport)
	if err != nil {
		log.Fatalf("Error buscando Bici: %v", err)
	}

	fmt.Printf("✅ Bici encontrado: ID=%d, name=%s, bodyweight=%t, is_sport=%t\n", id, name, bodyweight, isSport)

	// Actualizar Bici con emoji
	updateQuery := `UPDATE exercises SET name = '🚴 Bici' WHERE id = $1`
	_, err = db.Exec(updateQuery, id)
	if err != nil {
		log.Fatalf("Error actualizando Bici: %v", err)
	}

	fmt.Printf("✅ Bici actualizado con emoji: 🚴 Bici\n")

	// Verificar la actualización
	var updatedName string
	verifyQuery := `SELECT name FROM exercises WHERE id = $1`
	err = db.QueryRow(verifyQuery, id).Scan(&updatedName)
	if err != nil {
		log.Fatalf("Error verificando Bici actualizado: %v", err)
	}

	fmt.Printf("✅ Bici verificado: %s\n", updatedName)
}
