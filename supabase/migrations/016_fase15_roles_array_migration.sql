-- ==============================================================================
-- 016_fase15_roles_array_migration.sql
-- Fase 15: Implementar Arreglo de Roles Múltiples
-- ==============================================================================

-- 1. Agregar la columna de roles al esquema existente, en caso de no existir ya 
-- por migraciones previas (como la 014 parcial).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Migrar los valores singulares existentes de 'rol' hacia el nuevo arreglo 'roles'
UPDATE usuarios 
SET roles = ARRAY[rol] 
WHERE array_length(roles, 1) IS NULL OR array_length(roles, 1) = 0;

-- 3. Actualizar constraint de dominio de valores válidos para soportar los nuevos métodos
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'carga', 'calle', 'coordinador'));

-- 4. Validar que cada elemento en el arreglo roles sea uno de los valores permitidos
-- Creamos una función útil para checkear arrays si PostgreSQL no lo permite en un IN directo
CREATE OR REPLACE FUNCTION array_contains_valid_roles(arr TEXT[]) 
RETURNS BOOLEAN AS $$
DECLARE
    valid_roles TEXT[] := ARRAY['admin', 'carga', 'calle', 'coordinador'];
    r TEXT;
BEGIN
    FOREACH r IN ARRAY arr
    LOOP
        IF NOT (r = ANY(valid_roles)) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_roles_array_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_roles_array_check CHECK (array_contains_valid_roles(roles));
