"use client";

import { motion } from "framer-motion";

const CIUDADES = [
    { nombre: "Buenos Aires", x: 63, y: 63, delay: 0 },
    { nombre: "Córdoba", x: 52, y: 52, delay: 0.3 },
    { nombre: "Rosario", x: 55, y: 56, delay: 0.5 },
    { nombre: "Mendoza", x: 36, y: 55, delay: 0.7 },
    { nombre: "Tucumán", x: 50, y: 38, delay: 0.9 },
    { nombre: "Salta", x: 48, y: 32, delay: 1.1 },
    { nombre: "Mar del Plata", x: 61, y: 69, delay: 1.3 },
    { nombre: "Neuquén", x: 40, y: 70, delay: 1.5 },
    { nombre: "Bariloche", x: 38, y: 74, delay: 1.7 },
    { nombre: "Corrientes", x: 62, y: 40, delay: 1.9 },
    { nombre: "Comodoro Rivadavia", x: 42, y: 82, delay: 2.1 },
    { nombre: "Ushuaia", x: 42, y: 96, delay: 2.3 },
];

// Proper Argentina outline SVG path (simplified but recognizable)
const ARGENTINA_PATH = `
M 50 4 L 48 5 L 46 8 L 44 10 L 43 14 L 45 16 L 48 17 L 50 16 L 52 17 L 55 18 L 58 20
L 60 22 L 62 21 L 65 23 L 67 26 L 68 28 L 70 30 L 72 32 L 74 33 L 73 35 L 72 37 L 70 38
L 69 40 L 70 42 L 72 43 L 73 44 L 72 46 L 70 47 L 68 48 L 67 50 L 68 52
L 70 53 L 71 55 L 70 57 L 68 58 L 67 60 L 68 62 L 70 63 L 71 65 L 69 67 L 67 68
L 65 69 L 63 71 L 61 72 L 59 73 L 57 72 L 55 73 L 53 75
L 51 76 L 49 77 L 47 79 L 45 81 L 44 83 L 43 85 L 42 87 L 41 89 L 40 91
L 39 93 L 40 95 L 42 96 L 44 97 L 46 97 L 48 96 L 50 97 L 48 98 L 45 99
L 42 98 L 39 97 L 37 95 L 35 93 L 34 91 L 33 89 L 32 87 L 31 85
L 30 83 L 29 81 L 28 79 L 27 77 L 26 75 L 25 73 L 26 71 L 27 69
L 28 67 L 29 65 L 30 63 L 29 61 L 28 59 L 27 57 L 26 55 L 27 53
L 28 51 L 30 50 L 32 49 L 33 47 L 32 45 L 30 43 L 29 41
L 30 39 L 32 38 L 34 37 L 35 35 L 34 33 L 33 31 L 34 29
L 36 28 L 38 27 L 40 25 L 41 23 L 42 21 L 43 19 L 44 17
L 42 15 L 41 13 L 42 11 L 44 9 L 46 7 L 48 5 L 50 4 Z
`;

export function ArgentinaMap() {
    return (
        <div className="relative w-full max-w-md mx-auto" style={{ aspectRatio: "3 / 4" }}>
            {/* Map SVG */}
            <svg
                viewBox="0 0 100 102"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Country fill */}
                <motion.path
                    d={ARGENTINA_PATH}
                    fill="rgba(214, 0, 110, 0.06)"
                    stroke="rgba(214, 0, 110, 0.2)"
                    strokeWidth="0.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    viewport={{ once: true }}
                />

                {/* Cities */}
                {CIUDADES.map((city) => (
                    <g key={city.nombre}>
                        {/* Pulse ring */}
                        <motion.circle
                            cx={city.x}
                            cy={city.y}
                            r="3"
                            fill="none"
                            stroke="#D6006E"
                            strokeWidth="0.3"
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: [1, 2, 2], opacity: [0.6, 0.2, 0] }}
                            transition={{
                                delay: city.delay + 0.5,
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeOut",
                            }}
                            viewport={{ once: true }}
                        />
                        {/* City dot */}
                        <motion.circle
                            cx={city.x}
                            cy={city.y}
                            r="1.2"
                            fill="#D6006E"
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: city.delay + 0.3, duration: 0.4, type: "spring" }}
                            viewport={{ once: true }}
                        />
                        {/* Label */}
                        <motion.text
                            x={city.x + 3}
                            y={city.y + 0.8}
                            fill="#A1A1AA"
                            fontSize="2.5"
                            fontFamily="system-ui, sans-serif"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 0.8 }}
                            transition={{ delay: city.delay + 0.5 }}
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
