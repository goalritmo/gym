-- Crear tabla para kudos
CREATE TABLE IF NOT EXISTS kudos (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    workout_day_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workout_day_id)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_kudos_user_id ON kudos(user_id);
CREATE INDEX IF NOT EXISTS idx_kudos_workout_day_id ON kudos(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_kudos_created_at ON kudos(created_at);

-- Agregar foreign key constraints
ALTER TABLE kudos 
ADD CONSTRAINT fk_kudos_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE kudos 
ADD CONSTRAINT fk_kudos_workout_day_id 
FOREIGN KEY (workout_day_id) REFERENCES workout_days(id) ON DELETE CASCADE;
