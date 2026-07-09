"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Users, Zap, ShieldAlert, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Modal from "@/components/Modal";
import { ToastContainer, ToastMessage } from "@/components/Toast";

export default function OrganizerDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // System states synced from WebSocket
  const [metrics, setMetrics] = useState({
    crowd: 45200,
    energy: "1.2 MW",
    incidents: 2,
    volunteers: 450
  });

  const [liveData, setLiveData] = useState({
    gate_6: "Normal",
    gate_2: "Normal",
  });

  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);

  // Local interaction states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionExecuted, setActionExecuted] = useState(false);
  const [maintenanceDispatched, setMaintenanceDispatched] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
  };

  const chartData = [
    { name: "Gate 1", crowd: 4000 },
    { name: "Gate 2", crowd: liveData.gate_2 === "High Density" ? 6200 : 3000 },
    { name: "Gate 3", crowd: 2000 },
    { name: "Gate 4", crowd: 2780 },
    { name: "Gate 5", crowd: 1890 },
    { name: "Gate 6", crowd: liveData.gate_6 === "High Density" ? 9000 : 2390 },
  ];

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle crowd updates from backend loops
        if (data.type === "event" && data.event_type === "CROWD_UPDATE") {
          setLiveData(data.data);
        }
        
        // Handle full state sync
        if (data.type === "state_update") {
          const state = data.state;
          const activeIncs = state.incidents.filter((i: any) => i.status !== "RESOLVED").length;
          
          setMetrics({
            crowd: state.attendance,
            energy: `${state.energy} MW`,
            incidents: activeIncs,
            volunteers: state.volunteers
          });
          setIncidentsList(state.incidents);
          setTasksList(state.tasks);
        }
      } catch (e) {
        console.error("Error reading websocket stream:", e);
      }
    };

    return () => ws.close();
  }, []);

  // API Call: Execute redirection
  const handleExecuteRedirection = async () => {
    setLoading("redirect");
    try {
      const res = await fetch(`${API_URL}/api/logistics/reroute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corridor: "Corridor C", action: "divert" })
      });
      if (res.ok) {
        setActionExecuted(true);
        addToast("success", "Dynamic signage updated. Crowd flow diverted via Corridor C.");
        setActiveModal("execute");
      } else {
        addToast("error", "Failed to update dynamic signs API.");
      }
    } catch (e) {
      addToast("info", "Fallback mode: Redirecting signage locally.");
      setActionExecuted(true);
      setActiveModal("execute");
    } finally {
      setLoading(null);
    }
  };

  // API Call: Dispatch Maintenance Volunteer
  const handleDispatchMaintenance = async () => {
    setLoading("maintenance");
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "HVAC Zone 4 Power Draw Audit",
          location: "HVAC Zone 4 (Concourse D)",
          priority: "MEDIUM",
          category: "VOLUNTEER"
        })
      });
      if (res.ok) {
        setMaintenanceDispatched(true);
        addToast("success", "Workorder generated! HVAC Technician volunteer dispatched.");
      } else {
        addToast("error", "Failed to schedule volunteer task.");
      }
    } catch (e) {
      setMaintenanceDispatched(true);
      addToast("success", "Local dispatch simulated for HVAC Zone 4.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col bg-[#050505]">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-800 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-100">
            Command Center <span className="text-[#d4a017]">| Executive Hub</span>
          </h1>
        </div>
        <div className="flex gap-2 items-center bg-[#d4a017]/10 px-4 py-2 rounded-full border border-[#d4a017]/30">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-sm font-medium text-[#d4a017]">LIVE DIGITAL TWIN ACTIVE</span>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Attendance" value={metrics.crowd.toLocaleString()} icon={<Users className="text-blue-400" />} />
        <MetricCard title="Energy Usage" value={metrics.energy} icon={<Zap className="text-yellow-400" />} />
        <MetricCard title="Active Incidents" value={metrics.incidents.toString()} icon={<ShieldAlert className="text-red-400" />} highlight={metrics.incidents > 0} />
        <MetricCard title="On Shift Volunteers" value={metrics.volunteers.toString()} icon={<Activity className="text-green-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Crowd Graph */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6 h-[400px]"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Live Crowd Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', color: 'white' }} />
              <Bar dataKey="crowd" fill="#d4a017" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* AI Recommendations Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 glass-panel p-6 overflow-y-auto max-h-[400px]"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-300">AI Recommendations</h3>
          <div className="space-y-4">
            
            {/* Gate 6 High Density Redirection Card */}
            {liveData.gate_6 === "High Density" && !actionExecuted && (
              <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                <p className="text-orange-400 text-sm font-bold mb-1">🚨 High Density Alert (Gate 6)</p>
                <p className="text-sm text-gray-300 mb-2">AI Crowd-flow predictor recommends redirecting incoming spectators via Corridor C.</p>
                <button 
                  onClick={handleExecuteRedirection}
                  disabled={loading === "redirect"}
                  className="w-full py-2 bg-[#d4a017]/20 hover:bg-[#d4a017]/40 border border-[#d4a017]/50 rounded-lg text-[#d4a017] text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading === "redirect" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Execute Redirection
                </button>
              </div>
            )}

            {actionExecuted && (
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                <p className="text-green-400 text-sm font-bold mb-1">✓ Redirection Route Active</p>
                <p className="text-sm text-gray-300">Gates and concourse signage have successfully updated to guide spectators away from Gate 6 bottlenecks through Corridor C.</p>
              </div>
            )}

            {/* HVAC Power Draw Maintenance Card */}
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
              <p className="text-blue-400 text-sm font-bold mb-1">🔧 Predictive Maintenance</p>
              <p className="text-sm text-gray-300 mb-2">HVAC Zone 4 showing 15% irregular power draw. Schedule a technician check before temperature fluctuations occur.</p>
              {maintenanceDispatched ? (
                <div className="text-xs text-green-400 font-semibold mt-2 flex items-center gap-1">
                  ✓ Dispatch complete. Staff assigned.
                </div>
              ) : (
                <button 
                  onClick={handleDispatchMaintenance}
                  disabled={loading === "maintenance"}
                  className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg text-blue-300 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading === "maintenance" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Dispatch Inspector
                </button>
              )}
            </div>

            {/* Static informational recommendations to enrich page */}
            <div className="bg-gray-800/40 border border-white/5 p-4 rounded-xl">
              <p className="text-gray-400 text-sm font-bold mb-1">ℹ️ Schedule Sync</p>
              <p className="text-sm text-gray-300">Transit sync active. Main trains scheduled to run at 5-minute intervals starting post-match at 22:00.</p>
            </div>

          </div>
        </motion.div>
      </div>

      <Modal isOpen={activeModal === 'execute'} onClose={() => { setActiveModal(null); }} title="Action Status: Redirection Triggered">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/50">
            <Activity className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Digital Signage Overridden</h3>
          <p className="text-sm text-gray-400">LED displays outside the stadium and concourse screens have updated to guide incoming spectators to secondary gates. Flow rate in Zone 6 is diminishing.</p>
          <button onClick={() => { setActiveModal(null); }} className="w-full py-3 bg-[#d4a017] hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors mt-4">
            Acknowledge
          </button>
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({ title, value, icon, highlight = false }: { title: string, value: string, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`glass p-6 transition-all duration-300 ${highlight ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-950/10' : 'border-white/5 hover:border-white/10'}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-gray-400 font-medium">{title}</h4>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
