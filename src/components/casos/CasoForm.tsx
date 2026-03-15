"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { crearCaso } from "@/app/(dashboard)/casos/actions";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, CheckCircle2, Sparkles, Upload, FileText, X, ImageIcon, Check, AlertCircle } from "lucide-react";

interface CasoFormProps {
    gestores?: any[];
    talleres?: any[];
    peritos?: { id: string; nombre: string; apellido: string; rol: string }[];
}

export function CasoForm({ gestores = [], talleres = [], peritos = [] }: CasoFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Modo secuencial
    const [casosCreados, setCasosCreados] = useState(0);
    const [modoSecuencial, setModoSecuencial] = useState(true);

    // AI Parser state
    const [textoParser, setTextoParser] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [parserResult, setParserResult] = useState<{ campos_encontrados: string[]; campos_no_encontrados: string[]; details: Record<string, string>; gestorHelper?: string } | null>(null);

    // Form states
    const [numSiniestro, setNumSiniestro] = useState("");
    const [numServicio, setNumServicio] = useState("");
    const [tipoIp, setTipoIp] = useState("ip_con_orden");
    const [gestorId, setGestorId] = useState("");
    const [tallerId, setTallerId] = useState("");
    const [peritoCelleId, setPeritoCelleId] = useState("");
    const [peritoCargaId, setPeritoCargaId] = useState("");
    const [fechaInspeccion, setFechaInspeccion] = useState("");
    // Ampliación: detección de siniestro existente
    const [casoOrigenId, setCasoOrigenId] = useState<string | null>(null);
    const [existingCaso, setExistingCaso] = useState<any>(null);
    const [checkingSiniestro, setCheckingSiniestro] = useState(false);

    const [dominio, setDominio] = useState("");
    const [marca, setMarca] = useState(""); // This is now "Detalle del Vehículo" representing Marca/Modelo/Año altogether
    const [linkOrion, setLinkOrion] = useState("");

    // Ubicación y descripción
    const [direccion, setDireccion] = useState("");
    const [localidad, setLocalidad] = useState("");
    const [descripcion, setDescripcion] = useState("");

    // Archivos adjuntos (carátula, denuncia, etc.)
    const [archivos, setArchivos] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fix: usar roles array (multi-role) en vez de rol string
    const peritosCalle = peritos.filter(p => {
        const roles: string[] = (p as any).roles || [];
        return roles.includes('calle') || roles.includes('admin') || p.rol === 'calle' || p.rol === 'admin';
    });
    const peritosCarga = peritos.filter(p => {
        const roles: string[] = (p as any).roles || [];
        return roles.includes('carga') || roles.includes('admin') || p.rol === 'carga' || p.rol === 'admin';
    });

    // Auto-check si siniestro ya existe (para ofrecer vinculación)
    useEffect(() => {
        const trimmed = numSiniestro.trim();
        if (trimmed.length < 5) {
            setExistingCaso(null);
            setCasoOrigenId(null);
            return;
        }
        const timer = setTimeout(async () => {
            setCheckingSiniestro(true);
            try {
                const res = await fetch(`/api/casos/check-siniestro?numero=${encodeURIComponent(trimmed)}`);
                const data = await res.json();
                if (data.exists && data.caso) {
                    setExistingCaso(data.caso);
                } else {
                    setExistingCaso(null);
                    setCasoOrigenId(null);
                }
            } catch { setExistingCaso(null); }
            setCheckingSiniestro(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [numSiniestro]);

    // Autocompletar dirección/localidad si eligen un taller
    useEffect(() => {
        if (tallerId) {
            const tallerSeleccionado = talleres.find(t => t.id === tallerId);
            if (tallerSeleccionado) {
                if (tallerSeleccionado.direccion) setDireccion(tallerSeleccionado.direccion);
                if (tallerSeleccionado.localidad) setLocalidad(tallerSeleccionado.localidad);
            }
        }
    }, [tallerId, talleres]);

    const resetForm = () => {
        setNumSiniestro("");
        setNumServicio("");
        setTipoIp("ip_con_orden");
        setGestorId("");
        setTallerId("");
        setDominio("");
        setMarca("");
        setLinkOrion("");
        setDireccion("");
        setLocalidad("");
        setDescripcion("");
        setCasoOrigenId(null);
        setExistingCaso(null);
        setArchivos([]);
        // No resetear peritos: suelen repetir en carga masiva
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!numSiniestro.trim()) {
            toast.error("El número de siniestro es obligatorio.");
            return;
        }

        // Save file references BEFORE the transition — resetForm() clears archivos state
        const filesToUpload = [...archivos];

        startTransition(async () => {
            const result = await crearCaso({
                numero_siniestro: numSiniestro,
                numero_servicio: numServicio || undefined,
                tipo_inspeccion: tipoIp,
                gestor_id: gestorId || undefined,
                taller_id: tallerId || undefined,
                perito_calle_id: peritoCelleId || undefined,
                perito_carga_id: peritoCargaId || undefined,
                dominio: dominio || undefined,
                marca: marca || undefined,
                link_orion: linkOrion || undefined,
                direccion_inspeccion: direccion || undefined,
                localidad: localidad || undefined,
                fecha_inspeccion: fechaInspeccion || undefined,
                datos_crudos_sancor: descripcion || undefined,
                caso_origen_id: casoOrigenId || undefined,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                // Upload archivos al bucket caso-archivos/{casoId}/
                if (filesToUpload.length > 0 && result.casoId) {
                    const supabase = createClient();
                    let uploadedCount = 0;
                    for (const file of filesToUpload) {
                        const fileName = `${Date.now()}_${file.name}`;
                        const { error: uploadErr } = await supabase.storage
                            .from("caso-archivos")
                            .upload(`${result.casoId}/${fileName}`, file);
                        if (!uploadErr) uploadedCount++;
                        else console.error("Upload error:", uploadErr.message);
                    }
                    if (uploadedCount > 0) {
                        toast.success(`${uploadedCount} archivo${uploadedCount > 1 ? "s" : ""} adjuntado${uploadedCount > 1 ? "s" : ""}`);
                    }
                    if (uploadedCount < filesToUpload.length) {
                        toast.error(`${filesToUpload.length - uploadedCount} archivo(s) no se pudieron subir. Verificá que el bucket "caso-archivos" exista en Supabase Storage.`);
                    }
                }

                const estadoMsg = fechaInspeccion ? "IP Coordinada" : "Pendiente Coordinación";
                setCasosCreados(prev => prev + 1);
                toast.success(`Caso creado → ${estadoMsg}`, {
                    description: `Siniestro ${numSiniestro}`,
                });

                if (modoSecuencial) {
                    resetForm();
                    const input = document.getElementById("num_siniestro") as HTMLInputElement;
                    input?.focus();
                } else {
                    router.refresh();
                    setTimeout(() => {
                        router.push(`/casos/${result.casoId}?nuevo=1`);
                    }, 500);
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Contador y modo */}
            {casosCreados > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-color-success-soft border border-color-success/20 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-color-success" />
                    <span className="text-color-success font-medium font-outfit tracking-wide">{casosCreados} {casosCreados === 1 ? "caso cargado" : "casos cargados"} hoy</span>
                </div>
            )}

            {/* Smart Parser Widget */}
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-brand-primary font-semibold font-outfit">
                    <Sparkles className="w-4 h-4" />
                    <h3>Auto-completado Inteligente</h3>
                </div>
                <p className="text-xs text-text-muted">
                    Copiá el texto completo de la ficha de Sancor y pegalo acá. El asistente extraerá siniestro, patente, vehículo, gestor e instrucciones.
                </p>
                <textarea
                    value={textoParser}
                    onChange={(e) => { setTextoParser(e.target.value); setParserResult(null); }}
                    placeholder="Detalles de orden de servicio\nSiniestro nro. 2003939957\nPatente AB311WJ\nOS 530403 - Pericias Mecánicas..."
                    rows={3}
                    className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary resize-none placeholder:text-text-muted/60"
                />
                <Button
                    type="button"
                    onClick={async () => {
                        if (!textoParser.trim()) return;
                        setIsParsing(true);
                        setParserResult(null);
                        try {
                            const res = await fetch("/api/parsear-caso", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ texto_crudo: textoParser })
                            });
                            const { success, data } = await res.json();
                            if (success && data) {
                                const details: Record<string, string> = {};

                                if (data.numero_siniestro) { setNumSiniestro(data.numero_siniestro); details["Siniestro"] = data.numero_siniestro; }
                                if (data.numero_servicio) { setNumServicio(data.numero_servicio); details["Servicio (OS)"] = data.numero_servicio; }
                                if (data.dominio) { setDominio(data.dominio); details["Patente"] = data.dominio; }
                                if (data.vehiculo) { setMarca(data.vehiculo); details["Vehículo"] = data.vehiculo; }
                                if (data.instrucciones) { setDescripcion(data.instrucciones); details["Instrucciones"] = data.instrucciones.substring(0, 60) + (data.instrucciones.length > 60 ? "..." : ""); }
                                else { setDescripcion(textoParser); }

                                let gestorHelper: string | undefined;
                                if (data.gestor_nombre) {
                                    const nombreRaw = data.gestor_nombre.trim();
                                    const palabrasRaw = nombreRaw.toLowerCase().split(/\s+/);
                                    // 1. Exact fullname match (case-insensitive)
                                    let matchedGestor = gestores.find(g => g.nombre.toLowerCase() === nombreRaw.toLowerCase());
                                    // 2. Fallback: apellido (first word) startsWith
                                    if (!matchedGestor) {
                                        matchedGestor = gestores.find(g => g.nombre.toLowerCase().startsWith(palabrasRaw[0]));
                                    }
                                    // 3. Fuzzy: todas las palabras del gestor guardado están en el nombre parseado
                                    if (!matchedGestor) {
                                        matchedGestor = gestores.find(g => {
                                            const palabrasGuardadas = g.nombre.toLowerCase().split(/\s+/);
                                            return palabrasGuardadas.every((p: string) => palabrasRaw.includes(p));
                                        });
                                    }
                                    if (matchedGestor) {
                                        setGestorId(matchedGestor.id);
                                        details["Gestor"] = `${nombreRaw} (asignado)`;
                                    } else {
                                        gestorHelper = nombreRaw;
                                        details["Gestor"] = `${nombreRaw} (no encontrado)`;
                                    }
                                }

                                setParserResult({
                                    campos_encontrados: data.campos_encontrados || [],
                                    campos_no_encontrados: data.campos_no_encontrados || [],
                                    details,
                                    gestorHelper,
                                });

                                if (!data.numero_siniestro) {
                                    toast.error("No se pudo detectar un número de siniestro en el texto. Verificá que copiaste todo el contenido de la ficha.");
                                } else {
                                    toast.success(`${data.campos_encontrados?.length || 0} campos extraídos`);
                                }
                            } else {
                                toast.error("No se detectó información estructurada.");
                            }
                        } catch (e) {
                            toast.error("Error interconectando con el Parser.");
                        } finally {
                            setIsParsing(false);
                        }
                    }}
                    disabled={isParsing || !textoParser.trim()}
                    className="bg-brand-primary text-white w-full h-8 text-xs font-medium"
                >
                    {isParsing ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Procesando...</> : "Parsear texto y auto-completar"}
                </Button>

                {/* Visual Checklist */}
                {parserResult && (
                    <div className="bg-bg-primary border border-border rounded-lg p-3 space-y-1.5 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                        {parserResult.campos_encontrados.map(c => (
                            <div key={c} className="flex items-start gap-2 text-color-success">
                                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span><strong>{c}:</strong> <span className="text-text-primary">{parserResult.details[c] || "✓"}</span></span>
                            </div>
                        ))}
                        {parserResult.campos_no_encontrados.map(c => (
                            <div key={c} className="flex items-center gap-2 text-text-muted">
                                <X className="w-3.5 h-3.5 shrink-0" />
                                <span>{c}: completar manualmente</span>
                            </div>
                        ))}
                        {["Fecha de inspección", "Dirección", "Perito de calle"].map(c => (
                            <div key={c} className="flex items-center gap-2 text-text-muted">
                                <X className="w-3.5 h-3.5 shrink-0" />
                                <span>{c}: completar manualmente</span>
                            </div>
                        ))}
                        {parserResult.gestorHelper && (
                            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                                Gestor detectado: <strong>{parserResult.gestorHelper}</strong> — no encontrado en el sistema. Podés agregarlo en Directorio → Gestores.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="num_siniestro">Nº Siniestro <span className="text-danger">*</span></Label>
                        <Input id="num_siniestro" value={numSiniestro} onChange={e => setNumSiniestro(e.target.value)}
                            placeholder="SIN-12345" required className="bg-bg-tertiary border-border font-mono" autoFocus />
                        {existingCaso && (
                            <div className={`mt-2 p-3 rounded-lg border text-sm animate-in fade-in duration-200 ${casoOrigenId ? 'bg-brand-primary/10 border-brand-primary/30' : 'bg-color-warning-soft border-color-warning/20'}`}>
                                <p className="font-medium text-text-primary mb-1">
                                    ⚠️ Siniestro {existingCaso.numero_siniestro} ya existe
                                </p>
                                <p className="text-text-secondary text-xs mb-2">
                                    {existingCaso.tipo_inspeccion?.replace(/_/g, ' ')} · {existingCaso.estado?.replace(/_/g, ' ')} · {existingCaso.dominio || 'Sin patente'} · {existingCaso.marca || ''}
                                </p>
                                {casoOrigenId ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-brand-primary font-medium text-xs">✓ Vinculado como Ampliación/Re-inspección</span>
                                        <button type="button" onClick={() => setCasoOrigenId(null)}
                                            className="text-xs text-text-muted hover:text-text-primary underline">Desvincular</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button type="button"
                                            onClick={() => setCasoOrigenId(existingCaso.id)}
                                            className="px-3 py-1 rounded-md text-xs font-medium bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors">
                                            Vincular como Ampliación
                                        </button>
                                        <button type="button"
                                            onClick={() => { setExistingCaso(null); }}
                                            className="px-3 py-1 rounded-md text-xs font-medium border border-border text-text-muted hover:text-text-primary transition-colors">
                                            Crear independiente
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="num_servicio">Nº Servicio</Label>
                        <Input id="num_servicio" value={numServicio} onChange={e => setNumServicio(e.target.value)}
                            placeholder="SRV-001" className="bg-bg-tertiary border-border font-mono" />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="link_orion">Link de Orion</Label>
                        <Input id="link_orion" value={linkOrion} onChange={e => setLinkOrion(e.target.value)}
                            placeholder="https://..." className="bg-bg-tertiary border-border text-xs" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="tipo_ip">Tipo de Inspección</Label>
                        <select id="tipo_ip" value={tipoIp} onChange={e => setTipoIp(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm">
                            <option value="ip_con_orden">IP con Orden</option>
                            <option value="posible_dt">Posible DT</option>
                            <option value="ip_sin_orden">IP sin Orden</option>
                            <option value="ampliacion">Ampliación</option>
                            <option value="ausente">Ausente</option>
                            <option value="terceros">Terceros</option>
                            <option value="ip_camiones">IP Camiones</option>
                            <option value="ip_remota">IP Remota</option>
                            <option value="sin_honorarios">Sin Honorarios</option>
                            <option value="ip_final_intermedia">IP Final/Intermedia</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="gestor">Gestor de Reclamo</Label>
                        <select id="gestor" value={gestorId} onChange={e => setGestorId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm">
                            <option value="">Seleccione gestor...</option>
                            {gestores.map(g => (
                                <option key={g.id} value={g.id}>{g.nombre} {g.sector ? `(${g.sector})` : ""}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fecha_ip">Fecha de Inspección</Label>
                        <Input id="fecha_ip" type="date" value={fechaInspeccion} onChange={e => setFechaInspeccion(e.target.value)}
                            className="bg-bg-tertiary border-border" />
                        <p className="text-xs text-text-muted">
                            {fechaInspeccion ? "→ Estado: IP Coordinada" : "Sin fecha → Estado: Pendiente Coordinación"}
                        </p>
                    </div>
                </div>

                {/* ── Sección 2: Asignación ── */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border-subtle pb-2 font-outfit mt-4">Asignación de Peritos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="perito_calle">Perito de Calle</Label>
                            <select id="perito_calle" value={peritoCelleId} onChange={e => setPeritoCelleId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm">
                                <option value="">Seleccione perito calle...</option>
                                {peritosCalle.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="perito_carga">Perito de Carga</Label>
                            <select id="perito_carga" value={peritoCargaId} onChange={e => setPeritoCargaId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm">
                                <option value="">Seleccione perito carga...</option>
                                {peritosCarga.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Sección 3: Vehículo y Ubicación ── */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border-subtle pb-2 font-outfit mt-4">Vehículo y Ubicación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dominio">Patente</Label>
                            <Input id="dominio" value={dominio} onChange={e => setDominio(e.target.value)}
                                placeholder="AB123CD" className="bg-bg-tertiary border-border uppercase font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="marca">Detalle del Vehículo (Modelo / Año / Color)</Label>
                            <Input id="marca" value={marca} onChange={e => setMarca(e.target.value)}
                                placeholder="EJ: FIAT CRONOS DRIVE 1.4 2024" className="bg-bg-tertiary border-border capitalize" />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border-subtle">
                        <Label htmlFor="taller">Taller (Autocompleta dirección al seleccionar)</Label>
                        <select id="taller" value={tallerId} onChange={e => setTallerId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm text-brand-primary font-medium focus:ring-1 focus:ring-brand-primary">
                            <option value="">Ninguno / Dirección manual...</option>
                            {talleres.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre} — {t.localidad || "Sin localidad"}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección de Inspección</Label>
                            <Input id="direccion" value={direccion} onChange={e => setDireccion(e.target.value)}
                                placeholder="Av. Rivadavia 1234, CABA" className="bg-bg-tertiary border-border" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="localidad">Localidad</Label>
                            <Input id="localidad" value={localidad} onChange={e => setLocalidad(e.target.value)}
                                placeholder="Quilmes" className="bg-bg-tertiary border-border" />
                        </div>
                    </div>
                </div>

                {/* ── Sección 4: Descripción ── */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border-subtle pb-2 font-outfit mt-4">Descripción enviada por Gestor del caso</h3>
                    <textarea
                        value={descripcion}
                        onChange={e => setDescripcion(e.target.value)}
                        rows={4}
                        placeholder="Información adicional del caso (reemplazo del bloc de notas). Pegá acá los datos de Sancor..."
                        className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary resize-y"
                    />
                </div>

                {/* ── Sección 5: Archivos Adjuntos ── */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border-subtle pb-2 font-outfit mt-4">Archivos Adjuntos (Carátula, Denuncia, etc.)</h3>
                    <div
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault(); e.stopPropagation(); setDragActive(false);
                            if (e.dataTransfer.files.length > 0) {
                                setArchivos(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-5 text-center transition-all cursor-pointer ${
                            dragActive ? "border-brand-primary bg-brand-primary/5" : "border-border hover:border-border-hover"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) {
                                    setArchivos(prev => [...prev, ...Array.from(e.target.files!)]);
                                    e.target.value = "";
                                }
                            }}
                        />
                        <Upload className="w-6 h-6 text-text-muted mx-auto mb-1" />
                        <p className="text-sm text-text-secondary">
                            Arrastrá archivos acá o <span className="text-brand-primary underline">seleccioná</span>
                        </p>
                        <p className="text-xs text-text-muted">PDF, JPG, PNG</p>
                    </div>
                    {archivos.length > 0 && (
                        <div className="space-y-1">
                            {archivos.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {file.type.startsWith("image/") ? <ImageIcon className="w-4 h-4 text-brand-secondary shrink-0" /> : <FileText className="w-4 h-4 text-text-muted shrink-0" />}
                                        <span className="truncate text-text-primary">{file.name}</span>
                                        <span className="text-xs text-text-muted shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                                    </div>
                                    <button type="button" onClick={() => setArchivos(prev => prev.filter((_, i) => i !== idx))} className="text-text-muted hover:text-danger ml-2">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-6 mt-4 border-t border-border-subtle gap-4">
                    <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none">
                        <input type="checkbox" checked={modoSecuencial} onChange={e => setModoSecuencial(e.target.checked)}
                            className="rounded border-border" />
                        Modo secuencial (limpiar y seguir cargando)
                    </label>
                    <div className="flex gap-3">
                        <Button variant="outline" type="button" onClick={() => router.back()}
                            className="text-text-primary hover:text-text-primary border-border hover:bg-bg-tertiary">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}
                            className="bg-brand-primary hover:bg-brand-primary-hover text-white min-w-[160px]">
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...</>
                            ) : (
                                <><Plus className="w-4 h-4 mr-2" /> Crear Caso</>
                            )}
                        </Button>
                    </div>
                </div>
            </form >
        </div >
    );
}
