"use client";

import { useSidebar } from "./SidebarContext";

export function MainWrapper({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className={`transition-all duration-300 ease-in-out flex flex-col flex-1 h-screen overflow-hidden ${isCollapsed ? "md:pl-20" : "md:pl-64"}`}>
            {children}
        </div>
    );
}
