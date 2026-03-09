-- ============================================
-- AOMNIS — Script de Datos de Prueba
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- ⚠️ SOLO DESARROLLO. NUNCA EN PRODUCCIÓN.
-- ⚠️ IDEMPOTENTE: Se puede ejecutar varias veces sin error.
-- ============================================

-- ──────────────────────────────────────────
-- 1. USUARIOS AUTH (email/password login)
-- ──────────────────────────────────────────
-- Contraseña para los 3: Aomnis2026!

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'admin@aomnis.com', crypt('Aomnis2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"nombre":"Nicolás","apellido":"Admin"}',
   'authenticated', 'authenticated', now(), now()),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'carga@aomnis.com', crypt('Aomnis2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"nombre":"Jairo","apellido":"Carga"}',
   'authenticated', 'authenticated', now(), now()),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'calle@aomnis.com', crypt('Aomnis2026!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"nombre":"Lucas","apellido":"Calle"}',
   'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   jsonb_build_object('sub','a0000000-0000-0000-0000-000000000001','email','admin@aomnis.com'),
   'email','a0000000-0000-0000-0000-000000000001', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
   jsonb_build_object('sub','b0000000-0000-0000-0000-000000000002','email','carga@aomnis.com'),
   'email','b0000000-0000-0000-0000-000000000002', now(), now(), now()),
  ('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
   jsonb_build_object('sub','c0000000-0000-0000-0000-000000000003','email','calle@aomnis.com'),
   'email','c0000000-0000-0000-0000-000000000003', now(), now(), now())
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────
-- 2. TABLA USUARIOS (vinculados a auth)
-- ──────────────────────────────────────────

INSERT INTO usuarios (id, email, nombre, apellido, rol, telefono, direccion_base, activo) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@aomnis.com', 'Nicolás', 'Admin', 'admin', '011-1234-5678', '9 de Julio 62, Bernal, Buenos Aires', true),
  ('b0000000-0000-0000-0000-000000000002', 'carga@aomnis.com', 'Jairo', 'Carga', 'carga', '011-2345-6789', '9 de Julio 62, Bernal, Buenos Aires', true),
  ('c0000000-0000-0000-0000-000000000003', 'calle@aomnis.com', 'Lucas', 'Calle', 'calle', '011-3456-7890', 'Av. Mitre 500, Quilmes, Buenos Aires', true)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────
-- 3. COMPAÑÍA (usar la existente si ya hay)
-- ──────────────────────────────────────────

INSERT INTO companias (nombre, codigo, activa) VALUES
  ('Sancor Seguros', 'SANCOR', true)
ON CONFLICT (codigo) DO NOTHING;

-- ──────────────────────────────────────────
-- 4-10. TODO LO DEMÁS (usa el ID real de Sancor)
-- ──────────────────────────────────────────

DO $$
DECLARE
  v_sancor_id UUID;
  gestor1_id UUID;
  gestor2_id UUID;
  taller1_id UUID;
  taller2_id UUID;
  rep1_id UUID := gen_random_uuid();
  rep2_id UUID := gen_random_uuid();
  rep3_id UUID := gen_random_uuid();
  caso1 UUID := gen_random_uuid();
  caso2 UUID := gen_random_uuid();
  caso3 UUID := gen_random_uuid();
  caso4 UUID := gen_random_uuid();
  caso5 UUID := gen_random_uuid();
  caso6 UUID := gen_random_uuid();
  caso7 UUID := gen_random_uuid();
  caso8 UUID := gen_random_uuid();
  caso9 UUID := gen_random_uuid();
  caso10 UUID := gen_random_uuid();
BEGIN
  -- Obtener el ID REAL de Sancor (no hardcodeado)
  SELECT id INTO v_sancor_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;

  IF v_sancor_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró Sancor en la tabla companias';
  END IF;

  -- ── GESTORES ──
  INSERT INTO gestores (compania_id, nombre, email, telefono, sector, activo) VALUES
    (v_sancor_id, 'Martínez, Carlos', 'cmartinez@sancor.com.ar', '011-4455-6677', 'Siniestros Automotores', true),
    (v_sancor_id, 'López, María', 'mlopez@sancor.com.ar', '011-4455-6688', 'Terceros', true),
    (v_sancor_id, 'García, Roberto', 'rgarcia@sancor.com.ar', '011-4455-6699', 'Siniestros Automotores', true),
    (v_sancor_id, 'Fernández, Laura', 'lfernandez@sancor.com.ar', '011-4455-7700', 'Camiones', true),
    (v_sancor_id, 'Pérez, Diego', 'dperez@sancor.com.ar', '011-4455-7711', 'Siniestros Automotores', true)
  ON CONFLICT DO NOTHING;

  -- ── TALLERES ──
  INSERT INTO talleres (nombre, direccion, telefono, email, localidad, tipo, marcas_trabaja, activo) VALUES
    ('Taller García & Hijos', 'Av. Mitre 1234, Quilmes', '011-4200-1111', 'garcia@taller.com', 'Quilmes', 'general', ARRAY['Toyota','Ford','Volkswagen'], true),
    ('Concesionario Toyota Bernal', 'Av. San Martín 500, Bernal', '011-4200-2222', 'bernal@toyota.com.ar', 'Bernal', 'concesionario', ARRAY['Toyota'], true),
    ('Chapa Express', 'Calle 14 N° 800, Berazategui', '011-4200-3333', 'info@chapaexpress.com', 'Berazategui', 'chapa_pintura', ARRAY['Ford','Chevrolet','Fiat'], true),
    ('Auto Eléctrica Sur', '9 de Julio 350, Avellaneda', '011-4200-4444', 'autoelectrica@mail.com', 'Avellaneda', 'electrica', ARRAY['Volkswagen','Peugeot','Renault'], true),
    ('Mecánica Rápida Lanús', 'Alsina 200, Lanús', '011-4200-5555', 'mecanica@rapida.com', 'Lanús', 'mecanica', ARRAY['Chevrolet','Fiat','Renault'], true)
  ON CONFLICT DO NOTHING;

  -- ── REPUESTEROS ──
  INSERT INTO repuesteros (id, nombre, telefono, whatsapp, email, direccion, localidad, activo) VALUES
    (rep1_id, 'Repuestos del Sur', '011-5500-1111', '5491155001111', 'ventas@repuestosdelsur.com', 'Av. Pavón 3500', 'Lanús', true),
    (rep2_id, 'AutoPartes Bernal', '011-5500-2222', '5491155002222', 'info@autopartesbernal.com', 'Belgrano 700', 'Bernal', true),
    (rep3_id, 'Import Car Parts', '011-5500-3333', '5491155003333', 'import@carparts.com.ar', 'Av. Calchaquí 1200', 'Quilmes', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO repuestero_marcas (repuestero_id, marca) VALUES
    (rep1_id, 'Toyota'), (rep1_id, 'Ford'), (rep1_id, 'Volkswagen'),
    (rep2_id, 'Chevrolet'), (rep2_id, 'Fiat'), (rep2_id, 'Renault'), (rep2_id, 'Peugeot'),
    (rep3_id, 'BMW'), (rep3_id, 'Mercedes-Benz'), (rep3_id, 'Audi'), (rep3_id, 'Toyota')
  ON CONFLICT DO NOTHING;

  -- ── PRECIOS ──
  INSERT INTO precios (compania_id, concepto, tipo, valor_estudio, valor_perito, descripcion, activo) VALUES
    (v_sancor_id, 'ip_con_orden', 'honorario', 45000, 30000, 'IP con Orden de trabajo', true),
    (v_sancor_id, 'posible_dt', 'honorario', 55000, 35000, 'Posible Destrucción Total', true),
    (v_sancor_id, 'ip_sin_orden', 'honorario', 40000, 25000, 'IP sin Orden', true),
    (v_sancor_id, 'ampliacion', 'honorario', 30000, 20000, 'Ampliación de inspección', true),
    (v_sancor_id, 'terceros', 'honorario', 35000, 22000, 'Terceros', true),
    (v_sancor_id, 'ip_camiones', 'honorario', 65000, 45000, 'IP Camiones', true),
    (v_sancor_id, 'ip_remota', 'honorario', 25000, 15000, 'IP Remota', true),
    (v_sancor_id, 'ip_final_intermedia', 'honorario', 40000, 28000, 'IP Final/Intermedia', true),
    (v_sancor_id, 'kilometraje', 'kilometraje', 350, 250, 'Precio por KM', true),
    (v_sancor_id, 'chapa_dia', 'mano_obra', 18000, 18000, 'Valor día de chapa (default)', true),
    (v_sancor_id, 'pintura_pano', 'mano_obra', 12000, 12000, 'Valor paño pintura (default)', true)
  ON CONFLICT DO NOTHING;

  -- ── Obtener IDs de gestores y talleres ──
  SELECT id INTO gestor1_id FROM gestores WHERE nombre LIKE 'Martínez%' LIMIT 1;
  SELECT id INTO gestor2_id FROM gestores WHERE nombre LIKE 'López%' LIMIT 1;
  SELECT id INTO taller1_id FROM talleres WHERE nombre LIKE 'Taller García%' LIMIT 1;
  SELECT id INTO taller2_id FROM talleres WHERE nombre LIKE 'Chapa Express%' LIMIT 1;

  -- ── CASOS (10 en distintos estados) ──
  INSERT INTO casos (id, compania_id, numero_siniestro, numero_servicio, tipo, tipo_inspeccion,
    gestor_id, nombre_asegurado, telefono_asegurado, dominio, marca, modelo, anio,
    direccion_inspeccion, localidad, taller_id,
    perito_calle_id, perito_carga_id, estado, prioridad, fecha_derivacion, fecha_inspeccion_programada
  ) VALUES
    (caso1, v_sancor_id, '2026-SIN-001', 'SRV-001', 'asegurado', 'ip_con_orden',
     gestor1_id, 'Roberto Sánchez', '011-6600-1111', 'AB123CD', 'Toyota', 'Corolla', 2022,
     'Av. Rivadavia 5000, CABA', 'CABA', taller1_id,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'pendiente_coordinacion', 'normal', CURRENT_DATE - 3, NULL),

    (caso2, v_sancor_id, '2026-SIN-002', 'SRV-002', 'asegurado', 'posible_dt',
     gestor2_id, 'María Gómez', '011-6600-2222', 'CD456EF', 'Ford', 'Ranger', 2023,
     'Calle 50 N° 1200, La Plata', 'La Plata', NULL,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'contactado', 'alta', CURRENT_DATE - 5, NULL),

    (caso3, v_sancor_id, '2026-SIN-003', 'SRV-003', 'asegurado', 'ip_con_orden',
     gestor1_id, 'Carlos Díaz', '011-6600-3333', 'GH789IJ', 'Volkswagen', 'Amarok', 2024,
     'Av. Mitre 800, Avellaneda', 'Avellaneda', taller2_id,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'ip_coordinada', 'normal', CURRENT_DATE - 2, CURRENT_DATE + 1),

    (caso4, v_sancor_id, '2026-SIN-004', 'SRV-004', 'tercero', 'terceros',
     gestor2_id, 'Ana Martínez', '011-6600-4444', 'KL012MN', 'Chevrolet', 'Cruze', 2021,
     'Belgrano 400, Quilmes', 'Quilmes', taller1_id,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'ip_coordinada', 'urgente', CURRENT_DATE - 1, CURRENT_DATE),

    (caso5, v_sancor_id, '2026-SIN-005', 'SRV-005', 'asegurado', 'ip_sin_orden',
     gestor1_id, 'Pedro López', '011-6600-5555', 'OP345QR', 'Fiat', 'Cronos', 2023,
     'Av. Calchaquí 3000, Florencio Varela', 'Florencio Varela', NULL,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'inspeccionada', 'normal', CURRENT_DATE - 7, CURRENT_DATE - 4),

    (caso6, v_sancor_id, '2026-SIN-006', 'SRV-006', 'asegurado', 'ip_con_orden',
     gestor2_id, 'Laura Fernández', '011-6600-6666', 'ST678UV', 'Renault', 'Duster', 2022,
     'San Martín 150, Bernal', 'Bernal', taller1_id,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'pendiente_carga', 'alta', CURRENT_DATE - 10, CURRENT_DATE - 7),

    (caso7, v_sancor_id, '2026-SIN-007', 'SRV-007', 'asegurado', 'ampliacion',
     gestor1_id, 'Diego Rodríguez', '011-6600-7777', 'WX901YZ', 'Peugeot', '208', 2024,
     'Alsina 600, Lanús', 'Lanús', taller2_id,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'licitando_repuestos', 'normal', CURRENT_DATE - 15, CURRENT_DATE - 12),

    (caso8, v_sancor_id, '2026-SIN-008', 'SRV-008', 'asegurado', 'ip_con_orden',
     gestor2_id, 'Sofía Herrera', '011-6600-8888', 'AB234CD', 'Toyota', 'Hilux', 2023,
     'Av. 9 de Julio 100, Bernal', 'Bernal', taller1_id,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'ip_cerrada', 'normal', CURRENT_DATE - 20, CURRENT_DATE - 18),

    (caso9, v_sancor_id, '2026-SIN-009', 'SRV-009', 'asegurado', 'ip_con_orden',
     gestor1_id, 'Marcos Acosta', '011-6600-9999', 'EF567GH', 'Ford', 'Focus', 2021,
     'Calle 7 N° 300, La Plata', 'La Plata', NULL,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'facturada', 'baja', CURRENT_DATE - 30, CURRENT_DATE - 28),

    (caso10, v_sancor_id, '2026-SIN-010', 'SRV-010', 'tercero', 'terceros',
     gestor2_id, 'Valentina Ruiz', '011-6600-0000', 'IJ890KL', 'Chevrolet', 'Onix', 2024,
     'Av. Centenario 2000, Quilmes', 'Quilmes', taller2_id,
     'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
     'en_consulta_cia', 'alta', CURRENT_DATE - 12, CURRENT_DATE - 10)
  ON CONFLICT DO NOTHING;

  -- Facturación del caso 9
  UPDATE casos SET
    facturado = true, fecha_facturacion = CURRENT_DATE - 25,
    numero_factura = '0001-00000123',
    monto_facturado_estudio = 45000,
    monto_pagado_perito_calle = 30000,
    monto_pagado_perito_carga = 5000,
    fecha_cierre = (CURRENT_DATE - 26)::timestamptz
  WHERE id = caso9;

  UPDATE casos SET fecha_cierre = (CURRENT_DATE - 5)::timestamptz WHERE id = caso8;

  -- Informe pericial para caso 6
  INSERT INTO informes_periciales (caso_id, perito_id, taller_id, se_acuerda, reparar, cambiar, pintar,
    observaciones, chapa_dias, chapa_valor_dia, pintura_panos, pintura_valor_pano)
  VALUES (caso6, 'c0000000-0000-0000-0000-000000000003', taller1_id,
    true, 'Paragolpe delantero, capot', 'Óptica izquierda, parrilla', 'Capot, guardabarros izquierdo',
    'Daño moderado zona frontal', 3, 18000, 2, 12000)
  ON CONFLICT DO NOTHING;

  -- Historial de estados
  INSERT INTO historial_estados (caso_id, usuario_id, estado_anterior, estado_nuevo, motivo) VALUES
    (caso6, 'c0000000-0000-0000-0000-000000000003', 'ip_coordinada', 'inspeccionada', 'Perito completó inspección'),
    (caso6, 'c0000000-0000-0000-0000-000000000003', 'inspeccionada', 'pendiente_carga', 'Auto: informe + fotos'),
    (caso7, 'b0000000-0000-0000-0000-000000000002', 'pendiente_carga', 'licitando_repuestos', 'Caso pasa a licitación en Sancor'),
    (caso8, 'b0000000-0000-0000-0000-000000000002', 'licitando_repuestos', 'ip_cerrada', 'IP cerrada'),
    (caso9, 'a0000000-0000-0000-0000-000000000001', 'ip_cerrada', 'facturada', 'Facturada — Nro: 0001-00000123');

  -- Tareas
  INSERT INTO tareas (caso_id, creador_id, asignado_id, titulo, descripcion, estado, prioridad, fecha_vencimiento) VALUES
    (caso5, 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
     'Subir fotos del caso SIN-005', 'Faltan las fotos de la inspección. Urgente.',
     'sin_gestion', 'urgente', CURRENT_DATE + 1),
    (caso10, 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'Consultar con Sancor por SIN-010', 'Necesitamos respuesta del gestor López sobre el tercero.',
     'realizando', 'alta', CURRENT_DATE + 3),
    (NULL, 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
     'Revisar precios de chapa', 'Verificar si los precios de chapa siguen vigentes.',
     'sin_gestion', 'normal', CURRENT_DATE + 7);

  -- Notas
  INSERT INTO notas_caso (caso_id, usuario_id, contenido, tipo) VALUES
    (caso4, 'a0000000-0000-0000-0000-000000000001', 'Asegurado pide inspección después de las 14hs.', 'nota'),
    (caso6, 'c0000000-0000-0000-0000-000000000003', 'Taller confirma recepción la semana que viene.', 'nota'),
    (caso10, 'b0000000-0000-0000-0000-000000000002', '¿Este tercero tiene cobertura? Consultar con López.', 'consulta');

END $$;

-- ── CONFIGURACIÓN ──
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('origen_default', '"9 de Julio 62, Bernal, Buenos Aires"', 'Dirección base del estudio'),
  ('horario_notificacion_agenda', '"20:00"', 'Hora de envío de agenda diaria'),
  ('dias_alerta_caso_viejo', '5', 'Días sin movimiento para alertar'),
  ('horas_alerta_inspeccionada', '24', 'Horas en inspeccionada antes de alertar'),
  ('horas_alerta_pendiente_carga', '24', 'Horas en pendiente_carga antes de alertar')
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- ✅ DATOS DE PRUEBA LISTOS
-- ============================================
-- 
-- CREDENCIALES:
-- ┌─────────────┬───────────────────┬──────────────┐
-- │ Rol         │ Email             │ Contraseña   │
-- ├─────────────┼───────────────────┼──────────────┤
-- │ Admin       │ admin@aomnis.com  │ Aomnis2026!  │
-- │ Perito Carga│ carga@aomnis.com  │ Aomnis2026!  │
-- │ Perito Calle│ calle@aomnis.com  │ Aomnis2026!  │
-- └─────────────┴───────────────────┴──────────────┘
