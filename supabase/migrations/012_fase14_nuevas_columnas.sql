-- Migración Fase 14
-- Agrega Link de Orion al Expediente y la bandera hace_remotas al Taller

-- 1. Agregar columna link_orion a Casos
ALTER TABLE IF EXISTS public.casos 
ADD COLUMN IF NOT EXISTS link_orion TEXT;

-- 2. Agregar columna hace_remotas a Talleres
ALTER TABLE IF EXISTS public.talleres
ADD COLUMN IF NOT EXISTS hace_remotas BOOLEAN DEFAULT false;
