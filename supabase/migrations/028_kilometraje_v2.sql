-- ==========================================
-- 028: Kilometraje v2 — Columnas adicionales
-- ==========================================
-- Solo agrega lo que falta, NO recrea la tabla.

ALTER TABLE kilometraje_diario ADD COLUMN IF NOT EXISTS siniestro_asociado TEXT;
ALTER TABLE kilometraje_diario ADD COLUMN IF NOT EXISTS casos_incluidos JSONB DEFAULT '[]';
ALTER TABLE kilometraje_diario ADD COLUMN IF NOT EXISTS casos_excluidos JSONB DEFAULT '[]';
ALTER TABLE kilometraje_diario ADD COLUMN IF NOT EXISTS ruta_orden JSONB;
ALTER TABLE kilometraje_diario ADD COLUMN IF NOT EXISTS legs JSONB;
