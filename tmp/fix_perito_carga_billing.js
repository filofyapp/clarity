/**
 * BACKFILL: Poblar monto_pagado_perito_carga en casos cerrados históricos.
 * 
 * Este script busca todos los casos con estado ip_cerrada o facturada que tengan
 * monto_pagado_perito_carga = 0 o null, y les asigna el valor correcto desde la tabla precios.
 * 
 * También corrige monto_pagado_perito_calle si usaba el campo incorrecto valor_perito (que no existe).
 * 
 * USO: node tmp/fix_perito_carga_billing.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lee credenciales
const envFile = fs.readFileSync('.env.local', 'utf-8');
let url = '', key = '';
envFile.split('\n').forEach(l => {
    if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.split('=').slice(1).join('=').trim();
    if (l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = l.split('=').slice(1).join('=').trim();
});

const supabase = createClient(url, key);
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    console.log(`\n🔧 BACKFILL de monto_pagado_perito_carga${DRY_RUN ? ' (DRY RUN - no se escribirá nada)' : ''}\n`);

    // 1. Obtener todos los precios por concepto
    const { data: precios, error: preciosError } = await supabase.from('precios').select('*').eq('tipo', 'honorario');
    if (preciosError) { console.error('Error cargando precios:', preciosError.message); return; }

    const preciosMap = {};
    precios.forEach(p => {
        const key = `${p.compania_id}__${p.concepto}`;
        preciosMap[key] = p;
    });
    console.log(`📋 ${precios.length} tarifas de honorarios cargadas.\n`);

    // 2. Obtener casos cerrados/facturados que necesitan backfill
    const { data: casos, error: casosError } = await supabase
        .from('casos')
        .select('id, compania_id, tipo_inspeccion, estado, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga')
        .in('estado', ['ip_cerrada', 'facturada']);

    if (casosError) { console.error('Error cargando casos:', casosError.message); return; }

    console.log(`📂 ${casos.length} casos cerrados/facturados encontrados.\n`);

    let updated = 0, skipped = 0, errors = 0;

    for (const caso of casos) {
        const precioKey = `${caso.compania_id}__${caso.tipo_inspeccion}`;
        const precio = preciosMap[precioKey];

        if (!precio) {
            console.log(`⚠️  Caso ${caso.id}: Sin precio para tipo ${caso.tipo_inspeccion}, saltando.`);
            skipped++;
            continue;
        }

        const updates = {};
        let needsUpdate = false;

        // Fix monto_facturado_estudio si está null/0
        if (!caso.monto_facturado_estudio || Number(caso.monto_facturado_estudio) === 0) {
            updates.monto_facturado_estudio = precio.valor_estudio;
            needsUpdate = true;
        }

        // Fix monto_pagado_perito_calle si está null/0
        if (!caso.monto_pagado_perito_calle || Number(caso.monto_pagado_perito_calle) === 0) {
            updates.monto_pagado_perito_calle = precio.valor_perito_calle;
            needsUpdate = true;
        }

        // Fix monto_pagado_perito_carga si está null/0
        if (!caso.monto_pagado_perito_carga || Number(caso.monto_pagado_perito_carga) === 0) {
            updates.monto_pagado_perito_carga = precio.valor_perito_carga;
            needsUpdate = true;
        }

        if (!needsUpdate) {
            skipped++;
            continue;
        }

        if (DRY_RUN) {
            console.log(`🔍 [DRY] Caso ${caso.id} (${caso.tipo_inspeccion}): ${JSON.stringify(updates)}`);
        } else {
            const { error } = await supabase.from('casos').update(updates).eq('id', caso.id);
            if (error) {
                console.log(`❌ Caso ${caso.id}: ${error.message}`);
                errors++;
            } else {
                console.log(`✅ Caso ${caso.id} (${caso.tipo_inspeccion}): actualizado → estudio=${updates.monto_facturado_estudio || 'ok'}, calle=${updates.monto_pagado_perito_calle || 'ok'}, carga=${updates.monto_pagado_perito_carga || 'ok'}`);
            }
        }
        updated++;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 RESUMEN:`);
    console.log(`   Actualizados: ${updated}`);
    console.log(`   Sin cambios:  ${skipped}`);
    console.log(`   Errores:      ${errors}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(console.error);
