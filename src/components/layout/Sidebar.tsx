import { getUsuarioActual } from "@/lib/auth";
import { SidebarClient } from "./SidebarClient";
import { createClient } from "@/lib/supabase/server";

export async function Sidebar() {
  // getUsuarioActual auto-creates the user row if missing, ensuring we have a valid role
  const usuario = await getUsuarioActual();

  const supabase = await createClient();
  const { count: pendingCargaCount } = await supabase
    .from("casos")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente_carga");

  // Count tasks assigned to this user with unread comments
  let unreadTasksCount = 0;
  try {
    // Get tasks assigned to or created by this user that have comments
    const { data: tareasUsuario } = await supabase
      .from("tareas")
      .select("id")
      .or(`asignado_id.eq.${usuario.id},creador_id.eq.${usuario.id}`)
      .neq("estado", "resuelta");
    
    if (tareasUsuario && tareasUsuario.length > 0) {
      const tareaIds = tareasUsuario.map(t => t.id);
      // Count comments on those tasks that are NOT marked as read by this user
      const { data: comentariosSinLeer } = await supabase
        .from("comentarios_tarea")
        .select("id, comentario_lectura!left(leido)")
        .in("tarea_id", tareaIds)
        .neq("usuario_id", usuario.id);
      
      if (comentariosSinLeer) {
        unreadTasksCount = comentariosSinLeer.filter((c: any) => {
          const lecturas = Array.isArray(c.comentario_lectura) ? c.comentario_lectura : [];
          const miLectura = lecturas.find((l: any) => l.leido === true);
          return !miLectura;
        }).length;
      }
    }
  } catch (e) {
    // Fail silently — badge is non-critical
  }

  const userName = `${usuario.nombre} ${usuario.apellido || ""}`.trim();
  const userInitial = usuario.nombre ? usuario.nombre[0].toUpperCase() : "U";

  return <SidebarClient userRoles={usuario.roles || [usuario.rol]} pendingCargaCount={pendingCargaCount || 0} unreadTasksCount={unreadTasksCount} userName={userName} userInitial={userInitial} />;
}
