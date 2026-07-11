"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield, HeartPulse, Users, Bus, Accessibility, UserCheck,
  X, Activity, Brain, Expand, Shrink, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { ScenarioProvider, useScenario } from "@/components/midnight/ScenarioEngine";
import StadiumPulseHeader from "@/components/midnight/StadiumPulseHeader";
import TacticalStream from "@/components/midnight/TacticalStream";
import CommandDock from "@/components/midnight/CommandDock";
import HealthScore from "@/components/midnight/HealthScore";

// Lazy-load the heavy 3D scene
const DigitalTwinScene = dynamic(
  () => import("@/components/midnight/DigitalTwinScene"),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 16, background: "rgba(4,4,8,0.6)",
      }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)", borderTop: "2px solid #22d3ee", animation: "spin 1s linear infinite" }} />
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>
          INITIALIZING DIGITAL TWIN...
        </p>
      </div>
    ),
  }
);

// ── Hub navigation links ──────────────────────────────────────────────────────
const HUBS = [
  { label: "Security",      href: "/security",      icon: <Shield className="w-4 h-4" />,         color: "#818cf8", glow: "rgba(129,140,248,0.3)" },
  { label: "Medical",       href: "/medical",        icon: <HeartPulse className="w-4 h-4" />,      color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
  { label: "Volunteer",     href: "/volunteer",      icon: <Users className="w-4 h-4" />,           color: "#4ade80", glow: "rgba(74,222,128,0.3)" },
  { label: "Transport",     href: "/transportation", icon: <Bus className="w-4 h-4" />,             color: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
  { label: "Accessibility", href: "/accessibility",  icon: <Accessibility className="w-4 h-4" />,   color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  { label: "Fan Hub",       href: "/fan",            icon: <UserCheck className="w-4 h-4" />,       color: "#d4a017", glow: "rgba(212,160,23,0.3)" },
];

// ── Health Score Explanation Modal ────────────────────────────────────────────
function HealthExplainModal({
  score,
  onClose,
}: {
  score: number;
  onClose: () => void;
}) {
  const { config } = useScenario();

  const getColor = (s: number) => {
    if (s >= 95) return "#4ade80";
    if (s >= 85) return "#22d3ee";
    if (s >= 70) return "#fbbf24";
    return "#ef4444";
  };
  const color = getColor(score);

  const factors = [
    { label: "Crowd Flow Efficiency", value: score >= 85 ? 92 : 61, status: score >= 85 ? "GOOD" : "WARN" },
    { label: "Medical Response Time", value: 95, status: "GOOD" },
    { label: "Transport Load",        value: score >= 80 ? 80 : 45, status: score >= 80 ? "GOOD" : "CRITICAL" },
    { label: "Security Coverage",     value: 88, status: "GOOD" },
    { label: "Volunteer Deployment",  value: 96, status: "GOOD" },
    { label: "Concession Wait Time",  value: score >= 85 ? 74 : 42, status: score >= 85 ? "FAIR" : "WARN" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(6,6,12,0.98)",
          border: `1px solid ${color}30`,
          borderRadius: 20,
          padding: 28,
          width: "100%",
          maxWidth: 480,
          boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 40px ${color}18`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800, color: "white", marginBottom: 4 }}>Stadium Health Score</h2>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>AI COMPUTED • UPDATED EVERY 30s</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }} aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big score */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <HealthScore score={score} size={120} />
        </div>

        {/* Factor breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {factors.map((f) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{f.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: f.status === "GOOD" ? "#4ade80" : f.status === "FAIR" || f.status === "WARN" ? "#fbbf24" : "#ef4444" }}>{f.status}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{f.value}%</span>
                  </div>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${f.value}%`, borderRadius: 2, background: f.status === "GOOD" ? "#4ade80" : f.status === "FAIR" || f.status === "WARN" ? "#fbbf24" : "#ef4444", transition: "width 0.8s ease" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI prediction */}
        <div style={{ padding: "12px 14px", background: `${color}0a`, border: `1px solid ${color}20`, borderRadius: 10 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: color, marginBottom: 6, textTransform: "uppercase" }}>🧠 AI Prediction</div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            {score >= 85
              ? `Stadium operating optimally. Score likely to improve to ${Math.min(score + 5, 99)} within 12 minutes as crowd settles into seating.`
              : score >= 70
              ? `Moderate issues detected. Score recovery estimated in ${config.id !== "normal" ? "45" : "18"} minutes following ${config.label} resolution.`
              : `Critical conditions detected. Immediate action required. Score may drop further without intervention.`
            }
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Inner App (has access to ScenarioContext) ──────────────────────────────────
function MidnightPitchInner() {
  const { healthScore, config, scenario } = useScenario();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
  const wsRef = useRef<WebSocket | null>(null);

  const [metrics, setMetrics] = useState({ crowd: 45200, incidents: 2, volunteers: 450 });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [streamExpanded, setStreamExpanded] = useState(true);
  const [twinExpanded, setTwinExpanded] = useState(false);

  const addToast = useCallback((type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${wsUrl}/ws`);
    wsRef.current = ws;

    ws.onopen = () => console.log("Midnight Pitch: WebSocket connected");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state_update") {
          const s = data.state;
          setMetrics({
            crowd: s.attendance,
            incidents: s.incidents?.filter((i: any) => i.status !== "RESOLVED").length ?? 0,
            volunteers: s.volunteers,
          });
        }
      } catch (_) {}
    };
    ws.onerror = () => console.warn("Midnight Pitch: WebSocket error — operating in simulation mode");

    return () => { ws.close(); wsRef.current = null; };
  }, [wsUrl]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 0%, rgba(10,15,35,1) 0%, rgba(4,4,8,1) 60%)",
        transition: "background 0.8s ease",
      }}
      data-scenario={scenario}
    >
      {/* Ambient scenario glow overlay */}
      {scenario !== "normal" && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(ellipse at 50% 0%, ${config.glowColor} 0%, transparent 60%)`,
            zIndex: 0,
            transition: "background 0.6s ease",
          }}
        />
      )}

      <ToastContainer toasts={toasts} setToasts={setToasts} />

      {/* ── Stadium Pulse Header ── */}
      <StadiumPulseHeader
        healthScore={healthScore}
        liveMetrics={metrics}
        onHealthScoreClick={() => setShowHealthModal(true)}
      />

      {/* ── Main body ── */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: twinExpanded ? "1fr 0" : streamExpanded ? "1fr 380px" : "1fr 52px",
          transition: "grid-template-columns 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          paddingBottom: 120, // Command dock height
        }}
      >
        {/* ── Left: Digital Twin ── */}
        <div style={{ position: "relative", overflow: "hidden", background: "rgba(4,4,8,0.4)" }}>
          {/* Expand/Collapse button */}
          <button
            onClick={() => { setTwinExpanded((p) => !p); if (twinExpanded) setStreamExpanded(true); }}
            aria-label={twinExpanded ? "Show tactical stream" : "Expand digital twin"}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(6,6,12,0.8)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.08em",
            }}
          >
            {twinExpanded ? <Shrink className="w-3 h-3" /> : <Expand className="w-3 h-3" />}
            {twinExpanded ? "RESTORE" : "EXPAND"}
          </button>

          <DigitalTwinScene />

          {/* Quick hub navigation (bottom of twin viewport) */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
              zIndex: 10,
            }}
          >
            {HUBS.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                aria-label={`Open ${hub.label} dashboard`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "rgba(6,6,12,0.85)",
                  border: `1px solid ${hub.color}25`,
                  textDecoration: "none",
                  color: hub.color,
                  boxShadow: `0 0 16px ${hub.glow}`,
                  backdropFilter: "blur(10px)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${hub.color}18`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${hub.glow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(6,6,12,0.85)";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${hub.glow}`;
                }}
              >
                {hub.icon}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {hub.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Right: Tactical Stream ── */}
        <div style={{ overflow: "hidden", position: "relative" }}>
          {/* Collapse toggle */}
          {!twinExpanded && (
            <button
              onClick={() => setStreamExpanded((p) => !p)}
              aria-label={streamExpanded ? "Collapse tactical stream" : "Expand tactical stream"}
              style={{
                position: "absolute",
                top: 12,
                left: streamExpanded ? 8 : "50%",
                transform: streamExpanded ? "none" : "translateX(-50%)",
                zIndex: 10,
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "rgba(6,6,12,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s",
              }}
            >
              <Brain className="w-3 h-3" style={{ color: "var(--nexus-cyan)" }} />
            </button>
          )}

          {streamExpanded && !twinExpanded && (
            <TacticalStream apiUrl={API_URL} addToast={addToast} />
          )}
        </div>
      </div>

      {/* ── Command Dock ── */}
      <CommandDock wsRef={wsRef} role="Organizer" />

      {/* ── Health Score Modal ── */}
      <AnimatePresence>
        {showHealthModal && (
          <HealthExplainModal score={healthScore} onClose={() => setShowHealthModal(false)} />
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scan-horizontal {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ── Page Export (wraps in ScenarioProvider) ───────────────────────────────────
export default function MidnightPitchPage() {
  return (
    <ScenarioProvider>
      <MidnightPitchInner />
    </ScenarioProvider>
  );
}
