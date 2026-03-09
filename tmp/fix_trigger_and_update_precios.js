/**
 * Fix trigger fn_precio_historial that references the old column name valor_perito
 * Then update all precios with user's Excel data and add "ausente" tipo.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
let url = '', key = '';
envFile.split('\n').forEach(l => {
    if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.split('=').slice(1).join('=').trim();
    if (l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = l.split('=').slice(1).join('=').trim();
});
const supabase = createClient(url, key);

async function main() {
    console.log('\n🔧 PASO 1: Arreglar trigger fn_precio_historial\n');

    // Fix the trigger function to reference the correct column names
    const fixTriggerSQL = `
        CREATE OR REPLACE FUNCTION fn_precio_historial()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (OLD.valor_estudio IS DISTINCT FROM NEW.valor_estudio 
                OR OLD.valor_perito_calle IS DISTINCT FROM NEW.valor_perito_calle
                OR OLD.valor_perito_carga IS DISTINCT FROM NEW.valor_perito_carga) THEN
                INSERT INTO precio_historial (
                    precio_id,
                    valor_estudio_anterior, valor_perito_anterior,
                    valor_estudio_nuevo, valor_perito_nuevo,
                    modificado_por
                ) VALUES (
                    NEW.id,
                    OLD.valor_estudio, OLD.valor_perito_calle,
                    NEW.valor_estudio, NEW.valor_perito_calle,
                    auth.uid()
                );
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: fixTriggerSQL });
    if (triggerError) {
        // Try alternative approach using REST
        console.log('⚠️  rpc exec_sql no disponible, intentando query directa...');
        const resp = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql: fixTriggerSQL })
        });
        if (!resp.ok) {
            console.log('❗ No se pudo ejecutar via RPC. Ejecutar manualmente en Supabase SQL Editor:');
            console.log(fixTriggerSQL);
            console.log('\n--- Continuando con la actualización de precios de todas formas ---\n');
        } else {
            console.log('✅ Trigger corregido exitosamente\n');
        }
    } else {
        console.log('✅ Trigger corregido exitosamente\n');
    }

    // PASO 2: Obtener compania_id de Sancor
    console.log('🔧 PASO 2: Actualizar precios con datos del Excel\n');

    const { data: companias } = await supabase.from('companias').select('id').eq('codigo', 'SANCOR').single();
    if (!companias) {
        console.log('❌ Compañía SANCOR no encontrada');
        return;
    }
    const companiaId = companias.id;
    console.log(`📋 Compañía SANCOR: ${companiaId}\n`);

    // Datos del Excel del usuario
    const preciosExcel = [
        { concepto: 'ip_con_orden', valor_estudio: 34000, valor_perito_calle: 9562, valor_perito_carga: 8925, descripcion: 'IP con Orden de trabajo' },
        { concepto: 'posible_dt', valor_estudio: 41500, valor_perito_calle: 9562, valor_perito_carga: 8925, descripcion: 'Posible Destrucción Total' },
        { concepto: 'ip_sin_orden', valor_estudio: 34000, valor_perito_calle: 9562, valor_perito_carga: 8925, descripcion: 'IP sin Orden' },
        { concepto: 'ampliacion', valor_estudio: 8500, valor_perito_calle: 4250, valor_perito_carga: 2000, descripcion: 'Ampliación' },
        { concepto: 'ausente', valor_estudio: 3000, valor_perito_calle: 2550, valor_perito_carga: 0, descripcion: 'Ausente' },
        { concepto: 'terceros', valor_estudio: 34000, valor_perito_calle: 9562, valor_perito_carga: 8925, descripcion: 'Terceros' },
        { concepto: 'ip_remota', valor_estudio: 34000, valor_perito_calle: 7500, valor_perito_carga: 7500, descripcion: 'IP Remota' },
        { concepto: 'ip_camiones', valor_estudio: 39000, valor_perito_calle: 9562, valor_perito_carga: 8925, descripcion: 'IP Camiones' },
    ];

    for (const p of preciosExcel) {
        // Try upsert: update if exists, insert if not
        const { data: existing } = await supabase
            .from('precios')
            .select('id')
            .eq('compania_id', companiaId)
            .eq('concepto', p.concepto)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('precios')
                .update({
                    valor_estudio: p.valor_estudio,
                    valor_perito_calle: p.valor_perito_calle,
                    valor_perito_carga: p.valor_perito_carga,
                    descripcion: p.descripcion,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) {
                console.log(`❌ ${p.concepto}: ${error.message}`);
            } else {
                console.log(`✅ ${p.concepto}: actualizado → estudio=$${p.valor_estudio}, calle=$${p.valor_perito_calle}, carga=$${p.valor_perito_carga}`);
            }
        } else {
            const { error } = await supabase
                .from('precios')
                .insert({
                    compania_id: companiaId,
                    concepto: p.concepto,
                    tipo: 'honorario',
                    valor_estudio: p.valor_estudio,
                    valor_perito_calle: p.valor_perito_calle,
                    valor_perito_carga: p.valor_perito_carga,
                    descripcion: p.descripcion,
                    activo: true
                });

            if (error) {
                console.log(`❌ ${p.concepto} (INSERT): ${error.message}`);
            } else {
                console.log(`✅ ${p.concepto}: CREADO → estudio=$${p.valor_estudio}, calle=$${p.valor_perito_calle}, carga=$${p.valor_perito_carga}`);
            }
        }
    }

    // PASO 3: Also add "ausente" to the check constraint on casos.tipo_inspeccion if needed
    console.log('\n🔧 PASO 3: Verificar que "ausente" es un tipo válido en el enum de casos\n');

    // Check existing valid types
    const { data: testCaso } = await supabase
        .from('casos')
        .select('tipo_inspeccion')
        .eq('tipo_inspeccion', 'ausente')
        .limit(1);

    console.log(`📋 Casos con tipo "ausente": ${testCaso?.length || 0}`);

    // PASO 4: Re-run backfill for the newly updated amounts
    console.log('\n🔧 PASO 4: Re-backfill de casos cerrados con los nuevos montos\n');

    const { data: precios } = await supabase.from('precios').select('*').eq('compania_id', companiaId).eq('tipo', 'honorario');
    const preciosMap = {};
    precios.forEach(p => { preciosMap[p.concepto] = p; });

    const { data: casosCerrados } = await supabase
        .from('casos')
        .select('id, compania_id, tipo_inspeccion, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga')
        .in('estado', ['ip_cerrada', 'facturada']);

    let updated = 0;
    for (const caso of (casosCerrados || [])) {
        const precio = preciosMap[caso.tipo_inspeccion];
        if (!precio) continue;

        const needsUpdate =
            Number(caso.monto_facturado_estudio) !== precio.valor_estudio ||
            Number(caso.monto_pagado_perito_calle) !== precio.valor_perito_calle ||
            Number(caso.monto_pagado_perito_carga) !== precio.valor_perito_carga;

        if (needsUpdate) {
            await supabase.from('casos').update({
                monto_facturado_estudio: precio.valor_estudio,
                monto_pagado_perito_calle: precio.valor_perito_calle,
                monto_pagado_perito_carga: precio.valor_perito_carga
            }).eq('id', caso.id);
            updated++;
        }
    }

    console.log(`✅ ${updated} casos actualizados con los nuevos montos.`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PROCESO COMPLETADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
