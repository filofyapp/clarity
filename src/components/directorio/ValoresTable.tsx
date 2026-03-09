"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ValoresTable({ valores }: { valores: any[] }) {
    if (!valores || valores.length === 0) {
        return (
            <div className="text-center p-12 border border-dashed border-border rounded-lg bg-bg-secondary/30">
                <p className="text-text-muted">No hay convenios cargados en el directorio.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border overflow-hidden">
            <Table>
                <TableHeader className="bg-bg-tertiary">
                    <TableRow className="border-border hover:bg-bg-tertiary">
                        <TableHead className="font-semibold text-text-primary">Marca / Concesionaria</TableHead>
                        <TableHead className="font-semibold text-text-primary">Descripción</TableHead>
                        <TableHead className="font-semibold text-text-primary text-right">Día de Chapa</TableHead>
                        <TableHead className="font-semibold text-text-primary text-right">Paño Pintura</TableHead>
                        <TableHead className="font-semibold text-text-primary hidden md:table-cell">Notas Adicionales</TableHead>
                        <TableHead className="font-semibold text-text-primary text-right">Actualizado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="bg-bg-primary">
                    {valores.map((val) => (
                        <TableRow key={val.id} className="border-border hover:bg-bg-tertiary/50 transition-colors group">
                            <TableCell className="font-medium text-text-primary">{val.marca}</TableCell>
                            <TableCell className="text-text-secondary">{val.descripcion || "General"}</TableCell>
                            <TableCell className="text-right text-text-primary font-mono">
                                {val.valor_hora ? `$ ${val.valor_hora.toLocaleString("es-AR")}` : "-"}
                            </TableCell>
                            <TableCell className="text-right text-brand-primary font-mono">
                                {val.valor_pieza ? `$ ${val.valor_pieza.toLocaleString("es-AR")}` : "-"}
                            </TableCell>
                            <TableCell className="text-text-muted text-sm hidden md:table-cell max-w-[200px] truncate">
                                {val.notas || "-"}
                            </TableCell>
                            <TableCell className="text-right text-text-muted text-sm">
                                {format(new Date(val.created_at), "dd MMM yyyy", { locale: es })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
