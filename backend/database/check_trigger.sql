-- Script para verificar y arreglar el trigger de creación de usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la función handle_new_user existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 2. Verificar si el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth'
AND event_object_table = 'users';

-- 3. Si el trigger no existe o hay problemas, recrearlo
-- Primero eliminar el trigger existente si hay problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recrear la función con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Insertar en user_profiles con mejor manejo de errores
    BEGIN
        INSERT INTO public.user_profiles (user_id, name, is_admin)
        VALUES (
            new.id, 
            COALESCE(new.raw_user_meta_data->>'name', 'Sin nombre'), 
            false
        )
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Log del error pero no fallar la inserción del usuario
        RAISE WARNING 'Error inserting into user_profiles for user %: %', new.id, SQLERRM;
    END;
    
    -- Insertar en user_settings con mejor manejo de errores
    BEGIN
        INSERT INTO public.user_settings (user_id, show_own_workouts_in_social, unc_notifications_enabled)
        VALUES (new.id, true, true)
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Log del error pero no fallar la inserción del usuario
        RAISE WARNING 'Error inserting into user_settings for user %: %', new.id, SQLERRM;
    END;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar que el trigger se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth'
AND event_object_table = 'users';

-- 6. Verificar permisos de la función
SELECT 
    routine_name,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 7. Verificar que las tablas tienen los índices correctos
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('user_profiles', 'user_settings')
AND schemaname = 'public'
AND indexname LIKE '%user_id%';

-- 8. Verificar que no hay restricciones de clave foránea problemáticas
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('user_profiles', 'user_settings')
AND tc.table_schema = 'public';
