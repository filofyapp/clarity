import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // using service role for bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: caso } = await supabase.from('casos').select('id').eq('numero_siniestro', '2003940145').single();
    if (!caso) {
        console.log("Caso no encontrado");
        return;
    }
    
    console.log("Caso ID:", caso.id);
    
    const { data: links } = await supabase.from('links_inspeccion').select('*').eq('caso_id', caso.id);
    console.log("Links para este caso:", links);
}

inspect().catch(console.error);
