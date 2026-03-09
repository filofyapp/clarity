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
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white antialiased">
            {/* Clean layout - no sidebar, no navbar, mobile-first */}
            <div className="min-h-screen flex flex-col">
                {/* Minimal header */}
                <header className="flex items-center justify-center py-4 px-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
                            C
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-white/90">CLARITY</span>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1 flex flex-col">
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-3 text-center text-xs text-white/30 border-t border-white/5">
                    Sistema de Inspección Pericial © AOM Siniestros
                </footer>
            </div>
        </div>
    );
}
