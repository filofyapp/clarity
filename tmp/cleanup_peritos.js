/**
 * Perito Cleanup Script
 * 
 * Reasigna todos los casos de peritos fantasma a los peritos reales,
 * crea Emiliano De Lia, actualiza roles, y desactiva/elimina fantasmas.
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

// ═══ IDs reales ═══
const ALFREDO_REAL = '683dc803-dc8c-4f79-bbd8-05affc1e477c'; // aomsiniestros@gmail.com
const JAIRO_REAL = 'b0000000-0000-0000-0000-000000000002'; // carga@aomnis.com
const LUCAS_REAL = 'c0000000-0000-0000-0000-000000000003'; // calle@aomnis.com
const NICOLAS_REAL = 'a0000000-0000-0000-0000-000000000001'; // admin@aomnis.com

// ═══ IDs fantasma ═══
const ALFREDO_PHANTOM = 'bf267dc0-3f64-4509-838b-f39225dcd1f5'; // amio_migracion
const ALFREDO_DUPLICATE = '74b2d193-49f1-413c-b724-4436c7f73968'; // hotmail duplicate
const JAIRO_PHANTOM = 'fe01a4b3-3af5-4c14-a919-6d8a3d96756b'; // jferlanti_migracion
const LUCAS_PHANTOM = '5ba7de8c-a54b-40d0-985f-5a9dbbe716b1'; // ldelpiero_migracion
const NICOLAS_PHANTOM = 'a10bbbf4-4b89-4b70-b210-e7f72ced0721'; // ncordova_migracion
const EDELIA_PHANTOM = '1f1c1f58-5508-473b-97f8-4da7bd4cf8e7'; // edelia_migracion
const ADMIN_TEST = '11471c5d-156a-4b28-82d8-8e03c8806ccb'; // admin@aomnis.test

async function remap(fromId, toId, fromName, toName) {
    // Reasignar perito_calle_id
    const { count: calleCount, error: e1 } = await supabase
        .from('casos')
        .update({ perito_calle_id: toId })
        .eq('perito_calle_id', fromId)
        .select('id', { count: 'exact', head: false });

    // Reasignar perito_carga_id
    const { count: cargaCount, error: e2 } = await supabase
        .from('casos')
        .update({ perito_carga_id: toId })
        .eq('perito_carga_id', fromId)
        .select('id', { count: 'exact', head: false });

    const calleN = calleCount || 0;
    const cargaN = cargaCount || 0;

    if (e1) console.log(`  ❌ Error remap calle ${fromName}: ${e1.message}`);
    if (e2) console.log(`  ❌ Error remap carga ${fromName}: ${e2.message}`);
    if (!e1 && !e2) console.log(`  ✅ ${fromName} → ${toName}: ${calleN} calle + ${cargaN} carga reasignados`);

    return calleN + cargaN;
}

async function main() {
    let totalRemapped = 0;

    // ═══════════════════════════════════════════════════════════════
    // PASO 1: Crear Emiliano De Lia
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔧 PASO 1: Crear Emiliano De Lia\n');

    const { data: emiliano, error: emiError } = await supabase
        .from('usuarios')
        .insert({
            nombre: 'Emiliano',
            apellido: 'De Lia',
            email: 'emilianoperezdelia@hotmail.com',
            rol: 'calle',
            roles: ['calle'],
            activo: true
        })
        .select('id')
        .single();

    if (emiError) {
        console.log(`❌ Error creando Emiliano: ${emiError.message}`);
        // Try to find if already exists
        const { data: existing } = await supabase.from('usuarios').select('id').eq('email', 'emilianoperezdelia@hotmail.com').single();
        if (existing) {
            console.log(`  ℹ️ Ya existe con ID: ${existing.id}`);
            var EMILIANO_REAL = existing.id;
        } else {
            console.log('  ❌ No se pudo crear ni encontrar. Abortando.');
            return;
        }
    } else {
        var EMILIANO_REAL = emiliano.id;
        console.log(`✅ Emiliano De Lia creado: ${EMILIANO_REAL}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PASO 2: Reasignar casos de fantasmas a reales
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔧 PASO 2: Reasignar casos\n');

    totalRemapped += await remap(ALFREDO_PHANTOM, ALFREDO_REAL, 'A MIÑO (phantom)', 'Alfredo Miño');
    totalRemapped += await remap(ALFREDO_DUPLICATE, ALFREDO_REAL, 'Alfredo hotmail (dup)', 'Alfredo Miño');
    totalRemapped += await remap(JAIRO_PHANTOM, JAIRO_REAL, 'J. FERLANTI (phantom)', 'Jairo Ferlanti');
    totalRemapped += await remap(LUCAS_PHANTOM, LUCAS_REAL, 'L DEL PIERO (phantom)', 'Lucas del Piero');
    totalRemapped += await remap(NICOLAS_PHANTOM, NICOLAS_REAL, 'N CORDOVA (phantom)', 'Nicolás Cordova');
    totalRemapped += await remap(EDELIA_PHANTOM, EMILIANO_REAL, 'E DELIA (phantom)', 'Emiliano De Lia');

    console.log(`\n  📊 Total casos reasignados: ${totalRemapped}\n`);

    // ═══════════════════════════════════════════════════════════════
    // PASO 3: Actualizar datos y roles de los usuarios reales
    // ═══════════════════════════════════════════════════════════════
    console.log('🔧 PASO 3: Actualizar nombres, emails y roles\n');

    const updates = [
        {
            id: ALFREDO_REAL,
            data: { nombre: 'Alfredo', apellido: 'Miño', rol: 'admin', roles: ['admin', 'calle', 'carga'] }
        },
        {
            id: JAIRO_REAL,
            data: { nombre: 'Jairo', apellido: 'Ferlanti', rol: 'calle', roles: ['calle', 'carga'] }
        },
        {
            id: LUCAS_REAL,
            data: { nombre: 'Lucas', apellido: 'del Piero', email: 'ldelpiero08@gmail.com', rol: 'calle', roles: ['calle'] }
        },
        {
            id: NICOLAS_REAL,
            data: { nombre: 'Nicolás', apellido: 'Cordova', rol: 'admin', roles: ['admin'] }
        }
    ];

    for (const u of updates) {
        const { error } = await supabase.from('usuarios').update(u.data).eq('id', u.id);
        if (error) console.log(`  ❌ ${u.data.nombre}: ${error.message}`);
        else console.log(`  ✅ ${u.data.nombre} ${u.data.apellido}: roles=${JSON.stringify(u.data.roles)}, email=${u.data.email || 'sin cambio'}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PASO 4: Desactivar fantasmas y eliminar los que no tienen refs
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔧 PASO 4: Desactivar/eliminar fantasmas\n');

    const toDeactivate = [
        { id: ALFREDO_PHANTOM, name: 'A MIÑO (phantom)' },
        { id: ALFREDO_DUPLICATE, name: 'Alfredo hotmail (dup)' },
        { id: JAIRO_PHANTOM, name: 'J. FERLANTI (phantom)' },
        { id: LUCAS_PHANTOM, name: 'L DEL PIERO (phantom)' },
        { id: NICOLAS_PHANTOM, name: 'N CORDOVA (phantom)' },
        { id: EDELIA_PHANTOM, name: 'E DELIA (phantom)' },
        { id: ADMIN_TEST, name: 'Admin test' },
    ];

    for (const ghost of toDeactivate) {
        // First check no remaining case references
        const { count: c1 } = await supabase.from('casos').select('id', { count: 'exact', head: true }).eq('perito_calle_id', ghost.id);
        const { count: c2 } = await supabase.from('casos').select('id', { count: 'exact', head: true }).eq('perito_carga_id', ghost.id);

        if ((c1 || 0) > 0 || (c2 || 0) > 0) {
            console.log(`  ⚠️ ${ghost.name}: todavía tiene ${c1} calle + ${c2} carga refs → desactivado (no eliminado)`);
            await supabase.from('usuarios').update({ activo: false }).eq('id', ghost.id);
        } else {
            // Safe to delete
            const { error } = await supabase.from('usuarios').delete().eq('id', ghost.id);
            if (error) {
                console.log(`  ⚠️ ${ghost.name}: no se pudo eliminar (${error.message}) → desactivado`);
                await supabase.from('usuarios').update({ activo: false }).eq('id', ghost.id);
            } else {
                console.log(`  🗑️ ${ghost.name}: eliminado`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PASO 5: Verificación final
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔧 PASO 5: Verificación final\n');

    const { data: finalUsers } = await supabase
        .from('usuarios')
        .select('nombre, apellido, email, rol, roles, activo')
        .eq('activo', true)
        .order('nombre');

    console.log('Usuarios activos:\n');
    finalUsers.forEach(u => {
        console.log(`  ${u.nombre} ${u.apellido} (${u.email}) — rol: ${u.rol}, roles: ${JSON.stringify(u.roles)}`);
    });
    console.log(`\n  Total activos: ${finalUsers.length}`);

    // Verify no orphaned refs
    const { data: orphanedCalle } = await supabase
        .from('casos')
        .select('id, perito_calle_id')
        .not('perito_calle_id', 'is', null);

    const activeIds = new Set(finalUsers.map(() => null)); // we need actual IDs
    const { data: activeWithIds } = await supabase.from('usuarios').select('id').eq('activo', true);
    const activeIdSet = new Set(activeWithIds.map(u => u.id));

    let orphaned = 0;
    for (const c of (orphanedCalle || [])) {
        if (!activeIdSet.has(c.perito_calle_id)) orphaned++;
    }

    const { data: orphanedCarga } = await supabase
        .from('casos')
        .select('id, perito_carga_id')
        .not('perito_carga_id', 'is', null);

    for (const c of (orphanedCarga || [])) {
        if (!activeIdSet.has(c.perito_carga_id)) orphaned++;
    }

    console.log(`\n  Casos con referencia a perito inactivo/inexistente: ${orphaned}`);
    if (orphaned === 0) console.log('  ✅ Integridad referencial OK');
    else console.log('  ⚠️ HAY REFERENCIAS HUÉRFANAS — revisar manualmente');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA DE PERITOS COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
