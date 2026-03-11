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

async function main() {
    console.log(`Corrigiendo estados migrados...`);

    const workbook = XLSX.readFile(path.join(__dirname, '..', 'DatosMigracion.xlsx'));
    const data = XLSX.utils.sheet_to_json(workbook.Sheets['Hoja1'], { defval: '' });

    let facturadasFixed = 0;
    let paraFacturarFixed = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const siniestro = String(row['SINIESTRO'] || '').trim();
        if (!siniestro) continue;

        const estadoExcel = String(row['ESTADO'] || '').trim().toUpperCase();

        // "IP CERRADA" = ya fue facturada
        // "PARA FACTURAR" = para facturar (ip_cerrada)
        if (estadoExcel === 'IP CERRADA') {
            await supabase.from('casos').update({ estado: 'facturada' }).eq('numero_siniestro', siniestro);
            // Delete billing queue amounts just in case, but migration probably set monto_facturado_estudio
            facturadasFixed++;
        }
        else if (estadoExcel === 'PARA FACTURAR') {
            await supabase.from('casos').update({ estado: 'ip_cerrada' }).eq('numero_siniestro', siniestro);
            paraFacturarFixed++;
        }
    }

    console.log(`Resumen:`);
    console.log(`Casos 'IP CERRADA' en Excel -> 'facturada' en DB: ${facturadasFixed}`);
    console.log(`Casos 'PARA FACTURAR' en Excel -> 'ip_cerrada' en DB: ${paraFacturarFixed}`);
}

main().catch(console.error);
