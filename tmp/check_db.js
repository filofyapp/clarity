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
} else {
    console.log("No .env.local found");
}

const supabase = createClient(url, key);

async function check() {
    const { data: casos, error } = await supabase.from("casos").select("id, estado, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga, facturado").limit(20);

    if (error) {
        console.error("DB Error:", error);
    } else {
        console.log("Cases fetched:", casos.length);
        console.log("Sample cases:");
        casos.slice(0, 5).forEach(c => console.log(JSON.stringify(c)));

        const facturados = casos.filter(c => c.estado === 'facturada' || c.facturado);
        console.log("Facturados count:", facturados.length);

        const sum = casos.reduce((s, c) => s + (Number(c.monto_facturado_estudio) || 0), 0);
        console.log("Sum logic output (casos):", sum);

        const sum2 = facturados.reduce((s, c) => s + (Number(c.monto_facturado_estudio) || 0), 0);
        console.log("Sum logic output (facturados):", sum2);
    }
}
check();
