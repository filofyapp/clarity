import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// ═══ Retry helper for transient Supabase 502/503/504 errors ═══
function isTransientError(error: any): boolean {
    if (!error) return false;
    const msg = typeof error === "string" ? error : error?.message || "";
    return msg.includes("<!DOCTYPE") || msg.includes("Bad gateway") || msg.includes("502") || msg.includes("503") || msg.includes("504");
}

async function withRetry<T extends { data: any; error: any }>(
    fn: () => PromiseLike<T>,
    maxRetries = 3,
): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const result = await fn();
        if (!result.error || !isTransientError(result.error)) {
            return result;
        }
        console.warn(`[Retry ${attempt + 1}/${maxRetries}] Transient Supabase error, retrying in ${(attempt + 1)}s...`);
        await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
    }
    return fn();
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const formData = await req.formData();
        const token = formData.get("token") as string;
        const file = formData.get("file") as File;
        const tipo = formData.get("tipo") as string || "general";
        const descripcion = formData.get("descripcion") as string || null;
        const orden = parseInt(formData.get("orden") as string || "0");

        if (!token || !file) {
            return NextResponse.json({ error: "Token y archivo son requeridos" }, { status: 400 });
        }

        // Validate token (with retry)
        const { data: link, error: linkError } = await withRetry(() =>
            supabase
                .from("links_inspeccion")
                .select("id, caso_id, estado, expira_en, fotos_subidas, max_fotos, ip_acceso, user_agent")
                .eq("token", token)
                .single()
        );

        if (linkError || !link) {
            console.error("Token validation error:", linkError);
            return NextResponse.json({ error: "Link inválido", detail: linkError?.message }, { status: 404 });
        }

        if (link.estado !== "activo") {
            return NextResponse.json({ error: `Link ${link.estado}` }, { status: 403 });
        }

        if (new Date(link.expira_en) < new Date()) {
            await supabase.from("links_inspeccion").update({ estado: "expirado" }).eq("id", link.id);
            return NextResponse.json({ error: "Link expirado" }, { status: 403 });
        }

        if (link.fotos_subidas >= link.max_fotos) {
            return NextResponse.json({ error: "Límite de fotos alcanzado" }, { status: 429 });
        }

        // Upload to Supabase Storage (with retry)
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `remota/${link.caso_id}/${Date.now()}_${tipo}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await withRetry(() =>
            supabase.storage
                .from("fotos-inspecciones")
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: false,
                })
        );

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return NextResponse.json({ error: "Error al subir archivo", detail: uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("fotos-inspecciones")
            .getPublicUrl(fileName);

        // Insert into fotos_inspeccion with retry (usuario_id is null for public uploads)
        const { error: insertError } = await withRetry(() =>
            supabase.from("fotos_inspeccion").insert({
                caso_id: link.caso_id,
                usuario_id: null,
                url: urlData.publicUrl,
                tipo,
                descripcion,
                orden,
            })
        );

        if (insertError) {
            console.error("DB insert error:", insertError);
            return NextResponse.json({ error: "Error al registrar foto", detail: insertError.message }, { status: 500 });
        }

        // Update counter (with retry)
        await withRetry(() =>
            supabase
                .from("links_inspeccion")
                .update({
                    fotos_subidas: link.fotos_subidas + 1,
                    ip_acceso: link.ip_acceso || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
                    user_agent: link.user_agent || req.headers.get("user-agent") || "unknown",
                })
                .eq("id", link.id)
        );

        return NextResponse.json({
            ok: true,
            url: urlData.publicUrl,
            fotos_subidas: link.fotos_subidas + 1,
        });
    } catch (err) {
        console.error("Upload endpoint error:", err);
        return NextResponse.json({ error: "Error interno", detail: String(err) }, { status: 500 });
    }
}

