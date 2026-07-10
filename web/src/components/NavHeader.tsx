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
      {/* Top accent line */}
      <div className={`h-[1px] w-full ${accent.border} bg-gradient-to-r from-transparent via-current to-transparent opacity-60`} />

      <div
        className="flex items-center justify-between gap-4 px-6 py-3"
        style={{
          background: "rgba(8,8,10,0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left: Back + Title */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backHref}
            className={`group flex-shrink-0 p-2 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-200 ${accent.text}`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1
                className="text-lg font-semibold tracking-tight text-white truncate"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {title}
              </h1>
              {subtitle && (
                <span className={`text-sm font-medium ${accent.text} truncate`}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status + Clock + Extra controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {children}

          {/* Status badge */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${accent.bg} ${accent.border}`}
            style={{ borderWidth: "1px" }}
          >
            <span className={status.dot} />
            <span className={`text-label text-[10px] ${status.labelClass}`}>
              {displayStatus}
            </span>
          </div>

          {/* Live clock */}
          <div className="hidden md:flex items-center gap-1.5 text-[var(--text-tertiary)]">
            <Clock className="w-3 h-3" />
            <span className="text-data text-[11px] tabular-nums">{liveTime}</span>
          </div>

          {/* Radio signal icon */}
          <div className="relative">
            <Radio className={`w-4 h-4 ${accent.text} animate-pulse`} />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
