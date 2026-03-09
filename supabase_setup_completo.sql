-- ==========================================
-- AOMNIS - SETUP COMPLETO SUPABASE (Sprint 1 a 3)
-- ==========================================
-- Instrucciones:
-- 1. Copia y pega todo este script en el SQL Editor de tu proyecto Supabase.
-- 2. Haz clic en "Run" (Ejecutar).
-- ==========================================

-- 1. TABLAS PRINCIPALES (001_initial_schema.sql)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'carga', 'calle')),
  telefono TEXT,
  direccion_base TEXT,
  direccion_base_lat DOUBLE PRECISION,
  direccion_base_lng DOUBLE PRECISION,
  activo BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  tipo_trabajo TEXT[],
  activa BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gestores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compania_id UUID REFERENCES companias(id),
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  sector TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gestores_compania ON gestores(compania_id);

CREATE TABLE IF NOT EXISTS talleres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  razon_social TEXT,
  cuit TEXT,
  telefono TEXT,
  telefono_alt TEXT,
  email TEXT,
  direccion TEXT NOT NULL,
  direccion_lat DOUBLE PRECISION,
  direccion_lng DOUBLE PRECISION,
  localidad TEXT,
  provincia TEXT DEFAULT 'Buenos Aires',
  tipo TEXT DEFAULT 'general' CHECK (tipo IN (
    'general', 'concesionario', 'especializado', 'chapa_pintura', 'mecanica', 'electrica'
  )),
  marcas_trabaja TEXT[],
  contacto_nombre TEXT,
  horario TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_talleres_localidad ON talleres(localidad);

CREATE TABLE IF NOT EXISTS repuesteros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  razon_social TEXT,
  cuit TEXT,
  telefono TEXT,
  telefono_alt TEXT,
  email TEXT,
  whatsapp TEXT,
  direccion TEXT,
  localidad TEXT,
  provincia TEXT DEFAULT 'Buenos Aires',
  contacto_nombre TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repuestero_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repuestero_id UUID REFERENCES repuesteros(id) ON DELETE CASCADE,
  marca TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_repuestero_marcas_marca ON repuestero_marcas(marca);
CREATE INDEX IF NOT EXISTS idx_repuestero_marcas_rep ON repuestero_marcas(repuestero_id);

CREATE TABLE IF NOT EXISTS precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compania_id UUID REFERENCES companias(id),
  concepto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('honorario', 'kilometraje', 'mano_obra')),
  valor_estudio DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_perito DECIMAL(10,2) NOT NULL DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(compania_id, concepto)
);

CREATE TABLE IF NOT EXISTS casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compania_id UUID REFERENCES companias(id),

  -- Siniestro
  numero_siniestro TEXT NOT NULL,
  numero_servicio TEXT,
  tipo TEXT CHECK (tipo IN ('asegurado', 'tercero')),
  tipo_inspeccion TEXT NOT NULL DEFAULT 'ip_con_orden' CHECK (tipo_inspeccion IN (
    'ip_con_orden', 'posible_dt', 'ip_sin_orden', 'ampliacion', 'ausente',
    'terceros', 'ip_camiones', 'ip_remota', 'sin_honorarios', 'ip_final_intermedia'
  )),

  gestor_id UUID REFERENCES gestores(id),

  -- Asegurado/tercero
  nombre_asegurado TEXT,
  dni_asegurado TEXT,
  telefono_asegurado TEXT,
  email_asegurado TEXT,

  -- Vehículo
  dominio TEXT,
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  color TEXT,

  -- Ubicación
  direccion_inspeccion TEXT NOT NULL,
  direccion_lat DOUBLE PRECISION,
  direccion_lng DOUBLE PRECISION,
  localidad TEXT,
  provincia TEXT DEFAULT 'Buenos Aires',

  taller_id UUID REFERENCES talleres(id),

  -- Asignaciones (VISIBILIDAD)
  perito_calle_id UUID REFERENCES usuarios(id),
  perito_carga_id UUID REFERENCES usuarios(id),

  -- Fechas
  fecha_derivacion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_inspeccion_programada DATE,
  hora_inspeccion TEXT,
  fecha_inspeccion_real TIMESTAMPTZ,
  fecha_carga_sistema TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,

  -- Estado (13)
  estado TEXT NOT NULL DEFAULT 'pendiente_coordinacion' CHECK (estado IN (
    'ip_coordinada', 'pendiente_coordinacion', 'contactado', 'en_consulta_cia',
    'licitando_repuestos', 'ip_cerrada', 'inspeccion_anulada', 'ip_reclamada_perito',
    'pendiente_presupuesto', 'esperando_respuesta_tercero', 'inspeccionada',
    'pendiente_carga', 'facturada'
  )),

  -- Facturación
  facturado BOOLEAN DEFAULT false,
  fecha_facturacion DATE,
  numero_factura TEXT,
  monto_facturado_estudio DECIMAL(12,2),
  monto_pagado_perito_calle DECIMAL(12,2),
  monto_pagado_perito_carga DECIMAL(12,2),

  caso_origen_id UUID REFERENCES casos(id),
  datos_crudos_sancor TEXT,
  prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  notas_admin TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_casos_estado ON casos(estado);
CREATE INDEX IF NOT EXISTS idx_casos_perito_calle ON casos(perito_calle_id);
CREATE INDEX IF NOT EXISTS idx_casos_perito_carga ON casos(perito_carga_id);
CREATE INDEX IF NOT EXISTS idx_casos_fecha_inspeccion ON casos(fecha_inspeccion_programada);
CREATE INDEX IF NOT EXISTS idx_casos_numero_siniestro ON casos(numero_siniestro);
CREATE INDEX IF NOT EXISTS idx_casos_compania ON casos(compania_id);
CREATE INDEX IF NOT EXISTS idx_casos_dominio ON casos(dominio);
CREATE INDEX IF NOT EXISTS idx_casos_gestor ON casos(gestor_id);
CREATE INDEX IF NOT EXISTS idx_casos_taller ON casos(taller_id);
CREATE INDEX IF NOT EXISTS idx_casos_tipo_inspeccion ON casos(tipo_inspeccion);
CREATE INDEX IF NOT EXISTS idx_casos_facturado ON casos(facturado);

CREATE TABLE IF NOT EXISTS informes_periciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID UNIQUE REFERENCES casos(id) ON DELETE CASCADE,
  perito_id UUID REFERENCES usuarios(id),

  -- Taller
  taller_id UUID REFERENCES talleres(id),
  taller_nombre_manual TEXT,

  -- Acuerdo
  se_acuerda BOOLEAN,  -- NULL = no completado, true/false = decisión

  -- Texto del informe
  reparar TEXT,
  cambiar TEXT,
  pintar TEXT,
  observaciones TEXT,

  -- Chapa
  chapa_dias INTEGER DEFAULT 0,
  chapa_valor_dia DECIMAL(10,2) DEFAULT 0,
  chapa_subtotal DECIMAL(12,2) GENERATED ALWAYS AS (chapa_dias * chapa_valor_dia) STORED,

  -- Pintura
  pintura_panos INTEGER DEFAULT 0,
  pintura_valor_pano DECIMAL(10,2) DEFAULT 0,
  pintura_subtotal DECIMAL(12,2) GENERATED ALWAYS AS (pintura_panos * pintura_valor_pano) STORED,

  total_mano_obra DECIMAL(12,2) GENERATED ALWAYS AS (
    (chapa_dias * chapa_valor_dia) + (pintura_panos * pintura_valor_pano)
  ) STORED,

  valor_repuestos DECIMAL(12,2) DEFAULT 0,
  valor_extras DECIMAL(12,2) DEFAULT 0,
  valor_total_acordado DECIMAL(12,2) GENERATED ALWAYS AS (
    (chapa_dias * chapa_valor_dia) + (pintura_panos * pintura_valor_pano) + COALESCE(valor_repuestos, 0) + COALESCE(valor_extras, 0)
  ) STORED,

  completo BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_informes_caso ON informes_periciales(caso_id);
CREATE INDEX IF NOT EXISTS idx_informes_perito ON informes_periciales(perito_id);

CREATE TABLE IF NOT EXISTS fotos_inspeccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  url TEXT NOT NULL,
  url_thumbnail TEXT,
  tipo TEXT DEFAULT 'general' CHECK (tipo IN (
    'general', 'frente', 'lateral_izq', 'lateral_der',
    'trasera', 'danio_detalle', 'kilometraje', 'motor',
    'interior', 'documentacion', 'otro'
  )),
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fotos_caso ON fotos_inspeccion(caso_id);

CREATE TABLE IF NOT EXISTS tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
  creador_id UUID REFERENCES usuarios(id),
  asignado_id UUID REFERENCES usuarios(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'sin_gestion' CHECK (estado IN (
    'sin_gestion', 'realizando', 'realizado', 'respondido'
  )),
  prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  fecha_vencimiento DATE,
  fecha_completado TIMESTAMPTZ,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tareas_caso ON tareas(caso_id);
CREATE INDEX IF NOT EXISTS idx_tareas_asignado ON tareas(asignado_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas(estado);

CREATE TABLE IF NOT EXISTS notas_caso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'nota' CHECK (tipo IN ('nota', 'consulta', 'respuesta', 'sistema')),
  adjuntos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notas_caso ON notas_caso(caso_id);

CREATE TABLE IF NOT EXISTS historial_estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_historial_caso ON historial_estados(caso_id);

CREATE TABLE IF NOT EXISTS kilometraje_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perito_id UUID REFERENCES usuarios(id),
  fecha DATE NOT NULL,
  casos_ids UUID[] NOT NULL,
  direcciones_ordenadas JSONB,
  km_total DECIMAL(8,2),
  duracion_estimada_min INTEGER,
  ruta_polyline TEXT,
  ruta_google_maps_url TEXT,
  ruta_waze_url TEXT,
  precio_km_estudio DECIMAL(8,2),
  precio_km_perito DECIMAL(8,2),
  monto_total_estudio DECIMAL(10,2),
  monto_total_perito DECIMAL(10,2),
  facturado_estudio BOOLEAN DEFAULT false,
  pagado_perito BOOLEAN DEFAULT false,
  punto_partida TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(perito_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_km_perito ON kilometraje_diario(perito_id);
CREATE INDEX IF NOT EXISTS idx_km_fecha ON kilometraje_diario(fecha);

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. TRIGGERS Y FUNCIONES (002_triggers.sql)
-- ==========================================
CREATE OR REPLACE FUNCTION fn_evaluar_informe_completo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completo := (
    NEW.se_acuerda IS NOT NULL
    AND (
      (NEW.reparar IS NOT NULL AND NEW.reparar != '')
      OR (NEW.cambiar IS NOT NULL AND NEW.cambiar != '')
      OR (NEW.pintar IS NOT NULL AND NEW.pintar != '')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_evaluar_informe_completo ON informes_periciales;
CREATE TRIGGER trg_evaluar_informe_completo
  BEFORE INSERT OR UPDATE ON informes_periciales
  FOR EACH ROW
  EXECUTE FUNCTION fn_evaluar_informe_completo();

CREATE OR REPLACE FUNCTION fn_check_transicion_pendiente_carga()
RETURNS TRIGGER AS $$
DECLARE
  tiene_fotos BOOLEAN;
  estado_actual TEXT;
BEGIN
  IF NEW.completo = true AND (OLD.completo = false OR OLD.completo IS NULL) THEN
    SELECT EXISTS(
      SELECT 1 FROM fotos_inspeccion WHERE caso_id = NEW.caso_id
    ) INTO tiene_fotos;

    SELECT estado INTO estado_actual FROM casos WHERE id = NEW.caso_id;

    IF tiene_fotos AND estado_actual = 'inspeccionada' THEN
      UPDATE casos SET estado = 'pendiente_carga', updated_at = now() WHERE id = NEW.caso_id;

      INSERT INTO historial_estados (caso_id, usuario_id, estado_anterior, estado_nuevo, motivo)
      VALUES (NEW.caso_id, NEW.perito_id, 'inspeccionada', 'pendiente_carga', 'Transición automática: informe completo + fotos cargadas');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transicion_pendiente_carga ON informes_periciales;
CREATE TRIGGER trg_transicion_pendiente_carga
  AFTER UPDATE ON informes_periciales
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_transicion_pendiente_carga();

CREATE OR REPLACE FUNCTION fn_check_transicion_por_foto()
RETURNS TRIGGER AS $$
DECLARE
  informe_completo BOOLEAN;
  estado_actual TEXT;
  perito_id_caso UUID;
BEGIN
  SELECT completo INTO informe_completo FROM informes_periciales WHERE caso_id = NEW.caso_id;
  SELECT estado, perito_calle_id INTO estado_actual, perito_id_caso FROM casos WHERE id = NEW.caso_id;

  IF informe_completo = true AND estado_actual = 'inspeccionada' THEN
    UPDATE casos SET estado = 'pendiente_carga', updated_at = now() WHERE id = NEW.caso_id;

    INSERT INTO historial_estados (caso_id, usuario_id, estado_anterior, estado_nuevo, motivo)
    VALUES (NEW.caso_id, perito_id_caso, 'inspeccionada', 'pendiente_carga', 'Transición automática: foto cargada + informe ya completo');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transicion_por_foto ON fotos_inspeccion;
CREATE TRIGGER trg_transicion_por_foto
  AFTER INSERT ON fotos_inspeccion
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_transicion_por_foto();

-- ==========================================
-- 3. POLÍTICAS RLS (003_rls_policies.sql)
-- ==========================================
-- (Bypassed if executed via Service Role, but added for client edge cases if RLS enabled)

/*
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_inspeccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes_periciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE talleres ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestores ENABLE ROW LEVEL SECURITY;
ALTER TABLE repuesteros ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visibilidad_casos" ON casos;
CREATE POLICY "visibilidad_casos" ON casos FOR SELECT USING (
  (auth.jwt() ->> 'rol' = 'admin')
  OR (auth.jwt() ->> 'rol' = 'calle' AND perito_calle_id = auth.uid())
  OR (auth.jwt() ->> 'rol' = 'carga' AND perito_carga_id = auth.uid())
);

DROP POLICY IF EXISTS "fotos_lectura" ON fotos_inspeccion;
CREATE POLICY "fotos_lectura" ON fotos_inspeccion FOR SELECT USING (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = fotos_inspeccion.caso_id
    AND ((auth.jwt() ->> 'rol' = 'admin') OR (casos.perito_calle_id = auth.uid()) OR (casos.perito_carga_id = auth.uid())))
);

DROP POLICY IF EXISTS "fotos_upload" ON fotos_inspeccion;
CREATE POLICY "fotos_upload" ON fotos_inspeccion FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = fotos_inspeccion.caso_id
    AND (casos.perito_calle_id = auth.uid() OR (auth.jwt() ->> 'rol' = 'admin')))
);

DROP POLICY IF EXISTS "informes_lectura" ON informes_periciales;
CREATE POLICY "informes_lectura" ON informes_periciales FOR SELECT USING (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = informes_periciales.caso_id
    AND ((auth.jwt() ->> 'rol' = 'admin') OR (casos.perito_calle_id = auth.uid()) OR (casos.perito_carga_id = auth.uid())))
);

DROP POLICY IF EXISTS "informes_edicion" ON informes_periciales;
CREATE POLICY "informes_edicion" ON informes_periciales FOR ALL USING (
  EXISTS (SELECT 1 FROM casos WHERE casos.id = informes_periciales.caso_id
    AND (casos.perito_calle_id = auth.uid() OR (auth.jwt() ->> 'rol' = 'admin')))
);

DROP POLICY IF EXISTS "tareas_visibilidad" ON tareas;
CREATE POLICY "tareas_visibilidad" ON tareas FOR SELECT USING (
  asignado_id = auth.uid() OR creador_id = auth.uid() OR (auth.jwt() ->> 'rol' = 'admin')
);

DROP POLICY IF EXISTS "talleres_lectura" ON talleres;
CREATE POLICY "talleres_lectura" ON talleres FOR SELECT USING (true);
DROP POLICY IF EXISTS "talleres_edicion" ON talleres;
CREATE POLICY "talleres_edicion" ON talleres FOR ALL USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'));

DROP POLICY IF EXISTS "gestores_lectura" ON gestores;
CREATE POLICY "gestores_lectura" ON gestores FOR SELECT USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'));
DROP POLICY IF EXISTS "gestores_edicion" ON gestores;
CREATE POLICY "gestores_edicion" ON gestores FOR ALL USING (auth.jwt() ->> 'rol' = 'admin');

DROP POLICY IF EXISTS "repuesteros_acceso" ON repuesteros;
CREATE POLICY "repuesteros_acceso" ON repuesteros FOR ALL USING (auth.jwt() ->> 'rol' IN ('admin', 'carga'));

DROP POLICY IF EXISTS "precios_admin" ON precios;
CREATE POLICY "precios_admin" ON precios FOR ALL USING (auth.jwt() ->> 'rol' = 'admin');
*/

-- ==========================================
-- 4. REALTIME (004_realtime.sql)
-- ==========================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE casos, tareas, informes_periciales, notas_caso;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignorar error si ya están agregadas
END $$;

-- ==========================================
-- 5. SEMILLA DE DATOS / SEED (005_seed_data.sql)
-- ==========================================
INSERT INTO companias (nombre, codigo, tipo_trabajo, activa) 
VALUES ('Sancor Seguros', 'SANCOR', ARRAY['asegurado', 'tercero'], true)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_compania_id UUID;
BEGIN
  SELECT id INTO v_compania_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;
  
  IF v_compania_id IS NOT NULL THEN
    INSERT INTO precios (compania_id, concepto, tipo, valor_estudio, valor_perito, descripcion) VALUES
      (v_compania_id, 'chapa_dia', 'mano_obra', 140000, 140000, 'Valor default por día de chapa'),
      (v_compania_id, 'pintura_pano', 'mano_obra', 145000, 145000, 'Valor default por paño de pintura')
    ON CONFLICT (compania_id, concepto) DO NOTHING;
  END IF;
END $$;

-- ==========================================
-- 6. BUCKETS DE STORAGE Y SUS POLÍTICAS
-- ==========================================
-- Crear el bucket 'fotos-inspecciones' público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-inspecciones', 'fotos-inspecciones', true)
ON CONFLICT (id) DO NOTHING;

-- Dar permisos para subir fotos genéricos (para que funcione facil en Dev Local).
DO $$
BEGIN
    DROP POLICY IF EXISTS "Fotos publicas lectura" ON storage.objects;
    CREATE POLICY "Fotos publicas lectura" 
      ON storage.objects FOR SELECT 
      USING ( bucket_id = 'fotos-inspecciones' );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir inserts sin login estricto" ON storage.objects;
    CREATE POLICY "Permitir inserts sin login estricto" 
      ON storage.objects FOR INSERT 
      WITH CHECK ( bucket_id = 'fotos-inspecciones' );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- FIN DEL SCRIPT
-- ==========================================
