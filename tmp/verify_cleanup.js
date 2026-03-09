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
    console.log('\n═══ VERIFICACIÓN POST-CLEANUP ═══\n');

    // 1. Contar casos por perito activo
    const { data: activos } = await supabase.from('usuarios').select('id,nombre,apellido').eq('activo', true);

    for (const u of activos) {
        const { count: c1 } = await supabase.from('casos').select('id', { count: 'exact', head: true }).eq('perito_calle_id', u.id);
        const { count: c2 } = await supabase.from('casos').select('id', { count: 'exact', head: true }).eq('perito_carga_id', u.id);
        console.log(`${u.nombre} ${u.apellido}: calle=${c1 || 0}, carga=${c2 || 0}`);
    }

    // 2. Contar casos sin perito
    const { count: sinCalle } = await supabase.from('casos').select('id', { count: 'exact', head: true }).is('perito_calle_id', null);
    const { count: sinCarga } = await supabase.from('casos').select('id', { count: 'exact', head: true }).is('perito_carga_id', null);
    console.log(`\nCasos sin perito_calle: ${sinCalle}`);
    console.log(`Casos sin perito_carga: ${sinCarga}`);

    // 3. Check if any cases reference deleted phantom IDs
    const phantomIds = [
        'bf267dc0-3f64-4509-838b-f39225dcd1f5',
        '74b2d193-49f1-413c-b724-4436c7f73968',
        'fe01a4b3-3af5-4c14-a919-6d8a3d96756b',
        '5ba7de8c-a54b-40d0-985f-5a9dbbe716b1',
        'a10bbbf4-4b89-4b70-b210-e7f72ced0721',
        '1f1c1f58-5508-473b-97f8-4da7bd4cf8e7',
    ];

    let phantomRefs = 0;
    for (const pid of phantomIds) {
        const { count: c1 } = await supabase.from('casos').select('id', { count: 'exact', head: true }).eq('perito_calle_id', pid);
        const { count: c2 } = await supabase.from('casos').select('id', { count: 'exact', head: true }).eq('perito_carga_id', pid);
        if ((c1 || 0) > 0 || (c2 || 0) > 0) {
            console.log(`⚠️ Phantom ID ${pid} still referenced: calle=${c1}, carga=${c2}`);
            phantomRefs += (c1 || 0) + (c2 || 0);
        }
    }

    if (phantomRefs === 0) {
        console.log('\n✅ Ningún caso referencia a un fantasma eliminado');
    } else {
        console.log(`\n⚠️ ${phantomRefs} referencias a fantasmas eliminados!`);
    }

    // 4. Total casos
    const { count: total } = await supabase.from('casos').select('id', { count: 'exact', head: true });
    console.log(`\nTotal casos en DB: ${total}`);
}

main().catch(console.error);
