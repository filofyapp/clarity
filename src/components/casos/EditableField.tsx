"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCasoRapido } from "@/app/(dashboard)/casos/actions";

interface Opcion {
    label: string;
    value: string;
}

interface EditableFieldProps {
    casoId: string;
    campo: string;
    valorActual: string | null;
    displayValue?: string; // Lo que se muestra cuando no se edita (útil para selects)
    tipo: "text" | "textarea" | "select" | "date";
    opciones?: Opcion[];
    placeholder?: string;
    className?: string;
    textClassName?: string;
}

export function EditableField({
    casoId,
    campo,
    valorActual,
    displayValue,
    tipo,
    opciones = [],
    placeholder = "Sin especificar",
    className = "",
    textClassName = "text-sm",
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [valor, setValor] = useState(valorActual || "");
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<any>(null);

    useEffect(() => {
        setValor(valorActual || "");
    }, [valorActual]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        const valueToSave = valor.trim() === "" ? null : valor;
        if (valueToSave === valorActual) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        const res = await updateCasoRapido(casoId, campo, valueToSave);
        setIsLoading(false);

        if (res?.error) {
            toast.error(res.error);
            setValor(valorActual || ""); // revert
        } else {
            toast.success("Campo actualizado");
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tipo !== "textarea") {
            handleSave();
        } else if (e.key === "Escape") {
            setValor(valorActual || "");
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className={`flex items-start gap-2 ${className}`}>
                <div className="flex-1">
                    {tipo === "text" && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-bg-tertiary border border-brand-primary rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary text-text-primary"
                            placeholder={placeholder}
                        />
                    )}
                    {tipo === "textarea" && (
                        <textarea
                            ref={inputRef}
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-bg-tertiary border border-brand-primary rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary text-text-primary resize-y min-h-[80px]"
                            placeholder={placeholder}
                        />
                    )}
                    {tipo === "date" && (
                        <input
                            ref={inputRef}
                            type="date"
                            value={valor ? valor.split('T')[0] : ''}
                            onChange={(e) => setValor(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-bg-tertiary border border-brand-primary rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary text-text-primary"
                        />
                    )}
                    {tipo === "select" && (
                        <select
                            ref={inputRef}
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-bg-tertiary border border-brand-primary rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary text-text-primary"
                        >
                            <option value="">{placeholder}</option>
                            {opciones.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="p-1 rounded bg-brand-primary text-white hover:bg-brand-primary-hover disabled:opacity-50"
                        title="Guardar"
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button
                        onClick={() => {
                            setValor(valorActual || "");
                            setIsEditing(false);
                        }}
                        disabled={isLoading}
                        className="p-1 rounded bg-bg-tertiary border border-border text-text-muted hover:text-text-primary disabled:opacity-50"
                        title="Cancelar"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    }

    const displayedText = tipo === "select"
        ? (opciones.find(o => o.value === valorActual)?.label || displayValue || placeholder)
        : tipo === "date" 
            ? (valorActual ? new Date(valorActual + "T12:00:00").toLocaleDateString('es-AR') : placeholder) 
            : (valorActual || placeholder);

    return (
        <div
            className={`group inline-flex items-center gap-1.5 cursor-pointer -ml-1 px-1 py-0.5 rounded hover:bg-white/5 transition-colors ${className}`}
            onClick={() => setIsEditing(true)}
            title="Click para editar"
        >
            <span className={`${textClassName} ${!valorActual ? "text-text-muted italic" : "text-text-primary"} ${tipo === "textarea" ? "whitespace-pre-wrap break-words" : ""}`}>
                {displayedText}
            </span>
            <Edit2 className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
    );
}
