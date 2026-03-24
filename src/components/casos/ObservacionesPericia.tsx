"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Play, Pause, Download, Save, Loader2 } from "lucide-react";
import { updateCasoRapido } from "@/app/(dashboard)/casos/actions";
import { toast } from "sonner";

const SPEEDS = [1, 1.25, 1.5, 2] as const;

interface Props {
    casoId?: string;
    texto?: string | null;
    audioUrl?: string | null;
    puedeEditar?: boolean;
    esPresencial?: boolean;
}

export function ObservacionesPericia({ casoId, texto, audioUrl, puedeEditar = false, esPresencial = false }: Props) {
    // Don't render if inspection was presencial (VistaInformeCampo already shows observations)
    if (esPresencial) return null;
    // Don't render if empty and can't edit
    if (!texto && !audioUrl && !puedeEditar) return null;

    const [editando, setEditando] = useState(false);
    const [draft, setDraft] = useState(texto || "");
    const [isPending, startTransition] = useTransition();

    const handleGuardar = () => {
        if (!casoId) return;
        startTransition(async () => {
            try {
                const result = await updateCasoRapido(casoId, "observaciones_pericia", draft);
                if (result.error) toast.error(result.error);
                else { toast.success("Observaciones guardadas"); setEditando(false); }
            } catch (e) {
                toast.error("Error al guardar");
            }
        });
    };

    return (
        <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔍</span>
                <h3 className="text-sm font-semibold text-text-primary">Observaciones de la Pericia</h3>
            </div>

            {puedeEditar && editando ? (
                <div className="space-y-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full min-h-[100px] p-3 rounded-xl bg-bg-secondary border border-border/50 text-sm text-text-primary leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        placeholder="Escribí las observaciones de la pericia..."
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => { setDraft(texto || ""); setEditando(false); }}
                            className="text-xs text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardar}
                            disabled={isPending}
                            className="flex items-center gap-1.5 text-xs font-medium bg-brand-primary text-white px-3 py-1.5 rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Guardar
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => puedeEditar && setEditando(true)}
                    className={`bg-bg-secondary border border-border/50 rounded-xl p-4 mb-3 ${puedeEditar ? "cursor-pointer hover:border-brand-primary/30 transition-colors" : ""}`}
                >
                    {texto ? (
                        <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{texto}</p>
                    ) : puedeEditar ? (
                        <p className="text-sm text-text-muted italic">Clic para agregar observaciones...</p>
                    ) : null}
                </div>
            )}

            {audioUrl && <AudioPlayerPericia src={audioUrl} />}
        </div>
    );
}

function AudioPlayerPericia({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [speed, setSpeed] = useState<number>(1);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => { setDuration(audio.duration || 0); setLoaded(true); };
        const onTime = () => setCurrentTime(audio.currentTime);
        const onEnded = () => { setPlaying(false); setCurrentTime(0); };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); }
        else { audioRef.current.play(); }
        setPlaying(!playing);
    };

    const changeSpeed = (s: number) => {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = s;
        setSpeed(s);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = pct * duration;
    };

    const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-bg-secondary border border-border/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <span>🎙</span>
                <span className="text-xs font-medium text-text-muted">Audio adjunto</span>
            </div>

            <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 hover:bg-brand-primary/20 transition-colors"
                >
                    {playing
                        ? <Pause className="w-4 h-4 text-brand-primary" />
                        : <Play className="w-4 h-4 text-brand-primary ml-0.5" />
                    }
                </button>

                {/* Progress bar */}
                <div className="flex-1 space-y-1">
                    <div
                        className="h-2 bg-bg-tertiary rounded-full cursor-pointer relative overflow-hidden group"
                        onClick={seek}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-text-muted font-mono">
                        <span>{fmt(currentTime)}</span>
                        <span>{loaded ? fmt(duration) : "--:--"}</span>
                    </div>
                </div>
            </div>

            {/* Speed controls + download */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-muted mr-1">Velocidad:</span>
                    {SPEEDS.map(s => (
                        <button
                            key={s}
                            onClick={() => changeSpeed(s)}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                speed === s
                                    ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/20"
                                    : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                            }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
                <a
                    href={src}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-text-muted hover:text-brand-primary transition-colors"
                >
                    <Download className="w-3.5 h-3.5" /> Descargar
                </a>
            </div>

            <audio ref={audioRef} src={src} preload="metadata" />
        </div>
    );
}
