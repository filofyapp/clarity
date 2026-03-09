"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Copy, Check, EyeOff, Eye, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { eliminarCredencial } from "@/app/(dashboard)/directorio/crud-actions";

export function CredencialesTable({ credenciales }: { credenciales: any[] }) {
    const [isPending, startTransition] = useTransition();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [visiblePassId, setVisiblePassId] = useState<string | null>(null);

    const handleDelete = (id: string, plataforma: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la credencial de ${plataforma}?`)) {
            startTransition(async () => {
                const res = await eliminarCredencial(id);
                if (res?.error) {
                    toast.error("Error al eliminar", { description: res.error });
                } else {
                    toast.success("Credencial eliminada");
                }
            });
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Contraseña copiada al portapapeles");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleVisibility = (id: string) => {
        setVisiblePassId(prev => prev === id ? null : id);
    };

    if (!credenciales || credenciales.length === 0) {
        return (
            <div className="text-center p-12 border border-dashed border-border rounded-lg bg-bg-secondary/30">
                <p className="text-text-muted">No hay credenciales guardadas en el directorio.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border overflow-hidden">
            <Table>
                <TableHeader className="bg-bg-tertiary">
                    <TableRow className="border-border hover:bg-bg-tertiary">
                        <TableHead className="font-semibold text-text-primary">Plataforma</TableHead>
                        <TableHead className="font-semibold text-text-primary">Usuario</TableHead>
                        <TableHead className="font-semibold text-text-primary">Contraseña</TableHead>
                        <TableHead className="font-semibold text-text-primary hidden md:table-cell">Notas</TableHead>
                        <TableHead className="font-semibold text-text-primary text-right">Agregado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-bg-primary">
                    {credenciales.map((cred) => (
                        <TableRow key={cred.id} className="border-border hover:bg-bg-tertiary/50 transition-colors group">
                            <TableCell className="font-medium text-text-primary">{cred.plataforma}</TableCell>
                            <TableCell className="text-text-secondary">{cred.credencial_usuario}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="font-mono text-sm px-2 py-1 bg-bg-tertiary rounded border border-border w-40 text-center tracking-wider text-text-primary">
                                        {visiblePassId === cred.id ? cred.credencial_pass : "••••••••••••"}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-text-muted hover:text-text-primary"
                                        onClick={() => toggleVisibility(cred.id)}
                                        title={visiblePassId === cred.id ? "Ocultar" : "Mostrar"}
                                    >
                                        {visiblePassId === cred.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-brand-primary/20"
                                        onClick={() => handleCopy(cred.credencial_pass, cred.id)}
                                        title="Copiar contraseña"
                                    >
                                        {copiedId === cred.id ? <Check className="h-4 w-4 text-color-success !opacity-100" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isPending}
                                        className="h-8 w-8 text-text-muted hover:text-error hover:bg-error/10"
                                        onClick={() => handleDelete(cred.id, cred.plataforma)}
                                        title="Eliminar credencial"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-text-muted text-sm hidden md:table-cell max-w-[200px] truncate">
                                {cred.notas || "-"}
                            </TableCell>
                            <TableCell className="text-right text-text-muted text-sm">
                                {format(new Date(cred.created_at), "dd MMM yyyy", { locale: es })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
