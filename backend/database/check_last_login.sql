-- Verificar el estado actual de last_sign_in_at para el usuario admin
SELECT 
    id,
    email,
    last_sign_in_at,
    created_at,
    updated_at,
    NOW() as current_time
FROM auth.users 
WHERE email = 'gonza@goalritmo.com'  -- Reemplaza con tu email
ORDER BY last_sign_in_at DESC;

-- Verificar si hay algún trigger que actualice last_sign_in_at
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name LIKE '%login%' OR trigger_name LIKE '%sign%';

-- Verificar la configuración de Supabase Auth
SELECT 
    setting_name,
    setting_value
FROM pg_settings 
WHERE setting_name LIKE '%timezone%' OR setting_name LIKE '%date%';

-- Crear un trigger para actualizar last_sign_in_at automáticamente
CREATE OR REPLACE FUNCTION update_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar last_sign_in_at cuando el usuario se autentica
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
        NEW.last_sign_in_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS update_last_sign_in_trigger ON auth.users;
CREATE TRIGGER update_last_sign_in_trigger
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_sign_in();

-- Actualizar manualmente el last_sign_in_at para el usuario admin
UPDATE auth.users 
SET last_sign_in_at = NOW()
WHERE email = 'gonza@goalritmo.com';  -- Reemplaza con tu email
