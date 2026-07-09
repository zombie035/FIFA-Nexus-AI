"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Accessibility, Ear, Eye, HandMetal, HelpingHand, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ToastContainer, ToastMessage } from "@/components/Toast";

export default function AccessibilityDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Synced states
  const [metrics, setMetrics] = useState({
    wheelchairRequests: "0 Pending",
    sensoryCap: 75,
    audioGuides: 150,
    aslVolunteers: 8
  });

  const [requests, setRequests] = useState<any[]>([]);

  // Local state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionExecuted, setActionExecuted] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Sensory Room Controller local adjustment
  const [adjustAmount, setAdjustAmount] = useState(10);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
  };

  const chartData = [
    { name: "Wheelchair Escort", count: requests.filter(r => r.type.includes("Wheelchair")).length + 45 },
    { name: "ASL Interpreter", count: requests.filter(r => r.type.includes("ASL")).length + 12 },
    { name: "Sensory Room", count: metrics.sensoryCap },
    { name: "Audio Guide", count: metrics.audioGuides },
  ];

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state_update") {
          const state = data.state;
          setRequests(state.accessibility.requests);
          const pendingWheelchair = state.accessibility.requests.filter(
            (r: any) => r.type === "Wheelchair Escort" && r.status === "PENDING"
          ).length;
          
          setMetrics({
            wheelchairRequests: `${pendingWheelchair} Pending`,
            sensoryCap: state.accessibility.sensory_cap,
            audioGuides: state.accessibility.audio_guides,
            aslVolunteers: state.accessibility.asl_volunteers
          });
        }
      } catch (e) {
        console.error("Error reading accessibility websocket update:", e);
      }
    };

    return () => ws.close();
  }, []);

  // API Call: Dispatch Guide
  const handleDispatchGuide = async (reqId: number, type: string, location: string) => {
    setLoading(`dispatch-${reqId}`);
    try {
      const res = await fetch(`${API_URL}/api/accessibility/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ req_id: reqId })
      });
      if (res.ok) {
        addToast("success", `ASL/Wheelchair Volunteer dispatched to assist with ${type} at ${location}.`);
      } else {
        addToast("error", "Failed to dispatch volunteer via API.");
      }
    } catch (e) {
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "DISPATCHED" } : r));
      addToast("success", "Volunteer dispatched locally.");
    } finally {
      setLoading(null);
    }
  };

  // API Call: Restock Audio Guides or Sensory Capacity
  const handleRestock = async (item: "audio_guides" | "sensory_cap", amount: number) => {
    setLoading(`restock-${item}`);
    try {
      const res = await fetch(`${API_URL}/api/accessibility/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, amount })
      });
      if (res.ok) {
        addToast(
          "success",
          item === "audio_guides" 
            ? `Restocked ${amount} multi-language audio guides at Sector B booth.`
            : `Sensory room capacity adjusted by ${amount}%.`
        );
        if (item === "audio_guides") {
          setActionExecuted(true);
          setActiveModal("dispatch");
        }
      } else {
        addToast("error", "Restock API error.");
      }
    } catch (e) {
      setMetrics(prev => ({
        ...prev,
        audioGuides: item === "audio_guides" ? prev.audioGuides + amount : prev.audioGuides,
        sensoryCap: item === "sensory_cap" ? Math.min(100, prev.sensoryCap + amount) : prev.sensoryCap
      }));
      addToast("success", "Inventory updated locally (Offline mode).");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col bg-[#050505] text-white">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-pink-900/50 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-pink-900/30 rounded-full transition-colors text-pink-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Accessibility className="w-8 h-8 text-pink-500 animate-pulse" />
            Accessibility Hub <span className="text-pink-500">| Inclusive Operations</span>
          </h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setActiveModal("restock-panel")}
            className="px-4 py-2 border border-pink-500/30 bg-pink-950/20 text-pink-400 hover:bg-pink-900/40 hover:text-white rounded-lg text-xs font-bold transition-all"
          >
            Inventory Management
          </button>
          
          <div className="flex gap-2 items-center bg-pink-950/40 px-4 py-2 rounded-full border border-pink-500/30">
            <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"></div>
            <span className="text-sm font-medium text-pink-400">SERVICES ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Wheelchair Escorts" value={metrics.wheelchairRequests} icon={<HelpingHand className="text-orange-400" />} highlight={metrics.wheelchairRequests !== "0 Pending"} />
        <MetricCard title="Sensory Room Capacity" value={`${metrics.sensoryCap}%`} icon={<Eye className="text-green-400" />} highlight={metrics.sensoryCap > 85} />
        <MetricCard title="Audio Guides Available" value={metrics.audioGuides.toString()} icon={<Ear className="text-blue-400" />} />
        <MetricCard title="Active ASL Volunteers" value={`${metrics.aslVolunteers} Active`} icon={<HandMetal className="text-pink-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Service Requests Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 flex-1 rounded-2xl border border-pink-900/30 bg-gradient-to-b from-pink-950/10 to-transparent">
            <h3 className="text-lg font-bold mb-4 text-pink-300">Live Support Requests</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 font-bold">
                    <th className="py-3 px-4">Request Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  <AnimatePresence>
                    {requests.map(req => (
                      <motion.tr 
                        key={req.id} 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={req.status === "DISPATCHED" ? "opacity-50" : "hover:bg-white/[0.01]"}
                      >
                        <td className="py-3 px-4 font-semibold text-white">{req.type}</td>
                        <td className="py-3 px-4 text-gray-300">{req.location}</td>
                        <td className="py-3 px-4 text-xs font-bold uppercase text-pink-400 tracking-wider">{req.status}</td>
                        <td className="py-3 px-4 text-right">
                          {req.status === "PENDING" ? (
                            <button
                              onClick={() => handleDispatchGuide(req.id, req.type, req.location)}
                              disabled={loading === `dispatch-${req.id}`}
                              className="py-1 px-3 bg-pink-600 hover:bg-pink-500 text-white rounded text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                            >
                              {loading === `dispatch-${req.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                              Dispatch Guide
                            </button>
                          ) : (
                            <span className="text-xs text-green-400 font-bold px-2">✓ Dispatched</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="glass-panel p-6 h-[200px]">
            <h3 className="text-sm font-semibold mb-2 text-pink-300">Inclusive Service Requests Load</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#666" fontSize={9} />
                <YAxis stroke="#666" fontSize={9} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', color: 'white' }} />
                <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-6 flex-1 overflow-y-auto max-h-[300px]">
            <h3 className="text-lg font-semibold mb-4 text-pink-300">AI Coordinator Alerts</h3>
            <div className="space-y-4">
              {!actionExecuted ? (
                <>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                    <p className="text-orange-400 text-sm font-bold mb-1">♿ High Wheelchair Demand (Gate 2)</p>
                    <p className="text-xs text-gray-300 mb-3">Gate 2 turnstiles currently require 3 additional wheelchair escort volunteers immediately.</p>
                    <button 
                      onClick={() => handleDispatchGuide(1, "Wheelchair Escort", "Gate 2")}
                      disabled={loading?.startsWith("dispatch-")}
                      className="w-full py-2 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 rounded-lg text-orange-300 text-xs font-semibold transition-colors"
                    >
                      Dispatch Volunteers
                    </button>
                  </div>
                  
                  <div className="bg-pink-500/10 border border-pink-500/30 p-4 rounded-xl">
                    <p className="text-pink-400 text-sm font-bold mb-1">🔊 Audio Guide Replenish</p>
                    <p className="text-xs text-gray-300 mb-3">Sector B equipment booth is running low on multilingual audio guides. Stock level below 15%.</p>
                    <button 
                      onClick={() => handleRestock("audio_guides", 50)}
                      disabled={loading?.startsWith("restock-")}
                      className="w-full py-2 bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/50 rounded-lg text-pink-300 text-xs font-semibold transition-colors"
                    >
                      Restock Equipment
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center">
                  <p className="text-green-400 text-sm font-bold mb-1">✓ Resources Dispatched</p>
                  <p className="text-xs text-gray-300 font-light">Escorts successfully assigned and audio guides replenished in all concourse zones.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      
      {/* Action Acknowledge */}
      <Modal isOpen={activeModal === 'dispatch'} onClose={() => { setActiveModal(null); }} title="Inclusive Action Authorized">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto border border-pink-500/50">
            <HelpingHand className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Accessibility Dispatch Confirmed</h3>
          <p className="text-sm text-gray-400">Volunteers and equipment cases have been successfully reallocated. Status coordinates updated in Command Center.</p>
          <button onClick={() => { setActiveModal(null); }} className="w-full py-3 bg-[#ec4899] hover:bg-pink-500 text-white font-bold rounded-lg transition-colors mt-4">
            Acknowledge
          </button>
        </div>
      </Modal>

      {/* Inventory Management Modal */}
      <Modal isOpen={activeModal === "restock-panel"} onClose={() => setActiveModal(null)} title="Accessibility Inventory Control">
        <div className="space-y-4">
          <p className="text-xs text-gray-400 font-light">Adjust inventory status or sensory room load factor manually.</p>
          
          <div className="p-4 bg-[#121212] border border-white/5 rounded-xl flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-white">Sensory Room Capacity</h4>
              <p className="text-xs text-gray-400 mt-1">Current: {metrics.sensoryCap}% Occupancy</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleRestock("sensory_cap", -10)}
                disabled={loading?.startsWith("restock-")}
                className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-bold"
              >
                Free Space (-10%)
              </button>
              <button 
                onClick={() => handleRestock("sensory_cap", 10)}
                disabled={loading?.startsWith("restock-")}
                className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold"
              >
                Book Space (+10%)
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#121212] border border-white/5 rounded-xl flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-white">Audio Guide Inventory</h4>
              <p className="text-xs text-gray-400 mt-1">Current: {metrics.audioGuides} Units Available</p>
            </div>
            <button 
              onClick={() => handleRestock("audio_guides", 25)}
              disabled={loading?.startsWith("restock-")}
              className="px-3 py-1.5 bg-[#d4a017] hover:bg-yellow-400 text-black font-bold rounded text-xs"
            >
              Add 25 Guides
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({ title, value, icon, highlight = false }: { title: string, value: string, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`glass p-6 transition-all duration-300 ${highlight ? 'border-orange-500/50 bg-orange-950/15 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-white/5 hover:border-white/10'}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-gray-400 font-medium text-sm">{title}</h4>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
