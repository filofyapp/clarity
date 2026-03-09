-- ═══════════════════════════════════════════════════════════════
-- FIX: Trigger fn_precio_historial referencia a columna renombrada
-- La columna valor_perito fue renombrada a valor_perito_calle en migration 005
-- Este trigger debe actualizarse para usar los nuevos nombres
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_precio_historial()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.valor_estudio IS DISTINCT FROM NEW.valor_estudio 
        OR OLD.valor_perito_calle IS DISTINCT FROM NEW.valor_perito_calle
        OR OLD.valor_perito_carga IS DISTINCT FROM NEW.valor_perito_carga) THEN
        INSERT INTO precio_historial (
            precio_id,
            valor_estudio_anterior, valor_perito_anterior,
            valor_estudio_nuevo, valor_perito_nuevo,
            modificado_por
        ) VALUES (
            NEW.id,
            OLD.valor_estudio, OLD.valor_perito_calle,
            NEW.valor_estudio, NEW.valor_perito_calle,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar que "ausente" es un tipo válido en el check constraint de casos
-- (Solo ejecutar si el constraint existe y no incluye 'ausente')
DO $$
BEGIN
    -- Intentar agregar 'ausente' al check constraint si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'casos_tipo_inspeccion_check'
    ) THEN
        ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_tipo_inspeccion_check;
        ALTER TABLE casos ADD CONSTRAINT casos_tipo_inspeccion_check 
            CHECK (tipo_inspeccion IN (
                'ip_con_orden', 'ip_sin_orden', 'ip_remota', 'posible_dt', 
                'terceros', 'ip_camiones', 'ip_final_intermedia', 'ampliacion', 'ausente'
            ));
    END IF;
END $$;
