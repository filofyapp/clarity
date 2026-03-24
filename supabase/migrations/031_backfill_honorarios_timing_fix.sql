-- ==============================================================================
-- MIGRATION 031: BACKFILL HONORARIOS TIMING FIX (RETROACTIVO)
-- ==============================================================================
-- PROBLEMA: monto_pagado_perito_calle y monto_pagado_perito_carga se asignaban
-- AMBOS solo al llegar a ip_cerrada. Esto dejaba P.Calle en $0 para todos los
-- casos que aún no se cerraron. También generaba métricas inconsistentes.
--
-- FIX RETROACTIVO:
-- 1. Asignar monto_pagado_perito_calle a TODOS los casos que ya pasaron por
--    inspección (tienen fecha_inspeccion_real) y no tienen el monto.
-- 2. Asignar monto_pagado_perito_carga a TODOS los casos cerrados que no
--    tienen el monto.
-- 3. Asignar monto_facturado_estudio a TODOS los casos cerrados que no
--    tienen el monto.
-- ==============================================================================

-- ═══ PASO 1: P.CALLE — Para todo caso con inspección realizada ═══
-- Se paga al perito de calle cuando COMPLETA la inspección.
-- Criterio: tiene fecha_inspeccion_real (significa que fue al lugar o hizo remota)
UPDATE casos c
SET 
    monto_pagado_perito_calle = p.valor_perito_calle,
    updated_at = now()
FROM precios p
WHERE p.compania_id = c.compania_id
  AND p.concepto = c.tipo_inspeccion
  AND p.tipo = 'honorario'
  AND c.fecha_inspeccion_real IS NOT NULL
  AND (c.monto_pagado_perito_calle IS NULL OR c.monto_pagado_perito_calle = 0)
  AND c.tipo_inspeccion IS NOT NULL
  AND c.tipo_inspeccion != 'sin_honorarios'
  AND c.estado != 'inspeccion_anulada';

-- ═══ PASO 2: P.CARGA — Para todo caso cerrado ═══
-- Se paga al perito de carga cuando cierra el expediente (ip_cerrada/facturada)
UPDATE casos c
SET
    monto_pagado_perito_carga = p.valor_perito_carga,
    updated_at = now()
FROM precios p
WHERE p.compania_id = c.compania_id
  AND p.concepto = c.tipo_inspeccion
  AND p.tipo = 'honorario'
  AND c.estado IN ('ip_cerrada', 'facturada')
  AND c.fecha_cierre IS NOT NULL
  AND (c.monto_pagado_perito_carga IS NULL OR c.monto_pagado_perito_carga = 0)
  AND c.tipo_inspeccion IS NOT NULL
  AND c.tipo_inspeccion != 'sin_honorarios';

-- ═══ PASO 3: ESTUDIO — Para todo caso cerrado sin monto ═══
UPDATE casos c
SET
    monto_facturado_estudio = p.valor_estudio,
    updated_at = now()
FROM precios p
WHERE p.compania_id = c.compania_id
  AND p.concepto = c.tipo_inspeccion
  AND p.tipo = 'honorario'
  AND c.estado IN ('ip_cerrada', 'facturada')
  AND c.fecha_cierre IS NOT NULL
  AND (c.monto_facturado_estudio IS NULL OR c.monto_facturado_estudio = 0)
  AND c.tipo_inspeccion IS NOT NULL
  AND c.tipo_inspeccion != 'sin_honorarios';
