import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CLARITY — Gestión de Inspecciones Vehiculares",
    description:
        "El sistema de inspección vehicular que está transformando la gestión de siniestros en Argentina. Al servicio de Sancor Seguros.",
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
