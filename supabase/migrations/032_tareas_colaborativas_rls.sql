-- ==============================================================================
-- MIGRACIÓN 032: Tareas Colaborativas - Saneamiento RLS
-- Fecha: 25/03/2026
-- Objetivo: Asegurar que TODOS los usuarios autenticados puedan hacer
-- SELECT, INSERT, UPDATE, DELETE en las tablas de tareas y su ecosistema.
-- Razón: Las políticas FOR ALL + USING sin WITH CHECK pueden bloquear INSERT.
-- ==============================================================================

-- ─── 1. comentarios_tarea ───
DROP POLICY IF EXISTS "comentarios_tarea_all" ON comentarios_tarea;
DROP POLICY IF EXISTS "comentarios_tarea_select" ON comentarios_tarea;
DROP POLICY IF EXISTS "comentarios_tarea_insert" ON comentarios_tarea;
DROP POLICY IF EXISTS "comentarios_tarea_update" ON comentarios_tarea;
DROP POLICY IF EXISTS "comentarios_tarea_delete" ON comentarios_tarea;

CREATE POLICY "comentarios_tarea_select" ON comentarios_tarea FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "comentarios_tarea_insert" ON comentarios_tarea FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "comentarios_tarea_update" ON comentarios_tarea FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "comentarios_tarea_delete" ON comentarios_tarea FOR DELETE
  USING (auth.role() = 'authenticated');


-- ─── 2. tarea_participantes ───
DROP POLICY IF EXISTS "tarea_participantes_all" ON tarea_participantes;
DROP POLICY IF EXISTS "tarea_participantes_select" ON tarea_participantes;
DROP POLICY IF EXISTS "tarea_participantes_insert" ON tarea_participantes;
DROP POLICY IF EXISTS "tarea_participantes_update" ON tarea_participantes;
DROP POLICY IF EXISTS "tarea_participantes_delete" ON tarea_participantes;

CREATE POLICY "tarea_participantes_select" ON tarea_participantes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "tarea_participantes_insert" ON tarea_participantes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tarea_participantes_update" ON tarea_participantes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "tarea_participantes_delete" ON tarea_participantes FOR DELETE
  USING (auth.role() = 'authenticated');


-- ─── 3. comentario_lectura ───
DROP POLICY IF EXISTS "comentario_lectura_all" ON comentario_lectura;
DROP POLICY IF EXISTS "comentario_lectura_select" ON comentario_lectura;
DROP POLICY IF EXISTS "comentario_lectura_insert" ON comentario_lectura;
DROP POLICY IF EXISTS "comentario_lectura_update" ON comentario_lectura;

CREATE POLICY "comentario_lectura_select" ON comentario_lectura FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "comentario_lectura_insert" ON comentario_lectura FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "comentario_lectura_update" ON comentario_lectura FOR UPDATE
  USING (auth.role() = 'authenticated');


-- ─── 4. reacciones_comentario ───
DROP POLICY IF EXISTS "reacciones_comentario_all" ON reacciones_comentario;
DROP POLICY IF EXISTS "reacciones_comentario_select" ON reacciones_comentario;
DROP POLICY IF EXISTS "reacciones_comentario_insert" ON reacciones_comentario;
DROP POLICY IF EXISTS "reacciones_comentario_delete" ON reacciones_comentario;

CREATE POLICY "reacciones_comentario_select" ON reacciones_comentario FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "reacciones_comentario_insert" ON reacciones_comentario FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reacciones_comentario_delete" ON reacciones_comentario FOR DELETE
  USING (auth.role() = 'authenticated');


-- ─── 5. reacciones_tarea ───
DROP POLICY IF EXISTS "reacciones_tarea_all" ON reacciones_tarea;
DROP POLICY IF EXISTS "reacciones_tarea_select" ON reacciones_tarea;
DROP POLICY IF EXISTS "reacciones_tarea_insert" ON reacciones_tarea;
DROP POLICY IF EXISTS "reacciones_tarea_delete" ON reacciones_tarea;

CREATE POLICY "reacciones_tarea_select" ON reacciones_tarea FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "reacciones_tarea_insert" ON reacciones_tarea FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reacciones_tarea_delete" ON reacciones_tarea FOR DELETE
  USING (auth.role() = 'authenticated');


-- ─── 6. tareas (reforzar — ya tiene políticas en 023 pero reforzamos DELETE) ───
DROP POLICY IF EXISTS "tareas_delete" ON tareas;
CREATE POLICY "tareas_delete" ON tareas FOR DELETE
  USING (auth.role() = 'authenticated');
