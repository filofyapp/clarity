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
        .select("id, estado, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga, facturado");

    if (error) {
        console.error("EXACT QUERY FAILED:", error);
    } else {
        const withMoney = todosLosCasos.filter(c => c.monto_facturado_estudio > 0);
        console.log("Cases with money > 0:", withMoney.length);
        if (withMoney.length > 0) {
            console.log("Sample:", withMoney[0]);
        }
    }
}
check();
