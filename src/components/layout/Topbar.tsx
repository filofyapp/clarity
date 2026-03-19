import { Menu } from "lucide-react";
import { getUsuarioActual } from "@/lib/auth";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Topbar() {
    // Uses cached getUsuarioActual — no extra getUser() call if page already called it
    const usuario = await getUsuarioActual();

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            {/* Mobile Menu Trigger */}
            <div className="flex gap-x-4 lg:hidden">
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-text-secondary hover:text-text-primary transition-colors"
                >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            {/* Global Search */}
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
                <div className="flex-1 flex max-w-2xl">
                    <GlobalSearch />
                </div>

                {/* Right side icons */}
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <ThemeToggle />
                    {usuario && <NotificationBell />}
                </div>
            </div>
        </header>
    );
}
