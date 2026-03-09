"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ParsedCasoResult } from "@/lib/parser/sancor";

interface ParserIAProps {
    onParsed: (data: ParsedCasoResult) => void;
}

export function ParserIA({ onParsed }: ParserIAProps) {
    const [texto, setTexto] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    const handleParse = async () => {
        if (!texto.trim()) {
            toast.error("Por favor, pega el texto del correo del siniestro.");
            return;
        }

        setIsParsing(true);
        try {
            const res = await fetch("/api/parsear-caso", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texto_crudo: texto }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Error al parsear el texto.");
            }

            toast.success(json.message);
            onParsed(json.data);
            setTexto(""); // Limpiar text area al tener exito
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="space-y-4 bg-brand-primary-soft border border-brand-primary/20 rounded-md p-4 mb-6">
            <div>
                <h3 className="text-sm font-semibold text-brand-secondary flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4" />
                    CLARITY Parser Automático
                </h3>
                <p className="text-xs text-text-muted mb-3">
                    Copia y pega el bloque completo del correo electrónico o sistema de Sancor para pre-rellenar el formulario mágicamente.
                </p>
            </div>

            <Textarea
                placeholder="Pegar el texto del siniestro aquí..."
                className="min-h-[100px] text-xs bg-bg-tertiary border-border focus-visible:ring-brand-primary font-mono text-text-secondary"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
            />

            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={handleParse}
                    disabled={isParsing || !texto.trim()}
                    size="sm"
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                >
                    {isParsing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando texto...
                        </>
                    ) : (
                        <>Extraer Datos Automáticamente</>
                    )}
                </Button>
            </div>
        </div>
    );
}
