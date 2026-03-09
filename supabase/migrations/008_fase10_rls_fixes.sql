-- FASE 10: RLS Fixes for Directorios

-- Fix herramientas_usuarios
DROP POLICY IF EXISTS "herramientas_acceso" ON herramientas_usuarios;

CREATE POLICY "herramientas_acceso" ON herramientas_usuarios 
    FOR ALL 
    USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'))
    WITH CHECK (auth.jwt() ->> 'rol' IN ('admin', 'carga'));

-- Fix valores_chapa_pintura
DROP POLICY IF EXISTS "valores_edicion" ON valores_chapa_pintura;

CREATE POLICY "valores_edicion" ON valores_chapa_pintura 
    FOR ALL 
    USING (auth.jwt() ->> 'rol' = 'admin')
    WITH CHECK (auth.jwt() ->> 'rol' = 'admin');
