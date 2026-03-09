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
import { Phone, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GestorFormDialog } from "./GestorFormDialog";
import { eliminarGestor } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";
import { useTransition } from "react";

export function GestoresTable({ gestores }: { gestores: any[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al gestor ${nombre}?`)) {
            startTransition(async () => {
                const res = await eliminarGestor(id);
                if (res?.error) {
                    toast.error("Error al eliminar", { description: res.error });
                } else {
                    toast.success("Gestor eliminado");
                }
            });
        }
    };

    if (!gestores || gestores.length === 0) {
        return (
            <div className="flex flex-col h-48 items-center justify-center p-6 text-text-muted gap-2">
                <Users className="h-8 w-8 opacity-50" />
                <p>No hay gestores vinculados a la compañía actualmente.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-md border border-border bg-card shadow-sm">
            <Table>
                <TableHeader className="bg-bg-secondary text-text-secondary border-b border-border">
                    <TableRow className="hover:bg-transparent border-transparent">
                        <TableHead className="font-semibold text-text-primary">Gestor</TableHead>
                        <TableHead className="font-semibold text-text-primary">Contacto</TableHead>
                        <TableHead className="font-semibold text-text-primary">Sector</TableHead>
                        <TableHead className="text-right font-semibold text-text-primary">Estado</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {gestores.map((gestor) => (
                        <TableRow
                            key={gestor.id}
                            className="border-border hover:bg-bg-tertiary transition-colors"
                        >
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-text-primary">{gestor.nombre}</span>
                                    {gestor.compania?.nombre && (
                                        <span className="text-xs text-text-muted">{gestor.compania.nombre}</span>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {gestor.telefono && (
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {gestor.telefono}
                                        </span>
                                    )}
                                    {gestor.email && (
                                        <a href={`mailto:${gestor.email}`} className="text-xs text-brand-secondary hover:underline">
                                            {gestor.email}
                                        </a>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm font-medium text-text-primary">{gestor.sector || "-"}</span>
                            </TableCell>
                            <TableCell className="text-right">
                                {gestor.activo ? (
                                    <Badge className="bg-success/20 text-success hover:bg-success/30 border-0 font-normal">Activo</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-bg-elevated text-text-muted font-normal">Inactivo</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 text-text-muted hover:text-text-primary">
                                            <span className="sr-only">Abrir menú</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-bg-secondary border-border">
                                        <GestorFormDialog
                                            gestor={gestor}
                                            trigger={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-text-primary focus:bg-bg-tertiary cursor-pointer flex items-center gap-2">
                                                    <Pencil className="h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                            }
                                        />
                                        <DropdownMenuItem
                                            disabled={isPending}
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                handleDelete(gestor.id, gestor.nombre);
                                            }}
                                            className="text-error focus:bg-error/10 focus:text-error cursor-pointer flex items-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
