-- Migraciones para usar Supabase Auth (sin crear tabla users)
-- Supabase ya maneja usuarios en auth.users automáticamente

-- 1. Agregar columna user_id a workouts (si no existe) que referencia auth.users
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workouts' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.workouts 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Agregar columna user_id a workout_sessions (si no existe)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_sessions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.workout_sessions 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON public.workouts(created_at);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(session_date);

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger para workout_sessions
DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at 
    BEFORE UPDATE ON public.workout_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Función helper para obtener user_id actual (desde JWT)
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Row Level Security (RLS) para proteger datos por usuario
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para workouts: los usuarios solo ven sus propios datos
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON public.workouts;
CREATE POLICY "Users can insert own workouts" ON public.workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON public.workouts;
CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workouts" ON public.workouts;
CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para workout_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.workout_sessions;
CREATE POLICY "Users can view own sessions" ON public.workout_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.workout_sessions;
CREATE POLICY "Users can insert own sessions" ON public.workout_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.workout_sessions;
CREATE POLICY "Users can update own sessions" ON public.workout_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.workout_sessions;
CREATE POLICY "Users can delete own sessions" ON public.workout_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Verificar que las tablas existen
DO $$
DECLARE
    table_names TEXT[] := ARRAY['workouts', 'workout_sessions', 'exercises', 'equipment'];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ Tabla % existe', table_name;
        ELSE
            RAISE NOTICE '❌ Tabla % NO existe', table_name;
        END IF;
    END LOOP;
    
    -- Verificar que auth.users existe (tabla de Supabase)
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabla auth.users existe (Supabase Auth)';
    ELSE
        RAISE NOTICE '❌ Tabla auth.users NO existe - verificar configuración de Supabase';
    END IF;
END $$;
