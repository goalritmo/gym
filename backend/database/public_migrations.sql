-- Migraciones para el schema public solamente
-- Estas se pueden ejecutar con el usuario normal de la base de datos

-- Verificar si las tablas existen antes de crearlas
CREATE TABLE IF NOT EXISTS public.workouts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER REFERENCES public.workouts(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agregar columnas user_id si no existen
DO $$
BEGIN
    -- Agregar user_id a workouts si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'workouts' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.workouts ADD COLUMN user_id UUID;
        -- Para testing, permitimos NULL por ahora
        RAISE NOTICE 'Columna user_id agregada a workouts';
    END IF;

    -- Agregar user_id a workout_sessions si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'workout_sessions' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.workout_sessions ADD COLUMN user_id UUID;
        -- Para testing, permitimos NULL por ahora
        RAISE NOTICE 'Columna user_id agregada a workout_sessions';
    END IF;
END $$;
