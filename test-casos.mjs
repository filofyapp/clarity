import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase
        .from("casos")
        .select(`
            id,
            numero_siniestro,
            numero_servicio,
            tipo_inspeccion,
            dominio,
            marca,
            modelo,
            estado,
            prioridad,
            fecha_derivacion,
            fecha_inspeccion_programada,
            fecha_carga_sistema,
            fecha_cierre,
            nombre_asegurado,
            updated_at,
            notas_admin,
            link_orion,
            gestor_id,
            gestor:gestores(id, nombre),
            perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido),
            perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido)
        `)
        .limit(1);

    if (error) {
        console.error("Got error:", error.message);
    } else {
        console.log("Success! Data:", data);
    }
}

test();
