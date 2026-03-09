-- ==============================================================================
-- 014_fase15_fix_restricciones_notificaciones_y_roles.sql
-- Fase 15: Fix Eliminacion Casos y Multiples Roles Backup
-- ==============================================================================

-- 1. Arreglar Constraint de Notificaciones cuando se borra un caso
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_caso_id_fkey;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_caso_id_fkey FOREIGN KEY (caso_id) REFERENCES casos(id) ON DELETE CASCADE;

-- 2. Asegurar que las notificaciones de tareas se borren al borrar una tarea
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tarea_id_fkey;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tarea_id_fkey FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE;

-- 3. (Opcional) Soporte a futuro para multiples roles si se requiere
-- Añadimos la columna roles como un arreglo de texto, migrando el rol actual
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}'::TEXT[];

-- Migrar datos de 'rol' a 'roles'
UPDATE usuarios SET roles = ARRAY[rol] WHERE array_length(roles, 1) IS NULL OR array_length(roles, 1) = 0;

-- 4. Ampliar restricción de 'rol' si es necesaria para 'coordinador' (aunque mantenemos admin como principal)
-- Como el Check Constraint original era rol IN ('admin', 'carga', 'calle'), lo reemplazamos por seguridad:
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'carga', 'calle', 'coordinador'));

-- Nota: El Frontend usará 'admin' como coordinador principal.
