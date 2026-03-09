import { NextResponse } from "next/server";

// Calcula ruta óptima usando Google Maps Directions API
// Recibe: origin, destination, waypoints[]
// Devuelve: km_total, duracion_min, polyline, deep links
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin, waypoints } = body;

        if (!origin || !waypoints || waypoints.length === 0) {
            return NextResponse.json({ error: "Origen y al menos un destino son requeridos" }, { status: 400 });
        }

        const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;
        if (!GOOGLE_MAPS_KEY) {
            // Sin API key, devolvemos estimación manual
            return NextResponse.json({
                km_total: 0,
                duracion_min: 0,
                polyline: null,
                google_maps_url: buildGoogleMapsUrl(origin, waypoints),
                waze_url: buildWazeUrl(waypoints[0]),
                error_api: "Google Maps API key no configurada. Se generaron deep links sin cálculo de ruta."
            });
        }

        // Armar URL de la Directions API
        const destination = waypoints[waypoints.length - 1];
        const intermedios = waypoints.slice(0, -1);

        let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_KEY}&language=es&region=ar`;

        if (intermedios.length > 0) {
            url += `&waypoints=optimize:true|${intermedios.map((w: string) => encodeURIComponent(w)).join("|")}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            return NextResponse.json({
                km_total: 0,
                duracion_min: 0,
                polyline: null,
                google_maps_url: buildGoogleMapsUrl(origin, waypoints),
                waze_url: buildWazeUrl(waypoints[0]),
                error_api: `Google Maps respondió: ${data.status}`
            });
        }

        // Sumar distancias y duraciones de cada leg
        let totalMetros = 0;
        let totalSegundos = 0;
        for (const leg of data.routes[0].legs) {
            totalMetros += leg.distance.value;
            totalSegundos += leg.duration.value;
        }

        const km_total = Math.round((totalMetros / 1000) * 100) / 100;
        const duracion_min = Math.round(totalSegundos / 60);

        return NextResponse.json({
            km_total,
            duracion_min,
            polyline: data.routes[0].overview_polyline?.points || null,
            google_maps_url: buildGoogleMapsUrl(origin, waypoints),
            waze_url: buildWazeUrl(waypoints[0]),
            orden_optimizado: data.routes[0].waypoint_order || []
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function buildGoogleMapsUrl(origin: string, waypoints: string[]): string {
    const destination = waypoints[waypoints.length - 1];
    const intermedios = waypoints.slice(0, -1);
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    if (intermedios.length > 0) {
        url += `&waypoints=${intermedios.map((w: string) => encodeURIComponent(w)).join("|")}`;
    }
    return url;
}

function buildWazeUrl(destination: string): string {
    return `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
}
