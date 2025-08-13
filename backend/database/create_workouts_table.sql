-- Crear tabla workouts simplificada
CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    reps INTEGER NOT NULL,
    serie INTEGER,
    seconds INTEGER,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_exercise_id ON workouts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at);

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
