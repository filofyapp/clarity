"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { KanbanBoard } from "./KanbanBoard";

interface TareasRealtimeWrapperProps {
    tareas: any[];
    usuarios: { id: string; nombre: string; apellido: string; rol: string }[];
    currentUserId: string;
    currentUserRol: string;
    currentUserRoles: string[];
    currentUserNombre: string;
}

export function TareasRealtimeWrapper(props: TareasRealtimeWrapperProps) {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase
            .channel("tareas_realtime")
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "tareas",
            }, () => {
                // Re-fetch from server to get full JOINs (creador, asignado, caso, participantes, comentarios)
                router.refresh();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, router]);

    return <KanbanBoard {...props} />;
}
