-- ==============================================================================
-- MIGRATION 034: FIX COMPLETO DE HONORARIOS
-- ==============================================================================
-- PROBLEMA: Los montos de facturación estaban mal asignados por múltiples causas:
--   1. Anti-duplicación guard trataba $0 (intencional) como "nunca asignado"
--   2. Backfills previos (029/031) usaron precios que después cambiaron
--   3. guardarInspeccionCampo y complete/route no asignaban hon. perito calle
--
-- SOLUCION: Reset total de billing basado en valores correctos.
-- ==============================================================================

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ PASO 1: ACTUALIZAR TABLA PRECIOS CON VALORES DEFINITIVOS                ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- PERITO DE CALLE
UPDATE precios SET valor_perito_calle = 4250,  updated_at = now() WHERE concepto = 'ampliacion'        AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 2550,  updated_at = now() WHERE concepto = 'ausente'            AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 9562,  updated_at = now() WHERE concepto = 'ip_camiones'        AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 9562,  updated_at = now() WHERE concepto = 'ip_con_orden'       AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 4250,  updated_at = now() WHERE concepto = 'ip_final_intermedia' AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 8000,  updated_at = now() WHERE concepto = 'ip_remota'          AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 9562,  updated_at = now() WHERE concepto = 'ip_sin_orden'       AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 9562,  updated_at = now() WHERE concepto = 'posible_dt'         AND tipo = 'honorario';
UPDATE precios SET valor_perito_calle = 9562,  updated_at = now() WHERE concepto = 'terceros'           AND tipo = 'honorario';

-- PERITO DE CARGA
UPDATE precios SET valor_perito_carga = 2000,  updated_at = now() WHERE concepto = 'ampliacion'        AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 0,     updated_at = now() WHERE concepto = 'ausente'            AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 8925,  updated_at = now() WHERE concepto = 'ip_camiones'        AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 8925,  updated_at = now() WHERE concepto = 'ip_con_orden'       AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 2000,  updated_at = now() WHERE concepto = 'ip_final_intermedia' AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 8000,  updated_at = now() WHERE concepto = 'ip_remota'          AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 8925,  updated_at = now() WHERE concepto = 'ip_sin_orden'       AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 8925,  updated_at = now() WHERE concepto = 'posible_dt'         AND tipo = 'honorario';
UPDATE precios SET valor_perito_carga = 8925,  updated_at = now() WHERE concepto = 'terceros'           AND tipo = 'honorario';

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ PASO 2: BACKFILL RETROACTIVO — PERITO DE CALLE                          ║
-- ║ Regla: Se paga cuando la IP sale de ip_coordinada (fecha_inspeccion_real)║
-- ║ Excepción: Anuladas no se paga a nadie                                  ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- 2A: Casos CON inspección realizada y NO anulados → asignar monto correcto
UPDATE casos c
SET monto_pagado_perito_calle = p.valor_perito_calle, updated_at = now()
FROM precios p
WHERE p.compania_id = c.compania_id
  AND p.concepto = c.tipo_inspeccion
  AND p.tipo = 'honorario'
  AND c.fecha_inspeccion_real IS NOT NULL
  AND c.estado != 'inspeccion_anulada'
  AND c.tipo_inspeccion IS NOT NULL;

-- 2B: Casos SIN inspección realizada y NO anulados → NULL (no se pagó aún)
UPDATE casos
SET monto_pagado_perito_calle = NULL, updated_at = now()
WHERE fecha_inspeccion_real IS NULL
  AND estado != 'inspeccion_anulada'
  AND monto_pagado_perito_calle IS NOT NULL;

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ PASO 3: BACKFILL RETROACTIVO — PERITO DE CARGA + ESTUDIO               ║
-- ║ Regla: Se paga cuando la IP llega a ip_cerrada                          ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- 3A: Casos CERRADOS → asignar montos correctos
UPDATE casos c
SET 
    monto_pagado_perito_carga = p.valor_perito_carga,
    monto_facturado_estudio = p.valor_estudio,
    updated_at = now()
FROM precios p
WHERE p.compania_id = c.compania_id
  AND p.concepto = c.tipo_inspeccion
  AND p.tipo = 'honorario'
  AND c.estado IN ('ip_cerrada', 'facturada')
  AND c.tipo_inspeccion IS NOT NULL;

-- 3B: Casos NO cerrados → NULL (no se pagó aún)
UPDATE casos
SET monto_pagado_perito_carga = NULL, monto_facturado_estudio = NULL, updated_at = now()
WHERE estado NOT IN ('ip_cerrada', 'facturada', 'inspeccion_anulada')
  AND (monto_pagado_perito_carga IS NOT NULL OR monto_facturado_estudio IS NOT NULL);

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ PASO 4: ANULADAS — Nadie cobra                                          ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

UPDATE casos
SET monto_pagado_perito_calle = 0,
    monto_pagado_perito_carga = 0,
    monto_facturado_estudio = 0,
    updated_at = now()
WHERE estado = 'inspeccion_anulada';
