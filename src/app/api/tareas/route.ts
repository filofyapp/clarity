import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Verificar rol: solo admin y carga pueden crear tareas (DOC_TECNICA §2.2)
        const { data: usuario } = await supabase.from("usuarios").select("rol, roles").eq("id", user.id).single();
        const tienePermiso = usuario?.rol === "admin" || usuario?.rol === "carga" || (usuario?.roles || []).includes("admin") || (usuario?.roles || []).includes("carga");
        if (!tienePermiso) {
            return NextResponse.json({ error: "Solo admin o perito de carga pueden crear tareas" }, { status: 403 });
        }

        const body = await request.json();
        const { titulo, descripcion, asignado_id, participantes_ids, caso_id, prioridad, fecha_vencimiento, adjuntos } = body;

        if (!titulo) {
            return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
        }

        // Insertar tarea
        const insertData: any = {
            titulo,
            creador_id: user.id,
            asignado_id: asignado_id || null, // Se mantiene por retrocompatibilidad
            caso_id: caso_id || null, // Optional
            estado: "pendiente",
            prioridad: prioridad || "normal",
        };

        if (descripcion) insertData.descripcion = descripcion;
        if (fecha_vencimiento) insertData.fecha_vencimiento = fecha_vencimiento;
        if (adjuntos) insertData.adjuntos = adjuntos;

        const { data: tarea, error } = await supabase
            .from("tareas")
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error("Error al crear tarea:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Insertar participantes (si la tabla existe)
        if (participantes_ids && participantes_ids.length > 0) {
            const participantesRows = participantes_ids.map((uid: string) => ({
                tarea_id: tarea.id,
                usuario_id: uid,
            }));

            await supabase.from("tarea_participantes").insert(participantesRows);
        }

        // Crear notificaciones para participantes
        if (participantes_ids && participantes_ids.length > 0) {
            const notificaciones = participantes_ids
                .filter((uid: string) => uid !== user.id) // No notificar al creador
                .map((uid: string) => ({
                    usuario_destino_id: uid,
                    tipo: "tarea_asignada",
                    caso_id: caso_id || null,
                    tarea_id: tarea.id,
                    mensaje: `Te asignaron a la tarea: "${titulo}"`,
                }));

            if (notificaciones.length > 0) {
                await supabase.from("notificaciones").insert(notificaciones);
            }
        }

        return NextResponse.json(tarea);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { id, titulo, descripcion, asignado_id, participantes_ids, caso_id, prioridad, fecha_vencimiento, adjuntos } = body;

        if (!id || !titulo) {
            return NextResponse.json({ error: "El ID y título son obligatorios" }, { status: 400 });
        }

        const updateData: any = {
            titulo,
            asignado_id: asignado_id || null,
            caso_id: caso_id || null,
            prioridad: prioridad || "normal",
            descripcion: descripcion || null,
            fecha_vencimiento: fecha_vencimiento || null,
        };

        if (adjuntos !== undefined) {
            updateData.adjuntos = adjuntos;
        }

        const { data: tarea, error } = await supabase
            .from("tareas")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar tarea:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (participantes_ids !== undefined) {
            await supabase.from("tarea_participantes").delete().eq("tarea_id", id);
            if (participantes_ids && participantes_ids.length > 0) {
                const participantesRows = participantes_ids.map((uid: string) => ({
                    tarea_id: id,
                    usuario_id: uid,
                }));
                await supabase.from("tarea_participantes").insert(participantesRows);
            }
        }

        return NextResponse.json(tarea);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
    }
}
