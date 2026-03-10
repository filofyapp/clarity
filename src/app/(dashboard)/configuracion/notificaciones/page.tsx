import MailTemplatesEditor from "@/components/configuracion/MailTemplatesEditor";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Notificaciones | Configuración | CLARITY",
    description: "Configuración de notificaciones por email",
};

export default async function NotificacionesPage() {
    const supabase = await createClient();

    // Load templates
    const { data: templatesRaw } = await supabase
        .from("mail_templates")
        .select("*")
        .neq("codigo", "wrapper_html") // Don't show the wrapper in the main list by default, although can be toggled
        .order("nombre");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 border-b pb-4">
                    Notificaciones por Email
                </h1>
                <p className="text-sm text-neutral-500 mt-2">
                    Administra las plantillas de correo electrónico que se envían automáticamente a los gestores cuando los casos cambian de estado.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Editor de Templates */}
                <section className="bg-white rounded-xl shadow-sm border p-6">
                    <MailTemplatesEditor templates={templatesRaw || []} />
                </section>
            </div>
        </div>
    );
}
