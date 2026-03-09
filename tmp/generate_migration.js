const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('c:/Users/nicol/.gemini/antigravity/scratch/AOMNIS/DatosMigracion.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

let sql = `-- Migracion de Casos desde DatosMigracion.xlsx\n\n`;

const gestoresSet = new Set();
const peritosSet = new Set();

data.forEach(row => {
    if (row['GESTOR']) gestoresSet.add(row['GESTOR'].trim());
    if (row['PERITO']) peritosSet.add(row['PERITO'].trim());
    if (row['PERITO DE CARGA']) peritosSet.add(row['PERITO DE CARGA'].trim());
});

sql += `-- 1. Crear Gestores Faltantes\n`;
sql += `DO $$\nDECLARE\n    v_compania_id UUID;\nBEGIN\n`;
sql += `    SELECT id INTO v_compania_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;\n`;
for (const gestor of gestoresSet) {
    const nombre = gestor.split('@')[0];
    sql += `    IF NOT EXISTS (SELECT 1 FROM gestores WHERE email = '${gestor}') THEN\n`;
    sql += `        INSERT INTO gestores (nombre, email, compania_id) VALUES ('${nombre}', '${gestor}', v_compania_id);\n`;
    sql += `    END IF;\n`;
}
sql += `END $$;\n\n`;


sql += `-- 2. Crear Usuarios Peritos Faltantes\n`;
sql += `DO $$\nBEGIN\n`;
for (const perito of peritosSet) {
    if (!perito) continue;
    const email = perito.toLowerCase().replace(/[^a-z0-9]/g, '') + '_migracion@aomnis.local';
    sql += `    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = '${perito}') THEN\n`;
    sql += `        INSERT INTO usuarios (nombre, apellido, email, rol) VALUES ('${perito}', '', '${email}', 'calle');\n`;
    sql += `    END IF;\n`;
}
sql += `END $$;\n\n`;

sql += `-- 3. Insertar Casos\n`;
sql += `DO $$\nDECLARE\n    v_compania_id UUID;\n    v_gestor_id UUID;\n    v_pcalle_id UUID;\n    v_pcarga_id UUID;\nBEGIN\n`;
sql += `    SELECT id INTO v_compania_id FROM companias WHERE codigo = 'SANCOR' LIMIT 1;\n\n`;

function formatExcelDate(serial) {
    if (!serial || isNaN(serial)) return 'NULL';
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return `'${d.toISOString()}'`;
}

function mapEstado(v) {
    const s = (v || '').toUpperCase();
    if (s.includes('CERRADA') || s.includes('CERRADO')) return 'ip_cerrada';
    if (s.includes('LICITANDO')) return 'licitando_repuestos';
    if (s.includes('FACTURADA')) return 'facturada';
    if (s.includes('RECLAMADO')) return 'ip_reclamada_perito';
    if (s.includes('ANULADO')) return 'inspeccion_anulada';
    if (s.includes('PTE. DE COORDINACION') || s.includes('PDTE. COORDINACION')) return 'pendiente_coordinacion';
    if (s.includes('PTE CARGA') || s.includes('PDTE CARGA') || s.includes('PDTE. CARGA')) return 'pendiente_carga';
    if (s.includes('PTE. PRESUPUESTO')) return 'pendiente_presupuesto';
    if (s.includes('CONTACTADO')) return 'contactado';
    if (s.includes('EN CONSULTA CIA')) return 'en_consulta_cia';
    if (s.includes('ESP. RESPUESTA')) return 'esperando_respuesta_tercero';
    return 'ip_coordinada'; // default fallback
}

function mapTipo(v) {
    const s = (v || '').toUpperCase();
    if (s.includes('SIN ORDEN')) return 'ip_sin_orden';
    if (s.includes('CON ORDEN')) return 'ip_con_orden';
    if (s.includes('POSIBLE DT')) return 'posible_dt';
    if (s.includes('AUSENTE')) return 'ausente';
    if (s.includes('AMPLIACION')) return 'ampliacion';
    return 'ip_con_orden'; // default
}

let count = 0;
data.forEach(row => {
    count++;
    const siniestro = String(row['SINIESTRO'] || '').trim();
    if (!siniestro) return; // skip empty

    const servicio = String(row['N° SERVICIO'] || '').trim();
    const vehiculo = String(row['VEHICULO'] || '').trim();
    const parts = vehiculo.split(' ');
    const marca = parts.length > 0 ? parts[0].replace(/'/g, "''") : '';
    const modelo = parts.length > 1 ? parts.slice(1).join(' ').replace(/'/g, "''") : '';
    const patente = String(row['PATENTE'] || '').trim().replace(/'/g, "''");

    const ingreso = formatExcelDate(row['INGRESO']);
    const fechaIp = formatExcelDate(row['FECHA DE IP']);
    const fechaCarga = formatExcelDate(row['FECHA DE CARGA']);
    const fechaCierre = formatExcelDate(row['CIERRE']);

    const estado = mapEstado(row['ESTADO']);
    const tipo = mapTipo(row['TIPO DE IP']);

    const gestorName = String(row['GESTOR'] || '').trim();
    const peritoCalle = String(row['PERITO'] || '').trim();
    const peritoCarga = String(row['PERITO DE CARGA'] || '').trim();

    sql += `    -- Casos Row ${count}\n`;
    sql += `    SELECT id INTO v_gestor_id FROM gestores WHERE email = '${gestorName}' LIMIT 1;\n`;
    sql += `    SELECT id INTO v_pcalle_id FROM usuarios WHERE nombre = '${peritoCalle}' LIMIT 1;\n`;
    sql += `    SELECT id INTO v_pcarga_id FROM usuarios WHERE nombre = '${peritoCarga}' LIMIT 1;\n`;

    sql += `    INSERT INTO casos (\n`;
    sql += `        compania_id, numero_siniestro, numero_servicio, gestor_id, perito_calle_id, perito_carga_id, \n`;
    sql += `        estado, tipo_inspeccion, marca, modelo, dominio, \n`;
    sql += `        direccion_inspeccion,\n`;
    sql += `        fecha_derivacion, fecha_inspeccion_programada, fecha_carga_sistema, fecha_cierre\n`;
    sql += `    ) VALUES (\n`;
    sql += `        v_compania_id, '${siniestro}', ${servicio ? `'${servicio}'` : 'NULL'}, v_gestor_id, v_pcalle_id, v_pcarga_id,\n`;
    sql += `        '${estado}', '${tipo}', '${marca}', '${modelo}', '${patente}',\n`;
    sql += `        'Migrado desde Excel',\n`;
    sql += `        ${ingreso}, ${fechaIp}, ${fechaCarga}, ${fechaCierre}\n`;
    sql += `    );\n\n`;
});

sql += `END $$;\n`;

fs.writeFileSync('c:/Users/nicol/.gemini/antigravity/scratch/AOMNIS/migracion_2026.sql', sql);
console.log('SQL generated successfully at migracion_2026.sql. ' + count + ' records processed.');
