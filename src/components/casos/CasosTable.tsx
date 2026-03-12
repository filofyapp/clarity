"use client";

import { useState, useMemo, useTransition, useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EstadoBadge, estadoStylesRow } from "./EstadoBadge";
import { TipoIPBadge } from "./TipoIPBadge";
import { FilterDropdown, DateFilter } from "./FilterDropdown";
import {
    ChevronRight, ArrowUpDown, Filter, Edit2, Search,
    LayoutList, LayoutGrid, Copy, Trash2, Mail, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { cambiarEstadoCaso } from "@/app/(dashboard)/casos/[id]/actions";
import { updateCasoRapido, eliminarCaso } from "@/app/(dashboard)/casos/actions";

const ESTADOS_DISPONIBLES: Record<string, string> = {
    ip_coordinada: "IP Coordinada",
    pendiente_coordinacion: "Pdte. Coordinación",
    contactado: "Contactado",
    en_consulta_cia: "En Consulta Cía",
    pendiente_carga: "Pdte. Carga",
    pendiente_presupuesto: "Pdte. Presupuesto",
    licitando_repuestos: "Licitando Repuestos",
    ip_reclamada_perito: "Reclamada Perito",
    esperando_respuesta_tercero: "Esp. Respuesta 3°",
    inspeccion_anulada: "Anulada",
    ip_cerrada: "IP Cerrada",
    facturada: "Facturada",
};

const TIPOS_IP: Record<string, string> = {
    ip_con_orden: "IP con Orden",
    posible_dt: "Posible DT",
    ip_sin_orden: "IP sin Orden",
    ampliacion: "Ampliación",
    terceros: "Terceros",
    ausente: "Ausente",
    ip_camiones: "IP Camiones",
    ip_remota: "IP Remota",
    sin_honorarios: "Sin Honorarios",
    ip_final_intermedia: "IP Final/Intermedia"
};

export function CasosTable({ casos, peritos = [], gestores = [], userRol = "admin", hiddenColumns = [] }: { casos: any[], peritos?: any[], gestores?: any[], userRol?: string, hiddenColumns?: string[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Local Storage layout pref
    const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");
    useEffect(() => {
        const saved = localStorage.getItem("clarity_casos_layout");
        if (saved === "grid") setLayoutMode("grid");
    }, []);
    const toggleLayout = (mode: "list" | "grid") => {
        setLayoutMode(mode);
        localStorage.setItem("clarity_casos_layout", mode);
    };

    // --- URL-PARAM BASED FILTERS ---
    const parseParam = (key: string): string[] => {
        const val = searchParams.get(key);
        if (!val) return [];
        return val.split(",").filter(Boolean);
    };

    const filterEstados = parseParam("estado");
    const filterTiposIP = parseParam("tipo_ip");
    const filterPeritosCalle = parseParam("perito_calle");
    const filterPeritosCarga = parseParam("perito_carga");
    const filterGestores = parseParam("gestor");
    const searchQuery = searchParams.get("search") || "";
    const fechaDesde = searchParams.get("fecha_desde") || null;
    const fechaHasta = searchParams.get("fecha_hasta") || null;

    const hasActiveFilters = filterEstados.length > 0 || filterTiposIP.length > 0 || filterPeritosCalle.length > 0 || filterPeritosCarga.length > 0 || filterGestores.length > 0 || searchQuery !== "" || fechaDesde !== null || fechaHasta !== null;

    // Helper to update URL params without full page navigation
    const updateFilter = useCallback((key: string, value: string | string[] | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || (Array.isArray(value) && value.length === 0) || value === "") {
            params.delete(key);
        } else if (Array.isArray(value)) {
            params.set(key, value.join(","));
        } else {
            params.set(key, value);
        }
        router.push(`/casos?${params.toString()}`);
    }, [searchParams, router]);

    const updateMultipleFilters = useCallback((updates: Record<string, string | string[] | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || (Array.isArray(value) && value.length === 0) || value === "") {
                params.delete(key);
            } else if (Array.isArray(value)) {
                params.set(key, value.join(","));
            } else {
                params.set(key, value);
            }
        }
        router.push(`/casos?${params.toString()}`);
    }, [searchParams, router]);

    const clearFilters = () => {
        router.push("/casos");
    };

    // Sort (kept in localStorage since it's a display preference, not a data filter)
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'fecha_derivacion', direction: 'desc' });
    useEffect(() => {
        const saved = localStorage.getItem(`${userRol}_clarity_sort_config`);
        if (saved) { try { setSortConfig(JSON.parse(saved)); } catch {} }
    }, [userRol]);
    useEffect(() => {
        localStorage.setItem(`${userRol}_clarity_sort_config`, JSON.stringify(sortConfig));
    }, [sortConfig, userRol]);

    // Excel-like UX: Keep track of cases that were changed inline so they don't disappear
    const [retainedCaseIds, setRetainedCaseIds] = useState<string[]>([]);

    // Rapid Obvs & Inline Edits
    const [editingNota, setEditingNota] = useState<string | null>(null);
    const [draftNota, setDraftNota] = useState("");
    const [editingField, setEditingField] = useState<{ id: string, field: string, value: string } | null>(null);

    const getEstadosPermitidos = () => {
        if (userRol === "admin" || userRol === "carga") return Object.keys(ESTADOS_DISPONIBLES);
        if (userRol === "calle") return ["contactado"];
        return [];
    };
    const permitidos = getEstadosPermitidos();

    // Helpers for inline actions
    const handleCambiarEstado = (casoId: string, nuevoEstado: string) => {
        setRetainedCaseIds(prev => [...prev, casoId]);
        startTransition(async () => {
            const result = await cambiarEstadoCaso(casoId, nuevoEstado);
            if (result.error) toast.error(result.error);
            else { toast.success(`Estado actualizado`); router.refresh(); }
        });
    };

    const handleUpdateDirect = (casoId: string, field: string, value: string | null) => {
        setRetainedCaseIds(prev => [...prev, casoId]);
        startTransition(async () => {
            const result = await updateCasoRapido(casoId, field, value);
            if (result.error) toast.error(result.error);
            else { toast.success(`Actualizado`); router.refresh(); }
        });
    };

    const handleGuardarNota = (casoId: string) => {
        setRetainedCaseIds(prev => [...prev, casoId]);
        startTransition(async () => {
            const result = await updateCasoRapido(casoId, "notas_admin", draftNota);
            if (result.error) toast.error(result.error);
            else { toast.success(`Nota guardada`); setEditingNota(null); router.refresh(); }
        });
    };

    const handleSaveField = () => {
        if (!editingField) return;
        setRetainedCaseIds(prev => [...prev, editingField.id]);
        startTransition(async () => {
            const result = await updateCasoRapido(editingField.id, editingField.field, editingField.value);
            if (result.error) toast.error(result.error);
            else { toast.success(`Dato actualizado`); setEditingField(null); router.refresh(); }
        });
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleDelete = (id: string, numero_siniestro: string) => {
        if (window.confirm(`ESTÁS A PUNTO DE ELIMINAR EL SINIESTRO ${numero_siniestro}. Esta acción borrará permanentemente todos sus Informes Periciales, Tareas, Fotos y Notas. ¿Deseas continuar?`)) {
            startTransition(async () => {
                toast.loading("Eliminando siniestro...", { id: "delete-caso" });
                const result = await eliminarCaso(id);
                if (result?.error) {
                    toast.error("Error al eliminar", { id: "delete-caso", description: result.error });
                } else {
                    toast.success("Siniestro eliminado correctamente.", { id: "delete-caso" });
                }
            });
        }
    };

    const handleCopyGestor = (gestor: any) => {
        if (!gestor || !gestor.email) {
            toast.error("El gestor no tiene email configurado");
            return;
        }
        navigator.clipboard.writeText(gestor.email);
        toast.success(`Email de ${gestor.nombre} copiado al portapapeles`);
    };

    // Sort Logic — data is already filtered server-side, just sort client-side
    const procesados = useMemo(() => {
        const result = [...casos];
        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (sortConfig.key === 'perito_calle') { valA = a.perito_calle?.nombre || ""; valB = b.perito_calle?.nombre || ""; }
            if (sortConfig.key === 'perito_carga') { valA = a.perito_carga?.nombre || ""; valB = b.perito_carga?.nombre || ""; }
            if (!valA) valA = ""; if (!valB) valB = "";
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [casos, sortConfig]);

    // Derived stats for Summary Bar — counts from the filtered result
    const summaryStats = useMemo(() => {
        const counts: Record<string, number> = {};
        casos.forEach(c => { counts[c.estado] = (counts[c.estado] || 0) + 1; });
        return counts;
    }, [casos]);

    // Search input debounce
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            updateFilter("search", val || null);
        }, 400);
    };


    // Virtualizer
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: layoutMode === "list" ? procesados.length : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44, // 44px height per row
        overscan: 20,
    });



    const formatDays = (dateStr: string) => {
        if (!dateStr) return { days: 0, color: "text-text-muted" };
        const diff = differenceInDays(new Date(), new Date(dateStr));
        let color = "text-text-secondary";
        if (diff > 7) color = "text-color-danger font-bold";
        else if (diff > 3) color = "text-color-warning font-bold";
        else if (diff <= 3) color = "text-color-success";
        return { days: diff, color };
    };

    const getCorto = (nombre_apellido: string) => {
        if (!nombre_apellido || nombre_apellido === "undefined undefined" || nombre_apellido.trim() === "") return { iniciales: "?", nombre: "N/A" };
        const partes = nombre_apellido.split(" ");
        const nombre = partes[0];
        const iniciales = (partes[0]?.[0] || "") + (partes[1]?.[0] || "");
        return { iniciales: iniciales.toUpperCase(), nombre };
    };

    const formatDateVal = (dateStr: string | null) => {
        if (!dateStr) return "-";
        try {
            // Si el dateStr es solo YYYY-MM-DD sin tiempo, forzamos tiempo local al mediodía para evitar UTC shift
            const safeDateStr = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`;
            return format(new Date(safeDateStr), "dd/MM/yy");
        } catch (error) {
            console.error("Error formatting date:", dateStr, error);
            return "-";
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
            {/* TOP BAR / FILTERS */}
            <div className="flex flex-col gap-2 p-3 border-b border-border bg-bg-secondary/50">
                {/* Row 1: Search + View Toggle + Clear */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-text-muted" />
                        <Input
                            type="search"
                            placeholder="Buscar siniestro, patente, marca..."
                            className="pl-9 bg-bg-primary border-border focus-visible:ring-brand-primary h-8 w-full text-xs shadow-none"
                            value={localSearch}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-bg-tertiary p-0.5 rounded-md border border-border">
                        <button onClick={() => toggleLayout("list")} className={`p-1.5 rounded ${layoutMode === "list" ? "bg-bg-primary shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"} transition-all`} title="Vista Tabla">
                            <LayoutList className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleLayout("grid")} className={`p-1.5 rounded ${layoutMode === "grid" ? "bg-bg-primary shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"} transition-all`} title="Vista Tarjetas">
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-7 text-[11px] text-color-danger hover:bg-color-danger-soft/10 px-2"
                        >
                            ✕ Limpiar filtros
                        </Button>
                    )}
                </div>

                {/* Row 2: Quick Estado Clicks + Count */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <BadgeCounter label="Todos" count={casos.length} onClick={() => updateFilter("estado", null)} active={filterEstados.length === 0} />
                    <div className="h-4 w-[1px] bg-border mx-0.5" />
                    {Object.entries(ESTADOS_DISPONIBLES).map(([key, label]) => {
                        const count = summaryStats[key] || 0;
                        const isCritical = ["en_consulta_cia", "pendiente_carga", "pendiente_presupuesto", "ip_reclamada_perito"].includes(key);
                        return (
                            <BadgeCounter
                                key={key}
                                label={label}
                                count={count}
                                dimmed={count === 0}
                                active={filterEstados.includes(key)}
                                critical={isCritical}
                                onClick={() => {
                                    updateFilter("estado", filterEstados.includes(key) ? null : [key]);
                                }}
                            />
                        );
                    })}
                </div>

                {/* Row 3: Advanced filters (FilterDropdown components) */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mr-1"><Filter className="w-3 h-3 inline mr-0.5" />Filtros</span>

                    <FilterDropdown
                        label="Estado"
                        options={Object.entries(ESTADOS_DISPONIBLES).map(([k, v]) => ({ id: k, label: v }))}
                        selected={filterEstados}
                        onChange={(sel) => updateFilter("estado", sel)}
                    />

                    <FilterDropdown
                        label="Tipo IP"
                        options={Object.entries(TIPOS_IP).map(([k, v]) => ({ id: k, label: v }))}
                        selected={filterTiposIP}
                        onChange={(sel) => updateFilter("tipo_ip", sel)}
                    />

                    <FilterDropdown
                        label="P. Calle"
                        options={peritos.map(p => ({ id: p.id, label: `${p.nombre} ${p.apellido}` }))}
                        selected={filterPeritosCalle}
                        onChange={(sel) => updateFilter("perito_calle", sel)}
                    />

                    <FilterDropdown
                        label="P. Carga"
                        options={peritos.map(p => ({ id: p.id, label: `${p.nombre} ${p.apellido}` }))}
                        selected={filterPeritosCarga}
                        onChange={(sel) => updateFilter("perito_carga", sel)}
                    />

                    <FilterDropdown
                        label="Gestor"
                        options={gestores.map(g => ({ id: g.id, label: g.nombre }))}
                        selected={filterGestores}
                        onChange={(sel) => updateFilter("gestor", sel)}
                    />

                    <DateFilter
                        label="Fecha"
                        fechaDesde={fechaDesde}
                        fechaHasta={fechaHasta}
                        onChange={(desde, hasta) => updateMultipleFilters({ fecha_desde: desde, fecha_hasta: hasta })}
                    />
                </div>
            </div>
            {/* MAIN TABLE OR GRID CONTAINER */}
            {procesados.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3 p-8">
                    <p className="text-sm">No hay casos que coincidan con los filtros aplicados.</p>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-xs text-brand-primary hover:underline font-medium">
                            ✕ Limpiar filtros y ver todos
                        </button>
                    )}
                </div>
            ) : layoutMode === "list" ? (
                <div className="flex-1 overflow-auto bg-bg-primary relative" ref={parentRef}>
                    <div className="min-w-max w-full flex flex-col pointer-events-auto">
                        {/* THEAD */}
                        <div className="flex sticky top-0 z-20 bg-bg-secondary shadow-[0_1px_0_var(--tw-shadow-color)] shadow-border font-medium text-[11px] text-text-muted uppercase select-none backdrop-blur-md tracking-wider pl-[3px]">
                            <div className="w-[90px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_derivacion')}>
                                Ingreso <ArrowUpDown className="w-3 h-3" />
                            </div>
                            <div className="w-[130px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1 text-text-primary font-bold" onClick={() => handleSort('numero_siniestro')}>Siniestro <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[100px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('numero_servicio')}>Servicio <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[180px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('estado')}>Estado <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[60px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center justify-center gap-1" onClick={() => handleSort('updated_at')}>Días <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[140px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('tipo_inspeccion')}>Tipo IP <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[300px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('dominio')}>Vehículo <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[90px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('dominio')}>Patente <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[150px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('perito_calle')}>P. Calle <ArrowUpDown className="w-3 h-3" /></div>

                            {!hiddenColumns.includes("perito_carga") && (
                                <div className="w-[150px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('perito_carga')}>P. Carga <ArrowUpDown className="w-3 h-3" /></div>
                            )}

                            <div className="w-[130px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('gestor')}>Gestor <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[95px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_inspeccion_programada')}>Fecha IP <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[95px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_carga_sistema')}>F. Carga <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[95px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_cierre')}>F. Cierre <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[100px] shrink-0 px-2 py-2.5"></div>
                        </div>
                        {/* TBODY VIRTUALIZED */}
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }} className="w-full">
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const caso = procesados[virtualRow.index];
                                const rowColor = estadoStylesRow[caso.estado] || 'bg-bg-primary hover:bg-bg-tertiary';
                                const { days, color: daysColor } = formatDays(caso.updated_at);
                                const pCalle = getCorto(caso.perito_calle?.nombre + " " + caso.perito_calle?.apellido);
                                const pCarga = getCorto(caso.perito_carga?.nombre + " " + caso.perito_carga?.apellido);

                                const isFacturada = caso.estado === "facturada";
                                const textPrimary = isFacturada ? "text-gray-400" : "text-text-primary";
                                const textSecondary = isFacturada ? "text-gray-500" : "text-text-secondary";
                                const textMuted = isFacturada ? "text-gray-600/50" : "text-text-muted";

                                return (
                                    <div
                                        key={caso.id}
                                        className={`absolute top-0 left-0 w-full flex border-b border-border/50 text-[13px] transition-colors duration-150 group/row items-center cursor-default ${rowColor} ${isFacturada ? "opacity-75 grayscale" : ""} ${caso.notas_admin ? "border-l-[3px] border-l-brand-primary" : "border-l-[3px] border-l-transparent"}`}
                                        style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                                    >
                                        <div className="w-[95px] shrink-0 px-2 py-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis text-[13px] font-medium text-text-muted">
                                            {formatDateVal(caso.fecha_derivacion)}
                                        </div>

                                        <div className="w-[130px] shrink-0 px-2 py-1 flex items-center group/cell relative">
                                            {editingField?.id === caso.id && editingField?.field === "numero_siniestro" ? (
                                                <Input autoFocus className="h-7 text-[13px] px-1.5 w-full bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => setEditingField({ ...editingField, value: e.target.value })} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <Link href={`/casos/${caso.id}`} className={`truncate font-mono font-black hover:underline hover:brightness-125 transition-all text-[15px] tracking-tight ${textPrimary}`}>{caso.numero_siniestro}</Link>
                                                        {caso.tiene_respuesta_gestor && (
                                                            <span title="Respuesta del gestor sin leer">
                                                                <Mail size={14} className="text-[#D6006E] shrink-0" />
                                                            </span>
                                                        )}
                                                        {caso.notas_admin && (
                                                            <span title="Contiene notas internas">
                                                                <MessageSquare size={13} strokeWidth={2.5} className="text-brand-primary shrink-0 opacity-80" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "numero_siniestro", value: caso.numero_siniestro || "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary absolute right-1 bg-bg-primary rounded">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Editable Servicio */}
                                        <div className="w-[100px] shrink-0 px-2 py-1 flex items-center group/cell relative">
                                            {editingField?.id === caso.id && editingField?.field === "numero_servicio" ? (
                                                <Input autoFocus className="h-7 text-[12px] px-1.5 w-full bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => setEditingField({ ...editingField, value: e.target.value })} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                                            ) : (
                                                <>
                                                    <span className={`truncate flex-1 text-[13px] font-medium text-text-primary`}>{caso.numero_servicio || "-"}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "numero_servicio", value: caso.numero_servicio || "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary absolute right-1 rounded">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="w-[180px] shrink-0 px-2 py-1">
                                            {permitidos.length > 0 ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="cursor-pointer hover:brightness-110 active:scale-95 transition-all outline-none inline-block max-w-full">
                                                            <EstadoBadge estado={caso.estado} />
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[180px] text-[13px] bg-bg-elevated border border-border z-50">
                                                        {permitidos.map(e => (
                                                            <DropdownMenuItem key={e} onClick={() => handleCambiarEstado(caso.id, e)} className="cursor-pointer hover:bg-bg-tertiary">
                                                                <EstadoBadge estado={e} />
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <EstadoBadge estado={caso.estado} />
                                            )}
                                        </div>

                                        <div className={`w-[60px] shrink-0 px-2 py-1 text-[12px] text-center ${daysColor}`}>
                                            {days}d
                                        </div>

                                        <div className="w-[140px] shrink-0 px-2 py-1">
                                            {userRol === "admin" || userRol === "carga" ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="cursor-pointer hover:brightness-110 active:scale-95 transition-all outline-none inline-block">
                                                            <TipoIPBadge tipo={caso.tipo_inspeccion} />
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[160px] text-[13px] bg-bg-elevated border border-border z-50">
                                                        {Object.entries(TIPOS_IP).map(([k, v]) => (
                                                            <DropdownMenuItem key={k} onClick={() => handleUpdateDirect(caso.id, "tipo_inspeccion", k)} className="cursor-pointer">
                                                                {v}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <TipoIPBadge tipo={caso.tipo_inspeccion} />
                                            )}
                                        </div>

                                        {/* Editable Vehículo */}
                                        <div className="w-[300px] shrink-0 px-2 py-1 flex items-center group/cell relative">
                                            {editingField?.id === caso.id && editingField?.field === "marca" ? (
                                                <div className="flex w-full gap-1">
                                                    <Input autoFocus placeholder="Marca" className="h-7 text-[12px] px-1.5 w-1/2 bg-bg-elevated border-brand-primary" value={editingField.value.split("|")[0] || ""} onChange={e => setEditingField({ ...editingField, value: `${e.target.value}|${editingField.value.split("|")[1] || ""}` })} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                                                    <Input placeholder="Modelo" className="h-7 text-[12px] px-1.5 w-1/2 bg-bg-elevated border-brand-primary" value={editingField.value.split("|")[1] || ""} onChange={e => setEditingField({ ...editingField, value: `${editingField.value.split("|")[0] || ""}|${e.target.value}` })} onBlur={() => {
                                                        const m = editingField.value.split("|")[0]?.trim();
                                                        const mo = editingField.value.split("|")[1]?.trim();
                                                        startTransition(async () => {
                                                            await updateCasoRapido(caso.id, "marca", m);
                                                            await updateCasoRapido(caso.id, "modelo", mo);
                                                            router.refresh();
                                                            setEditingField(null);
                                                            toast.success("Vehículo actualizado");
                                                        });
                                                    }} onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            const m = editingField.value.split("|")[0]?.trim();
                                                            const mo = editingField.value.split("|")[1]?.trim();
                                                            startTransition(async () => {
                                                                await updateCasoRapido(caso.id, "marca", m);
                                                                await updateCasoRapido(caso.id, "modelo", mo);
                                                                router.refresh();
                                                                setEditingField(null);
                                                                toast.success("Vehículo actualizado");
                                                            });
                                                        }
                                                    }} />
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="truncate flex-1 text-text-secondary text-[13px]">{caso.marca} {caso.modelo}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "marca", value: `${caso.marca || ""}|${caso.modelo || ""}` })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Editable Patente */}
                                        <div className="w-[90px] shrink-0 px-2 py-1 flex items-center group/cell">
                                            {editingField?.id === caso.id && editingField?.field === "dominio" ? (
                                                <Input autoFocus className="h-7 text-[12px] px-1.5 w-full uppercase font-mono bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => setEditingField({ ...editingField, value: e.target.value })} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                                            ) : (
                                                <>
                                                    <span className={`truncate flex-1 font-mono uppercase text-[13px] ${textPrimary}`}>{caso.dominio || "-"}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "dominio", value: caso.dominio || "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Perito Dropdowns */}
                                        <div className="w-[150px] shrink-0 px-2 py-1" title={caso.perito_calle?.nombre + " " + caso.perito_calle?.apellido}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="flex items-center gap-1.5 cursor-pointer max-w-full hover:bg-bg-tertiary p-1 rounded transition-colors group/pcalle">
                                                        <span className={`truncate text-[13px] group-hover/pcalle:text-text-primary ${textSecondary}`}>{caso.perito_calle ? `${caso.perito_calle.nombre} ${caso.perito_calle.apellido}` : "Sin asignado"}</span>
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-auto bg-bg-elevated border border-border z-50">
                                                    <DropdownMenuItem onClick={() => handleUpdateDirect(caso.id, "perito_calle_id", null)} className="text-[13px] text-text-muted italic">Sin Perito</DropdownMenuItem>
                                                    {peritos.map((p) => (
                                                        <DropdownMenuItem key={p.id} onClick={() => handleUpdateDirect(caso.id, "perito_calle_id", p.id)} className="text-[13px]">
                                                            {p.nombre} {p.apellido}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {!hiddenColumns.includes("perito_carga") && (
                                            <div className="w-[150px] shrink-0 px-2 py-1" title={caso.perito_carga?.nombre + " " + caso.perito_carga?.apellido}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="flex items-center gap-1.5 cursor-pointer max-w-full hover:bg-bg-tertiary p-1 rounded transition-colors group/pcarga">
                                                            <span className={`truncate text-[13px] group-hover/pcarga:text-text-primary ${textSecondary}`}>{caso.perito_carga ? `${caso.perito_carga.nombre} ${caso.perito_carga.apellido}` : "Sin asignado"}</span>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-auto bg-bg-elevated border border-border z-50">
                                                        <DropdownMenuItem onClick={() => handleUpdateDirect(caso.id, "perito_carga_id", null)} className="text-[13px] text-text-muted italic">Sin Perito</DropdownMenuItem>
                                                        {peritos.map((p) => (
                                                            <DropdownMenuItem key={p.id} onClick={() => handleUpdateDirect(caso.id, "perito_carga_id", p.id)} className="text-[13px]">
                                                                {p.nombre} {p.apellido}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}

                                        {/* Gestor: Click → copy email, Pencil → edit dropdown */}
                                        <div className="w-[130px] shrink-0 px-2 py-1 flex items-center group/cell" title={caso.gestor?.email || caso.gestor?.nombre}>
                                            <span
                                                className={`truncate flex-1 text-[13px] cursor-pointer hover:text-brand-primary hover:underline transition-colors ${textSecondary}`}
                                                onClick={() => handleCopyGestor(caso.gestor)}
                                            >
                                                {caso.gestor?.nombre || "Sin Asignar"}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-auto bg-bg-elevated border border-border z-50">
                                                    <DropdownMenuItem onClick={() => handleUpdateDirect(caso.id, "gestor_id", null)} className="text-[13px] text-text-muted italic">Sin Gestor</DropdownMenuItem>
                                                    {gestores.map((g) => (
                                                        <DropdownMenuItem key={g.id} onClick={() => handleUpdateDirect(caso.id, "gestor_id", g.id)} className="text-[13px]">
                                                            {g.nombre}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Editable Fecha IP */}
                                        <div className="w-[90px] shrink-0 px-2 py-1 flex items-center group/cell">
                                            {editingField?.id === caso.id && editingField?.field === "fecha_inspeccion_programada" ? (
                                                <Input type="date" autoFocus className="h-7 text-[10px] px-1 w-full bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => {
                                                    // When selecting a date, 'e.target.value' is YYYY-MM-DD.
                                                    setEditingField({ ...editingField, value: e.target.value });
                                                }} onBlur={() => {
                                                    // Append time to prevent UTC midnight offset day shift
                                                    if (editingField.value && !editingField.value.includes("T")) {
                                                        editingField.value = `${editingField.value}T12:00:00-03:00`;
                                                    }
                                                    handleSaveField();
                                                }} onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        if (editingField.value && !editingField.value.includes("T")) {
                                                            editingField.value = `${editingField.value}T12:00:00-03:00`;
                                                        }
                                                        handleSaveField();
                                                    }
                                                }} />
                                            ) : (
                                                <>
                                                    <span className={`truncate flex-1 text-[12px] whitespace-nowrap ${textSecondary}`}>{formatDateVal(caso.fecha_inspeccion_programada)}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "fecha_inspeccion_programada", value: caso.fecha_inspeccion_programada ? caso.fecha_inspeccion_programada.split("T")[0] : "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className={`w-[90px] shrink-0 px-2 py-1 text-[12px] whitespace-nowrap ${textMuted}`}>
                                            {formatDateVal(caso.fecha_carga_sistema)}
                                        </div>

                                        {/* Editable Fecha Cierre */}
                                        <div className="w-[90px] shrink-0 px-2 py-1 flex items-center group/cell">
                                            {editingField?.id === caso.id && editingField?.field === "fecha_cierre" ? (
                                                <Input type="date" autoFocus className="h-7 text-[10px] px-1 w-full bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => {
                                                    setEditingField({ ...editingField, value: e.target.value });
                                                }} onBlur={() => {
                                                    if (editingField.value && !editingField.value.includes("T")) {
                                                        editingField.value = `${editingField.value}T12:00:00-03:00`;
                                                    }
                                                    handleSaveField();
                                                }} onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        if (editingField.value && !editingField.value.includes("T")) {
                                                            editingField.value = `${editingField.value}T12:00:00-03:00`;
                                                        }
                                                        handleSaveField();
                                                    }
                                                }} />
                                            ) : (
                                                <>
                                                    <span className={`truncate flex-1 text-[12px] whitespace-nowrap ${textSecondary}`}>{formatDateVal(caso.fecha_cierre)}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "fecha_cierre", value: caso.fecha_cierre ? caso.fecha_cierre.split("T")[0] : "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {/* ACCIONES - FLEX PARA ABSORBER ESPACIO */}
                                        <div className="flex-1 min-w-[120px] shrink-0 px-2 py-1 flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <Popover open={editingNota === caso.id} onOpenChange={(o: boolean) => {
                                                if (o) { setEditingNota(caso.id); setDraftNota(caso.notas_admin || ""); }
                                                else setEditingNota(null);
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <button className="p-1 rounded text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors relative" title="Observaciones rápidas">
                                                        <Search className="w-4 h-4" />
                                                        {caso.notas_admin && <div className="absolute top-0 right-0 w-[5px] h-[5px] rounded-full bg-brand-primary" />}
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent align="end" className="w-[280px] p-3 text-sm flex flex-col gap-2 bg-bg-elevated border border-border z-50">
                                                    <span className="font-semibold text-text-primary text-xs">Nota Admin</span>
                                                    <Textarea
                                                        value={draftNota}
                                                        onChange={(e) => setDraftNota(e.target.value)}
                                                        placeholder="Escribe una observación rápida aquí..."
                                                        className="min-h-[80px] text-xs resize-none bg-bg-primary"
                                                    />
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingNota(null)} className="h-7 text-xs">Cancelar</Button>
                                                        <Button size="sm" onClick={() => handleGuardarNota(caso.id)} className="h-7 text-xs bg-brand-primary text-white">Guardar</Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <Link href={`/casos/${caso.id}`}>
                                                <button className="p-1 rounded text-text-secondary hover:text-brand-primary hover:bg-bg-tertiary transition-colors" title="Abrir Expediente">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <button
                                                disabled={isPending}
                                                onClick={() => handleDelete(caso.id, caso.numero_siniestro)}
                                                className="p-1 rounded text-text-muted hover:text-white hover:bg-error transition-colors"
                                                title="Eliminar Siniestro"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-error hover:text-white" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-4 bg-bg-primary">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {procesados.map(caso => {
                            const { days, color: daysColor } = formatDays(caso.updated_at);
                            const pCalle = getCorto(caso.perito_calle?.nombre + " " + caso.perito_calle?.apellido);
                            const isFacturada = caso.estado === "facturada";
                            const bgClass = isFacturada ? "bg-[#111] border-[#222]" : "bg-bg-secondary border-border hover:border-brand-primary/50";
                            const textPrimary = isFacturada ? "text-gray-400" : "text-text-primary";
                            const textSecondary = isFacturada ? "text-gray-500" : "text-text-secondary";
                            const textMuted = isFacturada ? "text-gray-600/60" : "text-text-muted";
                            const wrapperOpacity = isFacturada ? "opacity-75 grayscale" : "";

                            return (
                                <Link href={`/casos/${caso.id}`} key={caso.id} className={`p-3 border shadow-sm rounded-lg transition-colors flex flex-col gap-3 group ${bgClass} ${wrapperOpacity}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-mono font-bold text-sm truncate ${textPrimary}`}>{caso.numero_siniestro}</span>
                                                {caso.tiene_respuesta_gestor && (
                                                    <span title="Respuesta del gestor sin leer">
                                                        <Mail size={14} className="text-[#D6006E] shrink-0" />
                                                    </span>
                                                )}
                                                {caso.notas_admin && (
                                                    <span title="Contiene notas internas">
                                                        <MessageSquare size={13} strokeWidth={2.5} className="text-brand-primary shrink-0 opacity-80" />
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] truncate ${textMuted}`}>Ingreso: {formatDateVal(caso.fecha_derivacion)}</span>
                                        </div>
                                        <EstadoBadge estado={caso.estado} compacto />
                                    </div>
                                    <div className={`text-xs ${textSecondary}`}>
                                        <div className="truncate font-medium">{caso.marca} {caso.modelo}</div>
                                        <div className={`truncate font-mono uppercase text-[11px] mt-0.5 ${textMuted}`}>{caso.dominio || "Sin Datos"}</div>
                                    </div>
                                    <div className="flex justify-between items-end mt-auto pt-2 border-t border-border/50">
                                        <div className="flex flex-col gap-1">
                                            <TipoIPBadge tipo={caso.tipo_inspeccion} compacto />
                                            {caso.perito_calle && <span className="text-[10px] text-brand-primary whitespace-nowrap">Calle: {pCalle.nombre}</span>}
                                            {caso.perito_carga && <span className="text-[10px] text-brand-secondary whitespace-nowrap">Carga: {getCorto(caso.perito_carga.nombre + " " + caso.perito_carga.apellido).nombre}</span>}
                                            {caso.gestor && (
                                                <button onClick={(e) => { e.preventDefault(); handleCopyGestor(caso.gestor); }} className="text-[10px] text-brand-tertiary flex items-center gap-1 hover:underline text-left">
                                                    Gestor: {caso.gestor.nombre} <Copy className="w-2.5 h-2.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`text-[11px] scale-90 ${daysColor}`}>{days} días inactivo</span>
                                            <button
                                                disabled={isPending}
                                                onClick={(e) => { e.preventDefault(); handleDelete(caso.id, caso.numero_siniestro); }}
                                                className="p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                                                title="Eliminar Siniestro"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function BadgeCounter({ label, count, active, onClick, dimmed, critical }: { label: string, count: number, active?: boolean, onClick?: () => void, dimmed?: boolean, critical?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all whitespace-nowrap
                ${active ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-primary font-bold pr-3'
                    : critical && count > 0 ? 'bg-color-danger-soft border-color-danger/20 text-text-primary hover:bg-color-danger/20 font-semibold'
                        : 'bg-bg-tertiary border-border text-text-secondary hover:bg-bg-elevated'}
                ${dimmed && !active ? 'opacity-40 hover:opacity-100' : ''}
            `}
        >
            <span className="truncate">{label}</span>
            <span className={`px-1.5 rounded-full bg-bg-primary text-[10px] tabular-nums ${(active && count > 0) ? "text-brand-primary font-bold shadow-sm" : critical && count > 0 ? "text-color-danger font-bold" : ""}`}>{count}</span>
        </button>
    );
}
