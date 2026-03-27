-- Migration: Agregar columna editado_el a informe_inspeccion_campo
-- Para el Audit Trail de ediciones post-envío del informe presencial.
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE informe_inspeccion_campo
ADD COLUMN IF NOT EXISTS editado_el TIMESTAMPTZ;

COMMENT ON COLUMN informe_inspeccion_campo.editado_el IS 'Timestamp de la última edición post-envío. NULL si nunca fue editado.';
