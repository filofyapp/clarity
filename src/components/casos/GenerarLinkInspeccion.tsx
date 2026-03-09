"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link2, Copy, RefreshCw, CheckCircle2, Clock, XCircle, Camera, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
    casoId: string;
}

interface LinkData {
    id: string;
    token: string;
    estado: string;
    expira_en: string;
    fotos_subidas: number;
    created_at: string;
    completed_at: string | null;
}

export function GenerarLinkInspeccion({ casoId }: Props) {
    const supabase = createClient();
    const router = useRouter();
    const [link, setLink] = useState<LinkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        async function fetchLink() {
            setLoading(true);
            const { data } = await supabase
                .from("links_inspeccion")
                .select("id, token, estado, expira_en, fotos_subidas, created_at, completed_at")
                .eq("caso_id", casoId)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
            setLink(data || null);
            setLoading(false);
        }
        fetchLink();
    }, [casoId, supabase]);

    const handleGenerar = () => {
        startTransition(async () => {
            const tokenArray = new Uint8Array(24);
            crypto.getRandomValues(tokenArray);
            const token = Array.from(tokenArray, b => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
            const { error, data } = await supabase.from("links_inspeccion").insert({ caso_id: casoId, token }).select().single();
            if (error) { toast.error("Error al generar link: " + error.message); return; }
            setLink(data);
            toast.success("Link de inspección remota generado");
            router.refresh();
        });
    };

    const handleRevocar = () => {
        if (!link) return;
        startTransition(async () => {
            await supabase.from("links_inspeccion").update({ estado: "revocado" }).eq("id", link.id);
            setLink({ ...link, estado: "revocado" });
            toast.success("Link revocado");
            router.refresh();
        });
    };

    const copyLink = () => {
        if (!link) return;
        navigator.clipboard.writeText(`${window.location.origin}/ip/${link.token}`);
        toast.success("Link copiado al portapapeles");
    };

    const isActive = link?.estado === "activo" && new Date(link.expira_en) > new Date();
    const isCompleted = link?.estado === "completado";
    const isExpired = link?.estado === "expirado" || (link?.estado === "activo" && new Date(link.expira_en) <= new Date());
    const isRevoked = link?.estado === "revocado";

    if (loading) {
        return (
            <div className="p-4 rounded-lg bg-bg-secondary border border-border/60 flex items-center gap-2 text-text-muted text-sm md:col-span-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
        );
    }

    // No link or inactive — generate button
    if (!link || isExpired || isRevoked) {
        return (
            <div className="p-4 rounded-lg bg-bg-secondary border border-dashed border-border/60 flex flex-col sm:flex-row items-center gap-3 md:col-span-3 transition-colors hover:border-brand-primary/30">
                <div className="flex items-center gap-2 flex-1">
                    <Camera className="w-5 h-5 text-text-muted" />
                    <div>
                        <p className="text-sm font-medium text-text-primary">Inspección Remota</p>
                        <p className="text-xs text-text-muted">
                            {isExpired ? "Link anterior expirado — " : isRevoked ? "Link revocado — " : ""}
                            Generá un link para carga de fotos
                        </p>
                    </div>
                </div>
                <button onClick={handleGenerar} disabled={isPending}
                    className="shrink-0 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    Generar Link
                </button>
            </div>
        );
    }

    // Completed — status only (photos shown in unified gallery)
    if (isCompleted) {
        return (
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 flex flex-col sm:flex-row items-center gap-3 md:col-span-3">
                <div className="flex items-center gap-2 flex-1">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                        <p className="text-sm font-medium text-text-primary">Inspección Remota Completada</p>
                        <p className="text-xs text-text-muted">
                            {link.fotos_subidas} fotos recibidas • {link.completed_at ? new Date(link.completed_at).toLocaleDateString("es-AR") : ""}
                            <span className="text-text-muted/60 ml-1">— Ver galería abajo</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (!window.confirm(`¿Generar un nuevo link?\n\nLas ${link.fotos_subidas} fotos ya cargadas se mantienen en el sistema. El link anterior quedará inactivo.`)) return;
                        handleGenerar();
                    }}
                    disabled={isPending}
                    className="shrink-0 text-text-muted hover:text-text-primary text-xs flex items-center gap-1 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Generar nuevo link
                </button>
            </div>
        );
    }

    // Active link
    return (
        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 flex flex-col gap-3 md:col-span-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-blue-400" />
                    <div>
                        <p className="text-sm font-medium text-text-primary">Link de Inspección Activo</p>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expira: {new Date(link.expira_en).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            {link.fotos_subidas > 0 && ` • ${link.fotos_subidas} fotos subidas`}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={copyLink}
                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-medium text-sm px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5">
                    <Copy className="w-4 h-4" /> Copiar Link
                </button>
                <a href={`/ip/${link.token}`} target="_blank" rel="noopener noreferrer"
                    className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 px-3 py-2 rounded-lg transition-all flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={handleRevocar} disabled={isPending}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Revocar
                </button>
            </div>
        </div>
    );
}
