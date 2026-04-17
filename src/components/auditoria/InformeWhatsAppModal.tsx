"use client";

import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InformeWhatsAppModalProps {
  texto: string;
  onClose: () => void;
}

export function InformeWhatsAppModal({ texto, onClose }: InformeWhatsAppModalProps) {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success("Informe copiado ✓ — Pegalo en el grupo de WhatsApp");
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Fallback para navegadores que no soportan clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = texto;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiado(true);
      toast.success("Informe copiado ✓ — Pegalo en el grupo de WhatsApp");
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0f0f12] border border-border-subtle rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h2 className="text-base font-bold text-text-primary font-outfit">Informe de Auditoría</h2>
              <p className="text-xs text-text-muted">Texto formateado para WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary leading-relaxed break-words select-all">
            {texto}
          </pre>
        </div>

        {/* Footer con botón copiar */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Los *asteriscos* se muestran como <strong>negrita</strong> en WhatsApp
          </p>
          <button
            onClick={handleCopiar}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              copiado
                ? "bg-emerald-600 text-white"
                : "bg-brand-primary text-text-on-brand hover:opacity-90"
            }`}
          >
            {copiado ? (
              <>
                <Check className="h-4 w-4" />
                Copiado ✓
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar al portapapeles
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
