"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SelectorZonaDanio, ZONAS_MAP } from "@/components/inspeccion-remota/SelectorZonaDanio";
import {
    Camera, CheckCircle2, ChevronRight, ChevronLeft,
    Car, Loader2, Image as ImageIcon,
    Mic, Square, Play, Pause, Trash2, ChevronDown, ChevronUp,
    Plus, X, PenTool, PartyPopper, MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { guardarInspeccionCampo } from "@/app/(dashboard)/inspeccion-campo/[casoId]/actions";
import { formatCurrency } from "@/lib/utils/formatters";

// ═══ REUSE: Photo processing pipeline from WizardCaptura ═══
async function convertirSiEsHeic(file: Blob): Promise<Blob> {
    const esHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        (file instanceof File && /\.(heic|heif)$/i.test((file as File).name)) ||
        file.type === "";
    if (!esHeic) return file;
    try {
        const heic2any = (await import("heic2any")).default;
        const jpegBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
        return Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
    } catch {
        return file;
    }
}

async function compressImage(file: Blob, maxWidth = 1920, quality = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", quality);
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
}

async function procesarImagen(file: Blob): Promise<Blob> {
    return Promise.race([
        (async () => { const c = await convertirSiEsHeic(file); return compressImage(c); })(),
        new Promise<Blob>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000)),
    ]);
}

// ═══ Types ═══
interface FotoCapturada {
    id: string;
    tipo: string;
    preview: string;
    url: string;
    uploading: boolean;
    uploaded: boolean;
    error?: string;
}

interface ManoObraRow {
    id: string;
    concepto: string;
    valor: number;
    cantidad: number;
    unidad: string;
    custom: boolean;
}

type WizardStep = "fotos_reg" | "zona_danio" | "fotos_danios" | "informe" | "resumen" | "firma" | "completado";

const PASOS_REGLAMENTARIOS = [
    { id: "lateral_izq", label: "Lateral Izquierdo", icon: "🚗" },
    { id: "lateral_der", label: "Lateral Derecho", icon: "🚗" },
    { id: "trasera", label: "Parte Trasera", icon: "🚙" },
    { id: "frente", label: "Parte Delantera", icon: "🚘" },
    { id: "kilometraje", label: "Kilometraje", icon: "⏱️" },
    { id: "documentacion", label: "Número de Chasis (VIN)", icon: "🔢" },
];

// ═══ Main Component ═══
interface Props {
    casoId: string;
    siniestro: string;
    vehiculo: string;
    dominio: string;
    tipoInspeccion: string;
    asegurado: string;
    direccion: string;
    localidad: string;
    fotosYaSubidas: number;
    valoresRef: Record<string, number>;
    peritoId: string;
}

export function InspeccionCampoWizard({
    casoId, siniestro, vehiculo, dominio, tipoInspeccion,
    asegurado, direccion, localidad, fotosYaSubidas, valoresRef, peritoId
}: Props) {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState<WizardStep>("fotos_reg");

    // ═══ Photos state ═══
    const [pasoReg, setPasoReg] = useState(0);
    const [fotosReg, setFotosReg] = useState<FotoCapturada[]>([]);
    const [fotosDanios, setFotosDanios] = useState<FotoCapturada[]>([]);
    const [zonasDanio, setZonasDanio] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const damageFileRef = useRef<HTMLInputElement>(null);

    // ═══ Informe state ═══
    const [manoObra, setManoObra] = useState<ManoObraRow[]>([
        { id: "chapa", concepto: "Chapa", valor: valoresRef.dia_chapa || 0, cantidad: 0, unidad: "días", custom: false },
        { id: "pintura", concepto: "Pintura", valor: valoresRef.pano_pintura || 0, cantidad: 0, unidad: "paños", custom: false },
        { id: "mecanica", concepto: "Mecánica", valor: valoresRef.hora_mecanica || 0, cantidad: 0, unidad: "horas", custom: false },
    ]);
    const [piezasCambiar, setPiezasCambiar] = useState("");
    const [piezasReparar, setPiezasReparar] = useState("");
    const [piezasPintar, setPiezasPintar] = useState("");
    const [observaciones, setObservaciones] = useState("");

    // ═══ Audio state ═══
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioLocalUrl, setAudioLocalUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // ═══ Sections collapse (informe) ═══
    const [seccionesOpen, setSeccionesOpen] = useState({ mo: true, piezas: true, obs: true });

    // ═══ Firma state ═══
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [firmaDibujada, setFirmaDibujada] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [saving, setSaving] = useState(false);
    const resumenRef = useRef<HTMLDivElement>(null);

    // ═══ Computed ═══
    const totalMO = manoObra.reduce((s, r) => s + r.valor * r.cantidad, 0);
    const hayDatos = totalMO > 0 || piezasCambiar.trim() || piezasReparar.trim() || piezasPintar.trim() || observaciones.trim();

    // ═══ Photo upload ═══
    const uploadPhoto = useCallback(async (file: Blob, tipo: string, setter: React.Dispatch<React.SetStateAction<FotoCapturada[]>>) => {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const preview = URL.createObjectURL(file);
        const foto: FotoCapturada = { id, tipo, preview, url: "", uploading: true, uploaded: false };
        setter(prev => [...prev, foto]);

        try {
            const processed = await procesarImagen(file);
            const fileName = `${casoId}/${Date.now()}_${tipo}.jpg`;
            const { data, error } = await supabase.storage
                .from("fotos-inspecciones")
                .upload(fileName, processed, { cacheControl: "3600", upsert: false });

            if (error) throw error;

            const { data: pub } = supabase.storage.from("fotos-inspecciones").getPublicUrl(fileName);
            const url = pub.publicUrl;

            // Save to fotos_inspeccion table
            await supabase.from("fotos_inspeccion").insert({
                caso_id: casoId, usuario_id: peritoId, url, tipo, descripcion: tipo,
            });

            setter(prev => prev.map(f => f.id === id ? { ...f, url, uploading: false, uploaded: true } : f));
        } catch (err: any) {
            setter(prev => prev.map(f => f.id === id ? { ...f, uploading: false, error: err.message } : f));
        }
    }, [casoId, peritoId, supabase]);

    const handleReglamentariaCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const tipo = PASOS_REGLAMENTARIOS[pasoReg].id;
            uploadPhoto(file, tipo, setFotosReg);
            if (pasoReg < PASOS_REGLAMENTARIOS.length - 1) {
                setPasoReg(prev => prev + 1);
            }
        }
        e.target.value = "";
    };

    const handleDamageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                uploadPhoto(file, "danio_detalle", setFotosDanios);
            });
        }
        e.target.value = "";
    };

    // ═══ Audio ═══
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
            let mimeType = "";
            for (const mt of mimeTypes) { if (MediaRecorder.isTypeSupported(mt)) { mimeType = mt; break; } }
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
                setAudioLocalUrl(URL.createObjectURL(blob));
                setIsRecording(false);
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                // Upload
                (async () => {
                    const ext = (recorder.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
                    const fileName = `${casoId}/audio_inspeccion_${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("fotos-inspecciones").upload(fileName, blob);
                    if (!error) {
                        const { data: pub } = supabase.storage.from("fotos-inspecciones").getPublicUrl(fileName);
                        setAudioUrl(pub.publicUrl);
                    }
                })();
            };
            mediaRecorderRef.current = recorder;
            recorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => { if (prev >= 119) { mediaRecorderRef.current?.stop(); return 120; } return prev + 1; });
            }, 1000);
        } catch { toast.error("No se pudo acceder al micrófono"); }
    }, [casoId, supabase]);

    const stopRecording = useCallback(() => { mediaRecorderRef.current?.stop(); }, []);

    const deleteAudio = () => {
        setAudioLocalUrl(null);
        setAudioUrl(null);
        setAudioPlaying(false);
    };

    // ═══ Mano de Obra helpers ═══
    const addCustomRow = () => {
        setManoObra(prev => [...prev, {
            id: `custom_${Date.now()}`, concepto: "", valor: 0, cantidad: 0, unidad: "unidades", custom: true,
        }]);
    };

    const updateMORow = (id: string, field: string, value: any) => {
        setManoObra(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const removeMORow = (id: string) => {
        setManoObra(prev => prev.filter(r => r.id !== id));
    };

    // ═══ Firma Canvas ═══
    useEffect(() => {
        if (step !== "firma") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, [step]);

    const getPos = (e: React.TouchEvent | React.MouseEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ("touches" in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        setFirmaDibujada(true);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const endDraw = () => { setIsDrawing(false); };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setFirmaDibujada(false);
    };

    // ═══ Final submit ═══
    const handleConfirm = async () => {
        setSaving(true);
        try {
            // 1. GPS
            let lat: number | null = null;
            let lng: number | null = null;
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                );
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch { /* GPS not available */ }

            const ts = new Date().toISOString();

            // 2. Capture signature canvas as PNG
            let firmaStorageUrl: string | null = null;
            const canvas = canvasRef.current;
            if (canvas) {
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
                if (blob) {
                    const fileName = `${casoId}/firma_taller_${Date.now()}.png`;
                    const { error } = await supabase.storage.from("caso-archivos").upload(fileName, blob);
                    if (!error) {
                        const { data: pub } = supabase.storage.from("caso-archivos").getPublicUrl(fileName);
                        firmaStorageUrl = pub.publicUrl;
                    }
                }
            }

            // 3. Capture resumen as image using html2canvas
            let resumenStorageUrl: string | null = null;
            try {
                const html2canvas = (await import("html2canvas")).default;
                const el = resumenRef.current;
                if (el) {
                    const canvasImg = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#1a1a1a" });
                    const blob = await new Promise<Blob | null>(resolve => canvasImg.toBlob(resolve, "image/png"));
                    if (blob) {
                        const fileName = `${casoId}/resumen_firmado_${Date.now()}.png`;
                        const { error } = await supabase.storage.from("caso-archivos").upload(fileName, blob);
                        if (!error) {
                            const { data: pub } = supabase.storage.from("caso-archivos").getPublicUrl(fileName);
                            resumenStorageUrl = pub.publicUrl;
                        }
                    }
                }
            } catch (err) {
                console.error("html2canvas error:", err);
            }

            // 4. Save to DB via server action
            const result = await guardarInspeccionCampo({
                casoId,
                peritoId,
                manoDeObra: manoObra.filter(r => r.cantidad > 0 || r.custom).map(r => ({
                    concepto: r.concepto, valor: r.valor, cantidad: r.cantidad, unidad: r.unidad,
                })),
                totalManoDeObra: totalMO,
                piezasCambiar,
                piezasReparar,
                piezasPintar,
                observaciones,
                audioUrl,
                resumenFirmadoUrl: resumenStorageUrl,
                firmaUrl: firmaStorageUrl,
                firmaTimestamp: ts,
                firmaLatitud: lat,
                firmaLongitud: lng,
            });

            if (result.error) {
                toast.error(result.error);
                setSaving(false);
                return;
            }

            setStep("completado");
        } catch (err: any) {
            toast.error("Error al guardar: " + err.message);
            setSaving(false);
        }
    };

    // ═══ Prevent back navigation in firma ═══
    useEffect(() => {
        if (step !== "firma") return;
        const handlePop = (e: PopStateEvent) => {
            e.preventDefault();
            history.pushState(null, "", location.href);
        };
        history.pushState(null, "", location.href);
        window.addEventListener("popstate", handlePop);
        return () => window.removeEventListener("popstate", handlePop);
    }, [step]);

    // ═══ Parse piezas text to list ═══
    const parsePiezas = (text: string) =>
        text.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map(s =>
            s.charAt(0).toUpperCase() + s.slice(1)
        );

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    // ─── COMPLETADO ───
    if (step === "completado") {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center space-y-6 max-w-md">
                    <div className="h-20 w-20 rounded-full bg-color-success/20 flex items-center justify-center mx-auto">
                        <PartyPopper className="w-10 h-10 text-color-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">¡Inspección completada!</h1>
                    <p className="text-text-muted">
                        El caso <span className="font-bold text-text-primary">{siniestro}</span> fue pasado a <span className="text-brand-primary font-semibold">Pendiente de Carga</span>.
                    </p>
                    <button
                        onClick={() => router.push("/mi-agenda")}
                        className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-primary-hover transition-colors"
                    >
                        Volver a Mi Agenda
                    </button>
                </div>
            </div>
        );
    }

    // ─── FIRMA (KIOSK MODE) ───
    if (step === "firma") {
        return (
            <div className="fixed inset-0 z-[9999] bg-bg-primary overflow-y-auto">
                {/* Discreet cancel */}
                <button
                    onClick={() => {
                        if (confirm("¿Cancelar la firma? No se perderán los datos.")) setStep("resumen");
                    }}
                    className="fixed top-3 right-3 z-[10000] p-2 text-text-muted/30 hover:text-text-muted transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div ref={resumenRef} className="max-w-lg mx-auto p-6 space-y-6">
                    {/* Resumen content (captured by html2canvas) */}
                    <div className="text-center space-y-1">
                        <h1 className="text-lg font-bold text-text-primary uppercase tracking-wide">Resumen de Inspección</h1>
                        <p className="text-sm text-text-muted">{siniestro} · {dominio} · {vehiculo}</p>
                        <p className="text-xs text-text-muted">{new Date().toLocaleDateString("es-AR")} — {new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>

                    <hr className="border-border" />

                    {/* MO */}
                    {totalMO > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Mano de Obra</h3>
                            {manoObra.filter(r => r.cantidad > 0).map(r => (
                                <div key={r.id} className="flex justify-between text-sm">
                                    <span className="text-text-secondary">{r.concepto} ({r.cantidad} {r.unidad})</span>
                                    <span className="text-text-primary font-mono">{formatCurrency(r.valor * r.cantidad)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold text-sm border-t border-border pt-2">
                                <span className="text-text-primary">Total Mano de Obra</span>
                                <span className="text-brand-secondary font-mono">{formatCurrency(totalMO)}</span>
                            </div>
                        </div>
                    )}

                    {/* Piezas */}
                    {(piezasCambiar.trim() || piezasReparar.trim() || piezasPintar.trim()) && (
                        <div className="space-y-3">
                            {piezasCambiar.trim() && (
                                <div>
                                    <h4 className="text-xs font-bold text-danger uppercase mb-1">Piezas por Cambiar</h4>
                                    <ul className="text-sm text-text-secondary space-y-0.5">
                                        {parsePiezas(piezasCambiar).map((p, i) => <li key={i}>• {p}</li>)}
                                    </ul>
                                </div>
                            )}
                            {piezasReparar.trim() && (
                                <div>
                                    <h4 className="text-xs font-bold text-color-warning uppercase mb-1">Piezas por Reparar</h4>
                                    <ul className="text-sm text-text-secondary space-y-0.5">
                                        {parsePiezas(piezasReparar).map((p, i) => <li key={i}>• {p}</li>)}
                                    </ul>
                                </div>
                            )}
                            {piezasPintar.trim() && (
                                <div>
                                    <h4 className="text-xs font-bold text-color-info uppercase mb-1">Piezas por Pintar</h4>
                                    <ul className="text-sm text-text-secondary space-y-0.5">
                                        {parsePiezas(piezasPintar).map((p, i) => <li key={i}>• {p}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Observaciones */}
                    {observaciones.trim() && (
                        <div>
                            <h4 className="text-xs font-bold text-text-muted uppercase mb-1">Observaciones</h4>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">{observaciones}</p>
                        </div>
                    )}

                    <hr className="border-border" />

                    {/* Consent text */}
                    <p className="text-xs text-text-muted leading-relaxed text-center">
                        El representante del taller declara haber tomado conocimiento del detalle de trabajos y valores precedentes, acordados con el perito inspector en la fecha y lugar indicados.
                    </p>

                    {/* Signature canvas */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-text-muted font-semibold uppercase">Firma del Taller</span>
                            {firmaDibujada && (
                                <button onClick={clearSignature} className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Limpiar
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-[200px] bg-white rounded-xl border-2 border-dashed border-border cursor-crosshair touch-none"
                                onMouseDown={startDraw}
                                onMouseMove={draw}
                                onMouseUp={endDraw}
                                onMouseLeave={endDraw}
                                onTouchStart={startDraw}
                                onTouchMove={draw}
                                onTouchEnd={endDraw}
                            />
                            {!firmaDibujada && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <PenTool className="w-4 h-4" /> Firmar aquí
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Confirm button outside resumenRef so it's not captured */}
                <div className="max-w-lg mx-auto px-6 pb-8">
                    <button
                        onClick={handleConfirm}
                        disabled={!firmaDibujada || saving}
                        className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                        ) : (
                            <><CheckCircle2 className="w-5 h-5" /> Confirmar y Enviar</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ─── RESUMEN ───
    if (step === "resumen") {
        return (
            <div className="max-w-lg mx-auto p-4 space-y-6">
                <h1 className="text-xl font-bold text-text-primary text-center">Resumen de Inspección</h1>
                <div className="bg-bg-secondary rounded-xl border border-border p-5 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-text-muted">Siniestro</span><span className="text-text-primary font-mono font-bold">{siniestro}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-muted">Vehículo</span><span className="text-text-primary">{vehiculo}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-muted">Dominio</span><span className="text-text-primary font-mono">{dominio}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-muted">Fecha</span><span className="text-text-primary">{new Date().toLocaleDateString("es-AR")}</span></div>
                </div>

                {/* MO */}
                {totalMO > 0 && (
                    <div className="bg-bg-secondary rounded-xl border border-border p-5 space-y-3">
                        <h3 className="font-semibold text-text-primary text-sm">Mano de Obra</h3>
                        {manoObra.filter(r => r.cantidad > 0).map(r => (
                            <div key={r.id} className="flex justify-between text-sm">
                                <span className="text-text-secondary">{r.concepto} — {formatCurrency(r.valor)} × {r.cantidad} {r.unidad}</span>
                                <span className="text-text-primary font-mono font-medium">{formatCurrency(r.valor * r.cantidad)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-bold border-t border-border pt-2">
                            <span>Total MO</span>
                            <span className="text-brand-secondary font-mono">{formatCurrency(totalMO)}</span>
                        </div>
                    </div>
                )}

                {/* Piezas */}
                {(piezasCambiar.trim() || piezasReparar.trim() || piezasPintar.trim()) && (
                    <div className="bg-bg-secondary rounded-xl border border-border p-5 space-y-4">
                        <h3 className="font-semibold text-text-primary text-sm">Piezas</h3>
                        {piezasCambiar.trim() && <div><h4 className="text-xs font-bold text-danger mb-1">Por Cambiar</h4><ul className="text-sm text-text-secondary">{parsePiezas(piezasCambiar).map((p, i) => <li key={i}>• {p}</li>)}</ul></div>}
                        {piezasReparar.trim() && <div><h4 className="text-xs font-bold text-color-warning mb-1">Por Reparar</h4><ul className="text-sm text-text-secondary">{parsePiezas(piezasReparar).map((p, i) => <li key={i}>• {p}</li>)}</ul></div>}
                        {piezasPintar.trim() && <div><h4 className="text-xs font-bold text-color-info mb-1">Por Pintar</h4><ul className="text-sm text-text-secondary">{parsePiezas(piezasPintar).map((p, i) => <li key={i}>• {p}</li>)}</ul></div>}
                    </div>
                )}

                {/* Observaciones */}
                {observaciones.trim() && (
                    <div className="bg-bg-secondary rounded-xl border border-border p-5">
                        <h3 className="font-semibold text-text-primary text-sm mb-2">Observaciones</h3>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{observaciones}</p>
                    </div>
                )}

                {/* Fotos count */}
                <div className="bg-bg-secondary rounded-xl border border-border p-5 flex items-center gap-3">
                    <Camera className="w-5 h-5 text-brand-primary" />
                    <span className="text-sm text-text-primary">{fotosReg.length + fotosDanios.length} fotos capturadas en esta inspección</span>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setStep("informe")} className="flex-1 py-3 border border-border rounded-xl text-text-muted font-medium hover:bg-bg-tertiary transition-colors">
                        Volver a editar
                    </button>
                    <button onClick={() => setStep("firma")} className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary-hover transition-colors">
                        Pasar al taller para firma
                    </button>
                </div>
            </div>
        );
    }

    // ─── INFORME ───
    if (step === "informe") {
        const progress = [
            manoObra.some(r => r.cantidad > 0),
            piezasCambiar.trim() || piezasReparar.trim() || piezasPintar.trim(),
            observaciones.trim(),
        ].filter(Boolean).length;

        return (
            <div className="max-w-lg mx-auto p-4 space-y-5">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-text-primary">Informe Técnico</h1>
                    <p className="text-xs text-text-muted mt-1">{siniestro} · {dominio}</p>
                </div>

                {/* Progress bar */}
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < progress ? "bg-brand-primary" : "bg-border"}`} />
                    ))}
                </div>

                {/* ── Sección 1: Mano de Obra ── */}
                <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setSeccionesOpen(p => ({ ...p, mo: !p.mo }))} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                        <span className="font-semibold text-text-primary text-sm">🔧 Mano de Obra</span>
                        <div className="flex items-center gap-2">
                            {totalMO > 0 && <span className="text-xs font-mono text-brand-secondary">{formatCurrency(totalMO)}</span>}
                            {seccionesOpen.mo ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </div>
                    </button>
                    {seccionesOpen.mo && (
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                            {manoObra.map(r => (
                                <div key={r.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        {r.custom ? (
                                            <input
                                                value={r.concepto}
                                                onChange={e => updateMORow(r.id, "concepto", e.target.value)}
                                                placeholder="Concepto..."
                                                className="text-sm font-medium text-text-primary bg-transparent border-b border-border focus:border-brand-primary focus:outline-none pb-0.5 w-32"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-text-primary">{r.concepto}</span>
                                        )}
                                        {r.custom && (
                                            <button onClick={() => removeMORow(r.id)} className="text-text-muted hover:text-danger">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] text-text-muted uppercase">Valor</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={r.valor || ""}
                                                onChange={e => updateMORow(r.id, "valor", parseFloat(e.target.value) || 0)}
                                                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:border-brand-primary focus:outline-none"
                                                placeholder="$0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-text-muted uppercase">Cantidad</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={r.cantidad || ""}
                                                onChange={e => updateMORow(r.id, "cantidad", parseFloat(e.target.value) || 0)}
                                                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:border-brand-primary focus:outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-text-muted uppercase">Total</label>
                                            <div className="w-full bg-bg-tertiary/50 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-text-muted font-mono">
                                                {formatCurrency(r.valor * r.cantidad)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addCustomRow}
                                className="w-full py-2.5 border border-dashed border-border rounded-lg text-xs text-text-muted hover:text-text-primary hover:border-brand-primary/50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-3 h-3" /> Agregar concepto
                            </button>
                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="font-bold text-sm text-text-primary">Total Mano de Obra</span>
                                <span className="font-bold text-lg font-mono text-brand-secondary">{formatCurrency(totalMO)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Sección 2: Piezas ── */}
                <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setSeccionesOpen(p => ({ ...p, piezas: !p.piezas }))} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                        <span className="font-semibold text-text-primary text-sm">🔩 Piezas y Reparaciones</span>
                        {seccionesOpen.piezas ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                    {seccionesOpen.piezas && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                            <div>
                                <label className="text-xs font-bold text-danger uppercase flex items-center gap-1.5 mb-1.5">🔴 Por Cambiar</label>
                                <textarea
                                    value={piezasCambiar}
                                    onChange={e => setPiezasCambiar(e.target.value)}
                                    placeholder="Listá las piezas que se deben cambiar..."
                                    rows={3}
                                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-danger/50 focus:outline-none"
                                />
                                <p className="text-[10px] text-text-muted mt-0.5">Separá las piezas con comas o saltos de línea</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-color-warning uppercase flex items-center gap-1.5 mb-1.5">🟡 Por Reparar</label>
                                <textarea
                                    value={piezasReparar}
                                    onChange={e => setPiezasReparar(e.target.value)}
                                    placeholder="Listá las piezas que se deben reparar..."
                                    rows={3}
                                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-color-warning/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-color-info uppercase flex items-center gap-1.5 mb-1.5">🔵 Por Pintar</label>
                                <textarea
                                    value={piezasPintar}
                                    onChange={e => setPiezasPintar(e.target.value)}
                                    placeholder="Listá las piezas que se deben pintar..."
                                    rows={3}
                                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:border-color-info/50 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Sección 3: Observaciones ── */}
                <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setSeccionesOpen(p => ({ ...p, obs: !p.obs }))} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                        <span className="font-semibold text-text-primary text-sm">📝 Observaciones</span>
                        {seccionesOpen.obs ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                    {seccionesOpen.obs && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                            <textarea
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                placeholder="Observaciones adicionales para el perito de carga..."
                                rows={4}
                                maxLength={3000}
                                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-y focus:border-brand-primary/50 focus:outline-none"
                            />

                            {/* Audio recorder */}
                            <div className="space-y-2">
                                {!audioLocalUrl && !isRecording && (
                                    <button
                                        onClick={startRecording}
                                        className="w-full py-3 border border-border rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Mic className="w-4 h-4" /> Grabar audio
                                    </button>
                                )}
                                {isRecording && (
                                    <div className="flex items-center gap-3 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                                        <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
                                        <span className="text-sm text-danger font-mono flex-1">
                                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")} / 2:00
                                        </span>
                                        <button onClick={stopRecording} className="p-2 bg-danger text-white rounded-lg hover:bg-danger/80">
                                            <Square className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {audioLocalUrl && (
                                    <div className="flex items-center gap-3 bg-bg-tertiary border border-border rounded-xl px-4 py-3">
                                        <button
                                            onClick={() => {
                                                if (!audioPlayerRef.current) {
                                                    audioPlayerRef.current = new Audio(audioLocalUrl);
                                                    audioPlayerRef.current.onended = () => setAudioPlaying(false);
                                                }
                                                if (audioPlaying) { audioPlayerRef.current.pause(); setAudioPlaying(false); }
                                                else { audioPlayerRef.current.play(); setAudioPlaying(true); }
                                            }}
                                            className="p-2 bg-brand-primary text-white rounded-lg"
                                        >
                                            {audioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                        <span className="text-xs text-text-muted flex-1">Audio grabado ({recordingTime}s)</span>
                                        <button onClick={deleteAudio} className="text-text-muted hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setStep("resumen")}
                    disabled={!hayDatos}
                    className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                    Continuar al Resumen <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // ─── FOTOS DAÑOS ───
    if (step === "fotos_danios") {
        return (
            <div className="max-w-lg mx-auto p-4 space-y-6">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-text-primary">Fotos de Daños</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Capturá al menos 2 fotos por cada zona seleccionada
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                        {zonasDanio.map(id => (
                            <span key={id} className="text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-1 rounded-full">
                                {ZONAS_MAP[id]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Photo grid */}
                <div className="grid grid-cols-3 gap-2">
                    {fotosDanios.map(f => (
                        <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
                            <img src={f.preview} alt="" className="w-full h-full object-cover" />
                            {f.uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                </div>
                            )}
                            {f.uploaded && (
                                <div className="absolute top-1 right-1">
                                    <CheckCircle2 className="w-4 h-4 text-color-success" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <input ref={damageFileRef} type="file" accept="image/*,.heic,.heif" capture="environment" multiple className="hidden" onChange={handleDamageCapture} />

                <button
                    onClick={() => damageFileRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-brand-primary/30 rounded-xl text-brand-primary font-semibold hover:bg-brand-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                    <Camera className="w-5 h-5" /> Tomar más fotos de daños
                </button>

                <button
                    onClick={() => setStep("informe")}
                    disabled={fotosDanios.length < zonasDanio.length * 2}
                    className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg disabled:opacity-40 hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                    Continuar al Informe <ChevronRight className="w-5 h-5" />
                </button>

                <p className="text-[10px] text-text-muted text-center">
                    Mínimo {zonasDanio.length * 2} fotos ({fotosDanios.length} tomadas)
                </p>
            </div>
        );
    }

    // ─── ZONA DAÑO ───
    if (step === "zona_danio") {
        return (
            <div className="max-w-lg mx-auto p-4 space-y-6">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-text-primary">Zonas de Daño</h1>
                    <p className="text-sm text-text-muted mt-1">Seleccioná las zonas dañadas del vehículo</p>
                </div>

                {/* Reuse component with amber override via wrapper */}
                <div className="[&_button]:!border-border [&_.bg-\\[\\#D6006E\\]\\/20]:!bg-brand-primary/20 [&_.border-\\[\\#D6006E\\]]:!border-brand-primary [&_.text-\\[\\#D6006E\\]]:!text-brand-primary [&_.bg-\\[\\#D6006E\\]\\/15]:!bg-brand-primary/15 [&_.border-\\[\\#D6006E\\]\\/30]:!border-brand-primary/30">
                    <SelectorZonaDanio zonasSeleccionadas={zonasDanio} onZonasChange={setZonasDanio} />
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setStep("fotos_reg")} className="flex-1 py-3 border border-border rounded-xl text-text-muted font-medium hover:bg-bg-tertiary">
                        <ChevronLeft className="w-4 h-4 inline mr-1" /> Volver
                    </button>
                    <button
                        onClick={() => setStep(zonasDanio.length > 0 ? "fotos_danios" : "informe")}
                        className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary-hover transition-colors"
                    >
                        {zonasDanio.length > 0 ? "Fotos de daños" : "Saltar → Informe"} <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                </div>
            </div>
        );
    }

    // ─── FOTOS REGLAMENTARIAS ───
    return (
        <div className="max-w-lg mx-auto p-4 space-y-6">
            <div className="text-center">
                <h1 className="text-xl font-bold text-text-primary">Inspección Presencial</h1>
                <p className="text-sm text-text-muted mt-1">{siniestro} · {dominio} · {vehiculo}</p>
            </div>

            {/* Progress */}
            <div className="flex gap-1">
                {PASOS_REGLAMENTARIOS.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < pasoReg ? "bg-color-success" : i === pasoReg ? "bg-brand-primary" : "bg-border"}`} />
                ))}
            </div>

            {/* Current step */}
            <div className="bg-bg-secondary rounded-xl border border-border p-6 text-center space-y-4">
                <span className="text-4xl">{PASOS_REGLAMENTARIOS[pasoReg].icon}</span>
                <h2 className="text-lg font-bold text-text-primary">{PASOS_REGLAMENTARIOS[pasoReg].label}</h2>
                <p className="text-sm text-text-muted">Foto {pasoReg + 1} de {PASOS_REGLAMENTARIOS.length}</p>

                <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" capture="environment" className="hidden" onChange={handleReglamentariaCapture} />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                    <Camera className="w-6 h-6" /> Tomar Foto
                </button>
            </div>

            {/* Thumbnails */}
            {fotosReg.length > 0 && (
                <div className="grid grid-cols-6 gap-2">
                    {fotosReg.map(f => (
                        <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
                            <img src={f.preview} alt="" className="w-full h-full object-cover" />
                            {f.uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                            )}
                            {f.uploaded && (
                                <div className="absolute top-0.5 right-0.5"><CheckCircle2 className="w-3 h-3 text-color-success" /></div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
                {pasoReg > 0 && (
                    <button onClick={() => setPasoReg(p => p - 1)} className="flex-1 py-3 border border-border rounded-xl text-text-muted font-medium hover:bg-bg-tertiary">
                        <ChevronLeft className="w-4 h-4 inline mr-1" /> Anterior
                    </button>
                )}
                {pasoReg < PASOS_REGLAMENTARIOS.length - 1 ? (
                    <button onClick={() => setPasoReg(p => p + 1)} className="flex-1 py-3 border border-border rounded-xl text-text-muted font-medium hover:bg-bg-tertiary">
                        Saltar <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                ) : (
                    <button
                        onClick={() => setStep("zona_danio")}
                        className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary-hover transition-colors"
                    >
                        Zonas de daño <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                )}
            </div>
        </div>
    );
}
