"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface CamaraProps {
    casoId: string;
    onUploadSuccess?: (url: string) => void;
}

export function CamaraCaptura({ casoId, onUploadSuccess }: CamaraProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Invocamos la cámara nativa del teléfono o abrimos el explorador
    const handleCaptureTrigger = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Convierte FileList a Array y lo suma al state
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        startTransition(async () => {
            const supabase = createClient();
            let successCount = 0;

            for (const file of selectedFiles) {
                // Generar nombre unico asegurando que resida en un subfolder del siniestro
                const fileExt = file.name.split('.').pop();
                const fileName = `${casoId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

                const { data, error } = await supabase.storage
                    .from('fotos-inspecciones')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    console.error("Upload error:", error);
                    toast.error(`Error subiendo ${file.name}`);
                } else if (data) {
                    // Obtener URL publica
                    const { data: publicData } = supabase.storage
                        .from('fotos-inspecciones')
                        .getPublicUrl(fileName);

                    successCount++;
                    if (onUploadSuccess && publicData.publicUrl) {
                        onUploadSuccess(publicData.publicUrl);
                    }
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} fotos subidas correctamente.`);
                setSelectedFiles([]); // Limpiar cola
            }
        });
    };

    return (
        <div className="bg-bg-secondary p-4 rounded-xl border border-border">
            <h4 className="font-semibold text-text-primary text-sm uppercase tracking-wider mb-4">Registro Fotográfico</h4>

            {/* Input oculto pero nativo para móviles */}
            <input
                type="file"
                accept="image/*"
                capture="environment" // Fuerza apertura de cámara trasera en celus
                multiple // Permite elegir varias si se selecciona de galeria
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {/* Botón de Captura que emula un Slot */}
                <button
                    type="button"
                    onClick={handleCaptureTrigger}
                    className="aspect-square flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg-tertiary hover:border-brand-primary hover:bg-brand-primary/5 transition-colors text-text-muted hover:text-brand-primary"
                >
                    <Camera className="w-8 h-8" />
                    <span className="text-xs font-medium">Sacar Foto</span>
                </button>

                {/* Slots con Preview Miniatura */}
                {selectedFiles.map((file, i) => (
                    <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-border bg-black group">
                        {/* Object URL para previsualizar localmente antes de subir */}
                        <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} // Clean up memory
                        />
                        <button
                            onClick={() => removeFile(i)}
                            className="absolute top-1 right-1 bg-black/50 text-text-primary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {selectedFiles.length > 0 && (
                <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full bg-border text-text-primary hover:bg-text-muted"
                >
                    {isUploading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo {selectedFiles.length} foto(s)...</>
                    ) : (
                        <><UploadCloud className="w-4 h-4 mr-2" /> Subir a la Nube</>
                    )}
                </Button>
            )}
        </div>
    );
}
