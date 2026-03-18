import { NextResponse } from "next/server";

// Calcula ruta óptima usando Google Maps Directions API
// Ida y vuelta: origin → waypoints (optimizados) → origin
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin, waypoints } = body;

        if (!origin || !waypoints || waypoints.length === 0) {
            return NextResponse.json({ error: "Origen y al menos un destino son requeridos" }, { status: 400 });
        }

        const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;
        if (!GOOGLE_MAPS_KEY) {
            return NextResponse.json({
                km_total: 0,
                duracion_min: 0,
                polyline: null,
                legs: [],
                waypoint_order: [],
                google_maps_url: buildGoogleMapsUrl(origin, waypoints),
                error_api: "Google Maps API key no configurada."
            });
        }

        // Ida y vuelta: destino = origen
        const destination = origin;
        const waypointsStr = waypoints
            .map((w: string) => encodeURIComponent(w + ", Buenos Aires, Argentina"))
            .join("|");

        const url = `https://maps.googleapis.com/maps/api/directions/json` +
            `?origin=${encodeURIComponent(origin + ", Buenos Aires, Argentina")}` +
            `&destination=${encodeURIComponent(destination + ", Buenos Aires, Argentina")}` +
            `&waypoints=optimize:true|${waypointsStr}` +
            `&avoid=highways` +
            `&key=${GOOGLE_MAPS_KEY}` +
            `&language=es&region=ar`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            return NextResponse.json({
                km_total: 0,
                duracion_min: 0,
                polyline: null,
                legs: [],
                waypoint_order: [],
                google_maps_url: buildGoogleMapsUrl(origin, waypoints),
                error_api: `Google Maps respondió: ${data.status} — ${data.error_message || ""}`
            });
        }

        const route = data.routes[0];
        let totalMetros = 0;
        let totalSegundos = 0;

        // Build legs info
        const legs = route.legs.map((leg: any, i: number) => {
            totalMetros += leg.distance.value;
            totalSegundos += leg.duration.value;
            return {
                index: i,
                start_address: leg.start_address,
                end_address: leg.end_address,
                distance_km: Math.round((leg.distance.value / 1000) * 100) / 100,
                distance_text: leg.distance.text,
                duration_text: leg.duration.text,
            };
        });

        const km_total = Math.round((totalMetros / 1000) * 100) / 100;
        const duracion_min = Math.round(totalSegundos / 60);

        return NextResponse.json({
            km_total,
            duracion_min,
            polyline: route.overview_polyline?.points || null,
            legs,
            waypoint_order: route.waypoint_order || [],
            google_maps_url: buildGoogleMapsUrl(origin, waypoints),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function buildGoogleMapsUrl(origin: string, waypoints: string[]): string {
    // Build round-trip URL: origin → waypoints → origin
    const waypointStr = waypoints
        .map((w: string) => encodeURIComponent(w + ", Buenos Aires, Argentina"))
        .join("|");
    return `https://www.google.com/maps/dir/?api=1` +
        `&origin=${encodeURIComponent(origin)}` +
        `&destination=${encodeURIComponent(origin)}` +
        `&waypoints=${waypointStr}` +
        `&travelmode=driving`;
}
