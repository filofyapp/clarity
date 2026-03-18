"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
    AnimatePresence,
} from "framer-motion";
import {
    ChevronDown, Clock, PhoneCall, AlertTriangle, Check,
    Camera, MapPin, Mail, Link2, Timer, Shield, ArrowRight,
} from "lucide-react";
import { ParticlesBackground } from "./ParticlesBackground";
import { ArgentinaMap } from "./ArgentinaMap";

// ═══════════════════════════════════════════════
// CONFIGURACIÓN DE DATOS — Editar números y textos aquí
// ═══════════════════════════════════════════════
const LANDING_DATA = {
    hero: {
        words: ["De", "7", "días", "a", "7", "minutos."],
        subtitle: "El sistema de inspección vehicular que está transformando la gestión de siniestros en Argentina.",
    },
    painPoints: [
        {
            icon: Clock,
            value: 1.2, suffix: " días", decimals: 1,
            label: "Tiempo promedio de resolución con CLARITY",
            highlight: "vs. 7+ días del mercado",
        },
        {
            icon: PhoneCall,
            value: 68, suffix: "%",
            label: "Reducción de llamadas de gestores consultando estados",
            highlight: "100% trazabilidad en tiempo real",
        },
        {
            icon: AlertTriangle,
            value: 45.5, suffix: "M", prefix: "$", decimals: 1,
            label: "Ahorro estimado en disputas documentadas",
            highlight: "Firma digital con geolocalización",
        },
    ],
    steps: [
        { title: "El asegurado recibe un link por WhatsApp", desc: "Sin apps, sin descargas. Un link que abre la cámara del celular." },
        { title: "El sistema guía la captura foto por foto", desc: "Indicaciones claras: frente, lateral, trasera, daños. Impossible equivocarse." },
        { title: "Las fotos llegan al perito en tiempo real", desc: "El perito las ve mientras se suben. No hay que esperar." },
        { title: "El caso avanza automáticamente", desc: "Cambio de estado, notificación al gestor, link de seguimiento. Todo solo." },
    ],
    metricas: [
        { value: 1250, suffix: "+", label: "Casos gestionados", sub: "en los últimos 6 meses" },
        { value: 1.2, suffix: " días", label: "Tiempo promedio", sub: "vs. 7+ del mercado", decimals: 1 },
        { value: 18400, suffix: "+", label: "Fotos procesadas", sub: "con control de calidad" },
        { value: 97, suffix: "%", label: "Satisfacción", sub: "encuestas internas" },
    ],
    acuerdo: {
        siniestro: "#827-401",
        taller: "AutoFix Quilmes",
        manoObra: "$285.000",
        repuestos: "$412.000",
        total: "$697.000",
    },
    contacto: {
        nombre: "Nicolás Cordova",
        rol: "Coordinador",
        email: "gestionsancoraomsiniestros@gmail.com",
        estudio: "Estudio AOM Siniestros",
    },
};

// ═══════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════
function Counter({
    value, suffix = "", prefix = "", decimals = 0, duration = 1800,
}: {
    value: number; suffix?: string; prefix?: string; decimals?: number; duration?: number;
}) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !started) {
                    setStarted(true);
                    const t0 = performance.now();
                    const tick = (now: number) => {
                        const p = Math.min((now - t0) / duration, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        setCount(eased * value);
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [value, duration, started]);

    const display = decimals > 0
        ? count.toFixed(decimals)
        : Math.round(count).toLocaleString("es-AR");

    return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// ═══════════════════════════════════════════════
// FADE-UP WRAPPER
// ═══════════════════════════════════════════════
function FadeUp({
    children, delay = 0, className = "", y = 40,
}: {
    children: React.ReactNode; delay?: number; className?: string; y?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay }}
            viewport={{ once: true, margin: "-80px" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════
// REACTIVE BLOB (Spring Physics Cursor Follower)
// ═══════════════════════════════════════════════
function ReactiveBlob() {
    const mouseX = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 500);
    const mouseY = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 400);
    const [isMobile, setIsMobile] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const springX = useSpring(mouseX, { damping: 25, stiffness: 120, mass: 0.5 });
    const springY = useSpring(mouseY, { damping: 25, stiffness: 120, mass: 0.5 });

    useEffect(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);

        if (mobile) {
            // Autonomous drift for mobile
            mouseX.set(window.innerWidth / 2);
            mouseY.set(window.innerHeight / 3);
            return;
        }

        const onMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        // Detect hover on interactive elements
        const onOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest("[data-blob-expand]") || target.closest("button") || target.closest("h1") || target.closest("h2")) {
                setIsHovering(true);
            }
        };
        const onOut = () => setIsHovering(false);

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseover", onOver);
        window.addEventListener("mouseout", onOut);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseover", onOver);
            window.removeEventListener("mouseout", onOut);
        };
    }, [mouseX, mouseY]);

    return (
        <motion.div
            className={`reactive-blob ${isMobile ? "animate-blob-drift" : ""} ${isHovering ? "expanded" : ""}`}
            style={{
                left: springX,
                top: springY,
            }}
        />
    );
}

// ═══════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════
export function LandingPage() {
    const { scrollYProgress } = useScroll();
    const parallaxSlow = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const parallaxFast = useTransform(scrollYProgress, [0, 1], [0, -40]);

    return (
        <div className="landing-root relative min-h-screen">
            {/* Reactive cursor blob */}
            <ReactiveBlob />

            {/* Content (z-index above blob) */}
            <div className="relative z-10">

                {/* ═══════════ HERO — Full viewport ═══════════ */}
                <section className="relative flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden">
                    {/* Particles background */}
                    <div className="absolute inset-0 z-0">
                        <ParticlesBackground isDark={true} />
                    </div>

                    {/* Radial gradient overlay */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(214,0,110,0.05) 0%, transparent 60%)",
                        }}
                    />

                    <div className="relative z-10 text-center max-w-5xl mx-auto">
                        {/* CLARITY wordmark */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="heading-font tracking-[0.35em] text-sm md:text-base mb-14"
                            style={{ color: "var(--text-muted)", fontWeight: 700 }}
                        >
                            C L A R I T Y
                        </motion.p>

                        {/* Word-by-word tagline */}
                        <h1 className="heading-font text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-none mb-10" data-blob-expand>
                            {LANDING_DATA.hero.words.map((word, i) => (
                                <motion.span
                                    key={i}
                                    className={`hero-word mr-3 md:mr-5 ${
                                        word === "7" ? "gradient-text-accent" : ""
                                    }`}
                                    style={{ color: word !== "7" ? "var(--text-white)" : undefined }}
                                    initial={{ opacity: 0, y: 50, filter: "blur(8px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.5 + i * 0.12,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.4 }}
                            className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10"
                            style={{ color: "var(--text-gray)" }}
                        >
                            {LANDING_DATA.hero.subtitle}
                        </motion.p>

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 1.7 }}
                        >
                            <span className="pill-badge">
                                <Shield size={14} /> Al servicio de Sancor Seguros
                            </span>
                        </motion.div>
                    </div>

                    {/* Scroll arrow */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2 }}
                        className="absolute bottom-10 scroll-arrow"
                    >
                        <ChevronDown size={24} style={{ color: "var(--text-muted)" }} />
                    </motion.div>
                </section>

                {/* Divider */}
                <div className="section-divider" />

                {/* ═══════════ EL PROBLEMA — Pain Points ═══════════ */}
                <section className="py-28 md:py-36 px-6" style={{ background: "var(--bg-section)" }}>
                    <div className="max-w-6xl mx-auto">
                        <FadeUp>
                            <p className="text-center text-sm tracking-widest uppercase mb-4" style={{ color: "var(--accent)" }}>
                                El problema
                            </p>
                        </FadeUp>
                        <FadeUp delay={0.1}>
                            <h2
                                className="heading-font text-3xl md:text-5xl lg:text-6xl font-bold text-center mb-20"
                                style={{ color: "var(--text-white)" }}
                                data-blob-expand
                            >
                                ¿Cuánto le cuestan las demoras?
                            </h2>
                        </FadeUp>

                        {/* Staggered cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {LANDING_DATA.painPoints.map((item, i) => (
                                <FadeUp key={i} delay={0.15 + i * 0.15}>
                                    <div className="glass-card p-8 text-center h-full">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-8"
                                            style={{ background: "var(--accent-glow)" }}
                                        >
                                            <item.icon size={26} style={{ color: "var(--accent)" }} />
                                        </div>
                                        <p
                                            className="heading-font text-5xl md:text-6xl font-extrabold mb-4"
                                            style={{ color: "var(--text-white)" }}
                                        >
                                            <Counter
                                                value={item.value}
                                                suffix={item.suffix}
                                                prefix={item.prefix || ""}
                                                decimals={item.decimals || 0}
                                            />
                                        </p>
                                        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-gray)" }}>
                                            {item.label}
                                        </p>
                                        <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                                            {item.highlight}
                                        </p>
                                    </div>
                                </FadeUp>
                            ))}
                        </div>

                        <FadeUp delay={0.6}>
                            <p className="text-center mt-12 text-xs" style={{ color: "var(--text-muted)" }}>
                                * Datos estimados basados en análisis del mercado de inspecciones vehiculares en Argentina.
                            </p>
                        </FadeUp>
                    </div>
                </section>

                <div className="section-divider" />

                {/* ═══════════ INSPECCIÓN REMOTA — Step Flow ═══════════ */}
                <section className="py-28 md:py-36 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                            {/* Steps */}
                            <div>
                                <FadeUp>
                                    <p className="text-sm tracking-widest uppercase mb-4" style={{ color: "var(--accent)" }}>
                                        La solución
                                    </p>
                                </FadeUp>
                                <FadeUp delay={0.1}>
                                    <h2
                                        className="heading-font text-3xl md:text-5xl font-bold mb-14"
                                        style={{ color: "var(--text-white)" }}
                                        data-blob-expand
                                    >
                                        Inspección remota en minutos.
                                    </h2>
                                </FadeUp>

                                <div className="space-y-8 relative">
                                    {LANDING_DATA.steps.map((step, i) => (
                                        <FadeUp key={i} delay={0.2 + i * 0.12}>
                                            <motion.div
                                                className="flex gap-5 group"
                                                whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }}
                                            >
                                                <div className="flex flex-col items-center pt-1">
                                                    <motion.div
                                                        className="step-dot"
                                                        whileInView={{ borderColor: "#D6006E", background: "#D6006E", boxShadow: "0 0 20px rgba(214,0,110,0.4)" }}
                                                        transition={{ delay: 0.3 + i * 0.15 }}
                                                        viewport={{ once: true }}
                                                    />
                                                    {i < LANDING_DATA.steps.length - 1 && (
                                                        <div className="w-px h-full mt-2" style={{ background: "rgba(214,0,110,0.15)" }} />
                                                    )}
                                                </div>
                                                <div className="pb-2">
                                                    <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-white)" }}>
                                                        {step.title}
                                                    </p>
                                                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-gray)" }}>
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </FadeUp>
                                    ))}
                                </div>
                            </div>

                            {/* Phone mockup */}
                            <FadeUp delay={0.3} className="hidden lg:flex justify-center">
                                <motion.div style={{ y: parallaxFast }}>
                                    <div className="phone-frame animate-float-gentle">
                                        <div className="phone-notch" />
                                        <div className="flex flex-col h-full pt-10 px-4 pb-4">
                                            <div className="flex-1 flex flex-col gap-3 pt-4">
                                                {/* IP Screen */}
                                                <div className="glass-card p-4" style={{ borderRadius: "14px" }}>
                                                    <p style={{ color: "#D6006E", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                                        Inspección Remota
                                                    </p>
                                                    <p style={{ color: "#FFF", fontSize: "13px", marginTop: "6px", fontWeight: 600 }}>
                                                        Siniestro #827-401
                                                    </p>
                                                    <p style={{ color: "#A1A1AA", fontSize: "11px", marginTop: "2px" }}>
                                                        Toyota Corolla 2022 · ABC 123
                                                    </p>
                                                </div>

                                                {["Frente", "Lat. Izquierdo", "Lat. Derecho", "Trasera", "Daño 1"].map((label, i) => (
                                                    <div
                                                        key={label}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                                                        style={{
                                                            background: i < 3 ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                                                            border: `1px solid ${i < 3 ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
                                                        }}
                                                    >
                                                        <Camera size={13} style={{ color: i < 3 ? "#22C55E" : "#52525B" }} />
                                                        <span style={{ color: "#FFF", fontSize: "11px" }}>{label}</span>
                                                        {i < 3 && <Check size={11} style={{ color: "#22C55E", marginLeft: "auto" }} />}
                                                    </div>
                                                ))}

                                                <div className="mt-auto">
                                                    <div
                                                        className="w-full py-3 rounded-xl text-center font-semibold text-xs flex items-center justify-center gap-2"
                                                        style={{ background: "#D6006E", color: "white" }}
                                                    >
                                                        <Camera size={14} /> Tomar siguiente foto
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </FadeUp>
                        </div>

                        {/* Impact stat */}
                        <FadeUp delay={0.5}>
                            <div className="text-center mt-20 pt-16" style={{ borderTop: "1px solid var(--border-glass)" }}>
                                <p className="heading-font text-5xl md:text-6xl font-extrabold" style={{ color: "var(--text-white)" }}>
                                    <Counter value={847} />
                                </p>
                                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                                    inspecciones remotas completadas
                                </p>
                            </div>
                        </FadeUp>
                    </div>
                </section>

                <div className="section-divider" />

                {/* ═══════════ FIRMA DIGITAL ═══════════ */}
                <section className="py-28 md:py-36 px-6" style={{ background: "var(--bg-section)" }}>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                            {/* Signature mockup */}
                            <FadeUp delay={0.2} className="hidden lg:flex justify-center order-2 lg:order-1">
                                <motion.div style={{ y: parallaxSlow }}>
                                    <div className="animate-float-gentle" style={{ animationDelay: "1.5s" }}>
                                        <div className="glass-card p-0 overflow-hidden" style={{ width: 340, borderRadius: "20px" }}>
                                            {/* GPS badge */}
                                            <div className="flex items-center justify-end gap-1 px-4 pt-4">
                                                <motion.div
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]"
                                                    style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
                                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <MapPin size={9} /> GPS verificado
                                                </motion.div>
                                            </div>

                                            <div className="p-6 pt-3">
                                                <p className="text-white text-sm font-bold mb-4">Resumen del Acuerdo</p>
                                                <div className="space-y-2 text-xs" style={{ color: "var(--text-gray)" }}>
                                                    <div className="flex justify-between">
                                                        <span>Siniestro</span>
                                                        <span className="text-white font-medium">{LANDING_DATA.acuerdo.siniestro}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Taller</span>
                                                        <span className="text-white font-medium">{LANDING_DATA.acuerdo.taller}</span>
                                                    </div>
                                                    <div className="h-px my-3" style={{ background: "var(--border-glass)" }} />
                                                    <div className="flex justify-between">
                                                        <span>Mano de obra</span>
                                                        <span className="text-white">{LANDING_DATA.acuerdo.manoObra}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Repuestos</span>
                                                        <span className="text-white">{LANDING_DATA.acuerdo.repuestos}</span>
                                                    </div>
                                                    <div className="h-px my-3" style={{ background: "var(--border-glass)" }} />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-bold text-white">Total</span>
                                                        <span className="font-bold text-white">{LANDING_DATA.acuerdo.total}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Signature */}
                                            <div className="px-6 pb-6">
                                                <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>Firma del taller:</p>
                                                <div
                                                    className="rounded-xl relative overflow-hidden"
                                                    style={{ height: 70, background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
                                                >
                                                    <svg viewBox="0 0 200 50" className="absolute inset-0 w-full h-full p-2">
                                                        <motion.path
                                                            d="M15 35 C25 12, 40 48, 55 30 C70 12, 80 45, 95 25 C110 8, 125 40, 145 20 C160 8, 175 30, 185 25"
                                                            stroke="white"
                                                            strokeWidth="1.2"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            initial={{ pathLength: 0 }}
                                                            whileInView={{ pathLength: 1 }}
                                                            transition={{ duration: 1.5, delay: 0.5 }}
                                                            viewport={{ once: true }}
                                                        />
                                                    </svg>
                                                </div>
                                                <p className="text-[9px] mt-2" style={{ color: "var(--text-muted)" }}>
                                                    18/03/2026 15:42 · -34.7265, -58.2617
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </FadeUp>

                            {/* Text */}
                            <div className="order-1 lg:order-2">
                                <FadeUp>
                                    <p className="text-sm tracking-widest uppercase mb-4" style={{ color: "var(--accent)" }}>
                                        Inspección presencial
                                    </p>
                                </FadeUp>
                                <FadeUp delay={0.1}>
                                    <h2
                                        className="heading-font text-3xl md:text-5xl font-bold mb-12"
                                        style={{ color: "var(--text-white)" }}
                                        data-blob-expand
                                    >
                                        Cada acuerdo, documentado e irrefutable.
                                    </h2>
                                </FadeUp>

                                {[
                                    "Informe técnico detallado desde el celular del perito",
                                    "Valores de mano de obra acordados y registrados",
                                    "Firma digital del taller sobre el resumen",
                                    "Geolocalización y timestamp de cada firma",
                                    'Cero disputas. Cero "yo no acordé eso."',
                                ].map((item, i) => (
                                    <FadeUp key={i} delay={0.15 + i * 0.1}>
                                        <div className="flex items-start gap-4 mb-5">
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
                                            >
                                                <Check size={12} style={{ color: "#22C55E" }} />
                                            </div>
                                            <p className="text-base" style={{ color: "var(--text-gray)" }}>
                                                {item}
                                            </p>
                                        </div>
                                    </FadeUp>
                                ))}

                                <FadeUp delay={0.7}>
                                    <div className="glass-card p-5 mt-8 inline-block" style={{ borderRadius: "14px" }}>
                                        <p className="heading-font text-3xl font-extrabold" style={{ color: "var(--text-white)" }}>
                                            <Counter value={0} /> <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>disputas</span>
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                            en los últimos 90 días
                                        </p>
                                    </div>
                                </FadeUp>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="section-divider" />

                {/* ═══════════ VISIBILIDAD ═══════════ */}
                <section className="py-28 md:py-36 px-6">
                    <div className="max-w-6xl mx-auto">
                        <FadeUp>
                            <p className="text-center text-sm tracking-widest uppercase mb-4" style={{ color: "var(--accent)" }}>
                                Visibilidad total
                            </p>
                        </FadeUp>
                        <FadeUp delay={0.1}>
                            <h2
                                className="heading-font text-3xl md:text-5xl font-bold text-center mb-4"
                                style={{ color: "var(--text-white)" }}
                                data-blob-expand
                            >
                                Los gestores no necesitan llamar.
                            </h2>
                        </FadeUp>
                        <FadeUp delay={0.15}>
                            <p className="text-center text-base max-w-xl mx-auto mb-16" style={{ color: "var(--text-gray)" }}>
                                Cada cambio de estado dispara una notificación automática. Cada caso tiene su link de seguimiento en tiempo real.
                            </p>
                        </FadeUp>

                        {/* Dashboard mockup */}
                        <FadeUp delay={0.3}>
                            <div className="glass-card max-w-4xl mx-auto overflow-hidden" style={{ borderRadius: "16px" }}>
                                {/* Browser bar */}
                                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
                                    <div className="flex-1 ml-3 rounded-md px-3 py-1 text-[11px]" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}>
                                        panel.aomsiniestros.com/dashboard
                                    </div>
                                </div>

                                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { estado: "IP Coordinada", color: "#3B82F6", n: 12 },
                                        { estado: "Pendiente Carga", color: "#F59E0B", n: 8 },
                                        { estado: "Licitando", color: "#8B5CF6", n: 5 },
                                        { estado: "Cerrada", color: "#22C55E", n: 23 },
                                    ].map((s, i) => (
                                        <motion.div
                                            key={s.estado}
                                            className="rounded-xl p-4"
                                            style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                                            viewport={{ once: true }}
                                        >
                                            <p style={{ color: s.color, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                {s.estado}
                                            </p>
                                            <p className="heading-font text-2xl font-bold mt-1" style={{ color: "var(--text-white)" }}>
                                                {s.n}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </FadeUp>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 max-w-4xl mx-auto">
                            {[
                                { icon: Mail, text: "Emails automáticos a gestores en cada hito" },
                                { icon: Link2, text: "Link de seguimiento único por siniestro" },
                                { icon: Timer, text: "Alertas de SLA cuando un caso se demora" },
                            ].map((f, i) => (
                                <FadeUp key={i} delay={0.1 + i * 0.1}>
                                    <div className="glass-card px-5 py-4 flex items-center gap-4" style={{ borderRadius: "14px" }}>
                                        <f.icon size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                                        <p className="text-sm" style={{ color: "var(--text-gray)" }}>{f.text}</p>
                                    </div>
                                </FadeUp>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="section-divider" />

                {/* ═══════════ COBERTURA NACIONAL ═══════════ */}
                <section className="py-28 md:py-36 px-6" style={{ background: "var(--bg-section)" }}>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <FadeUp>
                                    <p className="text-sm tracking-widest uppercase mb-4" style={{ color: "var(--accent)" }}>
                                        Alcance
                                    </p>
                                </FadeUp>
                                <FadeUp delay={0.1}>
                                    <h2 className="heading-font text-3xl md:text-5xl font-bold mb-6" style={{ color: "var(--text-white)" }} data-blob-expand>
                                        Un estudio en Buenos Aires.{" "}
                                        <span className="gradient-text-hero">Cobertura en todo el país.</span>
                                    </h2>
                                </FadeUp>
                                <FadeUp delay={0.2}>
                                    <p className="text-base leading-relaxed" style={{ color: "var(--text-gray)" }}>
                                        Con la inspección remota, no necesitamos peritos locales ni viáticos. Un asegurado en Ushuaia puede completar su inspección desde el celular en minutos.
                                    </p>
                                </FadeUp>
                            </div>
                            <FadeUp delay={0.3}>
                                <ArgentinaMap />
                            </FadeUp>
                        </div>
                    </div>
                </section>

                <div className="section-divider" />

                {/* ═══════════ MÉTRICAS ═══════════ */}
                <section
                    className="py-28 md:py-36 px-6 relative"
                    style={{
                        background: "linear-gradient(135deg, rgba(214,0,110,0.03) 0%, var(--bg-abyss) 50%, rgba(245,158,11,0.02) 100%)",
                    }}
                >
                    <div className="max-w-5xl mx-auto">
                        <FadeUp>
                            <p className="text-center text-sm tracking-widest uppercase mb-4" style={{ color: "var(--accent)" }}>
                                Resultados
                            </p>
                        </FadeUp>
                        <FadeUp delay={0.1}>
                            <h2 className="heading-font text-3xl md:text-5xl font-bold text-center mb-20" style={{ color: "var(--text-white)" }} data-blob-expand>
                                Los números hablan.
                            </h2>
                        </FadeUp>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                            {LANDING_DATA.metricas.map((m, i) => (
                                <FadeUp key={i} delay={0.15 + i * 0.1}>
                                    <div className="text-center">
                                        <p className="heading-font text-4xl md:text-5xl lg:text-6xl font-extrabold" style={{ color: "var(--text-white)" }}>
                                            <Counter value={m.value} suffix={m.suffix} decimals={m.decimals || 0} />
                                        </p>
                                        <p className="heading-font text-sm font-semibold mt-3" style={{ color: "var(--text-gray)" }}>
                                            {m.label}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                            {m.sub}
                                        </p>
                                    </div>
                                </FadeUp>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="section-divider" />

                {/* ═══════════ FOOTER — Cierre ═══════════ */}
                <footer className="py-28 md:py-36 px-6" style={{ background: "var(--bg-section)" }}>
                    <div className="max-w-3xl mx-auto text-center">
                        <FadeUp>
                            <h2 className="heading-font text-3xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: "var(--text-white)" }} data-blob-expand>
                                El futuro de la inspección,{" "}
                                <span className="gradient-text-hero">hoy.</span>
                            </h2>
                        </FadeUp>

                        <FadeUp delay={0.15}>
                            <p className="text-base mb-14 max-w-md mx-auto" style={{ color: "var(--text-gray)" }}>
                                CLARITY no es un proyecto. Es un sistema en producción, operativo, con resultados medibles.
                            </p>
                        </FadeUp>

                        <FadeUp delay={0.3}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo-al-servicio-de-SS.png"
                                alt="Al servicio de Sancor Seguros"
                                className="h-10 md:h-14 mx-auto mb-14"
                                style={{ opacity: 0.7 }}
                            />
                        </FadeUp>

                        <FadeUp delay={0.4}>
                            <div className="glass-card inline-block px-10 py-8" style={{ borderRadius: "16px" }}>
                                <p className="heading-font text-lg font-bold" style={{ color: "var(--text-white)" }}>
                                    {LANDING_DATA.contacto.estudio}
                                </p>
                                <p className="mt-2 text-sm" style={{ color: "var(--text-gray)" }}>
                                    {LANDING_DATA.contacto.nombre} — {LANDING_DATA.contacto.rol}
                                </p>
                                <a
                                    href={`mailto:${LANDING_DATA.contacto.email}`}
                                    className="footer-link inline-block mt-3 text-sm font-medium"
                                >
                                    {LANDING_DATA.contacto.email}
                                </a>
                            </div>
                        </FadeUp>

                        <FadeUp delay={0.5}>
                            <div className="mt-16 pt-8" style={{ borderTop: "1px solid var(--border-glass)" }}>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    © 2026 CLARITY · Gestión Pericial · Todos los derechos reservados
                                </p>
                            </div>
                        </FadeUp>
                    </div>
                </footer>
            </div>
        </div>
    );
}
