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

async function check() {
    const { data: todosLosCasos, error } = await supabase
        .from("casos")
        .select("id, estado, created_at, fecha_cierre, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga, perito_calle_id, perito_carga_id, tipo_inspeccion, facturado");

    if (error) {
        console.error("EXACT QUERY FAILED:", error);
    } else {
        console.log("EXACT QUERY SUCCESS. Count:", todosLosCasos.length);
        const facturados = todosLosCasos.filter(c => c.estado === "facturada" || c.facturado === true);
        const sum = facturados.reduce((s, c) => s + (Number(c.monto_facturado_estudio) || 0), 0);
        console.log("Sum for facturados is:", sum);
    }
}
check();
