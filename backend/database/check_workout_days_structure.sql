-- Verificar estructura de workout_days
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de workout_days
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name = 'workout_days'
ORDER BY ordinal_position;

-- 2. Verificar datos de workout_days recientes
SELECT 
    id,
    user_id,
    date,
    created_at,
    updated_at
FROM workout_days 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar si hay diferencia entre date y created_at
SELECT 
    id,
    user_id,
    date,
    created_at,
    CASE 
        WHEN date::date = created_at::date THEN 'Misma fecha'
        ELSE 'Fechas diferentes'
    END as fecha_comparacion
FROM workout_days 
ORDER BY created_at DESC 
LIMIT 10;
