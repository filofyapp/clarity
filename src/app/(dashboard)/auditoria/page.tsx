import { getUsuarioActual } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditoriaPanel from "@/components/auditoria/AuditoriaPanel";

export const metadata = {
  title: "Auditoría | CLARITY",
  description: "Control de rendimiento y desvíos de peritos",
};

export default async function AuditoriaPage() {
  const usuario = await getUsuarioActual();
  const roles = usuario.roles || [usuario.rol];

  if (!roles.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <AuditoriaPanel />
    </div>
  );
}
