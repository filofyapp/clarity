/**
 * Link existing duplicate siniestros via caso_origen_id
 * For each duplicate pair, the NEWER case gets caso_origen_id pointing to the OLDER one.
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
    console.log('\n🔗 Vinculando siniestros duplicados existentes\n');

    const { data: allCasos } = await supabase
        .from('casos')
        .select('id, numero_siniestro, created_at, caso_origen_id')
        .order('created_at', { ascending: true });

    const groups = {};
    allCasos.forEach(c => {
        if (!groups[c.numero_siniestro]) groups[c.numero_siniestro] = [];
        groups[c.numero_siniestro].push(c);
    });

    let linked = 0;
    for (const [num, casos] of Object.entries(groups)) {
        if (casos.length <= 1) continue;

        const original = casos[0]; // earliest
        for (let i = 1; i < casos.length; i++) {
            const newer = casos[i];
            if (!newer.caso_origen_id) {
                const { error } = await supabase
                    .from('casos')
                    .update({ caso_origen_id: original.id })
                    .eq('id', newer.id);

                if (error) {
                    console.log(`❌ ${num} (caso ${i + 1}): ${error.message}`);
                } else {
                    console.log(`✅ ${num}: caso ${i + 1} → vinculado al original`);
                    linked++;
                }
            } else {
                console.log(`⏩ ${num}: caso ${i + 1} ya vinculado`);
            }
        }
    }

    console.log(`\n📊 ${linked} casos vinculados como ampliaciones.`);
}

main().catch(console.error);
