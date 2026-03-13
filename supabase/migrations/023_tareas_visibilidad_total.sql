-- Migration: Permite que TODOS los usuarios autenticados vean TODAS las tareas
-- Antes: solo el creador, asignado o admin podían ver cada tarea
-- Ahora: cualquier usuario con sesión ve todas las tareas

-- Eliminar la policy restrictiva existente
DROP POLICY IF EXISTS "tareas_visibilidad" ON tareas;

-- Nueva policy: todos los autenticados pueden leer todas las tareas
CREATE POLICY "tareas_visibilidad" ON tareas FOR SELECT 
USING (auth.role() = 'authenticated');

-- Asegurar que UPDATE/INSERT/DELETE también funcionen para autenticados
-- (ya existe una policy ALL en algunas migraciones previas, pero por seguridad:)
DROP POLICY IF EXISTS "tareas_modificacion" ON tareas;
CREATE POLICY "tareas_modificacion" ON tareas FOR UPDATE 
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tareas_insercion" ON tareas;
CREATE POLICY "tareas_insercion" ON tareas FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Comentarios: asegurar que todos puedan leer y escribir
-- (ya existe comentarios_tarea_all en 002, pero verificamos)
