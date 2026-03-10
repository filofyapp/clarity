"use client";

import { X } from "lucide-react";

interface Props {
    zonasSeleccionadas: string[];
    onZonasChange: (zonas: string[]) => void;
}

const ZONAS_MAP: Record<string, string> = {
    frente: "Paragolpes Delantero",
    capot: "Capot",
    guardabarros_del_izq: "Guardabarros Del. Izq.",
    guardabarros_del_der: "Guardabarros Del. Der.",
    puerta_del_izq: "Puerta Del. Izq.",
    puerta_del_der: "Puerta Del. Der.",
    puerta_tra_izq: "Puerta Tra. Izq.",
    puerta_tra_der: "Puerta Tra. Der.",
    guardabarros_tra_izq: "Guardabarros Tra. Izq.",
    guardabarros_tra_der: "Guardabarros Tra. Der.",
    techo: "Techo",
    parabrisas: "Parabrisas",
    luneta: "Luneta",
    baul: "Baúl / Portón",
    trasero: "Paragolpes Trasero",
};

export function SelectorZonaDanio({ zonasSeleccionadas, onZonasChange }: Props) {

    const toggleZona = (id: string) => {
        if (zonasSeleccionadas.includes(id)) {
            onZonasChange(zonasSeleccionadas.filter(z => z !== id));
        } else {
            onZonasChange([...zonasSeleccionadas, id]);
        }
    };

    const isSelected = (id: string) => zonasSeleccionadas.includes(id);

    // Helper for interactive paths
    const getPathClassName = (id: string) => {
        const base = "transition-all duration-200 cursor-pointer";
        if (isSelected(id)) {
            return `${base} fill-[#D6006E]/25 stroke-[#D6006E] stroke-[2px] vector-scale-up`;
        }
        return `${base} fill-transparent stroke-[#D6006E]/15 hover:fill-[#D6006E]/10 hover:stroke-[#D6006E]/40 active:scale-[0.98]`;
    };

    return (
        <div className="flex flex-col items-center w-full">

            {/* Indicador Frente */}
            <div className="text-[10px] uppercase tracking-widest text-[#6B5F78] mb-4">
                FRENTE
            </div>

            {/* SVG Top-Down Car */}
            <div className="relative w-full max-w-[200px] mb-4">
                <svg viewBox="0 0 100 240" className="w-full h-full drop-shadow-2xl overflow-visible">

                    {/* Shadow / Base stroke invisible buffer to capture clicks smoothly */}
                    <rect x="0" y="0" width="100" height="240" fill="transparent" pointerEvents="none" />

                    {/* FRENTE */}
                    <path id="frente" d="M15,25 Q50,15 85,25 L85,35 L15,35 Z" className={getPathClassName("frente")} onClick={() => toggleZona("frente")} />

                    {/* CAPOT */}
                    <path id="capot" d="M20,35 L80,35 L75,70 L25,70 Z" className={getPathClassName("capot")} onClick={() => toggleZona("capot")} />

                    {/* PARABRISAS */}
                    <path id="parabrisas" d="M22,70 L78,70 L70,85 L30,85 Z" className={getPathClassName("parabrisas")} onClick={() => toggleZona("parabrisas")} />

                    {/* TECHO */}
                    <path id="techo" d="M30,85 L70,85 L70,150 L30,150 Z" className={getPathClassName("techo")} onClick={() => toggleZona("techo")} />

                    {/* LUNETA */}
                    <path id="luneta" d="M30,150 L70,150 L75,165 L25,165 Z" className={getPathClassName("luneta")} onClick={() => toggleZona("luneta")} />

                    {/* BAUL */}
                    <path id="baul" d="M25,165 L75,165 L80,205 L20,205 Z" className={getPathClassName("baul")} onClick={() => toggleZona("baul")} />

                    {/* TRASERO (Paragolpes) */}
                    <path id="trasero" d="M15,205 L85,205 L85,215 Q50,225 15,215 Z" className={getPathClassName("trasero")} onClick={() => toggleZona("trasero")} />


                    {/* LADO IZQUIERDO */}
                    <path id="guardabarros_del_izq" d="M15,25 L20,35 L25,70 L15,70 C10,50 12,35 15,25 Z" className={getPathClassName("guardabarros_del_izq")} onClick={() => toggleZona("guardabarros_del_izq")} />
                    <path id="puerta_del_izq" d="M15,70 L25,70 L30,85 L30,120 L10,120 C10,100 12,85 15,70 Z" className={getPathClassName("puerta_del_izq")} onClick={() => toggleZona("puerta_del_izq")} />
                    <path id="puerta_tra_izq" d="M10,120 L30,120 L30,150 L25,165 L10,165 Z" className={getPathClassName("puerta_tra_izq")} onClick={() => toggleZona("puerta_tra_izq")} />
                    <path id="guardabarros_tra_izq" d="M10,165 L25,165 L20,205 L15,215 C12,205 10,185 10,165 Z" className={getPathClassName("guardabarros_tra_izq")} onClick={() => toggleZona("guardabarros_tra_izq")} />

                    {/* LADO DERECHO */}
                    <path id="guardabarros_del_der" d="M85,25 C88,35 90,50 85,70 L75,70 L80,35 L85,25 Z" className={getPathClassName("guardabarros_del_der")} onClick={() => toggleZona("guardabarros_del_der")} />
                    <path id="puerta_del_der" d="M85,70 C88,85 90,100 90,120 L70,120 L70,85 L75,70 L85,70 Z" className={getPathClassName("puerta_del_der")} onClick={() => toggleZona("puerta_del_der")} />
                    <path id="puerta_tra_der" d="M90,120 L90,165 L75,165 L70,150 L70,120 Z" className={getPathClassName("puerta_tra_der")} onClick={() => toggleZona("puerta_tra_der")} />
                    <path id="guardabarros_tra_der" d="M90,165 C90,185 88,205 85,215 L80,205 L75,165 L90,165 Z" className={getPathClassName("guardabarros_tra_der")} onClick={() => toggleZona("guardabarros_tra_der")} />

                </svg>
            </div>

            {/* Indicador Trasera */}
            <div className="text-[10px] uppercase tracking-widest text-[#6B5F78] mt-2 mb-8">
                TRASERA
            </div>

            {/* Listado de Zonas (Chips) */}
            <div className="w-full bg-[#16131B]/50 rounded-xl border border-white/5 p-4 min-h-[100px]">
                <p className="text-[#6B5F78] text-[10px] uppercase tracking-wide mb-3 font-semibold">
                    {zonasSeleccionadas.length} ZONA{zonasSeleccionadas.length !== 1 ? 'S' : ''} SELECCIONADA{zonasSeleccionadas.length !== 1 ? 'S' : ''}
                </p>

                {zonasSeleccionadas.length === 0 ? (
                    <p className="text-[#6B5F78] text-sm text-center py-4">
                        Todavía no seleccionaste ninguna zona.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {zonasSeleccionadas.map(id => (
                            <button
                                key={id}
                                onClick={() => toggleZona(id)}
                                className="flex items-center gap-1.5 bg-[#D6006E]/15 border border-[#D6006E]/30 text-[#E8D5EE] text-xs px-3 py-1.5 rounded-full hover:bg-[#D6006E]/25 transition-colors group"
                            >
                                {ZONAS_MAP[id] || id}
                                <X className="w-3 h-3 text-[#D6006E] group-hover:text-white transition-colors" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .vector-scale-up {
                    transform-origin: center;
                    animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes pop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
