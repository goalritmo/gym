-- Verificar y corregir fechas de entrenamientos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar entrenamientos del usuario
SELECT 
    wd.id,
    wd.user_id,
    wd.date,
    wd.created_at,
    CASE 
        WHEN wd.date = wd.created_at::date THEN 'Correcta'
        ELSE 'Incorrecta'
    END as fecha_status
FROM workout_days wd
WHERE wd.user_id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e'
ORDER BY wd.created_at DESC;

-- 2. Corregir fechas incorrectas
UPDATE workout_days 
SET date = created_at::date
WHERE user_id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e'
AND date != created_at::date;

-- 3. Verificar después de la corrección
SELECT 
    wd.id,
    wd.user_id,
    wd.date,
    wd.created_at,
    CASE 
        WHEN wd.date = wd.created_at::date THEN 'Correcta'
        ELSE 'Incorrecta'
    END as fecha_status
FROM workout_days wd
WHERE wd.user_id = 'ecfc0da9-b155-44a9-bd83-c8db36a6318e'
ORDER BY wd.created_at DESC;
