"use client";

import { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: { id: string; label: string; sublabel?: string }[];
    placeholder?: string;
    className?: string;
}

export function SearchableSelect({ id, value, onChange, options, placeholder = "Buscar...", className = "" }: SearchableSelectProps) {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Display label for current value
    const selectedOption = options.find(o => o.id === value);

    // Filter options
    const filtered = search.trim()
        ? options.filter(o => {
            const q = search.toLowerCase();
            return o.label.toLowerCase().includes(q) || (o.sublabel && o.sublabel.toLowerCase().includes(q));
        })
        : options;

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                if (!value) setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [value]);

    const handleSelect = (id: string) => {
        onChange(id);
        const opt = options.find(o => o.id === id);
        setSearch(opt ? opt.label : "");
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setSearch("");
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={isOpen ? search : (selectedOption ? selectedOption.label : search)}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        if (!e.target.value) onChange("");
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch(selectedOption ? selectedOption.label : "");
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                    className={`flex h-10 w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm pr-8 ${className}`}
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-lg leading-none"
                        tabIndex={-1}
                    >
                        ×
                    </button>
                )}
            </div>
            {isOpen && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-bg-secondary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                    {filtered.slice(0, 30).map(opt => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelect(opt.id)}
                            className={`flex flex-col w-full text-left px-3 py-2 text-sm hover:bg-brand-primary/10 transition-colors ${
                                opt.id === value ? "bg-brand-primary/15 text-brand-primary font-medium" : "text-text-primary"
                            }`}
                        >
                            <span className="truncate">{opt.label}</span>
                            {opt.sublabel && <span className="text-[11px] text-text-muted truncate">{opt.sublabel}</span>}
                        </button>
                    ))}
                    {filtered.length > 30 && (
                        <div className="px-3 py-2 text-xs text-text-muted text-center">
                            {filtered.length - 30} más — seguí escribiendo para filtrar
                        </div>
                    )}
                </div>
            )}
            {isOpen && search.trim() && filtered.length === 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-bg-secondary shadow-lg px-3 py-3 text-sm text-text-muted text-center">
                    Sin resultados para &quot;{search}&quot;
                </div>
            )}
        </div>
    );
}
