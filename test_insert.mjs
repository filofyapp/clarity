import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Testing insert...");
    const { data: d1, error: e1 } = await supabase.from('comentarios_tarea').insert({
        tarea_id: 'a718c39e-4c12-421b-ac4a-0a7c9dbecb4d', // some random task id might fail fkey
        usuario_id: '...', // not realistic script test
    });
    console.log("insert e1:", e1?.message);
}
testInsert();
