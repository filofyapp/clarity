import { Suspense } from "react";
import { getCasos, getPeritos, getGestores } from "./actions";
import { CasosTable } from "@/components/casos/CasosTable";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Casos - CLARITY",
};

export default async function CasosPage() {
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

    const [casos, peritos, gestores] = await Promise.all([getCasos(), getPeritos(), getGestores()]);

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
