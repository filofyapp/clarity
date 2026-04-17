"use client";

import { useEffect, useState } from "react";
import { getInformesHistoricos } from "@/app/(dashboard)/auditoria/actions";
import { Calendar, Eye } from "lucide-react";
import { toast } from "sonner";

interface Informe {
  id: string;
  fecha: string;
  contenido_whatsapp: string;
  created_at: string;
}

interface HistorialInformesProps {
  onVerInforme: (texto: string) => void;
}

export function HistorialInformes({ onVerInforme }: HistorialInformesProps) {
  const [informes, setInformes] = useState<Informe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInformes = async () => {
      try {
        const data = await getInformesHistoricos();
        setInformes(data as Informe[]);
      } catch (err: any) {
        toast.error("Error al cargar historial");
      } finally {
        setLoading(false);
      }
    };
    fetchInformes();
  }, []);

  if (loading) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-border-subtle p-6 flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (informes.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-border-subtle p-6 text-center">
        <Calendar className="h-8 w-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-muted text-sm">No hay informes históricos generados</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-subtle overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-primary" />
          Informes Históricos ({informes.length})
        </h3>
      </div>
      <div className="divide-y divide-border-subtle max-h-64 overflow-y-auto">
        {informes.map(inf => (
          <div key={inf.id} className="flex items-center justify-between px-5 py-3 hover:bg-bg-tertiary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-brand-primary/10 rounded-md">
                <Calendar className="h-3.5 w-3.5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{formatFecha(inf.fecha)}</p>
                <p className="text-xs text-text-muted">{formatHora(inf.created_at)}</p>
              </div>
            </div>
            <button
              onClick={() => onVerInforme(inf.contenido_whatsapp)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver / Copiar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatFecha(fecha: string): string {
  try {
    const [y, m, d] = fecha.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d} ${meses[parseInt(m) - 1]} ${y}`;
  } catch {
    return fecha;
  }
}

function formatHora(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
