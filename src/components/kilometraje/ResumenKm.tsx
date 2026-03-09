"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ExternalLink, Navigation } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface ResumenKmProps {
    registros: any[];
    isAdmin: boolean;
}

export function ResumenKm({ registros, isAdmin }: ResumenKmProps) {
    if (registros.length === 0) {
        return (
            <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
                <Navigation className="w-10 h-10 text-text-muted opacity-40 mx-auto mb-3" />
                <p className="text-text-primary font-medium">Sin registros este mes</p>
                <p className="text-text-muted text-sm mt-1">Los registros de kilometraje aparecerán aquí cuando se calculen rutas.</p>
            </div>
        );
    }

    return (
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-bg-tertiary">
                            <th className="text-left px-4 py-3 text-text-muted font-medium">Fecha</th>
                            <th className="text-right px-4 py-3 text-text-muted font-medium">KM</th>
                            <th className="text-right px-4 py-3 text-text-muted font-medium">Duración</th>
                            <th className="text-right px-4 py-3 text-text-muted font-medium">Estudio</th>
                            <th className="text-right px-4 py-3 text-text-muted font-medium">Perito</th>
                            <th className="text-right px-4 py-3 text-text-muted font-medium">Margen</th>
                            <th className="text-center px-4 py-3 text-text-muted font-medium">Casos</th>
                            <th className="text-center px-4 py-3 text-text-muted font-medium">Ruta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {registros.map(reg => {
                            const margen = (reg.monto_total_estudio || 0) - (reg.monto_total_perito || 0);
                            return (
                                <tr key={reg.id} className="hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="px-4 py-3 text-text-primary font-medium">
                                        {format(new Date(reg.fecha + "T12:00:00"), "EEE dd MMM", { locale: es })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-brand-secondary font-mono font-bold">
                                        {(reg.km_total || 0).toFixed(1)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-text-secondary">
                                        {reg.duracion_estimada_min ? `${reg.duracion_estimada_min} min` : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right text-color-success font-mono">
                                        {formatCurrency(reg.monto_total_estudio || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-text-secondary font-mono">
                                        {formatCurrency(reg.monto_total_perito || 0)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-color-warning font-mono font-medium">
                                        {formatCurrency(margen)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-bg-tertiary text-text-muted text-xs px-2 py-1 rounded-full">
                                            {(reg.casos_ids || []).length}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {reg.ruta_google_maps_url && (
                                                <a href={reg.ruta_google_maps_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-color-info hover:text-text-primary transition-colors" title="Abrir en Google Maps">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            {reg.ruta_waze_url && (
                                                <a href={reg.ruta_waze_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-brand-primary hover:text-text-primary transition-colors" title="Abrir en Waze">
                                                    <Navigation className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
