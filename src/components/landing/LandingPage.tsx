"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    Sun, Moon, Clock, PhoneCall, AlertTriangle, Check,
    ChevronDown, Mail, Link2, Timer, MapPin, Shield,
    Camera, FileText, PenTool,
} from "lucide-react";
import { ParticlesBackground } from "./ParticlesBackground";
import { ArgentinaMap } from "./ArgentinaMap";

// ═══════════════════════════════════════════════
// EDITABLE DATA — Change texts and numbers here
// ═══════════════════════════════════════════════
const LANDING_DATA = {
    hero: {
        tagline: "De 7 días a 7 minutos.",
        subtitle: "El sistema de inspección vehicular que está transformando\nla gestión de siniestros en Argentina.",
    },
    painPoints: {
        tiempo: { valor: "7.2", sufijo: " días", texto: "Tiempo promedio de resolución de una inspección con métodos tradicionales" },
        gestores: { valor: "34", sufijo: "%", texto: "Del tiempo de un gestor se pierde consultando estados de siniestros" },
        disputas: { valor: "$2.4", sufijo: "M", texto: "Costo anual estimado por disputas con talleres sin documentación" },
    },
    remota: {
        counter: { valor: 847, sufijo: "", texto: "inspecciones remotas completadas" },
    },
    presencial: {
        counter: { valor: 0, sufijo: "", texto: "disputas en los últimos 90 días" },
    },
    metricas: {
        casos: { valor: 1247, sufijo: "", subtitulo: "en los últimos 6 meses" },
        tiempo: { valor: 4.2, sufijo: " días", subtitulo: "vs. 7+ días del mercado" },
        fotos: { valor: 18400, sufijo: "+", subtitulo: "con control de calidad" },
        satisfaccion: { valor: 97, sufijo: "%", subtitulo: "en encuestas internas" },
    },
    contacto: {
        nombre: "Nicolás Cordova",
        rol: "Coordinador",
        email: "gestionsancoraomsiniestros@gmail.com",
        estudio: "Estudio AOM Siniestros",
    },
};

// ═══════════════════════════════════════════════
// COUNTER — Animates from 0 to value
// ═══════════════════════════════════════════════
function AnimatedCounter({
    value, suffix = "", prefix = "", decimals = 0, duration = 1500,
}: {
    value: number; suffix?: string; prefix?: string; decimals?: number; duration?: number;
}) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                    const start = performance.now();
                    const animate = (now: number) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3); // easeOut
                        setCount(eased * value);
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [value, duration, hasStarted]);

    const formatted = decimals > 0
        ? count.toFixed(decimals)
        : Math.round(count).toLocaleString("es-AR");

    return (
        <span ref={ref}>
            {prefix}{formatted}{suffix}
        </span>
    );
}

// ═══════════════════════════════════════════════
// SCROLL REVEAL WRAPPER
// ═══════════════════════════════════════════════
function Reveal({
    children, delay = 0, className = "",
}: {
    children: React.ReactNode; delay?: number; className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay }}
            viewport={{ once: true, margin: "-100px" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export function LandingPage() {
    const [isDark, setIsDark] = useState(true);
    const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isMobile) return;
        setMousePos({ x: e.clientX, y: e.clientY });
    }, [isMobile]);

    // Parallax refs
    const { scrollYProgress } = useScroll();
    const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -60]);

    return (
        <div
            ref={containerRef}
            className={`landing-root ${isDark ? "landing-dark" : "landing-light"}`}
            onMouseMove={handleMouseMove}
        >
            {/* Cursor glow (desktop only, dark mode only) */}
            {!isMobile && isDark && (
                <div
                    className="cursor-glow"
                    style={{ left: mousePos.x, top: mousePos.y }}
                />
            )}

            {/* Theme toggle */}
            <button
                className="theme-toggle"
                onClick={() => setIsDark(!isDark)}
                aria-label="Toggle theme"
            >
                <motion.div
                    key={isDark ? "moon" : "sun"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
            </button>

            {/* ═══════════════ HERO ═══════════════ */}
            <section
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                    minHeight: "100vh",
                    background: isDark
                        ? "radial-gradient(ellipse at 50% 40%, rgba(214,0,110,0.06) 0%, #06060A 70%)"
                        : "radial-gradient(ellipse at 50% 40%, rgba(214,0,110,0.04) 0%, #FAFAF8 70%)",
                }}
            >
                <ParticlesBackground isDark={isDark} />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    {/* Logo text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h2
                            className="heading-font tracking-[0.3em] text-lg md:text-xl mb-12"
                            style={{ color: "var(--text-muted)", fontWeight: 800 }}
                        >
                            C L A R I T Y
                        </h2>
                    </motion.div>

                    {/* Tagline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="heading-font gradient-text glow-magenta text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8"
                    >
                        {LANDING_DATA.hero.tagline}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto whitespace-pre-line"
                        style={{ color: "var(--text-body)" }}
                    >
                        {LANDING_DATA.hero.subtitle}
                    </motion.p>

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <span className="pill">🔒 Al servicio de Sancor Seguros</span>
                    </motion.div>
                </div>

                {/* Scroll arrow */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 animate-bounce-arrow"
                >
                    <ChevronDown size={28} style={{ color: "var(--text-muted)" }} />
                </motion.div>
            </section>

            {/* ═══════════════ SECTION 2 — EL PROBLEMA ═══════════════ */}
            <section className="section-gradient-top py-24 md:py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <h2
                            className="heading-font text-3xl md:text-5xl font-bold text-center mb-16"
                            style={{ color: "var(--text-heading)" }}
                        >
                            ¿Cuánto le cuestan las demoras?
                        </h2>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {/* Card 1 */}
                        <Reveal delay={0.1}>
                            <div className="landing-card text-center">
                                <div className="card-glow" />
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                    style={{ background: "var(--accent-glow)" }}
                                >
                                    <Clock size={28} style={{ color: "var(--accent)" }} />
                                </div>
                                <p
                                    className="heading-font text-4xl md:text-5xl font-bold mb-4"
                                    style={{ color: "var(--accent)" }}
                                >
                                    <AnimatedCounter
                                        value={7.2}
                                        suffix={LANDING_DATA.painPoints.tiempo.sufijo}
                                        decimals={1}
                                    />
                                </p>
                                <p style={{ color: "var(--text-body)", fontSize: "15px", lineHeight: "1.6" }}>
                                    {LANDING_DATA.painPoints.tiempo.texto}
                                </p>
                            </div>
                        </Reveal>

                        {/* Card 2 */}
                        <Reveal delay={0.25}>
                            <div className="landing-card text-center">
                                <div className="card-glow" />
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                    style={{ background: "var(--accent-glow)" }}
                                >
                                    <PhoneCall size={28} style={{ color: "var(--accent)" }} />
                                </div>
                                <p
                                    className="heading-font text-4xl md:text-5xl font-bold mb-4"
                                    style={{ color: "var(--accent)" }}
                                >
                                    <AnimatedCounter
                                        value={34}
                                        suffix={LANDING_DATA.painPoints.gestores.sufijo}
                                    />
                                </p>
                                <p style={{ color: "var(--text-body)", fontSize: "15px", lineHeight: "1.6" }}>
                                    {LANDING_DATA.painPoints.gestores.texto}
                                </p>
                            </div>
                        </Reveal>

                        {/* Card 3 */}
                        <Reveal delay={0.4}>
                            <div className="landing-card text-center">
                                <div className="card-glow" />
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                    style={{ background: "var(--accent-glow)" }}
                                >
                                    <AlertTriangle size={28} style={{ color: "var(--accent)" }} />
                                </div>
                                <p
                                    className="heading-font text-4xl md:text-5xl font-bold mb-4"
                                    style={{ color: "var(--accent)" }}
                                >
                                    <AnimatedCounter
                                        value={2.4}
                                        prefix="$"
                                        suffix={LANDING_DATA.painPoints.disputas.sufijo}
                                        decimals={1}
                                    />
                                </p>
                                <p style={{ color: "var(--text-body)", fontSize: "15px", lineHeight: "1.6" }}>
                                    {LANDING_DATA.painPoints.disputas.texto}
                                </p>
                            </div>
                        </Reveal>
                    </div>

                    <Reveal delay={0.5}>
                        <p className="text-center mt-10 text-xs" style={{ color: "var(--text-muted)" }}>
                            Datos estimados basados en análisis del mercado de inspecciones vehiculares en Argentina. Los valores reales pueden variar.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* ═══════════════ SECTION 3 — INSPECCIÓN REMOTA ═══════════════ */}
            <section className="py-24 md:py-32 px-6" style={{ background: "var(--bg-section)" }}>
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Text */}
                        <div>
                            <Reveal>
                                <h2
                                    className="heading-font text-3xl md:text-5xl font-bold mb-12"
                                    style={{ color: "var(--text-heading)" }}
                                >
                                    Inspección remota en minutos, no en días.
                                </h2>
                            </Reveal>

                            {[
                                "El asegurado recibe un link por WhatsApp.",
                                "Abre la cámara. Sin descargar nada.",
                                "El sistema lo guía foto por foto.",
                                "Las fotos llegan al perito en tiempo real.",
                                "El caso avanza solo.",
                            ].map((line, i) => (
                                <Reveal key={i} delay={0.15 * (i + 1)}>
                                    <p
                                        className="text-xl md:text-2xl font-medium mb-6"
                                        style={{ color: "var(--text-heading)" }}
                                    >
                                        {line}
                                    </p>
                                </Reveal>
                            ))}
                        </div>

                        {/* Phone mockup */}
                        <Reveal delay={0.3} className="hidden lg:flex justify-center">
                            <motion.div style={{ y: parallaxY }}>
                                <div className="phone-mockup animate-float">
                                    <div className="phone-notch" />
                                    <div className="flex flex-col h-full pt-10 px-5 pb-5">
                                        {/* Simulated IP screen */}
                                        <div className="flex-1 flex flex-col gap-4 pt-6">
                                            <div
                                                className="rounded-xl p-4"
                                                style={{ background: "rgba(214,0,110,0.1)", border: "1px solid rgba(214,0,110,0.2)" }}
                                            >
                                                <p style={{ color: "#D6006E", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Inspección Remota
                                                </p>
                                                <p style={{ color: "#F5F0F7", fontSize: "13px", marginTop: "6px", fontWeight: 500 }}>
                                                    Siniestro #827-401
                                                </p>
                                                <p style={{ color: "#9B8FA6", fontSize: "11px", marginTop: "2px" }}>
                                                    Toyota Corolla 2022
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {["Frente", "Lat. Izq.", "Lat. Der.", "Trasera"].map((label, i) => (
                                                    <div
                                                        key={label}
                                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                                                        style={{
                                                            background: i < 2 ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                                                            border: `1px solid ${i < 2 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                                                        }}
                                                    >
                                                        <Camera size={14} style={{ color: i < 2 ? "#22C55E" : "#5C5670" }} />
                                                        <span style={{ color: "#F5F0F7", fontSize: "12px" }}>{label}</span>
                                                        {i < 2 && <Check size={12} style={{ color: "#22C55E", marginLeft: "auto" }} />}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-auto">
                                                <div
                                                    className="w-full py-3 rounded-xl text-center font-semibold text-sm"
                                                    style={{ background: "#D6006E", color: "white" }}
                                                >
                                                    Tomar siguiente foto
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Reveal>
                    </div>

                    {/* Impact counter */}
                    <Reveal delay={0.4}>
                        <div className="text-center mt-16">
                            <p className="heading-font text-4xl md:text-5xl font-bold" style={{ color: "var(--accent)" }}>
                                <AnimatedCounter value={LANDING_DATA.remota.counter.valor} />
                            </p>
                            <p className="mt-2" style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                                {LANDING_DATA.remota.counter.texto}
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══════════════ SECTION 4 — INSPECCIÓN PRESENCIAL ═══════════════ */}
            <section className="section-gradient-bottom py-24 md:py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Signature mockup */}
                        <Reveal delay={0.2} className="hidden lg:flex justify-center order-2 lg:order-1">
                            <motion.div style={{ y: parallaxY }}>
                                <div className="animate-float" style={{ animationDelay: "1s" }}>
                                    <div
                                        className="relative rounded-2xl overflow-hidden"
                                        style={{
                                            width: 340,
                                            background: "#FAFAFA",
                                            border: "1px solid #E5E5E5",
                                            boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 40px var(--accent-glow)",
                                        }}
                                    >
                                        {/* GPS Badge */}
                                        <motion.div
                                            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full"
                                            style={{ background: "rgba(34,197,94,0.15)", fontSize: "10px", color: "#16A34A" }}
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <MapPin size={10} /> GPS verificado
                                        </motion.div>

                                        <div className="p-5 pt-10">
                                            <p style={{ color: "#1A1520", fontSize: "14px", fontWeight: 700 }}>Resumen del Acuerdo</p>
                                            <div className="mt-3 space-y-2" style={{ fontSize: "11px", color: "#6B5F78" }}>
                                                <p><strong>Siniestro:</strong> #827-401</p>
                                                <p><strong>Taller:</strong> AutoFix Quilmes</p>
                                                <p><strong>Mano de obra:</strong> $285.000</p>
                                                <p><strong>Repuestos:</strong> $412.000</p>
                                                <div className="border-t pt-2 mt-2" style={{ borderColor: "#E5E5E5" }}>
                                                    <p style={{ fontWeight: 700, color: "#1A1520" }}><strong>Total:</strong> $697.000</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Signature area */}
                                        <div className="px-5 pb-5">
                                            <p style={{ color: "#9B8FA6", fontSize: "10px", marginBottom: "6px" }}>Firma del taller:</p>
                                            <div
                                                className="rounded-lg relative"
                                                style={{ height: 80, background: "#F5F3F0", border: "1px dashed #D1D0CE" }}
                                            >
                                                <svg viewBox="0 0 200 60" className="absolute inset-0 w-full h-full p-2">
                                                    <path
                                                        d="M20 40 C30 15, 45 55, 60 35 C75 15, 85 50, 100 30 C115 10, 130 45, 150 25 C165 10, 180 35, 190 30"
                                                        stroke="#1A1520"
                                                        strokeWidth="1.5"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </div>
                                            <p style={{ color: "#9B8FA6", fontSize: "9px", marginTop: "4px" }}>
                                                18/03/2026 15:42 · -34.7265, -58.2617
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Reveal>

                        {/* Text */}
                        <div className="order-1 lg:order-2">
                            <Reveal>
                                <h2
                                    className="heading-font text-3xl md:text-5xl font-bold mb-10"
                                    style={{ color: "var(--text-heading)" }}
                                >
                                    Cada acuerdo, documentado e irrefutable.
                                </h2>
                            </Reveal>

                            {[
                                "Informe técnico detallado desde el celular del perito",
                                "Valores de mano de obra acordados y registrados",
                                "Firma digital del taller sobre el resumen",
                                "Geolocalización y timestamp de cada firma",
                                "Cero disputas. Cero \"yo no acordé eso.\"",
                            ].map((item, i) => (
                                <Reveal key={i} delay={0.15 * (i + 1)}>
                                    <div className="flex items-start gap-3 mb-5">
                                        <motion.div
                                            className="check-animated"
                                            style={{ animationDelay: `${0.3 + i * 0.2}s` }}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                                style={{ background: "rgba(34,197,94,0.15)" }}
                                            >
                                                <Check size={14} style={{ color: "#22C55E" }} />
                                            </div>
                                        </motion.div>
                                        <p className="text-base md:text-lg" style={{ color: "var(--text-heading)" }}>
                                            {item}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}

                            <Reveal delay={0.8}>
                                <div className="mt-8">
                                    <p className="heading-font text-3xl font-bold" style={{ color: "var(--accent)" }}>
                                        <AnimatedCounter value={LANDING_DATA.presencial.counter.valor} />
                                    </p>
                                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                                        {LANDING_DATA.presencial.counter.texto}
                                    </p>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ SECTION 5 — VISIBILIDAD TOTAL ═══════════════ */}
            <section className="py-24 md:py-32 px-6" style={{ background: "var(--bg-section)" }}>
                <div className="max-w-6xl mx-auto">
                    <Reveal>
                        <h2
                            className="heading-font text-3xl md:text-5xl font-bold text-center mb-4"
                            style={{ color: "var(--text-heading)" }}
                        >
                            Los gestores no necesitan llamar. Lo ven todo.
                        </h2>
                    </Reveal>
                    <Reveal delay={0.15}>
                        <p className="text-center text-base md:text-lg max-w-2xl mx-auto mb-16" style={{ color: "var(--text-body)" }}>
                            Cada cambio de estado dispara una notificación automática. Cada caso tiene su link de seguimiento en tiempo real.
                        </p>
                    </Reveal>

                    {/* Browser mockup */}
                    <Reveal delay={0.3}>
                        <div className="browser-mockup max-w-4xl mx-auto">
                            <div className="browser-bar">
                                <div className="browser-dot" style={{ background: "#FF5F57" }} />
                                <div className="browser-dot" style={{ background: "#FFBD2E" }} />
                                <div className="browser-dot" style={{ background: "#28C840" }} />
                                <div
                                    className="flex-1 ml-4 rounded-md px-3 py-1 text-xs"
                                    style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}
                                >
                                    clarity.app/dashboard
                                </div>
                            </div>

                            {/* Dashboard content */}
                            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { estado: "IP Coordinada", color: "#3B82F6", count: 12 },
                                    { estado: "Pendiente Carga", color: "#F59E0B", count: 8 },
                                    { estado: "Licitando", color: "#8B5CF6", count: 5 },
                                    { estado: "Cerrada", color: "#22C55E", count: 23 },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.estado}
                                        className="rounded-xl p-4"
                                        style={{
                                            background: `${item.color}10`,
                                            border: `1px solid ${item.color}30`,
                                        }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        <p style={{ color: item.color, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            {item.estado}
                                        </p>
                                        <p className="heading-font text-3xl font-bold mt-1" style={{ color: "var(--text-heading)" }}>
                                            {item.count}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </Reveal>

                    {/* Mini features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                        {[
                            { icon: Mail, text: "Emails automáticos a gestores en cada hito" },
                            { icon: Link2, text: "Link de seguimiento por siniestro" },
                            { icon: Timer, text: "Alertas de SLA cuando un caso se demora" },
                        ].map((item, i) => (
                            <Reveal key={i} delay={0.15 * (i + 1)}>
                                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--bg-card)" }}>
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: "var(--accent-glow)" }}
                                    >
                                        <item.icon size={18} style={{ color: "var(--accent)" }} />
                                    </div>
                                    <p className="text-sm" style={{ color: "var(--text-heading)" }}>{item.text}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ SECTION 6 — COBERTURA NACIONAL ═══════════════ */}
            <section className="section-gradient-top py-24 md:py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <Reveal>
                                <h2
                                    className="heading-font text-3xl md:text-5xl font-bold mb-6"
                                    style={{ color: "var(--text-heading)" }}
                                >
                                    Un estudio en Buenos Aires.{" "}
                                    <span className="gradient-text">Cobertura en todo el país.</span>
                                </h2>
                            </Reveal>
                            <Reveal delay={0.2}>
                                <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--text-body)" }}>
                                    Con la inspección remota, no necesitamos peritos locales ni viáticos. Un asegurado en Ushuaia puede completar su inspección desde el celular en minutos.
                                </p>
                            </Reveal>
                        </div>

                        <Reveal delay={0.3} className="map-container">
                            <ArgentinaMap />
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ═══════════════ SECTION 7 — MÉTRICAS ═══════════════ */}
            <section
                className="py-24 md:py-32 px-6 relative overflow-hidden"
                style={{
                    background: isDark
                        ? "linear-gradient(135deg, rgba(214,0,110,0.06) 0%, #0A0A10 50%, rgba(245,158,11,0.04) 100%)"
                        : "linear-gradient(135deg, rgba(214,0,110,0.04) 0%, #FFFFFF 50%, rgba(245,158,11,0.03) 100%)",
                }}
            >
                <div className="max-w-6xl mx-auto relative z-10">
                    <Reveal>
                        <h2
                            className="heading-font text-3xl md:text-5xl font-bold text-center mb-16"
                            style={{ color: "var(--text-heading)" }}
                        >
                            Los números hablan.
                        </h2>
                    </Reveal>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { label: "Casos gestionados", ...LANDING_DATA.metricas.casos },
                            { label: "Tiempo promedio", ...LANDING_DATA.metricas.tiempo, decimals: 1 },
                            { label: "Fotos procesadas", ...LANDING_DATA.metricas.fotos },
                            { label: "Satisfacción gestores", ...LANDING_DATA.metricas.satisfaccion },
                        ].map((item, i) => (
                            <Reveal key={i} delay={0.15 * (i + 1)}>
                                <div className="text-center">
                                    <p
                                        className="heading-font text-4xl md:text-5xl lg:text-6xl font-bold glow-magenta"
                                        style={{ color: "var(--accent)" }}
                                    >
                                        <AnimatedCounter
                                            value={item.valor}
                                            suffix={item.sufijo}
                                            decimals={(item as any).decimals || 0}
                                        />
                                    </p>
                                    <p className="heading-font text-sm md:text-base font-semibold mt-2" style={{ color: "var(--text-heading)" }}>
                                        {item.label}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                        {item.subtitulo}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ SECTION 8 — CIERRE ═══════════════ */}
            <section className="py-24 md:py-40 px-6" style={{ background: "var(--bg-landing)" }}>
                <div className="max-w-3xl mx-auto text-center">
                    <Reveal>
                        <h2
                            className="heading-font text-3xl md:text-5xl lg:text-6xl font-bold mb-6"
                            style={{ color: "var(--text-heading)" }}
                        >
                            El futuro de la inspección,{" "}
                            <span className="gradient-text">hoy.</span>
                        </h2>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <p className="text-base md:text-lg mb-12 max-w-xl mx-auto" style={{ color: "var(--text-body)" }}>
                            CLARITY no es un proyecto. Es un sistema en producción, operativo, con resultados medibles.
                        </p>
                    </Reveal>

                    <Reveal delay={0.4}>
                        <div className="mb-12">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={isDark ? "/logo-al-servicio-de-SS.png" : "/logo-al-servicio-de-SS-negro.png"}
                                alt="Al servicio de Sancor Seguros"
                                className="h-12 md:h-16 mx-auto"
                                style={{ opacity: isDark ? 0.8 : 0.9 }}
                            />
                        </div>
                    </Reveal>

                    <Reveal delay={0.6}>
                        <div
                            className="inline-block rounded-2xl px-10 py-8"
                            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <p className="heading-font text-lg font-bold" style={{ color: "var(--text-heading)" }}>
                                {LANDING_DATA.contacto.estudio}
                            </p>
                            <p className="mt-2" style={{ color: "var(--text-body)", fontSize: "15px" }}>
                                {LANDING_DATA.contacto.nombre} — {LANDING_DATA.contacto.rol}
                            </p>
                            <a
                                href={`mailto:${LANDING_DATA.contacto.email}`}
                                className="inline-block mt-3 text-sm font-medium"
                                style={{ color: "var(--accent)" }}
                            >
                                {LANDING_DATA.contacto.email}
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}
