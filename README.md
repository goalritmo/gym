# Entrenar App — Registro de Entrenamientos

Aplicación web para registrar entrenamientos (peso, repeticiones, series, tiempo) con soporte de cronómetro, visualización de ejercicios/equipos y enfoque TDD.

> Este proyecto se está construyendo en colaboración con ChatGPT‑5 (asistencia de desarrollo, TDD y documentación).

## 🚀 Versión 1.2.3 - Completada

**Estado**: ✅ **PRODUCCIÓN** - Aplicación completamente funcional y desplegada

### Características implementadas:
- ✅ **Registro de entrenamientos** con formulario completo
- ✅ **Cronómetro** para descanso entre series
- ✅ **Listado de ejercicios y equipos** con filtros
- ✅ **Sistema de notificaciones** (manual y automático)
- ✅ **API REST completa** en Go con autenticación
- ✅ **Autenticación Google OAuth** con Supabase
- ✅ **Sistema de rutinas** personalizadas
- ✅ **Panel de administración** para usuarios y contenido
- ✅ **Deployment completo** en Railway (backend) y Vercel (frontend)

### URLs de producción:
- **Frontend**: https://www.entrenar.app
- **Backend API**: https://api.goalritmo.com
- **Documentación**: https://github.com/goalritmo/gym

## Documentación
- Especificaciones funcionales (detalladas): `docs/especificaciones.md`
- Plan técnico (resumen): `docs/plan-tecnico.md`
- Guía de deployment: `DEPLOYMENT.md`

## Resumen (TL;DR)
- Pestañas: Registro, Cronómetro, Ejercicios, Notificaciones, Rutinas, Admin
- DB (Supabase): `equipment`, `exercises`, `workouts`, `muscle_groups`, `exercise_muscle_groups`, `routines`, `notifications`
- API: REST (Go) con endpoints completos y autenticación
- Frontend: React + TypeScript + Vite
- Testing: Vitest + React Testing Library (frontend), Go testing stdlib (backend)
- Autenticación: Google OAuth con Supabase
- Deployment: Railway (backend) + Vercel (frontend)

## Requisitos
- Node.js 20+ (recomendado 20.19+)
- npm 10+
- Cuenta/proyecto en Supabase

## Estructura
```
.
├── frontend/               # Vite + React + Vitest
├── backend/                # Go API + Docker
├── docs/
│   ├── especificaciones.md
│   └── plan-tecnico.md
├── DEPLOYMENT.md           # Guía de deployment
└── README.md               # Este archivo
```

## Arranque Rápido (Desarrollo)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
go mod download
go run main.go
```

### Testing (Frontend)
```bash
npm test         # ejecución en CI
npm run test:ui  # interfaz interactiva
npm run test:watch
npm run test:coverage
```

## API (Completa)
- **Workouts**: GET, POST, PUT, DELETE `/api/workouts`
- **Exercises**: GET `/api/exercises`
- **Equipment**: GET `/api/equipment`
- **User**: GET `/api/me`, POST `/api/me/setup`
- **Routines**: GET, POST, PUT, DELETE `/api/routines`
- **Notifications**: GET, POST, PUT, DELETE `/api/notifications`
- **Admin**: GET, POST, PUT, DELETE `/api/admin/*`
- **Health**: GET `/api/health`

## Base de Datos (Supabase)
Tablas principales: `equipment`, `exercises`, `workouts`, `routines`, `notifications`, `users`, `muscle_groups`, `exercise_muscle_groups`.
Ver definiciones SQL en `especificaciones.md`.

## TDD — Resumen
- **Frontend** (Vitest + RTL): Componentes completos, hooks, integración de flujos
- **Backend** (Go stdlib): Handlers completos, middleware, validaciones
- **Cobertura**: >80% frontend, >85% backend

## Roadmap (Completado ✅)
- [x] **Registro de entrenamientos** (form + persistencia)
- [x] **Cronómetro** para descanso entre series
- [x] **Listado/buscador** de ejercicios y equipos
- [x] **Notificaciones** (manual y automático)
- [x] **API REST completa** en Go
- [x] **Autenticación** Google OAuth
- [x] **Sistema de rutinas** personalizadas
- [x] **Panel de administración**
- [x] **Deployment** en producción
- [x] **Tests** con cobertura >80% FE, >85% BE

## Próximas versiones
- **v1.3.0**: Mejoras de UX y performance
- **v1.4.0**: Funcionalidades sociales (compartir entrenamientos)
- **v2.0.0**: App móvil nativa

## Notas
- Node 18 puede mostrar advertencias con Vite 7; usa Node 20+ para evitar errores.
- Autenticación implementada con Supabase Auth y Google OAuth.
- Deployment automatizado con CI/CD en GitHub.
- CORS configurado para dominios de producción.
