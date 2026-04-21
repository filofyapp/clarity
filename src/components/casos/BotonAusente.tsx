"use client";

import { useState, useRef } from "react";
import { UserX, Upload, Loader2, CheckCircle, X, Camera, ImagePlus } from "lucide-react";
import { marcarInspeccionAusente } from "@/app/(dashboard)/casos/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ═══ Compresión de imagen (misma lógica que WizardCaptura/InspeccionCampoWizard) ═══
async function compressImage(file: Blob, maxWidth = 1920, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement("canvas");
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(file); return; }
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : resolve(file)),
                "image/jpeg",
                quality
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

// ═══ Conversión HEIC → JPEG (misma lógica que WizardCaptura) ═══
async function convertirSiEsHeic(file: File | Blob): Promise<Blob> {
    const tipo = (file as File).type?.toLowerCase() || "";
    const nombre = ((file as File).name || "").toLowerCase();
    const esHeic = tipo.includes("heic") || tipo.includes("heif") ||
        nombre.endsWith(".heic") || nombre.endsWith(".heif") ||
        (tipo === "" && nombre === ""); // iOS a veces envía MIME vacío
    if (!esHeic) return file;
    try {
        const heic2any = (await import("heic2any")).default;
        const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
        return Array.isArray(result) ? result[0] : result;
    } catch {
        return file; // fallback seguro: devolver original
    }
}

// ═══ Pipeline completo: HEIC → Compress (con timeout 30s) ═══
async function procesarImagen(file: File | Blob): Promise<Blob> {
    const timeout = new Promise<Blob>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout procesando imagen")), 30000)
    );
    const proceso = (async () => {
        const converted = await convertirSiEsHeic(file as File);
        return compressImage(converted);
    })();
    try {
        return await Promise.race([proceso, timeout]);
    } catch {
        return file; // fallback: enviar original si falla
    }
}

interface BotonAusenteProps {
    casoId: string;
}

export function BotonAusente({ casoId }: BotonAusenteProps) {
    const [open, setOpen] = useState(false);
    const [foto, setFoto] = useState<File | null>(null);
    const [fotoComprimida, setFotoComprimida] = useState<Blob | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    // BUG-014: Dual input — separated for camera vs gallery
    const inputCameraRef = useRef<HTMLInputElement>(null);
    const inputGalleryRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        setFoto(file);
        setPreview(URL.createObjectURL(file));
        setIsProcessing(true);

        try {
            // Comprimir la imagen (HEIC → JPEG + resize)
            const comprimida = await procesarImagen(file);
            setFotoComprimida(comprimida);
        } catch {
            // Si falla la compresión, usar el original
            setFotoComprimida(file);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmar = async () => {
        const fotoParaSubir = fotoComprimida || foto;
        if (!fotoParaSubir) {
            toast.error("Subí la foto de ausencia primero.");
            return;
        }
        if (isProcessing) {
            toast.error("Esperá que termine de procesar la foto...");
            return;
        }

        setIsSubmitting(true);
        try {
            const fd = new FormData();
            // Usar la foto comprimida con nombre .jpg
            const fileName = (foto?.name || "ausente.jpg").replace(/\.(heic|heif)$/i, ".jpg");
            fd.append("foto", fotoParaSubir, fileName);

            const result = await marcarInspeccionAusente(casoId, fd);

            if (result.error) {
                toast.error(result.error);
                setIsSubmitting(false);
                return;
            }

            // Success: show feedback and redirect
            setSuccess(true);
            toast.success("Inspección marcada como AUSENTE — IP Cerrada");
            router.push("/mi-agenda");
        } catch (err: any) {
            toast.error("Error de red: " + (err?.message || "Intentá de nuevo."));
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (preview) URL.revokeObjectURL(preview);
        setOpen(false);
        setFoto(null);
        setFotoComprimida(null);
        setPreview(null);
        setSuccess(false);
    };

    if (success) {
        return (
            <div className="bg-color-success/10 border border-color-success/30 rounded-xl p-5 text-center space-y-2 animate-in fade-in zoom-in-95">
                <CheckCircle className="w-10 h-10 text-color-success mx-auto" />
                <p className="font-bold text-color-success text-lg">Ausente registrado</p>
                <p className="text-sm text-text-muted">Redirigiendo a Mi Agenda...</p>
            </div>
        );
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full py-3 bg-bg-secondary border-2 border-dashed border-text-muted/30 text-text-secondary rounded-xl font-semibold text-sm hover:border-danger/50 hover:text-danger hover:bg-danger/5 transition-all flex items-center justify-center gap-2"
            >
                <UserX className="w-4 h-4" />
                Marcar Ausente
            </button>
        );
    }

    return (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-danger flex items-center gap-2">
                    <UserX className="w-4 h-4" />
                    Registrar Ausencia
                </h4>
                <button onClick={handleClose} disabled={isSubmitting} className="p-1 text-text-muted hover:text-text-primary rounded-md transition-colors disabled:opacity-40">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <p className="text-xs text-text-muted">
                Subí la foto que acredita la ausencia. El caso se cerrará automáticamente.
            </p>

            {/* BUG-014: Dual inputs — camera and gallery separated */}
            <input
                ref={inputCameraRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={handleFoto}
                className="hidden"
            />
            <input
                ref={inputGalleryRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleFoto}
                className="hidden"
            />

            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Foto de ausencia"
                        className="w-full max-h-48 object-cover rounded-lg border border-border"
                    />
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white text-sm font-medium">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Procesando...
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            if (preview) URL.revokeObjectURL(preview);
                            setFoto(null);
                            setFotoComprimida(null);
                            setPreview(null);
                        }}
                        disabled={isSubmitting}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors disabled:opacity-40"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <button
                        onClick={() => inputCameraRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-danger/30 rounded-xl text-danger hover:border-danger/50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                    >
                        <Camera className="w-5 h-5" />
                        📸 Tomar Foto
                    </button>
                    <button
                        onClick={() => inputGalleryRef.current?.click()}
                        className="w-full py-3 border border-border rounded-xl text-text-muted hover:text-text-primary transition-all flex items-center justify-center gap-2 text-xs font-medium"
                    >
                        <ImagePlus className="w-4 h-4" />
                        🖼️ Subir de Galería
                    </button>
                </div>
            )}

            <button
                onClick={handleConfirmar}
                disabled={!foto || isSubmitting || isProcessing}
                className="w-full py-3 bg-danger text-white rounded-xl font-bold text-sm hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando foto...
                    </>
                ) : isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                    </>
                ) : (
                    "Confirmar Ausente"
                )}
            </button>
        </div>
    );
}
