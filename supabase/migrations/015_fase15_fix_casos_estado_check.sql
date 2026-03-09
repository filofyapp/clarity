-- ==============================================================================
-- 015_fase15_fix_casos_estado_check.sql
-- Fase 15: Expandir Constraint de Estados de Casos
-- ==============================================================================

-- Ampliar la restricción 'casos_estado_check' para incluir todos los estados actuales 
-- manejados por la aplicación, incluyendo 'licitando', 'facturada', etc.

ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_estado_check;
ALTER TABLE casos ADD CONSTRAINT casos_estado_check CHECK (estado IN (
    'ip_coordinada', 
    'pendiente_coordinacion', 
    'pdte_coordinacion', -- alias
    'contactado', 
    'en_consulta_cia', 
    'pendiente_carga', 
    'pendiente_presupuesto', 
    'pdte_presupuesto', -- alias 
    'licitando_repuestos', 
    'licitando', -- alias
    'ip_reclamada_perito', 
    'reclamado_perito', -- alias
    'esperando_respuesta_tercero', 
    'esp_respuesta_cia', -- alias
    'ip_cerrada', 
    'anulado',
    'facturada'
));
