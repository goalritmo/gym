<!-- Resumen breve del plan. Para versión completa ver archivo original si aplica. -->

# Plan Técnico (Resumen)

## Infraestructura
- Supabase: tablas `equipment`, `exercises`, `workouts`, `muscle_groups`, `exercise_muscle_groups` y enums.
- RLS: definir más adelante según permisos de lectura/escritura.

## Backend (Go, REST)
- Endpoints: `GET/POST /api/workouts`, `GET /api/exercises`, `GET /api/equipment`, `GET /api/health`.
- Middleware: auth con código "salud", CORS, logging.
- TDD: tests de handlers, middleware y validaciones con stdlib.

## Frontend (React + Vite)
- Pestañas: Registro, Cronómetro, Ejercicios, Notificaciones.
- TDD (Vitest + RTL): componentes (`LoginComponent`, `WorkoutForm`, `TimerComponent`, `ExerciseList`, `EquipmentDetail`), hooks e integración.

## CI/CD
- GitHub Actions: instalar deps, correr tests, build.
- Despliegue: Vercel (FE), Railway/Render (BE).

## Métricas
- Cobertura: FE >80%, BE >85%.
- Performance: API <500ms, carga <3s.


