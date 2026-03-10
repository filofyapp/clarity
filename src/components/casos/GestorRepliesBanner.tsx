"use client";

import { useEffect, useState } from "react";
import { Mail, CheckCircle, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export function GestorRepliesBanner({ casoId, inicialTieneRespuesta, gmailThreadId }: { casoId: string, inicialTieneRespuesta: boolean, gmailThreadId: string | null }) {
    const supabase = createClient();
    const [tieneRespuesta, setTieneRespuesta] = useState(inicialTieneRespuesta);
    const [respuestas, setRespuestas] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (tieneRespuesta) {
            fetchRespuestas();
        }
    }, [tieneRespuesta]);

    const fetchRespuestas = async () => {
        const { data } = await supabase
            .from("respuestas_gestor")
            .select("*")
            .eq("caso_id", casoId)
            .order("leida", { ascending: true }) // unread first
            .order("created_at", { ascending: false });

        if (data) {
            setRespuestas(data);
        }
    };

    const marcarComoLeida = async (respuestaId: string) => {
        const { error } = await supabase
            .from("respuestas_gestor")
            .update({ leida: true })
            .eq("id", respuestaId);

        if (!error) {
            setRespuestas(prev => prev.map(r => r.id === respuestaId ? { ...r, leida: true } : r));

            // Check if all are read now
            const allRead = respuestas.every(r => r.id === respuestaId ? true : r.leida);
            if (allRead) {
                await supabase.from("casos").update({ tiene_respuesta_gestor: false }).eq("id", casoId);
                setTieneRespuesta(false);
                toast.success("Todas las respuestas marcadas como leídas");
            }
        }
    };

    if (!tieneRespuesta && respuestas.length === 0) return null;

    const unreadCount = respuestas.filter(r => !r.leida).length;

    return (
        <div className="w-full mb-6">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${unreadCount > 0 ? 'bg-rose-50 border-rose-200 hover:bg-rose-100' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${unreadCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-neutral-200 text-neutral-600'}`}>
                        <Mail size={18} />
                    </div>
                    <div>
                        <h4 className={`font-semibold text-sm ${unreadCount > 0 ? 'text-rose-900' : 'text-neutral-700'}`}>
                            {unreadCount > 0 ? `Nuevas respuestas del Gestor (${unreadCount})` : 'Historial de respuestas del Gestor'}
                        </h4>
                        <p className={`text-xs ${unreadCount > 0 ? 'text-rose-700' : 'text-neutral-500'}`}>
                            Haga clic para expandir y ver los mensajes
                        </p>
                    </div>
                </div>
                {gmailThreadId && (
                    <a
                        href={`https://mail.google.com/mail/u/0/#search/rfc822msgid%3A${gmailThreadId}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                        Abrir en Gmail <ExternalLink size={12} />
                    </a>
                )}
            </div>

            {isOpen && respuestas.length > 0 && (
                <div className="mt-2 space-y-3">
                    {respuestas.map((resp) => (
                        <div key={resp.id} className={`p-4 rounded-xl border ${resp.leida ? 'bg-white border-neutral-200 opacity-70' : 'bg-white border-rose-200 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-3 border-b border-neutral-100 pb-3">
                                <div>
                                    <p className="font-semibold text-sm text-neutral-900">{resp.remitente_nombre} <span className="text-neutral-500 font-normal">({resp.remitente_email})</span></p>
                                    <p className="text-xs text-neutral-400">{format(new Date(resp.created_at), "dd/MM/yyyy HH:mm")}</p>
                                </div>
                                {!resp.leida && (
                                    <button
                                        onClick={() => marcarComoLeida(resp.id)}
                                        className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <CheckCircle size={14} /> Marcar Leída
                                    </button>
                                )}
                            </div>
                            <div className="text-sm text-neutral-700 whitespace-pre-wrap font-mono leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-100 max-h-[300px] overflow-y-auto">
                                {resp.contenido}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
