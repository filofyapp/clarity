"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2 } from "lucide-react";
import { crearGestor, editarGestor } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";

export function GestorFormDialog({ gestor, trigger }: { gestor?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isEdit = !!gestor;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = isEdit
                ? await editarGestor(gestor.id, formData)
                : await crearGestor(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Gestor actualizado." : "Gestor creado correctamente.");
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
                        Nuevo Gestor
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-bg-secondary border-border text-text-primary max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Gestor" : "Nuevo Gestor"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Nombre *</label>
                        <Input name="nombre" defaultValue={gestor?.nombre} required placeholder="Martínez, Carlos"
                            className="bg-bg-tertiary border-border" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Email</label>
                        <Input name="email" type="email" defaultValue={gestor?.email} placeholder="cmartinez@sancor.com.ar"
                            className="bg-bg-tertiary border-border" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Teléfono</label>
                        <Input name="telefono" defaultValue={gestor?.telefono} placeholder="011-4444-5555"
                            className="bg-bg-tertiary border-border" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Sector</label>
                        <Input name="sector" defaultValue={gestor?.sector} placeholder="Siniestros / Terceros / Automotores"
                            className="bg-bg-tertiary border-border" />
                    </div>

                    <p className="text-xs text-text-muted italic">Se vincula automáticamente a Sancor Seguros.</p>
                    <Button type="submit" disabled={isPending}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isEdit ? "Guardar Cambios" : "Guardar Gestor"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
