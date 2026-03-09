-- ─── TRIGGER: Versionado de precios (DOC_TECNICA §3.14) ───
-- Cada vez que se actualiza un precio, se guarda el historial

CREATE OR REPLACE FUNCTION fn_precio_historial()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.valor_estudio != NEW.valor_estudio OR OLD.valor_perito != NEW.valor_perito) THEN
        INSERT INTO precio_historial (
            precio_id,
            valor_estudio_anterior, valor_perito_anterior,
            valor_estudio_nuevo, valor_perito_nuevo,
            modificado_por
        ) VALUES (
            NEW.id,
            OLD.valor_estudio, OLD.valor_perito,
            NEW.valor_estudio, NEW.valor_perito,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_precio_historial ON precios;
CREATE TRIGGER trg_precio_historial
    BEFORE UPDATE ON precios
    FOR EACH ROW
    EXECUTE FUNCTION fn_precio_historial();
