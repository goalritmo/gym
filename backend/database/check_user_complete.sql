-- Verificar datos completos del usuario más reciente
-- Ejecutar en Supabase SQL Editor

-- 1. Ver el último usuario creado
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Verificar el perfil del último usuario
SELECT 
    up.user_id,
    up.name,
    up.is_admin,
    up.role,
    u.email,
    u.raw_user_meta_data
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
WHERE up.user_id = (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
);

-- 3. Verificar la configuración del último usuario
SELECT 
    us.user_id,
    us.show_own_workouts_in_social,
    us.unc_notifications_enabled
FROM user_settings us
WHERE us.user_id = (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
);

-- 4. Verificar notificación de bienvenida
SELECT 
    n.user_id,
    n.title,
    n.message,
    n.type,
    n.created_at
FROM notifications n
WHERE n.user_id = (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
)
AND n.type = 'welcome';

-- 5. Verificar entrenamientos del último usuario
SELECT 
    wd.id,
    wd.user_id,
    wd.date,
    wd.created_at,
    up.name as user_name
FROM workout_days wd
LEFT JOIN user_profiles up ON wd.user_id = up.user_id
WHERE wd.user_id = (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
)
ORDER BY wd.created_at DESC;
