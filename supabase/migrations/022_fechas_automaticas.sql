-- Migration: 022_fechas_automaticas
-- Description: Agrega columna link_enviado para indicador visual en Mi Agenda.
-- Las columnas fecha_carga_sistema y fecha_cierre YA EXISTEN en la tabla casos (001_initial_schema.sql).
-- La lógica de auto-seteo se maneja en el código TypeScript (actions.ts).

-- link_enviado: Para que el perito de calle marque si envió el link de inspección remota
ALTER TABLE casos ADD COLUMN IF NOT EXISTS link_enviado BOOLEAN DEFAULT false;
