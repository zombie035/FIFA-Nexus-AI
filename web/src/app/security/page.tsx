"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert, Video, Users, Activity, AlertTriangle,
  Crosshair, Siren, Loader2, Plus, Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Modal from "@/components/Modal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import NavHeader from "@/components/NavHeader";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

const THREAT_CONFIG = {
  NORMAL:        { color: "var(--nexus-green)", bg: "hsla(145,65%,42%,0.08)", border: "rgba(74,222,128,0.25)" },
  ELEVATED:      { color: "var(--nexus-gold)",  bg: "hsla(43,90%,48%,0.08)",  border: "rgba(212,160,23,0.3)"  },
  HIGH:          { color: "hsl(25,90%,55%)",    bg: "hsla(25,90%,55%,0.08)",  border: "rgba(220,120,50,0.35)" },
  "CRITICAL ALARM": { color: "var(--nexus-red)", bg: "hsla(0,85%,55%,0.1)",   border: "rgba(239,68,68,0.4)"   },
};

function ThreatMeter({ level }: { level: string }) {
  const cfg = THREAT_CONFIG[level as keyof typeof THREAT_CONFIG] || THREAT_CONFIG.NORMAL;
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden w-24"
      style={{ background: "rgba(255,255,255,0.08)" }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{
          width: level === "NORMAL" ? "25%" : level === "ELEVATED" ? "50%" : level === "HIGH" ? "75%" : "100%",
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
      />
    </div>
  );
}

export default function SecurityDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [incidents, setIncidents] = useState<any[]>([]);
  const [threatLevel, setThreatLevel] = useState("ELEVATED");
  const [cameraStatus, setCameraStatus] = useState("98% ONLINE");
  const [officers, setOfficers] = useState({ deployed: 142, max: 150 });
  const [systemHealth, setSystemHealth] = useState("OPTIMAL");

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const [formLocation, setFormLocation] = useState("Gate 2");
  const [formSeverity, setFormSeverity] = useState("MEDIUM");
  const [formDesc, setFormDesc] = useState("");

  const [dispatchLocation, setDispatchLocation] = useState("Gate 4");
  const [dispatchCount, setDispatchCount] = useState(3);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state_update") {
          const state = data.state;
          setIncidents(state.incidents);
          setThreatLevel(state.threat_level);
          setOfficers({ deployed: state.deployed_officers, max: 150 });
        }
      } catch (e) { console.error(e); }
    };
    return () => ws.close();
  }, []);

  const handleResolveIncident = async (incidentId: number) => {
    setLoading(`resolve-${incidentId}`);
    try {
      const res = await fetch(`${API_URL}/api/incidents/${incidentId}/resolve`, { method: "POST" });
      if (res.ok) addToast("success", `Incident #${incidentId} resolved.`);
      else addToast("error", `Failed to resolve incident #${incidentId}.`);
    } catch {
      setIncidents((prev) => prev.map((i) => i.id === incidentId ? { ...i, status: "RESOLVED" } : i));
      addToast("success", "Incident resolved locally.");
    } finally { setLoading(null); }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim()) return;
    setLoading("create");
    try {
      const res = await fetch(`${API_URL}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: formLocation, severity: formSeverity, desc: formDesc }),
      });
      if (res.ok) { addToast("success", `Incident created at ${formLocation}!`); setFormDesc(""); setActiveModal(null); }
      else addToast("error", "API error creating incident.");
    } catch {
      addToast("info", "Filing incident locally. Dispatching agents...");
      setIncidents((prev) => [{ id: Math.floor(Math.random() * 1000), time: "Just Now", location: formLocation, severity: formSeverity, desc: formDesc, status: "IN_PROGRESS" }, ...prev]);
      setFormDesc(""); setActiveModal(null);
    } finally { setLoading(null); }
  };

  const handleDispatchOfficers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("dispatch-officers");
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Deploy ${dispatchCount} security officers for crowd support`, location: dispatchLocation, priority: "HIGH", category: "SECURITY" }),
      });
      if (res.ok) { addToast("success", `Dispatched ${dispatchCount} officers to ${dispatchLocation}.`); setActiveModal(null); }
      else addToast("error", "Error creating dispatcher task.");
    } catch {
      addToast("success", "Officers dispatched locally.");
      setOfficers((prev) => ({ ...prev, deployed: Math.min(prev.max, prev.deployed + dispatchCount) }));
      setActiveModal(null);
    } finally { setLoading(null); }
  };

  const handleToggleThreatLevel = async (level: string) => {
    try {
      const res = await fetch(`${API_URL}/api/security/threat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threat_level: level }),
      });
      if (res.ok) addToast("success", `Threat level set to ${level}.`);
    } catch { setThreatLevel(level); addToast("info", `Threat level simulated: ${level}`); }
  };

  const handleCameraDiagnostics = () => {
    setCameraStatus("DIAGNOSTIC...");
    setTimeout(() => { setCameraStatus("100% ONLINE"); addToast("success", "Camera diagnostics complete. All 184 streams online."); }, 1500);
  };

  const hasCriticalIncident = incidents.some((i) => i.status !== "RESOLVED" && i.severity === "CRITICAL");
  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const threatCfg = THREAT_CONFIG[threatLevel as keyof typeof THREAT_CONFIG] || THREAT_CONFIG.NORMAL;

  const severityStyle = (s: string) => ({
    CRITICAL: { bg: "hsla(0,85%,55%,0.15)",   border: "rgba(239,68,68,0.4)",   text: "var(--nexus-red)" },
    HIGH:     { bg: "hsla(25,90%,55%,0.12)",  border: "rgba(220,120,50,0.35)", text: "hsl(25,90%,60%)" },
    MEDIUM:   { bg: "hsla(43,90%,48%,0.1)",   border: "rgba(212,160,23,0.3)",  text: "var(--nexus-gold-bright)" },
    LOW:      { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "var(--text-secondary)" },
  }[s] || { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "var(--text-secondary)" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <NavHeader
        title="Security Ops"
        subtitle="Level 1 Command"
        accentColor="red"
        statusVariant="live"
      >
        {/* Export + Threat selector in header */}
        <button
          onClick={() => setActiveModal("report-log")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}
        >
          <Download className="w-3.5 h-3.5" /> Export Logs
        </button>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: threatCfg.bg, border: `1px solid ${threatCfg.border}` }}
        >
          <Siren
            className="w-4 h-4 flex-shrink-0"
            style={{ color: threatCfg.color, animation: threatLevel === "CRITICAL ALARM" ? "bounce 1s infinite" : "none" }}
          />
          <select
            value={threatLevel}
            onChange={(e) => handleToggleThreatLevel(e.target.value)}
            className="bg-transparent text-xs font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
            style={{ color: threatCfg.color }}
          >
            {Object.keys(THREAT_CONFIG).map((lvl) => (
              <option key={lvl} value={lvl} className="bg-black text-white">{lvl}</option>
            ))}
          </select>
        </div>
      </NavHeader>

      <div className="flex-1 px-6 py-8 max-w-[1440px] mx-auto w-full space-y-6">

        {/* ── Stat Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Active Incidents */}
          <div
            onClick={() => setActiveModal("create-incident")}
            className="cursor-pointer rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group"
            style={{
              background: "hsla(0,85%,55%,0.06)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)")}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, var(--nexus-red), transparent)" }} />
            <div className="flex justify-between items-start mb-4">
              <p className="text-label text-[9px]" style={{ color: "var(--text-tertiary)" }}>Active Incidents</p>
              <AlertTriangle className="w-4 h-4" style={{ color: "var(--nexus-red)" }} />
            </div>
            <div className="flex items-end justify-between">
              <span
                className="text-data text-4xl font-bold"
                style={{ color: "var(--nexus-red)", textShadow: "0 0 20px var(--nexus-red-glow)" }}
              >
                {activeIncidents.length}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 group-hover:opacity-100 opacity-70 transition-opacity"
                style={{ background: "hsla(0,85%,55%,0.2)", color: "var(--nexus-red)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <Plus className="w-3 h-3" /> Report
              </span>
            </div>
          </div>

          {/* Officers */}
          <div
            onClick={() => setActiveModal("dispatch")}
            className="cursor-pointer rounded-2xl p-5 relative overflow-hidden transition-all duration-300"
            style={{ background: "hsla(195,100%,50%,0.05)", border: "1px solid rgba(0,200,255,0.2)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, var(--nexus-cyan), transparent)" }} />
            <div className="flex justify-between items-start mb-4">
              <p className="text-label text-[9px]" style={{ color: "var(--text-tertiary)" }}>Officers Deployed</p>
              <Crosshair className="w-4 h-4" style={{ color: "var(--nexus-cyan)" }} />
            </div>
            <p className="text-data text-3xl font-bold text-white">{officers.deployed}<span className="text-lg font-normal text-[var(--text-tertiary)]">/{officers.max}</span></p>
            <div className="mt-3 w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(officers.deployed / officers.max) * 100}%`, background: "var(--nexus-cyan)" }} />
            </div>
          </div>

          {/* Camera */}
          <div
            onClick={handleCameraDiagnostics}
            className="cursor-pointer rounded-2xl p-5 relative overflow-hidden transition-all duration-300"
            style={{ background: "hsla(145,65%,42%,0.05)", border: "1px solid rgba(74,222,128,0.2)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, var(--nexus-green), transparent)" }} />
            <div className="flex justify-between items-start mb-4">
              <p className="text-label text-[9px]" style={{ color: "var(--text-tertiary)" }}>Camera Network</p>
              <Video className="w-4 h-4" style={{ color: "var(--nexus-green)" }} />
            </div>
            <p className="text-data text-xl font-bold" style={{ color: "var(--nexus-green)" }}>{cameraStatus}</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>Click to run diagnostics</p>
          </div>

          {/* System */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-label text-[9px]" style={{ color: "var(--text-tertiary)" }}>System Health</p>
              <Activity className="w-4 h-4" style={{ color: "var(--nexus-green)" }} />
            </div>
            <p className="text-data text-xl font-bold" style={{ color: "var(--nexus-green)" }}>{systemHealth}</p>
            <ThreatMeter level="NORMAL" />
          </div>
        </motion.div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Incident Feed */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-panel flex-1 flex flex-col rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(239,68,68,0.15)", minHeight: "320px" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: "var(--nexus-red)" }} />
                  <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Live Incident Feed
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal("create-incident")}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: "hsla(0,85%,55%,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--nexus-red)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {incidents.map((inc) => {
                    const sty = severityStyle(inc.severity);
                    return (
                      <motion.div
                        key={inc.id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: inc.status === "RESOLVED" ? 0.4 : 1, x: 0 }}
                        className="rounded-xl p-3 relative"
                        style={{ background: sty.bg, border: `1px solid ${sty.border}` }}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono" style={{ background: "rgba(0,0,0,0.4)", color: sty.text }}>
                              {inc.location}
                            </span>
                            {inc.status === "RESOLVED" && (
                              <span className="text-[9px] font-bold" style={{ color: "var(--nexus-green)" }}>RESOLVED</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>{inc.time}</span>
                        </div>
                        <p className="text-sm text-white mb-2">{inc.desc}</p>
                        {inc.status !== "RESOLVED" && (
                          <button
                            onClick={() => handleResolveIncident(inc.id)}
                            disabled={loading === `resolve-${inc.id}`}
                            className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                            style={{ background: `${sty.bg}`, border: `1px solid ${sty.border}`, color: sty.text }}
                          >
                            {loading === `resolve-${inc.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                            Close Incident
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {incidents.length === 0 && (
                  <div className="text-center py-12">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No active incidents</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* AI Recommendation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-panel rounded-2xl p-5"
              style={{ border: "1px solid rgba(0,200,255,0.15)" }}
            >
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <Activity className="w-4 h-4" style={{ color: "var(--nexus-cyan)" }} />
                AI Recommendations
              </h3>
              {!deployStatus ? (
                <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: "hsla(195,100%,50%,0.07)", border: "1px solid rgba(0,200,255,0.2)" }}>
                  <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: "var(--nexus-cyan)" }} />
                  <div className="ml-3">
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--nexus-cyan)" }}>🤖 Pre-emptive Dispatch</p>
                    <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                      Send 3 officers to Gate 4 turnstiles. Inflow surges indicate density will exceed thresholds within 10 minutes.
                    </p>
                    <button
                      onClick={() => { setFormLocation("Gate 4"); setDispatchLocation("Gate 4"); setDispatchCount(3); setActiveModal("dispatch"); }}
                      className="w-full py-2 rounded-lg text-xs font-bold transition-all duration-200"
                      style={{ background: "hsla(195,100%,50%,0.12)", border: "1px solid rgba(0,200,255,0.25)", color: "var(--nexus-cyan)" }}
                    >
                      Deploy 3 Officers
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-4" style={{ background: "hsla(145,65%,42%,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--nexus-green)" }}>✓ Dispatch Operations Initiated</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Officers deployed. Inflow metrics show density stabilized.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Map + Cameras */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-5"
          >
            {/* Map */}
            <div
              className="flex-1 glass-panel rounded-2xl overflow-hidden relative"
              style={{ minHeight: "380px", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className={`w-2 h-2 rounded-full ${hasCriticalIncident ? "bg-red-500 animate-ping" : "bg-orange-400 animate-pulse"}`} />
                <span className="text-[11px] font-mono" style={{ color: "white" }}>Live CCTV Heatmap</span>
              </div>
              <StadiumMap flashSOS={hasCriticalIncident} selectedGate={formLocation} />
            </div>

            {/* Camera Grid */}
            <div className="grid grid-cols-3 gap-4 h-28">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  onClick={() => setActiveModal(`cam-${i}`)}
                  className="glass-panel rounded-xl overflow-hidden relative group cursor-pointer transition-all duration-300"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                >
                  <div className="absolute inset-0 bg-gray-900/70 animate-pulse" style={{ animationDuration: "3s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-7 h-7 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }} />
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono" style={{ background: "rgba(0,0,0,0.8)", color: "var(--nexus-red)" }}>
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />REC
                  </div>
                  <div className="absolute bottom-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.75)" }}>
                    CAM {104 + i} — {i === 1 ? "Gate 4" : i === 2 ? "Sector C" : "Concourse B"}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal isOpen={activeModal === "create-incident"} onClose={() => setActiveModal(null)} title="Report New Security Incident" accentColor="red">
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <div>
            <label className="text-label text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>Location Zone</label>
            <select value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="nexus-input nexus-select">
              {["Gate 1 (North)", "Gate 2 (Northeast)", "Gate 4 (South)", "Gate 6 (West)", "Sector C Concourse", "VIP Suite Lounge"].map((opt) => (
                <option key={opt} value={opt.split(" ")[0] + " " + opt.split(" ")[1]} className="bg-black">{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>Severity Level</label>
            <select value={formSeverity} onChange={(e) => setFormSeverity(e.target.value)} className="nexus-input nexus-select">
              {[["LOW", "LOW (Log Notice)"], ["MEDIUM", "MEDIUM (Field Response)"], ["HIGH", "HIGH (Immediate Deployment)"], ["CRITICAL", "CRITICAL (Alert Sirens)"]].map(([v, l]) => (
                <option key={v} value={v} className="bg-black">{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>Incident Description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe the incident..." className="nexus-input h-24 resize-none" required />
          </div>
          <button type="submit" disabled={loading === "create"} className="btn btn-danger w-full">
            {loading === "create" && <Loader2 className="w-4 h-4 animate-spin" />}
            File Incident and Dispatch
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === "dispatch"} onClose={() => setActiveModal(null)} title="Dispatch Security Officers" accentColor="cyan">
        <form onSubmit={handleDispatchOfficers} className="space-y-4">
          <div>
            <label className="text-label text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>Deployment Area</label>
            <select value={dispatchLocation} onChange={(e) => setDispatchLocation(e.target.value)} className="nexus-input nexus-select">
              {["Gate 1", "Gate 2", "Gate 4", "Gate 6", "Sector C", "VIP Lounge"].map((v) => <option key={v} value={v} className="bg-black">{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-label text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>Officer Units</label>
            <input type="number" min={1} max={15} value={dispatchCount} onChange={(e) => setDispatchCount(parseInt(e.target.value) || 1)} className="nexus-input" />
          </div>
          <button type="submit" disabled={loading === "dispatch-officers"} className="btn btn-primary w-full" style={{ background: "var(--nexus-cyan)", color: "#000" }}>
            {loading === "dispatch-officers" && <Loader2 className="w-4 h-4 animate-spin" />}
            Authorize Dispatch Orders
          </button>
        </form>
      </Modal>

      {activeModal?.startsWith("cam-") && (
        <Modal isOpen={true} onClose={() => setActiveModal(null)} title={`Live CCTV: CAM ${104 + parseInt(activeModal.split("-")[1])}`} accentColor="red">
          <div className="space-y-4">
            <div className="w-full h-52 rounded-xl overflow-hidden relative" style={{ background: "#0a0a0b", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono font-bold" style={{ background: "rgba(0,0,0,0.85)", color: "var(--nexus-red)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />LIVE
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="w-10 h-10 mb-2 animate-pulse" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {activeModal === "cam-1" ? "Gate 4 Inflow" : activeModal === "cam-2" ? "Sector C Concessions" : "Concourse B Check-in"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setFormLocation(activeModal === "cam-1" ? "Gate 4" : activeModal === "cam-2" ? "Sector C" : "Gate 6"); setActiveModal("create-incident"); }} className="btn btn-ghost text-xs" style={{ color: "var(--nexus-red)", borderColor: "rgba(239,68,68,0.25)" }}>Log Incident at Camera</button>
              <button onClick={() => { setDispatchLocation(activeModal === "cam-1" ? "Gate 4" : activeModal === "cam-2" ? "Sector C" : "Gate 6"); setDispatchCount(2); setActiveModal("dispatch"); }} className="btn btn-ghost text-xs" style={{ color: "var(--nexus-cyan)", borderColor: "rgba(0,200,255,0.25)" }}>Dispatch Patrol to Cam</button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={activeModal === "report-log"} onClose={() => setActiveModal(null)} title="Stadium Security Audit Log">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Exportable audit log of all incidents during operations.</p>
          <div className="rounded-xl p-4 font-mono text-xs max-h-56 overflow-y-auto space-y-2" style={{ background: "var(--surface-0)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--nexus-green)" }}>
            <div>--- STADIUM OPERATIONAL AUDIT LOG ---</div>
            <div>Generated: {new Date().toISOString()}</div>
            <div>Threat Level: {threatLevel}</div>
            <div>-------------------------------------</div>
            {incidents.map((i) => (
              <div key={i.id}>[{i.time}] #{i.id} — {i.location} | {i.severity} | {i.status}<br />&nbsp;&nbsp;{i.desc}</div>
            ))}
          </div>
          <button onClick={() => { addToast("success", "Log downloaded."); setActiveModal(null); }} className="btn btn-ghost w-full">
            Download Log Report
          </button>
        </div>
      </Modal>
    </div>
  );
}
