-- Migration para tabla de reacciones con emojis en tareas y comentarios

-- Tabla para reacciones en comentarios
CREATE TABLE IF NOT EXISTS public.reacciones_comentario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comentario_id UUID NOT NULL REFERENCES public.comentarios_tarea(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comentario_id, usuario_id, emoji)
);

-- Tabla para reacciones en la propia tarea (descripción)
CREATE TABLE IF NOT EXISTS public.reacciones_tarea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID NOT NULL REFERENCES public.tareas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tarea_id, usuario_id, emoji)
);

-- Enable RLS
ALTER TABLE public.reacciones_comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reacciones_tarea ENABLE ROW LEVEL SECURITY;

-- Policies para reacciones_comentario
CREATE POLICY "Lectura de reacciones_comentario autenticada" 
ON public.reacciones_comentario FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Inserción de reacciones_comentario autenticada" 
ON public.reacciones_comentario FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Borrado de reacciones_comentario propio" 
ON public.reacciones_comentario FOR DELETE USING (auth.uid() = usuario_id);

-- Policies para reacciones_tarea
CREATE POLICY "Lectura de reacciones_tarea autenticada" 
ON public.reacciones_tarea FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Inserción de reacciones_tarea autenticada" 
ON public.reacciones_tarea FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Borrado de reacciones_tarea propio" 
ON public.reacciones_tarea FOR DELETE USING (auth.uid() = usuario_id);

-- Agregar a Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reacciones_comentario;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reacciones_tarea;
