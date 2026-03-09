CREATE TABLE usuarios (
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

CREATE TABLE companias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  tipo_trabajo TEXT[],
  activa BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gestores (
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
CREATE INDEX idx_gestores_compania ON gestores(compania_id);

CREATE TABLE talleres (
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
CREATE INDEX idx_talleres_localidad ON talleres(localidad);

CREATE TABLE repuesteros (
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

CREATE TABLE repuestero_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repuestero_id UUID REFERENCES repuesteros(id) ON DELETE CASCADE,
  marca TEXT NOT NULL
);
CREATE INDEX idx_repuestero_marcas_marca ON repuestero_marcas(marca);
CREATE INDEX idx_repuestero_marcas_rep ON repuestero_marcas(repuestero_id);

CREATE TABLE precios (
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

CREATE TABLE casos (
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

CREATE INDEX idx_casos_estado ON casos(estado);
CREATE INDEX idx_casos_perito_calle ON casos(perito_calle_id);
CREATE INDEX idx_casos_perito_carga ON casos(perito_carga_id);
CREATE INDEX idx_casos_fecha_inspeccion ON casos(fecha_inspeccion_programada);
CREATE INDEX idx_casos_numero_siniestro ON casos(numero_siniestro);
CREATE INDEX idx_casos_compania ON casos(compania_id);
CREATE INDEX idx_casos_dominio ON casos(dominio);
CREATE INDEX idx_casos_gestor ON casos(gestor_id);
CREATE INDEX idx_casos_taller ON casos(taller_id);
CREATE INDEX idx_casos_tipo_inspeccion ON casos(tipo_inspeccion);
CREATE INDEX idx_casos_facturado ON casos(facturado);

CREATE TABLE informes_periciales (
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
CREATE INDEX idx_informes_caso ON informes_periciales(caso_id);
CREATE INDEX idx_informes_perito ON informes_periciales(perito_id);

CREATE TABLE fotos_inspeccion (
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
CREATE INDEX idx_fotos_caso ON fotos_inspeccion(caso_id);

CREATE TABLE tareas (
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
CREATE INDEX idx_tareas_caso ON tareas(caso_id);
CREATE INDEX idx_tareas_asignado ON tareas(asignado_id);
CREATE INDEX idx_tareas_estado ON tareas(estado);

CREATE TABLE notas_caso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'nota' CHECK (tipo IN ('nota', 'consulta', 'respuesta', 'sistema')),
  adjuntos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notas_caso ON notas_caso(caso_id);

CREATE TABLE historial_estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_historial_caso ON historial_estados(caso_id);

CREATE TABLE kilometraje_diario (
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
CREATE INDEX idx_km_perito ON kilometraje_diario(perito_id);
CREATE INDEX idx_km_fecha ON kilometraje_diario(fecha);

CREATE TABLE configuracion (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
