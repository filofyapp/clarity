"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Briefcase, Map, CarFront, Users, Wrench, Settings, LogOut,
    LayoutDashboard, CalendarCheck2, ListTodo, FileBox,
    BadgeDollarSign, BarChart3, PlusCircle, LockKeyhole, Tag, UserSquare2,
    PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

interface SidebarClientProps {
    userRoles: string[];
    pendingCargaCount?: number;
    pendingTasksCount?: number;
    pendingFacturacionCount?: number;
    userName?: string;
    userInitial?: string;
}

export function SidebarClient({ userRoles, pendingCargaCount = 0, pendingTasksCount = 0, pendingFacturacionCount = 0, userName = "Usuario", userInitial = "U" }: SidebarClientProps) {
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border hidden md:flex md:flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3.5 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-sidebar-border bg-bg-secondary text-text-muted hover:text-text-primary shadow-sm hover:scale-110 transition-all"
                title={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            >
                {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
            </button>

            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center px-6">
                <Link href="/dashboard" className={`flex flex-col items-center justify-center w-full ${isCollapsed ? 'opacity-0 scale-0 absolute' : 'opacity-100 scale-100 transition-all duration-300'}`}>
                    <span className="font-extrabold tracking-[0.2em] text-xl text-text-primary">CLARITY</span>
                    <span className="text-[8px] font-bold tracking-widest text-[#d94a6d] mt-1 whitespace-nowrap">POWERED BY AOM SINIESTROS</span>
                </Link>
                {isCollapsed && (
                    <Link href="/dashboard" className="mx-auto flex font-extrabold tracking-[0.2em] text-sm text-text-primary">CLA</Link>
                )}
            </div>

            <div className={`flex flex-1 flex-col overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'} py-4 space-y-8 no-scrollbar`}>
                {/* Principal */}
                <div className="space-y-1">
                    <SidebarItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" pathname={pathname} isCollapsed={isCollapsed} />
                    <SidebarItem href="/mi-agenda" icon={CalendarCheck2} label="Mi Agenda" pathname={pathname} isCollapsed={isCollapsed} />
                </div>

                {/* Gestión */}
                <div>
                    {!isCollapsed ? (
                        <h4 className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted font-outfit">Gestión</h4>
                    ) : <div className="h-4" />}
                    <div className="space-y-1">
                        <SidebarItem href="/casos" icon={Briefcase} label="Casos" pathname={pathname} isCollapsed={isCollapsed} />
                        {userRoles.includes("admin") && (
                            <SidebarItem href="/casos/nuevo" icon={PlusCircle} label="Nuevo Caso" pathname={pathname} isCollapsed={isCollapsed} />
                        )}
                        <SidebarItem href="/tareas" icon={ListTodo} label="Tareas" pathname={pathname} badgeCount={pendingTasksCount} badgeColor="amber" isCollapsed={isCollapsed} />
                        {(userRoles.includes("admin") || userRoles.includes("carga")) && (
                            <SidebarItem href="/carga" icon={FileBox} label="Cola de Carga" pathname={pathname} badgeCount={pendingCargaCount} isCollapsed={isCollapsed} />
                        )}
                        {(userRoles.includes("admin") || userRoles.includes("calle")) && (
                            <SidebarItem href="/kilometraje" icon={Map} label="Kilometraje" pathname={pathname} isCollapsed={isCollapsed} />
                        )}
                    </div>
                </div>

                {/* Finanzas — solo admin */}
                {userRoles.includes("admin") && (
                    <div>
                        {!isCollapsed ? (
                            <h4 className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted font-outfit">Finanzas</h4>
                        ) : <div className="h-4" />}
                        <div className="space-y-1">
                            <SidebarItem href="/facturacion" icon={BadgeDollarSign} label="Facturación" pathname={pathname} badgeCount={pendingFacturacionCount} badgeColor="amber" isCollapsed={isCollapsed} />
                            <SidebarItem href="/reportes" icon={BarChart3} label="Reportes" pathname={pathname} isCollapsed={isCollapsed} />
                        </div>
                    </div>
                )}

                {/* Directorio */}
                <div>
                    {!isCollapsed ? (
                        <h4 className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted font-outfit">Directorio</h4>
                    ) : <div className="h-4" />}
                    <div className="space-y-1">
                        <SidebarItem href="/directorio/talleres" icon={Wrench} label="Talleres" pathname={pathname} isCollapsed={isCollapsed} />
                        {userRoles.includes("admin") && (
                            <SidebarItem href="/directorio/peritos" icon={UserSquare2} label="Peritos" pathname={pathname} isCollapsed={isCollapsed} />
                        )}
                        {(userRoles.includes("admin") || userRoles.includes("carga")) && (
                            <>
                                <SidebarItem href="/directorio/gestores" icon={Users} label="Gestores" pathname={pathname} isCollapsed={isCollapsed} />
                                <SidebarItem href="/directorio/repuesteros" icon={CarFront} label="Repuesteros" pathname={pathname} isCollapsed={isCollapsed} />
                                <SidebarItem href="/directorio/credenciales" icon={LockKeyhole} label="Credenciales" pathname={pathname} isCollapsed={isCollapsed} />
                            </>
                        )}
                        <SidebarItem href="/directorio/valores" icon={Tag} label="Valores Ref." pathname={pathname} isCollapsed={isCollapsed} />
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className={`p-4 mt-auto border-t border-sidebar-border bg-bg-secondary/50 ${isCollapsed ? 'px-2' : ''}`}>
                <div className="space-y-1 mb-4">
                    {userRoles.includes("admin") && (
                        <SidebarItem href="/configuracion" icon={Settings} label="Configuración" pathname={pathname} isCollapsed={isCollapsed} />
                    )}
                </div>

                {/* User mini profile + logout */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center p-1' : 'justify-between p-2'} bg-bg-tertiary rounded-lg border border-border-subtle`}>
                    <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed && 'hidden'}`}>
                        <div className="h-8 w-8 shrink-0 rounded-md bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs">
                            {userInitial}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-text-primary truncate font-outfit">{userName}</span>
                            <span className="text-[10px] text-text-muted uppercase tracking-wider truncate" title={userRoles.join(", ")}>{userRoles.join("/")}</span>
                        </div>
                    </div>

                    <form action="/auth/signout" method="post" className={isCollapsed ? 'w-full' : ''}>
                        <button type="submit" className={`flex w-full ${isCollapsed ? 'justify-center p-2' : 'p-1.5'} text-text-muted hover:text-color-danger hover:bg-color-danger-soft rounded-md transition-colors`} title="Cerrar sesión">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>
        </aside>
    );
}

function SidebarItem({
    href,
    icon: Icon,
    label,
    pathname,
    badgeCount,
    badgeColor,
    isCollapsed
}: {
    href: string;
    icon: any;
    label: string;
    pathname: string;
    badgeCount?: number;
    badgeColor?: "red" | "amber";
    isCollapsed?: boolean;
}) {
    // Active detection: exact match or starts with (for nested routes like /casos/[id])
    const isActive = pathname === href || (href !== "/dashboard" && href !== "/" && pathname.startsWith(href + "/"));

    return (
        <Link
            href={href}
            title={isCollapsed ? label : undefined}
            className={`flex items-center gap-3 rounded-md py-2.5 text-[13px] font-medium transition-all duration-200 group relative ${isActive
                ? "bg-brand-primary/10 text-brand-primary font-semibold"
                : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
        >
            {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-primary rounded-r-full" />
            )}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 flex-1'}`}>
                <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-brand-primary" : "text-text-muted group-hover:text-text-primary"}`} />
                {!isCollapsed && label}
            </div>
            {!isCollapsed && !!badgeCount && badgeCount > 0 && (
                <span className={`flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold text-white shadow-shadow-glow ml-auto animate-in zoom-in ${badgeColor === "amber" ? "bg-amber-500" : "bg-color-danger"}`}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                </span>
            )}
            {isCollapsed && !!badgeCount && badgeCount > 0 && (
                <span className={`absolute top-1 right-2 flex h-2 w-2 rounded-full shadow-shadow-glow ${badgeColor === "amber" ? "bg-amber-500" : "bg-color-danger"}`}></span>
            )}
        </Link>
    );
}
