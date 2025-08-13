-- Eliminar la columna is_active de admin_notifications
ALTER TABLE admin_notifications DROP COLUMN IF EXISTS is_active;

-- Actualizar la vista o queries que usen is_active para que siempre muestre todas las notificaciones
-- (ya no es necesario filtrar por is_active = true)
