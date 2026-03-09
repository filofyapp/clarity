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
                <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
                        <span className="font-extrabold text-xl">AO</span>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-text-primary">CLARITY</CardTitle>
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
                        <div className="mt-2 text-xs text-text-muted text-center space-y-1 bg-bg-secondary p-3 rounded-md border border-border">
                            <p className="font-semibold text-text-primary">Credenciales de Pruebas (Local)</p>
                            <p>Email: <span className="font-mono text-text-primary select-all">admin@clarity.test</span></p>
                            <p>Clave: <span className="font-mono text-brand-primary select-all">admin123456</span></p>
                        </div>
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
