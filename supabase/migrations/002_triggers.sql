CREATE OR REPLACE FUNCTION fn_evaluar_informe_completo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completo := (
    NEW.se_acuerda IS NOT NULL
    AND (
      (NEW.reparar IS NOT NULL AND NEW.reparar != '')
      OR (NEW.cambiar IS NOT NULL AND NEW.cambiar != '')
      OR (NEW.pintar IS NOT NULL AND NEW.pintar != '')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evaluar_informe_completo
  BEFORE INSERT OR UPDATE ON informes_periciales
  FOR EACH ROW
  EXECUTE FUNCTION fn_evaluar_informe_completo();

CREATE OR REPLACE FUNCTION fn_check_transicion_pendiente_carga()
RETURNS TRIGGER AS $$
DECLARE
  tiene_fotos BOOLEAN;
  estado_actual TEXT;
BEGIN
  IF NEW.completo = true AND (OLD.completo = false OR OLD.completo IS NULL) THEN
    SELECT EXISTS(
      SELECT 1 FROM fotos_inspeccion WHERE caso_id = NEW.caso_id
    ) INTO tiene_fotos;

    SELECT estado INTO estado_actual FROM casos WHERE id = NEW.caso_id;

    IF tiene_fotos AND estado_actual = 'inspeccionada' THEN
      UPDATE casos SET estado = 'pendiente_carga', updated_at = now() WHERE id = NEW.caso_id;

      INSERT INTO historial_estados (caso_id, usuario_id, estado_anterior, estado_nuevo, motivo)
      VALUES (NEW.caso_id, NEW.perito_id, 'inspeccionada', 'pendiente_carga', 'Transición automática: informe completo + fotos cargadas');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transicion_pendiente_carga
  AFTER UPDATE ON informes_periciales
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_transicion_pendiente_carga();

CREATE OR REPLACE FUNCTION fn_check_transicion_por_foto()
RETURNS TRIGGER AS $$
DECLARE
  informe_completo BOOLEAN;
  estado_actual TEXT;
  perito_id_caso UUID;
BEGIN
  SELECT completo INTO informe_completo FROM informes_periciales WHERE caso_id = NEW.caso_id;
  SELECT estado, perito_calle_id INTO estado_actual, perito_id_caso FROM casos WHERE id = NEW.caso_id;

  IF informe_completo = true AND estado_actual = 'inspeccionada' THEN
    UPDATE casos SET estado = 'pendiente_carga', updated_at = now() WHERE id = NEW.caso_id;

    INSERT INTO historial_estados (caso_id, usuario_id, estado_anterior, estado_nuevo, motivo)
    VALUES (NEW.caso_id, perito_id_caso, 'inspeccionada', 'pendiente_carga', 'Transición automática: foto cargada + informe ya completo');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transicion_por_foto
  AFTER INSERT ON fotos_inspeccion
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_transicion_por_foto();
