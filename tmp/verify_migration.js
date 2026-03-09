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
    console.log('\n═══ VERIFICACIÓN POST-MIGRACIÓN ═══\n');

    // Total cases
    const { count: total } = await supabase.from('casos').select('id', { count: 'exact', head: true });
    console.log(`Total casos: ${total}`);

    // By estado
    const { data: byEstado } = await supabase.from('casos').select('estado');
    const estados = {};
    byEstado.forEach(c => { estados[c.estado] = (estados[c.estado] || 0) + 1; });
    console.log('\nPor estado:');
    Object.entries(estados).sort((a, b) => b[1] - a[1]).forEach(([e, c]) => console.log(`  ${e}: ${c}`));

    // By tipo
    const { data: byTipo } = await supabase.from('casos').select('tipo_inspeccion');
    const tipos = {};
    byTipo.forEach(c => { tipos[c.tipo_inspeccion] = (tipos[c.tipo_inspeccion] || 0) + 1; });
    console.log('\nPor tipo:');
    Object.entries(tipos).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => console.log(`  ${t}: ${c}`));

    // By perito calle
    const { data: activos } = await supabase.from('usuarios').select('id,nombre,apellido').eq('activo', true);
    console.log('\nPor perito calle:');
    for (const u of activos) {
        const { count } = await supabase.from('casos').select('id', { count: 'exact', head: true }).eq('perito_calle_id', u.id);
        if (count > 0) console.log(`  ${u.nombre} ${u.apellido}: ${count}`);
    }

    // Ampliaciones
    const { count: amps } = await supabase.from('casos').select('id', { count: 'exact', head: true }).not('caso_origen_id', 'is', null);
    console.log(`\nAmpliaciones (con caso_origen_id): ${amps}`);

    // Billing totals
    const { data: billing } = await supabase.from('casos').select('monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga');
    const totEstudio = billing.reduce((s, c) => s + (Number(c.monto_facturado_estudio) || 0), 0);
    const totCalle = billing.reduce((s, c) => s + (Number(c.monto_pagado_perito_calle) || 0), 0);
    const totCarga = billing.reduce((s, c) => s + (Number(c.monto_pagado_perito_carga) || 0), 0);
    console.log(`\nBilling totals:`);
    console.log(`  Facturado Estudio: $${totEstudio.toLocaleString()}`);
    console.log(`  Pagado P. Calle:   $${totCalle.toLocaleString()}`);
    console.log(`  Pagado P. Carga:   $${totCarga.toLocaleString()}`);
    console.log(`  Neto:              $${(totEstudio - totCalle - totCarga).toLocaleString()}`);

    // Historial entries
    const { count: hist } = await supabase.from('historial_estados').select('id', { count: 'exact', head: true });
    console.log(`\nEntradas historial: ${hist}`);

    // Date range
    const { data: dateRange } = await supabase.from('casos').select('fecha_derivacion').order('fecha_derivacion', { ascending: true }).limit(1);
    const { data: dateRange2 } = await supabase.from('casos').select('fecha_derivacion').order('fecha_derivacion', { ascending: false }).limit(1);
    console.log(`\nRango de fechas: ${dateRange[0]?.fecha_derivacion} → ${dateRange2[0]?.fecha_derivacion}`);

    console.log('\n✅ Verificación completada');
}

main().catch(console.error);
