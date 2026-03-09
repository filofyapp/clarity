"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2 } from "lucide-react";
import { upsertPerito } from "@/app/(dashboard)/directorio/peritos/actions";
import { toast } from "sonner";
import Select from "react-select";

const roleOptions = [
    { value: "admin", label: "Coordinador / Admin" },
    { value: "calle", label: "Perito de Calle" },
    { value: "carga", label: "Perito de Carga" },
];

export function PeritoFormDialog({ perito, trigger }: { perito?: any, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // The perito object now contains 'roles', which is a string[] array. 
    // If it only has the legacy "rol", we map it to an array for the initial state.
    const initialRoles = perito?.roles?.length
        ? perito.roles.map((r: string) => roleOptions.find(o => o.value === r)).filter(Boolean)
        : (perito?.rol ? [roleOptions.find(o => o.value === perito.rol)].filter(Boolean) : [roleOptions[1]]); // Default to "calle"

    const [selectedRoles, setSelectedRoles] = useState<any[]>(initialRoles);

    const isEdit = !!perito;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Ensure we send all selected roles
        const rolesArray = selectedRoles.map(r => r.value);
        if (rolesArray.length === 0) {
            toast.error("Debes seleccionar al menos un rol.");
            return;
        }

        formData.append("roles", JSON.stringify(rolesArray));

        startTransition(async () => {
            const result = await upsertPerito(formData, perito?.id);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEdit ? "Perito actualizado." : "Cuenta de perito creada.");
                setOpen(false);
            }
        });
    };

    const customStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: 'var(--tw-bg-opacity) bg-bg-tertiary',
            borderColor: state.isFocused ? 'var(--tw-colors-brand-primary)' : 'var(--tw-colors-border)',
            boxShadow: 'none',
            '&:hover': {
                borderColor: state.isFocused ? 'var(--tw-colors-brand-primary)' : 'var(--tw-colors-border)',
            },
            minHeight: '40px',
            borderRadius: 'var(--radius)',
            className: "bg-bg-tertiary border-border"
        }),
        menu: (provided: any) => ({
            ...provided,
            backgroundColor: '#1E2336', // Fallback theme color approximated bg-bg-elevated
            border: '1px solid var(--tw-colors-border)',
            zIndex: 9999
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected || state.isFocused ? '#2E3656' : 'transparent',
            color: 'white',
            cursor: 'pointer'
        }),
        multiValue: (provided: any) => ({
            ...provided,
            backgroundColor: '#6366F1', // brand primary
            borderRadius: '4px'
        }),
        multiValueLabel: (provided: any) => ({
            ...provided,
            color: 'white',
        }),
        multiValueRemove: (provided: any) => ({
            ...provided,
            color: 'white',
            ':hover': {
                backgroundColor: '#4F46E5', // brand primary hover
                color: 'white',
            },
        }),
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="h-9 bg-brand-primary hover:bg-brand-primary-hover text-white">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Perito
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-bg-secondary border-border text-text-primary max-w-md overflow-visible">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Cuenta de Perito" : "Crear Cuenta de Perito"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-visible">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Nombre *</label>
                            <Input name="nombre" defaultValue={perito?.nombre} required placeholder="Juan"
                                className="bg-bg-tertiary border-border" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Apellido *</label>
                            <Input name="apellido" defaultValue={perito?.apellido} required placeholder="Pérez"
                                className="bg-bg-tertiary border-border" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Email (Usuario) *</label>
                        <Input name="email" type="email" defaultValue={perito?.email} required placeholder="jperez@aomnis.local"
                            className="bg-bg-tertiary border-border" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Teléfono</label>
                        <Input name="telefono" defaultValue={perito?.telefono} placeholder="11-2333-4444"
                            className="bg-bg-tertiary border-border" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Roles *</label>
                        <Select
                            isMulti
                            name="roles"
                            options={roleOptions}
                            value={selectedRoles}
                            onChange={(selected: any) => setSelectedRoles(selected || [])}
                            placeholder="Seleccione uno o más roles"
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                            styles={customStyles}
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary: '#6366F1', // brand primary
                                },
                            })}
                        />
                    </div>

                    <div className="pt-2 border-t border-border mt-2">
                        <label className="text-xs text-text-muted block mb-1">
                            {isEdit ? "Nueva Contraseña (Opcional)" : "Contraseña de Acceso *"}
                        </label>
                        <Input
                            name="password"
                            type="text"
                            required={!isEdit}
                            placeholder={isEdit ? "Dejar en blanco para no cambiarla" : "Mínimo 6 caracteres"}
                            minLength={6}
                            className="bg-bg-tertiary border-border"
                        />
                    </div>

                    <p className="text-xs text-text-muted italic">Esta cuenta le permitirá ingresar al sistema con los roles seleccionados.</p>
                    <Button type="submit" disabled={isPending}
                        className="w-full bg-brand-primary hover:bg-brand-primary-hover">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isEdit ? "Guardar Cambios" : "Crear Acceso"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
