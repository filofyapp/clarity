"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { crearCredencial } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function CredencialFormDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const res = await crearCredencial(formData);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Credencial guardada correctamente");
            setOpen(false);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Credencial
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva Credencial (Sistema Externo)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Plataforma / Sistema *</label>
                        <Input name="plataforma" required placeholder="Ej: Sancor Siniestros, Aseguradora..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Usuario / Email *</label>
                        <Input name="credencial_usuario" required placeholder="Usuario" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contraseña *</label>
                        <Input name="credencial_pass" type="text" required placeholder="Contraseña visible plana" />
                        <p className="text-xs text-text-muted mt-1">Este dato será copiable por los operarios autorizados.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notas (Opcional)</label>
                        <Input name="notas" placeholder="Ej: URL de acceso, token..." />
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
