import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Chequeando casos derivados el 2026-03-10...");
    const { data: casos10 } = await supabase
        .from('casos')
        .select('numero_siniestro, fecha_derivacion, estado, created_at')
        .eq('fecha_derivacion', '2026-03-10');

    console.log(`Total Casos 10 de Marzo: ${casos10?.length}`);
    if (casos10 && casos10.length > 0) {
        console.log("Ejemplos:");
        console.log(casos10.slice(0, 5));
    }

    const { data: ultimos_creados } = await supabase
        .from('casos')
        .select('numero_siniestro, fecha_derivacion, estado, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
    console.log("Ultimos creados:", ultimos_creados);

    // Check if the user's specific missing cases from the 10th exist
    const { data: testSiniestros } = await supabase
        .from('casos')
        .select('numero_siniestro, fecha_derivacion, estado')
        .in('numero_siniestro', ['2003936758', '2003947718', '2003844332']);

    console.log("Check siniestros especificos del Excel:", testSiniestros);
}
run();
