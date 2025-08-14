-- Verificar si la tabla kudos existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'kudos'
) as kudos_table_exists;

-- Si existe, mostrar su estructura
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'kudos' 
ORDER BY ordinal_position;

-- Verificar si hay registros en kudos para el usuario específico
-- Primero verificar qué columnas existen
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'kudos';

-- Luego verificar registros (comentado hasta saber la estructura real)
-- SELECT COUNT(*) as kudos_count 
-- FROM kudos 
-- WHERE from_user_id = '1137f33f-921e-48fd-8a26-0c2e524fdfd2' 
--    OR to_user_id = '1137f33f-921e-48fd-8a26-0c2e524fdfd2';

-- Verificar restricciones de clave foránea en kudos
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'kudos';

-- Si la tabla no existe, crearla
CREATE TABLE IF NOT EXISTS kudos (
    id SERIAL PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id, workout_id)
);
