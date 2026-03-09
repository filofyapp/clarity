-- FASE 7.2: Permisos de Expediente (Transparencia Total Lectura)
-- El usuario solicita que cualquier persona logueada pueda VER un expediente y sus adjuntos/informes, para maximizar transparencia.

-- 1. Casos: Lectura global
DROP POLICY IF EXISTS "visibilidad_casos" ON casos;
CREATE POLICY "visibilidad_casos" ON casos FOR SELECT USING (true);

-- 2. Fotos Inspeccion: Lectura global
DROP POLICY IF EXISTS "fotos_lectura" ON fotos_inspeccion;
CREATE POLICY "fotos_lectura" ON fotos_inspeccion FOR SELECT USING (true);

-- 3. Informes Periciales: Lectura global
DROP POLICY IF EXISTS "informes_lectura" ON informes_periciales;
CREATE POLICY "informes_lectura" ON informes_periciales FOR SELECT USING (true);

-- Nota: Las políticas de INSERT/UPDATE ("fotos_upload", "informes_edicion", "casos_update" etc)
-- permanecen intactas para que SOLO el asignado o el ADMIN puedan modificar los expedientes.
