"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, Users, MoreHorizontal, Pencil, Shield, Car, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PeritoFormDialog } from "./PeritoFormDialog";
import { deletePerito } from "@/app/(dashboard)/directorio/peritos/actions";
import { toast } from "sonner";
import { useTransition } from "react";

export function PeritosTable({ peritos, isReadOnly }: { peritos: any[], isReadOnly?: boolean }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string, email: string) => {
        if (window.confirm(`¿Estás seguro de eliminar el acceso y la cuenta de ${email}?`)) {
            startTransition(async () => {
                const res = await deletePerito(id);
                if (res?.error) {
                    toast.error("Error al eliminar", { description: res.error });
                } else {
                    toast.success("Cuenta eliminada");
                }
            });
        }
    };

    if (!peritos || peritos.length === 0) {
        return (
            <div className="flex flex-col h-48 items-center justify-center p-6 text-text-muted gap-2">
                <Users className="h-8 w-8 opacity-50" />
                <p>No hay peritos registrados.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-md border border-border bg-card shadow-sm">
            <Table>
                <TableHeader className="bg-bg-secondary text-text-secondary border-b border-border">
                    <TableRow className="hover:bg-transparent border-transparent">
                        <TableHead className="font-semibold text-text-primary">Perito</TableHead>
                        <TableHead className="font-semibold text-text-primary">Contacto / Login</TableHead>
                        <TableHead className="font-semibold text-text-primary">Rol / Nivel Acceso</TableHead>
                        <TableHead className="text-right font-semibold text-text-primary">Estado</TableHead>
                        {!isReadOnly && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {peritos.map((perito) => (
                        <TableRow
                            key={perito.id}
                            className="border-border hover:bg-bg-tertiary transition-colors"
                        >
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-text-primary">{perito.nombre} {perito.apellido}</span>
                                </div>
                            </TableCell>

                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {perito.telefono && (
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {perito.telefono}
                                        </span>
                                    )}
                                    {perito.email && (
                                        <a href={`mailto:${perito.email}`} className="text-xs text-brand-secondary hover:underline">
                                            {perito.email}
                                        </a>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {(() => {
                                        const roles: string[] = perito.roles && perito.roles.length > 0 ? perito.roles : [perito.rol];
                                        return roles.map((r: string) => {
                                            if (r === 'admin') return (
                                                <Badge key={r} variant="outline" className="bg-color-warning-soft text-color-warning border-color-warning/20">
                                                    <Shield className="w-3 h-3 mr-1" /> Coordinador
                                                </Badge>
                                            );
                                            if (r === 'carga') return (
                                                <Badge key={r} variant="outline" className="bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20">
                                                    <Shield className="w-3 h-3 mr-1" /> Perito Carga
                                                </Badge>
                                            );
                                            return (
                                                <Badge key={r} variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                                                    <Car className="w-3 h-3 mr-1" /> Perito Calle
                                                </Badge>
                                            );
                                        });
                                    })()}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                {perito.activo ? (
                                    <Badge className="bg-success/20 text-success hover:bg-success/30 border-0 font-normal">Activo</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-bg-elevated text-text-muted font-normal">Inactivo</Badge>
                                )}
                            </TableCell>

                            {!isReadOnly && (
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-text-muted hover:text-text-primary">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-bg-secondary border-border">
                                            <PeritoFormDialog
                                                perito={perito}
                                                trigger={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-text-primary focus:bg-bg-tertiary cursor-pointer flex items-center gap-2">
                                                        <Pencil className="h-4 w-4" />
                                                        Editar Perfil / Clave
                                                    </DropdownMenuItem>
                                                }
                                            />
                                            <DropdownMenuItem
                                                disabled={isPending}
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    handleDelete(perito.id, perito.email);
                                                }}
                                                className="text-error focus:bg-error/10 focus:text-error cursor-pointer flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
