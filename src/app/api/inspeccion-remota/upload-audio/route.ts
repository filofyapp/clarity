import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const formData = await req.formData();
        const token = formData.get("token") as string;
        const file = formData.get("file") as File;

        if (!token || !file) {
            return NextResponse.json({ error: "Token y archivo requeridos" }, { status: 400 });
        }

        // Validate token
        const { data: link, error } = await supabase
            .from("links_inspeccion")
            .select("id, caso_id, estado")
            .eq("token", token)
            .single();

        if (error || !link) {
            return NextResponse.json({ error: "Link inválido" }, { status: 404 });
        }

        if (link.estado !== "activo") {
            return NextResponse.json({ error: `Link ya ${link.estado}` }, { status: 403 });
        }

        // Determine extension from MIME type
        const ext = file.type.includes("mp4") ? "mp4" : file.type.includes("ogg") ? "ogg" : "webm";
        const fileName = `remota/${link.caso_id}/audio_pericia_${Date.now()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
            .from("fotos-inspecciones")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Audio upload error:", uploadError);
            return NextResponse.json({ error: "Error al subir audio", detail: uploadError.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from("fotos-inspecciones")
            .getPublicUrl(fileName);

        return NextResponse.json({ url: urlData.publicUrl });
    } catch (err) {
        console.error("Audio upload endpoint error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
