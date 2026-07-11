"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface NavHeaderProps {
  title: string;
  subtitle?: string;
  accentColor?: "gold" | "red" | "cyan" | "green" | "blue" | "indigo";
  backHref?: string;
  statusLabel?: string;
  statusVariant?: "live" | "ok" | "warn" | "info" | "offline";
  children?: React.ReactNode; // extra header controls
}

const accentMap = {
  gold:   { text: "text-[var(--nexus-gold-bright)]",   border: "border-[var(--nexus-gold)]",   bg: "bg-[hsla(43,90%,48%,0.08)]"   },
  red:    { text: "text-[var(--nexus-red)]",            border: "border-[var(--nexus-red)]",    bg: "bg-[hsla(0,85%,55%,0.08)]"    },
  cyan:   { text: "text-[var(--nexus-cyan)]",           border: "border-[var(--nexus-cyan)]",   bg: "bg-[hsla(195,100%,50%,0.08)]" },
  green:  { text: "text-[var(--nexus-green)]",          border: "border-[var(--nexus-green)]",  bg: "bg-[hsla(145,65%,42%,0.08)]"  },
  blue:   { text: "text-[var(--nexus-blue)]",           border: "border-[var(--nexus-blue)]",   bg: "bg-[hsla(220,90%,60%,0.08)]"  },
  indigo: { text: "text-[var(--nexus-indigo)]",         border: "border-[var(--nexus-indigo)]", bg: "bg-[hsla(250,85%,65%,0.08)]"  },
};

const statusMap = {
  live:    { dot: "status-dot status-dot-live",    label: "LIVE",        labelClass: "text-[var(--nexus-red)]"   },
  ok:      { dot: "status-dot status-dot-ok",      label: "OPERATIONAL", labelClass: "text-[var(--nexus-green)]" },
  warn:    { dot: "status-dot status-dot-warn",    label: "WARNING",     labelClass: "text-[var(--nexus-gold)]"  },
  info:    { dot: "status-dot status-dot-info",    label: "ACTIVE",      labelClass: "text-[var(--nexus-cyan)]"  },
  offline: { dot: "status-dot status-dot-offline", label: "OFFLINE",     labelClass: "text-[var(--text-tertiary)]"},
};

export default function NavHeader({
  title,
  subtitle,
  accentColor = "gold",
  backHref = "/",
  statusLabel,
  statusVariant = "live",
  children,
}: NavHeaderProps) {
  const [liveTime, setLiveTime] = useState("");
  const accent = accentMap[accentColor];
  const status = statusMap[statusVariant];
  const displayStatus = statusLabel ?? status.label;

  useEffect(() => {
    const update = () => {
      setLiveTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-40 w-full"
    >
      {/* Top accent line — animated gradient sweep */}
      <div
        style={{
          height: "1px",
          width: "100%",
          background: `linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%)`,
          opacity: 0.55,
          position: "relative",
          overflow: "hidden",
        }}
        className={accent.text}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.6) 50%, transparent 80%)",
            backgroundSize: "200% 100%",
            animation: "scan-horizontal 4s ease-in-out infinite",
          }}
        />
      </div>

      <div
        className="flex items-center justify-between gap-4 px-6 py-3"
        style={{
          background: "rgba(7,7,9,0.88)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
        }}
      >
        {/* Left: Premium Back Button + Title */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backHref}
            className={`btn-back flex-shrink-0 ${accent.text}`}
            aria-label="Go back"
          >
            <ArrowLeft
              style={{
                width: "14px",
                height: "14px",
                transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              className="group-hover:-translate-x-0.5"
            />
            <span>Back</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1
                className="text-lg font-semibold tracking-tight text-white truncate"
                style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}
              >
                {title}
              </h1>
              {subtitle && (
                <span className={`text-xs font-mono font-semibold tracking-widest uppercase ${accent.text} truncate opacity-70`}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Premium Status Badge + Scoreboard Clock + Extra controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {children}

          {/* Premium LED Status Badge */}
          <div
            className={`hidden sm:flex status-badge-premium ${accent.bg} ${accent.border}`}
            style={{
              border: "1px solid",
              boxShadow: `0 0 20px ${
                accentColor === "gold" ? "rgba(212,160,23,0.15)" :
                accentColor === "red" ? "rgba(220,50,50,0.15)" :
                accentColor === "cyan" ? "rgba(0,200,255,0.12)" :
                accentColor === "green" ? "rgba(0,200,100,0.12)" :
                "rgba(100,140,255,0.12)"
              }`,
            }}
          >
            <span className={status.dot} />
            <span className={`${status.labelClass}`}>
              {displayStatus}
            </span>
          </div>

          {/* Scoreboard-style live clock */}
          <div
            className="hidden md:flex items-center gap-1.5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              padding: "4px 10px",
            }}
          >
            <Clock style={{ width: "11px", height: "11px", color: "var(--text-tertiary)" }} />
            <span
              className="text-data tabular-nums"
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.06em",
              }}
            >
              {liveTime}
            </span>
          </div>

          {/* Animated signal indicator */}
          <div className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
            <Radio
              className={`w-3.5 h-3.5 ${accent.text}`}
              style={{ animation: "pulse-slow 2s ease-in-out infinite" }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: `1px solid currentColor`,
                animation: "ping-ring 2.5s cubic-bezier(0,0,0.2,1) infinite",
                opacity: 0,
              }}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
