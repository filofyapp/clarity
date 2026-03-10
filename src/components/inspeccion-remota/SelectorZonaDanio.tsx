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

                    {/* Frente - Paragolpes */}
                    <path id="frente" d="M20,10 Q50,-5 80,10 L85,25 L15,25 Z" className={getPathClassName("frente")} onClick={() => toggleZona("frente")} />

                    {/* Capot */}
                    <path id="capot" d="M25,25 L75,25 L80,60 L20,60 Z" className={getPathClassName("capot")} onClick={() => toggleZona("capot")} />

                    {/* Parabrisas */}
                    <path id="parabrisas" d="M18,60 L82,60 Q80,85 75,90 L25,90 Q20,85 18,60 Z" className={getPathClassName("parabrisas")} onClick={() => toggleZona("parabrisas")} />

                    {/* Techo */}
                    <path id="techo" d="M25,90 L75,90 L75,160 L25,160 Z" className={getPathClassName("techo")} onClick={() => toggleZona("techo")} />

                    {/* Luneta */}
                    <path id="luneta" d="M25,160 L75,160 L80,185 L20,185 Z" className={getPathClassName("luneta")} onClick={() => toggleZona("luneta")} />

                    {/* Baul */}
                    <path id="baul" d="M20,185 L80,185 L85,220 L15,220 Z" className={getPathClassName("baul")} onClick={() => toggleZona("baul")} />

                    {/* Trasero - Paragolpes */}
                    <path id="trasero" d="M15,220 L85,220 Q50,240 15,220 Z" className={getPathClassName("trasero")} onClick={() => toggleZona("trasero")} />

                    {/* Laterales Izquierdos */}
                    {/* Guardabarros Del Izq */}
                    <path id="guardabarros_del_izq" d="M15,25 L25,25 L20,60 L10,60 Q8,45 15,25 Z" className={getPathClassName("guardabarros_del_izq")} onClick={() => toggleZona("guardabarros_del_izq")} />
                    {/* Puerta Del Izq */}
                    <path id="puerta_del_izq" d="M10,60 L25,85 L25,125 L7,125 Z" className={getPathClassName("puerta_del_izq")} onClick={() => toggleZona("puerta_del_izq")} />
                    {/* Puerta Tra Izq */}
                    <path id="puerta_tra_izq" d="M7,125 L25,125 L25,160 L10,160 Z" className={getPathClassName("puerta_tra_izq")} onClick={() => toggleZona("puerta_tra_izq")} />
                    {/* Guardabarros Tra Izq */}
                    <path id="guardabarros_tra_izq" d="M10,160 L20,185 L15,220 Q5,200 10,160 Z" className={getPathClassName("guardabarros_tra_izq")} onClick={() => toggleZona("guardabarros_tra_izq")} />

                    {/* Laterales Derechos */}
                    {/* Guardabarros Del Der */}
                    <path id="guardabarros_del_der" d="M85,25 L75,25 L80,60 L90,60 Q92,45 85,25 Z" className={getPathClassName("guardabarros_del_der")} onClick={() => toggleZona("guardabarros_del_der")} />
                    {/* Puerta Del Der */}
                    <path id="puerta_del_der" d="M90,60 L75,85 L75,125 L93,125 Z" className={getPathClassName("puerta_del_der")} onClick={() => toggleZona("puerta_del_der")} />
                    {/* Puerta Tra Der */}
                    <path id="puerta_tra_der" d="M93,125 L75,125 L75,160 L90,160 Z" className={getPathClassName("puerta_tra_der")} onClick={() => toggleZona("puerta_tra_der")} />
                    {/* Guardabarros Tra Der */}
                    <path id="guardabarros_tra_der" d="M90,160 L80,185 L85,220 Q95,200 90,160 Z" className={getPathClassName("guardabarros_tra_der")} onClick={() => toggleZona("guardabarros_tra_der")} />

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
