const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
let url = "";
let key = "";
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
        if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) url = line.split("=")[1].trim();
        if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) key = line.split("=")[1].trim();
    });
}
const supabase = createClient(url, key);

async function backfill() {
    console.log("Fetching precios table...");
    const { data: precios, error: errPrecios } = await supabase.from('precios').select('*');
    if (errPrecios) {
        console.error("Error fetching precios:", errPrecios);
        return;
    }

    const { data: casos, error } = await supabase
        .from("casos")
        .select("id, tipo_inspeccion, compania_id, estado, monto_facturado_estudio")
        .in("estado", ["ip_cerrada", "facturada"]);

    if (error) {
        console.error("Error fetching casos:", error);
        return;
    }

    console.log(`Found ${casos.length} closed/billed cases.`);
    let updatedCount = 0;

    for (const caso of casos) {
        if (caso.monto_facturado_estudio > 0) continue; // Skip already populated

        const precio = precios.find(p => p.compania_id === caso.compania_id && p.concepto === caso.tipo_inspeccion);
        if (precio) {
            const { error: updErr } = await supabase.from('casos').update({
                monto_facturado_estudio: precio.valor_estudio,
                monto_pagado_perito_calle: precio.valor_perito
            }).eq('id', caso.id);

            if (updErr) {
                console.error(`Failed to update caso ${caso.id}:`, updErr);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Backfill complete. Updated ${updatedCount} cases.`);
}

backfill();
