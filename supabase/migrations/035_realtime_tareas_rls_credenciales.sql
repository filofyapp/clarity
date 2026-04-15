-- Migración 035: Realtime para tareas + Fix RLS herramientas_usuarios para carga
-- FECHA: 15/04/2026
-- DESCRIPCIÓN: 
--   1) Agrega tabla 'tareas' a la publicación supabase_realtime para habilitar cambios en tiempo real
--   2) Corrige RLS de herramientas_usuarios para que admin Y carga puedan INSERT/UPDATE/DELETE

-- ===========================================
-- 1) REALTIME PARA TAREAS
-- ===========================================
-- Intentar agregar. Si ya está, el DO NOTHING previene error.
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tareas;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Table tareas already in supabase_realtime publication';
END;
$$;

-- ===========================================
-- 2) FIX RLS herramientas_usuarios PARA CARGA
-- ===========================================
-- El problema: la política INSERT actual solo permite admin.
-- Los peritos de carga necesitan poder crear/editar/eliminar credenciales.

-- Borrar políticas existentes
DROP POLICY IF EXISTS "herramientas_usuarios_select" ON herramientas_usuarios;
DROP POLICY IF EXISTS "herramientas_usuarios_insert" ON herramientas_usuarios;
DROP POLICY IF EXISTS "herramientas_usuarios_update" ON herramientas_usuarios;
DROP POLICY IF EXISTS "herramientas_usuarios_delete" ON herramientas_usuarios;
DROP POLICY IF EXISTS "Acceso total admin herramientas" ON herramientas_usuarios;
DROP POLICY IF EXISTS "Solo admin puede gestionar herramientas" ON herramientas_usuarios;

-- Crear políticas granulares con soporte admin + carga
-- SELECT: admin y carga pueden ver
CREATE POLICY "herramientas_select_admin_carga" ON herramientas_usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() 
            AND (u.rol IN ('admin', 'carga') OR u.roles && ARRAY['admin', 'carga']::text[])
        )
    );

-- INSERT: admin y carga pueden crear
CREATE POLICY "herramientas_insert_admin_carga" ON herramientas_usuarios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() 
            AND (u.rol IN ('admin', 'carga') OR u.roles && ARRAY['admin', 'carga']::text[])
        )
    );

-- UPDATE: admin y carga pueden editar
CREATE POLICY "herramientas_update_admin_carga" ON herramientas_usuarios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() 
            AND (u.rol IN ('admin', 'carga') OR u.roles && ARRAY['admin', 'carga']::text[])
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() 
            AND (u.rol IN ('admin', 'carga') OR u.roles && ARRAY['admin', 'carga']::text[])
        )
    );

-- DELETE: admin y carga pueden borrar
CREATE POLICY "herramientas_delete_admin_carga" ON herramientas_usuarios
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() 
            AND (u.rol IN ('admin', 'carga') OR u.roles && ARRAY['admin', 'carga']::text[])
        )
    );
