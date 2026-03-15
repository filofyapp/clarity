-- Feature: Derivación a Perito de Calle
-- Tracking de cuándo se envió la última derivación
ALTER TABLE casos ADD COLUMN IF NOT EXISTS derivacion_enviada_at TIMESTAMPTZ;

-- Template de mail de derivación (editable desde Configuración → Notificaciones)
INSERT INTO mail_templates (codigo, nombre, asunto, cuerpo, activo) VALUES (
  'derivacion_perito',
  'Derivación a Perito de Calle',
  'NUEVA DERIVACIÓN STRO {{siniestro}}',
  '📋 <strong>Nueva Derivación</strong><br><br><strong>Número de Siniestro:</strong> {{siniestro}}<br><br>📅 <strong>Fecha de Inspección:</strong> {{fecha_inspeccion}}<br>🕐 <strong>Hora:</strong> {{hora_inspeccion}}<br>📍 <strong>Dirección:</strong> {{direccion_inspeccion}}<br>📍 <strong>Localidad:</strong> {{localidad_inspeccion}}<br><br>🚗 <strong>Vehículo:</strong> {{vehiculo}}<br>🔖 <strong>Patente:</strong> {{dominio}}<br><br>👤 <strong>Gestor de Reclamo:</strong> {{gestor_nombre}}<br>📧 <strong>Email gestor:</strong> {{gestor_email}}<br><br>📄 <strong>Número de Servicio:</strong> {{servicio}}<br><br>📝 <strong>Descripción:</strong><br>{{descripcion}}',
  true
) ON CONFLICT (codigo) DO NOTHING;
