"use client";

import { useState } from "react";
import { Mail, RefreshCcw, Save, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function MailTemplatesEditor({ templates: initialTemplates }: { templates: any[] }) {
    const router = useRouter();
    const supabase = createClient();
    const [templates, setTemplates] = useState(initialTemplates);
    const [selectedId, setSelectedId] = useState<string | null>(initialTemplates[0]?.id || null);
    const [isSaving, setIsSaving] = useState(false);

    const activeTemplate = templates.find(t => t.id === selectedId);

    // Variables disponibles (Mock data para la preview)
    const availableVars = [
        { key: "siniestro", label: "Siniestro", mock: "2003940558" },
        { key: "servicio", label: "Servicio", mock: "651100" },
        { key: "vehiculo", label: "Vehículo", mock: "Jeep Compass 2.4" },
        { key: "dominio", label: "Dominio", mock: "AE038YH" },
        { key: "asegurado", label: "Asegurado", mock: "Juan Pérez" },
        { key: "gestor_nombre", label: "Gestor", mock: "María del Tránsito" },
        { key: "fecha_inspeccion", label: "Fecha Insp.", mock: "15/03/2026" },
        { key: "hora_inspeccion", label: "Hora Insp.", mock: "10:30" },
        { key: "direccion_inspeccion", label: "Dirección", mock: "Av. Mitre 800" },
        { key: "localidad_inspeccion", label: "Localidad", mock: "Avellaneda" },
        { key: "fecha_hoy", label: "Fecha Actual", mock: "10/03/2026" },
        { key: "hora_hoy", label: "Hora Actual", mock: "16:45" },
        { key: "estudio_nombre", label: "Estudio", mock: "Estudio AOM Siniestros" },
        { key: "link_seguimiento", label: "URL Seguim.", mock: "https://clarity.com/seguimiento/xyz123" },
    ];

    const handleUpdateActive = (field: string, value: any) => {
        if (!activeTemplate) return;
        setTemplates(prev => prev.map(t =>
            t.id === activeTemplate.id ? { ...t, [field]: value } : t
        ));
    };

    const handleInsertVar = (varKey: string, field: "asunto" | "cuerpo") => {
        if (!activeTemplate) return;
        const toInsert = `{{${varKey}}}`;
        const currentValue = activeTemplate[field] || "";
        handleUpdateActive(field, currentValue + toInsert);
    };

    const getPreviewText = (text: string) => {
        if (!text) return "";
        let preview = text;
        availableVars.forEach(v => {
            preview = preview.replace(new RegExp(`{{${v.key}}}`, 'g'), v.mock);
        });
        return preview;
    };

    const saveTemplate = async () => {
        if (!activeTemplate) return;
        setIsSaving(true);

        // Validar regex de variables incorrectas
        const iterMatches = [...activeTemplate.cuerpo.matchAll(/{{([^}]+)}}/g)];
        const iterMatchesAsunto = [...activeTemplate.asunto.matchAll(/{{([^}]+)}}/g)];
        const combinedMatches = [...iterMatches, ...iterMatchesAsunto];

        const validKeys = availableVars.map(v => v.key);
        const invalidMatches = combinedMatches.filter(m => !validKeys.includes(m[1]));

        if (invalidMatches.length > 0) {
            toast.error(`Variable(s) inválida(s) detectada(s): ${invalidMatches.map(m => m[0]).join(', ')}`);
            setIsSaving(false);
            return;
        }

        const { error } = await supabase
            .from('mail_templates')
            .update({
                asunto: activeTemplate.asunto,
                cuerpo: activeTemplate.cuerpo,
                activo: activeTemplate.activo,
                updated_at: new Date().toISOString()
            })
            .eq('id', activeTemplate.id);

        setIsSaving(false);

        if (error) {
            toast.error("Error al guardar la plantilla");
            console.error(error);
        } else {
            toast.success("Plantilla guardada correctamente");
            router.refresh();
        }
    };

    const toggleActivo = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('mail_templates')
            .update({ activo: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error("Error al cambiar estado");
        } else {
            setTemplates(prev => prev.map(t => t.id === id ? { ...t, activo: !currentStatus } : t));
            toast.success(currentStatus ? "Plantilla desactivada" : "Plantilla activada");
            router.refresh();
        }
    };

    if (!templates.length) return <p className="text-sm text-neutral-500">No hay plantillas cargadas.</p>;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Lista de plantillas */}
            <div className="w-full lg:w-1/3 flex flex-col gap-3">
                <h3 className="font-semibold text-neutral-800 border-b pb-2">Eventos</h3>
                {templates.map(t => (
                    <div
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedId === t.id
                            ? 'bg-[#D6006E]/5 border-[#D6006E] shadow-sm'
                            : 'bg-white hover:bg-neutral-50 border-neutral-200'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium text-sm text-neutral-900">{t.nombre}</p>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Trig: {t.estado_origen || 'Cualquiera'} &rarr; {t.estado_destino}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleActivo(t.id, t.activo);
                                }}
                                className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${t.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}
                            >
                                {t.activo ? 'ACTIVO' : 'INACTIVO'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor Main */}
            {activeTemplate && (
                <div className="w-full lg:w-2/3 flex flex-col gap-6">
                    <div className="flex justify-between items-end border-b pb-2">
                        <h3 className="font-semibold text-neutral-800">Editor: {activeTemplate.nombre}</h3>
                        <button
                            onClick={saveTemplate}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-[#D6006E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B3005C] transition-colors disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isSaving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Campo Asunto */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">Asunto del Email</label>
                            <input
                                type="text"
                                value={activeTemplate.asunto}
                                onChange={(e) => handleUpdateActive("asunto", e.target.value)}
                                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#D6006E]/20 focus:border-[#D6006E] outline-none bg-white text-neutral-900"
                            />
                            <div className="flex flex-wrap gap-2">
                                {availableVars.map(v => (
                                    <button
                                        key={'asunto' + v.key}
                                        onClick={() => handleInsertVar(v.key, "asunto")}
                                        className="text-[11px] bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-md hover:bg-neutral-200 transition-colors"
                                    >
                                        {`{{${v.key}}}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Campo Cuerpo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 flex justify-between">
                                Cuerpo del Email (Texto plano / HTML Wrapper Automático)
                                <span className="text-neutral-400 font-normal text-xs">Podes usar Emojis 📅🕐📍</span>
                            </label>
                            <textarea
                                value={activeTemplate.cuerpo}
                                onChange={(e) => handleUpdateActive("cuerpo", e.target.value)}
                                rows={8}
                                className="w-full border rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-[#D6006E]/20 focus:border-[#D6006E] outline-none bg-white text-neutral-900"
                            />
                            <div className="flex flex-wrap gap-2">
                                {availableVars.map(v => (
                                    <button
                                        key={'cuerpo' + v.key}
                                        onClick={() => handleInsertVar(v.key, "cuerpo")}
                                        className="text-[11px] bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-md hover:bg-neutral-200 transition-colors"
                                    >
                                        {`{{${v.key}}}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live Preview Wrapper Simulador */}
                        <div className="mt-4 border rounded-xl overflow-hidden bg-neutral-100">
                            <div className="bg-neutral-200 p-2 text-xs font-medium text-neutral-500 flex gap-2 items-center">
                                <Mail size={14} /> Preview del Mail
                            </div>
                            <div className="p-6 flex justify-center bg-[#F5F0F7]">
                                {/* Mock Card */}
                                <div className="w-full max-w-[580px] bg-white rounded-[12px] shadow-sm overflow-hidden text-sm">
                                    <div className="bg-[#0C0A0F] text-center p-6 text-white pb-6 pt-8">
                                        <h1 className="m-0 text-xl font-bold tracking-[4px]">CLARITY</h1>
                                        <p className="m-0 mt-1 text-[10px] text-white/60 uppercase tracking-widest">Sistema Interno de AOM Siniestros</p>
                                    </div>
                                    <div className="px-8 pt-8 text-[#1A1525]">
                                        <p className="text-[#D6006E] font-bold text-xs uppercase tracking-wide mb-1">{activeTemplate.nombre}</p>
                                        <h2 className="text-xl font-bold mb-4 border-b pb-4">Asunto: {getPreviewText(activeTemplate.asunto)}</h2>

                                        <div className="whitespace-pre-line leading-relaxed text-[15px] mb-8">
                                            {getPreviewText(activeTemplate.cuerpo)}
                                        </div>

                                        <div className="text-center pb-8 border-b">
                                            <div className="inline-block px-6 py-3 bg-[#D6006E] text-white font-semibold rounded-lg text-sm cursor-default">
                                                🔵 Ver estado del caso &rarr;
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[#F8F5FB] px-8 py-6 text-center text-xs text-[#6B5F78]">
                                        <p className="font-bold text-[#1A1525] mb-1">Estudio AOM Siniestros</p>
                                        <p>Al servicio de Sancor Seguros</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
