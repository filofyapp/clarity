"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2, Edit2 } from "lucide-react";
import { crearTaller, editarTaller } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";

export function TallerFormDialog({ taller, trigger }: { taller?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isEdit = !!taller;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = isEdit
                ? await editarTaller(taller.id, formData)
                : await crearTaller(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Taller actualizado." : "Taller creado correctamente.");
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
                        Nuevo Taller
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-bg-secondary border-border text-text-primary max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Taller" : "Nuevo Taller"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-xs text-text-muted block mb-1">Nombre *</label>
                            <Input name="nombre" defaultValue={taller?.nombre} required placeholder="Taller García & Hijos"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-text-muted block mb-1">Dirección *</label>
                            <Input name="direccion" defaultValue={taller?.direccion} required placeholder="Av. Mitre 1234, Quilmes"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Teléfono</label>
                            <Input name="telefono" defaultValue={taller?.telefono} placeholder="011-4444-5555"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Email</label>
                            <Input name="email" type="email" defaultValue={taller?.email} placeholder="taller@mail.com"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Localidad</label>
                            <Input name="localidad" defaultValue={taller?.localidad} placeholder="Quilmes"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Tipo</label>
                            <select name="tipo" defaultValue={taller?.tipo || "general"}
                                className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary">
                                <option value="general">General</option>
                                <option value="concesionario">Concesionario</option>
                                <option value="especializado">Especializado</option>
                                <option value="chapa_pintura">Chapa y Pintura</option>
                                <option value="mecanica">Mecánica</option>
                                <option value="electrica">Eléctrica</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">CUIT</label>
                            <Input name="cuit" defaultValue={taller?.cuit} placeholder="20-12345678-9"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Contacto</label>
                            <Input name="contacto_nombre" defaultValue={taller?.contacto_nombre} placeholder="Juan Pérez"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div className="flex items-center gap-2 mt-4 sm:col-span-2 bg-brand-primary/5 p-3 rounded-lg border border-brand-primary/20">
                            <input
                                type="checkbox"
                                name="hace_remotas"
                                id="hace_remotas"
                                value="true"
                                defaultChecked={taller?.hace_remotas}
                                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-border bg-bg-tertiary"
                            />
                            <label htmlFor="hace_remotas" className="text-sm font-medium text-text-primary cursor-pointer">
                                ¿Este taller puede realizar y enviar Inspecciones Remotas?
                            </label>
                        </div>
                    </div>
                    <Button type="submit" disabled={isPending}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isEdit ? "Guardar Cambios" : "Guardar Taller"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
