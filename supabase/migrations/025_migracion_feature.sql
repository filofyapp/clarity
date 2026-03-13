-- Feature: Pedir Migración
-- Campos para tracking del hilo de email de migración (separado del hilo de gestor)
ALTER TABLE casos ADD COLUMN IF NOT EXISTS gmail_migracion_thread_id TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS gmail_migracion_message_id TEXT;

-- Config por defecto para destinatarios de migración
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('migracion_email_to', '"rcardozo@sancorseguros.com"', 'Email principal para solicitudes de migración'),
  ('migracion_email_cc', '["MCossa@sancorseguros.com","SGuzman@sancorseguros.com"]', 'Emails en copia para solicitudes de migración'),
  ('migracion_usuario_destino', '"ALFREDO MIÑO"', 'Nombre del usuario destino en el cuerpo del mail de migración')
ON CONFLICT (clave) DO NOTHING;
