"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CameraCapture } from "./CameraCapture";
import { SelectorZonaDanio, ZONAS_MAP } from "./SelectorZonaDanio";
import {
    Camera, CheckCircle2, ChevronRight, ChevronLeft,
    Car, Loader2, PartyPopper, AlertCircle, Image as ImageIcon,
    ShieldCheck, FileText, RectangleHorizontal, RefreshCw,
    Mic, Square, Play, Pause, Trash2, ChevronDown, ChevronUp
} from "lucide-react";

// ═══ Step definitions ═══
const PASOS_REGLAMENTARIOS = [
    { id: "lateral_izq", label: "Lateral Izquierdo", desc: "Fotografía completa del lado izquierdo del vehículo", icon: "🚗" },
    { id: "lateral_der", label: "Lateral Derecho", desc: "Fotografía completa del lado derecho del vehículo", icon: "🚗" },
    { id: "trasera", label: "Parte Trasera", desc: "Vista trasera completa del vehículo", icon: "🚙" },
    { id: "frente", label: "Parte Delantera", desc: "Vista frontal completa del vehículo", icon: "🚘" },
    { id: "kilometraje", label: "Kilometraje", desc: "Tablero con la unidad en marcha (si es posible)", icon: "⏱️" },
    { id: "documentacion", label: "Número de Chasis (VIN)", desc: "Número de chasis visible en la carrocería o puerta", icon: "🔢" },
];

type WizardStep = "bienvenida" | "reglamentarias" | "zona_danio" | "danios" | "resumen" | "completado";

interface FotoCapturada {
    id: string;          // unique identifier
    tipo: string;
    preview: string;     // ObjectURL for thumbnail (revoked after upload)
    url: string;         // Storage URL after upload
    descripcion?: string;
    uploading: boolean;
    uploaded: boolean;
    error?: string;
}

interface Props {
    token: string;
    siniestro: string;
    vehiculo: string;
    dominio: string;
    tipoInspeccion: string;
    fotosYaSubidas: number;
    maxFotos: number;
}

// ═══ HEIC → JPEG conversion (dynamic import, only loads when needed ~400KB) ═══
async function convertirSiEsHeic(file: Blob): Promise<Blob> {
    const esHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        (file instanceof File && /\.(heic|heif)$/i.test((file as File).name)) ||
        file.type === ''; // iOS sometimes doesn't set MIME type for HEIC from gallery

    if (!esHeic) return file;

    try {
        const heic2any = (await import('heic2any')).default;
        const jpegBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.85,
        });
        return Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
    } catch (error) {
        console.error('HEIC conversion failed (may not be HEIC):', error);
        return file; // Return original — browser may still handle it
    }
}

// Wrapper with timeout for conversion + compression pipeline
async function procesarImagen(file: Blob, timeoutMs = 30000): Promise<Blob> {
    return Promise.race([
        (async () => {
            const converted = await convertirSiEsHeic(file);
            return compressImage(converted);
        })(),
        new Promise<Blob>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout procesando imagen (30s)')), timeoutMs)
        ),
    ]);
}

// ═══ Image compression via Canvas API ═══
async function compressImage(file: Blob, maxWidth = 1920, quality = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => resolve(blob || file), // fallback to original if compression fails
                "image/jpeg",
                quality
            );
            URL.revokeObjectURL(img.src); // free the temporary ObjectURL
        };
        img.onerror = () => resolve(file); // fallback
        img.src = URL.createObjectURL(file);
    });
}

export function WizardCaptura({ token, siniestro, vehiculo, dominio, tipoInspeccion, fotosYaSubidas, maxFotos }: Props) {
    const [step, setStep] = useState<WizardStep>("bienvenida");
    const [pasoReglamentario, setPasoReglamentario] = useState(0);
    const [fotosReglamentarias, setFotosReglamentarias] = useState<FotoCapturada[]>([]);
    const [fotosDanios, setFotosDanios] = useState<FotoCapturada[]>([]);
    const [zonasDanio, setZonasDanio] = useState<string[]>([]);
    const [finalizing, setFinalizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturingDamage, setCapturingDamage] = useState(false);

    // ═══ Observations state ═══
    const [observacionesOpen, setObservacionesOpen] = useState(false);
    const [observacionesTexto, setObservacionesTexto] = useState("");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioUploading, setAudioUploading] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioLocalUrl, setAudioLocalUrl] = useState<string | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [mediaRecorderSupported, setMediaRecorderSupported] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Check MediaRecorder support on mount
    useEffect(() => {
        setMediaRecorderSupported(typeof window !== "undefined" && !!window.MediaRecorder);
    }, []);

    // Audio recording functions
    const startRecording = useCallback(async () => {
        setAudioError(null);
        try {
            // Check if getUserMedia is available (requires HTTPS)
            if (!navigator.mediaDevices?.getUserMedia) {
                setAudioError("Tu navegador no soporta grabación de audio. Probá con Safari o Chrome.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
            // Try preferred MIME types — audio/mp4 first for iOS Safari compatibility
            const mimeTypes = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
            let mimeType = '';
            for (const mt of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mt)) { mimeType = mt; break; }
            }
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecondRate: 64000 } as any : undefined);
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/mp4' });
                setAudioBlob(blob);
                const localUrl = URL.createObjectURL(blob);
                setAudioLocalUrl(localUrl);
                setIsRecording(false);
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                // Upload immediately
                uploadAudio(blob);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);
            setAudioBlob(null);
            setAudioLocalUrl(null);
            setAudioUrl(null);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 119) {
                        mediaRecorderRef.current?.stop();
                        return 120;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err: any) {
            const msg = err?.name === 'NotAllowedError'
                ? "Permiso de micrófono denegado. Revisá los permisos del navegador."
                : err?.name === 'NotFoundError'
                ? "No se encontró un micrófono en el dispositivo."
                : `No se pudo acceder al micrófono (${err?.name || 'error desconocido'})`;
            setAudioError(msg);
        }
    }, []);

    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
    }, []);

    const uploadAudio = useCallback(async (blob: Blob) => {
        setAudioUploading(true);
        setAudioError(null);
        try {
            const formData = new FormData();
            formData.append("token", token);
            const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
            formData.append("file", blob, `audio_pericia.${ext}`);
            const res = await fetch("/api/inspeccion-remota/upload-audio", { method: "POST", body: formData });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
            setAudioUrl(body.url);
        } catch (err: any) {
            setAudioError(err.message || "Error subiendo audio");
        }
        setAudioUploading(false);
    }, [token]);

    const deleteAudio = useCallback(() => {
        if (audioLocalUrl) URL.revokeObjectURL(audioLocalUrl);
        setAudioBlob(null);
        setAudioLocalUrl(null);
        setAudioUrl(null);
        setAudioError(null);
        setAudioPlaying(false);
        setRecordingTime(0);
    }, [audioLocalUrl]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // ═══ Semaphore for max 3 concurrent uploads ═══
    const activeUploads = useRef(0);
    const uploadQueue = useRef<(() => void)[]>([]);
    const ordenCounter = useRef(fotosYaSubidas);

    const processQueue = useCallback(() => {
        while (activeUploads.current < 3 && uploadQueue.current.length > 0) {
            const next = uploadQueue.current.shift()!;
            activeUploads.current++;
            next();
        }
    }, []);

    // Upload a single photo with semaphore control
    const uploadFotoInmediata = useCallback(async (
        blob: Blob,
        fotoId: string,
        tipo: string,
        descripcion: string,
        setterFn: React.Dispatch<React.SetStateAction<FotoCapturada[]>>
    ) => {
        const doUpload = async () => {
            try {
                // Convert HEIC if needed + compress (with 30s timeout)
                const compressed = await procesarImagen(blob);
                const orden = ++ordenCounter.current;

                const formData = new FormData();
                formData.append("token", token);
                formData.append("file", compressed, `${tipo}_${Date.now()}.jpg`);
                formData.append("tipo", tipo);
                formData.append("descripcion", descripcion || "");
                formData.append("orden", String(orden));

                const res = await fetch("/api/inspeccion-remota/upload", { method: "POST", body: formData });
                const body = await res.json();

                if (!res.ok) {
                    throw new Error(body?.error || `Error ${res.status}`);
                }

                // Success: store URL, revoke preview blob to free RAM
                setterFn(prev => prev.map(f => {
                    if (f.id !== fotoId) return f;
                    if (f.preview) URL.revokeObjectURL(f.preview);
                    return { ...f, uploading: false, uploaded: true, url: body.url, preview: body.url, error: undefined };
                }));
            } catch (err: any) {
                console.error(`Upload failed for ${fotoId}:`, err);
                setterFn(prev => prev.map(f =>
                    f.id === fotoId ? { ...f, uploading: false, error: err.message || "Error de conexión" } : f
                ));
            } finally {
                activeUploads.current--;
                processQueue();
            }
        };

        // Enqueue
        uploadQueue.current.push(doUpload);
        processQueue();
    }, [token, processQueue]);

    // Retry a failed upload
    const retryUpload = useCallback((foto: FotoCapturada, setterFn: React.Dispatch<React.SetStateAction<FotoCapturada[]>>) => {
        // We can only retry if the preview is still a blob URL (not revoked)
        // For retries, re-fetch the image from its current preview URL
        setterFn(prev => prev.map(f =>
            f.id === foto.id ? { ...f, uploading: true, error: undefined } : f
        ));

        // Fetch the image from preview to get a blob, then re-upload
        fetch(foto.preview)
            .then(r => r.blob())
            .then(blob => uploadFotoInmediata(blob, foto.id, foto.tipo, foto.descripcion || "", setterFn))
            .catch(() => {
                setterFn(prev => prev.map(f =>
                    f.id === foto.id ? { ...f, uploading: false, error: "No se puede reintentar — la foto se perdió" } : f
                ));
            });
    }, [uploadFotoInmediata]);

    // Handle finalize — lightweight, just call /complete
    const handleFinalize = useCallback(async () => {
        const allFotos = [...fotosReglamentarias, ...fotosDanios];
        const pending = allFotos.filter(f => f.uploading);
        const failed = allFotos.filter(f => f.error);

        if (pending.length > 0) {
            setError(`Esperá a que terminen de subir ${pending.length} foto(s)...`);
            return;
        }
        if (failed.length > 0) {
            setError(`Hay ${failed.length} foto(s) con error. Reintentá cada una antes de enviar.`);
            return;
        }

        setFinalizing(true);
        setError(null);

        try {
            const bodyData: Record<string, any> = { token };
            if (observacionesTexto.trim()) {
                bodyData.observaciones_pericia = observacionesTexto;
            }
            if (audioUrl) {
                bodyData.audio_pericia_url = audioUrl;
            }

            const completeRes = await fetch("/api/inspeccion-remota/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
            });
            if (!completeRes.ok) {
                const errorData = await completeRes.json();
                throw new Error(errorData?.error || `Error ${completeRes.status}`);
            }
            setStep("completado");
        } catch (e: any) {
            setError(`Error al completar: ${e.message}`);
        }
        setFinalizing(false);
    }, [fotosReglamentarias, fotosDanios, token, observacionesTexto, audioUrl]);

    // Handle regulatory photo capture — upload immediately
    const handleFotoReglamentaria = (blob: Blob, preview: string) => {
        const paso = PASOS_REGLAMENTARIOS[pasoReglamentario];
        const fotoId = `reg_${paso.id}_${Date.now()}`;

        const newFoto: FotoCapturada = {
            id: fotoId,
            tipo: paso.id,
            preview,
            url: "",
            descripcion: paso.label,
            uploading: true,
            uploaded: false,
        };

        setFotosReglamentarias(prev => [...prev, newFoto]);
        setCameraActive(false);

        // Start uploading immediately
        uploadFotoInmediata(blob, fotoId, paso.id, paso.label, setFotosReglamentarias);

        if (pasoReglamentario < PASOS_REGLAMENTARIOS.length - 1) {
            setPasoReglamentario(prev => prev + 1);
        } else {
            setStep("zona_danio");
        }
    };

    // Handle damage photo capture (multiple) — upload each immediately
    const handleFotoDanioMultiple = (fotos: { blob: Blob, preview: string }[]) => {
        const zonasNombres = zonasDanio.map(id => ZONAS_MAP[id] || id).join(", ");
        const descripcion = `Daños reportados: ${zonasNombres}`;

        const newFotos: FotoCapturada[] = fotos.map((f, i) => ({
            id: `dmg_${Date.now()}_${i}`,
            tipo: "danio_detalle",
            preview: f.preview,
            url: "",
            descripcion,
            uploading: true,
            uploaded: false,
        }));

        setFotosDanios(prev => [...prev, ...newFotos]);
        setCameraActive(false);
        setCapturingDamage(false);

        // Start uploading each one immediately (semaphore handles concurrency)
        fotos.forEach((f, i) => {
            uploadFotoInmediata(f.blob, newFotos[i].id, "danio_detalle", descripcion, setFotosDanios);
        });
    };

    const totalFotos = fotosReglamentarias.length + fotosDanios.length;
    const allUploaded = [...fotosReglamentarias, ...fotosDanios].every(f => f.uploaded);
    const anyUploading = [...fotosReglamentarias, ...fotosDanios].some(f => f.uploading);
    const anyError = [...fotosReglamentarias, ...fotosDanios].some(f => !!f.error);

    // ═══ RENDER ═══
    return (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">

            {/* ─── BIENVENIDA ─── */}
            {step === "bienvenida" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-xl font-bold text-[#F5F0F7] tracking-[0.2em] mb-0.5">
                            CLARITY
                        </h1>
                        <p className="text-xs text-[#9B8FA6] tracking-[0.15em] uppercase">
                            Tecnología de Inspección Inteligente
                        </p>
                    </div>

                    {/* Ícono de Cámara Principal */}
                    <div className="w-20 h-20 bg-gradient-to-br from-[#D6006E]/20 to-transparent rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#D6006E]/10">
                        <Camera className="w-10 h-10 text-[#D6006E]" />
                    </div>

                    <h2 className="text-2xl font-bold text-[#F5F0F7]">
                        Inspección Remota
                    </h2>

                    {/* Logo Sancor Magenta */}
                    <img
                        src="/logo-al-servicio-de-SS.png"
                        alt="Al servicio de Sancor Seguros"
                        className="w-[200px] mt-4 mb-6 opacity-100"
                    />

                    {/* Card de Datos del Siniestro */}
                    <div className="bg-[#16131B] border border-[#D6006E]/15 rounded-xl p-5 mb-8 w-full text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-5 h-5 text-white/30" />
                            <div>
                                <p className="text-xs text-[#6B5F78] mb-0.5">Siniestro</p>
                                <p className="text-base font-mono font-bold text-[#F5F0F7]">{siniestro}</p>
                            </div>
                        </div>
                        {vehiculo && (
                            <div className="flex items-center gap-3 mb-4">
                                <Car className="w-5 h-5 text-white/30" />
                                <div>
                                    <p className="text-xs text-[#6B5F78] mb-0.5">Vehículo</p>
                                    <p className="text-[15px] font-medium text-[#F5F0F7]">{vehiculo}</p>
                                </div>
                            </div>
                        )}
                        {dominio && (
                            <div className="flex items-center gap-3">
                                <RectangleHorizontal className="w-5 h-5 text-white/30" />
                                <div>
                                    <p className="text-xs text-[#6B5F78] mb-0.5">Dominio</p>
                                    <p className="text-base font-mono font-bold text-[#F5F0F7] uppercase">{dominio}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instrucciones y Validacion Psicologica */}
                    <p className="text-[#9B8FA6] text-sm mb-6 leading-relaxed">
                        Te vamos a guiar paso a paso para que tomes las fotos necesarias. Solo necesitás tu cámara y buena iluminación.
                    </p>

                    <div className="bg-[#D6006E]/[0.06] border-l-[3px] border-[#D6006E] rounded-lg p-3.5 mb-8 flex text-left gap-3 w-full">
                        <ShieldCheck className="w-[18px] h-[18px] text-[#D6006E] shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-[#C4B8CF] leading-relaxed">
                            La inspección remota tiene la misma validez y precisión que una inspección presencial. Tus fotos son analizadas por peritos profesionales matriculados.
                        </p>
                    </div>

                    <button
                        onClick={() => setStep("reglamentarias")}
                        className="w-full bg-gradient-to-r from-[#D6006E] to-[#A8005A] hover:brightness-110 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all shadow-[0_4px_20px_rgba(214,0,110,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Comenzar <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Padding bottom for scroll padding logic on small devices */}
                    <div className="h-6" />
                </div>
            )}

            {/* ─── FOTOS REGLAMENTARIAS ─── */}
            {step === "reglamentarias" && !cameraActive && (
                <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-300">
                    {/* Progress bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-[#9B8FA6] font-medium tracking-wide mb-2">
                            <span>Paso {pasoReglamentario + 1} de {PASOS_REGLAMENTARIOS.length}</span>
                            <span>Fotos reglamentarias</span>
                        </div>
                        <div className="h-1.5 bg-[#16131B] border border-[#D6006E]/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#D6006E] to-[#A8005A] rounded-full transition-all duration-500"
                                style={{ width: `${((pasoReglamentario) / PASOS_REGLAMENTARIOS.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Current step */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="text-5xl mb-4">{PASOS_REGLAMENTARIOS[pasoReglamentario].icon}</div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            {PASOS_REGLAMENTARIOS[pasoReglamentario].label}
                        </h2>
                        <p className="text-white/60 text-sm mb-8 max-w-xs">
                            {PASOS_REGLAMENTARIOS[pasoReglamentario].desc}
                        </p>

                        {/* Thumbnail of completed steps — with upload status */}
                        {fotosReglamentarias.length > 0 && (
                            <div className="flex gap-2 mb-6 flex-wrap justify-center">
                                {fotosReglamentarias.map((f) => (
                                    <div key={f.id} className="w-12 h-12 rounded-lg overflow-hidden border-2 relative"
                                        style={{ borderColor: f.error ? 'rgba(239,68,68,0.5)' : f.uploaded ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.2)' }}>
                                        <img src={f.preview || f.url} alt={f.tipo} className="w-full h-full object-cover" />
                                        {f.uploading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                                            </div>
                                        )}
                                        {f.uploaded && (
                                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            </div>
                                        )}
                                        {f.error && (
                                            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setCameraActive(true)}
                            className="w-full bg-gradient-to-r from-[#D6006E] to-[#A8005A] hover:brightness-110 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all shadow-[0_4px_20px_rgba(214,0,110,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Camera className="w-5 h-5" /> Abrir Cámara
                        </button>

                        {pasoReglamentario > 0 && (
                            <button
                                onClick={() => setPasoReglamentario(prev => prev - 1)}
                                className="mt-3 text-white/40 text-sm hover:text-white/70 flex items-center gap-1 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Paso anterior
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ─── CAMERA ACTIVE (Regulatory) ─── */}
            {step === "reglamentarias" && cameraActive && (
                <CameraCapture
                    tipo={PASOS_REGLAMENTARIOS[pasoReglamentario].id}
                    label={PASOS_REGLAMENTARIOS[pasoReglamentario].label}
                    onCapture={handleFotoReglamentaria}
                    onCancel={() => setCameraActive(false)}
                />
            )}

            {/* ─── SELECTOR ZONA DE DAÑO ─── */}
            {step === "zona_danio" && !capturingDamage && (
                <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-[#F5F0F7] mb-2 text-center">Seleccioná las zonas con daños</h2>
                    <p className="text-[#9B8FA6] text-sm mb-6 text-center">
                        Tocá cada parte del vehículo que tiene daño visible
                    </p>

                    <SelectorZonaDanio
                        zonasSeleccionadas={zonasDanio}
                        onZonasChange={setZonasDanio}
                    />

                    {/* Damage photos thumbnails */}
                    {fotosDanios.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-[#6B5F78] uppercase tracking-wide mb-3 font-semibold">{fotosDanios.length} foto(s) de daños en curso</p>
                            <div className="flex gap-2 flex-wrap">
                                {fotosDanios.map((f, i) => (
                                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-[#D6006E]/30 relative">
                                        <img src={f.preview} alt="daño" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto space-y-3 pt-6">
                        <button
                            onClick={() => { setCapturingDamage(true); setCameraActive(true); }}
                            disabled={zonasDanio.length === 0}
                            className="w-full bg-[#16131B] hover:bg-[#D6006E]/20 text-[#D6006E] border-2 border-[#D6006E]/30 font-semibold py-4 px-8 rounded-xl text-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Camera className="w-5 h-5" /> Fotografiar Daños
                        </button>

                        <button
                            onClick={() => setStep("resumen")}
                            disabled={zonasDanio.length === 0 || fotosDanios.length < (zonasDanio.length * 2)}
                            className="w-full bg-gradient-to-r from-[#D6006E] to-[#A8005A] hover:brightness-110 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all shadow-[0_4px_20px_rgba(214,0,110,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {fotosDanios.length < (zonasDanio.length * 2)
                                ? `Faltan ${(zonasDanio.length * 2) - fotosDanios.length} fotos mín.`
                                : `Continuar · ${fotosDanios.length} fotos en total`} <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── CAMERA ACTIVE (Daños) ─── */}
            {step === "zona_danio" && capturingDamage && (
                <CameraCapture
                    tipo="danio_detalle"
                    label="Fotos de Daños"
                    allowMultiple={true}
                    onCapture={() => { }} // dummy para type check
                    onCaptureMultiple={handleFotoDanioMultiple}
                    onCancel={() => { setCapturingDamage(false); setCameraActive(false); }}
                />
            )}

            {/* ─── RESUMEN ─── */}
            {step === "resumen" && (
                <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-300 overflow-y-auto">
                    <h2 className="text-xl font-bold text-[#F5F0F7] mb-2 text-center">Resumen de Fotos</h2>
                    <p className="text-[#9B8FA6] text-sm mb-2 text-center">
                        Las fotos se suben automáticamente. Esperá a que todas tengan ✓ para enviar.
                    </p>

                    {/* Upload progress indicator */}
                    {anyUploading && (
                        <div className="flex items-center justify-center gap-2 mb-4 text-[#D6006E] text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Subiendo fotos en segundo plano...</span>
                        </div>
                    )}

                    {/* Regulatory photos with status */}
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-[#6B5F78] uppercase tracking-wider mb-2">
                            Fotos Reglamentarias ({fotosReglamentarias.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {fotosReglamentarias.map((f) => (
                                <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/5">
                                    <img src={f.preview || f.url} alt={f.tipo} className="w-full h-full object-cover" />
                                    {/* Upload status overlay */}
                                    {f.uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                    {f.uploaded && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    {f.error && (
                                        <div className="absolute inset-0 bg-red-500/30 flex flex-col items-center justify-center gap-1">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                            <button
                                                onClick={() => retryUpload(f, setFotosReglamentarias)}
                                                className="text-[10px] text-white bg-red-500/80 px-2 py-0.5 rounded-full flex items-center gap-1"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Reintentar
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0C0A0F]/90 to-transparent p-1.5">
                                        <p className="text-[10px] text-white/80 capitalize">{f.tipo.replace("_", " ")}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Damage photos with status */}
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-[#6B5F78] uppercase tracking-wider mb-2">
                            Fotos de Daños ({fotosDanios.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {fotosDanios.map((f) => (
                                <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#D6006E]/30">
                                    <img src={f.preview || f.url} alt="daño" className="w-full h-full object-cover" />
                                    {f.uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                    {f.uploaded && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    {f.error && (
                                        <div className="absolute inset-0 bg-red-500/30 flex flex-col items-center justify-center gap-1">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                            <button
                                                onClick={() => retryUpload(f, setFotosDanios)}
                                                className="text-[10px] text-white bg-red-500/80 px-2 py-0.5 rounded-full flex items-center gap-1"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Reintentar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── OBSERVACIONES COLAPSABLE ─── */}
                    <div className="border-t border-white/5 pt-4 mb-4">
                        <button
                            onClick={() => setObservacionesOpen(prev => !prev)}
                            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-[#16131B] border border-[#D6006E]/10 hover:border-[#D6006E]/25 transition-colors text-left"
                        >
                            <div>
                                <div className="flex items-center gap-2 text-[#F5F0F7] text-sm font-semibold">
                                    <span>📝</span> Observaciones de la pericia
                                </div>
                                <p className="text-[10px] text-[#6B5F78] mt-0.5">Opcional · Detalles adicionales</p>
                            </div>
                            {observacionesOpen ? <ChevronUp className="w-4 h-4 text-[#6B5F78]" /> : <ChevronDown className="w-4 h-4 text-[#6B5F78]" />}
                        </button>

                        <div className={`transition-all duration-300 ${observacionesOpen ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            {/* Textarea */}
                            <div className="relative mb-4">
                                <textarea
                                    value={observacionesTexto}
                                    onChange={(e) => { if (e.target.value.length <= 2000) setObservacionesTexto(e.target.value); }}
                                    placeholder="Indicá daños que no se vean en las fotos, detalles del vehículo o cualquier dato relevante para la pericia..."
                                    className="w-full bg-[#16131B] border border-white/10 rounded-xl p-3.5 text-sm text-[#F5F0F7] placeholder:text-[#6B5F78] focus:border-[#D6006E]/40 focus:outline-none resize-none custom-scrollbar"
                                    style={{ minHeight: 80, maxHeight: 150, overflowY: 'auto' }}
                                    onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 150) + 'px'; }}
                                />
                                {observacionesTexto.length > 0 && (
                                    <span className="absolute bottom-2 right-3 text-[10px] text-[#6B5F78]">{observacionesTexto.length}/2000</span>
                                )}
                            </div>

                            {/* Audio Recorder */}
                            {mediaRecorderSupported && (
                                <div className="space-y-2">
                                    {!audioBlob && !isRecording && (
                                        <>
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            onContextMenu={(e) => e.preventDefault()}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D6006E]/10 border border-[#D6006E]/20 text-[#D6006E] text-sm font-medium hover:bg-[#D6006E]/15 transition-colors select-none"
                                            style={{ WebkitTouchCallout: 'none', touchAction: 'manipulation' } as React.CSSProperties}
                                        >
                                            <Mic className="w-4 h-4" /> Grabar audio
                                        </button>
                                        {audioError && (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{audioError}</span>
                                            </div>
                                        )}
                                        </>
                                    )}

                                    {isRecording && (
                                        <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-red-400 text-sm font-mono flex-1">{formatTime(recordingTime)}</span>
                                            {recordingTime >= 115 && <span className="text-red-400/60 text-[10px]">Máx 2:00</span>}
                                            <button onClick={stopRecording} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors">
                                                <Square className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    )}

                                    {audioBlob && !isRecording && (
                                        <div className="rounded-xl bg-[#16131B] border border-white/10 p-3 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        if (!audioPlayerRef.current) return;
                                                        if (audioPlaying) { audioPlayerRef.current.pause(); setAudioPlaying(false); }
                                                        else { audioPlayerRef.current.play(); setAudioPlaying(true); }
                                                    }}
                                                    className="w-9 h-9 rounded-full bg-[#D6006E]/15 border border-[#D6006E]/20 flex items-center justify-center shrink-0"
                                                >
                                                    {audioPlaying ? <Pause className="w-4 h-4 text-[#D6006E]" /> : <Play className="w-4 h-4 text-[#D6006E] ml-0.5" />}
                                                </button>
                                                <div className="flex-1">
                                                    <div className="text-xs text-[#9B8FA6]">Audio grabado · {formatTime(recordingTime)}</div>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {audioUploading && <><Loader2 className="w-3 h-3 text-[#D6006E] animate-spin" /><span className="text-[10px] text-[#D6006E]">Subiendo...</span></>}
                                                        {audioUrl && <><CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-[10px] text-green-500">Subido</span></>}
                                                        {audioError && <><AlertCircle className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-400">{audioError}</span></>}
                                                    </div>
                                                </div>
                                                {audioError && (
                                                    <button onClick={() => audioBlob && uploadAudio(audioBlob)} className="text-[10px] text-[#D6006E] border border-[#D6006E]/20 px-2 py-1 rounded-lg hover:bg-[#D6006E]/10">
                                                        <RefreshCw className="w-3 h-3 inline mr-0.5" /> Reintentar
                                                    </button>
                                                )}
                                                <button onClick={deleteAudio} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                                    <Trash2 className="w-4 h-4 text-[#6B5F78] hover:text-red-400" />
                                                </button>
                                            </div>
                                            <audio
                                                ref={audioPlayerRef}
                                                src={audioLocalUrl || undefined}
                                                onEnded={() => setAudioPlaying(false)}
                                                className="hidden"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3 mb-4 flex items-start gap-2 text-[#EF4444] text-sm whitespace-pre-line text-left">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <div>{error}</div>
                        </div>
                    )}

                    <div className="mt-auto space-y-3">
                        {finalizing ? (
                            <div className="flex items-center justify-center gap-2 py-4 text-[#9B8FA6]">
                                <Loader2 className="w-5 h-5 animate-spin text-[#2DD4A0]" />
                                <span>Completando inspección...</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleFinalize}
                                    disabled={!allUploaded || anyError || anyUploading || audioUploading}
                                    className="w-full bg-[#2DD4A0] hover:brightness-110 disabled:opacity-40 disabled:grayscale text-[#0C0A0F] font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-[0_4px_20px_rgba(45,212,160,0.2)] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    {audioUploading
                                        ? "Subiendo audio..."
                                        : anyUploading
                                        ? `Subiendo... ${[...fotosReglamentarias, ...fotosDanios].filter(f => f.uploaded).length}/${totalFotos}`
                                        : anyError
                                            ? `${[...fotosReglamentarias, ...fotosDanios].filter(f => f.error).length} fotos con error`
                                            : `Enviar ${totalFotos} fotos`
                                    }
                                </button>
                                <button
                                    onClick={() => setStep("zona_danio")}
                                    className="w-full text-[#9B8FA6] text-sm py-2 hover:text-[#F5F0F7] flex items-center justify-center gap-1 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Volver a editar daños
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ─── COMPLETADO ─── */}
            {step === "completado" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 scale-in-95">
                    <div className="w-20 h-20 bg-[#2DD4A0]/20 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#2DD4A0]/10 scale-0 animate-[scale-in_500ms_ease-out_forwards]">
                        <CheckCircle2 className="w-10 h-10 text-[#2DD4A0]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#F5F0F7] mb-3">
                        ¡Inspección enviada!
                    </h1>
                    <p className="text-[#9B8FA6] text-sm leading-relaxed max-w-xs mb-8">
                        Las fotos fueron recibidas correctamente. Un perito profesional las revisará en breve.
                    </p>

                    <div className="bg-[#16131B] border border-[#D6006E]/15 rounded-xl p-5 mb-8 w-full">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                            <span className="text-[#6B5F78] text-xs">Siniestro</span>
                            <span className="text-[#F5F0F7] font-mono font-bold text-sm">{siniestro}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 w-full text-[#2DD4A0] bg-[#2DD4A0]/10 py-2 rounded-lg text-sm font-semibold">
                            <Camera className="w-4 h-4" /> {totalFotos} fotos enviadas
                        </div>
                    </div>

                    <p className="text-[#6B5F78] text-xs max-w-xs">
                        Podés cerrar esta ventana. Si necesitamos fotos adicionales, te contactaremos.
                    </p>

                    <div className="mt-12 flex justify-center">
                        <img
                            src="/logo-al-servicio-de-SS-negro.png"
                            alt="Al servicio de Sancor Seguros"
                            className="max-w-[140px] opacity-50"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
