"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import {
  Activity, Map as MapIcon, ShieldAlert, Users, ArrowRight,
  MapPin, Zap, HeartPulse, Bus, ChevronDown, Wifi,
  Globe, Eye, Cpu,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

// ─── Countdown Timer ────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff < 0) return;
      setTime({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (targetRef.current) obs.observe(targetRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = value / 60;
    const id = setInterval(() => {
      current = Math.min(current + step, value);
      setDisplay(Math.floor(current));
      if (current >= value) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [started, value]);

  return (
    <div ref={targetRef} className="text-data">
      {display.toLocaleString()}{suffix}
    </div>
  );
}

// ─── Hub Card (Bento-style) ─────────────────────────────────────────────────
interface HubCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
  delay: number;
  accent: string;
  accentBg: string;
  accentGlow: string;
  badge?: string;
  large?: boolean;
}

function HubCard({ title, desc, icon, href, delay, accent, accentBg, accentGlow, badge, large }: HubCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={large ? "md:col-span-2" : ""}
    >
      <Link href={href} className="group block h-full relative overflow-hidden rounded-2xl transition-all duration-500"
        style={{
          background: "rgba(10,10,12,0.7)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = accent + "55";
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${accent}33, 0 20px 50px rgba(0,0,0,0.6), 0 0 60px ${accentGlow}`;
          (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {/* Top accent line */}
        <div className="h-[1px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />

        <div className="p-7 flex flex-col h-full min-h-[200px]">
          {/* Icon + badge */}
          <div className="flex items-start justify-between mb-6">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ background: accentBg, border: `1px solid ${accent}40` }}
            >
              {icon}
            </div>
            {badge && (
              <span
                className="text-[9px] font-mono font-bold px-2 py-1 rounded-full uppercase tracking-wider"
                style={{ background: accentBg, border: `1px solid ${accent}40`, color: accent }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1">
            <h3
              className="text-lg font-semibold text-white mb-2 tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light">
              {desc}
            </p>
          </div>

          {/* CTA */}
          <div
            className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span className="group-hover:text-white transition-colors">Launch Platform</span>
            <ArrowRight
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5"
              style={{ color: accent }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.4], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const smoothOpacity = useSpring(heroOpacity, { stiffness: 100, damping: 30 });

  const wc2026 = new Date("2026-06-11T00:00:00Z");
  const time = useCountdown(wc2026);

  const hubs = [
    { title: "Fan Copilot", desc: "Real-time seat navigation, in-seat food ordering, and augmented reality stadium maps for 80,000 fans.", icon: <MapPin className="w-5 h-5" style={{ color: "hsl(195,100%,60%)" }} />, href: "/fan", delay: 0.1, accent: "hsl(195,100%,60%)", accentBg: "hsla(195,100%,50%,0.1)", accentGlow: "hsla(195,100%,50%,0.15)", badge: "LIVE", large: true },
    { title: "Command Center", desc: "Executive overview of crowd density, energy metrics, and automated AI orchestration.", icon: <Activity className="w-5 h-5" style={{ color: "hsl(43,90%,55%)" }} />, href: "/organizer", delay: 0.2, accent: "hsl(43,90%,55%)", accentBg: "hsla(43,90%,48%,0.1)", accentGlow: "hsla(43,90%,48%,0.15)" },
    { title: "Security AI", desc: "Predictive threat analysis, emergency route optimization, and live incident tracking.", icon: <ShieldAlert className="w-5 h-5" style={{ color: "hsl(0,85%,60%)" }} />, href: "/security", delay: 0.3, accent: "hsl(0,85%,60%)", accentBg: "hsla(0,85%,55%,0.1)", accentGlow: "hsla(0,85%,55%,0.15)" },
    { title: "Volunteer Ops", desc: "Dynamic task routing, SOS alerts, and multilingual AI assistance for 5,000+ staff.", icon: <Users className="w-5 h-5" style={{ color: "hsl(145,65%,50%)" }} />, href: "/volunteer", delay: 0.4, accent: "hsl(145,65%,50%)", accentBg: "hsla(145,65%,42%,0.1)", accentGlow: "hsla(145,65%,42%,0.15)" },
    { title: "Medical Hub", desc: "Live triage status, automated paramedic routing, and AI-predicted heatstroke alerts.", icon: <HeartPulse className="w-5 h-5" style={{ color: "hsl(220,90%,65%)" }} />, href: "/medical", delay: 0.5, accent: "hsl(220,90%,65%)", accentBg: "hsla(220,90%,60%,0.1)", accentGlow: "hsla(220,90%,60%,0.15)" },
    { title: "Transport Hub", desc: "Live metro status, predictive traffic rerouting, and dynamic VIP shuttle tracking.", icon: <Bus className="w-5 h-5" style={{ color: "hsl(250,85%,70%)" }} />, href: "/transportation", delay: 0.6, accent: "hsl(250,85%,70%)", accentBg: "hsla(250,85%,65%,0.1)", accentGlow: "hsla(250,85%,65%,0.15)" },
  ];

  const stats = [
    { label: "Fan Interactions / Day", value: 2400000, suffix: "+", icon: <Globe className="w-4 h-4" /> },
    { label: "AI Agents Active",        value: 48,       suffix: "",   icon: <Cpu  className="w-4 h-4" /> },
    { label: "Stadiums Covered",        value: 16,       suffix: "",   icon: <Eye  className="w-4 h-4" /> },
    { label: "Data Streams Live",       value: 3840,     suffix: "",   icon: <Wifi className="w-4 h-4" /> },
  ];

  return (
    <main className="relative min-h-screen bg-[var(--surface-0)] text-white overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Scene />
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 lg:px-24">
        <motion.div
          style={{ y: heroY, opacity: smoothOpacity }}
          className="text-center max-w-5xl w-full pt-24"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-10 inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(212,160,23,0.3)",
              color: "var(--nexus-gold-bright)",
              boxShadow: "0 0 20px var(--nexus-gold-glow)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nexus-red)] animate-pulse" />
            FIFA World Cup 2026 — Official AI Platform
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="text-display mb-6 leading-none"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
          >
            <span className="gradient-white">FIFA</span>{" "}
            <span className="gradient-gold">Nexus AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="text-xl md:text-2xl font-light mb-4 tracking-tight"
            style={{ color: "var(--text-secondary)", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Intelligent Stadium Operating System
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-12 font-light"
            style={{ color: "var(--text-tertiary)" }}
          >
            The world's most advanced generative AI platform for stadium operations,
            predictive crowd intelligence, and unparalleled fan experiences.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/fan"
              className="btn btn-primary btn-lg group"
            >
              Enter Fan Hub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/organizer"
              className="btn btn-ghost btn-lg"
            >
              Command Center
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Countdown Widget ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="relative mt-20 z-20"
        >
          <div
            className="px-8 py-6 rounded-2xl"
            style={{
              background: "rgba(8,8,10,0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-label text-[9px] text-center text-[var(--text-tertiary)] mb-4">
              FIFA WORLD CUP 2026 KICKS OFF IN
            </p>
            <div className="flex items-center gap-6">
              {[
                { v: time.d,  l: "DAYS" },
                { v: time.h,  l: "HOURS" },
                { v: time.m,  l: "MIN" },
                { v: time.s,  l: "SEC" },
              ].map(({ v, l }, i) => (
                <div key={l} className="flex items-center gap-6">
                  {i > 0 && (
                    <span
                      className="text-3xl font-bold text-data animate-pulse"
                      style={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      :
                    </span>
                  )}
                  <div className="text-center">
                    <div
                      className="text-data text-4xl font-bold tabular-nums text-white"
                      style={{ textShadow: "0 0 20px var(--nexus-gold-glow)", letterSpacing: "-0.02em" }}
                    >
                      {String(v).padStart(2, "0")}
                    </div>
                    <div className="text-label text-[9px] mt-1" style={{ color: "var(--nexus-gold-bright)" }}>
                      {l}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span className="text-[10px] font-mono tracking-widest uppercase">Explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ── LIVE STATS STRIP ──────────────────────────────────────────── */}
      <section className="relative z-10 py-12 px-6 border-y border-white/5" style={{ background: "rgba(6,6,8,0.8)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value, suffix, icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2" style={{ color: "var(--nexus-gold-bright)" }}>
                {icon}
                <span className="text-label text-[9px]">{label}</span>
              </div>
              <div
                className="text-3xl font-bold text-white tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <AnimatedNumber value={value} suffix={suffix} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HUB GRID ──────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-28 px-6 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16"
          >
            <div className="data-pill data-pill-gold mb-6">Six AI Hubs</div>
            <h2
              className="text-display text-white mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Centralized{" "}
              <span className="gradient-gold">Intelligence</span>
            </h2>
            <p className="text-lg max-w-2xl" style={{ color: "var(--text-secondary)", fontFamily: "'Space Grotesk', sans-serif" }}>
              Six dedicated AI hubs powering a seamless ecosystem for fans, organizers, security, volunteers, medical, and transportation.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hubs.map((hub) => (
              <HubCard key={hub.href} {...hub} />
            ))}
          </div>
        </div>
      </section>

      {/* ── INTELLIGENCE SECTION ──────────────────────────────────────── */}
      <section className="relative z-10 py-28 px-6 lg:px-24" style={{ background: "rgba(4,4,6,0.6)" }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-7"
          >
            <div className="data-pill data-pill-cyan">
              <Zap className="w-3 h-3" />
              Deep Learning
            </div>
            <h2
              className="text-display leading-tight text-white"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}
            >
              Predictive Crowd
              <br />
              <span className="gradient-gold">Intelligence.</span>
              <br />
              <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.6em" }}>
                Before it happens.
              </span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Nexus AI continuously ingests thousands of data points — from turnstile throughput
              to thermal cameras — to anticipate bottlenecks, reroute fans, and deploy volunteers proactively.
            </p>

            <ul className="space-y-3">
              {[
                "Sub-second latency WebSocket data streams",
                "Retrieval-Augmented Generation (RAG) for SOPs",
                "Dynamic heatmaps & real-time pathfinding",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--nexus-gold-bright)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/organizer" className="btn btn-ghost inline-flex">
              Open Command Center <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right: Digital Twin Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex-1 w-full max-w-lg"
          >
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Top bar */}
              <div
                className="flex items-center gap-2 px-5 py-3 border-b border-white/5"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--nexus-red)] animate-pulse" />
                <span className="text-label text-[9px] text-[var(--text-tertiary)]">DIGITAL TWIN · LIVE FEED</span>
              </div>

              {/* Content */}
              <div
                className="relative h-72 flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(4,4,6,0.9)" }}
              >
                {/* Animated rings */}
                {[64, 48, 32, 16].map((size, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${size * 4}px`,
                      height: `${size * 4}px`,
                      border: `1px solid ${i % 2 === 0 ? "rgba(212,160,23,0.2)" : "rgba(0,200,255,0.12)"}`,
                      animation: `${i % 2 === 0 ? "rotate-slow" : "spin-reverse"} ${10 + i * 4}s linear infinite`,
                    }}
                  />
                ))}

                {/* Center icon */}
                <div
                  className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "hsla(43,90%,48%,0.12)",
                    border: "1px solid rgba(212,160,23,0.4)",
                    boxShadow: "0 0 30px var(--nexus-gold-glow)",
                  }}
                >
                  <MapPin className="w-6 h-6 text-[var(--nexus-gold-bright)]" />
                </div>

                {/* Bottom metrics strip */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex justify-around items-center px-4 py-3"
                  style={{
                    background: "rgba(4,4,6,0.9)",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {[
                    { l: "Density", v: "OPTIMAL", c: "var(--nexus-green)" },
                    { l: "Flow Rate", v: "1,240/min", c: "white" },
                    { l: "Status", v: "AI ROUTING", c: "var(--nexus-cyan)" },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="text-center">
                      <div className="text-label text-[8px] mb-1" style={{ color: "var(--text-tertiary)" }}>{l}</div>
                      <div className="text-data text-xs font-bold" style={{ color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 py-10 px-6 lg:px-24"
        style={{
          background: "rgba(4,4,6,0.95)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-black text-sm"
              style={{
                background: "linear-gradient(135deg, var(--nexus-gold), hsl(38,95%,42%))",
                boxShadow: "0 4px 12px var(--nexus-gold-glow)",
              }}
            >
              N
            </div>
            <span
              className="font-semibold text-base text-white tracking-wide"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              NEXUS AI
            </span>
          </div>

          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            © 2026 FIFA World Cup Technology Showcase. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {["Documentation", "Privacy", "Terms"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors duration-200">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
