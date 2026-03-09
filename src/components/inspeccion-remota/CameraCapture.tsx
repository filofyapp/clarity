"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, Check, SwitchCamera, Loader2, ImagePlus, AlertTriangle, Upload } from "lucide-react";

interface Props {
    tipo: string;
    label: string;
    onCapture: (blob: Blob, preview: string) => void;
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
        desc: "Foto cercana del daño",
        tip: "Con buena iluminación, desde distintos ángulos"
    },
};

export function CameraCapture({ tipo, label, onCapture, onCancel }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [captured, setCaptured] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(true);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [cameraAvailable, setCameraAvailable] = useState(false);
    const [mode, setMode] = useState<"checking" | "camera" | "file">("checking");

    const info = INSTRUCTIONS[tipo] || INSTRUCTIONS["danio_detalle"];

    // Check camera availability and start
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

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            });
            setStream(mediaStream);
            setCameraAvailable(true);
            setMode("camera");
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
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

    const switchCamera = () => {
        const next = facingMode === "environment" ? "user" : "environment";
        setFacingMode(next);
        startCamera(next);
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
            if (blob) { setCaptured(URL.createObjectURL(blob)); setCapturedBlob(blob); }
        }, "image/jpeg", 0.85);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCaptured(URL.createObjectURL(file));
        setCapturedBlob(file);
    };

    const retake = () => { if (captured) URL.revokeObjectURL(captured); setCaptured(null); setCapturedBlob(null); if (fileInputRef.current) fileInputRef.current.value = ""; };
    const accept = () => { if (capturedBlob && captured) { stream?.getTracks().forEach(t => t.stop()); onCapture(capturedBlob, captured); } };
    const handleCancel = () => { stream?.getTracks().forEach(t => t.stop()); onCancel(); };

    // ━━━ FILE UPLOAD MODE (Premium) ━━━
    if (mode === "file" || mode === "checking") {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <button onClick={handleCancel} className="p-2 -ml-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <p className="text-white/90 font-semibold text-sm">{info.title}</p>
                    </div>
                    <div className="w-9" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    {captured ? (
                        /* Preview selected image */
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
                        /* Upload prompt */
                        <div className="w-full max-w-sm text-center space-y-6">
                            {/* Instruction card */}
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-3">
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                                    <Camera className="w-7 h-7 text-blue-400" />
                                </div>
                                <h3 className="text-white font-semibold text-lg">{info.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{info.desc}</p>
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-2.5">
                                    <p className="text-blue-300/70 text-xs">
                                        💡 {info.tip}
                                    </p>
                                </div>
                            </div>

                            {/* Upload buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-semibold py-4 px-6 rounded-xl text-base transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2.5"
                                >
                                    <Camera className="w-5 h-5" /> Tomar Foto
                                </button>

                                <button
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.removeAttribute("capture");
                                            fileInputRef.current.click();
                                            // Restore capture attribute after click
                                            setTimeout(() => fileInputRef.current?.setAttribute("capture", "environment"), 100);
                                        }
                                    }}
                                    className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/70 hover:text-white font-medium py-3.5 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <ImagePlus className="w-4 h-4" /> Elegir de la Galería
                                </button>
                            </div>

                            {/* Camera retry hint */}
                            {!cameraAvailable && (
                                <p className="text-white/20 text-[11px]">
                                    La cámara en vivo requiere HTTPS · Las fotos se pueden tomar con la app de cámara
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        );
    }

    // ━━━ LIVE CAMERA MODE ━━━
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={handleCancel} className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white" />
                </button>
                <div className="text-center">
                    <p className="text-white font-semibold text-sm drop-shadow-lg">{info.title}</p>
                    <p className="text-white/60 text-xs drop-shadow">{info.tip}</p>
                </div>
                <button onClick={switchCamera} className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-white/10 transition-colors">
                    <SwitchCamera className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Video */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {captured ? (
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
                        {/* Subtle edge vignette for premium feel */}
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]" />
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 inset-x-0 z-20 pb-8 pt-6 px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                {captured ? (
                    <div className="flex justify-center gap-10">
                        <button onClick={retake} className="flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-medium">Repetir</span>
                        </button>
                        <button onClick={accept} className="flex flex-col items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center backdrop-blur-sm">
                                <Check className="w-6 h-6" />
                            </div>
                            <span className="text-[11px] font-medium">Aceptar</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center items-end gap-8">
                        <button
                            onClick={() => { setMode("file"); stream?.getTracks().forEach(t => t.stop()); }}
                            className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors mb-1"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <ImagePlus className="w-4 h-4" />
                            </div>
                            <span className="text-[9px]">Galería</span>
                        </button>

                        <button
                            onClick={capture}
                            disabled={loading}
                            className="group rounded-full border-[3px] border-white/90 bg-transparent hover:border-white active:scale-90 transition-all flex items-center justify-center disabled:opacity-30"
                            style={{ width: 72, height: 72 }}
                        >
                            <div className="w-[58px] h-[58px] rounded-full bg-white group-active:bg-white/80 transition-colors" />
                        </button>

                        <div className="w-10 mb-1" /> {/* spacer for alignment */}
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
