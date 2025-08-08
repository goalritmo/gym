# Gym App — Registro de Entrenamientos

Aplicación web para registrar entrenamientos (peso, repeticiones, series, tiempo) con soporte de cronómetro, visualización de ejercicios/equipos y enfoque TDD.

> Este proyecto se está construyendo en colaboración con ChatGPT‑5 (asistencia de desarrollo, TDD y documentación).

## Documentación
- Especificaciones funcionales (detalladas): `docs/especificaciones.md`
- Plan técnico (resumen): `docs/plan-tecnico.md`

## Resumen (TL;DR)
- Pestañas: Registro, Cronómetro, Ejercicios, Notificaciones
- DB (Supabase): `equipment`, `exercises`, `workouts`, `muscle_groups`, `exercise_muscle_groups`
- API: REST (Go) con endpoints para workouts, exercises y equipment
- Frontend: React + TypeScript + Vite
- Testing: Vitest + React Testing Library (frontend), Go testing stdlib (backend)
- Autenticación: código "salud" en el frontend (MVP)

## Requisitos
- Node.js 20+ (recomendado 20.19+)
- npm 10+
- Cuenta/proyecto en Supabase

## Estructura
```
.
├── frontend/               # Vite + React + Vitest
├── docs/
│   ├── especificaciones.md
│   └── plan-tecnico.md
└── README.md               # Este archivo
```

## Arranque Rápido (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### Testing (Frontend)
```bash
npm test         # ejecución en CI
npm run test:ui  # interfaz interactiva
npm run test:watch
npm run test:coverage
```

## API (borrador)
- GET /api/workouts — listar
- POST /api/workouts — crear
- GET /api/exercises — listar (filtros: grupo muscular/equipo)
- GET /api/equipment — listar
- GET /api/health — health check

## Base de Datos (Supabase)
Tablas principales: `equipment`, `exercises`, `workouts` (+ `muscle_groups`, `exercise_muscle_groups`).
Ver definiciones SQL en `especificaciones.md`.

## TDD — Resumen
- Frontend (Vitest + RTL): componentes (`LoginComponent`, `WorkoutForm`, `TimerComponent`, `ExerciseList`, `EquipmentDetail`), hooks e integración de flujos clave.
- Backend (Go stdlib): handlers (`/api/workouts`, `/api/exercises`, `/api/equipment`), middleware (auth código "salud", CORS, logging) y validaciones.
- E2E: flujos de registro y navegación (posterior).

## Roadmap (MVP)
- [ ] Registro de entrenamientos (form + persistencia)
- [ ] Cronómetro con guía 40–50s
- [ ] Listado/buscador de ejercicios y equipos
- [ ] Notificaciones (carga manual)
- [ ] API REST básica en Go
- [ ] Tests: cobertura >80% FE, >85% BE

## Notas
- Node 18 puede mostrar advertencias con Vite 7; usa Node 20+ para evitar errores.
- En producción, reemplazar el código "salud" por Supabase Auth.
