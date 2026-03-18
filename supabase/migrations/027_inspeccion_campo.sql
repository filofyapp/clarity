-- Migration: Tabla para informe de inspección presencial (campo)
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla informe_inspeccion_campo
CREATE TABLE IF NOT EXISTS informe_inspeccion_campo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    perito_id UUID NOT NULL REFERENCES usuarios(id),

    -- Mano de obra (JSON array)
    -- Formato: [{ "concepto": "Chapa", "valor": 45000, "cantidad": 3, "unidad": "días" }, ...]
    mano_de_obra JSONB NOT NULL DEFAULT '[]',
    total_mano_de_obra NUMERIC(12,2) DEFAULT 0,

    -- Piezas
    piezas_cambiar TEXT,
    piezas_reparar TEXT,
    piezas_pintar TEXT,

    -- Observaciones
    observaciones TEXT,
    audio_url TEXT,

    -- Firma
    resumen_firmado_url TEXT,
    firma_url TEXT,
    firma_timestamp TIMESTAMPTZ,
    firma_latitud NUMERIC(10,7),
    firma_longitud NUMERIC(10,7),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice por caso_id (1:1 relation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_informe_campo_caso ON informe_inspeccion_campo(caso_id);

-- 2. Insertar valores de mano de obra Sancor si no existen
-- Busca la compania Sancor para asociar
DO $$
DECLARE
    sancor_id UUID;
BEGIN
    SELECT id INTO sancor_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;

    IF sancor_id IS NOT NULL THEN
        -- Día de Chapa
        INSERT INTO precios (compania_id, concepto, tipo, valor_estudio, descripcion, activo)
        VALUES (sancor_id, 'dia_chapa', 'mano_obra', 0, 'Valor por día de chapa', true)
        ON CONFLICT (compania_id, concepto) DO NOTHING;

        -- Paño de Pintura
        INSERT INTO precios (compania_id, concepto, tipo, valor_estudio, descripcion, activo)
        VALUES (sancor_id, 'pano_pintura', 'mano_obra', 0, 'Valor por paño de pintura', true)
        ON CONFLICT (compania_id, concepto) DO NOTHING;

        -- Hora de Mecánica
        INSERT INTO precios (compania_id, concepto, tipo, valor_estudio, descripcion, activo)
        VALUES (sancor_id, 'hora_mecanica', 'mano_obra', 0, 'Valor por hora de mecánica', true)
        ON CONFLICT (compania_id, concepto) DO NOTHING;
    END IF;
END $$;

-- 3. RLS (si se necesita más adelante)
-- ALTER TABLE informe_inspeccion_campo ENABLE ROW LEVEL SECURITY;
