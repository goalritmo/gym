-- Actualizar todos los nombres de usuarios para mostrar solo el primer nombre
-- Ejecutar en Supabase SQL Editor

-- Función para extraer el primer nombre
CREATE OR REPLACE FUNCTION extract_first_name(full_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Buscar el primer espacio y tomar solo la primera parte
    FOR i IN 1..LENGTH(full_name) LOOP
        IF SUBSTRING(full_name FROM i FOR 1) = ' ' THEN
            RETURN SUBSTRING(full_name FROM 1 FOR i-1);
        END IF;
    END LOOP;
    RETURN full_name;
END;
$$ LANGUAGE plpgsql;

-- 1. Verificar nombres actuales
SELECT 
    u.email,
    u.raw_user_meta_data->>'name' as google_name,
    up.name as current_name,
    extract_first_name(up.name) as first_name_only
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.email;

-- 2. Actualizar nombres para mostrar solo el primer nombre
UPDATE user_profiles 
SET name = extract_first_name(name)
WHERE name LIKE '% %';

-- 3. Verificar después de la actualización
SELECT 
    u.email,
    u.raw_user_meta_data->>'name' as google_name,
    up.name as updated_name
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.email;

-- Limpiar función temporal
DROP FUNCTION IF EXISTS extract_first_name(TEXT);
