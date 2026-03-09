-- ==============================================================================
-- 017_fase15_usuarios_cascade.sql
-- Fase 15: Fix de Migración de Peritos (Foreign Keys a ON UPDATE CASCADE)
-- ==============================================================================
-- Esta migración modifica las claves foráneas que apuntan a la tabla "usuarios"
-- para permitir que el ID de un usuario pueda ser actualizado (cascada) 
-- cuando se genera su perfil correspondiente en auth.users.

BEGIN;

-- 1. Casos
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_perito_calle_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_perito_calle_id_fkey FOREIGN KEY (perito_calle_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_perito_carga_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_perito_carga_id_fkey FOREIGN KEY (perito_carga_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

-- 2. Informes Periciales
ALTER TABLE informes_periciales DROP CONSTRAINT IF EXISTS informes_periciales_perito_id_fkey;
ALTER TABLE informes_periciales ADD CONSTRAINT informes_periciales_perito_id_fkey FOREIGN KEY (perito_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

-- 3. Fotos de Inspección
ALTER TABLE fotos_inspeccion DROP CONSTRAINT IF EXISTS fotos_inspeccion_usuario_id_fkey;
ALTER TABLE fotos_inspeccion ADD CONSTRAINT fotos_inspeccion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

-- 4. Tareas
ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_creador_id_fkey;
ALTER TABLE tareas ADD CONSTRAINT tareas_creador_id_fkey FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_asignado_id_fkey;
ALTER TABLE tareas ADD CONSTRAINT tareas_asignado_id_fkey FOREIGN KEY (asignado_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

-- 5. Notas Caso
ALTER TABLE notas_caso DROP CONSTRAINT IF EXISTS notas_caso_usuario_id_fkey;
ALTER TABLE notas_caso ADD CONSTRAINT notas_caso_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

-- 6. Historial Estados
ALTER TABLE historial_estados DROP CONSTRAINT IF EXISTS historial_estados_usuario_id_fkey;
ALTER TABLE historial_estados ADD CONSTRAINT historial_estados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

-- 7. Kilometraje Diario
ALTER TABLE kilometraje_diario DROP CONSTRAINT IF EXISTS kilometraje_diario_perito_id_fkey;
ALTER TABLE kilometraje_diario ADD CONSTRAINT kilometraje_diario_perito_id_fkey FOREIGN KEY (perito_id) REFERENCES usuarios(id) ON UPDATE CASCADE;

COMMIT;
