"use client";

import { useState, useEffect } from "react";

/**
 * Hook personalizado para sincronizar un estado de React con localStorage automáticamente.
 * Ideal para preservar filtros en tablas, preferencias de usuario, etc.
 * Resiliente a problemas en Server-Side Rendering (SSR).
 */
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
    // Inicializar el estado local con un valor por default seguro para SSR
    const [state, setState] = useState<T>(defaultValue);

    // En el primer render del cliente, intentamos recuperar la data de localStorage
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item !== null) {
                setState(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error al leer desde localStorage (${key}):`, error);
        }
    }, [key]);

    // Función setter customizada que actualiza tanto React como LocalStorage
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Permitimos el uso de de setters como prev => getNext(prev)
            const valueToStore = value instanceof Function ? value(state) : value;

            setState(valueToStore); // Actualizar UI

            // Si el valor es undefined, preferimos borrar la llave en lugar de guardar "undefined"
            if (valueToStore === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error al guardar en localStorage (${key}):`, error);
        }
    };

    return [state, setValue];
}
