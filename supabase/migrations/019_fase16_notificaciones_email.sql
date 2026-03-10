-- ==============================================================================
-- MIGRATION 019: FASE 16 - NOTIFICACIONES POR EMAIL (GMAIL API)
-- ==============================================================================

-- 1. Nuevos campos en la tabla casos (si no existen)
ALTER TABLE casos ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS tiene_respuesta_gestor BOOLEAN DEFAULT false;

-- 2. Tabla mail_queue
CREATE TABLE IF NOT EXISTS mail_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    estado_origen TEXT NOT NULL,
    estado_destino TEXT NOT NULL,
    destinatario_email TEXT NOT NULL,
    destinatario_nombre TEXT,
    asunto TEXT NOT NULL,
    cuerpo_html TEXT NOT NULL,
    enviar_despues_de TIMESTAMPTZ NOT NULL,
    enviado BOOLEAN DEFAULT false,
    cancelado BOOLEAN DEFAULT false,
    enviado_at TIMESTAMPTZ,
    error TEXT,
    gmail_message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en mail_queue
ALTER TABLE mail_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin todo mail_queue" ON mail_queue;
CREATE POLICY "Admin todo mail_queue" ON mail_queue FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin')
);

-- 3. Tabla mail_templates
CREATE TABLE IF NOT EXISTS mail_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    asunto TEXT NOT NULL,
    cuerpo TEXT NOT NULL,
    estado_origen TEXT,
    estado_destino TEXT,
    activo BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en mail_templates
ALTER TABLE mail_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos leen mail_templates" ON mail_templates;
CREATE POLICY "Todos leen mail_templates" ON mail_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin todo mail_templates" ON mail_templates;
CREATE POLICY "Admin todo mail_templates" ON mail_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin')
);

-- 4. Tabla respuestas_gestor
CREATE TABLE IF NOT EXISTS respuestas_gestor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    gmail_message_id TEXT,
    remitente_email TEXT NOT NULL,
    remitente_nombre TEXT,
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    leido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    leido_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en respuestas_gestor
ALTER TABLE respuestas_gestor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos leen respuestas_gestor" ON respuestas_gestor;
CREATE POLICY "Todos leen respuestas_gestor" ON respuestas_gestor FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Todos pueden actualizar respuestas_gestor" ON respuestas_gestor;
CREATE POLICY "Todos pueden actualizar respuestas_gestor" ON respuestas_gestor FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Service role puede insertar respuestas_gestor" ON respuestas_gestor;
CREATE POLICY "Service role puede insertar respuestas_gestor" ON respuestas_gestor FOR INSERT WITH CHECK (true); -- Permitimos a CRON Jobs saltar esto con clave maestra.

-- 5. Tabla seguimiento_tokens
CREATE TABLE IF NOT EXISTS seguimiento_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en seguimiento_tokens
ALTER TABLE seguimiento_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública seguimiento_tokens" ON seguimiento_tokens;
CREATE POLICY "Lectura pública seguimiento_tokens" ON seguimiento_tokens FOR SELECT USING (true); -- Porque es pública
DROP POLICY IF EXISTS "Authenticated pueden todo seguimiento_tokens" ON seguimiento_tokens;
CREATE POLICY "Authenticated pueden todo seguimiento_tokens" ON seguimiento_tokens FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================================
-- INSERCIÓN DE TEMPLATES POR DEFECTO MÍNIMOS REQUERIDOS
-- ==============================================================================
INSERT INTO mail_templates (codigo, nombre, asunto, cuerpo, estado_origen, estado_destino, activo) VALUES 
('contactado', 'Contacto iniciado', '[CLARITY] Siniestro {{siniestro}} · {{dominio}} — Contacto iniciado', 'Estimado/a {{gestor_nombre}},

Le informamos que hemos iniciado el contacto con el socio para coordinar la inspección correspondiente al siniestro {{siniestro}}, vehículo {{vehiculo}} ({{dominio}}).

Estaremos confirmando fecha y lugar de inspección a la brevedad.', 'pendiente_coordinacion', 'contactado', true),

('ip_coordinada', 'Inspección coordinada', '[CLARITY] Siniestro {{siniestro}} · {{dominio}} — Inspección coordinada', 'Estimado/a {{gestor_nombre}},

La inspección del siniestro {{siniestro}} ha sido coordinada con los siguientes datos:

📅 Fecha: {{fecha_inspeccion}}
🕐 Hora: {{hora_inspeccion}}
📍 Dirección: {{direccion_inspeccion}}, {{localidad_inspeccion}}
🚗 Vehículo: {{vehiculo}} · {{dominio}}', 'contactado', 'ip_coordinada', true),

('inspeccion_realizada', 'Inspección realizada', '[CLARITY] Siniestro {{siniestro}} · {{dominio}} — Inspección realizada', 'Estimado/a {{gestor_nombre}},

Le comunicamos que la inspección del siniestro {{siniestro}} fue realizada el día {{fecha_hoy}} a las {{hora_hoy}} hs.

Actualmente nos encontramos procesando el informe pericial. Le mantendremos informado sobre los próximos pasos.', 'ip_coordinada', 'pendiente_carga', true),

('esperando_presupuesto', 'Aguardando presupuesto', '[CLARITY] Siniestro {{siniestro}} · {{dominio}} — Inspección realizada, aguardando presupuesto', 'Estimado/a {{gestor_nombre}},

La inspección del siniestro {{siniestro}} fue realizada el día {{fecha_hoy}} a las {{hora_hoy}} hs.

Actualmente nos encontramos a la espera de que el concesionario/taller nos entregue el presupuesto correspondiente para poder continuar con la confección del informe.

Le informaremos apenas dispongamos de dicha documentación.', 'ip_coordinada', 'pendiente_presupuesto', true),

('licitando', 'Repuestos en licitación', '[CLARITY] Siniestro {{siniestro}} · {{dominio}} — Repuestos en licitación', 'Estimado/a {{gestor_nombre}},

Le informamos que los repuestos del siniestro {{siniestro}} han sido enviados a cotizar.

Una vez que obtengamos los valores de mercado, procederemos a confeccionar y enviar el informe pericial completo.', 'pendiente_carga', 'licitando_repuestos', true)

ON CONFLICT (codigo) DO UPDATE 
SET 
  nombre = EXCLUDED.nombre,
  asunto = EXCLUDED.asunto,
  cuerpo = EXCLUDED.cuerpo,
  estado_origen = EXCLUDED.estado_origen,
  estado_destino = EXCLUDED.estado_destino;

-- Tambien se crea el Wrapper
INSERT INTO mail_templates (codigo, nombre, asunto, cuerpo, estado_origen, estado_destino, activo) VALUES 
('wrapper_html', 'Wrapper HTML Base', 'No aplicable', '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Notificación Siniestro</title></head><body style="margin:0;padding:0;background-color:#F5F0F7;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,Helvetica,Arial,sans-serif;"><table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F5F0F7;"><tr><td align="center" style="padding:20px 0;"><table border="0" cellspacing="0" cellpadding="0" style="width:100%;max-width:580px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.05);"><!-- HEADER --><tr><td style="background-color:#0C0A0F;padding:24px 30px;text-align:center;"><h1 style="margin:0;color:#FFFFFF;font-size:24px;letter-spacing:4px;font-weight:700;">CLARITY</h1><p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Sistema Interno de AOM Siniestros</p></td></tr><!-- TOP INFO --><tr><td style="padding:30px 30px 0;"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td style="border-bottom:1px solid #E8E0F0;padding-bottom:20px;"><p style="margin:0 0 4px;font-size:13px;color:#D6006E;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">{{estado_titulo}}</p><h2 style="margin:0;font-size:22px;color:#1A1525;font-weight:700;">Siniestro {{siniestro}}</h2></td></tr></table></td></tr><!-- BODY CONTENT --><tr><td style="padding:24px 30px;"><div style="color:#1A1525;font-size:15px;line-height:24px;">{{cuerpo_mail}}</div></td></tr><!-- ACTION BUTTON --><tr><td align="center" style="padding:0 30px 30px;">{{boton_seguimiento}}</td></tr><!-- FOOTER --><tr><td style="background-color:#F8F5FB;border-top:1px solid #E8E0F0;padding:24px 30px;text-align:center;"><p style="margin:0 0 4px;color:#1A1525;font-size:14px;font-weight:600;">Estudio AOM Siniestros</p><p style="margin:0 0 12px;color:#6B5F78;font-size:13px;">Al servicio de Sancor Seguros</p><a href="mailto:gestionsancoraomsiniestros@gmail.com" style="color:#D6006E;font-size:13px;text-decoration:none;">gestionsancoraomsiniestros@gmail.com</a></td></tr></table></td></tr></table></body></html>', NULL, NULL, true)
ON CONFLICT (codigo) DO NOTHING;
