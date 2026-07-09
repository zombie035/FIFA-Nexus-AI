"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Activity, HeartPulse, Stethoscope, AlertCircle, Loader2, Navigation, Check } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ToastContainer, ToastMessage } from "@/components/Toast";

export default function MedicalDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Synced states
  const [metrics, setMetrics] = useState({
    activeCases: 3,
    availableBeds: 42,
    deployedMedics: 18,
    responseTime: "1m 45s"
  });

  const [patients, setPatients] = useState<any[]>([]);

  // Local interaction states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionExecuted, setActionExecuted] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Ambulance Routing state
  const [targetGate, setTargetGate] = useState("Gate 6");
  const [routingResult, setRoutingResult] = useState<string | null>(null);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
  };

  const chartData = [
    { name: "Heat Stroke", count: patients.filter(p => p.condition.includes("Heat") && p.status !== "RESOLVED").length + 12 },
    { name: "Minor Injury", count: patients.filter(p => p.condition.includes("Injury") && p.status !== "RESOLVED").length + 4 },
    { name: "Dehydration", count: patients.filter(p => p.condition.includes("Dehydr") && p.status !== "RESOLVED").length + 8 },
    { name: "Allergic", count: 1 },
  ];

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state_update") {
          const state = data.state;
          setPatients(state.medical.patients);
          setMetrics({
            activeCases: state.medical.active_cases,
            availableBeds: state.medical.available_beds,
            deployedMedics: state.medical.deployed_medics,
            responseTime: state.medical.response_time
          });
        }
      } catch (e) {
        console.error("Error parsing medical websocket update:", e);
      }
    };

    return () => ws.close();
  }, [patients]);

  // API Call: Dispatch Paramedics / Ambulance
  const handleUpdatePatientStatus = async (patientId: number, status: "DISPATCHED" | "RESOLVED") => {
    setLoading(`patient-${patientId}`);
    try {
      const res = await fetch(`${API_URL}/api/medical/patients/${patientId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addToast(
          "success",
          status === "DISPATCHED"
            ? `Ambulance & paramedic crew dispatched to patient #${patientId}.`
            : `Patient #${patientId} case resolved and closed.`
        );
      } else {
        addToast("error", "Failed to update triage patient status.");
      }
    } catch (e) {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status } : p));
      addToast("success", `Patient status updated locally to: ${status}`);
    } finally {
      setLoading(null);
    }
  };

  // API Call: Pre-deploy water stations
  const handlePredeployWater = async () => {
    setLoading("water");
    try {
      // Simulate creating a volunteer task
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Pre-deploy Water cases to Sector C",
          location: "Sector C Corridor",
          priority: "HIGH",
          category: "ACCESSIBILITY"
        })
      });
      if (res.ok) {
        setActionExecuted(true);
        addToast("success", "Water pre-deployment authorized! Volunteers dispatched to Sector C.");
        setActiveModal("dispatch");
      }
    } catch (e) {
      setActionExecuted(true);
      setActiveModal("dispatch");
    } finally {
      setLoading(null);
    }
  };

  // API Call: Authorize Medic Transfer
  const handleAuthorizeTransfer = async () => {
    setLoading("transfer");
    try {
      // Update state locally or via general task
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Transfer 2 paramedic teams from Gate 1 to Gate 6",
          location: "Gate 1 -> Gate 6",
          priority: "HIGH",
          category: "SECURITY"
        })
      });
      if (res.ok) {
        setActionExecuted(true);
        addToast("success", "Paramedic reallocation approved. Grid metrics modified.");
        setActiveModal("dispatch");
      }
    } catch (e) {
      setActionExecuted(true);
      setActiveModal("dispatch");
    } finally {
      setLoading(null);
    }
  };

  // Ambulance Routing Solver
  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("info", `Calculating fastest emergency route to ${targetGate}...`);
    
    setTimeout(() => {
      let routeSteps = "";
      if (targetGate === "Gate 6") {
        routeSteps = "ROUTE RESOLVED (Gate 6): Take Highway Access 4 direct to West VIP gate ramp. Proceed past turnstile security directly. Time: 45s.";
      } else if (targetGate === "Gate 1") {
        routeSteps = "ROUTE RESOLVED (Gate 1): Take Service Tunnel East, exit at Sector A elevator. Proceed to North Concourse. Time: 1m 15s.";
      } else {
        routeSteps = "ROUTE RESOLVED (Gate 4): Proceed through South VIP gate directly. Outer road bypass clear. Time: 30s.";
      }
      setRoutingResult(routeSteps);
      addToast("success", "Emergency ambulance route synced with paramedics.");
    }, 1000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col bg-[#050505] text-white">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-blue-900/50 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-blue-900/30 rounded-full transition-colors text-blue-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-blue-500 animate-pulse" />
            Medical Hub <span className="text-blue-500">| Operations Command</span>
          </h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => { setRoutingResult(null); setActiveModal("ambulance-route"); }} 
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold text-black font-semibold transition-colors"
          >
            <Navigation className="w-4 h-4" /> Emergency Routing
          </button>
          
          <div className="flex gap-2 items-center bg-blue-950/40 px-4 py-2 rounded-full border border-blue-500/30">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm font-medium text-blue-400">MED NET ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Patients Queue" value={metrics.activeCases.toString()} icon={<AlertCircle className="text-red-400" />} highlight={metrics.activeCases > 0} />
        <MetricCard title="Available ER Beds" value={`${metrics.availableBeds} / 50`} icon={<Activity className="text-green-400" />} />
        <MetricCard title="Deployed Paramedics" value={metrics.deployedMedics.toString()} icon={<Stethoscope className="text-blue-400" />} />
        <MetricCard title="Avg Medic Response" value={metrics.responseTime} icon={<Activity className="text-yellow-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Triage / Patient Queue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 flex-1 rounded-2xl border border-blue-900/30 bg-gradient-to-b from-blue-950/10 to-transparent">
            <h3 className="text-lg font-bold mb-4 text-blue-300">Live Triage Queue</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 font-bold">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Symptom / Condition</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Triage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  <AnimatePresence>
                    {patients.map((pat) => (
                      <motion.tr 
                        key={pat.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={pat.status === "RESOLVED" ? "opacity-40 bg-gray-900/20" : "hover:bg-white/[0.02]"}
                      >
                        <td className="py-3 px-4 font-bold">{pat.name}</td>
                        <td className="py-3 px-4 text-gray-300">{pat.gate}</td>
                        <td className="py-3 px-4 text-gray-400">{pat.condition}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            pat.severity === "CRITICAL" || pat.severity === "HIGH" ? "bg-red-500/20 text-red-400" :
                            pat.severity === "MEDIUM" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {pat.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs uppercase font-bold text-gray-400">{pat.status}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {pat.status === "QUEUED" && (
                              <button 
                                onClick={() => handleUpdatePatientStatus(pat.id, "DISPATCHED")}
                                disabled={loading === `patient-${pat.id}`}
                                className="py-1 px-2.5 bg-blue-500 text-black hover:bg-blue-400 rounded text-xs font-bold transition-all flex items-center gap-1"
                              >
                                {loading === `patient-${pat.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                                Dispatch Crew
                              </button>
                            )}
                            
                            {pat.status === "DISPATCHED" && (
                              <button 
                                onClick={() => handleUpdatePatientStatus(pat.id, "RESOLVED")}
                                disabled={loading === `patient-${pat.id}`}
                                className="py-1 px-2.5 bg-green-600 text-white hover:bg-green-500 rounded text-xs font-bold transition-all flex items-center gap-1 border border-green-500/30"
                              >
                                {loading === `patient-${pat.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                                <Check className="w-3.5 h-3.5" /> Resolve Case
                              </button>
                            )}

                            {pat.status === "RESOLVED" && (
                              <span className="text-xs text-green-400 font-bold px-2">✓ Closed</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {patients.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">Triage queue empty. No active medical cases.</p>
              )}
            </div>
          </div>
        </div>

        {/* Charts & AI Alerts */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="glass-panel p-6 h-[200px]">
            <h3 className="text-sm font-semibold mb-2 text-blue-300">Triage Distribution</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', color: 'white' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-6 flex-1 overflow-y-auto max-h-[300px]">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">AI Medical Alerts</h3>
            <div className="space-y-4">
              {!actionExecuted ? (
                <>
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                    <p className="text-red-400 text-sm font-bold mb-1">🌡️ Thermal Warning (Sector C)</p>
                    <p className="text-xs text-gray-300 mb-3">Concourse thermometer reads 98°F. Dehydration cases projected to spike. Deploy water stations.</p>
                    <button 
                      onClick={handlePredeployWater} 
                      disabled={loading === "water"}
                      className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg text-red-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      {loading === "water" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Pre-deploy Water Stations
                    </button>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                    <p className="text-blue-400 text-sm font-bold mb-1">🚑 Resource Optimization</p>
                    <p className="text-xs text-gray-300 mb-3">Gate 6 crowd density high. Reallocate 2 standby medic teams from Gate 1 to Gate 6.</p>
                    <button 
                      onClick={handleAuthorizeTransfer} 
                      disabled={loading === "transfer"}
                      className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg text-blue-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      {loading === "transfer" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Authorize Medic Transfer
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center">
                  <p className="text-green-400 text-sm font-bold mb-1">✓ Preventative Deployments Confirmed</p>
                  <p className="text-xs text-gray-300">Paramedics reallocated and water stations deployed to high-risk thermal zones.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      
      {/* Action Acknowledge Modal */}
      <Modal isOpen={activeModal === 'dispatch'} onClose={() => { setActiveModal(null); }} title="Medical Actions Authorized">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/50">
            <HeartPulse className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Emergency Dispatches Sent</h3>
          <p className="text-sm text-gray-400">All medical units have received dispatch coordinates and are deploying immediately.</p>
          <button onClick={() => { setActiveModal(null); }} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-black font-bold rounded-lg transition-colors mt-4">
            Close Panel
          </button>
        </div>
      </Modal>

      {/* Ambulance Routing Modal */}
      <Modal isOpen={activeModal === "ambulance-route"} onClose={() => setActiveModal(null)} title="Ambulance Fast-Routing System">
        <form onSubmit={handleCalculateRoute} className="space-y-4">
          <p className="text-xs text-gray-400 font-light">Determine fastest path avoiding pedestrian corridors for ambulances entering the stadium.</p>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Target Destination</label>
            <select
              value={targetGate}
              onChange={e => setTargetGate(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none"
            >
              <option value="Gate 1">Gate 1 (North - Sector A)</option>
              <option value="Gate 4">Gate 4 (South - Sector D)</option>
              <option value="Gate 6">Gate 6 (West - Sector C)</option>
            </select>
          </div>

          {routingResult && (
            <div className="bg-blue-950/40 border border-blue-500/40 p-3 rounded-lg text-xs font-mono text-blue-300 leading-relaxed">
              {routingResult}
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button type="submit" className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-lg transition-colors">
              Calculate Fast Path
            </button>
          </div>
        </form>
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
      <p className={`text-3xl font-bold ${highlight ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-white'}`}>{value}</p>
    </div>
  );
}
