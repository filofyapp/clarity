"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { crearValor } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function ValorFormDialog({ userRole }: { userRole: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customFields, setCustomFields] = useState<{ concepto: string; valor: string }[]>([]);

    // Solo Admin puede crear
    if (userRole !== "admin") return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        // Append custom fields to notas
        let notasBase = formData.get("notas") as string || "";
        if (customFields.length > 0) {
            const customNotes = customFields
                .filter(f => f.concepto.trim() !== "" || f.valor.trim() !== "")
                .map(f => `${f.concepto || "Otro"}: $${f.valor || "0"}`)
                .join(" | ");
            notasBase = notasBase ? `${notasBase}\nAdicionales: ${customNotes}` : `Adicionales: ${customNotes}`;
        }
        formData.set("notas", notasBase);

        const res = await crearValor(formData);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Valor referencial guardado correctamente");
            setOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Valor de Referencia
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Añadir Convenio (Chapa y Pintura)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Marca Vehículo *</label>
                        <Input name="marca" required placeholder="Ej: Toyota, Fiat, General..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo / Descripción</label>
                        <Input name="descripcion" placeholder="Ej: Livianos, SUVs..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Día de Chapa ($) *</label>
                            <Input name="valor_hora" type="number" required placeholder="25000" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Paño Pintura ($) *</label>
                            <Input name="valor_pieza" type="number" required placeholder="150000" />
                        </div>
                    </div>

                    {customFields.length > 0 && (
                        <div className="space-y-3 p-3 bg-bg-tertiary/50 border border-border/50 rounded-lg">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Valores Personalizados</label>
                            {customFields.map((field, index) => (
                                <div key={index} className="grid grid-cols-2 gap-3 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-text-muted">Concepto</label>
                                        <Input
                                            value={field.concepto}
                                            onChange={(e) => {
                                                const newFields = [...customFields];
                                                newFields[index].concepto = e.target.value;
                                                setCustomFields(newFields);
                                            }}
                                            placeholder="Ej: Colorimetría"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1 flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-text-muted">Valor ($)</label>
                                            <Input
                                                type="number"
                                                value={field.valor}
                                                onChange={(e) => {
                                                    const newFields = [...customFields];
                                                    newFields[index].valor = e.target.value;
                                                    setCustomFields(newFields);
                                                }}
                                                placeholder="10000"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10 mb-0.5"
                                            onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                                        >
                                            <span className="text-lg leading-none">×</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed text-brand-primary border-brand-primary/30 hover:bg-brand-primary/10"
                        onClick={() => setCustomFields([...customFields, { concepto: "", valor: "" }])}
                    >
                        + Añadir Personalizado
                    </Button>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notas Generales</label>
                        <Input name="notas" placeholder="Ej: No incluye pintura tricapa." />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="mr-2">Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-brand-primary text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
