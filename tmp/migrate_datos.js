/**
 * Full data migration from DatosMigracion.xlsx
 * 
 * 1. Delete ALL existing cases
 * 2. Import 488 rows from Excel
 * 3. Map perito names to real user IDs
 * 4. Map estados and tipos to DB enum values
 * 5. Parse Excel serial dates
 * 6. Compute billing amounts from precios table
 */
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync('.env.local', 'utf-8');
let url = '', key = '';
envFile.split('\n').forEach(l => {
    if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.split('=').slice(1).join('=').trim();
    if (l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = l.split('=').slice(1).join('=').trim();
});
const supabase = createClient(url, key);

// ═══ Excel serial date → JS Date ═══
function excelDateToISO(serial) {
    if (!serial || serial === '') return null;
    if (typeof serial === 'string') {
        // Already a date string
        const d = new Date(serial);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        return null;
    }
    // Excel serial: days since 1900-01-01 (with the 1900 bug: day 60 = Feb 29 1900 which doesn't exist)
    const epoch = new Date(1899, 11, 30); // Dec 30, 1899
    const d = new Date(epoch.getTime() + serial * 86400000);
    return d.toISOString().split('T')[0];
}

// ═══ Perito name → ID mapping ═══
const PERITO_MAP = {
    'L DEL PIERO': null,    // Lucas del Piero
    'E DELIA': null,         // Emiliano De Lia
    'A MIÑO': null,          // Alfredo Miño
    'J. FERLANTI': null,     // Jairo Ferlanti
    'J FERLANTI': null,      // Jairo Ferlanti (alt)
    'N CORDOVA': null,       // Nicolás Cordova
};

// ═══ Estado mapping (Excel display → DB key) ═══
const ESTADO_MAP = {
    'IP CERRADA': 'ip_cerrada',
    'INSPECCION ANULADA': 'inspeccion_anulada',
    'CONTACTADO': 'contactado',
    'PENDIENTE PRESUPUESTO': 'pendiente_presupuesto',
    'IP COORDINADA': 'ip_coordinada',
    'LICITANDO REPUESTOS': 'licitando_repuestos',
    'PENDIENTE  COORDINACION': 'pendiente_coordinacion',
    'PENDIENTE COORDINACION': 'pendiente_coordinacion',
    'EN CONSULTA CON CIA': 'en_consulta_cia',
    'FACTURADA': 'facturada',
    'PENDIENTE CARGA': 'pendiente_carga',
};

// ═══ Tipo IP mapping (Excel display → DB key) ═══
const TIPO_IP_MAP = {
    'AUSENTE': 'ausente',
    'IP CON ORDEN': 'ip_con_orden',
    'IP SIN ORDEN': 'ip_sin_orden',
    'SIN HONORARIOS': 'ip_sin_orden', // Map to ip_sin_orden, no billing
    'IP FINAL/INTERMEDIA': 'ip_final_intermedia',
    'AMPLIACION': 'ampliacion',
    'POSIBLE DT': 'posible_dt',
    'TERCEROS': 'terceros',
    'IP REMOTA': 'ip_remota',
    'IP CAMIONES': 'ip_camiones',
};

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  MIGRACIÓN DE DATOS: DatosMigracion.xlsx`);
    console.log(`  MODO: ${DRY_RUN ? '🔍 DRY RUN' : '🔴 EJECUCIÓN REAL'}`);
    console.log(`${'═'.repeat(50)}\n`);

    // ═══ PASO 0: Cargar peritos reales ═══
    console.log('📋 Cargando peritos reales...\n');
    const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, roles')
        .eq('activo', true);

    // Resolve perito names to IDs
    for (const u of usuarios) {
        const fullName = `${u.nombre} ${u.apellido}`.toUpperCase();
        const lastName = u.apellido.toUpperCase();

        if (lastName.includes('DEL PIERO') || fullName.includes('DEL PIERO')) {
            PERITO_MAP['L DEL PIERO'] = u.id;
        }
        if (lastName.includes('DE LIA') || lastName.includes('DELIA') || fullName.includes('EMILIANO')) {
            PERITO_MAP['E DELIA'] = u.id;
        }
        if (lastName.includes('MIÑO') || lastName.includes('MINO')) {
            PERITO_MAP['A MIÑO'] = u.id;
        }
        if (lastName.includes('FERLANTI')) {
            PERITO_MAP['J. FERLANTI'] = u.id;
            PERITO_MAP['J FERLANTI'] = u.id;
        }
        if (lastName.includes('CORDOVA') || lastName.includes('CÓRDOVA')) {
            PERITO_MAP['N CORDOVA'] = u.id;
        }
    }

    console.log('Mapeo de peritos:');
    Object.entries(PERITO_MAP).forEach(([name, id]) => {
        console.log(`  ${name} → ${id || '❌ NO ENCONTRADO'}`);
    });

    // ═══ PASO 0b: Cargar gestores ═══
    const { data: gestores } = await supabase
        .from('gestores')
        .select('id, nombre, email')
        .eq('activo', true);

    const gestorByEmail = {};
    (gestores || []).forEach(g => {
        if (g.email) gestorByEmail[g.email.toLowerCase()] = g.id;
    });

    console.log(`\n📋 ${(gestores || []).length} gestores cargados`);

    // ═══ PASO 0c: Cargar precios para billing ═══
    const { data: companias } = await supabase.from('companias').select('id').eq('codigo', 'SANCOR').single();
    const companiaId = companias.id;

    const { data: precios } = await supabase
        .from('precios')
        .select('concepto, valor_estudio, valor_perito_calle, valor_perito_carga')
        .eq('compania_id', companiaId)
        .eq('tipo', 'honorario');

    const preciosMap = {};
    (precios || []).forEach(p => { preciosMap[p.concepto] = p; });
    console.log(`📋 ${(precios || []).length} precios cargados\n`);

    // ═══ PASO 1: Leer Excel ═══
    const workbook = XLSX.readFile(path.join(__dirname, '..', 'DatosMigracion.xlsx'));
    const data = XLSX.utils.sheet_to_json(workbook.Sheets['Hoja1'], { defval: '' });
    console.log(`📊 ${data.length} filas leídas del Excel\n`);

    // ═══ PASO 2: Borrar casos existentes ═══
    if (!DRY_RUN) {
        console.log('🗑️ Eliminando historial_estados existente...');
        const { error: eHist } = await supabase.from('historial_estados').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (eHist) console.log(`  ❌ ${eHist.message}`);
        else console.log('  ✅ Historial limpiado');

        console.log('🗑️ Eliminando casos existentes...');
        // Delete in batches — first remove caso_origen_id refs, then delete
        await supabase.from('casos').update({ caso_origen_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: eDel } = await supabase.from('casos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (eDel) console.log(`  ❌ ${eDel.message}`);
        else console.log('  ✅ Casos eliminados');
    } else {
        console.log('🔍 DRY RUN: No se eliminan datos\n');
    }

    // ═══ PASO 3: Insertar casos ═══
    let inserted = 0, errors = 0, skipped = 0;
    const siniestroFirstCase = {}; // Track first case ID for each siniestro (for ampliaciones)
    const sinHonorarios = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const siniestro = String(row['SINIESTRO'] || '').trim();
        if (!siniestro) { skipped++; continue; }

        const numServicio = String(row['N° SERVICIO'] || '').trim() || null;
        const gestorEmail = String(row['GESTOR'] || '').trim().toLowerCase();
        const estadoExcel = String(row['ESTADO'] || '').trim().toUpperCase();
        const tipoExcel = String(row['TIPO DE IP'] || '').trim().toUpperCase();
        const vehiculo = String(row['VEHICULO'] || '').trim() || null;
        const patente = String(row['PATENTE'] || '').trim().toUpperCase() || null;
        const peritoCalleNombre = String(row['PERITO'] || '').trim().toUpperCase();
        const peritoCargaNombre = String(row['PERITO DE CARGA'] || '').trim().toUpperCase();

        const fechaIngreso = excelDateToISO(row['INGRESO']);
        const fechaIP = excelDateToISO(row['FECHA DE IP']);
        const fechaCarga = excelDateToISO(row['FECHA DE CARGA']);
        const fechaCierre = excelDateToISO(row['CIERRE']);

        // Map estado
        const estado = ESTADO_MAP[estadoExcel] || 'pendiente_coordinacion';
        if (!ESTADO_MAP[estadoExcel]) {
            console.log(`  ⚠️ Row ${i + 1}: Estado desconocido "${estadoExcel}" → pendiente_coordinacion`);
        }

        // Map tipo
        let tipoInspeccion = TIPO_IP_MAP[tipoExcel] || 'ip_con_orden';
        const esSinHonorarios = tipoExcel === 'SIN HONORARIOS';
        if (!TIPO_IP_MAP[tipoExcel]) {
            console.log(`  ⚠️ Row ${i + 1}: Tipo IP desconocido "${tipoExcel}" → ip_con_orden`);
        }

        // Resolve perito IDs
        const peritoCelleId = PERITO_MAP[peritoCalleNombre] || null;
        const peritoCargaId = PERITO_MAP[peritoCargaNombre] || null;

        if (peritoCalleNombre && !peritoCelleId) {
            console.log(`  ⚠️ Row ${i + 1}: Perito calle "${peritoCalleNombre}" no mapeado`);
        }
        if (peritoCargaNombre && !peritoCargaId) {
            console.log(`  ⚠️ Row ${i + 1}: Perito carga "${peritoCargaNombre}" no mapeado`);
        }

        // Resolve gestor
        const gestorId = gestorByEmail[gestorEmail] || null;

        // Billing
        const esCerrado = ['ip_cerrada', 'facturada'].includes(estado);
        const precio = preciosMap[tipoInspeccion];
        let montoEstudio = 0, montoCalle = 0, montoCarga = 0;
        if (esCerrado && precio && !esSinHonorarios) {
            montoEstudio = precio.valor_estudio || 0;
            montoCalle = precio.valor_perito_calle || 0;
            montoCarga = precio.valor_perito_carga || 0;
        }
        if (esSinHonorarios) {
            sinHonorarios.push(siniestro);
        }

        // Detect ampliacion: if same siniestro already appeared
        let casoOrigenId = null;
        if (siniestroFirstCase[siniestro]) {
            casoOrigenId = siniestroFirstCase[siniestro];
        }

        const casoData = {
            compania_id: companiaId,
            numero_siniestro: siniestro,
            numero_servicio: numServicio,
            gestor_id: gestorId,
            tipo: 'asegurado',
            tipo_inspeccion: tipoInspeccion,
            estado,
            dominio: patente,
            marca: vehiculo,
            direccion_inspeccion: 'Sin dirección', // NOT NULL constraint — Excel has no address data
            perito_calle_id: peritoCelleId,
            perito_carga_id: peritoCargaId,
            fecha_derivacion: fechaIngreso,
            fecha_inspeccion_programada: fechaIP,
            fecha_inspeccion_real: fechaIP, // Use same as programmed for migrated data
            fecha_carga_sistema: fechaCarga,
            fecha_cierre: fechaCierre,
            prioridad: 'normal',
            caso_origen_id: casoOrigenId,
            monto_facturado_estudio: montoEstudio,
            monto_pagado_perito_calle: montoCalle,
            monto_pagado_perito_carga: montoCarga,
            datos_crudos_sancor: row['EN TRAMITE'] ? `Estado trámite: ${row['EN TRAMITE']}` : null,
        };

        if (DRY_RUN) {
            if (i < 3) {
                console.log(`\n[DRY] Row ${i + 1}: ${siniestro}`);
                console.log(`  Estado: ${estadoExcel} → ${estado}`);
                console.log(`  Tipo: ${tipoExcel} → ${tipoInspeccion}`);
                console.log(`  Perito Calle: ${peritoCalleNombre} → ${peritoCelleId || 'null'}`);
                console.log(`  Perito Carga: ${peritoCargaNombre} → ${peritoCargaId || 'null'}`);
                console.log(`  Fechas: ingreso=${fechaIngreso} ip=${fechaIP} carga=${fechaCarga} cierre=${fechaCierre}`);
                console.log(`  Billing: estudio=$${montoEstudio} calle=$${montoCalle} carga=$${montoCarga}`);
                if (casoOrigenId) console.log(`  → AMPLIACIÓN de ${casoOrigenId}`);
            }
            inserted++;
        } else {
            const { data: inserted_caso, error } = await supabase
                .from('casos')
                .insert(casoData)
                .select('id')
                .single();

            if (error) {
                console.log(`  ❌ Row ${i + 1} (${siniestro}): ${error.message}`);
                errors++;
            } else {
                // Track first occurrence for ampliacion linking
                if (!siniestroFirstCase[siniestro]) {
                    siniestroFirstCase[siniestro] = inserted_caso.id;
                }
                inserted++;

                // Also create a historial entry
                await supabase.from('historial_estados').insert({
                    caso_id: inserted_caso.id,
                    estado_anterior: null,
                    estado_nuevo: estado,
                    motivo: casoOrigenId ? `Migrado (Ampliación del siniestro ${siniestro})` : 'Migrado desde Excel',
                });
            }
        }
    }

    console.log(`\n${'━'.repeat(50)}`);
    console.log(`📊 RESUMEN:`);
    console.log(`   Insertados: ${inserted}`);
    console.log(`   Errores:    ${errors}`);
    console.log(`   Saltados:   ${skipped}`);
    if (sinHonorarios.length > 0) {
        console.log(`   Sin honorarios: ${sinHonorarios.length} (${sinHonorarios.join(', ')})`);
    }
    console.log(`${'━'.repeat(50)}\n`);
}

main().catch(console.error);
