-- Migracion de Casos desde DatosMigracion.xlsx

-- 1. Crear Gestores Faltantes
DO $$
DECLARE
    v_compania_id UUID;
BEGIN
    SELECT id INTO v_compania_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('mmaccarrone', 'mmaccarrone@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'rmomartinez@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('rmomartinez', 'rmomartinez@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'mkester@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('mkester', 'mkester@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'mascallia@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('mascallia', 'mascallia@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'abinau@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('abinau', 'abinau@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('gmgutierrez', 'gmgutierrez@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('cvaldez', 'cvaldez@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'fsantorum@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('fsantorum', 'fsantorum@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'anunzio@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('anunzio', 'anunzio@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'madecarvalho@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('madecarvalho', 'madecarvalho@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'camgonzalez@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('camgonzalez', 'camgonzalez@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('lbarboza', 'lbarboza@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'cpavon@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('cpavon', 'cpavon@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'amrodriguez@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('amrodriguez', 'amrodriguez@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('mizzo', 'mizzo@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('pmalchiodi', 'pmalchiodi@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'pasalcedo@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('pasalcedo', 'pasalcedo@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'jsandoval@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('jsandoval', 'jsandoval@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'mdambrosio@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('mdambrosio', 'mdambrosio@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'glezcano@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('glezcano', 'glezcano@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('gleguizamon', 'gleguizamon@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'bdemiguel@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('bdemiguel', 'bdemiguel@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'milmartinez@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('milmartinez', 'milmartinez@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'gmoscato@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('gmoscato', 'gmoscato@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'msasso@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('msasso', 'msasso@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'vcingolani@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('vcingolani', 'vcingolani@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'dbenitez@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('dbenitez', 'dbenitez@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'pgirardin@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('pgirardin', 'pgirardin@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'fsoloneski@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('fsoloneski', 'fsoloneski@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'miiglesias@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('miiglesias', 'miiglesias@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'rfernandez@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('rfernandez', 'rfernandez@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'hrorpizikian@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('hrorpizikian', 'hrorpizikian@sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'vloray@ext.sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('vloray', 'vloray@ext.sancorseguros.com', v_compania_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = 'jboulle@sancorseguros.com') THEN
        INSERT INTO gestores (nombre, email, compania_id) VALUES ('jboulle', 'jboulle@sancorseguros.com', v_compania_id);
    END IF;
END $$;

-- 2. Crear Usuarios Peritos Faltantes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'L DEL PIERO') THEN
        INSERT INTO usuarios (nombre, apellido, email, rol) VALUES ('L DEL PIERO', '', 'ldelpiero_migracion@aomnis.local', 'calle');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'J. FERLANTI') THEN
        INSERT INTO usuarios (nombre, apellido, email, rol) VALUES ('J. FERLANTI', '', 'jferlanti_migracion@aomnis.local', 'calle');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'E DELIA') THEN
        INSERT INTO usuarios (nombre, apellido, email, rol) VALUES ('E DELIA', '', 'edelia_migracion@aomnis.local', 'calle');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'A MIÑO') THEN
        INSERT INTO usuarios (nombre, apellido, email, rol) VALUES ('A MIÑO', '', 'amio_migracion@aomnis.local', 'calle');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'N CORDOVA') THEN
        INSERT INTO usuarios (nombre, apellido, email, rol) VALUES ('N CORDOVA', '', 'ncordova_migracion@aomnis.local', 'calle');
    END IF;
END $$;

-- 3. Insertar Casos
DO $$
DECLARE
    v_compania_id UUID;
    v_gestor_id UUID;
    v_pcalle_id UUID;
    v_pcarga_id UUID;
BEGIN
    SELECT id INTO v_compania_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;

    -- Casos Row 1
    SELECT id INTO v_gestor_id FROM gestores WHERE email = '' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '150064976', NULL, v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'A', 'LA ESPERA DE DOCUMENTACION PARA CARGAR', '',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-03T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 2
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003903448', '477602', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', 'ARGO 1.8 PRECISION AT', 'AC610TE',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-04T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 3
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'rmomartinez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003916422', '477478', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'DUSTER 1.6 4X2 PRIVILEGE L/15  (no me paso nada reclamado 24/2)', 'AD695AV',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-04T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 4
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mkester@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003888031', '477507', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CHEVROLET', 'CLASSIC 1.4 4 PTAS LS ABS AB', 'PBW842',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 5
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mascallia@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003882090', '476193', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'TOYOTA', 'COROLLA CROSS 1.8 XEI HV E-CVT', 'AF990GL',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-04T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-09T00:00:00.000Z'
    );

    -- Casos Row 6
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'rmomartinez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003915759', '6623198', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'MONDEO 2.0 SEL ECOBOOST AUT', 'AE196FN',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-04T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 7
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003905732', '6623604', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'PEUGEOT', '208 L/20 1.6 ALLURE', 'AF541PP',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-03T00:00:00.000Z', '2026-02-04T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 8
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003911880', '6623641', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'TOYOTA', 'YARIS 1.5 5 PTAS XLS PACK CVT L/22', 'AG486PQ',
        'Migrado desde Excel',
        '2026-02-02T00:00:00.000Z', '2026-02-03T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-09T00:00:00.000Z'
    );

    -- Casos Row 9
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mascallia@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003846503', '479567', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FIAT', 'FIORINO FURGON 1.3 ENDURANCE', 'AH898MF',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 10
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003918417', '479563', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'TERRITORY 1.8T TITANIUM', 'AG947GG',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 11
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'fsantorum@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003917285', '479614', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'ETIOS 1.5 4 PTAS XLS 6MT (preguntar sobre mano de obra)', 'AB338IH',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 12
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'anunzio@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003907647', '479416', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'TOYOTA', 'YARIS 1.5 5 PTAS XLS CVT L/20', 'AE540TV',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 13
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003903438', '479122', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'FIAT', 'CRONOS 1.3 PRECISION (ES PARA RECOORDINAR, LO HABLAMOS POR TEL)', 'AH548IX',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 14
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mkester@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003866849', '479009', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CHEVROLET', 'ONIX 1.0T PREMIER II AT L/19 (negociando con ivan)', 'AE564NW',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 15
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'camgonzalez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003916271', '478886', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'DS', 'AUTOMOBILES DS3 1.6 THP SPORT CHIC', 'MXT675',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-10T00:00:00.000Z'
    );

    -- Casos Row 16
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003917591', '478882', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'COROLLA CROSS 2.0 XLI CVT', 'AG114DK',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-23T00:00:00.000Z'
    );

    -- Casos Row 17
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003917112', '478872', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'PEUGEOT', '208 L/20 1.6 ALLURE TIPTRONIC (esperando confirmacion valores)', 'AF687KB',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'
    );

    -- Casos Row 18
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cpavon@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003892711', '478410', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'SANDERO II 2.0 16V RS  (no me paso nada)', 'AD308YV',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 19
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003918636', '6624022', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'NISSAN', 'X-TRAIL 2.5 4X4 EXCLUSIVE CVT L/21', 'AE850PB',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 20
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003868303', '6624048', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CHEVROLET', 'CLASSIC 1.4 4 PTAS LS ABS AB', 'PDM700',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-09T00:00:00.000Z'
    );

    -- Casos Row 21
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'amrodriguez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003902615', '6624170', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'MERCEDES', 'BENZ C LS 1634-45/51', 'EKX266',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 22
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'fsantorum@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003855809', '6624349', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'FIAT', 'PULSE 1.3 DRIVE', 'AF406YT',
        'Migrado desde Excel',
        '2026-02-03T00:00:00.000Z', '2026-02-04T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-05T00:00:00.000Z'
    );

    -- Casos Row 23
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919682', '481303', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'COROLLA 1.8 XEI L/14 CVT', 'PKD216',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 24
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mkester@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003914407', '481163', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'FIAT', 'CRONOS 1.3 PRECISION  (ES PARA RECOORDINAR, LO HABLAMOS POR TEL)', 'AH548IX',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 25
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003674559', '480899', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'MERCEDES', 'BENZ SPRINTER 411 STREET FURGON 3250 V2', 'AB984RW',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 26
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003917197', '480800', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'PEUGEOT', '2008 1.0 T 200 ALLURE CVT', 'AH593OT',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z'
    );

    -- Casos Row 27
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919119', '480783', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FORD', 'TERRITORY 1.8T TITANIUM   (no me paso nada)', 'AG366HA',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 28
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003909100', '480781', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CHEVROLET', 'CLASSIC 1.4 4 PTAS LS ABS AB  (no me paso nada)', 'AA437CX',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 29
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pasalcedo@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003878171', '480144', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'RENAULT', 'FLUENCE 2.0 PRIVILEGE   (no me paso nada)', 'JYS022',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 30
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003663024', '6624605', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', 'CRONOS 1.3 GSE DRIVE PACK PLUS L/23', 'AF999CB',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-05T00:00:00.000Z'
    );

    -- Casos Row 31
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'camgonzalez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003914760', '6624713', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'RENAULT', 'LOGAN II 1.6 16V LIFE L/19  (Cargado, esperando acuerdo renault)', 'AF505YP',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-26T00:00:00.000Z'
    );

    -- Casos Row 32
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'fsantorum@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003856251', '6624777', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'COROLLA CROSS 2.0 XEI CVT L/24', 'AG602YF',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 33
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'fsantorum@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003918748', '6624783', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'PEUGEOT', '208 L/24 1.6 ALLURE AT', 'AG739DX',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-05T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-10T00:00:00.000Z'
    );

    -- Casos Row 34
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'A MIÑO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'A MIÑO' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003902339', '6624791', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'FIESTA 1.6 5P TITANIUM L/14 (KD)', 'MPY644',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-04T00:00:00.000Z', '2026-02-06T00:00:00.000Z', '2026-02-06T00:00:00.000Z'
    );

    -- Casos Row 35
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919182', '6625046', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'TOYOTA', 'HILUX L/21 2.8 DC 4X4 TDI SRX AT6 RECOORDINADA', 'AG009EL',
        'Migrado desde Excel',
        '2026-02-04T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'
    );

    -- Casos Row 36
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003823907', '482187', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'TOYOTA', 'HILUX L/23 2.8 DC 4X4 TDI SRX AT6 (No me paso nada)', 'AG467TX',
        'Migrado desde Excel',
        '2026-02-05T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'
    );

    -- Casos Row 37
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003888191', '482140', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', '500X 1.4 POP STAR (en consulta con alfre)', 'AC973DO',
        'Migrado desde Excel',
        '2026-02-05T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 38
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003786586', '484616', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'YARIS 1.5 4 PTAS XLS L/22  (no me paso nada)', 'AF423EB',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 39
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003913134', '484610', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FORD', 'FOCUS 1.6 8V AMBIENTE 5 P', 'PJP096',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 40
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919093', '484601', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'CLIO MIO 1.2 5 P DYNAMIQUE', 'AA488YR',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 41
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003921429', '484072', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'TOYOTA', 'COROLLA CROSS 1.8 SEG HV E-CVT  (no me paso nada)', 'AF712RB',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 42
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'jsandoval@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919777', '483959', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', 'SIENA 1.4 EL', 'AB599LD',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-10T00:00:00.000Z'
    );

    -- Casos Row 43
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920554', '483818', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CHEVROLET', 'CELTA 1.4 3 PTAS LS AA (esperando cobertura)', 'LTQ578',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-23T00:00:00.000Z'
    );

    -- Casos Row 44
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920384', '483813', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'CRONOS 1.3 DRIVE GSE PACK CONECTI.', 'AC638TI',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 45
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mdambrosio@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919718', '6626125', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'GOL TREND 1.6 3 P L/13', 'NNC242',
        'Migrado desde Excel',
        '2026-02-06T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 46
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'glezcano@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003922303', '486721', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'FIAT', 'FIORINO FURGON 1.3 ENDURANCE', 'AH900HE',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-12T00:00:00.000Z'
    );

    -- Casos Row 47
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003912067', '486703', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'TOYOTA', 'COROLLA 1.8 XEI L/14', 'OIZ561',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 48
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003839197', '486672', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FIAT', 'MOBI EASY', 'AD933IY',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 49
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003923131', '485974', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'HILUX SW4 TDI SRX AUT L/16', 'AD167AF',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 50
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003921843', '485571', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'RENAULT', 'SANDERO 1.6 8V PACK L/11 - si', 'LCD137',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 51
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003922280', '485557', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'AMAROK 30TD 4X4 DC AT 258HP COMFOR', 'AF908KM',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 52
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003779023', '485306', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CHEVROLET', 'ONIX 1.4 LTZ AUT L/17 (no me paso nada)', 'OMD453',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 53
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'milmartinez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003917030', '485248', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'POLO 1.6 L/23 MSI TRACK', 'AG796JI',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-11T00:00:00.000Z'
    );

    -- Casos Row 54
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003916912', '6626183', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', '500 1.4 SPORT MEX', 'OSP526',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 55
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003653840', '6626503', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'RENAULT', 'SANDERO 1.6 8V PACK L/11 - si', 'LCD137',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 56
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920753', '6626883', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'CHEVROLET', 'SPIN 1.8 ACTIVE 7 AS AUT L/21', 'AG345RN',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 57
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'rmomartinez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003913230', '6626900', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'KWID 1.0 INTENS (no me paso nada)', 'AC164UQ',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 58
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003905090', '6626919', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'TOYOTA', 'COROLLA 1.8 XEI L/11', 'MEX341',
        'Migrado desde Excel',
        '2026-02-09T00:00:00.000Z', '2026-02-10T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 59
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003916296', '488556', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FORD', 'ECO SPORT 1.5 SE L/18', 'AF402EX',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 60
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003873386', '488376', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CHERY', 'TIGGO 3 1.6 4X2 LUXURY L/17', 'AC879QC',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 61
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003922977', '488058', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', 'FIORINO FURGON 1.3 ENDURANCE  (no me paso nada)', 'AH900HE',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 62
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003923598', '487993', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'CHEVROLET', 'TRACKER 1.2 TURBO AT6', 'AF622FZ',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 63
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003914987', '487964', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CITROEN', 'C 3 AIRCROSS 1.6 FEEL (no me paso nada)', 'AE192VS',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 64
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'jsandoval@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003916096', '487489', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CHEVROLET', 'ONIX 1.4 LT L/17', 'AB798NU',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 65
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'amrodriguez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003887240', '6627046', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'RENAULT', 'SANDERO II 1.6 8V EXPRESSION (me lo paso)', 'AC715GW',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-19T00:00:00.000Z'
    );

    -- Casos Row 66
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003912122', '6627062', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'VOLKSWAGEN', 'AMAROK V6 30TD 4X4 DC AT 224HP -si', 'AC677GJ',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 67
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'milmartinez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003923082', '6627105', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'POLO 1.6 L/16 COM. 4 P TIP.', 'AC659DX',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 68
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924065', '6627199', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FORD', 'KA 1.5 SEL (no me paso nada)', 'AC058PT',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 69
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003870839', '6627218', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'PEUGEOT', '308 1.6 HDI FELINE - (esperando que lo migren)', 'AE125HK',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-11T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 70
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003896917', '6627472', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'SAVEIRO 1.6 L/17 C/DOBLE PACK HIGH', 'AC885NQ',
        'Migrado desde Excel',
        '2026-02-10T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 71
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003926138', '490200', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'VOLKSWAGEN', 'NIVUS 200 TSI HIGHLINE AT L/25 (no me paso nada)', 'AH032JZ',
        'Migrado desde Excel',
        '2026-02-11T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 72
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003881315', '490214', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'HONDA', 'CRV 2.4 4X2 LX AUT L/12', 'OOO252',
        'Migrado desde Excel',
        '2026-02-11T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 73
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924586', '490069', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CHEVROLET', 'TRACKER 1.2 TURBO AT6', 'AF622FZ',
        'Migrado desde Excel',
        '2026-02-11T00:00:00.000Z', '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-13T00:00:00.000Z'
    );

    -- Casos Row 74
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003841114', '489644', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CITROEN', 'C 4 LOUNGE 2.0 I FEEL PK (no me paso nada)', 'AA438TK',
        'Migrado desde Excel',
        '2026-02-11T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 75
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmoscato@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003922592', '491763', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', 'CRONOS 1.3 DRIVE L/22 (me lo paso 24/2)', 'AF483QS',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 76
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mdambrosio@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924385', '491391', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'VOLKSWAGEN', 'FOX 1.6 CROSSFOX HIGHLINE L/10', 'MUY540',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 77
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003803487', '491032', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'FORD', 'TRANSIT 2.2 TDI FURGON MEDIO L/15 (no me paso nada)', 'AD379DW',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 78
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'msasso@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003847206', '490991', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', '-', '', '-',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 79
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003885402', '490979', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'contactado', 'ip_con_orden', 'FORD', 'ECO SPORT 1.5 TDCI SE L/13', 'PIE150',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 80
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003906114', '490939', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'CHEVROLET', 'ONIX 1.4 LTZ AUT L/17 (esperando nuevo presupuesto 23/2)', 'AB411XY',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', '2026-02-13T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 81
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924620', '6628199', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'SANDERO II 1.6 16V LIFE L/23', 'AG416DL',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-19T00:00:00.000Z'
    );

    -- Casos Row 82
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003916858', '6628337', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'TOYOTA', 'ETIOS 1.5 5 PTAS XLS PACK 4AT', 'AG106LO',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 83
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920708', '6628566', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'PEUGEOT', '208 L/20 1.6 FELINE TIPTRONIC', 'AG170BC',
        'Migrado desde Excel',
        '2026-02-12T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 84
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mascallia@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003916373', '493327', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'RENAULT', 'CLIO 2 F2 1.2 5 P. PACK PLUS', 'KBQ223',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-23T00:00:00.000Z'
    );

    -- Casos Row 85
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003914010', '492940', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'KANGOO 1.5 DCI STEPWAY L/18', 'AF998KA',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z'
    );

    -- Casos Row 86
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003902046', '492538', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'PEUGEOT', '208 L/20 1.6 FELINE TIPTRONIC(esperando respuesta)', 'AG405OJ',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z'
    );

    -- Casos Row 87
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003927535', '492511', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CITROEN', 'C 4 LOUNGE 1.6 HDI FEEL PK', 'AB201ZH',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 88
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924847', '492373', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FORD', 'FOCUS L/16 2.0 4 P TITANIUM POWER (esperando respuesta)', 'AC566BV',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 89
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003921279', '492176', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'FORD', 'FIESTA 1.6 5P S (KD)   (me lo paso 24/2)', 'PHR244',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 90
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'vcingolani@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003844566', '6628735', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'ENAULT', 'KANGOO 1.6 SCE STEPWAY L/18 -', 'AG799TB',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-19T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z'
    );

    -- Casos Row 91
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003900039', '6628872', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'PEUGEOT', '208 1.6 5P FELINE PK CUIR (preguntado a nico)', 'OMH972',
        'Migrado desde Excel',
        '2026-02-13T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z', '2026-02-18T00:00:00.000Z'
    );

    -- Casos Row 92
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003927715', '495961', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'RENAULT', 'KANGOO 2 1.6 EXPRESS 1 PLC CON. L/14', 'AB368PT',
        'Migrado desde Excel',
        '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 93
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mascallia@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003923223', '495958', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'AUDI', 'A4 2.0 T L/16 190HP S-TRONIC', 'AE267ZT',
        'Migrado desde Excel',
        '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 94
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003909976', '495301', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FIAT', 'FIORINO FURGON 1.4 EVO (esperando para dar de alta)', 'POC828',
        'Migrado desde Excel',
        '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 95
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'dbenitez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003928538', '495012', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'YARIS 1.5 5 PTAS XLS CVT L/20 (esperando respuesta)', 'AE540TV',
        'Migrado desde Excel',
        '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z'
    );

    -- Casos Row 96
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003890949', '494218', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'ECO SPORT 1.6 SE L/13', 'AB339EO',
        'Migrado desde Excel',
        '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 97
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003888173', '6629862', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'FOX 1.6 5 P. TRENDLINE L/15', 'OSY762',
        'Migrado desde Excel',
        '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 98
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003926313', '6629895', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'PEUGEOT', '208 L/20 1.6 ACTIVE', 'AE939MO',
        'Migrado desde Excel',
        '2026-02-18T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 99
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003929534', '497996', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'JMEV', 'EASY 3  (reclamada )', 'AH759EV',
        'Migrado desde Excel',
        '2026-02-19T00:00:00.000Z', '2026-02-27T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 100
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmoscato@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003928961', '6630411', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'HONDA', 'FIT 1.5 EX 5 PTAS L/09//L/13', 'IPN404',
        'Migrado desde Excel',
        '2026-02-19T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 101
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003898684', '6630617', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'SANDERO II 1.6 8V AUTHENTIQUE (esperando alta de taller)', 'AB195BU',
        'Migrado desde Excel',
        '2026-02-19T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 102
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003926987', '6630663', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'RENAULT', 'SANDERO II 1.6 8V  (Cargado, esperando acuerdo renault)', 'AB892LQ',
        'Migrado desde Excel',
        '2026-02-19T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 103
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003850991', '6630676', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'RANGER 3.0 TDI DC 4X4 L/23 LTD+ V6 10AT', 'AG306JW',
        'Migrado desde Excel',
        '2026-02-19T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 104
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmoscato@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003913351', '6630693', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FORD', 'RANGER 3.0 TDI DC 4X4 L/23 LTD+ V6 10AT', 'AG306JW',
        'Migrado desde Excel',
        '2026-02-19T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 105
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919401', '499999', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CHEVROLET', 'CRUZE 1.4 5 PTAS LTZ AT', 'AA786DA',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 106
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mascallia@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003926104', '500024', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'BRONCO 2.0T SPORT BADLANDS L/25', 'AI016DF',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 107
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003928527', '499910', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CHEVROLET', 'CRUZE 1.4 4 PTAS LT AT', 'AF882CH',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 108
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003932728', '499871', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', '500X 1.4 POP STAR', 'AC973DO',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 109
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pgirardin@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003881327', '499755', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'RENAULT', 'SCENIC RXE 2.0 ABS', 'DOO751',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-20T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 110
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003928232', '499600', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'PEUGEOT', '208 L/24 1.0 T200 ALLURE PK CVT  (reclamada )', 'AH608ZD',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 111
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003867416', '499159', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'GOL 1.6 3 P TREND L/13', 'AA010YS',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 112
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003925115', '499144', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'FORD', 'TERRITORY 1.8T TITANIUM', 'AG226SX',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-26T00:00:00.000Z'
    );

    -- Casos Row 113
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003930218', '499142', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'CHRYSLER', 'JEEP COMPASS 1.3T 270 SERIE-S AT6 L/24', 'AH472IS',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 114
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003922311', '498549', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'AMAROK 20TD 4X2 DC TREN 140HP L17', 'AG099MC',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-26T00:00:00.000Z'
    );

    -- Casos Row 115
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003931018', '6631101', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'FIAT', '500 1.4 LOUNGE AUT', 'AD257XG',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 116
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920275', '6631157', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'RENAULT', 'KWID 1.0 ICONIC OUTSIDER L/25', 'AH883VO',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 117
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003928565', '6631206', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'RENAULT', 'SANDERO STEPWAY PH2 1.6 ZEN L19', 'AF463GS',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 118
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003839449', '6631245', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'RENAULT', 'KWID 1.0 ICONIC OUTSIDER L/25', 'AH883VH',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 119
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003887046', '6631345', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'RANGER 2.2 TDI DC 4X4 L/19 XL', 'AG027IH',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 120
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'rmomartinez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003915759', '6631374', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ampliacion', 'FORD', 'MONDEO 2.0 SEL ECOBOOST AUT', 'AE196FN',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 121
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003905090', '6631396', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'TOYOTA', 'COROLLA 1.8 XEI L/11', 'MEX341',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 122
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003930631', '6631437', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'POLO 1.6 L/23 MSI TRACK', 'AG731SX',
        'Migrado desde Excel',
        '2026-02-20T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-02-27T00:00:00.000Z'
    );

    -- Casos Row 123
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924952', '502480', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'VOLKSWAGEN', 'AMAROK 20TD 4X4 DC HIG.180HP PK (NO ME PASO NADA)', 'NMB057',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 124
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003913341', '502461', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'MOBI EASY  (No me paso nada)', 'AE217CE',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-03-03T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 125
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003930489', '502426', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'RENAULT', 'KANGOO EX. 1.6 PROFESIONAL SCE L/18  (NO ME PASO NADA)', 'AD662BH',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 126
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003932430', '502262', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'ETIOS 1.5 4 PTAS XLS PACK 6MT (NO ME PASO NADA)', 'AG022ZM',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 127
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003934446', '502324', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'FIAT', 'CRONOS 1.3 GSE DRIVE PACK PLUS L/23', 'AF999CB',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 128
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003907993', '501906', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'CHEVROLET', 'ONIX 1.4 ACTIV L/17', 'AC019BA',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-26T00:00:00.000Z'
    );

    -- Casos Row 129
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003933894', '501799', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'AMAROK 20TD 4X2 DC HIG.180HP A L17  (reclamada )', 'AG182VA',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 130
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003931614', '501652', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'COROLLA 1.8 XEI L/11 PACK AUT (NO ME PASO NADA)', 'MKB665',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 131
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003873953', '501585', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'RANGER 3.2 TDI DC 4X2 L/12 XLS', 'AE011BE',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z'
    );

    -- Casos Row 132
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'fsoloneski@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003932569', '501025', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'PEUGEOT', '308 1.6 HDI FELINE', 'AF186RK',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 133
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cpavon@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003904919', '500876', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'TOYOTA', 'COROLLA 1.8 XEI L/17 (Cargado, esperando convenio)', 'AB812RA',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 134
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'vcingolani@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '310025869', '6631735', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'ZANELLA', 'MOTOS RZ 650', 'A170XQG',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 135
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003932708', '6631807', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'TOYOTA', 'YARIS 1.5 5 PTAS S CVT L/22  (me lo paso )', 'AG311QD',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 136
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003921343', '6631957', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'RENAULT', 'CLIO MIO 1.2 5 P DYNAMIQUE SAT (me lo paso esperando que la migren)', 'AA790PQ',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 137
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'miiglesias@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003928195', '6632019', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'FIORINO FURGON 1.4 EVO TOP', 'AC311JY',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 138
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003656281', '6632173', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'RENAULT', 'MASTER 2.3 DCI FURGON L1H1 AA', 'AE553ES',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 139
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'fsantorum@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003934309', '6632247', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'HYUNDAI', 'TUCSON 2.0 4X4 TD EXCLU. AUT L/16  (NO ME PASO NADA)', 'AB091YC',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 140
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003930516', '6632253', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'TOYOTA', 'COROLLA 1.8 XEI L/17 PACK', 'AD622HN',
        'Migrado desde Excel',
        '2026-02-23T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 141
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924253', '504726', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'PEUGEOT', '308 2.0 FELINE', 'MYJ990',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 142
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920384', '504685', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'CRONOS 1.3 DRIVE GSE PACK CONECTI.', 'AC638TI',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-04-04T00:00:00.000Z'
    );

    -- Casos Row 143
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003917112', '504503', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'PEUGEOT', '208 L/20 1.6 ALLURE TIPTRONIC (NO ME PASO NADA)', 'AF687KB',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-02-27T00:00:00.000Z'
    );

    -- Casos Row 144
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003932022', '504408', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ausente', 'VOLKSWAGEN', 'GOL 1.6 5 P TRENDLINE L/19', 'AF010DE',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'
    );

    -- Casos Row 145
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003869867', '503927', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'RENAULT', 'SANDERO 1.6 16V PRIVILEGE  (No me paso nada)', 'NRK863',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'
    );

    -- Casos Row 146
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003925175', '503654', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'CHEVROLET', 'CRUZE 1.4  (reclama 80 veces, no me la pasa) (en mauro duranti)', 'AF885GX',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 147
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'rfernandez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003909044', '6632310', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'TOYOTA', 'ETIOS 1.5 4 PTAS XLS 4AT L/18', 'AF208CE',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z', '2026-02-24T00:00:00.000Z'
    );

    -- Casos Row 148
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'amrodriguez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003918072', '6641588', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'FIAT', 'CRONOS 1.8 PRECISION L/21 (no me paso nada, reclamada)', 'AE967HD',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 149
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003933768', '6660242', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KWID 1.0 ICONIC OUTSIDER L/25', 'AH871LH',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-25T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 150
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'camgonzalez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003935095', '6660404', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'NISSAN', 'MARCH 1.6 ACTIVE PURE DRIVE (esperando datos para dar de alta)', 'AD054CR',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'
    );

    -- Casos Row 151
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003924118', '6660574', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'PEUGEOT', '208 L/20 1.2 LIKE', 'AE378XQ',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 152
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mdambrosio@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003919718', '6660610', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'VOLKSWAGEN', 'GOL TREND 1.6 3 P L/13', 'NNC242',
        'Migrado desde Excel',
        '2026-02-24T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 153
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'fsantorum@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003935137', '506763', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'VOLKSWAGEN', 'VOYAGE 1.6 (no me paso nada, reclamada)', 'LDO703',
        'Migrado desde Excel',
        '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 154
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'milmartinez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920465', '506341', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'PEUGEOT', 'PARTNER 1.6 HDI CONFORT L/23', 'AG611SN',
        'Migrado desde Excel',
        '2026-02-25T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 155
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'camgonzalez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003931544', '506175', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'VOLKSWAGEN', 'GOLF VII 1.4 TSI COMFORTLINE', 'AD480WW',
        'Migrado desde Excel',
        '2026-02-25T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 156
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mascallia@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003936115', '505103', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_con_orden', 'CHEVROLET', 'PRISMA 1.4 LTZ AUT L/17', 'AD499NR',
        'Migrado desde Excel',
        '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 157
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003934517', '6671214', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'CHEVROLET', 'ONIX 1.0T LT L/25', 'AH790CH',
        'Migrado desde Excel',
        '2026-02-25T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 158
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003930301', '6671539', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'contactado', 'ip_con_orden', 'RENAULT', 'SANDERO STEPWAY II 1.6 EXPRESSION', 'AD725SB',
        'Migrado desde Excel',
        '2026-02-25T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 159
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mmaccarrone@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003899198', '6671607', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'CHEVROLET', 'CLASSIC 1.4 4 PTAS LS ABS AB', 'NVM886',
        'Migrado desde Excel',
        '2026-02-25T00:00:00.000Z', '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z'
    );

    -- Casos Row 160
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003912067', '508542', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'TOYOTA', 'COROLLA 1.8 XEI L/14', 'OIZ561',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-05T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 161
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003803487', '508514', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ampliacion', 'FORD', 'TRANSIT 2.2 TDI FURGON MEDIO L/15 ( en consulta con lucas)', 'AD379DW',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'
    );

    -- Casos Row 162
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003933110', '507978', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'GOL 1.6 5 P TREND L/17 COMFORT', 'AB416AS',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-05T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 163
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003935416', '507713', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'ip_sin_orden', 'FORD', 'ECO SPORT 2.0 TITANIUM AUT L/13', 'OMK412',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z'
    );

    -- Casos Row 164
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003922280', '507637', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ampliacion', 'VOLKSWAGEN', 'AMAROK 30TD 4X4 DC AT 258HP (no me paso nada, reclamada)', 'AF908KM',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 165
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'madecarvalho@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003921766', '507601', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'TOYOTA', 'YARIS 1.5 5 PTAS XS L/22   (No me paso nada)', 'AF409BF',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 166
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'hrorpizikian@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003937144', '507491', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'SIENA 1.4 EL', 'PMC458',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 167
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003929506', '6671716', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KANGOO EXPRESS 1.6 EMOTION SCE L/18', 'AD421VO',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 168
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003934543', '6671720', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KWID 1.0 ZEN', 'AD975GN',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 169
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmoscato@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003935851', '6671734', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_sin_orden', 'FORD', 'KA 1.5 FREESTYLE SEL L/18', 'AD832ZC',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-02T00:00:00.000Z'
    );

    -- Casos Row 170
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003936648', '6671883', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'CHEVROLET', 'P-UP S10 2.8TD DC 4X4 HC AT L/21', 'AE701TS',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 171
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmoscato@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003936592', '6671951', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'POLO 1.0 170 TSI COMFORTLINE AUT', 'AH172UC',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-04-04T00:00:00.000Z'
    );

    -- Casos Row 172
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003935960', '6672250', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'VOLKSWAGEN', 'POLO 1.6 L/23 MSI TRACK   (No me paso nada)', 'AH560FM',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 173
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003150744', '6672366', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'CITROEN', 'BERLINGO MULTISPACE 1.6I XTR   (No me paso nada)', 'AD484WL',
        'Migrado desde Excel',
        '2026-02-26T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 174
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003839197', '510446', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'FIAT', 'MOBI EASY  (No me paso nada)', 'AD933IY',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 175
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'milmartinez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003904635', '510423', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'T-CROSS 1.0 200 TSI TRENDLINE AT L/24 (reclamada )', 'AH113XY',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 176
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003923276', '510205', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'CRONOS 1.8 PRECISION AUT', 'AC515DN',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 177
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003857896', '509970', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'MOBI TREEKKING', 'AG890LR',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-05T00:00:00.000Z'
    );

    -- Casos Row 178
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'rfernandez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003920311', '509434', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'FIAT', 'IDEA 1.4 ELX TOP', 'HNY498',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 179
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003938020', '509376', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'CHEVROLET', 'ONIX 1.4 LT L/17  (No me paso nada)', 'AA722YF',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 180
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003669041', '509372', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'CITROEN', 'C 3 1.5I ORIGINE PACK ZENITH', 'OVD088',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 181
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003934781', '509335', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'FIAT', 'CRONOS 1.8 PRECISION L/21  (No me paso nada)', 'AE773XD',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 182
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003938423', '509173', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FORD', 'RANGER 2.0 TDI DC 4X4 L/23 LTD 10AT', 'AH346VU',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 183
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003703531', '6672891', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'RENAULT', 'OROCH 2.0 OUTSIDER (no me paso nada)', 'AA649BS',
        'Migrado desde Excel',
        '2026-02-27T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 184
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003685335', '511589', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'PALIO 1.4 5 P ATTRACT L/14', 'AB331YK',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 185
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'milmartinez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003940689', '512571', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'HONDA', 'HR-V 1.8 EXL CVT', 'AC813EO',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 186
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003928306', '512601', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'CHRYSLER', 'RAM RAMPAGE 2.0 T D/CAB 4X4 LARAMIE AT', 'AH342KR',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 187
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003931896', '512565', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'PEUGEOT', '208 1.6 GT', 'AE165DT',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 188
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'hrorpizikian@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003940537', '512323', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'FORD', 'ECO SPORT 1.6 S L/13', 'MSJ593',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 189
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'vloray@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003929640', '512701', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'PEUGEOT', '208 L/20 1.6 LIKE PACK', 'AF610IQ',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 190
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003935949', '512141', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FIAT', 'TORO 1.8MPI FREEDOM 4X2 AT L/21', 'AF858XV',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 191
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'amrodriguez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003938080', '512009', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_cerrada', 'posible_dt', 'VOLKSWAGEN', 'GOL 1.6 3 P FORMAT/POWER DH AA', 'EVU672',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'
    );

    -- Casos Row 192
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003937372', '511389', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'TOYOTA', 'ETIOS 1.5 5 PTAS CROSS', 'OKG589',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-19T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 193
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'hrorpizikian@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003939463', '511193', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'CITROEN', 'C 3 1.5I TENDANCE PACK SECURE', 'MXJ310',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 194
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003880555', '6673054', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'FORD', 'KA 1.5 SE L/18', 'AE427UJ',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 195
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003937991', '6673105', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'RENAULT', 'KWID 1.0 ICONIC BITONO L/25', 'AH365QU',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 196
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003937629', '6673113', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KANGOO EXPRESS 1.6 EMOTION SCE 5 AS L/18', 'AF612MM',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 197
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'cvaldez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003938272', '6673146', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'licitando_repuestos', 'ip_con_orden', 'CHEVROLET', 'ONIX 1.4 LTZ', 'MRW399',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL
    );

    -- Casos Row 198
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mascallia@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003917325', '6673243', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'GOLF VII 2.0 GTI', 'AB747TQ',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-10T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 199
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mdambrosio@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003934746', '6682698', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'FIAT', 'CRONOS 1.3 GSE DRIVE PACK PLUS L/23', 'AG175NX',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 200
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003906437', '6682793', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FORD', 'KA 1.5 SE', 'AB949UJ',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-05T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 201
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003918111', '6682814', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'SANDERO II 1.6 16V LIFE L/23', 'AG192IT',
        'Migrado desde Excel',
        '2026-03-02T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 202
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pasalcedo@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003933820', '514181', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'posible_dt', 'FIAT', 'IDEA ADVENTURE 1.6', 'KIU035',
        'Migrado desde Excel',
        '2026-03-03T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 203
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'jboulle@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003926160', '513822', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'SANDERO II 1.6 8V AUTHENTIQUE', 'AC691CD',
        'Migrado desde Excel',
        '2026-03-03T00:00:00.000Z', '2026-03-04T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 204
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'abinau@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'N CORDOVA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003939714', '683128', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'HONDA', 'FIT 1.4 LXL 5 PTAS AUT L/09//L/13', 'KYF946',
        'Migrado desde Excel',
        '2026-03-03T00:00:00.000Z', NULL, NULL, NULL
    );

    -- Casos Row 205
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003904428', '6683143', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KANGOO 1.5 DCI STEPWAY L/18', 'AF799BY',
        'Migrado desde Excel',
        '2026-03-03T00:00:00.000Z', '2026-03-05T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 206
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'pmalchiodi@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003940936', '6683372', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KANGOO 2 EXPRESS 1.6 CONFORT 1 PLC L/14', 'AB461QB',
        'Migrado desde Excel',
        '2026-03-03T00:00:00.000Z', '2026-03-09T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 207
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003930539', '6683384', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'CHEVROLET', 'PRISMA 1.4 LT L/17', 'AA266EA',
        'Migrado desde Excel',
        '2026-03-03T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 208
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'bdemiguel@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003932599', '6683458', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'CHEVROLET', 'CLASSIC 1.4 4 PTAS LT', 'KTM739',
        'Migrado desde Excel',
        '2026-03-03T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 209
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003922196', '516483', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'CHRYSLER', 'JEEP RENEGADE 1.8 4X2 SPORT AT', 'AE294WO',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 210
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gleguizamon@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003942386', '515982', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'HONDA', 'HR-V 1.8 LX CVT', 'PKY728',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-10T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 211
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'gmgutierrez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003927857', '515631', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'FORD', 'TERRITORY 1.8T TITANIUM L/25', 'AH914VG',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 212
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'vloray@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003942073', '515505', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'PEUGEOT', '208 1.6 5P FELINE PK CUIR', 'PIN417',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 213
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003558996', '6683618', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'PEUGEOT', '208 L/23 1.6 ALLURE PACK TIPTRONIC', 'AG800EV',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-06T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 214
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003939627', '6683688', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'TOYOTA', 'ETIOS 1.5 4 PTAS XLS 4AT L/18', 'AF400HO',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-09T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 215
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'lbarboza@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003939846', '6683755', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KWID 1.0 ICONIC BITONO L/25', 'AH856FQ',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-09T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 216
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'mizzo@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'E DELIA' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003938494', '6683789', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'VOLKSWAGEN', 'GOL TREND 1.6 3 P L/13', 'AB239DU',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-09T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 217
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'rmomartinez@sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'L DEL PIERO' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003923006', '6683897', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'KANGOO EXPRESS 1.6 SCE L/24 5 AS.', 'AG905SJ',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-10T00:00:00.000Z', NULL, NULL
    );

    -- Casos Row 218
    SELECT id INTO v_gestor_id FROM gestores WHERE email = 'milmartinez@ext.sancorseguros.com' LIMIT 1;
    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = 'J. FERLANTI' LIMIT 1;
    INSERT INTO casos (
        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, 
        estado, tipo_inspeccion, marca, modelo, dominio, 
        direccion_inspeccion,
        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre
    ) VALUES (
        v_compania_id, '2003701532', '6683927', v_gestor_id, v_pcalle_id, v_pcarga_id,
        'ip_coordinada', 'ip_con_orden', 'RENAULT', 'CLIO MIO 1.2 5 P DYNAMIQUE SAT', 'PIV997',
        'Migrado desde Excel',
        '2026-03-04T00:00:00.000Z', '2026-03-05T00:00:00.000Z', NULL, NULL
    );

END $$;
