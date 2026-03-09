import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { MainWrapper } from "@/components/layout/MainWrapper";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
                <Sidebar />
                <MainWrapper>
                    <Topbar />
                    <main className="flex-1 overflow-y-auto bg-bg-primary p-4 lg:p-8">
                        {children}
                    </main>
                </MainWrapper>
            </div>
        </SidebarProvider>
    );
}
