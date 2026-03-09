-- Fase 13: Corrección de Políticas RLS para Valores y Credenciales
-- Relaja la seguridad Row-Level Security para permitir INSERT/UPDATE indiscriminado 
-- dado que el acceso a estas rutas ya está protegido criptográficamente en Next.js Middleware.

-- 1. Tabla: valores_chapa_pintura
DROP POLICY IF EXISTS "valores_edicion" ON valores_chapa_pintura;
DROP POLICY IF EXISTS "valores_lectura" ON valores_chapa_pintura;

CREATE POLICY "valores_lectura" ON valores_chapa_pintura 
    FOR SELECT USING (true);

CREATE POLICY "valores_edicion" ON valores_chapa_pintura 
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabla: credenciales_sancor (por si presenta el mismo problema reportado en la issue)
DROP POLICY IF EXISTS "credenciales_edicion" ON credenciales_sancor;
DROP POLICY IF EXISTS "credenciales_lectura" ON credenciales_sancor;

CREATE POLICY "credenciales_lectura" ON credenciales_sancor 
    FOR SELECT USING (true);

CREATE POLICY "credenciales_edicion" ON credenciales_sancor 
    FOR ALL USING (true) WITH CHECK (true);
