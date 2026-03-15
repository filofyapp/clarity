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

  // Count cases pending invoicing (cerrado + not facturado)
  const { count: pendingFacturacionCount } = await supabase
    .from("casos")
    .select("*", { count: "exact", head: true })
    .eq("estado", "cerrado")
    .eq("facturado", false);

  // Count pending tasks assigned to this user (not resolved)
  let pendingTasksCount = 0;
  try {
    const { count } = await supabase
      .from("tareas")
      .select("*", { count: "exact", head: true })
      .eq("asignado_id", usuario.id)
      .neq("estado", "resuelta");
    pendingTasksCount = count || 0;
  } catch (e) {
    // Fail silently — badge is non-critical
  }

  const userName = `${usuario.nombre} ${usuario.apellido || ""}`.trim();
  const userInitial = usuario.nombre ? usuario.nombre[0].toUpperCase() : "U";

  return <SidebarClient userRoles={usuario.roles || [usuario.rol]} pendingCargaCount={pendingCargaCount || 0} pendingTasksCount={pendingTasksCount} pendingFacturacionCount={pendingFacturacionCount || 0} userName={userName} userInitial={userInitial} />;
}
