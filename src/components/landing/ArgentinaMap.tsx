"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

// ═══════════════════════════════════════════════
// REAL GeoJSON coordinates from world.geo.json
// Tierra del Fuego island
// ═══════════════════════════════════════════════
const TDF_COORDS: [number, number][] = [
    [-65.5, -55.2], [-66.45, -55.25], [-66.96, -54.9], [-67.56, -54.87],
    [-68.63, -54.87], [-68.63, -52.64], [-68.25, -53.1], [-67.75, -53.85],
    [-66.45, -54.45], [-65.05, -54.7], [-65.5, -55.2],
];

// ═══════════════════════════════════════════════
// Mainland Argentina (simplified from GeoJSON)
// ═══════════════════════════════════════════════
const MAINLAND_COORDS: [number, number][] = [
    [-64.96, -22.08], [-64.38, -22.8], [-63.99, -21.99], [-62.85, -22.03],
    [-62.69, -22.25], [-60.85, -23.88], [-60.03, -24.03], [-58.81, -24.77],
    [-57.78, -25.16], [-57.63, -25.6], [-58.62, -27.12], [-57.61, -27.4],
    [-56.49, -27.55], [-55.7, -27.39], [-54.79, -26.62], [-54.63, -25.74],
    [-54.13, -25.55], [-53.63, -26.12], [-53.65, -26.92], [-54.49, -27.47],
    [-55.16, -27.88], [-56.29, -28.85], [-57.63, -30.22], [-57.87, -31.02],
    [-58.14, -32.04], [-58.13, -33.04], [-58.35, -33.26], [-58.43, -33.91],
    [-58.5, -34.43], [-57.23, -35.29], [-57.36, -35.98], [-56.74, -36.41],
    [-56.79, -36.9], [-57.75, -38.18], [-59.23, -38.72], [-61.24, -38.93],
    [-62.34, -38.83], [-62.13, -39.42], [-62.33, -40.17], [-62.15, -40.68],
    [-62.75, -41.03], [-63.77, -41.17], [-64.73, -40.8], [-65.12, -41.06],
    [-64.98, -42.06], [-64.3, -42.36], [-63.76, -42.04], [-63.46, -42.56],
    [-64.38, -42.87], [-65.18, -43.5], [-65.33, -44.5], [-65.57, -45.04],
    [-66.51, -45.04], [-67.29, -45.55], [-67.58, -46.3], [-66.6, -47.03],
    [-65.64, -47.24], [-65.99, -48.13], [-67.17, -48.7], [-67.82, -49.87],
    [-68.73, -50.26], [-69.14, -50.73], [-68.82, -51.77], [-68.15, -52.35],
    [-68.57, -52.3], [-69.5, -52.14], [-71.91, -52.01], [-72.33, -51.43],
    [-72.31, -50.68], [-72.98, -50.74], [-73.33, -50.38], [-73.42, -49.32],
    [-72.65, -48.88], [-72.33, -48.24], [-72.45, -47.74], [-71.92, -46.88],
    [-71.55, -45.56], [-71.66, -44.97], [-71.22, -44.78], [-71.33, -44.41],
    [-71.79, -44.21], [-71.46, -43.79], [-71.92, -43.41], [-72.15, -42.25],
    [-71.75, -42.05], [-71.92, -40.83], [-71.68, -39.81], [-71.41, -38.92],
    [-70.81, -38.55], [-71.12, -37.58], [-71.12, -36.66], [-70.36, -36.01],
    [-70.39, -35.17], [-69.82, -34.19], [-69.81, -33.27], [-70.07, -33.09],
    [-70.54, -31.37], [-69.92, -30.34], [-70.01, -29.37], [-69.66, -28.46],
    [-69.0, -27.52], [-68.3, -26.9], [-68.59, -26.51], [-68.39, -26.19],
    [-68.42, -24.52], [-67.33, -24.03], [-66.99, -22.99], [-67.11, -22.74],
    [-66.27, -21.83], [-64.96, -22.08],
];

// Cities with approximate geographic positions
const CIUDADES = [
    { nombre: "Buenos Aires", lon: -58.44, lat: -34.6 },
    { nombre: "Córdoba", lon: -64.18, lat: -31.42 },
    { nombre: "Rosario", lon: -60.65, lat: -32.95 },
    { nombre: "Mendoza", lon: -68.84, lat: -32.89 },
    { nombre: "Tucumán", lon: -65.22, lat: -26.82 },
    { nombre: "Salta", lon: -65.41, lat: -24.79 },
    { nombre: "Mar del Plata", lon: -57.55, lat: -38.0 },
    { nombre: "Neuquén", lon: -68.06, lat: -38.95 },
    { nombre: "Bariloche", lon: -71.31, lat: -41.13 },
    { nombre: "Corrientes", lon: -58.83, lat: -27.47 },
    { nombre: "C. Rivadavia", lon: -67.5, lat: -45.87 },
    { nombre: "Ushuaia", lon: -68.3, lat: -54.8 },
];

// Convert geo coords [lon, lat] to SVG [x, y]
function geoToSvg(
    lon: number,
    lat: number,
    bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number },
    width: number,
    height: number,
    padding: number = 5,
): [number, number] {
    const lonRange = bounds.maxLon - bounds.minLon;
    const latRange = bounds.maxLat - bounds.minLat;
    const x = padding + ((lon - bounds.minLon) / lonRange) * (width - 2 * padding);
    // Flip Y because SVG Y goes down but latitude goes up
    const y = padding + ((bounds.maxLat - lat) / latRange) * (height - 2 * padding);
    return [x, y];
}

function coordsToPath(
    coords: [number, number][],
    bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number },
    w: number, h: number,
): string {
    return coords.map((c, i) => {
        const [x, y] = geoToSvg(c[0], c[1], bounds, w, h);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z";
}

const SVG_W = 200;
const SVG_H = 340;

// Calculate bounds from all coordinates
const allCoords = [...MAINLAND_COORDS, ...TDF_COORDS];
const BOUNDS = {
    minLon: Math.min(...allCoords.map(c => c[0])) - 0.5,
    maxLon: Math.max(...allCoords.map(c => c[0])) + 0.5,
    minLat: Math.min(...allCoords.map(c => c[1])) - 0.5,
    maxLat: Math.max(...allCoords.map(c => c[1])) + 0.5,
};

export function ArgentinaMap() {
    const mainlandPath = useMemo(() => coordsToPath(MAINLAND_COORDS, BOUNDS, SVG_W, SVG_H), []);
    const tdfPath = useMemo(() => coordsToPath(TDF_COORDS, BOUNDS, SVG_W, SVG_H), []);

    const cityPositions = useMemo(() =>
        CIUDADES.map(c => ({
            ...c,
            pos: geoToSvg(c.lon, c.lat, BOUNDS, SVG_W, SVG_H),
        })),
        []
    );

    return (
        <div className="relative w-full max-w-sm mx-auto" style={{ aspectRatio: `${SVG_W} / ${SVG_H}` }}>
            <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Mainland */}
                <motion.path
                    d={mainlandPath}
                    fill="rgba(214, 0, 110, 0.06)"
                    stroke="rgba(214, 0, 110, 0.25)"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                />

                {/* Tierra del Fuego */}
                <motion.path
                    d={tdfPath}
                    fill="rgba(214, 0, 110, 0.06)"
                    stroke="rgba(214, 0, 110, 0.25)"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    viewport={{ once: true }}
                />

                {/* Cities */}
                {cityPositions.map((city, idx) => (
                    <g key={city.nombre}>
                        {/* Pulse ring */}
                        <motion.circle
                            cx={city.pos[0]}
                            cy={city.pos[1]}
                            r="4"
                            fill="none"
                            stroke="#D6006E"
                            strokeWidth="0.5"
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{
                                scale: [1, 2.5, 2.5],
                                opacity: [0.5, 0.1, 0],
                            }}
                            transition={{
                                delay: 0.8 + idx * 0.2,
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeOut",
                            }}
                            viewport={{ once: true }}
                        />
                        {/* Dot */}
                        <motion.circle
                            cx={city.pos[0]}
                            cy={city.pos[1]}
                            r="2"
                            fill="#D6006E"
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 + idx * 0.15, duration: 0.4, type: "spring" }}
                            viewport={{ once: true }}
                        />
                        {/* Label */}
                        <motion.text
                            x={city.pos[0] + 5}
                            y={city.pos[1] + 1.5}
                            fill="#A1A1AA"
                            fontSize="5"
                            fontFamily="system-ui, sans-serif"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 0.7 }}
                            transition={{ delay: 0.8 + idx * 0.15 }}
                            viewport={{ once: true }}
                        >
                            {city.nombre}
                        </motion.text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
