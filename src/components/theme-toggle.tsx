"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex h-8 w-14 items-center rounded-full bg-bg-tertiary border border-border p-1 transition-colors hover:bg-bg-surface focus:outline-none focus:ring-2 focus:ring-brand-primary/50 relative"
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            <span className="sr-only">Cambiar tema</span>
            <div className={`flex w-full items-center justify-between text-text-muted px-0.5`}>
                <Moon className="h-3 w-3" />
                <Sun className="h-3 w-3" />
            </div>

            <div
                className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-bg-primary shadow-sm transition-transform duration-300 ${theme === "dark" ? "translate-x-0" : "translate-x-6"
                    }`}
            >
                {theme === "dark" ? (
                    <Moon className="h-3.5 w-3.5 text-brand-primary" />
                ) : (
                    <Sun className="h-3.5 w-3.5 text-brand-primary" />
                )}
            </div>
        </button>
    )
}
