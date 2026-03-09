-- FASE 7.4: Directorios "Usuarios" y "Valores"

-- 1. Tabla de Herramientas/Credenciales (Directorio "Usuarios")
CREATE TABLE IF NOT EXISTS herramientas_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plataforma TEXT NOT NULL,
    credencial_usuario TEXT NOT NULL,
    credencial_pass TEXT NOT NULL,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Solo Admin y Carga pueden ver y editar
ALTER TABLE herramientas_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "herramientas_acceso" ON herramientas_usuarios 
    FOR ALL 
    USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'));

-- 2. Tabla de Valores Referenciales (Directorio "Valores Chapa y Pintura")
CREATE TABLE IF NOT EXISTS valores_chapa_pintura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca TEXT NOT NULL,
    descripcion TEXT,
    valor_pieza DECIMAL,
    valor_hora DECIMAL,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin edita, resto solo lee
ALTER TABLE valores_chapa_pintura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "valores_lectura" ON valores_chapa_pintura 
    FOR SELECT 
    USING (true);

CREATE POLICY "valores_edicion" ON valores_chapa_pintura 
    FOR ALL 
    USING (auth.jwt() ->> 'rol' = 'admin');
