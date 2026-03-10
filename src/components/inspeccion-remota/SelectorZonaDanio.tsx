"use client";

import { X } from "lucide-react";

interface Props {
    zonasSeleccionadas: string[];
    onZonasChange: (zonas: string[]) => void;
}

const ZONAS_MAP: Record<string, string> = {
    paragolpes_del: "Paragolpes Delantero",
    optica_del_izq: "Óptica Izq.",
    capot: "Capot",
    optica_del_der: "Óptica Der.",
    guardabarros_del_izq: "Guardabarros Del. Izq.",
    parabrisas: "Parabrisas",
    guardabarros_del_der: "Guardabarros Del. Der.",
    puerta_del_izq: "Puerta Del. Izq.",
    techo: "Techo",
    puerta_del_der: "Puerta Del. Der.",
    puerta_tra_izq: "Puerta Tra. Izq.",
    puerta_tra_der: "Puerta Tra. Der.",
    guardabarros_tra_izq: "Guardabarros Tra. Izq.",
    luneta: "Luneta",
    guardabarros_tra_der: "Guardabarros Tra. Der.",
    optica_tra_izq: "Óptica Izq.",
    baul: "Baúl",
    optica_tra_der: "Óptica Der.",
    paragolpes_tra: "Paragolpes Trasero",
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

    const getBtnClass = (id: string) => {
        const base = "flex items-center justify-center text-center text-xs font-semibold rounded-xl min-h-[60px] p-2 transition-all duration-200 active:scale-[0.98] border";
        if (isSelected(id)) {
            return `${base} bg-[#D6006E]/20 text-white border-[#D6006E] shadow-[0_0_15px_rgba(214,0,110,0.15)]`;
        }
        return `${base} bg-[#16131B] text-[#9B8FA6] border-white/5 hover:bg-white/5 hover:border-white/10 hover:text-[#F5F0F7]`;
    };

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto">

            {/* INSTRUCCIONES FRONTALES NO NECESARIAS AQUI, YA LAS TIENE EL WIZARD */}

            <div className="relative w-full z-10 px-2 space-y-6">

                {/* --- FRENTE --- */}
                <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-[10px] text-[#6B5F78] uppercase tracking-[0.2em] font-bold">Frente</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-[1fr_1.8fr_1fr] gap-2">
                        <button onClick={() => toggleZona('paragolpes_del')} className={`col-span-3 ${getBtnClass('paragolpes_del')}`}>
                            Paragolpes<br />Delantero
                        </button>

                        <button onClick={() => toggleZona('optica_del_izq')} className={getBtnClass('optica_del_izq')}>Óptica<br />Izq.</button>
                        <button onClick={() => toggleZona('capot')} className={getBtnClass('capot')}>Capot</button>
                        <button onClick={() => toggleZona('optica_del_der')} className={getBtnClass('optica_del_der')}>Óptica<br />Der.</button>

                        <button onClick={() => toggleZona('guardabarros_del_izq')} className={getBtnClass('guardabarros_del_izq')}>Guarda-<br />barros<br />Del. Izq.</button>
                        <button onClick={() => toggleZona('parabrisas')} className={getBtnClass('parabrisas')}>Parabrisas</button>
                        <button onClick={() => toggleZona('guardabarros_del_der')} className={getBtnClass('guardabarros_del_der')}>Guarda-<br />barros<br />Del. Der.</button>
                    </div>
                </div>

                {/* --- LATERAL --- */}
                <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-[10px] text-[#6B5F78] uppercase tracking-[0.2em] font-bold">Lateral</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-[1fr_1.8fr_1fr] gap-2">
                        <button onClick={() => toggleZona('puerta_del_izq')} className={getBtnClass('puerta_del_izq')}>Puerta<br />Del. Izq.</button>
                        <button onClick={() => toggleZona('techo')} className={getBtnClass('techo')}>Techo</button>
                        <button onClick={() => toggleZona('puerta_del_der')} className={getBtnClass('puerta_del_der')}>Puerta<br />Del. Der.</button>

                        <button onClick={() => toggleZona('puerta_tra_izq')} className={getBtnClass('puerta_tra_izq')}>Puerta<br />Tra. Izq.</button>
                        <div className="flex items-center justify-center text-[#6B5F78]/30">
                            {/* Silueta abstracta opcional de centro de auto para rellenar vacío */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                        </div>
                        <button onClick={() => toggleZona('puerta_tra_der')} className={getBtnClass('puerta_tra_der')}>Puerta<br />Tra. Der.</button>
                    </div>
                </div>

                {/* --- TRASERA --- */}
                <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-[10px] text-[#6B5F78] uppercase tracking-[0.2em] font-bold">Trasera</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-[1fr_1.8fr_1fr] gap-2">
                        <button onClick={() => toggleZona('guardabarros_tra_izq')} className={getBtnClass('guardabarros_tra_izq')}>Guarda-<br />barros<br />Tra. Izq.</button>
                        <button onClick={() => toggleZona('luneta')} className={getBtnClass('luneta')}>Luneta</button>
                        <button onClick={() => toggleZona('guardabarros_tra_der')} className={getBtnClass('guardabarros_tra_der')}>Guarda-<br />barros<br />Tra. Der.</button>

                        <button onClick={() => toggleZona('optica_tra_izq')} className={getBtnClass('optica_tra_izq')}>Óptica<br />Izq.</button>
                        <button onClick={() => toggleZona('baul')} className={getBtnClass('baul')}>Baúl</button>
                        <button onClick={() => toggleZona('optica_tra_der')} className={getBtnClass('optica_tra_der')}>Óptica<br />Der.</button>

                        <button onClick={() => toggleZona('paragolpes_tra')} className={`col-span-3 ${getBtnClass('paragolpes_tra')}`}>
                            Paragolpes<br />Trasero
                        </button>
                    </div>
                </div>
            </div>

            {/* Listado de Zonas (Chips) Resumen Inferior */}
            <div className="w-full bg-[#16131B]/50 rounded-xl border border-white/5 p-4 min-h-[100px] mt-8">
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

        </div>
    );
}
