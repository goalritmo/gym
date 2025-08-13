-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunas notificaciones de ejemplo
INSERT INTO notifications (user_id, type, title, message, data, is_read) VALUES
('6e80d7a4-aede-493a-be5e-947d26184d24', 'announcement', 'Gimnasio de la UNC cerrado', 'Les informamos que el día lunes 11 de agosto, la Dirección de Deportes permanecerá cerrada debido al paro del personal no docente.', '{"priority": "high"}', false),
('6e80d7a4-aede-493a-be5e-947d26184d24', 'general', 'Bienvenido a GoalRitmo', '¡Gracias por unirte a nuestra comunidad de fitness! Comienza registrando tu primer entrenamiento.', '{"priority": "low"}', false);
