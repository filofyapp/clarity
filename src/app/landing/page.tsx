"use client";

import { DM_Sans } from "next/font/google";
import dynamic from "next/dynamic";
import "./landing.css";

// Dynamic import: LandingPage uses framer-motion (~40KB), @tsparticles (~100KB+)
// These should NOT be in the main app bundle — only loaded when visiting /landing
const LandingPage = dynamic(
    () => import("@/components/landing/LandingPage").then(mod => mod.LandingPage),
    { ssr: false }
);

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    weight: ["400", "500"],
});

export default function LandingRoute() {
    return (
        <div className={dmSans.variable}>
            <LandingPage />
        </div>
    );
}
