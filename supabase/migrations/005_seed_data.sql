-- Datos exclusivos de producción

-- Insertar AOMNIS company (Sancor inicialmente)
INSERT INTO companias (nombre, codigo, tipo_trabajo, activa) 
VALUES ('Sancor Seguros', 'SANCOR', ARRAY['asegurado', 'tercero'], true)
ON CONFLICT DO NOTHING;

-- Valores de precios default para la compañía (monto_estudio = 0 y monto_perito = 0 para ser editados en UI)
DO $$
DECLARE
  v_compania_id UUID;
BEGIN
  SELECT id INTO v_compania_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;
  
  IF v_compania_id IS NOT NULL THEN
    INSERT INTO precios (compania_id, concepto, tipo, valor_estudio, valor_perito, descripcion) VALUES
      (v_compania_id, 'chapa_dia', 'mano_obra', 140000, 140000, 'Valor default por día de chapa'),
      (v_compania_id, 'pintura_pano', 'mano_obra', 145000, 145000, 'Valor default por paño de pintura')
    ON CONFLICT (compania_id, concepto) DO NOTHING;
  END IF;
END $$;
