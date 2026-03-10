

import { createClient } from "@/lib/supabase/server";
import { EstadoBadge } from "./EstadoBadge";
import { TipoIPBadge } from "./TipoIPBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { InformePericial } from "@/components/inspeccion/InformePericial";
import { GaleriaFotosResponsive } from "@/components/inspeccion/GaleriaFotosResponsive";
import { VistaInforme } from "@/components/inspeccion/VistaInforme";

import { SelectorEstado } from "./SelectorEstado";
import { ZonaArchivos } from "./ZonaArchivos";
import { TimelineExpediente } from "./TimelineExpediente";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, MapPin, ClipboardList, Users, ClipboardType, FileText } from "lucide-react";
import { EditableLinkOrion } from "./EditableLinkOrion";
import { GenerarLinkInspeccion } from "./GenerarLinkInspeccion";
import { GestorRepliesBanner } from "./GestorRepliesBanner";

export async function CasoDetail({ id }: { id: string }) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    let rol = "admin"; // Default fallback
    let currentUserId = "";
    let currentUserNombre = "";
    if (user) {
        currentUserId = user.id;
        const { data: userData } = await supabase.from("usuarios").select("rol, nombre, apellido").eq("id", user.id).single();
        if (userData) {
            rol = userData.rol;
            currentUserNombre = `${userData.nombre} ${userData.apellido}`;
        }
    }

    // Fetch usuarios activos para el selector de tareas
    const { data: usuariosAll } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, rol")
        .eq("activo", true)
        .order("nombre");

    const { data: caso, error } = await supabase
        .from("casos")
        .select(`
      *,
      compania:companias(nombre),
      taller:talleres(nombre, direccion),
      perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido),
      perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido),
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

    // Buscar todos los casos con el mismo número de siniestro (para historial de ampliaciones)
    const { data: casosRelacionados } = await supabase
        .from("casos")
        .select("id, numero_siniestro, tipo_inspeccion, estado, fecha_derivacion, created_at, caso_origen_id, dominio")
        .eq("numero_siniestro", caso.numero_siniestro)
        .order("created_at", { ascending: true });

    const hayRelacionados = casosRelacionados && casosRelacionados.length > 1;

    return (
        <div className="space-y-8">
            {/* Cabecera del caso */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
                        Siniestro: {caso.numero_siniestro} — Vehículo: {caso.marca} {caso.modelo} {caso.dominio ? `(${caso.dominio})` : ''}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-text-muted">
                        <TipoIPBadge tipo={caso.tipo_inspeccion} />
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

                    {/* Banner de Respuestas del Gestor */}
                    <GestorRepliesBanner
                        casoId={caso.id}
                        inicialTieneRespuesta={caso.tiene_respuesta_gestor}
                        gmailThreadId={caso.gmail_thread_id}
                    />

                    {/* Tarjeta Unificada: Vehículo e Inspección */}
                    <Card>
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Car className="w-5 h-5 text-brand-secondary" />
                                Información General
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Vehículo</p>
                                    <p className="font-semibold text-text-primary text-base">{caso.marca}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Dominio</p>
                                    <p className="font-semibold text-text-primary text-base uppercase tracking-wider">{caso.dominio}</p>
                                </div>
                                <div className="md:col-span-2 pt-4 border-t border-border/30">
                                    <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Ubicación para Inspección</p>
                                    <p className="font-medium text-text-primary">{caso.direccion_inspeccion}{caso.localidad ? `, ${caso.localidad}` : ""}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información del Gestor */}
                    {(caso.datos_crudos_sancor || caso.link_orion) && (
                        <Card className="bg-gradient-to-br from-bg-secondary/50 to-bg-primary">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ClipboardType className="w-5 h-5 text-brand-secondary" />
                                    Información del Gestor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {caso.link_orion && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-text-primary">Link de Orion:</span>
                                        <a href={caso.link_orion.startsWith('http') ? caso.link_orion : `https://${caso.link_orion}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline font-mono truncate max-w-full">
                                            {caso.link_orion}
                                        </a>
                                    </div>
                                )}
                                {caso.datos_crudos_sancor && (
                                    <div className="bg-bg-elevated border border-border/60 rounded-lg p-5 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary/70"></div>
                                        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap italic">
                                            &quot;{caso.datos_crudos_sancor}&quot;
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Asignaciones Operativas */}
                    <Card>
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-brand-secondary" />
                                Asignaciones Operativas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-bg-secondary border border-border/60 flex flex-col gap-1 transition-colors hover:border-brand-primary/30 hover:bg-bg-tertiary">
                                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Perito de Calle</p>
                                    <p className="font-medium text-text-primary">
                                        {caso.perito_calle ? `${caso.perito_calle.nombre} ${caso.perito_calle.apellido}` : "Sin asignar"}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-bg-secondary border border-border/60 flex flex-col gap-1 transition-colors hover:border-brand-primary/30 hover:bg-bg-tertiary">
                                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Perito de Carga</p>
                                    <p className="font-medium text-text-primary">
                                        {caso.perito_carga ? `${caso.perito_carga.nombre} ${caso.perito_carga.apellido}` : "Sin asignar"}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-bg-secondary border border-border/60 flex flex-col gap-1 transition-colors hover:border-brand-primary/30 hover:bg-bg-tertiary">
                                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Taller de Destino</p>
                                    <p className="font-medium text-text-primary line-clamp-1">
                                        {caso.taller?.nombre || "No especificado"}
                                    </p>
                                </div>
                                <EditableLinkOrion casoId={caso.id} linkOrion={caso.link_orion} />
                                <GenerarLinkInspeccion casoId={caso.id} />
                            </div>
                        </CardContent>
                    </Card>



                    {/* Módulo de Inspección (Solo Peritos de Calle en Estado IP Coordinada) */}
                    {rol === "calle" && caso.estado === "ip_coordinada" && (
                        <div className="mt-8 pt-6 border-t border-border animate-in fade-in duration-500">
                            <InformePericial casoId={caso.id} talleres={[]} />
                        </div>
                    )}

                    {/* Validación del Informe (Oficina/Carga) */}
                    {(caso.estado === "pendiente_carga" ||
                        caso.estado === "licitando_repuestos" ||
                        caso.estado === "en_consulta_cia" ||
                        caso.estado === "ip_cerrada" ||
                        caso.estado === "facturada") && (
                            <div className="mt-8 pt-6 border-t border-border animate-in fade-in duration-500">
                                <VistaInforme
                                    casoId={caso.id}
                                    puedeOperar={(rol === "carga" || rol === "admin") && caso.estado === "pendiente_carga"}
                                />
                            </div>
                        )}

                    {/* Galería Fotográfica Unificada */}
                    <div className="mt-8 pt-6 border-t border-border animate-in fade-in duration-500">
                        <GaleriaFotosResponsive casoId={caso.id} />
                    </div>

                    {/* F1.9: Zona de Archivos */}
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
