-- ============================================
-- 030: Optimización de Índices para Performance
-- BUG-022: Fix Disk IO Throttling por Sequential Scans
-- Fecha: 2026-03-20
-- ============================================
-- Contexto: Los filtros múltiples en CasosTable, los JOINs del módulo 
-- Kilometraje v2, y las consultas de reportes provocan Sequential Scans 
-- masivos porque las columnas críticas de filtrado/JOIN no están indexadas.
-- Solución: Índices B-Tree estándar en las columnas más consultadas.
-- ============================================

-- ════════════════════════════════════════════
-- TABLA: casos
-- Razón: Filtros multi-select, rangos de fecha, JOINs con usuarios/gestores
-- ════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_casos_estado 
    ON casos (estado);

CREATE INDEX IF NOT EXISTS idx_casos_fecha_derivacion 
    ON casos (fecha_derivacion);

CREATE INDEX IF NOT EXISTS idx_casos_fecha_inspeccion_programada 
    ON casos (fecha_inspeccion_programada);

CREATE INDEX IF NOT EXISTS idx_casos_fecha_carga_sistema 
    ON casos (fecha_carga_sistema);

CREATE INDEX IF NOT EXISTS idx_casos_fecha_cierre 
    ON casos (fecha_cierre);

CREATE INDEX IF NOT EXISTS idx_casos_perito_calle_id 
    ON casos (perito_calle_id);

CREATE INDEX IF NOT EXISTS idx_casos_perito_carga_id 
    ON casos (perito_carga_id);

CREATE INDEX IF NOT EXISTS idx_casos_gestor_id 
    ON casos (gestor_id);

-- ════════════════════════════════════════════
-- TABLA: historial_estados
-- Razón: ULTRA CRÍTICO — JOINs de Kilometraje v2, Timeline, Reportes.
-- Sin estos índices, cada consulta de km o reporte escanea el disco completo.
-- ════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_historial_estados_caso_id 
    ON historial_estados (caso_id);

CREATE INDEX IF NOT EXISTS idx_historial_estados_estado_nuevo 
    ON historial_estados (estado_nuevo);

CREATE INDEX IF NOT EXISTS idx_historial_estados_created_at 
    ON historial_estados (created_at);

-- ════════════════════════════════════════════
-- TABLA: tareas
-- Razón: Kanban filtra por estado, "mis tareas" filtra por asignado_id,
-- y el expediente hace JOIN por caso_id.
-- ════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tareas_caso_id 
    ON tareas (caso_id);

CREATE INDEX IF NOT EXISTS idx_tareas_estado 
    ON tareas (estado);

CREATE INDEX IF NOT EXISTS idx_tareas_asignado_id 
    ON tareas (asignado_id);
