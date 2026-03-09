ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;
