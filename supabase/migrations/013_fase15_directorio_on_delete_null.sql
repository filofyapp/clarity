-- ==============================================================================
-- 013_fase15_directorio_on_delete_null.sql
-- Fase 15: Fix Eliminacion de Entidades del Directorio
-- Modifica las foreign keys de 'casos' hacia el Directorio para evitar bloqueos
-- al borrar Gestores, Talleres o Peritos. En su lugar, pone nulo (Sin Asignar).
-- ==============================================================================

-- 1. Talleres
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_taller_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_taller_id_fkey FOREIGN KEY (taller_id) REFERENCES talleres(id) ON DELETE SET NULL;

-- 2. Gestores
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_gestor_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES gestores(id) ON DELETE SET NULL;

-- 3. Perito Calle
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_perito_calle_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_perito_calle_id_fkey FOREIGN KEY (perito_calle_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 4. Perito Carga
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_perito_carga_id_fkey;
ALTER TABLE casos ADD CONSTRAINT casos_perito_carga_id_fkey FOREIGN KEY (perito_carga_id) REFERENCES usuarios(id) ON DELETE SET NULL;
