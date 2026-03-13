export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Shield, UserPlus } from "lucide-react";
import { MigracionConfigEditor } from "@/components/configuracion/MigracionConfigEditor";

export const metadata = { title: "Configuración - CLARITY" };

export default async function ConfiguracionPage() {
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const usuario = await getUsuarioActual();
    if (usuario.rol !== "admin") {
        const { redirect } = await import("next/navigation");
        redirect("/dashboard");
    }

    // Fetch peritos
    const { data: peritos } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, email, rol, roles, telefono, activo, created_at")
        .order("nombre");

    const peritosActivos = (peritos || []).filter((p: any) => p.activo);
    const peritosInactivos = (peritos || []).filter((p: any) => !p.activo);

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <Shield className="w-6 h-6 text-brand-primary" /> Configuración
                </h1>
                <p className="text-sm text-text-muted mt-1">Gestión de usuarios, tarifas y parámetros del sistema.</p>
            </div>

            {/* ABM de Peritos */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-secondary" /> Peritos del Estudio
                    </h2>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-bg-tertiary/50">
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Nombre</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Email</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Rol</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Teléfono</th>
                                <th className="text-left px-4 py-3 text-text-muted font-medium">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {peritosActivos.map((p: any) => (
                                <tr key={p.id} className="hover:bg-bg-tertiary/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-text-primary">{p.nombre} {p.apellido}</td>
                                    <td className="px-4 py-3 text-text-secondary">{p.email}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(() => {
                                                const roles: string[] = p.roles && p.roles.length > 0 ? p.roles : [p.rol];
                                                return roles.map((r: string) => (
                                                    <span key={r} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r === 'admin' ? 'bg-brand-primary/20 text-brand-primary'
                                                        : r === 'carga' ? 'bg-info/20 text-color-info'
                                                            : 'bg-success/20 text-success'
                                                        }`}>
                                                        {r === 'admin' ? 'Coordinador' : r === 'calle' ? 'Perito Calle' : 'Perito Carga'}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">{p.telefono || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1 text-xs text-success">
                                            <span className="w-2 h-2 rounded-full bg-success" /> Activo
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {peritosInactivos.map((p: any) => (
                                <tr key={p.id} className="hover:bg-bg-tertiary/30 transition-colors opacity-50">
                                    <td className="px-4 py-3 font-medium text-text-secondary">{p.nombre} {p.apellido}</td>
                                    <td className="px-4 py-3 text-text-muted">{p.email}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(() => {
                                                const roles: string[] = p.roles && p.roles.length > 0 ? p.roles : [p.rol];
                                                return roles.map((r: string) => (
                                                    <span key={r} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-bg-tertiary text-text-muted">
                                                        {r === 'admin' ? 'Coordinador' : r === 'calle' ? 'Perito Calle' : 'Perito Carga'}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">{p.telefono || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                                            <span className="w-2 h-2 rounded-full bg-text-muted" /> Inactivo
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(peritos || []).length === 0 && (
                        <div className="p-8 text-center text-text-muted">No hay usuarios registrados.</div>
                    )}
                </div>
            </div>

            {/* Migración Config */}
            {await (async () => {
                const { data: migConfigs } = await supabase
                    .from("configuracion")
                    .select("clave, valor")
                    .in("clave", ["migracion_email_to", "migracion_email_cc", "migracion_usuario_destino"]);

                const cfgMap: Record<string, any> = {};
                (migConfigs || []).forEach((c: any) => { cfgMap[c.clave] = c.valor; });

                const initialTo = (typeof cfgMap.migracion_email_to === "string" ? cfgMap.migracion_email_to : "rcardozo@sancorseguros.com").replace(/"/g, "");
                const initialCc = Array.isArray(cfgMap.migracion_email_cc)
                    ? cfgMap.migracion_email_cc.join(", ")
                    : "MCossa@sancorseguros.com, SGuzman@sancorseguros.com";
                const initialUsuario = (typeof cfgMap.migracion_usuario_destino === "string" ? cfgMap.migracion_usuario_destino : "ALFREDO MIÑO").replace(/"/g, "");

                return (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <MigracionConfigEditor
                            initialTo={initialTo}
                            initialCc={initialCc}
                            initialUsuario={initialUsuario}
                        />
                    </div>
                );
            })()}

            {/* Links a sublocalidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <a href="/configuracion/precios" className="bg-card border border-border rounded-lg p-6 hover:border-brand-primary/50 transition-all group">
                    <h3 className="font-semibold text-text-primary group-hover:text-brand-primary transition-colors">Honorarios y Tarifas</h3>
                    <p className="text-sm text-text-muted mt-1">Configurar precios por tipo de inspección y kilometraje.</p>
                </a>
                <a href="/configuracion/notificaciones" className="bg-card border border-border rounded-lg p-6 hover:border-brand-primary/50 transition-all group">
                    <h3 className="font-semibold text-text-primary group-hover:text-brand-primary transition-colors">Notificaciones Automáticas</h3>
                    <p className="text-sm text-text-muted mt-1">Configurar plantillas de emails y alertas para Sancor.</p>
                </a>
            </div>
        </div>
    );
}
