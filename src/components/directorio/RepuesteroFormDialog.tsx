"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2 } from "lucide-react";
import { crearRepuestero, editarRepuestero } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";

export function RepuesteroFormDialog({ repuestero, trigger }: { repuestero?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isEdit = !!repuestero;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = isEdit
                ? await editarRepuestero(repuestero.id, formData)
                : await crearRepuestero(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Repuestero actualizado." : "Repuestero creado correctamente.");
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="h-9 bg-brand-primary hover:bg-brand-primary-hover text-white">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Repuestero
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-bg-secondary border-border text-text-primary max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Casa de Repuestos" : "Nueva Casa de Repuestos"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-xs text-text-muted block mb-1">Nombre Comercial *</label>
                            <Input name="nombre" defaultValue={repuestero?.nombre} required placeholder="Repuestos El Vasco"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-text-muted block mb-1">Razón Social</label>
                            <Input name="razon_social" defaultValue={repuestero?.razon_social} placeholder="El Vasco S.R.L"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Teléfono Fijo</label>
                            <Input name="telefono" defaultValue={repuestero?.telefono} placeholder="011-4444-5555"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">WhatsApp</label>
                            <Input name="whatsapp" defaultValue={repuestero?.whatsapp} placeholder="+54 9 11 1234 5678"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-text-muted block mb-1">Dirección</label>
                            <Input name="direccion" defaultValue={repuestero?.direccion} placeholder="Av. Mitre 1234"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Localidad</label>
                            <Input name="localidad" defaultValue={repuestero?.localidad} placeholder="Quilmes"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Sitio Web</label>
                            <Input name="sitio_web" type="url" defaultValue={repuestero?.sitio_web} placeholder="https://elvasco.com"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-text-muted block mb-1">Marcas Especializadas (opcional, separadas por coma)</label>
                            <Input name="marcas" defaultValue={repuestero?.marcas?.join(", ")} placeholder="Toyota, Honda, Ford"
                                className="bg-bg-tertiary border-border" />
                        </div>
                    </div>
                    <Button type="submit" disabled={isPending}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isEdit ? "Guardar Cambios" : "Guardar Repuestero"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
