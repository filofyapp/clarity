-- ==============================================================================
-- 020_fase19_usuarios_on_delete.sql
-- Fase 19: Arreglar Foreign Keys al Eliminar Usuarios (Peritos/Gestores)
-- ==============================================================================
-- Al intentar borrar un perito, la BD arrojaba error de constraint por tablas
-- que dependían del ID. Esta migración actualiza todas las foreign keys a 
-- "ON DELETE SET NULL" (para no borrar historial/casos) o "ON DELETE CASCADE"
-- (para notificaciones efímeras).

BEGIN;

-- 1. Casos (Mantenemos el caso, el perito_id queda en NULL)
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_perito_calle_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_perito_calle_id_fkey FOREIGN KEY (perito_calle_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_perito_carga_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_perito_carga_id_fkey FOREIGN KEY (perito_carga_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 2. Informes Periciales (Mantenemos el informe)
ALTER TABLE informes_periciales DROP CONSTRAINT IF EXISTS informes_periciales_perito_id_fkey;
ALTER TABLE informes_periciales ADD CONSTRAINT informes_periciales_perito_id_fkey FOREIGN KEY (perito_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 3. Fotos de Inspección
ALTER TABLE fotos_inspeccion DROP CONSTRAINT IF EXISTS fotos_inspeccion_usuario_id_fkey;
ALTER TABLE fotos_inspeccion ADD CONSTRAINT fotos_inspeccion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 4. Tareas
ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_creador_id_fkey;
ALTER TABLE tareas ADD CONSTRAINT tareas_creador_id_fkey FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_asignado_id_fkey;
ALTER TABLE tareas ADD CONSTRAINT tareas_asignado_id_fkey FOREIGN KEY (asignado_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 5. Notas Caso
ALTER TABLE notas_caso DROP CONSTRAINT IF EXISTS notas_caso_usuario_id_fkey;
ALTER TABLE notas_caso ADD CONSTRAINT notas_caso_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 6. Historial Estados
ALTER TABLE historial_estados DROP CONSTRAINT IF EXISTS historial_estados_usuario_id_fkey;
ALTER TABLE historial_estados ADD CONSTRAINT historial_estados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- 7. Kilometraje Diario (Si se borra el perito, borramos su hoja de ruta diaria porque no sirve sin el)
ALTER TABLE kilometraje_diario DROP CONSTRAINT IF EXISTS kilometraje_diario_perito_id_fkey;
ALTER TABLE kilometraje_diario ADD CONSTRAINT kilometraje_diario_perito_id_fkey FOREIGN KEY (perito_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 8. Precio Historial
ALTER TABLE precio_historial DROP CONSTRAINT IF EXISTS precio_historial_modificado_por_fkey;
ALTER TABLE precio_historial ADD CONSTRAINT precio_historial_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


-- TABLAS CON ON DELETE CASCADE EFÍMERAS:
-- 9. Notificaciones (Si se borra el usuario, borramos sus notificaciones)
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_usuario_destino_id_fkey;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_usuario_destino_id_fkey FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 10. Tarea Participantes y Lecturas
ALTER TABLE tarea_participantes DROP CONSTRAINT IF EXISTS tarea_participantes_usuario_id_fkey;
ALTER TABLE tarea_participantes ADD CONSTRAINT tarea_participantes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE comentario_lectura DROP CONSTRAINT IF EXISTS comentario_lectura_usuario_id_fkey;
ALTER TABLE comentario_lectura ADD CONSTRAINT comentario_lectura_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 11. Comentarios Tarea: Para no borrar el comentario y romper el hilo, lo pasamos a NULL
ALTER TABLE comentarios_tarea ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE comentarios_tarea DROP CONSTRAINT IF EXISTS comentarios_tarea_usuario_id_fkey;
ALTER TABLE comentarios_tarea ADD CONSTRAINT comentarios_tarea_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
