import { CasoForm } from "@/components/casos/CasoForm";
import { getGestores, getTalleres } from "@/app/(dashboard)/directorio/actions";
import { getPeritos } from "@/app/(dashboard)/casos/actions";

export const metadata = {
    title: "Nuevo Caso - CLARITY",
};

export default async function NuevoCasoPage() {
    const [gestores, talleres, peritos] = await Promise.all([
        getGestores(),
        getTalleres(),
        getPeritos(),
    ]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">Agregar Siniestro</h1>
                <p className="text-text-muted">
                    Registra un nuevo caso manualmente o usa el Parser para extraer datos automáticamente.
                </p>
            </div>

            <div className="card-premium p-6">
                <CasoForm gestores={gestores} talleres={talleres} peritos={peritos} />
            </div>
        </div>
    );
}
