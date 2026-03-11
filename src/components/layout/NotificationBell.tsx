"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface Notificacion {
    id: string;
    tipo: string;
    mensaje: string;
    leida: boolean;
    caso_id: string | null;
    tarea_id: string | null;
    created_at: string;
}

export function NotificationBell() {
    const supabase = createClient();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [open, setOpen] = useState(false);
    const [sinLeer, setSinLeer] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);

    const playPing = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(700, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) { }
    };

    useEffect(() => {
        let channel: any;

        const initNotifications = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const userId = session.user.id;

            await fetchNotificaciones(userId);

            // Suscribirse a realtime para nuevas notificaciones SOLO de este usuario
            channel = supabase
                .channel("notificaciones_bell")
                .on("postgres_changes", {
                    event: "INSERT",
                    schema: "public",
                    table: "notificaciones",
                    filter: `usuario_destino_id=eq.${userId}`
                }, (payload) => {
                    setNotificaciones(prev => [payload.new as Notificacion, ...prev]);
                    setSinLeer(prev => prev + 1);
                    playPing();
                    setIsPulsing(true);
                    setTimeout(() => setIsPulsing(false), 2000);
                })
                .subscribe();
        };

        initNotifications();

        return () => { if (channel) supabase.removeChannel(channel); };
    }, []);

    const fetchNotificaciones = async (userId: string) => {
        const { data } = await supabase
            .from("notificaciones")
            .select("*")
            .eq("usuario_destino_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);

        if (data) {
            setNotificaciones(data);
            setSinLeer(data.filter((n: Notificacion) => !n.leida).length);
        }
    };

    const marcarLeida = async (id: string) => {
        await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        setSinLeer(prev => Math.max(0, prev - 1));
    };

    const marcarTodasLeidas = async () => {
        const sinLeerIds = notificaciones.filter(n => !n.leida).map(n => n.id);
        if (sinLeerIds.length === 0) return;
        await supabase.from("notificaciones").update({ leida: true }).in("id", sinLeerIds);
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        setSinLeer(0);
    };

    const getLink = (n: Notificacion) => {
        if (n.tarea_id) return `/tareas`;
        if (n.caso_id) return `/casos/${n.caso_id}`;
        return "#";
    };

    const tipoIcon: Record<string, string> = {
        inspeccion_realizada: "📋",
        tarea_asignada: "📌",
        mencion: "💬",
        tarea_estado_cambiado: "🔄",
        pendiente_presupuesto: "💰",
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors ${isPulsing ? 'animate-bounce text-brand-primary' : ''}`}
            >
                <Bell className={`w-5 h-5 ${sinLeer > 0 ? "fill-brand-primary/20 text-brand-primary" : ""}`} />
                {sinLeer > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        {sinLeer > 9 ? "9+" : sinLeer}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="text-sm font-semibold text-text-primary">Notificaciones</h3>
                            <div className="flex items-center gap-2">
                                {sinLeer > 0 && (
                                    <button onClick={marcarTodasLeidas}
                                        className="text-xs text-brand-primary hover:text-brand-primary-hover">
                                        Marcar todas
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-border">
                            {notificaciones.length === 0 && (
                                <div className="p-6 text-center text-text-muted text-sm">
                                    Sin notificaciones
                                </div>
                            )}
                            {notificaciones.map(n => (
                                <Link
                                    key={n.id}
                                    href={getLink(n)}
                                    onClick={() => { marcarLeida(n.id); setOpen(false); }}
                                    className={`block px-4 py-3 hover:bg-bg-tertiary/50 transition-colors ${!n.leida ? "bg-brand-primary/5" : ""}`}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-lg shrink-0">{tipoIcon[n.tipo] || "🔔"}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm line-clamp-2 ${!n.leida ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                                                {n.mensaje}
                                            </p>
                                            <p className="text-[10px] text-text-muted mt-1">
                                                {format(new Date(n.created_at), "dd MMM HH:mm", { locale: es })}
                                            </p>
                                        </div>
                                        {!n.leida && <span className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
