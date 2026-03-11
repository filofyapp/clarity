import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Needs service role to bypass RLS for direct admin updates, or just regular key if RLS allows admin.
// since we run this as script let's try to just hit it with anon key if we don't have service role, but usually service role is available.

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Updating Jairo Ferlanti roles...");

    // Find Jairo Ferlanti users
    const { data: users, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nombre', 'Jairo%');

    if (fetchError) {
        console.error("Error fetching users:", fetchError);
        return;
    }

    console.log(`Found ${users?.length || 0} Jairo users:`, users?.map(u => ({ id: u.id, email: u.email, rol: u.rol, roles: u.roles })));

    // Update them to multi-role
    for (const user of users || []) {
        console.log(`Updating ${user.email}...`);
        const { error: updateError } = await supabase
            .from('usuarios')
            .update({
                rol: 'calle', // Keep one as primary visual if needed, but roles array matters more now
                roles: ['calle', 'carga']
            })
            .eq('id', user.id);

        if (updateError) {
            console.error(`Error updating ${user.email}:`, updateError);
        } else {
            console.log(`Successfully updated ${user.email} to calle,carga.`);
        }
    }
}

run();
