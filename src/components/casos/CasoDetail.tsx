

import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "./EstadoBadge";
import { TipoIPBadge } from "./TipoIPBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GaleriaFotosResponsive } from "@/components/inspeccion/GaleriaFotosResponsive";
import { VistaInformeCampo } from "@/components/inspeccion/VistaInformeCampo";
import Link from "next/link";

import { SelectorEstado } from "./SelectorEstado";
import { ZonaArchivos } from "./ZonaArchivos";
import { TimelineExpediente } from "./TimelineExpediente";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ObservacionesPericia } from "./ObservacionesPericia";
import { Car, MapPin, ClipboardList, Users, ClipboardType, FileText, Calendar, CheckCircle, Camera, Link2 } from "lucide-react";
import { GenerarLinkInspeccion } from "./GenerarLinkInspeccion";
import { BotonAusente } from "./BotonAusente";
import { GestorRepliesBanner } from "./GestorRepliesBanner";
import EditableCoordinacion from "./EditableCoordinacion";
import { EditableField } from "./EditableField";
import { DerivacionPeritoBanner } from "./DerivacionPeritoBanner";

/* ═══ HELPER: Badge de método de inspección ═══ */
function InspeccionMetodoBadge({ tipoInspeccion, estado }: { tipoInspeccion: string; estado: string }) {
    const estadosPostIP = ["pendiente_carga", "pendiente_presupuesto", "licitando_repuestos",
        "en_consulta_cia", "ip_cerrada", "facturada", "contactado"];
    if (!estadosPostIP.includes(estado)) return null;

    if (tipoInspeccion === "ip_remota") {
        return (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-color-info/15 text-color-info border border-color-info/25 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Remota
            </span>
        );
    }
    return (
        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-color-success/15 text-color-success border border-color-success/25 flex items-center gap-1">
            <Camera className="w-3 h-3" /> Presencial
        </span>
    );
}

export async function CasoDetail({ id, esNuevo = false }: { id: string; esNuevo?: boolean }) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    let rol = "admin";
    let currentUserId = "";
    let currentUserNombre = "";
    if (user) {
        currentUserId = user.id;
        const { data: userData } = await supabase.from("usuarios").select("rol, roles, nombre, apellido").eq("id", user.id).single();
        if (userData) {
            const rolesArr: string[] = userData.roles || [];
            if (rolesArr.includes("admin") || userData.rol === "admin") {
                rol = "admin";
            } else if (rolesArr.includes("carga") || userData.rol === "carga") {
                rol = "carga";
            } else if (rolesArr.includes("calle") || userData.rol === "calle") {
                rol = "calle";
            } else {
                rol = userData.rol;
            }
            currentUserNombre = `${userData.nombre} ${userData.apellido}`;
        }
    }

    const { data: usuariosAll } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, rol, roles")
        .eq("activo", true)
        .order("nombre");

    const { data: gestores } = await supabase
        .from("gestores")
        .select("id, nombre, sector")
        .eq("activo", true)
        .order("nombre");

    const { data: caso, error } = await supabase
        .from("casos")
        .select(`
      *,
      compania:companias(nombre),
      taller:talleres(nombre, direccion),
      perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido, email),
      perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido),
      gestor:gestores(nombre, email, sector),
      historial_estados(id, estado_nuevo, created_at, usuario:usuarios(nombre, apellido))
    `)
        .eq("id", id)
        .single();

    if (error || !caso) {
        return (
            <div className="flex items-center justify-center p-12 text-danger">
                No se encontró información para el caso {id}. Puede que no exista o no tengas permisos para visualizarlo.
            </div>
        );
    }

    const { data: casosRelacionados } = await supabase
        .from("casos")
        .select("id, numero_siniestro, tipo_inspeccion, estado, fecha_derivacion, created_at, caso_origen_id, dominio")
        .eq("numero_siniestro", caso.numero_siniestro)
        .order("created_at", { ascending: true });

    const hayRelacionados = casosRelacionados && casosRelacionados.length > 1;

    // Opciones para EditableField
    const peritosActivos = usuariosAll || [];
    const opcionesPeritosCalle = peritosActivos
        .filter((u: any) => u.rol === "calle" || u.rol === "admin" || (u.roles || []).includes("calle") || (u.roles || []).includes("admin"))
        .map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido}` }));
    
    const opcionesPeritosCarga = peritosActivos
        .filter((u: any) => u.rol === "carga" || u.rol === "admin" || (u.roles || []).includes("carga") || (u.roles || []).includes("admin"))
        .map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido}` }));

    const opcionesGestores = (gestores || []).map((g: any) => ({ value: g.id, label: `${g.nombre}${g.sector ? ` (${g.sector})` : ""}` }));
    const opcionesTipoIP = [
        { value: "ip_con_orden", label: "IP con Orden" },
        { value: "posible_dt", label: "Posible DT" },
        { value: "ip_sin_orden", label: "IP sin Orden" },
        { value: "ampliacion", label: "Ampliación" },
        { value: "ausente", label: "Ausente" },
        { value: "terceros", label: "Terceros" },
        { value: "ip_camiones", label: "IP Camiones" },
        { value: "ip_remota", label: "IP Remota" },
        { value: "sin_honorarios", label: "Sin Honorarios" },
        { value: "ip_final_intermedia", label: "IP Final/Intermedia" },
    ];

    const esPeritoCalleDueno = currentUserId === caso.perito_calle_id;
    const esAdminOCarga = rol === "admin" || rol === "carga";

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* ════════════════════════════════════════════════════════════
                MOBILE HEADER (md:hidden)
            ════════════════════════════════════════════════════════════ */}
            <div className="block md:hidden border-b border-border pb-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-3xl font-black font-mono uppercase tracking-wider text-text-primary">
                        {caso.dominio || "S/P"}
                    </span>
                    <EstadoBadge estado={caso.estado} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-mono text-text-muted">#{caso.numero_siniestro}</p>
                    <span className="text-border">•</span>
                    <p className="text-sm text-text-secondary">{caso.marca} {caso.modelo}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <TipoIPBadge tipo={caso.tipo_inspeccion} />
                    <InspeccionMetodoBadge tipoInspeccion={caso.tipo_inspeccion} estado={caso.estado} />
                </div>
                <SelectorEstado casoId={caso.id} estadoActual={caso.estado} userRol={rol} />
            </div>

            {/* ════════════════════════════════════════════════════════════
                DESKTOP HEADER (hidden md:flex)
            ════════════════════════════════════════════════════════════ */}
            <div className="hidden md:flex flex-row justify-between items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
                        Siniestro: {caso.numero_siniestro} — {caso.marca} {caso.modelo} {caso.dominio ? `(${caso.dominio})` : ''}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-text-muted">
                        {esAdminOCarga ? (
                            <EditableField
                                casoId={caso.id}
                                campo="tipo_inspeccion"
                                valorActual={caso.tipo_inspeccion}
                                tipo="select"
                                opciones={opcionesTipoIP}
                                placeholder="Tipo IP"
                                textClassName="font-medium text-xs"
                            />
                        ) : (
                            <TipoIPBadge tipo={caso.tipo_inspeccion} />
                        )}
                        <InspeccionMetodoBadge tipoInspeccion={caso.tipo_inspeccion} estado={caso.estado} />
                        <span className="text-border">•</span>
                        <span>Sancor Seguros</span>
                        <span className="text-border">•</span>
                        <span>Ingreso: {format(new Date(caso.created_at), "dd MMM yyyy", { locale: es })}</span>
                        {caso.numero_servicio && (
                            <>
                                <span className="text-border">•</span>
                                <span className="font-mono text-xs">SRV: {caso.numero_servicio}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <EstadoBadge estado={caso.estado} />
                    <SelectorEstado casoId={caso.id} estadoActual={caso.estado} userRol={rol} />
                </div>
            </div>

            {/* Panel de Historial del Siniestro (ampliaciones/re-inspecciones) */}
            {hayRelacionados && (
                <div className="bg-bg-secondary border border-brand-primary/20 rounded-xl p-4 animate-in fade-in">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">
                        <ClipboardList className="w-4 h-4 text-brand-secondary" />
                        Historial del Siniestro {caso.numero_siniestro}
                        <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full border border-brand-primary/20 ml-auto">
                            {casosRelacionados!.length} registros
                        </span>
                    </h3>
                    <div className="space-y-1.5">
                        {casosRelacionados!.map((cr: any, idx: number) => (
                            <a key={cr.id} href={`/casos/${cr.id}`}
                                className={`block p-2.5 rounded-lg border text-xs transition-all ${cr.id === id ? 'bg-brand-primary/10 border-brand-primary/30 ring-1 ring-brand-primary/20' : 'bg-bg-tertiary border-border hover:border-brand-primary/30'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-text-muted w-5">{idx + 1}.</span>
                                        <span className={`font-medium ${cr.id === id ? 'text-brand-primary' : 'text-text-primary'}`}>
                                            {cr.tipo_inspeccion?.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                        {cr.caso_origen_id && (
                                            <span className="text-[9px] bg-color-warning-soft text-color-warning px-1.5 py-0.5 rounded border border-color-warning/20">
                                                Ampliación
                                            </span>
                                        )}
                                        {cr.id === id && (
                                            <span className="text-[9px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded">
                                                Actual
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-text-muted">
                                        <span>{cr.estado?.replace(/_/g, ' ')}</span>
                                        <span>{cr.fecha_derivacion ? format(new Date(cr.fecha_derivacion), "dd/MM/yy", { locale: es }) : '—'}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    {/* Derivación al Perito de Calle */}
                    {esAdminOCarga && (
                        <DerivacionPeritoBanner
                            casoId={caso.id}
                            siniestro={caso.numero_siniestro}
                            peritoNombre={caso.perito_calle ? `${(caso.perito_calle as any).nombre} ${(caso.perito_calle as any).apellido}` : undefined}
                            peritoEmail={caso.perito_calle ? (caso.perito_calle as any).email : undefined}
                            fechaInspeccion={caso.fecha_inspeccion_programada}
                            direccion={caso.direccion_inspeccion}
                            localidad={caso.localidad}
                            vehiculo={caso.marca}
                            dominio={caso.dominio}
                            gestorNombre={caso.gestor ? (caso.gestor as any).nombre : undefined}
                            descripcion={caso.datos_crudos_sancor}
                            derivacionEnviadaAt={caso.derivacion_enviada_at}
                            esNuevo={esNuevo}
                        />
                    )}

                    {/* ════════════════════════════════════════════════════════════
                        MOBILE ACCORDIONS (block md:hidden)
                    ════════════════════════════════════════════════════════════ */}
                    <div className="block md:hidden">
                        <Accordion type="multiple" defaultValue={["datos-expediente"]} className="space-y-2">
                            {/* Accordion: Datos del Expediente (merged) */}
                            <AccordionItem value="datos-expediente" className="border border-border rounded-xl overflow-hidden bg-bg-secondary">
                                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                                    <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-brand-secondary" /> Datos del Expediente</span>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <div className="space-y-4">
                                        {/* Vehículo + Dominio */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-text-muted mb-1">Vehículo</p>
                                                <EditableField casoId={caso.id} campo="marca" valorActual={caso.marca} tipo="text" placeholder="Ej: FIAT CRONOS 2024" textClassName="font-semibold text-base" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted mb-1">Dominio</p>
                                                <EditableField casoId={caso.id} campo="dominio" valorActual={caso.dominio} tipo="text" placeholder="S/P" textClassName="font-semibold text-base uppercase tracking-wider" />
                                            </div>
                                        </div>

                                        {/* Coordinación */}
                                        <EditableCoordinacion casoId={caso.id} estadoActual={caso.estado} direccionInicial={caso.direccion_inspeccion || ""} localidadInicial={caso.localidad || ""} fechaProgramadaInicial={caso.fecha_inspeccion_programada} rol={rol} />

                                        {/* Asignaciones */}
                                        <div className="pt-3 border-t border-border/50 space-y-3">
                                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Asignaciones</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-[11px] text-text-muted">Perito Calle</p>
                                                    <p className="text-sm font-medium text-text-primary">{caso.perito_calle ? `${caso.perito_calle.nombre} ${caso.perito_calle.apellido}` : 'Sin asignar'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-text-muted">Perito Carga</p>
                                                    <p className="text-sm font-medium text-text-primary">{caso.perito_carga ? `${caso.perito_carga.nombre} ${caso.perito_carga.apellido}` : 'Sin asignar'}</p>
                                                </div>
                                            </div>
                                            {caso.gestor && (
                                                <div>
                                                    <p className="text-[11px] text-text-muted">Gestor</p>
                                                    <p className="text-sm font-medium text-text-primary">{caso.gestor.nombre}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Observaciones del Gestor */}
                                        {caso.datos_crudos_sancor && (
                                            <div className="pt-3 border-t border-border/50">
                                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Observaciones del Gestor</p>
                                                <div className="bg-bg-elevated border border-border/60 rounded-lg p-3 relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary/70" />
                                                    {(rol === "admin" || esPeritoCalleDueno) ? (
                                                        <EditableField casoId={caso.id} campo="datos_crudos_sancor" valorActual={caso.datos_crudos_sancor} tipo="textarea" placeholder="Sin datos" textClassName="text-sm text-text-primary leading-relaxed italic pl-2" className="w-full" />
                                                    ) : (
                                                        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap italic pl-2">{caso.datos_crudos_sancor}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Observaciones Internas */}
                                        <div className="pt-3 border-t border-border/50">
                                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Observaciones Internas</p>
                                            <EditableField casoId={caso.id} campo="notas_admin" valorActual={caso.notas_admin} tipo="textarea" placeholder="Agregar nota interna..." textClassName="text-sm" className="w-full" />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Accordion: Inspección */}
                            {(esAdminOCarga || (rol === "calle" && caso.estado === "ip_coordinada")) && (
                                <AccordionItem value="inspeccion" className="border border-border rounded-xl overflow-hidden bg-bg-secondary">
                                    <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                                        <span className="flex items-center gap-2"><Camera className="w-4 h-4 text-brand-secondary" /> Inspección</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-3">
                                            {esAdminOCarga && <GenerarLinkInspeccion casoId={caso.id} />}
                                            {rol === "calle" && caso.estado === "ip_coordinada" && (
                                                <>
                                                    <Link href={`/inspeccion-campo/${caso.id}`} className="block">
                                                        <button className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2">
                                                            📷 Comenzar Inspección
                                                        </button>
                                                    </Link>
                                                    <BotonAusente casoId={caso.id} />
                                                </>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                    </div>

                    {/* ════════════════════════════════════════════════════════════
                        DESKTOP: Datos del Expediente (hidden md:block)
                    ════════════════════════════════════════════════════════════ */}
                    <Card className="hidden md:block">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-brand-secondary" />
                                Datos del Expediente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                {/* Vehículo */}
                                <div>
                                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Vehículo</p>
                                    <EditableField
                                        casoId={caso.id} campo="marca" valorActual={caso.marca}
                                        tipo="text" placeholder="Ej: FIAT CRONOS 2024"
                                        textClassName="font-semibold text-text-primary text-base"
                                    />
                                </div>
                                {/* Dominio */}
                                <div>
                                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Dominio</p>
                                    <EditableField
                                        casoId={caso.id} campo="dominio" valorActual={caso.dominio}
                                        tipo="text" placeholder="Sin dominio"
                                        textClassName="font-semibold text-text-primary text-base uppercase tracking-wider"
                                    />
                                </div>

                                {/* Coordinación (dirección, localidad, fecha IP) */}
                                <EditableCoordinacion
                                    casoId={caso.id} estadoActual={caso.estado}
                                    direccionInicial={caso.direccion_inspeccion || ""}
                                    localidadInicial={caso.localidad || ""}
                                    fechaProgramadaInicial={caso.fecha_inspeccion_programada}
                                    rol={rol}
                                />

                                {/* ── Asignaciones ── */}
                                <div className="md:col-span-2 mt-1 pt-4 border-t border-border/50">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" /> Asignaciones
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-3 rounded-lg bg-bg-secondary border border-border/60 flex flex-col gap-1 transition-colors hover:border-brand-primary/30">
                                            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Perito de Calle</p>
                                            <EditableField
                                                casoId={caso.id} campo="perito_calle_id"
                                                valorActual={caso.perito_calle_id}
                                                displayValue={caso.perito_calle ? `${caso.perito_calle.nombre} ${caso.perito_calle.apellido}` : undefined}
                                                tipo="select" opciones={opcionesPeritosCalle}
                                                placeholder="Seleccionar..." textClassName="font-medium"
                                            />
                                        </div>
                                        <div className="p-3 rounded-lg bg-bg-secondary border border-border/60 flex flex-col gap-1 transition-colors hover:border-brand-primary/30">
                                            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Perito de Carga</p>
                                            <EditableField
                                                casoId={caso.id} campo="perito_carga_id"
                                                valorActual={caso.perito_carga_id}
                                                displayValue={caso.perito_carga ? `${caso.perito_carga.nombre} ${caso.perito_carga.apellido}` : undefined}
                                                tipo="select" opciones={opcionesPeritosCarga}
                                                placeholder="Seleccionar..." textClassName="font-medium"
                                            />
                                        </div>
                                        <div className="p-3 rounded-lg bg-bg-secondary border border-border/60 flex flex-col gap-1 transition-colors hover:border-brand-primary/30">
                                            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Gestor</p>
                                            <EditableField
                                                casoId={caso.id} campo="gestor_id"
                                                valorActual={caso.gestor_id}
                                                displayValue={caso.gestor?.nombre}
                                                tipo="select" opciones={opcionesGestores}
                                                placeholder="Seleccionar..." textClassName="font-medium"
                                            />
                                            {caso.gestor?.email && (
                                                <a href={`mailto:${caso.gestor.email}`} className="text-xs text-brand-primary hover:underline -mt-0.5">{caso.gestor.email}</a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Fechas ── */}
                                <div className="md:col-span-2 mt-1 pt-4 border-t border-border/50 grid grid-cols-2 gap-x-8">
                                    <div>
                                        <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha de Carga</p>
                                        <EditableField casoId={caso.id} campo="fecha_carga_sistema" valorActual={caso.fecha_carga_sistema} tipo="date" placeholder="No registrada" textClassName="font-medium text-text-primary text-sm" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Fecha de Cierre</p>
                                        <EditableField casoId={caso.id} campo="fecha_cierre" valorActual={caso.fecha_cierre} tipo="date" placeholder="No registrada" textClassName="font-medium text-text-primary text-sm" />
                                    </div>
                                </div>

                                {/* ── Observaciones del Gestor ── */}
                                {caso.datos_crudos_sancor && (
                                    <div className="md:col-span-2 mt-1 pt-4 border-t border-border/50">
                                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <ClipboardType className="w-3.5 h-3.5" /> Observaciones del Gestor
                                        </p>
                                        <div className="bg-bg-elevated border border-border/60 rounded-lg p-4 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary/70" />
                                            {(rol === "admin" || esPeritoCalleDueno) ? (
                                                <EditableField
                                                    casoId={caso.id} campo="datos_crudos_sancor" valorActual={caso.datos_crudos_sancor}
                                                    tipo="textarea" placeholder="Sin datos de derivación"
                                                    textClassName="text-sm text-text-primary leading-relaxed italic pl-2"
                                                />
                                            ) : (
                                                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap italic pl-2">
                                                    &quot;{caso.datos_crudos_sancor}&quot;
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Observaciones Internas ── */}
                                <div className="md:col-span-2 mt-1 pt-4 border-t border-border/50">
                                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" /> Observaciones Internas
                                    </p>
                                    <EditableField
                                        casoId={caso.id} campo="notas_admin" valorActual={caso.notas_admin}
                                        tipo="textarea" placeholder="Clic para agregar una nota interna (solo personal del estudio)..."
                                        textClassName="text-sm" className="w-full"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ════════════════════════════════════════════════════════════
                        DESKTOP: Bloque Inspección (hidden md:block)
                    ════════════════════════════════════════════════════════════ */}
                    {(esAdminOCarga || (rol === "calle" && caso.estado === "ip_coordinada")) && (
                        <Card className="hidden md:block">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-brand-secondary" />
                                    Inspección
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {esAdminOCarga && <GenerarLinkInspeccion casoId={caso.id} />}
                                {rol === "calle" && caso.estado === "ip_coordinada" && (
                                    <div className="space-y-3">
                                        <div className="bg-bg-secondary border border-border rounded-xl p-6 text-center space-y-4">
                                            <h3 className="text-lg font-bold text-text-primary">Inspección Presencial</h3>
                                            <p className="text-sm text-text-muted">Iniciá el flujo completo: fotos → informe → firma del taller</p>
                                            <Link href={`/inspeccion-campo/${caso.id}`}>
                                                <button className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2 mt-2">
                                                    📷 Comenzar Inspección
                                                </button>
                                            </Link>
                                            <BotonAusente casoId={caso.id} />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ════════════════════════════════════════════════════════════
                        Informe de Inspección de Campo (post-inspección)
                    ════════════════════════════════════════════════════════════ */}
                    {(caso.estado === "pendiente_carga" ||
                        caso.estado === "pendiente_presupuesto" ||
                        caso.estado === "licitando_repuestos" ||
                        caso.estado === "en_consulta_cia" ||
                        caso.estado === "ip_cerrada" ||
                        caso.estado === "facturada" ||
                        caso.estado === "contactado") && (
                            <div className="pt-2 animate-in fade-in duration-500">
                                <VistaInformeCampo casoId={caso.id} />
                            </div>
                        )}

                    {/* ════════════════════════════════════════════════════════════
                        Galería Fotográfica + Observaciones
                    ════════════════════════════════════════════════════════════ */}
                    <div className="pt-2 animate-in fade-in duration-500">
                        <GaleriaFotosResponsive casoId={caso.id} />
                        <ObservacionesPericia
                            casoId={caso.id}
                            texto={caso.observaciones_pericia}
                            audioUrl={caso.audio_pericia_url}
                            puedeEditar={currentUserId === caso.perito_calle_id || rol === "admin"}
                            esPresencial={caso.tipo_inspeccion !== "ip_remota" && (
                                caso.estado === "pendiente_carga" || caso.estado === "pendiente_presupuesto" ||
                                caso.estado === "licitando_repuestos" || caso.estado === "en_consulta_cia" ||
                                caso.estado === "ip_cerrada" || caso.estado === "facturada" || caso.estado === "contactado"
                            )}
                        />
                    </div>

                    {/* ════════════════════════════════════════════════════════════
                        Documentación
                    ════════════════════════════════════════════════════════════ */}
                    <Card>
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-brand-secondary" />
                                Documentación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ZonaArchivos casoId={caso.id} />
                        </CardContent>
                    </Card>
                </div>

                {/* Columna derecha: Timeline y Actividad */}
                <div className="lg:col-span-1">
                    <Card className="h-full bg-bg-secondary/20">
                        <CardContent className="pt-6">
                            <TimelineExpediente
                                casoId={caso.id}
                                usuariosAll={usuariosAll || []}
                                currentUserId={currentUserId}
                                currentUserNombre={currentUserNombre}
                                currentUserRol={rol}
                                historialEstados={caso.historial_estados}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
