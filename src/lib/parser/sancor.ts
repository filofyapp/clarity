/**
 * Utilidad de parseo para textos de correos/sistemas de Sancor Seguros.
 * Utiliza Expresiones Regulares para identificar y extraer datos estructurados
 * críticos para el alta de un caso en CLARITY.
 */

export interface ParsedCasoResult {
    numero_siniestro?: string;
    numero_servicio?: string;
    nombre_asegurado?: string;
    dni_asegurado?: string;
    telefono_asegurado?: string;
    dominio?: string;
    vehiculo?: string;
    direccion_inspeccion?: string;
    gestor_nombre?: string;
    instrucciones?: string;
    confianza: number; // 0.0 a 1.0
}

export function parsearSancorTexto(texto: string): ParsedCasoResult {
    const result: ParsedCasoResult = {
        confianza: 0
    };

    let camposEncontrados = 0;
    const totalCampos = 10;

    // Limpiar texto base para facilitar regex (saltos de línea extra, espacios, etc.)
    const t = texto.replace(/\r\n/g, '\n');

    // 1. Siniestro (ej: 2003928961, SIN-2003928961)
    const matchSiniestro = t.match(/(?:siniestro|sin\.|siniestro nro\.?)\s*:?\s*#?([0-9]{8,12})/i);
    if (matchSiniestro && matchSiniestro[1]) {
        result.numero_siniestro = matchSiniestro[1].trim();
        camposEncontrados++;
    }

    // 2. Servicio/OS (ej: OS 513822 - Pericias Mecánicas)
    const matchServicio = t.match(/(?:servicio|srv|os)\s*:?\s*#?([0-9]+)/i);
    if (matchServicio && matchServicio[1]) {
        result.numero_servicio = matchServicio[1].trim();
        camposEncontrados++;
    }

    // 3. Asegurado / Tercero Nombre
    const matchAsegurado = t.match(/(?:asegurado|tercero|nombre|titular)\s*:?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+)(?:(?:\n|\r|dni|tel|cel|vehiculo))/i);
    if (matchAsegurado && matchAsegurado[1]) {
        result.nombre_asegurado = matchAsegurado[1].trim().replace(/(dni|tel|cel|vehiculo)/i, '').trim();
        camposEncontrados++;
    }

    // 4. DNI
    const matchDni = t.match(/(?:dni|documento|cuit|cuil)\s*:?\s*([0-9]{7,11})/i);
    if (matchDni && matchDni[1]) {
        result.dni_asegurado = matchDni[1].trim();
        camposEncontrados++;
    }

    // 5. Teléfono
    const matchTel = t.match(/(?:tel\.|teléfono|telefono|celular|cel\.|tel)\s*:?\s*([0-9\-\s\+]{8,15})/i);
    if (matchTel && matchTel[1]) {
        result.telefono_asegurado = matchTel[1].trim();
        camposEncontrados++;
    }

    // 6. Dominio (Patente)
    const matchDominio = t.match(/(?:patente|dominio|chapa)\s*:?\s*([A-Z]{2,3}\s?[0-9]{3}\s?[A-Z]{0,2})/i);
    if (matchDominio && matchDominio[1]) {
        result.dominio = matchDominio[1].replace(/\s/g, '').toUpperCase();
        camposEncontrados++;
    }

    // 7. Vehículo Completo (Orion Format: Vehículo \n RENAULT SANDERO... or inline Vehiculo RENAULT...)
    const matchVehiculo = t.match(/(?:vehículo|vehiculo)\s*:?\s*\n?\s*([^\n]+)/i);
    if (matchVehiculo && matchVehiculo[1]) {
        result.vehiculo = matchVehiculo[1].replace(/(?:referencia|patente|año|modelo).*/i, '').trim();
        camposEncontrados++;
    }

    // 8. Instrucciones / Descripción
    const matchInstrucciones = t.match(/(?:instrucciones|comentarios|observaciones|descripcion|descripción)(?:\s*enviada\s*por\s*el\s*gestor)?\s*:?\s*\n?\s*([\s\S]*?)(?:\nDenuncia|\nFecha de|\nReclamo|$)/i);
    if (matchInstrucciones && matchInstrucciones[1]) {
        result.instrucciones = matchInstrucciones[1].trim();
        camposEncontrados++;
    }

    // 10. Dirección Inspección
    const matchLugar = t.match(/(?:lugar|ubicacion|ubicación|domicilio|lugar de inspeccion|inspección en|direccion)\s*:?\s*(.+)/i);
    if (matchLugar && matchLugar[1]) {
        // Tomamos la línea completa del match
        result.direccion_inspeccion = matchLugar[1].trim();
        camposEncontrados++;
    }

    // 11. Gestor (Orion Format: Gestor del reclamo \n BOULLE JULIETA ANA or inline)
    const matchGestor = t.match(/(?:Gestor del reclamo|Gestor de Reclamo)\s*:?\s*\n?\s*([^\n]+)/i);
    if (matchGestor && matchGestor[1]) {
        result.gestor_nombre = matchGestor[1].replace(/(?:Reclamo|Siniestro|Referencia)/i, '').trim();
        camposEncontrados++;
    }

    // Calcular score de confianza básico
    result.confianza = Number((camposEncontrados / (totalCampos + 1)).toFixed(2));

    return result;
}
