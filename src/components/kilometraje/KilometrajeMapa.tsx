"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
    apiKey: string;
    polyline: string;
    legs: { start_address: string; end_address: string; distance_km: number }[];
    puntoPartida: string;
}

// Dark map styles matching CLARITY palette
const MAP_STYLES = [
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
] as google.maps.MapTypeStyle[];

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
    if (typeof google !== "undefined" && google.maps?.geometry) {
        return Promise.resolve();
    }
    if (loadPromise) return loadPromise;

    loadPromise = new Promise<void>((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            // Wait for it to load
            const check = () => {
                if (typeof google !== "undefined" && google.maps?.geometry) resolve();
                else setTimeout(check, 100);
            };
            check();
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&language=es&region=ar`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            const check = () => {
                if (typeof google !== "undefined" && google.maps?.geometry) resolve();
                else setTimeout(check, 100);
            };
            check();
        };
        script.onerror = () => reject(new Error("Failed to load Google Maps"));
        document.head.appendChild(script);
    });

    return loadPromise;
}

export function KilometrajeMapa({ apiKey, polyline, legs, puntoPartida }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapRef.current || !polyline) return;

        let cancelled = false;

        async function initMap() {
            try {
                await loadGoogleMaps(apiKey);
                if (cancelled || !mapRef.current) return;

                // Decode polyline
                const path = google.maps.geometry.encoding.decodePath(polyline);

                // Create map
                const map = new google.maps.Map(mapRef.current, {
                    zoom: 12,
                    center: path[Math.floor(path.length / 2)],
                    styles: MAP_STYLES,
                    disableDefaultUI: true,
                    zoomControl: true,
                    fullscreenControl: true,
                });

                // Draw route polyline in amber
                new google.maps.Polyline({
                    path,
                    geodesic: true,
                    strokeColor: "#F59E0B",
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                    map,
                });

                // Fit bounds
                const bounds = new google.maps.LatLngBounds();
                path.forEach((p: google.maps.LatLng) => bounds.extend(p));
                map.fitBounds(bounds, 50);

                // Add markers for legs
                if (legs.length > 0) {
                    const geocoder = new google.maps.Geocoder();

                    // Start marker (punto partida)
                    geocoder.geocode(
                        { address: puntoPartida + ", Buenos Aires, Argentina" },
                        (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                            if (status === "OK" && results && results[0]) {
                                new google.maps.Marker({
                                    position: results[0].geometry.location,
                                    map,
                                    label: { text: "🏠", fontSize: "18px" },
                                    title: "Punto de partida",
                                });
                            }
                        }
                    );

                    // Waypoint markers (numbered, red)
                    for (let i = 0; i < legs.length - 1; i++) {
                        const leg = legs[i];
                        geocoder.geocode(
                            { address: leg.end_address },
                            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                                if (status === "OK" && results && results[0]) {
                                    new google.maps.Marker({
                                        position: results[0].geometry.location,
                                        map,
                                        label: {
                                            text: String(i + 1),
                                            color: "white",
                                            fontWeight: "bold",
                                            fontSize: "12px",
                                        },
                                        icon: {
                                            path: google.maps.SymbolPath.CIRCLE,
                                            scale: 14,
                                            fillColor: "#EF4444",
                                            fillOpacity: 1,
                                            strokeColor: "#ffffff",
                                            strokeWeight: 2,
                                        },
                                        title: leg.end_address,
                                    });
                                }
                            }
                        );
                    }
                }

                setLoading(false);
            } catch (err: any) {
                if (!cancelled) {
                    console.error("Map init error:", err);
                    setError("Error al cargar el mapa");
                    setLoading(false);
                }
            }
        }

        initMap();
        return () => { cancelled = true; };
    }, [apiKey, polyline, legs, puntoPartida]);

    if (error) {
        return (
            <div className="h-[350px] bg-bg-tertiary border border-border rounded-xl flex items-center justify-center text-text-muted text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="relative rounded-xl overflow-hidden border border-border">
            {loading && (
                <div className="absolute inset-0 z-10 bg-bg-secondary/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-secondary" />
                </div>
            )}
            <div ref={mapRef} className="h-[350px] w-full" />
        </div>
    );
}
