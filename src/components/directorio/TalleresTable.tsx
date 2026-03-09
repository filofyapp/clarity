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
import { Wrench, Phone, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TallerFormDialog } from "./TallerFormDialog";
import { useState, useTransition } from "react";
import { eliminarTaller } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";

export function TalleresTable({ talleres }: { talleres: any[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el taller ${nombre}?`)) {
            startTransition(async () => {
                const res = await eliminarTaller(id);
                if (res?.error) {
                    toast.error("Error al eliminar", { description: res.error });
                } else {
                    toast.success("Taller eliminado");
                }
            });
        }
    };

    if (!talleres || talleres.length === 0) {
        return (
            <div className="flex flex-col h-48 items-center justify-center p-6 text-text-muted gap-2">
                <Wrench className="h-8 w-8 opacity-50" />
                <p>No hay talleres registrados en el sistema.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-md border border-border bg-card shadow-sm">
            <Table>
                <TableHeader className="bg-bg-secondary text-text-secondary border-b border-border">
                    <TableRow className="hover:bg-transparent border-transparent">
                        <TableHead className="font-semibold text-text-primary">Taller / Razón Social</TableHead>
                        <TableHead className="font-semibold text-text-primary">Dirección</TableHead>
                        <TableHead className="font-semibold text-text-primary">Contacto</TableHead>
                        <TableHead className="font-semibold text-text-primary">Tipo</TableHead>
                        <TableHead className="text-right font-semibold text-text-primary">Estado</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {talleres.map((taller) => (
                        <TableRow
                            key={taller.id}
                            className="border-border hover:bg-bg-tertiary transition-colors"
                        >
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-text-primary">{taller.nombre}</span>
                                    {taller.razon_social && (
                                        <span className="text-xs text-text-muted">{taller.razon_social}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-start gap-1">
                                    <MapPin className="h-3 w-3 mt-1 shrink-0 text-text-muted" />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-text-primary">{taller.direccion}</span>
                                        <span className="text-xs text-text-muted">{taller.localidad}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {taller.telefono && (
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {taller.telefono}
                                        </span>
                                    )}
                                    {taller.contacto_nombre && (
                                        <span className="text-xs text-text-muted">Lic. {taller.contacto_nombre}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-bg-elevated border-border text-brand-secondary capitalize text-xs font-normal">
                                    {taller.tipo.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {taller.activo ? (
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
                                        <TallerFormDialog
                                            taller={taller}
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
                                                handleDelete(taller.id, taller.nombre);
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
