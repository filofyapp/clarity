-- ─── Crear usuario admin en AOMNIS ───
-- Requisito: el usuario ya debe existir en auth.users (creado via Supabase Auth / signup)
-- Reemplazar los valores marcados con <...> antes de ejecutar

-- OPCIÓN 1: Si ya tenes el auth.uid del usuario (de la tabla auth.users)
INSERT INTO usuarios (id, nombre, apellido, email, rol, activo)
VALUES (
    '<AUTH_USER_UUID>',          -- UUID del usuario en auth.users
    '<NOMBRE>',                  -- ej: 'Nicolas'
    '<APELLIDO>',                -- ej: 'Perez'
    '<EMAIL>',                   -- ej: 'admin@aomnis.com'
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET
    rol = 'admin',
    activo = true;

-- OPCIÓN 2: Si querés crear el usuario y asignarlo como admin en un solo paso
-- (requiere que primero crees el usuario en Authentication > Users en Supabase Dashboard)
-- Luego buscá su UUID y ejecutá la opción 1.

-- ─── Verificar ───
-- SELECT * FROM usuarios WHERE rol = 'admin';

-- ─── Para encontrar el UUID de un usuario existente ───
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
