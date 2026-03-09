"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, differenceInDays, isSameWeek, isSameMonth, isToday } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EstadoBadge, estadoStylesRow } from "./EstadoBadge";
import { TipoIPBadge } from "./TipoIPBadge";
import {
    ChevronRight, ArrowUpDown, Filter, Edit2, Search, SearchIcon,
    LayoutList, LayoutGrid, Copy, Trash2
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

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterEstados, setFilterEstados] = useState<string[]>([]);
    const [filterTiposIP, setFilterTiposIP] = useState<string[]>([]);
    const [filterPeritosCalle, setFilterPeritosCalle] = useState<string[]>([]);
    const [filterPeritosCarga, setFilterPeritosCarga] = useState<string[]>([]);
    const [filterGestores, setFilterGestores] = useState<string[]>([]);
    const [filterProgramada, setFilterProgramada] = useState<string | null>(null);
    const [filterDateRange, setFilterDateRange] = useState<"hoy" | "semana" | "mes" | null>(null);

    // Sort
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'fecha_derivacion',
        direction: 'desc'
    });

    // Rapid Obvs & Inline Edits
    const [editingNota, setEditingNota] = useState<string | null>(null);
    const [draftNota, setDraftNota] = useState("");
    const [editingField, setEditingField] = useState<{ id: string, field: string, value: string } | null>(null);

    const getEstadosPermitidos = () => {
        if (userRol === "admin") return Object.keys(ESTADOS_DISPONIBLES);
        if (userRol === "carga") return ["licitando_repuestos", "ip_cerrada", "ip_reclamada_perito", "esperando_respuesta_tercero", "pendiente_presupuesto"];
        if (userRol === "calle") return ["contactado"];
        return [];
    };
    const permitidos = getEstadosPermitidos();

    // Helpers for inline actions
    const handleCambiarEstado = (casoId: string, nuevoEstado: string) => {
        startTransition(async () => {
            const result = await cambiarEstadoCaso(casoId, nuevoEstado);
            if (result.error) toast.error(result.error);
            else { toast.success(`Estado actualizado`); router.refresh(); }
        });
    };

    const handleUpdateDirect = (casoId: string, field: string, value: string | null) => {
        startTransition(async () => {
            const result = await updateCasoRapido(casoId, field, value);
            if (result.error) toast.error(result.error);
            else { toast.success(`Actualizado`); router.refresh(); }
        });
    };

    const handleGuardarNota = (casoId: string) => {
        startTransition(async () => {
            const result = await updateCasoRapido(casoId, "notas_admin", draftNota);
            if (result.error) toast.error(result.error);
            else { toast.success(`Nota guardada`); setEditingNota(null); router.refresh(); }
        });
    };

    const handleSaveField = () => {
        if (!editingField) return;
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

    // Filter Logic
    const procesados = useMemo(() => {
        let result = [...casos];
        if (searchQuery.trim() !== "") {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(c => c.numero_siniestro?.toLowerCase().includes(lowerQuery) || c.dominio?.toLowerCase().includes(lowerQuery) || (c.marca && c.marca.toLowerCase().includes(lowerQuery)) || (c.modelo && c.modelo.toLowerCase().includes(lowerQuery)));
        }
        if (filterEstados.length > 0) result = result.filter(c => filterEstados.includes(c.estado));
        if (filterTiposIP.length > 0) result = result.filter(c => filterTiposIP.includes(c.tipo_inspeccion));
        if (filterPeritosCalle.length > 0) result = result.filter(c => filterPeritosCalle.includes(c.perito_calle_id));
        if (filterPeritosCarga.length > 0) result = result.filter(c => filterPeritosCarga.includes(c.perito_carga_id));
        if (filterGestores.length > 0) result = result.filter(c => filterGestores.includes(c.gestor_id));
        if (filterProgramada === "con_fecha") result = result.filter(c => c.fecha_inspeccion_programada);
        if (filterProgramada === "sin_fecha") result = result.filter(c => !c.fecha_inspeccion_programada);
        if (filterDateRange) {
            const now = new Date();
            result = result.filter(c => {
                const date = new Date(c.fecha_derivacion);
                if (filterDateRange === "hoy") return isToday(date);
                if (filterDateRange === "semana") return isSameWeek(date, now, { weekStartsOn: 1 });
                if (filterDateRange === "mes") return isSameMonth(date, now);
                return true;
            });
        }
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
    }, [casos, sortConfig, filterEstados, filterTiposIP, filterPeritosCalle, filterPeritosCarga, filterGestores, searchQuery, filterProgramada, filterDateRange]);

    // Derived stats for Summary Bar
    const summaryStats = useMemo(() => {
        const counts: Record<string, number> = {};
        casos.forEach(c => { counts[c.estado] = (counts[c.estado] || 0) + 1; });
        return counts;
    }, [casos]);


    // Virtualizer
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
        count: layoutMode === "list" ? procesados.length : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44, // 44px height per row
        overscan: 20,
    });


    if (!casos || casos.length === 0) return (<div className="flex h-48 items-center justify-center text-text-muted">No hay casos.</div>);

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

    const formatDateVal = (dateStr: string) => dateStr ? format(new Date(dateStr), "dd/MM/yy") : "-";

    return (
        <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
            {/* TOP BAR / FILTERS */}
            <div className="flex flex-col gap-3 p-4 border-b border-border bg-bg-secondary/50">
                {/* View Toggles & Global Search */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-bg-tertiary p-1 rounded-md border border-border">
                        <button onClick={() => toggleLayout("list")} className={`p-1.5 rounded ${layoutMode === "list" ? "bg-bg-primary shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"} transition-all`} title="Vista Densa (Spreadsheet)">
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleLayout("grid")} className={`p-1.5 rounded ${layoutMode === "grid" ? "bg-bg-primary shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"} transition-all`} title="Vista de Grilla">
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Summary Bar */}
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar mask-edges min-w-0 pointer-events-auto shrink">
                        <BadgeCounter label="Total" count={casos.length} onClick={() => setFilterEstados([])} active={filterEstados.length === 0} />
                        <div className="h-4 w-[1px] bg-border mx-1" />
                        {Object.entries(ESTADOS_DISPONIBLES).map(([key, label]) => {
                            const count = summaryStats[key] || 0;
                            return (
                                <BadgeCounter
                                    key={key}
                                    label={label}
                                    count={count}
                                    dimmed={count === 0}
                                    active={filterEstados.includes(key)}
                                    onClick={() => {
                                        setFilterEstados(prev => prev.includes(key) ? prev.filter(k => k !== key) : [key]);
                                    }}
                                />
                            );
                        })}
                    </div>

                    <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                        <Input
                            type="search"
                            placeholder="Buscar patente o siniestro..."
                            className="pl-9 bg-bg-primary border-border focus-visible:ring-brand-primary h-9 w-full text-xs shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Advanced Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-text-muted mr-1"><Filter className="w-3.5 h-3.5 inline mr-1" /> Filtros:</span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed px-2 bg-bg-primary">
                                Estado {filterEstados.length > 0 && `(${filterEstados.length})`}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px] bg-bg-elevated border border-border z-50">
                            {Object.entries(ESTADOS_DISPONIBLES).map(([k, v]) => (
                                <DropdownMenuCheckboxItem key={k} className="text-xs" checked={filterEstados.includes(k)} onCheckedChange={(c) => setFilterEstados(p => c ? [...p, k] : p.filter(e => e !== k))}>
                                    {v}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed px-2 bg-bg-primary">
                                Tipo IP {filterTiposIP.length > 0 && `(${filterTiposIP.length})`}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px] bg-bg-elevated border border-border z-50">
                            {Object.entries(TIPOS_IP).map(([k, v]) => (
                                <DropdownMenuCheckboxItem key={k} className="text-xs" checked={filterTiposIP.includes(k)} onCheckedChange={(c) => setFilterTiposIP(p => c ? [...p, k] : p.filter(e => e !== k))}>
                                    {v}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed px-2 bg-bg-primary">
                                P. Calle {filterPeritosCalle.length > 0 && `(${filterPeritosCalle.length})`}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px] bg-bg-elevated border border-border z-50">
                            {peritos.map((p) => (
                                <DropdownMenuCheckboxItem key={p.id} className="text-xs" checked={filterPeritosCalle.includes(p.id)} onCheckedChange={(c) => setFilterPeritosCalle(pr => c ? [...pr, p.id] : pr.filter(e => e !== p.id))}>
                                    {p.nombre} {p.apellido}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed px-2 bg-bg-primary">
                                P. Carga {filterPeritosCarga.length > 0 && `(${filterPeritosCarga.length})`}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px] bg-bg-elevated border border-border z-50">
                            {peritos.map((p) => (
                                <DropdownMenuCheckboxItem key={p.id} className="text-xs" checked={filterPeritosCarga.includes(p.id)} onCheckedChange={(c) => setFilterPeritosCarga(pr => c ? [...pr, p.id] : pr.filter(e => e !== p.id))}>
                                    {p.nombre} {p.apellido}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed px-2 bg-bg-primary">
                                Gestor {filterGestores.length > 0 && `(${filterGestores.length})`}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px] bg-bg-elevated border border-border z-50">
                            {gestores.map((g) => (
                                <DropdownMenuCheckboxItem key={g.id} className="text-xs" checked={filterGestores.includes(g.id)} onCheckedChange={(c) => setFilterGestores(pr => c ? [...pr, g.id] : pr.filter(e => e !== g.id))}>
                                    {g.nombre}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed px-2 bg-bg-primary">
                                Fechas {filterDateRange && `(${filterDateRange})`}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px] bg-bg-elevated border border-border z-50">
                            <DropdownMenuLabel className="text-[10px] text-text-muted">Rápido</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem checked={filterDateRange === "hoy"} onCheckedChange={(c) => setFilterDateRange(c ? "hoy" : null)} className="text-xs">Hoy</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterDateRange === "semana"} onCheckedChange={(c) => setFilterDateRange(c ? "semana" : null)} className="text-xs">Esta semana</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterDateRange === "mes"} onCheckedChange={(c) => setFilterDateRange(c ? "mes" : null)} className="text-xs">Este mes</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(filterEstados.length > 0 || filterTiposIP.length > 0 || filterPeritosCalle.length > 0 || filterPeritosCarga.length > 0 || filterGestores.length > 0 || filterDateRange || filterProgramada) && (
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] text-color-danger hover:bg-color-danger-soft/10 px-2 ml-auto" onClick={() => {
                            setFilterEstados([]); setFilterTiposIP([]); setFilterPeritosCalle([]); setFilterPeritosCarga([]); setFilterGestores([]); setFilterDateRange(null); setFilterProgramada(null);
                        }}>
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>

            {/* MAIN TABLE OR GRID CONTAINER */}
            {layoutMode === "list" ? (
                <div className="flex-1 overflow-auto bg-bg-primary relative" ref={parentRef}>
                    <div className="min-w-max w-full flex flex-col pointer-events-auto">
                        {/* THEAD */}
                        <div className="flex sticky top-0 z-20 bg-bg-secondary shadow-[0_1px_0_var(--tw-shadow-color)] shadow-border font-medium text-[12px] text-text-secondary uppercase select-none backdrop-blur-md">
                            <div className="w-[80px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_derivacion')}>Ingreso <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[120px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('numero_siniestro')}>Siniestro <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[90px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('numero_servicio')}>Servicio <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[170px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('estado')}>Estado <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[60px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('updated_at')}>Días <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[150px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('tipo_inspeccion')}>Tipo IP <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[280px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('dominio')}>Vehículo <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[100px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('dominio')}>Patente <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[140px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('perito_calle')}>P. Calle <ArrowUpDown className="w-3 h-3" /></div>

                            {!hiddenColumns.includes("perito_carga") && (
                                <div className="w-[140px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('perito_carga')}>P. Carga <ArrowUpDown className="w-3 h-3" /></div>
                            )}

                            <div className="w-[140px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('gestor')}>Gestor <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[90px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_inspeccion_programada')}>Fecha IP <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[90px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_carga_sistema')}>F. Carga <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="w-[100px] shrink-0 px-2 py-2.5 cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => handleSort('fecha_cierre')}>F. Cierre <ArrowUpDown className="w-3 h-3" /></div>
                            <div className="flex-1 min-w-[150px] shrink-0 px-2 py-2.5 flex items-center justify-end gap-1 font-bold tracking-wider text-brand-primary">Acc.</div>
                        </div>
                        {/* TBODY VIRTUALIZED */}
                        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }} className="w-full">
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const caso = procesados[virtualRow.index];
                                const rowColor = estadoStylesRow[caso.estado] || 'bg-bg-primary hover:bg-bg-tertiary';
                                const { days, color: daysColor } = formatDays(caso.updated_at);
                                const pCalle = getCorto(caso.perito_calle?.nombre + " " + caso.perito_calle?.apellido);
                                const pCarga = getCorto(caso.perito_carga?.nombre + " " + caso.perito_carga?.apellido);

                                return (
                                    <div
                                        key={caso.id}
                                        className={`absolute top-0 left-0 w-full flex border-b border-border/50 text-[13px] transition-colors duration-150 group/row items-center cursor-default ${rowColor}`}
                                        style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                                    >
                                        <div className="w-[80px] shrink-0 px-2 py-1 text-text-muted text-[12px] whitespace-nowrap">
                                            {formatDateVal(caso.fecha_derivacion)}
                                        </div>

                                        <div className="w-[120px] shrink-0 px-2 py-1 flex items-center group/cell">
                                            {editingField?.id === caso.id && editingField?.field === "numero_siniestro" ? (
                                                <Input autoFocus className="h-7 text-[12px] px-1.5 w-full bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => setEditingField({ ...editingField, value: e.target.value })} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                                            ) : (
                                                <>
                                                    <Link href={`/casos/${caso.id}`} className="truncate flex-1 font-mono font-bold text-text-primary hover:text-text-primary hover:underline hover:brightness-125 transition-all text-[14px]">{caso.numero_siniestro}</Link>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "numero_siniestro", value: caso.numero_siniestro || "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Editable Servicio */}
                                        <div className="w-[90px] shrink-0 px-2 py-1 flex items-center group/cell text-[12px]">
                                            {editingField?.id === caso.id && editingField?.field === "numero_servicio" ? (
                                                <Input autoFocus className="h-7 text-[12px] px-1.5 w-full bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => setEditingField({ ...editingField, value: e.target.value })} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                                            ) : (
                                                <>
                                                    <span className="truncate flex-1 text-text-secondary">{caso.numero_servicio || "-"}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "numero_servicio", value: caso.numero_servicio || "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="w-[170px] shrink-0 px-2 py-1">
                                            {permitidos.length > 0 ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="cursor-pointer hover:brightness-110 active:scale-95 transition-all outline-none inline-block">
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

                                        <div className="w-[150px] shrink-0 px-2 py-1">
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
                                        <div className="w-[280px] shrink-0 px-2 py-1 flex items-center group/cell relative">
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
                                        <div className="w-[100px] shrink-0 px-2 py-1 flex items-center group/cell">
                                            {editingField?.id === caso.id && editingField?.field === "dominio" ? (
                                                <Input autoFocus className="h-7 text-[12px] px-1.5 w-full uppercase font-mono bg-bg-elevated border-brand-primary" value={editingField.value} onChange={e => setEditingField({ ...editingField, value: e.target.value })} onBlur={handleSaveField} onKeyDown={e => e.key === 'Enter' && handleSaveField()} />
                                            ) : (
                                                <>
                                                    <span className="truncate flex-1 font-mono uppercase text-text-primary text-[13px]">{caso.dominio || "-"}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "dominio", value: caso.dominio || "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Perito Dropdowns */}
                                        <div className="w-[140px] shrink-0 px-2 py-1" title={caso.perito_calle?.nombre + " " + caso.perito_calle?.apellido}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="flex items-center gap-1.5 cursor-pointer max-w-full hover:bg-bg-tertiary p-1 rounded transition-colors group/pcalle">
                                                        <span className="truncate text-text-secondary text-[13px] group-hover/pcalle:text-text-primary">{caso.perito_calle ? `${caso.perito_calle.nombre} ${caso.perito_calle.apellido}` : "Sin asignado"}</span>
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
                                            <div className="w-[140px] shrink-0 px-2 py-1" title={caso.perito_carga?.nombre + " " + caso.perito_carga?.apellido}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="flex items-center gap-1.5 cursor-pointer max-w-full hover:bg-bg-tertiary p-1 rounded transition-colors group/pcarga">
                                                            <span className="truncate text-text-secondary text-[13px] group-hover/pcarga:text-text-primary">{caso.perito_carga ? `${caso.perito_carga.nombre} ${caso.perito_carga.apellido}` : "Sin asignado"}</span>
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
                                        <div className="w-[140px] shrink-0 px-2 py-1 flex items-center group/cell" title={caso.gestor?.email || caso.gestor?.nombre}>
                                            <span
                                                className="truncate flex-1 text-text-secondary text-[13px] cursor-pointer hover:text-brand-primary hover:underline transition-colors"
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
                                                    <span className="truncate flex-1 text-text-secondary text-[12px] whitespace-nowrap">{formatDateVal(caso.fecha_inspeccion_programada)}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "fecha_inspeccion_programada", value: caso.fecha_inspeccion_programada ? caso.fecha_inspeccion_programada.split("T")[0] : "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="w-[90px] shrink-0 px-2 py-1 text-text-muted text-[12px] whitespace-nowrap">
                                            {formatDateVal(caso.fecha_carga_sistema)}
                                        </div>

                                        {/* Editable Fecha Cierre */}
                                        <div className="w-[100px] shrink-0 px-2 py-1 flex items-center group/cell">
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
                                                    <span className="truncate flex-1 text-text-secondary text-[12px] whitespace-nowrap">{formatDateVal(caso.fecha_cierre)}</span>
                                                    <button onClick={() => setEditingField({ id: caso.id, field: "fecha_cierre", value: caso.fecha_cierre ? caso.fecha_cierre.split("T")[0] : "" })} className="opacity-0 group-hover/cell:opacity-100 p-0.5 text-text-muted hover:text-brand-primary">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {/* ACCIONES - FLEX PARA ABSORBER ESPACIO */}
                                        <div className="flex-1 min-w-[120px] shrink-0 px-2 py-1 flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <Popover open={editingNota === caso.id} onOpenChange={(o: boolean) => {
                                                if (o) { setEditingNota(caso.id); setDraftNota(caso.notas_admin || ""); }
                                                else setEditingNota(null);
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <button className="p-1 rounded text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors relative" title="Observaciones rápidas">
                                                        <SearchIcon className="w-4 h-4" />
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
                            return (
                                <Link href={`/casos/${caso.id}`} key={caso.id} className="p-3 border border-border shadow-sm rounded-lg bg-bg-secondary hover:border-brand-primary/50 transition-colors flex flex-col gap-3 group">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-mono font-bold text-sm text-text-primary truncate">{caso.numero_siniestro}</span>
                                            <span className="text-[10px] text-text-muted truncate">Ingreso: {formatDateVal(caso.fecha_derivacion)}</span>
                                        </div>
                                        <EstadoBadge estado={caso.estado} compacto />
                                    </div>
                                    <div className="text-xs text-text-secondary">
                                        <div className="truncate font-medium">{caso.marca} {caso.modelo}</div>
                                        <div className="truncate font-mono uppercase text-[11px] text-text-muted mt-0.5">{caso.dominio || "Sin Datos"}</div>
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

function BadgeCounter({ label, count, active, onClick, dimmed }: { label: string, count: number, active?: boolean, onClick?: () => void, dimmed?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all whitespace-nowrap
                ${active ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-primary font-bold pr-3' : 'bg-bg-tertiary border-border text-text-secondary hover:bg-bg-elevated'}
                ${dimmed && !active ? 'opacity-40 hover:opacity-100' : ''}
            `}
        >
            <span className="truncate">{label}</span>
            <span className={`px-1 rounded-full bg-bg-primary text-[9px] tabular-nums ${(active && count > 0) ? "text-brand-primary font-bold shadow-sm" : ""}`}>{count}</span>
        </button>
    );
}
