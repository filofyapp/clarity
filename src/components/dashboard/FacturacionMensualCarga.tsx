"use client";

import { useState } from "react";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface BillingData {
    total: number;
    count: number;
    desglose: Record<string, { count: number; sum: number }>;
}

interface Props {
    mesActual: BillingData;
    mesAnterior: BillingData;
    label?: string;
}

export function FacturacionMensualCarga({ mesActual, mesAnterior, label = "Generado" }: Props) {
    const [showMesAnterior, setShowMesAnterior] = useState(false);
    const data = showMesAnterior ? mesAnterior : mesActual;
    const now = new Date();

    const mesLabel = showMesAnterior
        ? new Date(now.getFullYear(), now.getMonth() - 1).toLocaleDateString("es-AR", { month: "long" })
        : new Date(now.getFullYear(), now.getMonth()).toLocaleDateString("es-AR", { month: "long" });

    return (
        <div className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col group relative">
            {/* Month toggle */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-text-muted text-xs">
                    <TrendingUp className="w-3.5 h-3.5" /> {label}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowMesAnterior(true)}
                        disabled={showMesAnterior}
                        className="p-0.5 rounded hover:bg-bg-tertiary text-text-muted disabled:opacity-30 transition-colors"
                        title="Mes anterior"
                    >
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide min-w-[60px] text-center capitalize">
                        {mesLabel}
                    </span>
                    <button
                        onClick={() => setShowMesAnterior(false)}
                        disabled={!showMesAnterior}
                        className="p-0.5 rounded hover:bg-bg-tertiary text-text-muted disabled:opacity-30 transition-colors"
                        title="Mes actual"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <p className="text-2xl font-bold text-brand-secondary">{formatCurrency(data.total)}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{data.count} caso{data.count !== 1 ? "s" : ""} cerrado{data.count !== 1 ? "s" : ""}</p>

            {/* Tooltip Hover Breakdown */}
            {Object.keys(data.desglose).length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-bg-elevated border border-border p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                    <h4 className="text-[10px] uppercase font-bold text-text-muted mb-2 border-b border-border pb-1">Desglose de Ingresos</h4>
                    <div className="space-y-1.5">
                        {Object.entries(data.desglose).map(([tipo, d]) => (
                            <div key={tipo} className="flex items-center justify-between text-xs">
                                <span className="capitalize text-text-secondary">{tipo.replace(/_/g, " ")} ({d.count})</span>
                                <span className="font-semibold text-text-primary">{formatCurrency(d.sum)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
