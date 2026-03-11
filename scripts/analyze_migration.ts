import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Analizando DatosMigracion.xlsx contra la Base de Datos Actual...");
    const filePath = path.join(process.cwd(), 'DatosMigracion.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });

    // Skip header row
    const dataRows = rows.slice(1).filter(r => r && r.length > 1 && String(r[1]).trim() !== 'undefined' && String(r[1]).trim() !== '');

    console.log(`- Total de filas extraidas del Excel (ignorando vacias): ${dataRows.length}`);

    const countMap = new Map();
    const duplicates = [];
    const allSiniestros = new Set<string>();

    for (let row of dataRows) {
        const sin = String(row[1]).trim();
        allSiniestros.add(sin);
        countMap.set(sin, (countMap.get(sin) || 0) + 1);
        if (countMap.get(sin) === 2) {
            duplicates.push(sin);
        }
    }

    console.log(`- Siniestros únicos (quitando los duplicados internamente en el Excel): ${allSiniestros.size}`);
    console.log(`- El Excel tiene ${duplicates.length} siniestros repetidos en 2 o mas filas distintas. (Ej de patentes/siniestros duplicadas ahí: ${duplicates.slice(0, 5).join(', ')})`);

    // Check against DB
    const { data: dbCases } = await supabase.from('casos').select('numero_siniestro');
    console.log(`\n- Total de Casos TOTALES guardados en AOMNIS (DB) actualmente: ${dbCases?.length}`);

    const dbSet = new Set(dbCases?.map(c => c.numero_siniestro));

    const newInExcel = [];
    const existingInExcel = [];

    for (const sin of allSiniestros) {
        if (dbSet.has(sin)) {
            existingInExcel.push(sin);
        } else {
            newInExcel.push(sin);
        }
    }

    console.log(`\n========================================`);
    console.log(`De los ${allSiniestros.size} casos únicos que subiste en el archivo Excel:`);
    console.log(`   - ${existingInExcel.length} YA EXISTÍAN previamente en AOMNIS (Fueron puestas al día / ACTUALIZADAS).`);
    console.log(`   - ${newInExcel.length} NO EXISTÍAN en la base de datos (Fueron creados como NUEVOS).`);
    console.log(`========================================\n`);

    if (newInExcel.length > 0) {
        console.log(`Siniestros Nuevos detectados:`);
        console.log(newInExcel.join(', '));
    } else {
        console.log(`No se detectó ningun siniestro nuevo que el sistema no tuviera ya previamente guardado.`);
    }
}
run();
