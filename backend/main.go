package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/handlers"
	"github.com/goalritmo/gym/backend/middleware"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Inicializar conexión con la base de datos
	if err := database.InitDB(); err != nil {
		log.Fatalf("Error inicializando base de datos: %v", err)
	}
	defer database.CloseDB()

	log.Println("Conexión con base de datos establecida")

	// Crear router
	r := mux.NewRouter()

	// Middleware
	r.Use(middleware.LoggingMiddleware)
	r.Use(middleware.AuthMiddleware)

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Health check
	api.HandleFunc("/health", handlers.HealthHandler).Methods("GET")

	// Workouts endpoints
	api.HandleFunc("/workouts", handlers.GetWorkoutsHandler).Methods("GET")
	api.HandleFunc("/workouts", handlers.CreateWorkoutHandler).Methods("POST")
	api.HandleFunc("/workouts/{id}", handlers.UpdateWorkoutHandler).Methods("PUT")
	api.HandleFunc("/workouts/{id}", handlers.DeleteWorkoutHandler).Methods("DELETE")

	// Workout sessions endpoints
	api.HandleFunc("/workout-sessions", handlers.GetWorkoutSessionsHandler).Methods("GET")
	api.HandleFunc("/workout-sessions", handlers.CreateWorkoutSessionHandler).Methods("POST")
	api.HandleFunc("/workout-sessions/{id}", handlers.UpdateWorkoutSessionHandler).Methods("PUT")

	// Exercises endpoints
	api.HandleFunc("/exercises", handlers.GetExercisesHandler).Methods("GET")
	api.HandleFunc("/exercises/{id}", handlers.GetExerciseHandler).Methods("GET")

	// Equipment endpoints
	api.HandleFunc("/equipment", handlers.GetEquipmentHandler).Methods("GET")
	api.HandleFunc("/equipment/{id}", handlers.GetEquipmentByIdHandler).Methods("GET")

	// Configurar CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Vite y Create React App
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Servidor iniciado en puerto %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
