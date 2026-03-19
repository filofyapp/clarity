-- ==============================================================================
-- MIGRATION 029: BACKFILL BILLING AMOUNTS FOR MIGRATED CASES
-- ==============================================================================
-- PROBLEMA: Los casos migrados que ya estaban cerrados fueron pasados a 
-- "facturada" manualmente con fecha_cierre correcta, pero nunca pasaron 
-- por la lógica de cambiarEstadoCaso que asigna honorarios desde la tabla 
-- precios. Resultado: monto_facturado_estudio, monto_pagado_perito_calle,
-- y monto_pagado_perito_carga están en 0 o NULL para esos casos.
--
-- SOLUCION: Actualizar esos campos usando los valores de la tabla precios,
-- haciendo JOIN por compania_id + tipo_inspeccion = concepto.
-- Solo afecta casos con monto_facturado_estudio = 0 o NULL.
-- ==============================================================================

-- Primero: ver cuántos casos se verían afectados (dry run)
-- SELECT c.id, c.numero_siniestro, c.estado, c.tipo_inspeccion, c.fecha_cierre,
--        c.monto_facturado_estudio, c.monto_pagado_perito_calle, c.monto_pagado_perito_carga,
--        p.valor_estudio, p.valor_perito_calle, p.valor_perito_carga
-- FROM casos c
-- JOIN precios p ON p.compania_id = c.compania_id AND p.concepto = c.tipo_inspeccion
-- WHERE c.estado IN ('ip_cerrada', 'facturada')
--   AND c.fecha_cierre IS NOT NULL
--   AND (c.monto_facturado_estudio IS NULL OR c.monto_facturado_estudio = 0)
--   AND c.tipo_inspeccion IS NOT NULL
--   AND p.tipo = 'honorario';

-- Ejecutar backfill
UPDATE casos c
SET 
    monto_facturado_estudio = p.valor_estudio,
    monto_pagado_perito_calle = p.valor_perito_calle,
    monto_pagado_perito_carga = p.valor_perito_carga,
    updated_at = now()
FROM precios p
WHERE p.compania_id = c.compania_id
  AND p.concepto = c.tipo_inspeccion
  AND p.tipo = 'honorario'
  AND c.estado IN ('ip_cerrada', 'facturada')
  AND c.fecha_cierre IS NOT NULL
  AND (c.monto_facturado_estudio IS NULL OR c.monto_facturado_estudio = 0)
  AND c.tipo_inspeccion IS NOT NULL;
