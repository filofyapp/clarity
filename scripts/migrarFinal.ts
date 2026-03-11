import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Custom mappings for exact matching
const PERITOS_MAP: Record<string, string> = {
    'L DEL PIERO': 'c0000000-0000-0000-0000-000000000003',
    'L. DEL PIERO': 'c0000000-0000-0000-0000-000000000003',
    'J. FERLANTI': '956d035d-c05b-47ee-b8a4-0aaf91f7d346',
    'E DE LIA': '126fa95b-8190-4bdf-a2ba-91f8790aecff',
    'E. DE LIA': '126fa95b-8190-4bdf-a2ba-91f8790aecff',
    'E DELIA': '126fa95b-8190-4bdf-a2ba-91f8790aecff',
    'N CORDOVA': 'a0000000-0000-0000-0000-000000000001',
    'A MIÑO': '683dc803-dc8c-4f79-bbd8-05affc1e477c',
    'A. MIÑO': '683dc803-dc8c-4f79-bbd8-05affc1e477c',
};

// Common states mapping
const ESTADO_MAP: Record<string, string> = {
    'IP CERRADA': 'facturada',
    'PARA FACTURAR': 'ip_cerrada',
    'PENDIENTE DE CARGA': 'pendiente_carga',
    'PENDIENTE CARGA': 'pendiente_carga',
    'IP COORDINADA': 'ip_coordinada',
    'PTE. COORDINACION': 'pendiente_coordinacion',
    'PENDIENTE COORDINACION': 'pendiente_coordinacion',
    'PENDIENTE  COORDINACION': 'pendiente_coordinacion',
    'CONTACTADO': 'contactado',
    'EN CONSULTA CIA': 'en_consulta_cia',
    'EN CONSULTA CON CIA': 'en_consulta_cia',
    'LICITANDO REPUESTOS': 'licitando_repuestos',
    'INSPECCION ANULADA': 'inspeccion_anulada',
    'IP RECLAMADA PERITO': 'ip_reclamada_perito',
    'PTE. PRESUPUESTO': 'pendiente_presupuesto',
    'PENDIENTE PRESUPUESTO': 'pendiente_presupuesto',
    'ESPERANDO RESPUESTA TERCERO': 'esperando_respuesta_tercero',
    'INSPECCIONADA': 'inspeccionada',
    'FACTURADA': 'facturada'
};

const TIPO_IP_MAP: Record<string, string> = {
    'IP CON ORDEN': 'ip_con_orden',
    'POSIBLE DT': 'posible_dt',
    'IP SIN ORDEN': 'ip_sin_orden',
    'AMPLIACION': 'ampliacion',
    'AUSENTE': 'ausente',
    'TERCEROS': 'terceros',
    'IP CAMIONES': 'ip_camiones',
    'IP REMOTA': 'ip_remota',
    'SIN HONORARIOS': 'sin_honorarios',
    'IP FINAL / INTERMEDIA': 'ip_final_intermedia'
};

function excelDateToJSDate(serial: number) {
    // 1900 based system
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    // Add timezone adjustment if strictly necessary, but UTC works for dates
    return date_info.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

async function run() {
    console.log("Cargando maestros de Gestores y Compañías...");
    const { data: gestores } = await supabase.from('gestores').select('id, email');
    const { data: compania } = await supabase.from('companias').select('id, nombre').eq('nombre', 'Sancor Seguros').single();

    const compania_id = compania?.id;
    if (!compania_id) throw new Error("Compañía Sancor no encontrada.");

    console.log("Leyendo DatosMigracion.xlsx...");
    const filePath = path.join(process.cwd(), 'DatosMigracion.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });

    // Skip header row
    const dataRows = rows.slice(1);

    const batchInserts = [];
    const report = { success: 0, errors: 0, missingPeritos: new Set(), missingGestores: new Set() };

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length < 2) continue; // Empty row

        const rawIngreso = row[0]; // could be number
        const siniestro = String(row[1]).trim();
        const rawServicio = row[2];
        const gestorEmail = String(row[3]).trim().toLowerCase();
        let rawEstado = String(row[4]).trim().toUpperCase();
        let rawTipo = String(row[5]).trim().toUpperCase();
        const vehiculoTokens = String(row[7] || "").split(' ');
        const marca = vehiculoTokens[0] || 'S/D';
        const modelo = vehiculoTokens.slice(1).join(' ') || 'S/D';
        const patente = String(row[8] || "").trim();
        const peritoCalleRaw = String(row[9] || "").trim().toUpperCase();
        const rawFechaIP = row[10];
        const peritoCargaRaw = String(row[11] || "").trim().toUpperCase();

        let gestor_id = null;
        if (gestorEmail && gestorEmail !== 'undefined') {
            const foundGestor = gestores?.find(g => g.email === gestorEmail);
            if (foundGestor) {
                gestor_id = foundGestor.id;
            } else {
                report.missingGestores.add(gestorEmail);
            }
        }

        let perito_calle_id = peritoCalleRaw ? PERITOS_MAP[peritoCalleRaw] : null;
        if (peritoCalleRaw && !perito_calle_id && peritoCalleRaw !== 'UNDEFINED' && peritoCalleRaw !== '---') report.missingPeritos.add(peritoCalleRaw);

        let perito_carga_id = peritoCargaRaw ? PERITOS_MAP[peritoCargaRaw] : null;
        if (peritoCargaRaw && !perito_carga_id && peritoCargaRaw !== 'UNDEFINED' && peritoCargaRaw !== '---') report.missingPeritos.add(peritoCargaRaw);

        const fecha_derivacion = typeof rawIngreso === 'number' ? excelDateToJSDate(rawIngreso) : new Date().toISOString().split('T')[0];
        const fecha_inspeccion = typeof rawFechaIP === 'number' ? excelDateToJSDate(rawFechaIP) : null;

        const dbEstado = ESTADO_MAP[rawEstado] || 'pendiente_coordinacion';
        const dbTipo = TIPO_IP_MAP[rawTipo] || 'ip_con_orden';

        if (siniestro === 'undefined' || siniestro === '') continue;

        batchInserts.push({
            compania_id,
            numero_siniestro: siniestro,
            numero_servicio: rawServicio ? String(rawServicio) : null,
            gestor_id,
            gestorEmailTemp: gestorEmail, // temporal para resolver luego de insertar faltantes
            estado: dbEstado,
            tipo_inspeccion: dbTipo,
            marca,
            modelo,
            dominio: patente,
            perito_calle_id,
            perito_carga_id,
            fecha_derivacion,
            fecha_inspeccion_programada: fecha_inspeccion,
            direccion_inspeccion: 'Datos Migrados',
        });
    }

    if (report.missingPeritos.size > 0) {
        console.log("ALERTA - Faltan mapeos de perito:", Array.from(report.missingPeritos));
        console.log("Proceso abortado. Corrija los mapas en el archivo e intente de nuevo.");
        return;
    }

    if (report.missingGestores.size > 0) {
        console.log("Creando Gestores faltantes: ", Array.from(report.missingGestores));
        const newGestores = Array.from(report.missingGestores).map(email => ({
            compania_id,
            nombre: String(email).split('@')[0],
            email: String(email)
        }));

        const { data: insertedGestores, error: errInsertGestor } = await supabase
            .from('gestores')
            .insert(newGestores)
            .select('id, email');

        if (errInsertGestor) {
            console.error("No se pudieron crear los gestores fantasma", errInsertGestor);
            return;
        }

        if (insertedGestores) gestores?.push(...insertedGestores);

        // Remapear
        for (let row of batchInserts) {
            if (!row.gestor_id && row.gestorEmailTemp && row.gestorEmailTemp !== 'undefined') {
                const found = gestores?.find(g => g.email === row.gestorEmailTemp);
                if (found) row.gestor_id = found.id;
            }
            delete (row as any).gestorEmailTemp;
        }
    } else {
        for (let row of batchInserts) delete (row as any).gestorEmailTemp;
    }

    // Deduplicar batchInserts conservando el último (el estado más reciente de la planilla)
    const uniqueBatchInserts: any[] = [];
    const seenMap = new Map();
    for (let row of batchInserts) {
        seenMap.set(row.numero_siniestro, row);
    }
    for (let [key, val] of seenMap.entries()) {
        uniqueBatchInserts.push(val);
    }

    console.log(`Pre-procesados ${uniqueBatchInserts.length} casos únicos. Mapeando a DB...`);

    // Check if cases already exist to separate inserts from updates (Supabase requires homogeneous arrays)
    const { data: existingCases } = await supabase.from('casos').select('id, numero_siniestro');

    const toInsert = [];
    const toUpdate = [];

    for (let row of uniqueBatchInserts) {
        const foundCase = existingCases?.find(c => c.numero_siniestro === row.numero_siniestro);
        if (foundCase) {
            row.id = foundCase.id;
            toUpdate.push(row);
        } else {
            toInsert.push(row);
        }
    }

    const chunkSize = 50;

    console.log(`Iniciando UPDATES (${toUpdate.length})...`);
    for (let i = 0; i < toUpdate.length; i += chunkSize) {
        const chunk = toUpdate.slice(i, i + chunkSize);
        const { error } = await supabase.from('casos').upsert(chunk);
        if (error) console.error("Error intermedio actualizando bloque:", error.message);
    }

    console.log(`Iniciando INSERTS (${toInsert.length})...`);
    for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('casos').insert(chunk);
        if (error) console.error("Error intermedio insertando bloque:", error.message);
    }

    console.log("¡Migración Completada!");
}

run().catch(console.error);
