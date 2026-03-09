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
import { Phone, Box, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { RepuesteroFormDialog } from "./RepuesteroFormDialog";
import { useState, useTransition } from "react";
import { eliminarRepuestero } from "@/app/(dashboard)/directorio/crud-actions";
import { toast } from "sonner";

export function RepuesterosTable({ repuesteros }: { repuesteros: any[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${nombre}?`)) {
            startTransition(async () => {
                const res = await eliminarRepuestero(id);
                if (res?.error) {
                    toast.error("Error al eliminar", { description: res.error });
                } else {
                    toast.success("Casa de repuestos eliminada");
                }
            });
        }
    };

    if (!repuesteros || repuesteros.length === 0) {
        return (
            <div className="flex flex-col h-48 items-center justify-center p-6 text-text-muted gap-2">
                <Box className="h-8 w-8 opacity-50" />
                <p>No hay casas de repuestos registradas en el directorio.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-md border border-border bg-card shadow-sm">
            <Table>
                <TableHeader className="bg-bg-secondary text-text-secondary border-b border-border">
                    <TableRow className="hover:bg-transparent border-transparent">
                        <TableHead className="font-semibold text-text-primary">Repuestero</TableHead>
                        <TableHead className="font-semibold text-text-primary">Contacto</TableHead>
                        <TableHead className="font-semibold text-text-primary">Marcas</TableHead>
                        <TableHead className="text-right font-semibold text-text-primary">Estado</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {repuesteros.map((repuestero) => (
                        <TableRow
                            key={repuestero.id}
                            className="border-border hover:bg-bg-tertiary transition-colors"
                        >
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-text-primary">{repuestero.nombre}</span>
                                    {repuestero.razon_social && (
                                        <span className="text-xs text-text-muted">{repuestero.razon_social}</span>
                                    )}
                                </div>
                            </TableCell>

                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    {repuestero.telefono && (
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {repuestero.telefono}
                                        </span>
                                    )}
                                    {repuestero.whatsapp && (
                                        <span className="text-xs text-brand-secondary flex items-center gap-1">
                                            WA: {repuestero.whatsapp}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {repuestero.marcas && repuestero.marcas.length > 0 ? (
                                        repuestero.marcas.map((marca: string, i: number) => (
                                            <Badge key={i} variant="outline" className="bg-bg-elevated border-border text-xs font-normal">
                                                {marca}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-text-muted">Multimarca</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                {repuestero.activo ? (
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
                                        <RepuesteroFormDialog
                                            repuestero={repuestero}
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
                                                handleDelete(repuestero.id, repuestero.nombre);
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
