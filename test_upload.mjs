import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log("Testing fotos-inspecciones bucket...");
    const { data: d1, error: e1 } = await supabase.storage.from('fotos-inspecciones').list('tareas/adjuntos');
    console.log("list d1:", d1?.length, "e1:", e1?.message);
}

testUpload();
