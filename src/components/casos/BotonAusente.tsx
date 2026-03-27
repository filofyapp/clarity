"use client";

import { useState, useRef } from "react";
import { UserX, Upload, Loader2, CheckCircle, X, Camera, ImagePlus } from "lucide-react";
import { marcarInspeccionAusente } from "@/app/(dashboard)/casos/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BotonAusenteProps {
    casoId: string;
}

export function BotonAusente({ casoId }: BotonAusenteProps) {
    const [open, setOpen] = useState(false);
    const [foto, setFoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    // BUG-014: Dual input — separated for camera vs gallery
    const inputCameraRef = useRef<HTMLInputElement>(null);
    const inputGalleryRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFoto(file);
        setPreview(URL.createObjectURL(file));
        e.target.value = "";
    };

    const handleConfirmar = async () => {
        if (!foto) {
            toast.error("Subí la foto de ausencia primero.");
            return;
        }

        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("foto", foto);

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
        setOpen(false);
        setFoto(null);
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
                    <button
                        onClick={() => { setFoto(null); setPreview(null); }}
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
                disabled={!foto || isSubmitting}
                className="w-full py-3 bg-danger text-white rounded-xl font-bold text-sm hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
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
