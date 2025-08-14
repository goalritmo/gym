-- Verificar restricciones de clave foránea en tablas relacionadas con usuarios
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (ccu.table_name = 'auth.users' OR ccu.table_name = 'user_profiles')
ORDER BY tc.table_name, kcu.column_name;

-- Verificar todas las tablas que existen en la base de datos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar si existen registros en workouts para el usuario específico
SELECT COUNT(*) as workouts_count 
FROM workouts 
WHERE user_id = '1137f33f-921e-48fd-8a26-0c2e524fdfd2';

-- Verificar la estructura de la tabla workouts
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'workouts' 
ORDER BY ordinal_position;
