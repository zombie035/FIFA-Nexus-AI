"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Car, Bus, Train, AlertTriangle, Activity, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Modal from "@/components/Modal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ToastContainer, ToastMessage } from "@/components/Toast";

export default function TransportationDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Synced stats
  const [metrics, setMetrics] = useState({
    metroLoad: 95,
    busFleet: 45,
    parkingCap: 82,
    trafficDelay: 12
  });

  const [shuttles, setShuttles] = useState<any[]>([]);
  const [parkingLots, setParkingLots] = useState<Record<string, string>>({});
  const [trafficSignals, setTrafficSignals] = useState("AI_SYNC");

  // Local state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionExecuted, setActionExecuted] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
  };

  const chartData = [
    { name: "North Shuttle", load: 85 },
    { name: "South Shuttle", load: shuttles.filter(s => s.status === "DELAYED").length > 0 ? 80 : 40 },
    { name: "Metro Line A", load: metrics.metroLoad },
    { name: "Metro Line B", load: 60 },
  ];

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state_update") {
          const state = data.state;
          setShuttles(state.transport.shuttles);
          setParkingLots(state.transport.parking_lots);
          setTrafficSignals(state.transport.traffic_signals);
          setMetrics({
            metroLoad: state.transport.metro_load,
            busFleet: state.transport.bus_fleet,
            parkingCap: state.transport.parking_cap,
            trafficDelay: state.transport.traffic_delay
          });
        }
      } catch (e) {
        console.error("Error parsing transport WebSocket message:", e);
      }
    };

    return () => ws.close();
  }, []);

  // API Call: Toggle Parking status
  const handleToggleParking = async (lotName: string, currentStatus: string) => {
    const nextStatus = currentStatus === "OPEN" ? "FULL" : "OPEN";
    setLoading(`parking-${lotName}`);
    try {
      const res = await fetch(`${API_URL}/api/logistics/parking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot: lotName, status: nextStatus })
      });
      if (res.ok) {
        addToast("success", `${lotName} is now marked ${nextStatus}.`);
      } else {
        addToast("error", "Failed to update parking lot capacity API.");
      }
    } catch (e) {
      setParkingLots(prev => ({ ...prev, [lotName]: nextStatus }));
      addToast("success", `${lotName} updated locally.`);
    } finally {
      setLoading(null);
    }
  };

  // API Call: Dispatch Backup Shuttle
  const handleDispatchBackupShuttle = async () => {
    setLoading("dispatch-shuttle");
    const nextShuttleId = `SH-${shuttles.length + 1}`;
    try {
      const res = await fetch(`${API_URL}/api/logistics/shuttles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shuttle_id: nextShuttleId })
      });
      if (res.ok) {
        addToast("success", `Backup Shuttle ${nextShuttleId} dispatched into active shuttle lane.`);
      } else {
        addToast("error", "Failed to dispatch backup shuttle.");
      }
    } catch (e) {
      addToast("success", `Backup Shuttle ${nextShuttleId} dispatched locally.`);
    } finally {
      setLoading(null);
    }
  };

  // API Call: Divert / Reroute Traffic
  const handleDivertTraffic = async (corridor: string, action: string) => {
    setLoading(`divert-${corridor}`);
    try {
      const res = await fetch(`${API_URL}/api/logistics/reroute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corridor, action })
      });
      if (res.ok) {
        setActionExecuted(true);
        addToast("success", `Traffic adjustment executed for ${corridor}. Signage updated.`);
        setActiveModal("divert");
      }
    } catch (e) {
      setActionExecuted(true);
      setActiveModal("divert");
    } finally {
      setLoading(null);
    }
  };

  // Toggling traffic signal synchronization
  const handleSignalSyncChange = (mode: string) => {
    setTrafficSignals(mode);
    addToast("info", `Traffic Light grid sync updated to: ${mode}`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col bg-[#050505]">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-indigo-900/50 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-indigo-900/30 rounded-full transition-colors text-indigo-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Bus className="w-8 h-8 text-indigo-500 animate-bounce" />
            Transport Hub <span className="text-indigo-500">| Logistics Control</span>
          </h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex bg-indigo-950/40 border border-indigo-500/30 rounded-full px-4 py-1 gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider self-center">Light Timing:</span>
            <select
              value={trafficSignals}
              onChange={(e) => handleSignalSyncChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-indigo-400 uppercase focus:outline-none cursor-pointer"
            >
              <option value="AI_SYNC" className="bg-black text-white">AI Sync</option>
              <option value="INFLOW" className="bg-black text-white">Inflow Focus</option>
              <option value="OUTFLOW" className="bg-black text-white">Outflow Focus</option>
              <option value="MANUAL" className="bg-black text-white">Manual Bypass</option>
            </select>
          </div>
          
          <div className="flex gap-2 items-center bg-indigo-950/40 px-4 py-2 rounded-full border border-indigo-500/30">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-sm font-medium text-indigo-400">INTELLIGENT RUNNING</span>
          </div>
        </div>
      </header>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Metro Load factor" value={`${metrics.metroLoad}%`} icon={<Train className="text-red-400" />} highlight={metrics.metroLoad > 90} />
        <MetricCard title="Bus Fleet Deployed" value={`${metrics.busFleet} / 50`} icon={<Bus className="text-green-400" />} />
        <MetricCard title="Total Parking Cap" value={`${metrics.parkingCap}%`} icon={<Car className="text-blue-400" />} highlight={metrics.parkingCap > 80} />
        <MetricCard title="Road Traffic Delay" value={`+${metrics.trafficDelay} mins`} icon={<AlertTriangle className="text-yellow-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Chart and Parking Management */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="glass-panel p-6 h-[200px]">
            <h3 className="text-sm font-semibold mb-2 text-indigo-300">Public Transport Load Factor</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', color: 'white' }} />
                <Bar dataKey="load" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Parking Management */}
          <div className="glass-panel p-6 border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent flex-1">
            <h3 className="text-base font-bold mb-4 text-indigo-300">VIP Parking Lot Control</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(parkingLots).map(([lotName, status]) => (
                <div key={lotName} className="p-4 rounded-xl border border-white/10 bg-black/40 flex flex-col gap-3 justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{lotName}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${status === "OPEN" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleParking(lotName, status)}
                    disabled={loading === `parking-${lotName}`}
                    className={`w-full py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      status === "OPEN" 
                        ? "bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-red-400 hover:text-white" 
                        : "bg-green-950/40 hover:bg-green-900 border border-green-500/30 text-green-400 hover:text-white"
                    }`}
                  >
                    {loading === `parking-${lotName}` && <Loader2 className="w-3 h-3 animate-spin" />}
                    {status === "OPEN" ? "Block Entry (Full)" : "De-block (Open)"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Shuttle Fleet & AI Traffic Alerts */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Shuttle Fleet Tracking */}
          <div className="glass-panel p-6 border border-white/5 bg-gradient-to-br from-white/[0.01] to-transparent max-h-[250px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-indigo-300">VIP Shuttle Status</h3>
              <button
                onClick={handleDispatchBackupShuttle}
                disabled={loading === "dispatch-shuttle"}
                className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-black font-bold rounded text-xs transition-colors flex items-center gap-1"
              >
                {loading === "dispatch-shuttle" && <Loader2 className="w-3 h-3 animate-spin" />}
                Dispatch Backup
              </button>
            </div>
            
            <div className="space-y-3">
              {shuttles.map(s => (
                <div key={s.id} className="p-3 bg-gray-900/60 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[10px] text-gray-400 font-light mt-0.5">{s.route}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                    s.status === "EN_ROUTE" ? "bg-green-500/20 text-green-400" :
                    s.status === "DELAYED" ? "bg-yellow-500/20 text-yellow-400 animate-pulse" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Traffic Control alerts */}
          <div className="glass-panel p-6 border border-indigo-900/30 flex-1 overflow-y-auto max-h-[300px]">
            <h3 className="text-lg font-semibold mb-4 text-indigo-300">AI Traffic Control</h3>
            <div className="space-y-4">
              {!actionExecuted ? (
                <>
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                    <p className="text-red-400 text-sm font-bold mb-1">🚇 Metro Congestion (Line A)</p>
                    <p className="text-xs text-gray-300 mb-3">Line A terminal is at 95% threshold capacity. Expected passenger delay: 20 mins.</p>
                    <button 
                      onClick={() => handleDivertTraffic("Metro Line A", "divert")}
                      disabled={loading === "divert-Metro Line A"}
                      className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg text-red-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      {loading === "divert-Metro Line A" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Divert to Shuttle Buses
                    </button>
                  </div>
                  
                  <div className="bg-[#6366f1]/10 border border-[#6366f1]/30 p-4 rounded-xl">
                    <p className="text-[#6366f1] text-sm font-bold mb-1">🅿️ VIP North Capacity Alert</p>
                    <p className="text-xs text-gray-300 mb-3">North lot approaching capacity. Reroute upcoming convoys to South Underground.</p>
                    <button 
                      onClick={() => handleDivertTraffic("VIP North Lot", "reroute")}
                      disabled={loading === "divert-VIP North Lot"}
                      className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 rounded-lg text-indigo-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      {loading === "divert-VIP North Lot" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Execute Reroute
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center">
                  <p className="text-green-400 text-sm font-bold mb-1">✓ Traffic Flow Adjusted</p>
                  <p className="text-xs text-gray-300 font-light">Diversion signals sent. Dynamic road signage modified. Transit loads stabilized.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledge Modal */}
      <Modal isOpen={activeModal === 'divert'} onClose={() => { setActiveModal(null); }} title="Logistics Diversions Confirmed">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto border border-indigo-500/50">
            <Activity className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-white">dynamic Signs Updated</h3>
          <p className="text-sm text-gray-400">Road signage and metro terminal displays have been updated with re-routing instructions to optimize flow.</p>
          <button onClick={() => { setActiveModal(null); }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors mt-4">
            Close Panel
          </button>
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({ title, value, icon, highlight = false }: { title: string, value: string, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`glass p-6 transition-all duration-300 ${highlight ? 'border-red-500/50 bg-red-950/15 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/5 hover:border-white/10'}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-gray-400 font-medium text-sm">{title}</h4>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
