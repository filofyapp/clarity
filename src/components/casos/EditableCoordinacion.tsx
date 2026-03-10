"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Calendar, Clock, Edit2, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { actualizarDatosCoordinacion } from "@/app/(dashboard)/casos/[id]/actions";

interface EditableCoordinacionProps {
    casoId: string;
    estadoActual: string;
    direccionInicial: string;
    localidadInicial: string;
    fechaProgramadaInicial: string | null;
    rol: string;
}

export default function EditableCoordinacion({
    casoId,
    estadoActual,
    direccionInicial,
    localidadInicial,
    fechaProgramadaInicial,
    rol
}: EditableCoordinacionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial parsing
    const startDateObj = fechaProgramadaInicial ? new Date(fechaProgramadaInicial) : null;

    const [direccion, setDireccion] = useState(direccionInicial || "");
    const [localidad, setLocalidad] = useState(localidadInicial || "");
    const [fechaStr, setFechaStr] = useState(
        startDateObj ? format(startDateObj, "yyyy-MM-dd") : ""
    );
    const [horaStr, setHoraStr] = useState(
        startDateObj ? format(startDateObj, "HH:mm") : ""
    );

    const puedeEditar = (rol === "admin" || rol === "carga") &&
        ["pendiente_coordinacion", "contactado", "ip_coordinada"].includes(estadoActual);

    const handleSave = async () => {
        setIsLoading(true);

        // Armar el ISO string de la fecha nueva
        let dateToSave: string | null = null;
        if (fechaStr) {
            // Combinar fecha + hora o poner hora por defecto
            const unificada = `${fechaStr}T${horaStr || "09:00"}:00-03:00`;
            // Se usa el timezone de Arg (-03:00) o se asume el Date standard de JS si el local influye
            const dateObj = new Date(`${fechaStr}T${horaStr || "09:00"}:00`);
            dateToSave = dateObj.toISOString();
        }

        const datos = {
            direccion_inspeccion: direccion,
            localidad: localidad,
            fecha_inspeccion_programada: dateToSave
        };

        const result = await actualizarDatosCoordinacion(casoId, datos);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Datos de coordinación actualizados");
            setIsEditing(false);
        }
        setIsLoading(false);
    };

    if (!isEditing) {
        return (
            <div className="md:col-span-2 pt-4 border-t border-border/30 relative group">
                {puedeEditar && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="absolute top-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-brand-secondary hover:bg-brand-primary/10 rounded-full"
                        title="Modificar lugar y fecha"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Ubicación para Inspección
                        </p>
                        <p className="font-medium text-text-primary">
                            {direccionInicial || "S/D"}{localidadInicial ? `, ${localidadInicial}` : ""}
                        </p>
                    </div>

                    <div className="flex-1">
                        <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha Programada
                        </p>
                        <p className="font-medium text-text-primary">
                            {fechaProgramadaInicial ? (
                                <>
                                    <span>{format(startDateObj!, "dd 'de' MMMM, yyyy", { locale: es })}</span>
                                    <span className="text-text-muted ml-2 text-sm flex items-center gap-1 inline-flex">
                                        <Clock className="w-3 h-3" /> {format(startDateObj!, "HH:mm")} hs
                                    </span>
                                </>
                            ) : (
                                "A coordinar"
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // MODO EDICIÓN
    return (
        <div className="md:col-span-2 pt-4 border-t border-brand-primary/20 bg-brand-primary/5 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-semibold text-brand-primary flex items-center gap-2 mb-4">
                <Edit2 className="w-4 h-4" /> Editando Coordinación
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Dirección</label>
                    <input
                        type="text"
                        value={direccion}
                        onChange={e => setDireccion(e.target.value)}
                        placeholder="Ej. Av. Mitre 800"
                        className="w-full text-sm bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand-primary outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Localidad</label>
                    <input
                        type="text"
                        value={localidad}
                        onChange={e => setLocalidad(e.target.value)}
                        placeholder="Ej. Avellaneda"
                        className="w-full text-sm bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand-primary outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Fecha</label>
                    <input
                        type="date"
                        value={fechaStr}
                        onChange={e => setFechaStr(e.target.value)}
                        className="w-full text-sm bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand-primary outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                        style={{ colorScheme: "dark" }}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Hora</label>
                    <input
                        type="time"
                        value={horaStr}
                        onChange={e => setHoraStr(e.target.value)}
                        className="w-full text-sm bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand-primary outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                        style={{ colorScheme: "dark" }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <button
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                    <X className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-bg-primary bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
}
