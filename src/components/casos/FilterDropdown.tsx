"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Check, ChevronDown } from "lucide-react";

interface FilterOption {
    id: string;
    label: string;
}

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const filteredOptions = searchQuery.trim()
        ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    const isActive = selected.length > 0 && selected.length < options.length;
    const allSelected = selected.length === 0 || selected.length === options.length;

    const toggleOption = (id: string) => {
        if (selected.includes(id)) {
            const next = selected.filter(s => s !== id);
            onChange(next);
        } else {
            onChange([...selected, id]);
        }
    };

    const selectAll = () => onChange([]);
    const deselectAll = () => onChange(options.map(o => o.id)); // Select all = actually filters to ALL, which we handle as empty array

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-7 text-[11px] px-2.5 rounded-md border flex items-center gap-1.5 transition-all font-medium whitespace-nowrap ${
                    isActive
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-dashed border-border bg-bg-primary text-text-secondary hover:border-border-hover"
                }`}
            >
                {label}
                {isActive && <span className="bg-brand-primary text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{selected.length}</span>}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-[220px] bg-bg-elevated border border-border rounded-lg shadow-shadow-lg z-[100] overflow-hidden">
                    {/* Search */}
                    {options.length > 6 && (
                        <div className="p-1.5 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-2 top-1.5 w-3 h-3 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-7 pr-2 py-1 text-[11px] bg-bg-tertiary rounded border-none outline-none text-text-primary placeholder:text-text-muted"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
                        <button
                            onClick={selectAll}
                            className="text-[10px] text-brand-primary hover:underline font-medium"
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => onChange([])}
                            className="text-[10px] text-text-muted hover:text-color-danger font-medium"
                        >
                            Ninguno
                        </button>
                    </div>

                    {/* Options list */}
                    <div className="max-h-[240px] overflow-y-auto py-1">
                        {filteredOptions.map((opt) => {
                            const isChecked = allSelected || selected.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        if (allSelected) {
                                            // Switching from "all selected" → select only this one
                                            onChange([opt.id]);
                                        } else {
                                            toggleOption(opt.id);
                                        }
                                    }}
                                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left hover:bg-bg-tertiary transition-colors"
                                >
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                        isChecked
                                            ? "bg-brand-primary border-brand-primary"
                                            : "border-border-hover bg-bg-primary"
                                    }`}>
                                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className="text-[11px] text-text-primary truncate">{opt.label}</span>
                                </button>
                            );
                        })}
                        {filteredOptions.length === 0 && (
                            <p className="text-center text-text-muted text-[11px] py-3">Sin resultados</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface DateFilterProps {
    label: string;
    fechaDesde: string | null;
    fechaHasta: string | null;
    onChange: (desde: string | null, hasta: string | null) => void;
}

// Convert YYYY-MM-DD → DD/MM/YY for display
function toDisplayDDMMYY(isoDate: string | null): string {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y.slice(-2)}`;
}

// Parse DD/MM/YY → YYYY-MM-DD for internal storage
function parseDDMMYY(display: string): string | null {
    const clean = display.replace(/[^\d]/g, "");
    if (clean.length < 6) return null;
    const day = clean.slice(0, 2);
    const month = clean.slice(2, 4);
    const yearShort = clean.slice(4, 6);
    const year = `20${yearShort}`;
    const d = parseInt(day), m = parseInt(month);
    if (d < 1 || d > 31 || m < 1 || m > 12) return null;
    return `${year}-${month}-${day}`;
}

// Auto-format raw input as DD/MM/YY with separators
function formatDateInput(raw: string): string {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 6);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DateFilter({ label, fechaDesde, fechaHasta, onChange }: DateFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [desdeText, setDesdeText] = useState(toDisplayDDMMYY(fechaDesde));
    const [hastaText, setHastaText] = useState(toDisplayDDMMYY(fechaHasta));

    // Sync external props → local text
    useEffect(() => { setDesdeText(toDisplayDDMMYY(fechaDesde)); }, [fechaDesde]);
    useEffect(() => { setHastaText(toDisplayDDMMYY(fechaHasta)); }, [fechaHasta]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const isActive = fechaDesde !== null || fechaHasta !== null;

    const formatLabel = () => {
        if (!isActive) return label;
        const fmtDate = (d: string) => {
            const [y, m, day] = d.split("-");
            return `${day}/${m}`;
        };
        if (fechaDesde && fechaHasta) return `${fmtDate(fechaDesde)} — ${fmtDate(fechaHasta)}`;
        if (fechaDesde) return `Desde ${fmtDate(fechaDesde)}`;
        return `Hasta ${fmtDate(fechaHasta!)}`;
    };

    const handleDesdeChange = (val: string) => {
        const formatted = formatDateInput(val);
        setDesdeText(formatted);
        if (formatted.length === 8) { // DD/MM/YY complete
            const iso = parseDDMMYY(formatted);
            if (iso) onChange(iso, fechaHasta);
        } else if (formatted === "") {
            onChange(null, fechaHasta);
        }
    };

    const handleHastaChange = (val: string) => {
        const formatted = formatDateInput(val);
        setHastaText(formatted);
        if (formatted.length === 8) {
            const iso = parseDDMMYY(formatted);
            if (iso) onChange(fechaDesde, iso);
        } else if (formatted === "") {
            onChange(fechaDesde, null);
        }
    };

    const setPreset = (desde: string, hasta: string) => {
        onChange(desde, hasta);
    };

    const today = new Date();
    const toYMD = (d: Date) => d.toISOString().split("T")[0];

    const getMonday = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.getFullYear(), d.getMonth(), diff);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-7 text-[11px] px-2.5 rounded-md border flex items-center gap-1.5 transition-all font-medium whitespace-nowrap ${
                    isActive
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-dashed border-border bg-bg-primary text-text-secondary hover:border-border-hover"
                }`}
            >
                {formatLabel()}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-[260px] bg-bg-elevated border border-border rounded-lg shadow-shadow-lg z-[100] overflow-hidden p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-text-muted block mb-1">Desde</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="DD/MM/AA"
                                className="w-full text-[11px] px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary outline-none focus:border-brand-primary font-mono"
                                value={desdeText}
                                onChange={(e) => handleDesdeChange(e.target.value)}
                                maxLength={8}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-text-muted block mb-1">Hasta</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="DD/MM/AA"
                                className="w-full text-[11px] px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary outline-none focus:border-brand-primary font-mono"
                                value={hastaText}
                                onChange={(e) => handleHastaChange(e.target.value)}
                                maxLength={8}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setPreset(toYMD(today), toYMD(today))} className="text-[10px] px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:bg-bg-surface border border-border">Hoy</button>
                        <button onClick={() => setPreset(toYMD(getMonday(today)), toYMD(today))} className="text-[10px] px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:bg-bg-surface border border-border">Esta semana</button>
                        <button onClick={() => setPreset(toYMD(new Date(today.getFullYear(), today.getMonth(), 1)), toYMD(today))} className="text-[10px] px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:bg-bg-surface border border-border">Este mes</button>
                        <button onClick={() => setPreset(toYMD(new Date(today.getFullYear(), today.getMonth() - 1, 1)), toYMD(new Date(today.getFullYear(), today.getMonth(), 0)))} className="text-[10px] px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:bg-bg-surface border border-border">Mes anterior</button>
                        <button onClick={() => setPreset(toYMD(new Date(today.getFullYear(), today.getMonth() - 3, 1)), toYMD(today))} className="text-[10px] px-2 py-1 rounded bg-bg-tertiary text-text-secondary hover:bg-bg-surface border border-border">Últimos 3 meses</button>
                    </div>

                    {isActive && (
                        <button
                            onClick={() => onChange(null, null)}
                            className="text-[10px] text-color-danger hover:underline font-medium"
                        >
                            Limpiar fechas
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
