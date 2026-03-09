-- ==============================================================================
-- MIGRACIÓN FASE 5: Ajustes Funcionales y Estructurales
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA TALLERES (F5.4)
-- Añadir columna booleana hace_remotas
-- ------------------------------------------------------------------------------
ALTER TABLE talleres 
ADD COLUMN IF NOT EXISTS hace_remotas BOOLEAN DEFAULT false;

-- ------------------------------------------------------------------------------
-- 2. TABLA PRECIOS (F5.3)
-- Dividir valor_perito en valor_perito_calle y valor_perito_carga
-- ------------------------------------------------------------------------------
-- Primero añadimos la nueva columna para el perito de carga
ALTER TABLE precios 
ADD COLUMN IF NOT EXISTS valor_perito_carga DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Renombramos la columna existente de valor_perito a valor_perito_calle
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='precios' AND column_name='valor_perito') THEN
    ALTER TABLE precios RENAME COLUMN valor_perito TO valor_perito_calle;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TABLA TAREAS (F5.1)
-- Check constraints ('pendiente', 'en_proceso', 'resuelta') y UPDATE automático
-- ------------------------------------------------------------------------------
-- IMPORTANTE: Primero ELIMINAR el constraint viejo para que nos deje hacer los UPDATE
ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_estado_check;

-- Ahora actualizamos los registros existentes al nuevo formato
UPDATE tareas SET estado = 'pendiente' WHERE estado = 'sin_gestion';
UPDATE tareas SET estado = 'en_proceso' WHERE estado = 'realizando';
UPDATE tareas SET estado = 'resuelta' WHERE estado IN ('realizado', 'respondido');

-- Si hay algún otro estado raro, lo pasamos a pendiente por seguridad
UPDATE tareas SET estado = 'pendiente' WHERE estado NOT IN ('pendiente', 'en_proceso', 'resuelta');

-- Finalmente, añadimos el NUEVO constraint con los estados correctos
ALTER TABLE tareas ADD CONSTRAINT tareas_estado_check 
CHECK (estado IN ('pendiente', 'en_proceso', 'resuelta'));


-- ------------------------------------------------------------------------------
-- 4. TABLAS MULTI-PARTICIPANTES EN TAREAS (F5.2)
-- Crear tabla tarea_participantes y migrar asignado_id
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarea_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tarea_id, usuario_id)
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE tarea_participantes ENABLE ROW LEVEL SECURITY;

-- Políticas para tarea_participantes
DROP POLICY IF EXISTS "tarea_participantes_all" ON tarea_participantes;
CREATE POLICY "tarea_participantes_all" ON tarea_participantes
FOR ALL USING (auth.uid() IS NOT NULL);

-- Opcional: Migrar los asignados actuales a la nueva tabla de participantes
INSERT INTO tarea_participantes (tarea_id, usuario_id)
SELECT id, asignado_id 
FROM tareas 
WHERE asignado_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Nota: Por ahora NO eliminamos la columna asignado_id de la tabla tareas
-- para mantener retrocompatibilidad hasta que todo el frontend esté migrado.
