-- Verificar y corregir el perfil del usuario
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si el usuario tiene perfil
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    up.name as profile_name,
    up.is_admin,
    up.role
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';

-- 2. Verificar configuración del usuario
SELECT 
    us.user_id,
    us.show_own_workouts_in_social,
    us.unc_notifications_enabled
FROM user_settings us
WHERE us.user_id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';

-- 3. Crear perfil si no existe
DO $$
DECLARE
    user_email TEXT;
    user_name TEXT;
    target_user_id UUID := 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';
BEGIN
    -- Obtener email del usuario
    SELECT email INTO user_email
    FROM auth.users 
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Email del usuario: %', user_email;
    
    -- Extraer nombre del email
    user_name := split_part(user_email, '@', 1);
    RAISE NOTICE 'Nombre extraído: %', user_name;
    
    -- Crear perfil si no existe
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = target_user_id) THEN
        INSERT INTO user_profiles (user_id, name, is_admin, role)
        VALUES (target_user_id, user_name, false, 'user');
        RAISE NOTICE 'Perfil creado para: %', user_name;
    ELSE
        RAISE NOTICE 'Perfil ya existe';
    END IF;
    
    -- Crear configuración si no existe
    IF NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = target_user_id) THEN
        INSERT INTO user_settings (user_id, show_own_workouts_in_social, unc_notifications_enabled)
        VALUES (target_user_id, true, true);
        RAISE NOTICE 'Configuración creada';
    ELSE
        RAISE NOTICE 'Configuración ya existe';
    END IF;
    
    -- Crear notificación de bienvenida si no existe
    IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = target_user_id AND type = 'welcome') THEN
        INSERT INTO notifications (user_id, title, message, type, created_at)
        VALUES (
            target_user_id,
            '¡Bienvenido a GoalRitmo!',
            'Gracias por unirte a nuestra comunidad fitness. ¡Comienza tu viaje hacia una vida más saludable!',
            'welcome',
            NOW()
        );
        RAISE NOTICE 'Notificación de bienvenida creada';
    ELSE
        RAISE NOTICE 'Notificación de bienvenida ya existe';
    END IF;
END $$;

-- 4. Verificar que se creó correctamente
SELECT 
    u.email,
    up.name as profile_name,
    up.is_admin,
    up.role
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e';
