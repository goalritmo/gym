-- Corregir nombre usando datos de Google
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar datos de Google del usuario
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    up.name as current_name
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';

-- 2. Actualizar nombre usando datos de Google
DO $$
DECLARE
    google_name TEXT;
    user_record RECORD;
BEGIN
    -- Obtener datos del usuario
    SELECT u.raw_user_meta_data, up.name as current_name
    INTO user_record
    FROM auth.users u
    JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';
    
    -- Extraer nombre de Google
    google_name := COALESCE(
        user_record.raw_user_meta_data->>'name',
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'display_name',
        user_record.raw_user_meta_data->>'given_name',
        'onzamato' -- Fallback al nombre actual
    );
    
    RAISE NOTICE 'Nombre actual: %', user_record.current_name;
    RAISE NOTICE 'Nombre de Google: %', google_name;
    RAISE NOTICE 'Metadata: %', user_record.raw_user_meta_data;
    
    -- Actualizar nombre si es diferente
    IF google_name != user_record.current_name THEN
        UPDATE user_profiles 
        SET name = google_name
        WHERE user_id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';
        RAISE NOTICE 'Nombre actualizado a: %', google_name;
    ELSE
        RAISE NOTICE 'Nombre ya está correcto';
    END IF;
END $$;

-- 3. Verificar el nombre actualizado
SELECT 
    u.email,
    u.raw_user_meta_data->>'name' as google_name,
    up.name as profile_name
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';
