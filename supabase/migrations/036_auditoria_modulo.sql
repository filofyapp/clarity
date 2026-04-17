-- =============================================
-- MIGRACIÓN 036: Módulo de Auditoría
-- Tablas: informes_auditoria, scores_perito
-- =============================================

-- ===============================
-- TABLA: informes_auditoria
-- Almacena informes diarios generados (manual o por cron)
-- ===============================
CREATE TABLE IF NOT EXISTS informes_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  contenido_whatsapp TEXT NOT NULL,
  datos_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsqueda por fecha
CREATE INDEX IF NOT EXISTS idx_informes_auditoria_fecha ON informes_auditoria(fecha DESC);

-- ===============================
-- TABLA: scores_perito
-- Score mensual por perito de calle
-- ===============================
CREATE TABLE IF NOT EXISTS scores_perito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perito_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2099),
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  casos_totales INTEGER DEFAULT 0,
  casos_cumplidos INTEGER DEFAULT 0,
  desvios INTEGER DEFAULT 0,
  datos_detalle JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(perito_id, mes, anio)
);

-- Índice para consultas por perito y período
CREATE INDEX IF NOT EXISTS idx_scores_perito_lookup ON scores_perito(perito_id, anio DESC, mes DESC);

-- ===============================
-- RLS: Solo admin puede leer/escribir
-- ===============================

ALTER TABLE informes_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_perito ENABLE ROW LEVEL SECURITY;

-- informes_auditoria
DROP POLICY IF EXISTS informes_auditoria_select_admin ON informes_auditoria;
CREATE POLICY informes_auditoria_select_admin ON informes_auditoria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND (usuarios.rol = 'admin' OR 'admin' = ANY(usuarios.roles))
    )
  );

DROP POLICY IF EXISTS informes_auditoria_insert_admin ON informes_auditoria;
CREATE POLICY informes_auditoria_insert_admin ON informes_auditoria
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND (usuarios.rol = 'admin' OR 'admin' = ANY(usuarios.roles))
    )
  );

-- scores_perito
DROP POLICY IF EXISTS scores_perito_select_admin ON scores_perito;
CREATE POLICY scores_perito_select_admin ON scores_perito
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND (usuarios.rol = 'admin' OR 'admin' = ANY(usuarios.roles))
    )
  );

DROP POLICY IF EXISTS scores_perito_all_admin ON scores_perito;
CREATE POLICY scores_perito_all_admin ON scores_perito
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND (usuarios.rol = 'admin' OR 'admin' = ANY(usuarios.roles))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND (usuarios.rol = 'admin' OR 'admin' = ANY(usuarios.roles))
    )
  );
