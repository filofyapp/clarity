/**
 * Parser de texto copiado del sistema de Sancor (fichas de orden de servicio).
 * Utiliza lógica basada en labels/keywords, NO posiciones fijas.
 * 
 * Campos extraídos:
 *  - numero_siniestro (Siniestro nro. XXXXXXXX)
 *  - numero_servicio  (OS XXXXXX - ...)
 *  - dominio          (Patente XXXXXXX)
 *  - vehiculo         (línea siguiente a "Vehículo")
 *  - instrucciones    (texto entre "Instrucciones" y "Denuncia")
 *  - gestor_nombre    (línea siguiente a "Gestor del reclamo")
 */

export interface ParsedCasoResult {
    numero_siniestro?: string;
    numero_servicio?: string;
    dominio?: string;
    vehiculo?: string;
    instrucciones?: string;
    gestor_nombre?: string;
    campos_encontrados: string[];
    campos_no_encontrados: string[];
    confianza: number; // 0.0 a 1.0
}

export function parsearSancorTexto(texto: string): ParsedCasoResult {
    const result: ParsedCasoResult = {
        campos_encontrados: [],
        campos_no_encontrados: [],
        confianza: 0,
    };

    // Normalize line endings
    const t = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = t.split('\n').map(l => l.trim());

    const CAMPOS_POSIBLES = [
        "Siniestro", "Servicio (OS)", "Patente", "Vehículo", "Instrucciones", "Gestor"
    ];

    // 1. Siniestro — "Siniestro nro." followed by number
    const matchSiniestro = t.match(/Siniestro\s+nro\.?\s*:?\s*([0-9]{6,12})/i);
    if (matchSiniestro?.[1]) {
        result.numero_siniestro = matchSiniestro[1].trim();
        result.campos_encontrados.push("Siniestro");
    } else {
        result.campos_no_encontrados.push("Siniestro");
    }

    // 2. Servicio (OS) — "OS " followed by number
    const matchOS = t.match(/\bOS\s+([0-9]{4,8})/i);
    if (matchOS?.[1]) {
        result.numero_servicio = matchOS[1].trim();
        result.campos_encontrados.push("Servicio (OS)");
    } else {
        result.campos_no_encontrados.push("Servicio (OS)");
    }

    // 3. Patente — "Patente" followed by formato viejo (AAA111) or nuevo (AA111AA)
    const matchPatente = t.match(/Patente\s+([A-Z]{2,3}\s?[0-9]{3}\s?[A-Z]{0,3})/i);
    if (matchPatente?.[1]) {
        result.dominio = matchPatente[1].replace(/\s/g, '').toUpperCase();
        result.campos_encontrados.push("Patente");
    } else {
        result.campos_no_encontrados.push("Patente");
    }

    // 4. Vehículo — line after exact "Vehículo" label
    const vehiculoIdx = lines.findIndex(l => /^Veh[ií]culo$/i.test(l));
    if (vehiculoIdx >= 0) {
        // Next non-empty line
        for (let i = vehiculoIdx + 1; i < lines.length; i++) {
            if (lines[i].length > 0) {
                result.vehiculo = lines[i];
                result.campos_encontrados.push("Vehículo");
                break;
            }
        }
        if (!result.vehiculo) result.campos_no_encontrados.push("Vehículo");
    } else {
        // Fallback: inline "Vehículo: ..." or "Vehículo ..." 
        const fallback = t.match(/Veh[ií]culo\s*:?\s*\n?\s*([^\n]+)/i);
        if (fallback?.[1] && fallback[1].length > 3) {
            result.vehiculo = fallback[1].replace(/(?:Referencia|Patente).*/i, '').trim();
            result.campos_encontrados.push("Vehículo");
        } else {
            result.campos_no_encontrados.push("Vehículo");
        }
    }

    // 5. Instrucciones — text between "Instrucciones" and "Denuncia"
    const instrIdx = lines.findIndex(l => /^Instrucciones$/i.test(l));
    const denunciaIdx = lines.findIndex((l, idx) => idx > instrIdx && /^Denuncia$/i.test(l));
    if (instrIdx >= 0) {
        const endIdx = denunciaIdx >= 0 ? denunciaIdx : lines.length;
        const instrLines = lines.slice(instrIdx + 1, endIdx).filter(l => l.length > 0);
        if (instrLines.length > 0) {
            result.instrucciones = instrLines.join('\n');
            result.campos_encontrados.push("Instrucciones");
        } else {
            result.campos_no_encontrados.push("Instrucciones");
        }
    } else {
        // Fallback: regex
        const fallback = t.match(/Instrucciones\s*:?\s*\n?\s*([\s\S]*?)(?:\nDenuncia|\nFecha de cierre|$)/i);
        if (fallback?.[1]?.trim()) {
            result.instrucciones = fallback[1].trim();
            result.campos_encontrados.push("Instrucciones");
        } else {
            result.campos_no_encontrados.push("Instrucciones");
        }
    }

    // 6. Gestor — line after "Gestor del reclamo"
    const gestorIdx = lines.findIndex(l => /^Gestor\s+del\s+reclamo$/i.test(l));
    if (gestorIdx >= 0) {
        for (let i = gestorIdx + 1; i < lines.length; i++) {
            if (lines[i].length > 0 && !/^Reclamo$/i.test(lines[i])) {
                result.gestor_nombre = lines[i];
                result.campos_encontrados.push("Gestor");
                break;
            }
        }
        if (!result.gestor_nombre) result.campos_no_encontrados.push("Gestor");
    } else {
        // Fallback regex
        const fallback = t.match(/Gestor\s+del?\s+reclamo\s*:?\s*\n?\s*([^\n]+)/i);
        if (fallback?.[1]?.trim()) {
            result.gestor_nombre = fallback[1].replace(/(?:Reclamo|Siniestro).*/i, '').trim();
            result.campos_encontrados.push("Gestor");
        } else {
            result.campos_no_encontrados.push("Gestor");
        }
    }

    // Confidence score
    result.confianza = Number((result.campos_encontrados.length / CAMPOS_POSIBLES.length).toFixed(2));

    return result;
}
