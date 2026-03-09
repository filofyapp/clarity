"use client";

interface Props {
    zonasSeleccionadas: string[];
    onZonasChange: (zonas: string[]) => void;
}

// Zone definitions with percentage-based positioning over the car image
const ZONAS_IZQUIERDA = [
    { id: "guardabarros_del_izq", label: "Guardabarros Del." },
    { id: "puerta_del_izq", label: "Puerta Delantera" },
    { id: "puerta_tra_izq", label: "Puerta Trasera" },
    { id: "guardabarros_tra_izq", label: "Guardabarros Tra." },
];

const ZONAS_CENTRO = [
    { id: "paragolpes_del", label: "Paragolpes Delantero" },
    { id: "capot", label: "Capot" },
    { id: "parabrisas_del", label: "Parabrisas" },
    { id: "techo", label: "Techo" },
    { id: "luneta", label: "Luneta Trasera" },
    { id: "baul", label: "Baúl" },
    { id: "paragolpes_tra", label: "Paragolpes Trasero" },
];

const ZONAS_DERECHA = [
    { id: "guardabarros_del_der", label: "Guardabarros Del." },
    { id: "puerta_del_der", label: "Puerta Delantera" },
    { id: "puerta_tra_der", label: "Puerta Trasera" },
    { id: "guardabarros_tra_der", label: "Guardabarros Tra." },
];

const ALL_ZONAS = [...ZONAS_IZQUIERDA, ...ZONAS_CENTRO, ...ZONAS_DERECHA];

function ZoneButton({ id, label, selected, onToggle }: { id: string; label: string; selected: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`
                w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200
                ${selected
                    ? "bg-red-500/20 border border-red-500/50 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                    : "bg-white/[0.03] border border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:border-white/[0.15] hover:text-white/70"
                }
            `}
        >
            <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${selected ? "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "bg-white/20"}`} />
                {label}
            </span>
        </button>
    );
}

export function SelectorZonaDanio({ zonasSeleccionadas, onZonasChange }: Props) {
    const toggleZona = (id: string) => {
        if (zonasSeleccionadas.includes(id)) {
            onZonasChange(zonasSeleccionadas.filter(z => z !== id));
        } else {
            onZonasChange([...zonasSeleccionadas, id]);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Grid layout — 3 columns: Left side / Car + Center / Right side */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">

                {/* Left side zones */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1 text-center">Lado Izquierdo</p>
                    {ZONAS_IZQUIERDA.map(z => (
                        <ZoneButton key={z.id} {...z} selected={zonasSeleccionadas.includes(z.id)} onToggle={() => toggleZona(z.id)} />
                    ))}
                </div>

                {/* Center: Car image + center zones */}
                <div className="flex flex-col items-center gap-1.5 px-2">
                    {/* Top bumper */}
                    <ZoneButton
                        id="paragolpes_del" label="Parag. Del."
                        selected={zonasSeleccionadas.includes("paragolpes_del")}
                        onToggle={() => toggleZona("paragolpes_del")}
                    />

                    {/* Car image with overlaid center zones */}
                    <div className="relative w-28">
                        <img
                            src="/vehicle-topdown.png"
                            alt="Vehicle"
                            className="w-full opacity-40 pointer-events-none select-none"
                            draggable={false}
                        />
                        {/* Center zones overlaid on car */}
                        <div className="absolute inset-0 flex flex-col justify-between py-[8%] px-[10%]">
                            {[
                                { id: "capot", label: "Capot" },
                                { id: "parabrisas_del", label: "Parabr." },
                                { id: "techo", label: "Techo" },
                                { id: "luneta", label: "Luneta" },
                                { id: "baul", label: "Baúl" },
                            ].map(z => {
                                const sel = zonasSeleccionadas.includes(z.id);
                                return (
                                    <button
                                        key={z.id}
                                        onClick={() => toggleZona(z.id)}
                                        className={`
                                            w-full py-1 rounded text-[9px] font-bold tracking-wide uppercase transition-all duration-200
                                            ${sel
                                                ? "bg-red-500/30 border border-red-500/60 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                                : "bg-white/[0.04] border border-white/[0.1] text-white/40 hover:bg-white/[0.08] hover:text-white/60"
                                            }
                                        `}
                                    >
                                        {z.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom bumper */}
                    <ZoneButton
                        id="paragolpes_tra" label="Parag. Tra."
                        selected={zonasSeleccionadas.includes("paragolpes_tra")}
                        onToggle={() => toggleZona("paragolpes_tra")}
                    />

                    {/* Direction indicator */}
                    <div className="flex items-center gap-1 text-[9px] text-white/20 uppercase tracking-widest">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><polygon points="4,0 8,8 0,8" /></svg>
                        Frente
                    </div>
                </div>

                {/* Right side zones */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1 text-center">Lado Derecho</p>
                    {ZONAS_DERECHA.map(z => (
                        <ZoneButton key={z.id} {...z} selected={zonasSeleccionadas.includes(z.id)} onToggle={() => toggleZona(z.id)} />
                    ))}
                </div>
            </div>

            {/* Selected zones summary */}
            {zonasSeleccionadas.length > 0 && (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mt-1">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">
                        {zonasSeleccionadas.length} zona{zonasSeleccionadas.length > 1 ? "s" : ""} seleccionada{zonasSeleccionadas.length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {zonasSeleccionadas.map(id => {
                            const zona = ALL_ZONAS.find(z => z.id === id);
                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleZona(id)}
                                    className="bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-medium px-2.5 py-1 rounded-full hover:bg-red-500/25 transition-all flex items-center gap-1.5"
                                >
                                    {zona?.label || id}
                                    <span className="text-red-400/50 text-[10px]">✕</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
