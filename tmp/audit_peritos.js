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
    console.log('\n═══ AUDIT: Todos los usuarios ═══\n');

    const { data: users } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, email, rol, roles, activo, created_at')
        .order('created_at');

    users.forEach(u => {
        console.log(`ID: ${u.id}`);
        console.log(`  Nombre: ${u.nombre} ${u.apellido}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Rol: ${u.rol} | Roles: ${JSON.stringify(u.roles)}`);
        console.log(`  Activo: ${u.activo}`);
        console.log('');
    });

    console.log(`Total usuarios: ${users.length}\n`);

    // Check how many cases reference each perito
    console.log('═══ AUDIT: Referencias de peritos en casos ═══\n');

    for (const u of users) {
        const { count: calleCount } = await supabase
            .from('casos')
            .select('id', { count: 'exact', head: true })
            .eq('perito_calle_id', u.id);

        const { count: cargaCount } = await supabase
            .from('casos')
            .select('id', { count: 'exact', head: true })
            .eq('perito_carga_id', u.id);

        if (calleCount > 0 || cargaCount > 0) {
            console.log(`${u.nombre} ${u.apellido} (${u.email}): calle=${calleCount}, carga=${cargaCount}`);
        }
    }

    // Check caso_origen_id usage
    console.log('\n═══ AUDIT: Casos con caso_origen_id (ampliaciones existentes) ═══\n');
    const { data: ampliaciones, count: ampCount } = await supabase
        .from('casos')
        .select('id, numero_siniestro, tipo_inspeccion, caso_origen_id, estado', { count: 'exact' })
        .not('caso_origen_id', 'is', null);

    console.log(`Ampliaciones existentes: ${ampCount || 0}`);
    if (ampliaciones) {
        ampliaciones.forEach(a => {
            console.log(`  Siniestro ${a.numero_siniestro} (${a.tipo_inspeccion}) → origen: ${a.caso_origen_id}`);
        });
    }

    // Check for duplicate siniestro numbers
    console.log('\n═══ AUDIT: Siniestros duplicados ═══\n');
    const { data: allCasos } = await supabase
        .from('casos')
        .select('numero_siniestro')
        .order('numero_siniestro');

    const counts = {};
    allCasos.forEach(c => { counts[c.numero_siniestro] = (counts[c.numero_siniestro] || 0) + 1; });
    const dupes = Object.entries(counts).filter(([, v]) => v > 1);
    console.log(`Siniestros con más de una entrada: ${dupes.length}`);
    dupes.forEach(([num, count]) => console.log(`  ${num}: ${count} entradas`));

    // Check auth.users
    console.log('\n═══ AUDIT: auth.users (Supabase Auth) ═══\n');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    if (authUsers && authUsers.users) {
        authUsers.users.forEach(au => {
            console.log(`Auth: ${au.email} → ID: ${au.id}`);
        });
        console.log(`\nTotal auth users: ${authUsers.users.length}`);
    }
}

main().catch(console.error);
