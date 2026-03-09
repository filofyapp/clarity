import { Menu, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Topbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userName = "Usuario CLARITY";

    if (user) {
        const { data: usuario } = await supabase
            .from("usuarios")
            .select("nombre, apellido")
            .eq("id", user.id)
            .single();

        if (usuario) {
            userName = `${usuario.nombre} ${usuario.apellido}`;
        } else {
            userName = user.email || userName;
        }
    }

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
                    {user && <NotificationBell />}

                    {/* Separator */}
                    <div
                        className="hidden lg:block lg:h-6 lg:w-px lg:bg-border-subtle"
                        aria-hidden="true"
                    />

                    {/* Profile Dropdown placeholder */}
                    <div className="flex items-center gap-x-4">
                        <button
                            type="button"
                            className="-m-1.5 flex items-center p-1.5 hover:bg-bg-surface/50 rounded-lg transition-colors"
                        >
                            <span className="sr-only">Abrir menú de usuario</span>
                            <UserCircle className="h-7 w-7 text-text-secondary bg-surface rounded-full" />
                            <span className="hidden lg:flex lg:items-center">
                                <span
                                    className="ml-3 text-sm font-medium font-outfit text-text-primary"
                                    aria-hidden="true"
                                >
                                    {userName}
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
