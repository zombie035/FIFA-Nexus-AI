"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp, Zap, Shield, Activity, Bus } from "lucide-react";
import { useScenario } from "./ScenarioEngine";

// ── Prediction Data ───────────────────────────────────────────────────────────
interface Prediction {
  id: string;
  title: string;
  category: "crowd" | "medical" | "security" | "transport" | "operations";
  confidence: number;
  severity: "info" | "warning" | "critical";
  reasoning: string;
  evidence: string[];
  affectedSection: string;
  affectedFans: number;
  recoveryEst: string;
  timeline: string;
  plays: Play[];
  timestamp: number;
  status: "pending" | "executed" | "dismissed";
}

interface Play {
  id: string;
  label: string;
  action: string;
  description: string;
  impact: string;
  endpoint?: string;
  body?: object;
}

const CATEGORY_CONFIG = {
  crowd:      { icon: <Activity className="w-3.5 h-3.5" />, color: "hsl(25,90%,60%)",   label: "CROWD" },
  medical:    { icon: <Activity className="w-3.5 h-3.5" />, color: "hsl(0,85%,58%)",    label: "MEDICAL" },
  security:   { icon: <Shield className="w-3.5 h-3.5" />,   color: "hsl(220,90%,62%)",  label: "SECURITY" },
  transport:  { icon: <Bus className="w-3.5 h-3.5" />,      color: "hsl(195,100%,50%)", label: "TRANSPORT" },
  operations: { icon: <Zap className="w-3.5 h-3.5" />,      color: "hsl(43,90%,55%)",   label: "OPS" },
};

const SEVERITY_STYLE = {
  info:     { border: "rgba(0,200,255,0.25)",   bg: "rgba(0,200,255,0.05)",   dot: "#22d3ee" },
  warning:  { border: "rgba(251,191,36,0.3)",   bg: "rgba(251,191,36,0.06)",  dot: "#fbbf24" },
  critical: { border: "rgba(239,68,68,0.35)",   bg: "rgba(239,68,68,0.07)",   dot: "#ef4444" },
};

// ── Prediction Generator ───────────────────────────────────────────────────────
let predId = 1;
function generatePrediction(scenario: string): Prediction {
  const pool: Omit<Prediction, "id" | "timestamp" | "status">[] = [
    {
      title: "Concession Bottleneck — Section B",
      category: "crowd",
      confidence: 94,
      severity: "warning",
      reasoning: "Beer sales spiked 41% following last goal. Historical model predicts queue increase at Section B Stand 112.",
      evidence: ["Beer sales +41% vs baseline", "Goal scored 5 min ago", "Crowd energy: HIGH"],
      affectedSection: "Section B, Stand 112",
      affectedFans: 2400,
      recoveryEst: "8 min",
      timeline: "Next 6 minutes",
      plays: [
        { id: "p1", label: "Deploy Vendors", action: "Deploy 3 extra vendors", description: "Redirect 3 standby vendors from Section A to Section B", impact: "-29% queue time", endpoint: "/api/tasks", body: { title: "Deploy vendors to Section B", location: "Section B Stand 112", priority: "HIGH", category: "VOLUNTEER" } },
        { id: "p2", label: "Open Kiosk", action: "Activate express kiosk", description: "Unlock self-serve kiosk at Gate 12B for overflow", impact: "-18% queue" },
        { id: "p3", label: "Redirect PA", action: "PA announcement", description: "Broadcast: 'Beverages available at Stand 114 with no wait time'", impact: "Fans diverted" },
      ],
    },
    {
      title: "Metro Line A — Near Capacity",
      category: "transport",
      confidence: 89,
      severity: "warning",
      reasoning: "Metro load factor at 92%. Full-time exodus in 35 minutes will cause surge exceeding safe limits.",
      evidence: ["Metro load: 92%", "Full time in 35 min", "3 scheduled services cancelled"],
      affectedSection: "All entrance gates",
      affectedFans: 12000,
      recoveryEst: "22 min",
      timeline: "Post-match",
      plays: [
        { id: "p1", label: "Extra Trains", action: "Request extra trains", description: "Contact Metro authority to add 2 extra services post-match", impact: "+4,000 capacity", endpoint: "/api/tasks", body: { title: "Coordinate extra Metro services post-match", location: "Metro Station", priority: "HIGH", category: "TRANSPORT" } },
        { id: "p2", label: "Stagger Exit", action: "Stagger fan exit", description: "Open VIP exits 10 min early to distribute load", impact: "15% smoother flow" },
      ],
    },
    {
      title: "Heat Risk — Gate 6 Concourse",
      category: "medical",
      confidence: 81,
      severity: "critical",
      reasoning: "Temperature 28°C + crowd density 87% in Gate 6. Historical data shows 3x heat stroke risk above these thresholds.",
      evidence: ["Temp: 28°C", "Gate 6 density: 87%", "3 heat cases last hour"],
      affectedSection: "Gate 6 Concourse",
      affectedFans: 800,
      recoveryEst: "15 min",
      timeline: "Immediate",
      plays: [
        { id: "p1", label: "Deploy Medics", action: "Pre-position medics", description: "Station 2 paramedics at Gate 6 with cooling equipment", impact: "Response: 90s → 30s", endpoint: "/api/medical/triage", body: { name: "Precautionary Station", gate: "Gate 6", condition: "Heat Monitoring", severity: "MEDIUM" } },
        { id: "p2", label: "Water Stations", action: "Activate water points", description: "Deploy 4 water distribution stations in Gate 6 concourse", impact: "Prevent 6-8 cases" },
        { id: "p3", label: "Cooling Fans", action: "Activate misting fans", description: "Turn on stadium cooling fans in Gate 6 corridor", impact: "-4°C perceived temp" },
      ],
    },
    {
      title: "Crowd Density Alert — Sector C",
      category: "crowd",
      confidence: 96,
      severity: "critical",
      reasoning: "Sector C density approaching critical threshold (1.8 persons/m²). Crush risk if no intervention within 4 minutes.",
      evidence: ["Density: 1.8p/m²", "Threshold: 2.0p/m²", "Flow velocity: declining"],
      affectedSection: "Sector C East",
      affectedFans: 3200,
      recoveryEst: "5 min",
      timeline: "Immediate",
      plays: [
        { id: "p1", label: "Open Gate 8", action: "Open emergency gate", description: "Unlock Gate 8 emergency exit to relieve Sector C pressure", impact: "-40% density", endpoint: "/api/incidents", body: { location: "Sector C", desc: "Emergency gate 8 opened for density relief", severity: "HIGH" } },
        { id: "p2", label: "PA Alert", action: "PA announcement", description: "Broadcast calm movement instructions to Sector C fans", impact: "Crowd slows" },
        { id: "p3", label: "Security Cordon", action: "Establish cordon", description: "Create security cordon to limit further Sector C entry", impact: "Flow controlled" },
      ],
    },
    {
      title: "Volunteer Shortage — Zone 3",
      category: "operations",
      confidence: 78,
      severity: "warning",
      reasoning: "Zone 3 has 2 active volunteers vs required 8. Afternoon shift ended early, next shift arrives in 22 minutes.",
      evidence: ["Active: 2 (req: 8)", "Shift gap: 22 min", "Incident rate in zone: +20%"],
      affectedSection: "Zone 3 Concourse",
      affectedFans: 5500,
      recoveryEst: "12 min",
      timeline: "Now",
      plays: [
        { id: "p1", label: "Cross-Deploy", action: "Redeploy volunteers", description: "Temporarily reassign 4 volunteers from Zone 1 to Zone 3", impact: "Coverage restored 50%", endpoint: "/api/tasks", body: { title: "Emergency volunteer redeployment Zone 1→Zone 3", location: "Zone 3", priority: "HIGH", category: "VOLUNTEER" } },
        { id: "p2", label: "Call Early", action: "Early shift start", description: "Contact next shift to arrive 15 minutes early", impact: "Full coverage in 8 min" },
      ],
    },
  ];

  const base = pool[predId % pool.length];
  predId++;

  return {
    ...base,
    id: `pred-${predId}-${Date.now()}`,
    timestamp: Date.now(),
    status: "pending",
  };
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface TacticalStreamProps {
  apiUrl: string;
  addToast: (type: "success" | "error" | "info", text: string) => void;
}

export default function TacticalStream({ apiUrl, addToast }: TacticalStreamProps) {
  const { scenario } = useScenario();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Seed initial predictions
  useEffect(() => {
    const initial = [generatePrediction("normal"), generatePrediction("normal"), generatePrediction("normal")];
    initial[0].severity = "critical";
    setPredictions(initial);
  }, []);

  // Stream in new predictions every 18s
  useEffect(() => {
    const id = setInterval(() => {
      const newPred = generatePrediction(scenario);
      setPredictions((prev) => [newPred, ...prev.slice(0, 14)]);
    }, 18000);
    return () => clearInterval(id);
  }, [scenario]);

  // Add scenario-specific critical predictions immediately on scenario change
  useEffect(() => {
    if (scenario !== "normal") {
      const critical = generatePrediction(scenario);
      critical.severity = "critical";
      critical.confidence = Math.round(88 + Math.random() * 10);
      setPredictions((prev) => [critical, ...prev.slice(0, 14)]);
    }
  }, [scenario]);

  const executePlay = useCallback(async (pred: Prediction, play: Play) => {
    setExecutingId(play.id);
    try {
      if (play.endpoint && play.body) {
        await fetch(`${apiUrl}${play.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(play.body),
        });
      }
      // Simulate execution delay
      await new Promise((r) => setTimeout(r, 1200));
      setPredictions((prev) =>
        prev.map((p) => (p.id === pred.id ? { ...p, status: "executed" } : p))
      );
      addToast("success", `✓ ${play.action} — executed successfully.`);
    } catch {
      addToast("info", `${play.action} — executed in simulation mode.`);
      setPredictions((prev) =>
        prev.map((p) => (p.id === pred.id ? { ...p, status: "executed" } : p))
      );
    } finally {
      setExecutingId(null);
    }
  }, [apiUrl, addToast]);

  const dismissPrediction = useCallback((id: string) => {
    setPredictions((prev) => prev.map((p) => p.id === id ? { ...p, status: "dismissed" } : p));
  }, []);

  const filtered = predictions.filter((p) =>
    filter === "all" ? true : p.category === filter
  );

  const activePredictions = filtered.filter((p) => p.status === "pending");
  const resolvedPredictions = filtered.filter((p) => p.status !== "pending");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "rgba(4,4,8,0.6)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          background: "rgba(6,6,12,0.7)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Brain className="w-4 h-4" style={{ color: "var(--nexus-cyan)" }} />
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
              AI Tactical Stream
            </h2>
            <div style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: "#ef4444", letterSpacing: "0.08em" }}>
              {activePredictions.length} ACTIVE
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", animation: "pulse-slow 2s infinite" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["all", "crowd", "medical", "security", "transport", "operations"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: "3px 8px",
                borderRadius: 4,
                border: `1px solid ${filter === cat ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                background: filter === cat ? "rgba(255,255,255,0.08)" : "transparent",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: filter === cat ? "white" : "rgba(255,255,255,0.3)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prediction stream */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, 12).map((pred) => {
            const catCfg = CATEGORY_CONFIG[pred.category];
            const sevStyle = SEVERITY_STYLE[pred.severity];
            const isExpanded = expandedId === pred.id;
            const isDone = pred.status !== "pending";

            return (
              <motion.div
                key={pred.id}
                layout
                initial={{ opacity: 0, x: 20, scale: 0.97 }}
                animate={{ opacity: isDone ? 0.4 : 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  background: isDone ? "rgba(255,255,255,0.02)" : sevStyle.bg,
                  border: `1px solid ${isDone ? "rgba(255,255,255,0.05)" : sevStyle.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {/* Top accent */}
                {!isDone && pred.severity === "critical" && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${sevStyle.dot}, transparent)`, animation: "scan-horizontal 3s ease-in-out infinite" }} />
                )}

                {/* Card header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : pred.id)}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left" }}
                  aria-expanded={isExpanded}
                >
                  {/* Status dot */}
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: isDone ? "#4ade80" : sevStyle.dot, flexShrink: 0, marginTop: 4, boxShadow: isDone ? "none" : `0 0 8px ${sevStyle.dot}`, animation: !isDone && pred.severity === "critical" ? "btn-emergency-pulse 1.5s infinite" : "none" }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Category + confidence */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: catCfg.color }}>{catCfg.icon}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: catCfg.color, textTransform: "uppercase" }}>
                          {catCfg.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isDone && pred.status === "executed" && <CheckCircle2 className="w-3 h-3" style={{ color: "#4ade80" }} />}
                        {isDone && pred.status === "dismissed" && <XCircle className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: pred.confidence >= 90 ? "#4ade80" : pred.confidence >= 75 ? "#fbbf24" : "#ef4444" }}>
                          {pred.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: isDone ? "rgba(255,255,255,0.4)" : "white", marginBottom: 3, lineHeight: 1.3 }}>
                      {pred.title}
                    </p>

                    {/* Confidence bar */}
                    <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, marginBottom: 4 }}>
                      <div style={{ height: "100%", width: `${pred.confidence}%`, borderRadius: 1, background: `linear-gradient(90deg, ${catCfg.color}, ${sevStyle.dot})`, transition: "width 0.8s ease" }} />
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
                        📍 {pred.affectedSection}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
                        👥 {pred.affectedFans.toLocaleString()} fans
                      </span>
                    </div>
                  </div>

                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0, marginTop: 2 }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0, marginTop: 2 }} />}
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 12px 12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        {/* Reasoning */}
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, marginTop: 10, marginBottom: 8 }}>
                          {pred.reasoning}
                        </p>

                        {/* Evidence */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                          {pred.evidence.map((e, i) => (
                            <span key={i} style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.45)" }}>
                              {e}
                            </span>
                          ))}
                        </div>

                        {/* Plays */}
                        {!isDone && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 2 }}>
                              Playbook
                            </div>
                            {pred.plays.map((play) => (
                              <div key={play.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, color: "white", marginBottom: 1 }}>{play.action}</div>
                                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{play.description}</div>
                                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#4ade80", marginTop: 2 }}>↑ {play.impact}</div>
                                </div>
                                <button
                                  onClick={() => executePlay(pred, play)}
                                  disabled={executingId === play.id}
                                  aria-label={`Execute: ${play.action}`}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    border: `1px solid ${catCfg.color}50`,
                                    background: `${catCfg.color}15`,
                                    color: catCfg.color,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    flexShrink: 0,
                                    transition: "all 0.15s",
                                    opacity: executingId === play.id ? 0.6 : 1,
                                  }}
                                >
                                  {executingId === play.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "EXECUTE"
                                  )}
                                </button>
                              </div>
                            ))}

                            {/* Dismiss */}
                            <button
                              onClick={() => dismissPrediction(pred.id)}
                              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, cursor: "pointer", textAlign: "center" }}
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 12 }}>
            <Brain className="w-8 h-8" style={{ color: "rgba(255,255,255,0.1)" }} />
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>No predictions in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
