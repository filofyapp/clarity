"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, Download, FolderDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface Props {
    casoId: string;
}

interface Foto {
    id: string;
    url: string;
    tipo: string;
    descripcion: string | null;
    orden: number;
    created_at: string;
}

const TIPO_LABELS: Record<string, string> = {
    lateral_izq: "Lateral Izq.",
    lateral_der: "Lateral Der.",
    frente: "Frontal",
    trasera: "Trasera",
    kilometraje: "Kilometraje",
    documentacion: "Chasis / VIN",
    danio_detalle: "Detalle Daño",
    general: "General",
    motor: "Motor",
    interior: "Interior",
    otro: "Otro",
};

const TABS = [
    { id: "todas", label: "Todas" },
    { id: "reglamentarias", label: "Reglamentarias" },
    { id: "danios", label: "Daños" },
] as const;

const REGLAMENTARIAS = ["lateral_izq", "lateral_der", "frente", "trasera", "kilometraje", "documentacion"];

const FILTER_PRESETS = [
    { id: "contraste", label: "Contraste", icon: "◐", css: "contrast(2.2) brightness(1.1)", desc: "Resalta rayones y abolladuras" },
    { id: "saturacion", label: "Saturación", icon: "🎨", css: "saturate(3) contrast(1.4)", desc: "Exagera diferencias de pintura" },
    { id: "bordes", label: "Bordes", icon: "▦", css: "grayscale(1) contrast(5) brightness(0.8)", desc: "Detección de contornos" },
    { id: "invertido", label: "Invertido", icon: "◑", css: "invert(1) contrast(1.5)", desc: "Revela patrones ocultos" },
    { id: "calor", label: "Calor", icon: "🔥", css: "sepia(0.6) contrast(1.6) saturate(2.5) hue-rotate(-15deg)", desc: "Mapa de calor para superficie" },
];

export function GaleriaFotosResponsive({ casoId }: Props) {
    const supabase = createClient();
    const [fotos, setFotos] = useState<Foto[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>("todas");

    // Lightbox
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const panStart = useRef({ x: 0, y: 0 });
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        async function fetchFotos() {
            setLoading(true);
            const { data } = await supabase
                .from("fotos_inspeccion")
                .select("id, url, tipo, descripcion, orden, created_at")
                .eq("caso_id", casoId)
                .order("orden", { ascending: true });
            setFotos(data || []);
            setLoading(false);
        }
        fetchFotos();
    }, [casoId, supabase]);

    // Filtered list
    const filteredFotos = fotos.filter(f => {
        if (activeTab === "todas") return true;
        if (activeTab === "reglamentarias") return REGLAMENTARIAS.includes(f.tipo);
        if (activeTab === "danios") return f.tipo === "danio_detalle";
        return true;
    });

    // Zoom / pan handlers
    const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        setZoom(z => {
            const next = z + (e.deltaY < 0 ? 0.3 : -0.3);
            const clamped = Math.max(1, Math.min(5, next));
            if (clamped === 1) setPan({ x: 0, y: 0 });
            return clamped;
        });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        panStart.current = { ...pan };
    }, [zoom, pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging) return;
        setPan({
            x: panStart.current.x + (e.clientX - dragStart.current.x),
            y: panStart.current.y + (e.clientY - dragStart.current.y),
        });
    }, [dragging]);

    const handleMouseUp = useCallback(() => setDragging(false), []);

    const handleDoubleClick = useCallback(() => {
        if (zoom > 1) resetZoom(); else setZoom(2.5);
    }, [zoom, resetZoom]);

    const changePhoto = useCallback((newIndex: number) => {
        setLightboxIndex(newIndex);
        resetZoom();
        setActiveFilter(null);
    }, [resetZoom]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setShowLightbox(true);
        resetZoom();
        setActiveFilter(null);
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
        setShowLightbox(false);
        document.body.style.overflow = "auto";
    };

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!showLightbox) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeLightbox();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                changePhoto(Math.max(0, lightboxIndex - 1));
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                changePhoto(Math.min(filteredFotos.length - 1, lightboxIndex + 1));
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showLightbox, lightboxIndex, filteredFotos.length, changePhoto]);

    // Counts per tab
    const countReglamentarias = fotos.filter(f => REGLAMENTARIAS.includes(f.tipo)).length;
    const countDanios = fotos.filter(f => f.tipo === "danio_detalle").length;

    // Extract unique damage zones
    const zonasReportadas = Array.from(new Set(
        fotos
            .filter(f => f.tipo === "danio_detalle" && f.descripcion?.startsWith("Daños reportados: "))
            .flatMap(f => f.descripcion!.replace("Daños reportados: ", "").split(", "))
    )).filter(Boolean);

    // Download single photo
    const downloadSingle = async (foto: Foto) => {
        try {
            const res = await fetch(foto.url);
            const blob = await res.blob();
            const ext = foto.url.split(".").pop()?.split("?")[0] || "jpg";
            const filename = `${(TIPO_LABELS[foto.tipo] || foto.tipo).replace(/[\s\/]/g, "_")}_${foto.orden}.${ext}`;
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch {
            toast.error("Error al descargar la foto");
        }
    };

    // Download all (filtered) as ZIP
    const downloadAll = async () => {
        if (downloading) return;
        setDownloading(true);
        const toastId = toast.loading(`Preparando ZIP con ${filteredFotos.length} fotos...`);
        try {
            const zip = new JSZip();
            const folder = zip.folder("inspeccion")!;
            let done = 0;
            await Promise.all(filteredFotos.map(async (foto) => {
                try {
                    const res = await fetch(foto.url);
                    const blob = await res.blob();
                    const ext = foto.url.split(".").pop()?.split("?")[0] || "jpg";
                    const name = `${(TIPO_LABELS[foto.tipo] || foto.tipo).replace(/[\s\/]/g, "_")}_${foto.orden}.${ext}`;
                    folder.file(name, blob);
                    done++;
                    toast.loading(`Descargando ${done} / ${filteredFotos.length}...`, { id: toastId });
                } catch { /* skip failed photo */ }
            }));
            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = `inspeccion_${casoId.slice(0, 8)}_${activeTab}.zip`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast.success(`${done} fotos descargadas`, { id: toastId });
        } catch {
            toast.error("Error al crear el ZIP", { id: toastId });
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 mt-6">
                <div className="h-6 bg-bg-tertiary rounded w-48 animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-bg-tertiary aspect-square rounded-lg border border-border" />
                    ))}
                </div>
            </div>
        );
    }

    if (fotos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 mt-6 text-center bg-bg-secondary/30 rounded-lg border border-dashed border-border">
                <ImageIcon className="w-10 h-10 text-text-muted mb-3" />
                <p className="text-text-muted text-sm">No hay evidencia fotográfica adjunta a la inspección.</p>
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-4">
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-semibold text-text-primary text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-brand-secondary" />
                    Galería de Inspección
                    <span className="text-sm font-normal text-text-muted">({fotos.length})</span>
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadAll}
                        disabled={downloading || filteredFotos.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-secondary border border-border/60 text-text-muted hover:text-text-primary hover:border-brand-primary/30 transition-all disabled:opacity-40"
                    >
                        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderDown className="w-3.5 h-3.5" />}
                        Descargar {activeTab === "todas" ? "todas" : activeTab}
                    </button>
                    <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1 border border-border/50">
                        {TABS.map(tab => {
                            const count = tab.id === "todas" ? fotos.length : tab.id === "reglamentarias" ? countReglamentarias : countDanios;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === tab.id
                                        ? "bg-bg-primary text-text-primary shadow-sm border border-border/60"
                                        : "text-text-muted hover:text-text-primary"
                                        }`}
                                >
                                    {tab.label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-brand-primary/10 text-brand-primary" : "bg-bg-secondary text-text-muted"
                                        }`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Zonas de Daño Reportadas */}
            {(activeTab === "todas" || activeTab === "danios") && zonasReportadas.length > 0 && (
                <div className="bg-bg-secondary/40 border border-brand-primary/20 rounded-lg p-3 flex flex-col sm:flex-row sm:items-start md:items-center gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-text-primary text-sm font-medium shrink-0">
                        <AlertCircle className="w-4 h-4 text-brand-primary" />
                        Zonas con daños reportados:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {zonasReportadas.map(zona => (
                            <span key={zona} className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-md text-xs font-semibold">
                                {zona}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Photo Grid */}
            {filteredFotos.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-text-muted text-sm bg-bg-secondary/20 rounded-lg border border-dashed border-border/50">
                    No hay fotos en esta categoría.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredFotos.map((foto, index) => (
                        <button
                            key={foto.id}
                            onClick={() => openLightbox(index)}
                            className="group relative aspect-square bg-bg-tertiary rounded-lg overflow-hidden border border-border/40 hover:border-brand-primary/50 transition-all hover:shadow-lg hover:scale-[1.02]"
                        >
                            <img src={foto.url} alt={foto.tipo} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                                <p className="text-[11px] font-medium text-white/90">
                                    {TIPO_LABELS[foto.tipo] || foto.tipo.replace("_", " ")}
                                </p>
                                {foto.descripcion && (
                                    <p className="text-[9px] text-white/60 line-clamp-1 mt-0.5">{foto.descripcion}</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* ═══ LIGHTBOX ═══ */}
            {showLightbox && filteredFotos.length > 0 && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" onClick={closeLightbox}>
                    {/* Top bar: photo info + filters + close */}
                    <div className="w-full shrink-0 flex items-center justify-between px-4 py-2 bg-black/50" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 min-w-0">
                            <p className="text-white/70 text-sm shrink-0">
                                {TIPO_LABELS[filteredFotos[lightboxIndex].tipo] || filteredFotos[lightboxIndex].tipo}
                                <span className="text-white/40 ml-2">{lightboxIndex + 1} / {filteredFotos.length}</span>
                            </p>
                            {filteredFotos[lightboxIndex].descripcion && (
                                <p className="text-white/40 text-xs truncate hidden sm:block">{filteredFotos[lightboxIndex].descripcion}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {FILTER_PRESETS.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setActiveFilter(prev => prev === f.id ? null : f.id)}
                                    title={f.desc}
                                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${activeFilter === f.id
                                        ? "bg-blue-500 text-white"
                                        : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80"
                                        }`}
                                >
                                    <span className="text-[10px]">{f.icon}</span>
                                    <span className="hidden md:inline">{f.label}</span>
                                </button>
                            ))}
                            <div className="w-px h-5 bg-white/20 mx-1" />
                            <button
                                onClick={() => downloadSingle(filteredFotos[lightboxIndex])}
                                title="Descargar esta foto"
                                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-md transition-all"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button onClick={closeLightbox} className="p-2 text-white/60 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Image — zoomable + pannable */}
                    <div
                        className="flex-1 min-h-0 w-full flex items-center justify-center px-4 overflow-hidden select-none"
                        onClick={e => e.stopPropagation()}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onDoubleClick={handleDoubleClick}
                        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
                    >
                        <img
                            src={filteredFotos[lightboxIndex].url}
                            alt={filteredFotos[lightboxIndex].tipo}
                            className="max-w-full max-h-[calc(100vh-140px)] object-contain rounded-lg transition-all duration-150"
                            style={{
                                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                filter: activeFilter ? FILTER_PRESETS.find(f => f.id === activeFilter)?.css : "none",
                            }}
                            draggable={false}
                        />
                    </div>

                    {/* Bottom bar: nav + thumbnails */}
                    <div className="w-full shrink-0 flex flex-col items-center gap-2 py-2 bg-black/50" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => changePhoto(Math.max(0, lightboxIndex - 1))}
                                disabled={lightboxIndex === 0}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {zoom > 1 && (
                                <button onClick={resetZoom} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all">
                                    {Math.round(zoom * 100)}% — Reset
                                </button>
                            )}
                            <button
                                onClick={() => changePhoto(Math.min(filteredFotos.length - 1, lightboxIndex + 1))}
                                disabled={lightboxIndex === filteredFotos.length - 1}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 max-w-full">
                            {filteredFotos.map((f, i) => (
                                <button
                                    key={f.id}
                                    onClick={() => changePhoto(i)}
                                    className={`w-10 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all ${i === lightboxIndex ? "border-blue-500 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                                        }`}
                                >
                                    <img src={f.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
