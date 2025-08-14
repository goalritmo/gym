-- Corregir fechas incorrectas en workout_days
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar entrenamientos con fechas incorrectas
SELECT 
    id,
    user_id,
    date,
    created_at,
    CASE 
        WHEN date::date = created_at::date THEN 'Correcto'
        ELSE 'Incorrecto'
    END as estado
FROM workout_days 
WHERE date::date != created_at::date
ORDER BY created_at DESC;

-- 2. Corregir las fechas incorrectas
UPDATE workout_days 
SET date = created_at::date
WHERE date::date != created_at::date;

-- 3. Verificar que se corrigieron
SELECT 
    id,
    user_id,
    date,
    created_at,
    CASE 
        WHEN date::date = created_at::date THEN 'Correcto'
        ELSE 'Incorrecto'
    END as estado
FROM workout_days 
ORDER BY created_at DESC
LIMIT 10;
