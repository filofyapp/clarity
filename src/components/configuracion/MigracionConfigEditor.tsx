"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowRightLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    initialTo: string;
    initialCc: string;
    initialUsuario: string;
}

export function MigracionConfigEditor({ initialTo, initialCc, initialUsuario }: Props) {
    const [to, setTo] = useState(initialTo);
    const [cc, setCc] = useState(initialCc);
    const [usuario, setUsuario] = useState(initialUsuario);
    const [isPending, startTransition] = useTransition();
    const supabase = createClient();

    const handleSave = () => {
        startTransition(async () => {
            try {
                // Upsert all 3 config values
                const updates = [
                    { clave: "migracion_email_to", valor: JSON.stringify(to.trim()), descripcion: "Email principal para solicitudes de migración" },
                    { clave: "migracion_email_cc", valor: JSON.stringify(cc.split(",").map(e => e.trim()).filter(Boolean)), descripcion: "Emails en copia para solicitudes de migración" },
                    { clave: "migracion_usuario_destino", valor: JSON.stringify(usuario.trim()), descripcion: "Nombre del usuario destino en el cuerpo del mail de migración" },
                ];

                for (const u of updates) {
                    const { error } = await supabase
                        .from("configuracion")
                        .upsert(u, { onConflict: "clave" });
                    if (error) throw error;
                }

                toast.success("Configuración de migración guardada");
            } catch (err: any) {
                toast.error("Error: " + (err.message || "No se pudo guardar"));
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-text-primary">Migración de Siniestros</h3>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-text-muted mb-1 block">Email principal (Para)</label>
                    <input
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-bg-secondary text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                        placeholder="email@sancorseguros.com"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-text-muted mb-1 block">Emails en copia (CC, separados por coma)</label>
                    <input
                        type="text"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-bg-secondary text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                        placeholder="email1@sancorseguros.com, email2@sancorseguros.com"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-text-muted mb-1 block">Nombre del usuario destino</label>
                    <input
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-bg-secondary text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                        placeholder="ALFREDO MIÑO"
                    />
                    <p className="text-[10px] text-text-muted mt-1">Este nombre aparece en el cuerpo del email: &quot;migrar al usuario de [NOMBRE]&quot;</p>
                </div>
            </div>

            <Button
                onClick={handleSave}
                disabled={isPending}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
            </Button>
        </div>
    );
}
