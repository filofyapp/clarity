export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KanbanSquare } from "lucide-react";
import { KanbanBoard } from "@/components/tareas/KanbanBoard";
import { TareaForm } from "@/components/tareas/TareaForm";

export default async function TareasDashboard() {
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const usuarioData = await getUsuarioActual();

    // 3. Fetch All active Users (For Assignment Dropdown)
    const { data: usuariosAll } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, rol")
        .eq("activo", true)
        .order("nombre");

    // 4. Mapeo Condicional de Tareas 
    // ADMIN = Ve todas. CALLE/CARGA = Solo las creadas por ellos, o asignadas a ellos.
    let query = supabase.from("tareas").select(`
        *,
        creador:usuarios!tareas_creador_id_fkey(nombre, apellido),
        asignado:usuarios!tareas_asignado_id_fkey(nombre, apellido),
        caso:casos(id, numero_siniestro, marca, compania:companias(nombre), nombre_asegurado, telefono_asegurado, dominio, estado),
        comentarios_tarea(usuario_id)
    `).order("created_at", { ascending: false });

    if (usuarioData.rol !== "admin") {
        query = query.or(`creador_id.eq.${usuarioData.id},asignado_id.eq.${usuarioData.id}`);
    }

    const { data: tareas, error } = await query;

    if (error) {
        console.error("Error cargando tareas:", error);
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabecera y Formulario Modals */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <KanbanSquare className="w-6 h-6 text-brand-primary" />
                        Tablero de Tareas
                    </h1>
                    <p className="text-text-muted mt-1 text-sm">Organización y comunicación asincrónica del estudio</p>
                </div>

                <div className="flex gap-3 relative z-50">
                    <TareaForm usuarios={usuariosAll || []} />
                </div>
            </div>

            {/* Kanban Grid Injection */}
            <KanbanBoard
                tareas={tareas || []}
                usuarios={usuariosAll || []}
                currentUserId={usuarioData.id}
                currentUserRol={usuarioData.rol}
                currentUserNombre={`${usuarioData.nombre} ${usuarioData.apellido}`}
            />
        </div>
    );
}
