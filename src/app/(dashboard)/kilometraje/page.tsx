export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getDiasKilometraje, getPeritos, getPrecioKm } from "./actions";
import { KilometrajeBoard } from "@/components/kilometraje/KilometrajeBoard";

export const metadata = {
    title: "Kilometraje - CLARITY",
};

export default async function KilometrajePage({
    searchParams,
}: {
    searchParams: Promise<{ mes?: string }>;
}) {
    const { getUsuarioActual } = await import("@/lib/auth");
    const userData = await getUsuarioActual();

    // Admin-only access
    const isAdmin = userData.rol === "admin" || (userData.roles && userData.roles.includes("admin"));
    if (!isAdmin) redirect("/dashboard");

    // Current month default
    const params = await searchParams;
    const now = new Date();
    const mesActual = params.mes || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Fetch data
    const [diasResult, peritos, precioKm] = await Promise.all([
        getDiasKilometraje(mesActual),
        getPeritos(),
        getPrecioKm(),
    ]);

    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

    return (
        <KilometrajeBoard
            dias={diasResult.data || []}
            peritos={peritos}
            precioKm={precioKm}
            mesInicial={mesActual}
            mapsApiKey={mapsApiKey}
        />
    );
}
