import { createAdminClient } from "@/lib/supabase/admin";
import { WizardCaptura } from "@/components/inspeccion-remota/WizardCaptura";
import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";

function ErrorScreen({ icon: Icon, title, message, color }: { icon: any; title: string; message: string; color: string }) {
    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
                    <Icon className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-white/60 text-sm leading-relaxed">{message}</p>
            </div>
        </div>
    );
}

export default async function InspeccionRemotaPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const supabase = createAdminClient();

    // Validate token
    const { data: link, error } = await supabase
        .from("links_inspeccion")
        .select(`
            id, caso_id, token, tipo, nombre_destinatario, estado, expira_en,
            fotos_subidas, max_fotos,
            caso:casos(numero_siniestro, marca, modelo, dominio, tipo_inspeccion, perito_calle_id)
        `)
        .eq("token", token)
        .single();

    // Token not found
    if (error || !link) {
        return (
            <ErrorScreen
                icon={XCircle}
                title="Link Inválido"
                message="El link al que intentás acceder no existe o fue eliminado. Contactá al estudio para obtener un nuevo link."
                color="bg-red-500/20 text-red-400"
            />
        );
    }

    // Token expired
    if (link.estado === "expirado" || new Date(link.expira_en) < new Date()) {
        return (
            <ErrorScreen
                icon={Clock}
                title="Link Expirado"
                message="Este link ya venció. Contactá al estudio para que te generen uno nuevo."
                color="bg-amber-500/20 text-amber-400"
            />
        );
    }

    // Token revoked
    if (link.estado === "revocado") {
        return (
            <ErrorScreen
                icon={AlertTriangle}
                title="Link Revocado"
                message="Este link fue cancelado. Contactá al estudio para más información."
                color="bg-red-500/20 text-red-400"
            />
        );
    }

    // Token already completed
    if (link.estado === "completado") {
        return (
            <ErrorScreen
                icon={CheckCircle2}
                title="Fotos Ya Cargadas"
                message="Las fotografías para este siniestro ya fueron cargadas exitosamente. No es necesario hacer nada más. ¡Gracias!"
                color="bg-green-500/20 text-green-400"
            />
        );
    }

    // Valid and active — render the wizard
    const caso = link.caso as any;

    return (
        <div className="flex-1 flex flex-col">
            <WizardCaptura
                token={link.token}
                siniestro={caso?.numero_siniestro || ""}
                vehiculo={`${caso?.marca || ""} ${caso?.modelo || ""}`.trim()}
                dominio={caso?.dominio || ""}
                tipoInspeccion={caso?.tipo_inspeccion || "ip_remota"}
                fotosYaSubidas={link.fotos_subidas}
                maxFotos={link.max_fotos}
            />
        </div>
    );
}
