-- ═══════════════════════════════════════════════════════════════
-- Migración 016: Sistema de Links de Inspección Remota
-- ═══════════════════════════════════════════════════════════════

-- Tabla de links compartibles para carga de fotos por terceros
CREATE TABLE IF NOT EXISTS links_inspeccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL DEFAULT 'asegurado' CHECK (tipo IN ('asegurado', 'taller', 'perito')),
    nombre_destinatario TEXT,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'expirado', 'revocado')),
    expira_en TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
    fotos_subidas INTEGER NOT NULL DEFAULT 0,
    max_fotos INTEGER NOT NULL DEFAULT 50,
    ip_acceso TEXT,
    user_agent TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_links_inspeccion_token ON links_inspeccion(token);
CREATE INDEX IF NOT EXISTS idx_links_inspeccion_caso_id ON links_inspeccion(caso_id);
CREATE INDEX IF NOT EXISTS idx_links_inspeccion_estado ON links_inspeccion(estado);

-- RLS
ALTER TABLE links_inspeccion ENABLE ROW LEVEL SECURITY;

-- Lectura pública (validación por token se hace en la query)
DROP POLICY IF EXISTS "links_inspeccion_select_public" ON links_inspeccion;
CREATE POLICY "links_inspeccion_select_public" ON links_inspeccion
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear links
DROP POLICY IF EXISTS "links_inspeccion_insert_auth" ON links_inspeccion;
CREATE POLICY "links_inspeccion_insert_auth" ON links_inspeccion
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Solo usuarios autenticados pueden actualizar (revocar, etc)
DROP POLICY IF EXISTS "links_inspeccion_update_auth" ON links_inspeccion;
CREATE POLICY "links_inspeccion_update_auth" ON links_inspeccion
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Permitir UPDATE público para fotos_subidas/estado (el endpoint API usa service_role)
-- No se necesita policy adicional ya que el endpoint usa service_role key

-- Función para auto-expirar links vencidos
CREATE OR REPLACE FUNCTION fn_expirar_links_inspeccion()
RETURNS void AS $$
BEGIN
    UPDATE links_inspeccion
    SET estado = 'expirado'
    WHERE estado = 'activo'
    AND expira_en < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
