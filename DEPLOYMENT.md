# 🚀 Deployment Guide - Entrenar App

Esta guía te ayudará a desplegar tanto el frontend como el backend en producción.

## 📋 Prerequisitos

1. ✅ **Backend Go funcionando** con JWKS authentication
2. ✅ **Frontend React** con Supabase integration  
3. ✅ **Base de datos Supabase** configurada
4. ✅ **Google OAuth** configurado en Supabase

## 🔧 Backend Deployment (Railway)

### 1. Crear cuenta en Railway
- Ve a [railway.app](https://railway.app)
- Conecta tu cuenta de GitHub

### 2. Deploy del Backend
```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy desde el directorio backend
cd backend
railway up
```

### 3. Configurar Variables de Entorno en Railway
En el dashboard de Railway, configura:

```env
PORT=3210
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=tu_publishable_key_aqui
GO_VERSION=1.21
```

### 4. Configurar Dominio Custom (Opcional)
- En Railway dashboard → Settings → Domains
- Agrega tu dominio personalizado

---

## 🌐 Frontend Deployment (Vercel)

### 1. Crear cuenta en Vercel
- Ve a [vercel.com](https://vercel.com)
- Conecta tu cuenta de GitHub

### 2. Deploy del Frontend
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy desde el directorio frontend
cd frontend
vercel --prod
```

### 3. Configurar Variables de Entorno en Vercel
En el dashboard de Vercel → Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=tu_publishable_key_aqui
VITE_API_BASE_URL=https://tu-backend.railway.app/api
```

### 4. Configurar Dominio Custom (Opcional)
- En Vercel dashboard → Settings → Domains
- Agrega tu dominio personalizado

---

## 🔐 Google OAuth Production Setup

### 1. Configurar OAuth en Google Cloud Console
```
1. Ve a Google Cloud Console → APIs & Services → Credentials
2. Edita tu OAuth 2.0 Client ID
3. Agrega authorized redirect URIs:
   - https://PROJECT.supabase.co/auth/v1/callback
   - https://tu-frontend.vercel.app
```

### 2. Actualizar Supabase
```
1. Supabase Dashboard → Authentication → Providers → Google
2. Verifica que el Client ID y Secret estén correctos
3. Agrega tu dominio de producción a "Site URL"
```

---

## 🧪 Testing Production

### 1. Health Check Backend
```bash
curl https://tu-backend.railway.app/api/health
```

### 2. Frontend
- Visita tu dominio de Vercel
- Prueba Google OAuth
- Verifica conexión con backend

---

## 📊 Monitoring y Logs

### Railway (Backend)
- Dashboard → Deployments → Logs
- Monitoring automático incluido

### Vercel (Frontend)  
- Dashboard → Functions → Logs
- Analytics automático incluido

---

## 🔄 CI/CD Automático

### Configuración Automática
- **Railway**: Deploy automático en push a `main`
- **Vercel**: Deploy automático en push a `main`
- **Preview**: Branches automáticamente crean previews

### Variables por Ambiente
```env
# Production
VITE_API_BASE_URL=https://tu-backend.railway.app/api

# Development  
VITE_API_BASE_URL=http://localhost:3210/api
```

---

## ⚡ Performance Optimizations

### Backend (Railway)
- **Auto-scaling**: Configurado automáticamente
- **Health checks**: Configurados en `railway.toml`
- **Resource limits**: Ajustar según uso

### Frontend (Vercel)
- **Edge Network**: CDN global automático
- **Image optimization**: Habilitado por defecto
- **Code splitting**: Configurado con Vite

---

## 🆘 Troubleshooting

### Errores Comunes

**❌ CORS Error**
```go
// En backend/main.go, verifica:
c.AllowedOrigins = []string{
    "http://localhost:5173",
    "https://tu-frontend.vercel.app"
}
```

**❌ 404 en rutas**
```json
// En frontend/vercel.json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

**❌ Environment variables**
```bash
# Verifica que las variables estén configuradas:
vercel env ls
railway variables
```

---

## 🎯 URLs de Ejemplo

```
Frontend: https://entrenar.app
Backend:  https://entrenar-backend.railway.app
API:      https://entrenar-backend.railway.app/api/health
```

¡Con esto tendrás tu app entrenar completamente desplegada en producción! 🚀
