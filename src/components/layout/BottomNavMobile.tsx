"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Briefcase, ListTodo, User } from "lucide-react";

const NAV_ITEMS = [
    { href: "/mi-agenda", icon: CalendarCheck2, label: "Agenda" },
    { href: "/casos", icon: Briefcase, label: "Casos" },
    { href: "/tareas", icon: ListTodo, label: "Tareas" },
    { href: "/dashboard", icon: User, label: "Perfil" },
];

export function BottomNavMobile() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-primary border-t border-border safe-area-pb">
            <div className="flex items-stretch justify-around h-16">
                {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center flex-1 min-w-[48px] min-h-[48px] gap-0.5 transition-colors ${
                                isActive
                                    ? "text-brand-primary"
                                    : "text-text-muted active:text-text-primary"
                            }`}
                        >
                            <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>
                                {label}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-primary rounded-b-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
