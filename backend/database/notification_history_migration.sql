-- Agregar campos de usuario a admin_notifications
ALTER TABLE admin_notifications 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Crear tabla para el historial de cambios de notificaciones
CREATE TABLE IF NOT EXISTS notification_history (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated')),
    old_title TEXT,
    new_title TEXT,
    old_message TEXT,
    new_message TEXT,
    old_type VARCHAR(20),
    new_type VARCHAR(20),
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notification_history_notification_id ON notification_history(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_changed_at ON notification_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_by ON admin_notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_updated_by ON admin_notifications(updated_by);
