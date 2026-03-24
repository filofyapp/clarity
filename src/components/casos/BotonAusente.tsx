"use client";

import { useState, useRef, useTransition } from "react";
import { UserX, Upload, Loader2, CheckCircle, X } from "lucide-react";
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
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleConfirmar = () => {
        if (!foto) { toast.error("Subí la foto de ausencia primero."); return; }

        startTransition(async () => {
            const fd = new FormData();
            fd.append("foto", foto);
            const result = await marcarInspeccionAusente(casoId, fd);
            if (result.error) {
                toast.error(result.error);
            } else {
                setSuccess(true);
                toast.success("Inspección marcada como AUSENTE — IP Cerrada");
                setTimeout(() => router.refresh(), 1500);
            }
        });
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
                <p className="text-sm text-text-muted">El caso fue cerrado automáticamente.</p>
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
                <button onClick={handleClose} className="p-1 text-text-muted hover:text-text-primary rounded-md transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <p className="text-xs text-text-muted">
                Subí la foto que acredita la ausencia. El caso se cerrará automáticamente.
            </p>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
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
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => inputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-danger/30 rounded-xl text-text-muted hover:text-danger hover:border-danger/50 transition-all flex flex-col items-center gap-2"
                >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs font-medium">Tomar / Subir foto de ausencia</span>
                </button>
            )}

            <button
                onClick={handleConfirmar}
                disabled={!foto || isPending}
                className="w-full py-3 bg-danger text-white rounded-xl font-bold text-sm hover:bg-danger/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isPending ? (
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
