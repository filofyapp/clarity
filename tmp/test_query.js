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

async function test() {
    const { data: v1, error: e1 } = await supabase
        .from("usuarios")
        .select("id, nombre, rol, roles")
        .or('rol.eq.calle,rol.eq.carga,roles.cs.{"calle"},roles.cs.{"carga"}');

    console.log("Results with OR text:", v1?.length, e1 ? e1.message : "");
}

test();
