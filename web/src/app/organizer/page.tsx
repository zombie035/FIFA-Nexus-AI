"use client";

import { useEffect, useState } from "react";
import { Users, Zap, ShieldAlert, Activity, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Modal from "@/components/Modal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import NavHeader from "@/components/NavHeader";

// ─── Holographic Stat Card ──────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
  accentBorder: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  highlight?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, icon, accent, accentBg, accentBorder, trend, trendLabel, highlight, onClick }: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "var(--nexus-green)" : trend === "down" ? "var(--nexus-red)" : "var(--text-tertiary)";

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        boxShadow: highlight ? `0 0 30px ${accent}22` : "0 4px 20px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => onClick && ((e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${accentBorder}, 0 8px 30px rgba(0,0,0,0.5), 0 0 40px ${accent}18`)}
      onMouseLeave={(e) => onClick && ((e.currentTarget as HTMLElement).style.boxShadow = highlight ? `0 0 30px ${accent}22` : "0 4px 20px rgba(0,0,0,0.3)")}
    >
      {/* Animated top glow bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-label text-[9px] mb-1" style={{ color: "var(--text-tertiary)" }}>{title}</p>
          <p
            className="text-data text-3xl font-bold tabular-nums"
            style={{ color: highlight ? accent : "white", letterSpacing: "-0.02em", textShadow: highlight ? `0 0 20px ${accent}55` : "none" }}
          >
            {value}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          {icon}
        </div>
      </div>

      {trend && trendLabel && (
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
          <span className="text-[11px] font-medium" style={{ color: trendColor }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Directive Card ─────────────────────────────────────────────────────────
interface DirectiveCardProps {
  type: "warn" | "ok" | "info";
  title: string;
  body: string;
  cta?: string;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  onCta?: () => void;
  resolved?: boolean;
}

function DirectiveCard({ type, title, body, cta, ctaLoading, ctaDisabled, onCta, resolved }: DirectiveCardProps) {
  const config = {
    warn:  { accent: "var(--nexus-gold)",  bg: "hsla(43,90%,48%,0.07)",  border: "rgba(212,160,23,0.25)", dot: "var(--nexus-gold)",  label: "ACTION REQUIRED" },
    ok:    { accent: "var(--nexus-green)", bg: "hsla(145,65%,42%,0.07)", border: "rgba(74,222,128,0.25)", dot: "var(--nexus-green)", label: "RESOLVED"         },
    info:  { accent: "var(--nexus-cyan)",  bg: "hsla(195,100%,50%,0.06)",border: "rgba(0,200,255,0.2)",   dot: "var(--nexus-cyan)",  label: "INFO"             },
  }[type];

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
    >
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: config.accent }} />
      <div className="ml-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.dot }} />
            <span className="text-label text-[9px]" style={{ color: config.accent }}>{config.label}</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-white mb-1">{title}</p>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{body}</p>
        {cta && !ctaDisabled && (
          <button
            onClick={onCta}
            disabled={ctaLoading}
            className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
            style={{ background: `${config.accent}18`, border: `1px solid ${config.border}`, color: config.accent }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${config.accent}30`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `${config.accent}18`)}
          >
            {ctaLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {cta}
          </button>
        )}
        {ctaDisabled && resolved && (
          <div className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--nexus-green)" }}>
            ✓ Action completed
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [metrics, setMetrics] = useState({ crowd: 45200, energy: "1.2 MW", incidents: 2, volunteers: 450 });
  const [liveData, setLiveData] = useState({ gate_6: "Normal", gate_2: "Normal" });
  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionExecuted, setActionExecuted] = useState(false);
  const [maintenanceDispatched, setMaintenanceDispatched] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [chartAnimated, setChartAnimated] = useState(false);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const chartData = [
    { name: "Gate 1", crowd: 4000 },
    { name: "Gate 2", crowd: liveData.gate_2 === "High Density" ? 6200 : 3000 },
    { name: "Gate 3", crowd: 2000 },
    { name: "Gate 4", crowd: 2780 },
    { name: "Gate 5", crowd: 1890 },
    { name: "Gate 6", crowd: liveData.gate_6 === "High Density" ? 9000 : 2390 },
  ];

  const maxCrowd = Math.max(...chartData.map((d) => d.crowd));

  useEffect(() => {
    setTimeout(() => setChartAnimated(true), 500);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "event" && data.event_type === "CROWD_UPDATE") setLiveData(data.data);
        if (data.type === "state_update") {
          const state = data.state;
          setMetrics({
            crowd: state.attendance,
            energy: `${state.energy} MW`,
            incidents: state.incidents.filter((i: any) => i.status !== "RESOLVED").length,
            volunteers: state.volunteers,
          });
          setIncidentsList(state.incidents);
          setTasksList(state.tasks);
        }
      } catch (e) { console.error(e); }
    };
    return () => ws.close();
  }, []);

  const handleExecuteRedirection = async () => {
    setLoading("redirect");
    try {
      const res = await fetch(`${API_URL}/api/logistics/reroute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corridor: "Corridor C", action: "divert" }),
      });
      if (res.ok) { setActionExecuted(true); addToast("success", "Dynamic signage updated. Crowd diverted via Corridor C."); setActiveModal("execute"); }
      else { addToast("error", "Failed to update dynamic signs API."); }
    } catch {
      addToast("info", "Fallback mode: Redirecting signage locally.");
      setActionExecuted(true); setActiveModal("execute");
    } finally { setLoading(null); }
  };

  const handleDispatchMaintenance = async () => {
    setLoading("maintenance");
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "HVAC Zone 4 Power Draw Audit", location: "HVAC Zone 4 (Concourse D)", priority: "MEDIUM", category: "VOLUNTEER" }),
      });
      if (res.ok) { setMaintenanceDispatched(true); addToast("success", "Workorder generated! HVAC Technician dispatched."); }
      else { addToast("error", "Failed to schedule volunteer task."); }
    } catch { setMaintenanceDispatched(true); addToast("success", "Local dispatch simulated for HVAC Zone 4."); }
    finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <NavHeader
        title="Command Center"
        subtitle="Executive Hub"
        accentColor="gold"
        statusLabel="DIGITAL TWIN ACTIVE"
        statusVariant="live"
      />

      <div className="flex-1 px-6 py-8 max-w-[1440px] mx-auto w-full space-y-8">

        {/* ── Stat Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            title="Total Attendance"
            value={metrics.crowd.toLocaleString()}
            icon={<Users className="w-4 h-4" style={{ color: "var(--nexus-cyan)" }} />}
            accent="var(--nexus-cyan)" accentBg="hsla(195,100%,50%,0.06)" accentBorder="rgba(0,200,255,0.2)"
            trend="up" trendLabel="+2.4% vs. last hour"
          />
          <StatCard
            title="Energy Usage"
            value={metrics.energy}
            icon={<Zap className="w-4 h-4" style={{ color: "var(--nexus-gold-bright)" }} />}
            accent="var(--nexus-gold-bright)" accentBg="hsla(43,90%,48%,0.06)" accentBorder="rgba(212,160,23,0.22)"
            trend="down" trendLabel="12% below baseline"
          />
          <StatCard
            title="Active Incidents"
            value={metrics.incidents.toString()}
            icon={<ShieldAlert className="w-4 h-4" style={{ color: "var(--nexus-red)" }} />}
            accent="var(--nexus-red)" accentBg="hsla(0,85%,55%,0.08)" accentBorder="rgba(239,68,68,0.3)"
            trend={metrics.incidents > 0 ? "up" : "flat"} trendLabel={metrics.incidents > 0 ? "Requires attention" : "All clear"}
            highlight={metrics.incidents > 0}
          />
          <StatCard
            title="On-Shift Volunteers"
            value={metrics.volunteers.toString()}
            icon={<Activity className="w-4 h-4" style={{ color: "var(--nexus-green)" }} />}
            accent="var(--nexus-green)" accentBg="hsla(145,65%,42%,0.06)" accentBorder="rgba(74,222,128,0.2)"
            trend="flat" trendLabel="Fully staffed"
          />
        </motion.div>

        {/* ── Chart + Directives ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crowd Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 glass-panel p-6 rounded-2xl"
            style={{ minHeight: "360px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-base font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Live Crowd Distribution
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Real-time gate inflow analysis</p>
              </div>
              <div className="data-pill data-pill-gold">
                <span className="status-dot status-dot-live" />
                LIVE
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barCategoryGap="35%">
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.12)"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.12)"
                  tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    background: "rgba(8,8,10,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    color: "white",
                    fontFamily: "JetBrains Mono",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="crowd" radius={[5, 5, 0, 0]} isAnimationActive={chartAnimated}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.crowd === maxCrowd
                          ? "var(--nexus-red)"
                          : entry.crowd > 3000
                          ? "var(--nexus-gold)"
                          : "rgba(255,255,255,0.2)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* AI Directives */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl flex flex-col gap-4 overflow-y-auto"
            style={{ maxHeight: "400px" }}
          >
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <Activity className="w-4 h-4" style={{ color: "var(--nexus-gold-bright)" }} />
              <h3
                className="text-base font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                AI Directives
              </h3>
            </div>

            <AnimatePresence>
              {liveData.gate_6 === "High Density" && !actionExecuted && (
                <motion.div key="redirect" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <DirectiveCard
                    type="warn"
                    title="High Density Alert — Gate 6"
                    body="AI predictor recommends redirecting incoming spectators via Corridor C immediately."
                    cta="Execute Redirection"
                    ctaLoading={loading === "redirect"}
                    onCta={handleExecuteRedirection}
                  />
                </motion.div>
              )}

              {actionExecuted && (
                <motion.div key="redirected" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <DirectiveCard
                    type="ok"
                    title="Redirection Route Active"
                    body="Gates and concourse signage updated. Crowd diverted via Corridor C."
                    ctaDisabled resolved
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <DirectiveCard
              type="info"
              title="Predictive Maintenance"
              body="HVAC Zone 4 showing 15% irregular power draw. Schedule technician before temperature fluctuations occur."
              cta={maintenanceDispatched ? undefined : "Dispatch Inspector"}
              ctaLoading={loading === "maintenance"}
              ctaDisabled={maintenanceDispatched}
              onCta={handleDispatchMaintenance}
              resolved={maintenanceDispatched}
            />

            <DirectiveCard
              type="info"
              title="Schedule Sync"
              body="Transit sync active. Main trains scheduled at 5-min intervals starting post-match at 22:00."
            />
          </motion.div>
        </div>
      </div>

      {/* Redirect confirmation modal */}
      <Modal isOpen={activeModal === "execute"} onClose={() => setActiveModal(null)} title="Action Status: Redirection Triggered">
        <div className="text-center space-y-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "hsla(145,65%,42%,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}
          >
            <Activity className="w-7 h-7" style={{ color: "var(--nexus-green)" }} />
          </div>
          <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Digital Signage Overridden
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            LED displays outside the stadium and concourse screens have been updated.
            Flow rate in Zone 6 is diminishing.
          </p>
          <button
            onClick={() => setActiveModal(null)}
            className="btn btn-primary w-full"
          >
            Acknowledge
          </button>
        </div>
      </Modal>
    </div>
  );
}
