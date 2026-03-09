-- =========================================
-- MIGRACIÓN DB — AOMNIS v2
-- Tablas nuevas según DOC_TECNICA §3.3
-- Modificaciones según DOC_TECNICA §3.4
-- Triggers a eliminar según DOC_TECNICA §3.5
-- =========================================

-- ─── 1. TABLA: tarea_participantes ───
CREATE TABLE IF NOT EXISTS tarea_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tarea_id, usuario_id)
);

-- ─── 2. TABLA: comentarios_tarea ───
CREATE TABLE IF NOT EXISTS comentarios_tarea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    contenido TEXT NOT NULL,
    adjuntos JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. TABLA: comentario_lectura ───
CREATE TABLE IF NOT EXISTS comentario_lectura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comentario_id UUID NOT NULL REFERENCES comentarios_tarea(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    leido BOOLEAN DEFAULT false,
    fecha_lectura TIMESTAMPTZ,
    UNIQUE(comentario_id, usuario_id)
);

-- ─── 4. TABLA: notificaciones ───
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_destino_id UUID NOT NULL REFERENCES usuarios(id),
    tipo TEXT NOT NULL, -- inspeccion_realizada, tarea_asignada, mencion, tarea_estado_cambiado, pendiente_presupuesto
    caso_id UUID REFERENCES casos(id),
    tarea_id UUID REFERENCES tareas(id),
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. TABLA: precio_historial ───
CREATE TABLE IF NOT EXISTS precio_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    precio_id UUID NOT NULL REFERENCES precios(id),
    valor_estudio_anterior DECIMAL,
    valor_perito_anterior DECIMAL,
    valor_estudio_nuevo DECIMAL,
    valor_perito_nuevo DECIMAL,
    modificado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. MODIFICACIONES A TABLAS EXISTENTES ───

-- Talleres: agregar campo hace_remotas
ALTER TABLE talleres ADD COLUMN IF NOT EXISTS hace_remotas BOOLEAN DEFAULT false;

-- ─── 7. ÍNDICES ───
CREATE INDEX IF NOT EXISTS idx_tarea_participantes_tarea ON tarea_participantes(tarea_id);
CREATE INDEX IF NOT EXISTS idx_tarea_participantes_usuario ON tarea_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_tarea_tarea ON comentarios_tarea(tarea_id);
CREATE INDEX IF NOT EXISTS idx_comentario_lectura_comentario ON comentario_lectura(comentario_id);
CREATE INDEX IF NOT EXISTS idx_comentario_lectura_usuario ON comentario_lectura(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_destino_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(usuario_destino_id, leida);

-- ─── 8. TRIGGERS A ELIMINAR (DOC_TECNICA §3.5) ───
-- El trigger vive en informes_periciales, no en casos
DROP TRIGGER IF EXISTS trg_transicion_pendiente_carga ON informes_periciales;
DROP TRIGGER IF EXISTS check_transicion_pendiente_carga ON casos;
DROP FUNCTION IF EXISTS fn_check_transicion_pendiente_carga() CASCADE;

DROP TRIGGER IF EXISTS check_transicion_por_foto ON casos;
DROP FUNCTION IF EXISTS fn_check_transicion_por_foto() CASCADE;

-- MANTENER: fn_evaluar_informe_completo (utilidad interna, no afecta estados)

-- ─── 10. SUPABASE STORAGE BUCKET ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('caso-archivos', 'caso-archivos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para que usuarios autenticados puedan subir/leer/borrar archivos
DROP POLICY IF EXISTS "caso_archivos_select" ON storage.objects;
CREATE POLICY "caso_archivos_select" ON storage.objects FOR SELECT
    USING (bucket_id = 'caso-archivos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "caso_archivos_insert" ON storage.objects;
CREATE POLICY "caso_archivos_insert" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'caso-archivos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "caso_archivos_delete" ON storage.objects;
CREATE POLICY "caso_archivos_delete" ON storage.objects FOR DELETE
    USING (bucket_id = 'caso-archivos' AND auth.uid() IS NOT NULL);

-- ─── 9. RLS POLICIES ───
ALTER TABLE tarea_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario_lectura ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE precio_historial ENABLE ROW LEVEL SECURITY;

-- Policies permisivas para usuarios autenticados
-- PostgreSQL no soporta IF NOT EXISTS para policies, usamos DROP+CREATE
DROP POLICY IF EXISTS "tarea_participantes_all" ON tarea_participantes;
CREATE POLICY "tarea_participantes_all" ON tarea_participantes FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "comentarios_tarea_all" ON comentarios_tarea;
CREATE POLICY "comentarios_tarea_all" ON comentarios_tarea FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "comentario_lectura_all" ON comentario_lectura;
CREATE POLICY "comentario_lectura_all" ON comentario_lectura FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notificaciones_select" ON notificaciones;
CREATE POLICY "notificaciones_select" ON notificaciones FOR SELECT USING (usuario_destino_id = auth.uid());

DROP POLICY IF EXISTS "notificaciones_update" ON notificaciones;
CREATE POLICY "notificaciones_update" ON notificaciones FOR UPDATE USING (usuario_destino_id = auth.uid());

DROP POLICY IF EXISTS "notificaciones_insert" ON notificaciones;
CREATE POLICY "notificaciones_insert" ON notificaciones FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "precio_historial_all" ON precio_historial;
CREATE POLICY "precio_historial_all" ON precio_historial FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── DONE ───
-- Ejecutar este script en Supabase SQL Editor
-- Todas las sentencias son idempotentes (IF NOT EXISTS / DROP IF EXISTS + CREATE)

