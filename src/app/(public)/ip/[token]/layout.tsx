import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inspección Remota - CLARITY",
    description: "Carga guiada de fotografías para inspección pericial",
};

export default function InspeccionRemotaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[#0C0A0F] min-h-screen text-white antialiased">
            {/* Clean layout - no sidebar, no navbar, mobile-first */}
            <div className="min-h-screen flex flex-col">

                {/* Main content */}
                <main className="flex-1 flex flex-col pt-6">
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-6 text-center text-[11px] text-[#6B5F78]">
                    Powered by CLARITY · Estudio AOM Siniestros
                </footer>
            </div>
        </div>
    );
}
