import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: users } = await supabase.from('usuarios').select('id, nombre, apellido, email, rol');
    const { data: gestores } = await supabase.from('gestores').select('id, nombre, email');
    const { data: companias } = await supabase.from('companias').select('id, nombre');

    console.log("== USUARIOS ==");
    console.log(users);
    console.log("== GESTORES ==");
    console.log(gestores);
    console.log("== COMPANIAS ==");
    console.log(companias);
}

run();
