import { Suspense } from "react";
import { CasoDetail } from "@/components/casos/CasoDetail";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Detalle de Caso - CLARITY",
};

export default async function CasoDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await params;
    const resolvedSearch = await searchParams;
    const { id } = resolvedParams;
    const esNuevo = resolvedSearch?.nuevo === "1";

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto w-full">
            <div className="flex items-center gap-4">
                <Link href="/casos">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-bg-elevated">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm p-6 min-h-[400px]">
                <Suspense fallback={<div className="text-center text-text-muted p-12">Cargando detalles...</div>}>
                    <CasoDetail id={id} esNuevo={esNuevo} />
                </Suspense>
            </div>
        </div>
    );
}

