"use client";

import { useState, useCallback } from "react";
import { CameraCapture } from "./CameraCapture";
import { SelectorZonaDanio, ZONAS_MAP } from "./SelectorZonaDanio";
import {
    Camera, CheckCircle2, ChevronRight, ChevronLeft,
    Car, Loader2, PartyPopper, AlertCircle, Image as ImageIcon,
    ShieldCheck, FileText, RectangleHorizontal
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
    tipo: string;
    blob: Blob;
    preview: string;
    descripcion?: string;
    uploaded?: boolean;
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

export function WizardCaptura({ token, siniestro, vehiculo, dominio, tipoInspeccion, fotosYaSubidas, maxFotos }: Props) {
    const [step, setStep] = useState<WizardStep>("bienvenida");
    const [pasoReglamentario, setPasoReglamentario] = useState(0);
    const [fotosReglamentarias, setFotosReglamentarias] = useState<FotoCapturada[]>([]);
    const [fotosDanios, setFotosDanios] = useState<FotoCapturada[]>([]);
    const [zonasDanio, setZonasDanio] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturingDamage, setCapturingDamage] = useState(false);

    // Upload a single photo
    const uploadPhoto = useCallback(async (foto: FotoCapturada, orden: number): Promise<{ ok: boolean; error?: string }> => {
        try {
            const formData = new FormData();
            formData.append("token", token);
            formData.append("file", foto.blob, `${foto.tipo}_${Date.now()}.jpg`);
            formData.append("tipo", foto.tipo);
            formData.append("descripcion", foto.descripcion || "");
            formData.append("orden", String(orden));

            const res = await fetch("/api/inspeccion-remota/upload", { method: "POST", body: formData });
            const body = await res.json();

            if (!res.ok) {
                console.error("Upload failed:", res.status, body);
                return { ok: false, error: body?.error || body?.detail || `Error ${res.status}` };
            }
            return { ok: true };
        } catch (err) {
            console.error("Upload fetch error:", err);
            return { ok: false, error: "Error de conexión" };
        }
    }, [token]);

    // Upload all photos and complete
    const handleFinalize = useCallback(async () => {
        setUploading(true);
        setError(null);
        console.log("Iniciando subida de fotos. Total:", fotosReglamentarias.length + fotosDanios.length);
        const allFotos = [...fotosReglamentarias, ...fotosDanios];
        let successCount = 0;
        const failedUploads: string[] = [];

        for (let i = 0; i < allFotos.length; i++) {
            setUploadProgress(Math.round(((i + 1) / allFotos.length) * 100));
            
            // Si ya se subió con éxito en un intento anterior, la saltamos
            if (allFotos[i].uploaded) {
                successCount++;
                continue;
            }

            console.log(`Subiendo foto ${i + 1} de ${allFotos.length} (${allFotos[i].tipo})...`);
            const result = await uploadPhoto(allFotos[i], i + 1);
            if (result.ok) {
                successCount++;
                // Marcar como subida para futuros reintentos si otra foto falla
                allFotos[i].uploaded = true;
                
                // Liberar memoria para evitar OOM Crash (Safari Recarga la página por límite de memoria RAM)
                if (allFotos[i].preview) {
                    URL.revokeObjectURL(allFotos[i].preview);
                    // Opcional: allFotos[i].preview = ""; pero rompería la UI de "fotos enviadas".
                }
                
                console.log(`Foto ${i + 1} subida con éxito.`);
            } else {
                console.error(`Error en foto ${i + 1}:`, result.error);
                failedUploads.push(`Foto ${i + 1} (${allFotos[i].tipo}): ${result.error}`);
            }
        }
        
        // Guardar el estado de las fotos actualizadas con sus marcas de 'uploaded'
        const regulCount = fotosReglamentarias.length;
        setFotosReglamentarias(allFotos.slice(0, regulCount));
        setFotosDanios(allFotos.slice(regulCount));

        if (successCount === allFotos.length) {
            console.log("Todas las fotos subidas. Llamando a complete endpoint...");
            // Mark as complete
            try {
                const completeRes = await fetch("/api/inspeccion-remota/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                if (!completeRes.ok) {
                     const errorData = await completeRes.json();
                     console.error("Complete endpoint falló:", completeRes.status, errorData);
                } else {
                     console.log("Complete endpoint exitoso.");
                }
            } catch (e) {
                console.error("Complete endpoint exception:", e);
            }
            setStep("completado");
        } else {
            console.error(`Subida finalizada con errores. Éxitos: ${successCount}, Fallos: ${failedUploads.length}`);
            setError(`Oops. Se subieron ${successCount} de ${allFotos.length} fotos.\nDetalles de errores:\n- ${failedUploads.join('\n- ')}\nPor favor, intentá nuevamente enviar las que faltan.`);
        }
        setUploading(false);
    }, [fotosReglamentarias, fotosDanios, uploadPhoto, token]);

    // Handle regulatory photo capture
    const handleFotoReglamentaria = (blob: Blob, preview: string) => {
        const paso = PASOS_REGLAMENTARIOS[pasoReglamentario];
        setFotosReglamentarias(prev => [...prev, { tipo: paso.id, blob, preview, descripcion: paso.label }]);
        setCameraActive(false);

        if (pasoReglamentario < PASOS_REGLAMENTARIOS.length - 1) {
            setPasoReglamentario(prev => prev + 1);
        } else {
            setStep("zona_danio");
        }
    };

    // Handle damage photo capture (multiple)
    const handleFotoDanioMultiple = (fotos: { blob: Blob, preview: string }[]) => {
        const zonasNombres = zonasDanio.map(id => ZONAS_MAP[id] || id).join(", ");

        const nuevasFotos = fotos.map(f => ({
            tipo: "danio_detalle",
            blob: f.blob,
            preview: f.preview,
            descripcion: `Daños reportados: ${zonasNombres}`,
        }));
        setFotosDanios(prev => [...prev, ...nuevasFotos]);
        setCameraActive(false);
        setCapturingDamage(false);
    };

    const totalFotos = fotosReglamentarias.length + fotosDanios.length;

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

                        {/* Thumbnail of completed steps */}
                        {fotosReglamentarias.length > 0 && (
                            <div className="flex gap-2 mb-6 flex-wrap justify-center">
                                {fotosReglamentarias.map((f, i) => (
                                    <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-green-500/50 relative">
                                        <img src={f.preview} alt={f.tipo} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        </div>
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
                <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-[#F5F0F7] mb-2 text-center">Resumen de Fotos</h2>
                    <p className="text-[#9B8FA6] text-sm mb-6 text-center">
                        Verificá que todas las fotos estén correctas antes de enviar.
                    </p>

                    {/* Regulatory photos */}
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-[#6B5F78] uppercase tracking-wider mb-2">
                            Fotos Reglamentarias ({fotosReglamentarias.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {fotosReglamentarias.map((f, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/5">
                                    <img src={f.preview} alt={f.tipo} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0C0A0F]/90 to-transparent p-1.5">
                                        <p className="text-[10px] text-white/80 capitalize">{f.tipo.replace("_", " ")}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Damage photos */}
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-[#6B5F78] uppercase tracking-wider mb-2">
                            Fotos de Daños ({fotosDanios.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {fotosDanios.map((f, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#D6006E]/30">
                                    <img src={f.preview} alt="daño" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3 mb-4 flex items-start gap-2 text-[#EF4444] text-sm whitespace-pre-line text-left">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <div>{error}</div>
                        </div>
                    )}

                    <div className="mt-auto space-y-3">
                        {uploading ? (
                            <div className="space-y-3">
                                <div className="h-3 bg-[#16131B] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#D6006E] to-[#A8005A] rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-center text-[#9B8FA6] text-sm flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 text-[#D6006E] animate-spin" /> Subiendo fotos... {uploadProgress}%
                                </p>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleFinalize}
                                    className="w-full bg-[#2DD4A0] hover:brightness-110 text-[#0C0A0F] font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-[0_4px_20px_rgba(45,212,160,0.2)] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> 
                                    {error ? `Reintentar ${[...fotosReglamentarias, ...fotosDanios].filter(f => !f.uploaded).length} fotos pendientes` : `Enviar ${totalFotos} fotos`}
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
                            src="/images/logo-al-servicio-de-SS-negro.png"
                            alt="Al servicio de Sancor Seguros"
                            className="max-w-[140px] opacity-50"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
