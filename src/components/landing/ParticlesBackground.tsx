"use client";

import { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

interface Props {
    isDark: boolean;
}

export function ParticlesBackground({ isDark }: Props) {
    const [isMobile, setIsMobile] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => setReady(true));
    }, []);

    const accent = isDark ? "#D6006E" : "#C2005F";

    const options: ISourceOptions = useMemo(() => ({
        fullScreen: false,
        fpsLimit: 60,
        particles: {
            number: { value: 80, density: { enable: true } },
            color: { value: accent },
            opacity: {
                value: { min: 0.1, max: 0.4 },
            },
            size: {
                value: { min: 1, max: 3 },
            },
            move: {
                enable: true,
                speed: 0.6,
                direction: "none" as const,
                random: true,
                straight: false,
                outModes: { default: "bounce" as const },
            },
            links: {
                enable: true,
                color: accent,
                distance: 120,
                opacity: 0.05,
                width: 1,
            },
        },
        interactivity: {
            events: {
                onHover: { enable: true, mode: "grab" as const },
            },
            modes: {
                grab: { distance: 140, links: { opacity: 0.15 } },
            },
        },
        detectRetina: true,
    }), [accent]);

    if (isMobile || !ready) return null;

    return (
        <Particles
            id="landing-particles"
            options={options}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
            }}
        />
    );
}
