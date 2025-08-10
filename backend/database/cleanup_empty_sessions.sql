-- Trigger para limpiar automáticamente sesiones vacías cuando se eliminan workouts
-- Este trigger se ejecuta después de eliminar un workout

-- Primero, crear una función que verifique y elimine sesiones vacías
CREATE OR REPLACE FUNCTION cleanup_empty_sessions()
RETURNS TRIGGER AS $$
DECLARE
    session_id_to_check INTEGER;
    workout_count INTEGER;
BEGIN
    -- Obtener el ID de la sesión del workout que se eliminó
    -- Como estamos en un trigger AFTER DELETE, usamos OLD para acceder a los datos eliminados
    session_id_to_check := OLD.exercise_session_id;
    
    -- Contar cuántos workouts quedan en esa sesión
    SELECT COUNT(*) INTO workout_count
    FROM workouts 
    WHERE exercise_session_id = session_id_to_check;
    
    -- Si no quedan workouts en la sesión, eliminarla
    IF workout_count = 0 THEN
        DELETE FROM workout_sessions WHERE id = session_id_to_check;
        RAISE NOTICE 'Sesión % eliminada automáticamente por estar vacía', session_id_to_check;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger que se ejecuta después de eliminar un workout
DROP TRIGGER IF EXISTS trigger_cleanup_empty_sessions ON workouts;
CREATE TRIGGER trigger_cleanup_empty_sessions
    AFTER DELETE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_empty_sessions();

-- También crear un trigger para cuando se actualiza el exercise_session_id de un workout
-- (por si se mueve un workout de una sesión a otra)
CREATE OR REPLACE FUNCTION cleanup_empty_sessions_on_update()
RETURNS TRIGGER AS $$
DECLARE
    old_session_id INTEGER;
    new_session_id INTEGER;
    workout_count INTEGER;
BEGIN
    -- Si el exercise_session_id cambió
    IF OLD.exercise_session_id IS DISTINCT FROM NEW.exercise_session_id THEN
        -- Verificar la sesión anterior
        old_session_id := OLD.exercise_session_id;
        IF old_session_id IS NOT NULL THEN
            SELECT COUNT(*) INTO workout_count
            FROM workouts 
            WHERE exercise_session_id = old_session_id;
            
            IF workout_count = 0 THEN
                DELETE FROM workout_sessions WHERE id = old_session_id;
                RAISE NOTICE 'Sesión % eliminada automáticamente por estar vacía (después de mover workout)', old_session_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para actualizaciones
DROP TRIGGER IF EXISTS trigger_cleanup_empty_sessions_update ON workouts;
CREATE TRIGGER trigger_cleanup_empty_sessions_update
    AFTER UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_empty_sessions_on_update();

-- Función para limpiar todas las sesiones vacías existentes (ejecutar una vez)
CREATE OR REPLACE FUNCTION cleanup_all_empty_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    session_record RECORD;
BEGIN
    -- Buscar todas las sesiones que no tienen workouts
    FOR session_record IN 
        SELECT ws.id 
        FROM workout_sessions ws
        LEFT JOIN workouts w ON ws.id = w.exercise_session_id
        WHERE w.id IS NULL
    LOOP
        DELETE FROM workout_sessions WHERE id = session_record.id;
        deleted_count := deleted_count + 1;
        RAISE NOTICE 'Sesión % eliminada por estar vacía', session_record.id;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentarios sobre el uso:
-- 1. Los triggers se ejecutan automáticamente cuando se eliminan o actualizan workouts
-- 2. Para limpiar sesiones vacías existentes, ejecutar: SELECT cleanup_all_empty_sessions();
-- 3. Para verificar sesiones vacías: SELECT * FROM workout_sessions ws LEFT JOIN workouts w ON ws.id = w.exercise_session_id WHERE w.id IS NULL;
