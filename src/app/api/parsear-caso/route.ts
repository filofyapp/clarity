import { NextResponse } from "next/server";
import { parsearSancorTexto } from "@/lib/parser/sancor";

export async function POST(request: Request) {
    try {
        const { texto_crudo } = await request.json();

        if (!texto_crudo || typeof texto_crudo !== "string") {
            return NextResponse.json(
                { error: "Se requiere un texto válido para procesar." },
                { status: 400 }
            );
        }

        // El procesamiento es sincrono basado en regex
        const resultado = parsearSancorTexto(texto_crudo);

        return NextResponse.json({
            success: true,
            data: resultado,
            message: `Parseo completado con un ${(resultado.confianza * 100).toFixed(0)}% de confianza.`,
        });
    } catch (error) {
        console.error("Error al parsear el caso:", error);
        return NextResponse.json(
            { error: "Ha ocurrido un error inesperado al procesar el texto.", details: error },
            { status: 500 }
        );
    }
}
