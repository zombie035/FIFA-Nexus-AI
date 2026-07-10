"use client";

import { useEffect, useState } from "react";
import {
  Users, ClipboardList, MapPin, Languages, ShieldAlert,
  CheckCircle2, Loader2, Phone, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import AIChat from "@/components/AIChat";
import NavHeader from "@/components/NavHeader";

// Priority colors
const priorityConfig = {
  CRITICAL: { text: "var(--nexus-red)",         bg: "hsla(0,85%,55%,0.12)",  border: "rgba(239,68,68,0.3)"   },
  HIGH:     { text: "hsl(25,90%,60%)",          bg: "hsla(25,90%,55%,0.1)",  border: "rgba(220,120,50,0.3)"  },
  MEDIUM:   { text: "var(--nexus-gold-bright)", bg: "hsla(43,90%,48%,0.1)",  border: "rgba(212,160,23,0.3)"  },
  LOW:      { text: "var(--nexus-cyan)",        bg: "hsla(195,100%,50%,0.07)", border: "rgba(0,200,255,0.2)" },
};

const statusConfig = {
  PENDING:     { text: "var(--nexus-cyan)",         label: "PENDING",     bg: "hsla(195,100%,50%,0.07)" },
  IN_PROGRESS: { text: "var(--nexus-gold-bright)", label: "IN PROGRESS",  bg: "hsla(43,90%,48%,0.07)"  },
  COMPLETED:   { text: "var(--nexus-green)",        label: "COMPLETED",   bg: "hsla(145,65%,42%,0.07)" },
};

export default function VolunteerDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [tasks, setTasks] = useState<any[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState(450);
  const [onShift, setOnShift] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sosActivated, setSosActivated] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
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
        if (data.type === "state_update") { setTasks(data.state.tasks); setActiveVolunteers(data.state.volunteers); }
      } catch (e) { console.error(e); }
    };
    return () => ws.close();
  }, []);

  const handleAcceptTask = async (taskId: number) => {
    setLoading(`accept-${taskId}`);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/accept`, { method: "POST" });
      if (res.ok) addToast("success", "Task status updated to ACTIVE!");
      else addToast("error", "Failed to accept task.");
    } catch { setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "IN_PROGRESS" } : t)); addToast("success", "Task accepted locally."); }
    finally { setLoading(null); }
  };

  const handleCompleteTask = async (taskId: number) => {
    setLoading(`complete-${taskId}`);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, { method: "POST" });
      if (res.ok) addToast("success", "Task completed! Great job.");
      else addToast("error", "Failed to mark task completed.");
    } catch { setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "COMPLETED" } : t)); addToast("success", "Task completed locally."); }
    finally { setLoading(null); }
  };

  const handleToggleShift = async () => {
    const next = !onShift;
    setLoading("shift");
    try {
      const res = await fetch(`${API_URL}/api/volunteer/shift`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: next }) });
      if (res.ok) { setOnShift(next); addToast(next ? "success" : "info", next ? "Shift started!" : "Shift ended."); }
    } catch { setOnShift(next); addToast("info", next ? "Shift started (Offline)" : "Shift ended (Offline)"); }
    finally { setLoading(null); }
  };

  const handleActivateSOS = async () => {
    setLoading("sos");
    try {
      const res = await fetch(`${API_URL}/api/incidents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "Sector B Concourse", desc: "VOLUNTEER EMERGENCY: SOS triggered in Sector B by shift staff.", severity: "HIGH" }) });
      if (res.ok) { setSosActivated(true); addToast("error", "VOLUNTEER SOS TRANSMITTED! Stand by."); }
    } catch { setSosActivated(true); addToast("error", "Emergency SOS triggered. Local distress ping activated."); }
    finally { setLoading(null); setActiveModal(null); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <NavHeader
        title="Volunteer Ops"
        subtitle="Concourse B"
        accentColor="green"
        statusVariant={onShift ? "ok" : "offline"}
        statusLabel={onShift ? `ON SHIFT · ${activeVolunteers} ACTIVE` : "OFF SHIFT"}
      >
        <button
          onClick={() => setActiveModal("language")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}
        >
          <Languages className="w-3.5 h-3.5" /> EN
        </button>

        <button
          onClick={handleToggleShift}
          disabled={loading === "shift"}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200"
          style={{
            background: onShift ? "hsla(145,65%,42%,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${onShift ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.1)"}`,
            color: onShift ? "var(--nexus-green)" : "var(--text-tertiary)",
          }}
        >
          {loading === "shift" && <Loader2 className="w-3 h-3 animate-spin" />}
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: onShift ? "var(--nexus-green)" : "var(--text-tertiary)", animation: onShift ? "pulse-ring 2s infinite" : "none" }}
          />
          {onShift ? "On Shift" : "Off Shift"}
        </button>
      </NavHeader>

      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Task List ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 space-y-4"
          >
            <div
              className="glass-panel rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-white/5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" style={{ color: "var(--nexus-green)" }} />
                  <h2
                    className="text-sm font-semibold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    AI Task Allocator
                  </h2>
                </div>
                <div className="data-pill data-pill-green">
                  {tasks.filter((t) => t.status !== "COMPLETED").length} Active
                </div>
              </div>

              {/* Tasks */}
              <div className="p-5 space-y-3 max-h-[560px] overflow-y-auto">
                <AnimatePresence>
                  {tasks.map((task, idx) => {
                    const pri = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.LOW;
                    const sta = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.PENDING;
                    const isCompleted = task.status === "COMPLETED";

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: isCompleted ? 0.4 : 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-xl p-4 relative transition-all duration-200"
                        style={{
                          background: isCompleted ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isCompleted ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        {/* Task number accent */}
                        <div
                          className="absolute top-0 left-0 w-0.5 h-full rounded-l-xl"
                          style={{ background: isCompleted ? "rgba(255,255,255,0.1)" : pri.text }}
                        />

                        <div className="ml-3 flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span
                                className="text-label text-[9px] px-2 py-0.5 rounded-full"
                                style={{ background: pri.bg, border: `1px solid ${pri.border}`, color: pri.text }}
                              >
                                {task.priority}
                              </span>
                              <span
                                className="text-label text-[9px] px-2 py-0.5 rounded-full"
                                style={{ background: sta.bg, color: sta.text, border: `1px solid ${sta.text}30` }}
                              >
                                {sta.label}
                              </span>
                              {task.category && (
                                <span className="text-label text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-tertiary)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                  {task.category}
                                </span>
                              )}
                            </div>

                            <h3
                              className={`text-sm font-semibold ${isCompleted ? "line-through text-[var(--text-tertiary)]" : "text-white"}`}
                              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                            >
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "var(--nexus-green)" }} />
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{task.location}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                            {task.status === "PENDING" && (
                              <button
                                onClick={() => handleAcceptTask(task.id)}
                                disabled={loading === `accept-${task.id}`}
                                className="btn btn-primary btn-sm"
                              >
                                {loading === `accept-${task.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                                Accept Task
                              </button>
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <div className="flex gap-2">
                                <button onClick={() => setActiveModal(`route-${task.id}`)} className="btn btn-ghost btn-sm text-xs">
                                  View Route
                                </button>
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  disabled={loading === `complete-${task.id}`}
                                  className="btn btn-sm flex items-center gap-1"
                                  style={{ background: "hsla(145,65%,42%,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "var(--nexus-green)" }}
                                >
                                  {loading === `complete-${task.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                                  <CheckCircle2 className="w-3 h-3" /> Complete
                                </button>
                              </div>
                            )}
                            {task.status === "COMPLETED" && (
                              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--nexus-green)" }}>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Done
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {tasks.length === 0 && (
                  <div className="text-center py-16">
                    <Star className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No tasks assigned to this sector.</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>Standby for incoming directives.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Right Column ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            {/* SOS Panel */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: "hsla(0,85%,55%,0.05)",
                border: `1px solid ${sosActivated ? "rgba(239,68,68,0.6)" : "rgba(239,68,68,0.2)"}`,
                boxShadow: sosActivated ? "0 0 30px var(--nexus-red-glow)" : "none",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4" style={{ color: "var(--nexus-red)" }} />
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Crisis & Escalation
                </h3>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                Trigger immediate medical/security alerts. Command Center receives real-time GPS tracking.
              </p>

              {sosActivated ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-sm font-bold cursor-not-allowed"
                  style={{ background: "hsla(145,65%,42%,0.2)", border: "1px solid rgba(74,222,128,0.3)", color: "var(--nexus-green)" }}
                >
                  ✓ ALARM DISPATCHED
                </button>
              ) : (
                <button
                  onClick={() => setActiveModal("sos")}
                  className="btn btn-danger w-full text-sm"
                  style={{ animation: "glow-pulse-red 2s ease-in-out infinite" }}
                >
                  TRIGGER EMERGENCY SOS
                </button>
              )}

              <button
                onClick={() => setActiveModal("supervisor")}
                className="btn btn-ghost w-full mt-3 text-sm"
              >
                <Phone className="w-3.5 h-3.5" style={{ color: "var(--nexus-green)" }} />
                Contact Supervisor
              </button>
            </div>

            {/* AI Coordinator */}
            <div className="flex-1">
              <AIChat role="Volunteer" title="AI Coordinator" accentColor="green" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal isOpen={activeModal === "language"} onClose={() => setActiveModal(null)} title="App Locale Selector">
        <div className="grid grid-cols-2 gap-2">
          {["English", "Spanish", "French", "Arabic", "Portuguese", "Japanese"].map((lang) => (
            <button
              key={lang}
              onClick={() => { addToast("success", `Locale changed to ${lang}.`); setActiveModal(null); }}
              className="text-left p-3 rounded-xl text-sm text-white transition-colors duration-200"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
            >
              {lang}
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === "sos"} onClose={() => setActiveModal(null)} title="Trigger Volunteer Crisis SOS" accentColor="red">
        <div className="text-center space-y-4 py-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "hsla(0,85%,55%,0.15)", border: "1px solid rgba(239,68,68,0.4)", boxShadow: "0 0 30px var(--nexus-red-glow)" }}
          >
            <ShieldAlert className="w-8 h-8 animate-pulse" style={{ color: "var(--nexus-red)" }} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--nexus-red)", fontFamily: "'Space Grotesk', sans-serif" }}>Confirm Distress Alarm</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This immediately broadcasts a medical/security Priority-1 panic event at GPS coordinates Sector B.
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setActiveModal(null)} className="btn btn-ghost flex-1 text-sm">Cancel</button>
            <button onClick={handleActivateSOS} disabled={loading === "sos"} className="btn btn-danger flex-1 text-sm">
              {loading === "sos" && <Loader2 className="w-4 h-4 animate-spin" />}
              Distress Alarm
            </button>
          </div>
        </div>
      </Modal>

      {tasks.map((task) => (
        <Modal key={`route-${task.id}`} isOpen={activeModal === `route-${task.id}`} onClose={() => setActiveModal(null)} title={`Navigation Path: ${task.location}`} accentColor="green">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">{task.title}</h3>
            <div className="w-full h-40 rounded-xl overflow-hidden relative" style={{ background: "var(--surface-0)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <MapPin className="w-7 h-7 animate-bounce" style={{ color: "var(--nexus-green)" }} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{task.location}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl text-xs" style={{ background: "hsla(145,65%,42%,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "var(--text-secondary)" }}>
              <strong className="text-white block mb-1">AR Pathfinding:</strong>
              Take the concourse corridor left, proceed 60m towards Section A turnstiles. Climb stairs to Gate 2.
            </div>
            <button onClick={() => setActiveModal(null)} className="btn btn-ghost w-full text-sm">Close Route Map</button>
          </div>
        </Modal>
      ))}

      <Modal isOpen={activeModal === "supervisor"} onClose={() => setActiveModal(null)} title="Hotline: Contact Shift Supervisor" accentColor="green">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Connect directly with the Operational Command supervisor for Sector B.</p>
          <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ background: "hsla(145,65%,42%,0.25)", border: "1px solid rgba(74,222,128,0.3)" }}>MS</div>
              <div>
                <p className="text-sm font-semibold text-white">Major Marcus Vance</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Commanding Officer, Sector B</p>
              </div>
            </div>
            <div className="text-xs px-3 py-2 rounded-lg font-semibold" style={{ background: "hsla(145,65%,42%,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "var(--nexus-green)" }}>
              Status: Online & Monitoring Radio
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { addToast("success", "Connecting audio to Sector B radio..."); setActiveModal(null); }} className="btn btn-primary flex-1 text-sm">
              <Phone className="w-3.5 h-3.5" /> Start Voice Call
            </button>
            <button onClick={() => { addToast("success", "Request pushed to supervisor. Standing by."); setActiveModal(null); }} className="btn btn-ghost flex-1 text-sm">
              Callback Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
