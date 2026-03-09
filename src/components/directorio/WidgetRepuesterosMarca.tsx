"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CarFront, Phone, MessageCircle, Mail, MapPin } from "lucide-react";

interface WidgetRepuesterosMarcaProps {
    marcaVehiculo: string;
}

interface Repuestero {
    id: string;
    nombre: string;
    telefono: string;
    whatsapp: string | null;
    email: string | null;
    direccion: string | null;
    localidad: string | null;
}

export function WidgetRepuesterosMarca({ marcaVehiculo }: WidgetRepuesterosMarcaProps) {
    const supabase = createClient();
    const [proveedores, setProveedores] = useState<Repuestero[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRepuesteros() {
            if (!marcaVehiculo) return;
            setLoading(true);

            // Fetch proveedores that have the specific brand associated in the join table
            const { data, error } = await supabase
                .from("repuestero_marcas")
                .select(`
                    repuestero_id,
                    repuesteros (
                        id, nombre, telefono, whatsapp, email, direccion, localidad
                    )
                `)
                .eq("marca", marcaVehiculo)
                // Filter inner join results ensuring they are active suppliers
                .eq("repuesteros.activo", true);

            if (!error && data) {
                // Format nested supabase inner joins natively flattening them.
                const validProveedores = data
                    .map((row: any) => row.repuesteros)
                    .filter(Boolean);

                setProveedores(validProveedores);
            }
            setLoading(false);
        }

        // Timeout to allow UI smoothness avoiding immediate jitter
        const timer = setTimeout(() => {
            fetchRepuesteros();
        }, 300);
        return () => clearTimeout(timer);
    }, [marcaVehiculo, supabase]);

    if (loading) {
        return (
            <div className="bg-bg-tertiary border border-border rounded-lg p-5 animate-pulse h-32 mt-6"></div>
        );
    }

    if (proveedores.length === 0) {
        return (
            <div className="bg-bg-secondary border border-border rounded-lg p-5 text-center mt-6">
                <CarFront className="w-8 h-8 text-text-muted opacity-50 mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary mb-1">Cero coincidencias</p>
                <p className="text-xs text-text-muted">No existen proveedores de <strong className="text-text-primary">{marcaVehiculo}</strong> en la base de datos.</p>
            </div>
        );
    }

    return (
        <div className="bg-bg-secondary border border-border rounded-lg p-5 mt-6 animate-in slide-in-from-bottom-2">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                <CarFront className="w-4 h-4 text-brand-secondary" />
                Proveedores Oficiales de {marcaVehiculo} ({proveedores.length})
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {proveedores.map(prov => (
                    <div key={prov.id} className="bg-bg-tertiary p-3 rounded-md border border-border/50 hover:bg-bg-elevated transition-colors">
                        <p className="font-semibold text-text-primary text-sm mb-2">{prov.nombre}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
                            {prov.telefono && (
                                <a href={`tel:${prov.telefono}`} className="flex items-center gap-2 hover:text-brand-secondary">
                                    <Phone className="w-3 h-3" /> {prov.telefono}
                                </a>
                            )}
                            {prov.whatsapp && (
                                <a href={`https://wa.me/${prov.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-color-success">
                                    <MessageCircle className="w-3 h-3" /> WhatsApp
                                </a>
                            )}
                            {prov.email && (
                                <a href={`mailto:${prov.email}`} className="flex items-center gap-2 hover:text-text-primary truncate">
                                    <Mail className="w-3 h-3 shrink-0" /> {prov.email}
                                </a>
                            )}
                            {(prov.direccion || prov.localidad) && (
                                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 truncate">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {prov.direccion}{prov.direccion && prov.localidad ? ', ' : ''}{prov.localidad}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
