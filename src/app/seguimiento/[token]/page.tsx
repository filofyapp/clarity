import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Clock, Car, MapPin, Calendar, Fingerprint } from "lucide-react";
import React from "react";

export const metadata = {
    title: "Seguimiento de Siniestro | CLARITY",
    description: "Estado actualizado de su siniestro",
};

export default async function SeguimientoCasoPage({ params }: { params: { token: string } }) {
    const supabase = await createClient();
    const token = await params?.token; // next.js 15+ needs await params? Check project version. We'll await safely.

    if (!token) {
        notFound();
    }

    const { data: linkInfo } = await supabase
        .from('seguimiento_tokens')
        .select(`
            caso_id,
            activo,
            caso:casos(
                estado,
                numero_siniestro,
                dominio,
                marca,
                modelo,
                nombre_asegurado,
                fecha_inspeccion_programada,
                direccion_inspeccion,
                localidad,
                taller:talleres(nombre),
                historial_estados(estado_nuevo, created_at)
            )
        `)
        .eq('token', token)
        .eq('activo', true)
        .single();

    if (!linkInfo || !linkInfo.caso) {
        return (
            <div className="min-h-screen bg-[#0C0A0F] flex items-center justify-center p-6 text-white text-center">
                <div className="max-w-md w-full bg-[#1A1525] rounded-2xl p-8 border border-white/10 shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-[#D6006E] mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Enlace no disponible</h2>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Este enlace de seguimiento es inválido, ha caducado o el siniestro ya se encuentra cerrado.
                        Por favor, contacte a su gestor para más información.
                    </p>
                </div>
            </div>
        );
    }

    const caso = linkInfo.caso as any;

    // Ordered timeline states
    const TIMELINE_STATES = [
        { id: 'pendiente_coordinacion', label: 'Caso recibido' },
        { id: 'contactado', label: 'Contacto iniciado' },
        { id: 'ip_coordinada', label: 'Inspección coordinada' },
        { id: 'pendiente_carga', label: 'Inspección realizada' },
        { id: 'pendiente_presupuesto', label: 'Esperando presupuesto' }, // Conditional
        { id: 'licitando_repuestos', label: 'Licitación de repuestos' },
        { id: 'ip_cerrada', label: 'Caso cerrado' },
    ];

    // Check if we ever hit 'pendiente_presupuesto' in history to decide if we show it in the timeline
    const hadPresupuesto = caso.historial_estados?.some((h: any) => h.estado_nuevo === 'pendiente_presupuesto');

    // Filter out 'pendiente_presupuesto' if it never happened AND isn't the current state
    const displayStates = TIMELINE_STATES.filter(ts =>
        ts.id !== 'pendiente_presupuesto' || hadPresupuesto || caso.estado === 'pendiente_presupuesto'
    );

    // Find current index
    const currentIndex = displayStates.findIndex(s => s.id === caso.estado);
    const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex; // Fallback if state is some weird internal one

    return (
        <div className="min-h-screen bg-[#0C0A0F] flex flex-col font-sans selection:bg-[#D6006E] selection:text-white">
            {/* Top Bar Logo */}
            <header className="bg-[#1A1525]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10 px-6 py-4 flex flex-col items-center justify-center gap-1">
                <h1 className="text-white font-bold text-xl tracking-[4px] m-0">CLARITY</h1>
                <p className="text-[#D6006E] text-[10px] tracking-widest font-semibold uppercase">Powered by AOM Siniestros</p>
            </header>

            <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col gap-6">

                {/* Meta Data Card */}
                <section className="bg-gradient-to-br from-[#2A2338] to-[#1A1525] p-1 rounded-2xl shadow-xl shadow-black/50">
                    <div className="bg-[#1A1525] rounded-[14px] p-6 h-full border border-white/5 relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D6006E]/10 rounded-full blur-[40px] pointer-events-none" />

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Siniestro Asignado</p>
                                <h2 className="text-2xl font-bold text-white tracking-tight">{caso.numero_siniestro || "S/D"}</h2>
                            </div>
                            <div className="bg-[#D6006E]/10 text-[#D6006E] px-3 py-1 rounded-lg border border-[#D6006E]/20 text-sm font-semibold whitespace-nowrap">
                                Sancor Seguros
                            </div>
                        </div>

                        <div className="space-y-3">
                            {caso.dominio && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-white/5 rounded-md"><Fingerprint size={16} className="text-[#D6006E]" /></div>
                                    <p className="text-white/80"><span className="text-white/50 w-24 inline-block">Dominio:</span> <span className="font-semibold text-white bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">{caso.dominio}</span></p>
                                </div>
                            )}

                            {(caso.marca || caso.modelo) && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-white/5 rounded-md"><Car size={16} className="text-[#D6006E]" /></div>
                                    <p className="text-white/80"><span className="text-white/50 w-24 inline-block">Vehículo:</span> <span className="font-medium text-white">{caso.marca} {caso.modelo}</span></p>
                                </div>
                            )}

                            {caso.fecha_inspeccion_programada && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-white/5 rounded-md"><Calendar size={16} className="text-[#D6006E]" /></div>
                                    <p className="text-white/80"><span className="text-white/50 w-24 inline-block">Inspección:</span> <span className="font-medium text-white">{new Date(caso.fecha_inspeccion_programada).toLocaleDateString('es-AR')}</span></p>
                                </div>
                            )}

                            {(caso.taller || caso.direccion_inspeccion) && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-white/5 rounded-md"><MapPin size={16} className="text-[#D6006E]" /></div>
                                    <p className="text-white/80"><span className="text-white/50 w-24 inline-block">Lugar:</span> <span className="font-medium text-white">{caso.taller?.nombre || `${caso.direccion_inspeccion}, ${caso.localidad || ''}`}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="bg-[#1A1525] rounded-2xl p-6 border border-white/5 shadow-lg mt-2 relative">
                    <h3 className="text-white font-semibold text-lg mb-6 border-b border-white/10 pb-4">Evolución del Peritaje</h3>

                    <div className="relative pl-6 space-y-8 py-2">
                        {/* Linea vertical */}
                        <div className="absolute top-4 bottom-4 left-[23px] w-[2px] bg-white/10 transform -translate-x-1/2 rounded-full" />

                        {displayStates.map((state, idx) => {
                            const isCompleted = idx < safeCurrentIndex;
                            const isCurrent = idx === safeCurrentIndex;
                            const isPending = idx > safeCurrentIndex;

                            // Find timestamp if completed
                            const historyEntry = isCompleted
                                ? [...caso.historial_estados].reverse().find((h: any) => h.estado_nuevo === state.id) // Get latest occurrence 
                                : null;
                            const timestamp = historyEntry?.created_at ? new Date(historyEntry.created_at).toLocaleDateString('es-AR') : null;

                            return (
                                <div key={state.id} className={`relative flex items-center gap-6 ${isPending ? 'opacity-40' : ''}`}>
                                    {/* Icon Container aligned with the line */}
                                    <div className={`absolute -left-6 transform -translate-x-1/2 flex items-center justify-center bg-[#1A1525] py-1`}>
                                        {isCompleted && (
                                            <div className="w-5 h-5 rounded-full bg-[#D6006E] flex items-center justify-center shadow-[0_0_10px_rgba(214,0,110,0.5)]">
                                                <CheckCircle2 size={12} className="text-white" />
                                            </div>
                                        )}
                                        {isCurrent && (
                                            <div className="w-5 h-5 rounded-full border-[2px] border-[#D6006E] flex items-center justify-center bg-[#1A1525]">
                                                <div className="w-2.5 h-2.5 bg-[#D6006E] rounded-full animate-pulse" />
                                            </div>
                                        )}
                                        {isPending && (
                                            <div className="w-5 h-5 rounded-full border-[2px] border-white/20 bg-[#1A1525]" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 rounded-xl p-4 transition-all ${isCurrent
                                            ? 'bg-[#D6006E]/10 border border-[#D6006E]/30 shadow-sm'
                                            : 'bg-[#0C0A0F] border border-white/5 hover:border-white/10'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <p className={`font-medium text-[15px] ${isCurrent ? 'text-[#D6006E]' : 'text-white/90'}`}>
                                                {state.label}
                                            </p>
                                            {isCompleted && timestamp && (
                                                <span className="text-[11px] text-white/40 bg-white/5 px-2 py-1 rounded-md">{timestamp}</span>
                                            )}
                                            {isPending && (
                                                <span className="text-[11px] text-white/30 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Pendiente</span>
                                            )}
                                            {isCurrent && (
                                                <span className="text-[11px] text-[#D6006E] bg-[#D6006E]/10 px-2 py-1 rounded-md font-semibold tracking-wide">AHORA</span>
                                            )}
                                        </div>
                                        {isCurrent && (
                                            <p className="text-white/60 text-xs mt-2 leading-relaxed">
                                                Estamos actualizando la información o aguardando documentación para avanzar al próximo paso.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </main>

            <footer className="text-center pb-8 pt-4 px-6">
                <p className="text-white/30 text-[11px] leading-relaxed max-w-sm mx-auto">
                    Este enlace de seguimiento es privado y exclusivo para realizar la trazabilidad del siniestro {caso.numero_siniestro}.
                </p>
            </footer>
        </div>
    );
}

// Needed imported icon for the error page
import { AlertCircle } from "lucide-react";
