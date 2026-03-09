"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Car } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const searchCasos = async () => {
            if (query.length < 3) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsSearching(true);
            const supabase = createClient();

            const { data, error } = await supabase
                .from("casos")
                .select("id, numero_siniestro, dominio, marca, modelo, localidad")
                .or(`numero_siniestro.ilike.%${query}%,dominio.ilike.%${query}%,nombre_asegurado.ilike.%${query}%`)
                .limit(5);

            if (!error && data) {
                setResults(data);
                setIsOpen(true);
            }
            setIsSearching(false);
        };

        const debounceTimer = setTimeout(searchCasos, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleSelect = (id: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(`/casos/${id}`);
    };

    return (
        <div ref={wrapperRef} className="relative flex flex-1 max-w-lg">
            <label htmlFor="search-field" className="sr-only">
                Buscar casos, siniestros...
            </label>
            <Search
                className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-text-muted top-0"
                aria-hidden="true"
            />
            <input
                id="search-field"
                className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-text-primary placeholder:text-text-muted focus:ring-0 sm:text-sm"
                placeholder="Buscar casos por patente, siniestro o nombre..."
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
            />

            {isOpen && (
                <div className="absolute top-12 left-0 w-full bg-bg-secondary border border-border rounded-md shadow-lg overflow-hidden z-50">
                    {isSearching ? (
                        <div className="p-4 text-sm text-text-muted text-center">Buscando...</div>
                    ) : results.length > 0 ? (
                        <ul>
                            {results.map((caso) => (
                                <li
                                    key={caso.id}
                                    onClick={() => handleSelect(caso.id)}
                                    className="px-4 py-3 hover:bg-bg-tertiary cursor-pointer border-b border-border last:border-0 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">Siniestro: {caso.numero_siniestro}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                                                <span className="flex items-center gap-1 uppercase font-mono bg-bg-primary px-1 rounded"><Car className="h-3 w-3" /> {caso.dominio}</span>
                                                <span>{caso.marca} {caso.modelo}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-xs text-text-muted">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {caso.localidad}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-sm text-text-muted text-center">No se encontraron resultados para "{query}"</div>
                    )}
                </div>
            )}
        </div>
    );
}
