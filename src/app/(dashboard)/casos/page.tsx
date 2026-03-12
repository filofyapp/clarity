import { Suspense } from "react";
import { getCasos, getPeritos, getGestores, CasosFilters } from "./actions";
import { CasosTable } from "@/components/casos/CasosTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Casos - CLARITY",
};

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CasosPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userRol = "admin";
    if (user) {
        const { data: usuario } = await supabase.from("usuarios").select("rol, roles").eq("id", user.id).single();
        if (usuario) {
            const roles = usuario.roles || [usuario.rol];
            if (roles.includes("admin")) userRol = "admin";
            else if (roles.includes("carga")) userRol = "carga";
            else if (roles.includes("calle")) userRol = "calle";
        }
    }

    // Parse URL params into CasosFilters
    const parseArray = (val: string | string[] | undefined): string[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return val.split(",").filter(Boolean);
    };

    const filters: CasosFilters = {
        estados: parseArray(params.estado),
        tipos_ip: parseArray(params.tipo_ip),
        peritos_calle: parseArray(params.perito_calle),
        peritos_carga: parseArray(params.perito_carga),
        gestores: parseArray(params.gestor),
        fecha_campo: typeof params.fecha_campo === "string" ? params.fecha_campo : undefined,
        fecha_desde: typeof params.fecha_desde === "string" ? params.fecha_desde : undefined,
        fecha_hasta: typeof params.fecha_hasta === "string" ? params.fecha_hasta : undefined,
        search: typeof params.search === "string" ? params.search : undefined,
    };

    const [casos, peritos, gestores] = await Promise.all([getCasos(filters), getPeritos(), getGestores()]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Gestión de Casos</h1>
                    <p className="text-sm text-text-muted">
                        Visualiza y administra todos los informes periciales activos e históricos.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {userRol === "admin" && (
                        <Link href="/casos/nuevo">
                            <Button className="h-9 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-shadow-glow">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nuevo Caso
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm h-[calc(100vh-140px)] flex flex-col">
                <Suspense fallback={<div className="p-8 text-center text-text-muted">Cargando casos...</div>}>
                    <CasosTable casos={casos} peritos={peritos} gestores={gestores} userRol={userRol} />
                </Suspense>
            </div>
        </div>
    );
}
