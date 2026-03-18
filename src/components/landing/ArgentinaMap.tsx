"use client";

import { motion } from "framer-motion";

const CITIES = [
    { name: "Buenos Aires", x: 58, y: 72, main: true },
    { name: "Córdoba", x: 50, y: 60, main: false },
    { name: "Rosario", x: 53, y: 63, main: false },
    { name: "Mendoza", x: 35, y: 63, main: false },
    { name: "Tucumán", x: 48, y: 48, main: false },
    { name: "Mar del Plata", x: 60, y: 78, main: false },
    { name: "Salta", x: 46, y: 40, main: false },
    { name: "Neuquén", x: 38, y: 78, main: false },
    { name: "Bariloche", x: 35, y: 82, main: false },
    { name: "Ushuaia", x: 38, y: 98, main: false },
    { name: "Resistencia", x: 58, y: 48, main: false },
    { name: "Corrientes", x: 60, y: 46, main: false },
];

const BA = CITIES[0];

export function ArgentinaMap() {
    return (
        <div className="relative w-full max-w-[500px] mx-auto" style={{ aspectRatio: "0.55" }}>
            <svg viewBox="0 0 100 110" className="w-full h-full" fill="none">
                {/* Simplified Argentina outline */}
                <path
                    d="M46 25 L50 22 L55 24 L60 22 L65 25 L63 30 L65 35 L62 38 
                       L60 42 L62 45 L60 48 L63 52 L62 56 L58 58 L60 62 
                       L62 65 L60 68 L62 72 L60 76 L58 80 L55 82 
                       L50 84 L46 86 L42 88 L40 92 L38 95 L40 98 L38 100 
                       L42 102 L38 104 L35 100 L33 96 L35 92 L34 88 
                       L32 84 L30 80 L32 76 L34 72 L30 68 L28 64 
                       L30 60 L35 58 L38 55 L36 50 L38 46 L42 42 
                       L40 38 L42 34 L44 30 L46 25Z"
                    fill="rgba(214, 0, 110, 0.04)"
                    stroke="rgba(214, 0, 110, 0.2)"
                    strokeWidth="0.5"
                />
                {/* Tierra del Fuego */}
                <path
                    d="M35 105 L40 103 L44 105 L42 108 L38 108 Z"
                    fill="rgba(214, 0, 110, 0.04)"
                    stroke="rgba(214, 0, 110, 0.2)"
                    strokeWidth="0.5"
                />

                {/* Connection lines from Buenos Aires */}
                {CITIES.filter(c => !c.main).map((city, i) => (
                    <motion.line
                        key={city.name}
                        x1={BA.x}
                        y1={BA.y}
                        x2={city.x}
                        y2={city.y}
                        stroke="rgba(214, 0, 110, 0.15)"
                        strokeWidth="0.3"
                        strokeDasharray="2 2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.3 + i * 0.15 }}
                        viewport={{ once: true }}
                    />
                ))}

                {/* City dots */}
                {CITIES.map((city, i) => (
                    <g key={city.name}>
                        {/* Outer pulse */}
                        <motion.circle
                            cx={city.x}
                            cy={city.y}
                            r={city.main ? 3 : 1.5}
                            fill="rgba(214, 0, 110, 0.2)"
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{
                                delay: 0.5 + i * 0.15,
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            viewport={{ once: false }}
                        />
                        {/* Inner dot */}
                        <motion.circle
                            cx={city.x}
                            cy={city.y}
                            r={city.main ? 2 : 1}
                            fill="#D6006E"
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: city.main ? 1 : 0.7 }}
                            transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                            viewport={{ once: true }}
                        />
                        {/* City label */}
                        <motion.text
                            x={city.x + (city.main ? 4 : 3)}
                            y={city.y + 1}
                            fontSize={city.main ? "3.5" : "2.5"}
                            fill="rgba(214, 0, 110, 0.6)"
                            fontFamily="var(--font-outfit), system-ui"
                            fontWeight={city.main ? "700" : "400"}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
                            viewport={{ once: true }}
                        >
                            {city.name}
                        </motion.text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
