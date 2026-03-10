"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check, SwitchCamera, Loader2, ImagePlus, CheckCircle2 } from "lucide-react";

interface Props {
    tipo: string;
    label: string;
    onCapture: (blob: Blob, preview: string) => void;
    allowMultiple?: boolean;
    onCaptureMultiple?: (blobs: { blob: Blob; preview: string }[]) => void;
    onCancel: () => void;
}

// Instructions per photo type
const INSTRUCTIONS: Record<string, { title: string; desc: string; tip: string }> = {
    lateral_izq: {
        title: "Lateral Izquierdo",
        desc: "Foto completa del lado izquierdo del vehículo",
        tip: "Ubicarse a 3-4 metros, que entre el auto completo"
    },
    lateral_der: {
        title: "Lateral Derecho",
        desc: "Foto completa del lado derecho del vehículo",
        tip: "Ubicarse a 3-4 metros, que entre el auto completo"
    },
    frente: {
        title: "Vista Frontal",
        desc: "Foto de frente completa del vehículo",
        tip: "Centrado frente al vehículo"
    },
    trasera: {
        title: "Vista Trasera",
        desc: "Foto trasera completa del vehículo",
        tip: "Centrado detrás del vehículo"
    },
    kilometraje: {
        title: "Kilometraje",
        desc: "Foto del tablero mostrando el odómetro",
        tip: "Con el motor encendido si es posible"
    },
    documentacion: {
        title: "Número de Chasis",
        desc: "Foto del número VIN/Chasis",
        tip: "Generalmente en el marco de la puerta o base del parabrisas"
    },
    danio_detalle: {
        title: "Detalle del Daño",
        desc: "Tomá fotos de todos los daños identificados",
        tip: "Intentá mantener el dispositivo firme y con buena luz"
    },
};

export function CameraCapture({ tipo, label, onCapture, allowMultiple = false, onCaptureMultiple, onCancel }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Separamos los inputs para evitar bugs de DOM/atributos (Galería vs app nativa de Cámara)
    const fileInputRefCamera = useRef<HTMLInputElement>(null);
    const fileInputRefGallery = useRef<HTMLInputElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [captured, setCaptured] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

    // Reel para captura múltiple continua
    const [capturedReel, setCapturedReel] = useState<{ blob: Blob, preview: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [cameraAvailable, setCameraAvailable] = useState(false);
    const [mode, setMode] = useState<"checking" | "camera" | "file">("checking");
    const [flash, setFlash] = useState(false);

    const info = INSTRUCTIONS[tipo] || INSTRUCTIONS["danio_detalle"];

    const startCamera = useCallback(async (facing: "environment" | "user") => {
        const isSecure = typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");
        const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

        if (!isSecure || !hasMediaDevices) {
            setCameraAvailable(false);
            setMode("file");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            if (stream) stream.getTracks().forEach(t => t.stop());

            let mediaStream;
            try {
                // Try strictly specifying exact first to force the specific camera (EVITA que abra la frontal en celulares)
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { exact: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false,
                });
            } catch {
                // Si la PC no tiene "environment" exacto, fallback flexible
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false,
                });
            }

            setStream(mediaStream);
            setCameraAvailable(true);
            setMode("camera");
        } catch {
            setCameraAvailable(false);
            setMode("file");
        }
        setLoading(false);
    }, [stream]);

    useEffect(() => {
        startCamera(facingMode);
        return () => { stream?.getTracks().forEach(t => t.stop()); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect to attach stream carefully after video element is mounted
    useEffect(() => {
        if (mode === "camera" && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [mode, stream]);

    const switchCamera = () => {
        const next = facingMode === "environment" ? "user" : "environment";
        setFacingMode(next);
        startCamera(next);
    };

    const triggerFlash = () => {
        setFlash(true);
        setTimeout(() => setFlash(false), 150);
    };

    const capture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const preview = URL.createObjectURL(blob);
                if (allowMultiple) {
                    triggerFlash();
                    setCapturedReel(prev => [...prev, { blob, preview }]);
                } else {
                    setCaptured(preview);
                    setCapturedBlob(blob);
                }
            }
        }, "image/jpeg", 0.85);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (allowMultiple) {
            const newPhotos = files.map(file => ({
                blob: file,
                preview: URL.createObjectURL(file)
            }));
            setCapturedReel(prev => [...prev, ...newPhotos]);
        } else {
            setCaptured(URL.createObjectURL(files[0]));
            setCapturedBlob(files[0]);
        }

        // Clear input to allow re-selection
        e.target.value = "";
    };

    const retake = () => { if (captured) URL.revokeObjectURL(captured); setCaptured(null); setCapturedBlob(null); };

    const removeMultiple = (index: number) => {
        setCapturedReel(prev => prev.filter((_, i) => i !== index));
    };

    const accept = () => { if (capturedBlob && captured) { stream?.getTracks().forEach(t => t.stop()); onCapture(capturedBlob, captured); } };

    const acceptMultiple = () => { if (capturedReel.length > 0 && onCaptureMultiple) { stream?.getTracks().forEach(t => t.stop()); onCaptureMultiple(capturedReel); } };

    const handleCancel = () => { stream?.getTracks().forEach(t => t.stop()); onCancel(); };

    // ━━━ FILE UPLOAD MODE (Premium Fallback) ━━━
    if (mode === "file" || mode === "checking") {
        return (
            <div className="fixed inset-0 z-50 bg-[#0C0A0F] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#16131B]">
                    <button onClick={handleCancel} className="p-2 -ml-2 rounded-xl text-[#9B8FA6] hover:text-[#F5F0F7] hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <p className="text-[#F5F0F7] font-semibold text-sm">{info.title}</p>
                    </div>
                    <div className="w-9" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                    {/* Caso 1: Tiene Single Capture Listo */}
                    {!allowMultiple && captured ? (
                        <div className="w-full max-w-sm space-y-6">
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3]">
                                <img src={captured} alt="preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex justify-center gap-6">
                                <button onClick={retake} className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <RotateCcw className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-medium">Otra foto</span>
                                </button>
                                <button onClick={accept} className="flex flex-col items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <span className="text-[11px] font-medium">Aceptar</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Caso 2: Selector o Múltiple listo */
                        <div className="w-full max-w-sm space-y-6">

                            {allowMultiple && capturedReel.length > 0 && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <h4 className="text-white text-sm mb-3 font-semibold">Fotos en curso ({capturedReel.length})</h4>
                                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {capturedReel.map((p, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/20">
                                                <img src={p.preview} className="w-full h-full object-cover" alt="miniatura" />
                                                <button onClick={() => removeMultiple(i)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white/80 hover:text-white">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!allowMultiple || capturedReel.length === 0 ? (
                                <div className="bg-[#16131B]/50 border border-[#D6006E]/15 rounded-2xl p-6 space-y-3 text-center">
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#D6006E]/20 to-transparent border border-[#D6006E]/20 flex items-center justify-center">
                                        <Camera className="w-7 h-7 text-[#D6006E]" />
                                    </div>
                                    <h3 className="text-[#F5F0F7] font-semibold text-lg">{info.title}</h3>
                                    <p className="text-[#9B8FA6] text-sm leading-relaxed">{info.desc}</p>
                                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                                        <p className="text-[#9B8FA6] text-xs">💡 {info.tip}</p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-3">
                                <button
                                    onClick={() => fileInputRefCamera.current?.click()}
                                    className="w-full bg-gradient-to-r from-[#D6006E] to-[#A8005A] hover:brightness-110 text-white font-semibold py-4 px-6 rounded-xl text-base transition-all shadow-[0_4px_20px_rgba(214,0,110,0.3)] active:scale-[0.98] flex items-center justify-center gap-2.5"
                                >
                                    <Camera className="w-5 h-5" /> Tomar Foto{allowMultiple ? 's' : ''}
                                </button>

                                <button
                                    onClick={() => fileInputRefGallery.current?.click()}
                                    className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/70 hover:text-white font-medium py-3.5 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <ImagePlus className="w-4 h-4" /> Elegir de la Galería
                                </button>

                                {allowMultiple && capturedReel.length > 0 && (
                                    <button
                                        onClick={acceptMultiple}
                                        className="w-full mt-4 bg-[#2DD4A0] text-[#0C0A0F] font-bold py-4 px-6 rounded-xl text-base shadow-[0_4px_20px_rgba(45,212,160,0.2)]"
                                    >
                                        <CheckCircle2 className="w-5 h-5 inline mr-2" />
                                        Confirmar Lote ({capturedReel.length})
                                    </button>
                                )}
                            </div>

                            {!cameraAvailable && (
                                <p className="text-white/20 text-[11px] text-center">
                                    La cámara en vivo requiere HTTPS · Las fotos se pueden tomar con la app de cámara
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* DOM Inputs - Strictly Separated */}
                <input ref={fileInputRefCamera} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                <input ref={fileInputRefGallery} type="file" accept="image/*" multiple={allowMultiple} onChange={handleFileSelect} className="hidden" />
            </div>
        );
    }

    // ━━━ LIVE CAMERA MODE ━━━
    return (
        <div className="fixed inset-0 z-50 bg-[#0C0A0F] flex flex-col">
            {/* Flash Effect */}
            {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none opacity-100 transition-opacity duration-[150ms]" style={{ opacity: flash ? 0.8 : 0 }} />}

            {/* Header overlaying camera */}
            <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[#0C0A0F]/80 to-transparent">
                <button onClick={handleCancel} className="p-2 rounded-full bg-[#16131B]/40 backdrop-blur-sm hover:bg-[#16131B]/80 transition-colors">
                    <X className="w-5 h-5 text-[#F5F0F7]" />
                </button>
                <div className="text-center pt-2">
                    <p className="text-[#F5F0F7] font-semibold text-sm drop-shadow-md">{info.title}</p>
                    <p className="text-[#9B8FA6] text-[10px] drop-shadow-md">{info.tip}</p>
                </div>
                <button onClick={switchCamera} className="p-2 rounded-full bg-[#16131B]/40 backdrop-blur-sm hover:bg-[#16131B]/80 transition-colors">
                    <SwitchCamera className="w-5 h-5 text-[#F5F0F7]" />
                </button>
            </div>

            {/* Reel for Continuous Capture */}
            {allowMultiple && capturedReel.length > 0 && (
                <div className="absolute top-[70px] inset-x-0 z-30 flex gap-2 w-full px-4 pt-2 pb-3 overflow-x-auto custom-scrollbar scroll-smooth">
                    {capturedReel.map((p, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-white/50 shadow-xl bg-black animate-in fade-in zoom-in-0 duration-200">
                            <img src={p.preview} alt={`thumb`} className="w-full h-full object-cover" />
                            <button onClick={() => removeMultiple(i)} className="absolute top-0 right-0 p-1 bg-black/50 text-white rounded-bl-lg hover:bg-black/80">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Video / Preview */}
            <div className={`flex-1 relative flex items-center justify-center overflow-hidden ${(allowMultiple && capturedReel.length > 0) ? 'mt-8' : ''}`}>
                {!allowMultiple && captured ? (
                    <img src={captured} alt="captured" className="w-full h-full object-contain" />
                ) : (
                    <>
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay playsInline muted
                            onLoadedMetadata={() => setLoading(false)}
                            className="w-full h-full object-cover"
                        />
                    </>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 inset-x-0 z-40 pb-12 pt-8 px-6 bg-gradient-to-t from-[#0C0A0F] via-[#0C0A0F]/80 to-transparent flex flex-col items-center justify-end">
                {!allowMultiple && captured ? (
                    <div className="flex justify-center gap-10 w-full mb-4">
                        <button onClick={retake} className="flex flex-col items-center gap-2 text-[#9B8FA6] hover:text-[#F5F0F7] transition-colors">
                            <div className="w-14 h-14 rounded-full bg-[#16131B] border border-white/10 flex items-center justify-center">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                            <span className="text-[12px] font-medium">Repetir</span>
                        </button>
                        <button onClick={accept} className="flex flex-col items-center gap-2 text-[#2DD4A0] hover:brightness-110 transition-colors">
                            <div className="w-14 h-14 rounded-full bg-[#2DD4A0]/10 border-2 border-[#2DD4A0] flex items-center justify-center">
                                <Check className="w-6 h-6" />
                            </div>
                            <span className="text-[12px] font-medium">Usar esta foto</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 w-full relative">
                        {/* Native Sancor Transparent Button requested by user */}
                        <div className="flex justify-center items-center gap-8 relative w-full mb-2">
                            <button
                                onClick={() => { setMode("file"); stream?.getTracks().forEach(t => t.stop()); }}
                                className="absolute left-0 flex flex-col items-center gap-1 text-[#9B8FA6] hover:text-[#F5F0F7] transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-[#16131B]/50">
                                    <ImagePlus className="w-5 h-5" />
                                </div>
                            </button>

                            <button
                                onClick={capture}
                                disabled={loading}
                                className={`group rounded-full border-[4px] border-[#F5F0F7] bg-transparent active:bg-white/20 transition-all flex items-center justify-center disabled:opacity-30 ${allowMultiple ? 'animate-pulse' : ''}`}
                                style={{ width: 68, height: 68 }}
                                title="Sacar Foto"
                            >
                                {/* Inner circle removed for total transparency as requested, relying on the flash feedback */}
                                {allowMultiple && <div className="w-[50px] h-[50px] rounded-full bg-[#D6006E]/30" />}
                            </button>

                            {allowMultiple && capturedReel.length > 0 && (
                                <button
                                    onClick={acceptMultiple}
                                    className="absolute right-0 flex items-center justify-center gap-2 bg-[#2DD4A0] text-[#0C0A0F] pl-4 pr-5 py-3.5 rounded-full shadow-[0_4px_20px_rgba(45,212,160,0.3)] active:scale-95 transition-all font-bold"
                                >
                                    <Check className="w-5 h-5" />
                                    <span>Listo ({capturedReel.length})</span>
                                </button>
                            )}
                        </div>
                        <span className="text-xs text-[#9B8FA6] font-medium uppercase tracking-wider">{allowMultiple ? 'Daño Continuo' : 'Tomar foto'}</span>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
