"use client";

import { useTransition, useState } from "react";
import { loginAction } from "./actions";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const result = await loginAction(formData);
            if (result?.error) {
                setError(result.error);
                toast.error(result.error);
            }
        });
    };

    return (
        <Card className="border-border bg-card shadow-lg">
            <CardHeader className="space-y-1 text-center">
                <div className="flex flex-col items-center justify-center mb-6">
                    <span className="font-extrabold tracking-[0.2em] text-4xl text-text-primary">CLARITY</span>
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#d94a6d] mt-2 uppercase">POWERED BY AOM SINIESTROS</span>
                </div>
                <CardDescription className="text-text-muted">
                    Ingresa tus credenciales para acceder al sistema
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm font-medium text-danger bg-danger/10 rounded-md border border-danger/20 text-center">
                            {error === "Invalid login credentials" ? "Credenciales inválidas" : error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-text-secondary">Correo electrónico</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="nombre@estudio.com"
                            required
                            className="bg-bg-tertiary border-border focus-visible:ring-brand-primary h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-text-secondary">Contraseña</Label>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="bg-bg-tertiary border-border focus-visible:ring-brand-primary h-11"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-11 font-medium"
                        disabled={isPending}
                    >
                        {isPending ? "Ingresando..." : "Ingresar"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
