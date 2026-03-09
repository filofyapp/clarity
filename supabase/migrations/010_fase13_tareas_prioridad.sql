-- Drop older constraint
ALTER TABLE "public"."tareas" DROP CONSTRAINT IF EXISTS "tareas_prioridad_check";

-- Add updated constraint including "alfredo"
ALTER TABLE "public"."tareas" ADD CONSTRAINT "tareas_prioridad_check" CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente', 'alfredo'));
