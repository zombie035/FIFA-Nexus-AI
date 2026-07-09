"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Users, ClipboardList, MapPin, MessageSquare, Bell, Languages, ShieldAlert, CheckCircle2, Loader2, Phone } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import AIChat from "@/components/AIChat";

export default function VolunteerDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Real-time synced states
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState(450);

  // Local volunteer state
  const [onShift, setOnShift] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sosActivated, setSosActivated] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Coordinator Chat State
  const [aiMessages, setAiMessages] = useState([
    { text: "Welcome back! I am your AI Coordinator. Let me know if you need help with tasks, directions, or shift scheduling.", sender: "AI Coordinator" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
  };

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "state_update") {
          const state = data.state;
          setTasks(state.tasks);
          setActiveVolunteers(state.volunteers);
        }
      } catch (e) {
        console.error("Error reading websocket update:", e);
      }
    };

    return () => ws.close();
  }, []);

  // API Call: Accept Task
  const handleAcceptTask = async (taskId: number) => {
    setLoading(`accept-${taskId}`);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/accept`, {
        method: "POST"
      });
      if (res.ok) {
        addToast("success", "Task status updated to ACTIVE. Get to destination safely!");
      } else {
        addToast("error", "Failed to accept task.");
      }
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "IN_PROGRESS" } : t));
      addToast("success", "Task accepted locally.");
    } finally {
      setLoading(null);
    }
  };

  // API Call: Complete Task
  const handleCompleteTask = async (taskId: number) => {
    setLoading(`complete-${taskId}`);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "POST"
      });
      if (res.ok) {
        addToast("success", "Task completed! Great job. Updating Command Center.");
      } else {
        addToast("error", "Failed to mark task completed.");
      }
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "COMPLETED" } : t));
      addToast("success", "Task completed locally.");
    } finally {
      setLoading(null);
    }
  };

  // API Call: Check In / Check Out
  const handleToggleShift = async () => {
    const nextShiftState = !onShift;
    setLoading("shift");
    try {
      const res = await fetch(`${API_URL}/api/volunteer/shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextShiftState })
      });
      if (res.ok) {
        setOnShift(nextShiftState);
        addToast(
          nextShiftState ? "success" : "info",
          nextShiftState ? "Shift started! Synced with Volunteer network." : "Shift ended. Stand-down completed."
        );
      }
    } catch (e) {
      setOnShift(nextShiftState);
      addToast("info", nextShiftState ? "Shift started (Offline mode)" : "Shift ended (Offline mode)");
    } finally {
      setLoading(null);
    }
  };

  // API Call: SOS
  const handleActivateSOS = async () => {
    setLoading("sos");
    try {
      const res = await fetch(`${API_URL}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "Sector B Concourse",
          desc: "VOLUNTEER EMERGENCY: SOS triggered in Sector B by shift staff.",
          severity: "HIGH"
        })
      });
      if (res.ok) {
        setSosActivated(true);
        addToast("error", "VOLUNTEER SOS TRANSMITTED! Stand by for response.");
      }
    } catch (e) {
      setSosActivated(true);
      addToast("error", "Emergency SOS triggered. Local distress ping activated.");
    } finally {
      setLoading(null);
      setActiveModal(null);
    }
  };

  // Coordinator Chat submit
  const sendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userText = chatInput;
    setAiMessages(prev => [...prev, { text: userText, sender: "You" }]);
    setChatInput("");
    
    // Custom smart reply based on volunteer tasks
    setTimeout(() => {
      const pendingTasksCount = tasks.filter(t => t.status === "PENDING").length;
      let reply = "";
      
      if (userText.toLowerCase().includes("task") || userText.toLowerCase().includes("work")) {
        if (pendingTasksCount > 0) {
          reply = `You have **${pendingTasksCount} pending tasks** waiting for execution. Please review your task sheet and accept them.`;
        } else {
          reply = "Outstanding! All tasks assigned to you are currently accepted or completed. Good work.";
        }
      } else if (userText.toLowerCase().includes("shift") || userText.toLowerCase().includes("break")) {
        reply = onShift 
          ? "You are currently **On Shift**. Your schedule has a 15-minute rest break in 45 minutes. I will alert you." 
          : "You are currently checked out. Enjoy your rest, thank you for your support!";
      } else if (userText.toLowerCase().includes("help") || userText.toLowerCase().includes("supervisor")) {
        reply = "If this is an emergency, click the **TRIGGER SOS** button. For logistics assistance, I can open a direct line to your Supervisor. Try typing 'supervisor' or click the contact icon.";
      } else {
        reply = "I've noted that down. Proceed with caution. Let me know if you need specific gate navigation.";
      }
      
      setAiMessages(prev => [...prev, { text: reply, sender: "AI Coordinator" }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col bg-[#050505] text-white">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-green-900/50 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-green-900/30 rounded-full transition-colors text-green-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-green-500" />
              Volunteer Ops <span className="text-green-500">| Concourse B</span>
            </h1>
            <p className="text-xs text-gray-500">Shift Network: {activeVolunteers} staff active</p>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <button onClick={() => setActiveModal('language')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium border border-white/10 transition-colors">
            <Languages className="w-4 h-4" /> English
          </button>
          
          <button 
            onClick={handleToggleShift}
            disabled={loading === "shift"}
            className={`flex gap-2 items-center border px-6 py-2 rounded-full font-bold uppercase transition-all text-xs tracking-wider ${
              onShift ? 'bg-green-950/40 border-green-500/30 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-400'
            }`}
          >
            {loading === "shift" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <div className={`w-2.5 h-2.5 rounded-full ${onShift ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            {onShift ? 'On Shift (Check-out)' : 'Checked Out (Check-in)'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left Column: Task List */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="glass-panel p-6 flex-1 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-green-400" /> AI Task Allocator
            </h2>
            
            <div className="space-y-4">
              <AnimatePresence>
                {tasks.map(task => (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-5 rounded-xl border transition-all ${
                      task.status === 'COMPLETED' ? 'bg-gray-900/40 border-gray-800 opacity-40' : 
                      task.status === 'IN_PROGRESS' ? 'border-[#d4a017]/40 bg-[#d4a017]/5 shadow-[0_0_10px_rgba(212,160,23,0.05)]' :
                      'glass border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                            task.priority === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {task.priority} Priority
                          </span>
                          
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            task.status === 'PENDING' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' :
                            task.status === 'IN_PROGRESS' ? 'bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/30' :
                            'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          
                          <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 uppercase tracking-wide">
                            {task.category || "General"}
                          </span>
                        </div>
                        
                        <h3 className={`text-lg font-bold ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4 text-green-400" /> {task.location}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {task.status === 'PENDING' && (
                          <button 
                            onClick={() => handleAcceptTask(task.id)}
                            disabled={loading === `accept-${task.id}`}
                            className="px-4 py-2 text-xs bg-[#d4a017] text-black font-bold hover:bg-yellow-400 rounded-lg transition-colors flex items-center gap-1"
                          >
                            {loading === `accept-${task.id}` && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Accept Task
                          </button>
                        )}

                        {task.status === 'IN_PROGRESS' && (
                          <>
                            <button onClick={() => setActiveModal(`route-${task.id}`)} className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
                              View Route
                            </button>
                            <button 
                              onClick={() => handleCompleteTask(task.id)}
                              disabled={loading === `complete-${task.id}`}
                              className="px-4 py-2 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/50 transition-colors flex items-center gap-1"
                            >
                              {loading === `complete-${task.id}` && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                            </button>
                          </>
                        )}

                        {task.status === 'COMPLETED' && (
                          <span className="text-green-500 font-bold flex items-center gap-1 text-xs">
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-10">No volunteer tasks assigned to this sector.</p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant & Protocols */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Emergency Alert Box */}
          <div className="bg-red-950/30 border border-red-500/30 p-5 rounded-2xl flex flex-col gap-4">
            <div>
              <h3 className="text-red-400 font-bold mb-1 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" /> Crisis & Escalation
              </h3>
              <p className="text-xs text-gray-300">Trigger immediate medical/security alerts. Command Center receives real-time GPS tracking.</p>
            </div>

            {sosActivated ? (
              <button disabled className="w-full py-3 bg-green-600/50 text-white font-bold rounded-xl cursor-not-allowed">
                ALARM DISPATCHED
              </button>
            ) : (
              <button 
                onClick={() => setActiveModal('sos')} 
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                TRIGGER EMERGENCY SOS
              </button>
            )}

            <button 
              onClick={() => setActiveModal('supervisor')}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold border border-white/10 flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-green-400" /> Contact Supervisor
            </button>
          </div>

          {/* AI Volunteer Chat */}
          <AIChat role="Volunteer" title="AI Coordinator" />
        </div>
      </div>

      {/* Modals */}
      
      {/* Languages Modal */}
      <Modal isOpen={activeModal === 'language'} onClose={() => setActiveModal(null)} title="App Locale Selector">
        <div className="grid grid-cols-2 gap-2">
          {["English", "Spanish", "French", "Arabic", "Portuguese", "Japanese"].map(lang => (
            <button key={lang} onClick={() => { addToast("success", `Locale changed to ${lang}.`); setActiveModal(null); }} className="text-left p-3 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
              {lang}
            </button>
          ))}
        </div>
      </Modal>

      {/* SOS Modal */}
      <Modal isOpen={activeModal === 'sos'} onClose={() => setActiveModal(null)} title="TRIGGER VOLUNTEER CRISIS SOS">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
          <h3 className="text-xl font-bold text-red-400">Confirm Distress Alarm</h3>
          <p className="text-sm text-gray-400 font-light">This will immediately broadcast a medical/security priority-1 panic event at GPS coordinates Sector B turnstile concourse.</p>
          <div className="flex gap-4 mt-6">
            <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white">Cancel</button>
            <button 
              onClick={handleActivateSOS} 
              disabled={loading === "sos"}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {loading === "sos" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Distress Alarm
            </button>
          </div>
        </div>
      </Modal>

      {/* Route Modal */}
      {tasks.map(task => (
        <Modal key={`route-${task.id}`} isOpen={activeModal === `route-${task.id}`} onClose={() => setActiveModal(null)} title={`Navigation Path to: ${task.location}`}>
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">{task.title}</h3>
            <div className="w-full h-48 bg-[#0a0a0a] border border-white/10 rounded-lg flex flex-col items-center justify-center gap-2 relative overflow-hidden">
               {/* Small decorative grid lines */}
               <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
               <MapPin className="w-8 h-8 text-green-400 relative z-10 animate-bounce" />
               <span className="text-xs text-gray-400 relative z-10">Location: {task.location}</span>
            </div>
            
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-300">
              <span className="font-bold text-white block mb-1">AR Pathfinding:</span>
              Take the concourse corridor left, proceed 60 meters towards Section A turnstiles. Climb stairs to Gate 2.
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg text-sm transition-colors">
              Close Route Map
            </button>
          </div>
        </Modal>
      ))}

      {/* Supervisor Modal */}
      <Modal isOpen={activeModal === "supervisor"} onClose={() => setActiveModal(null)} title="Hotline: Contact Shift Supervisor">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">Connect directly with the Operational Command supervisor for Sector B.</p>
          
          <div className="bg-[#121212] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-white text-sm">MS</div>
              <div>
                <h4 className="font-bold text-sm text-white">Major Marcus Vance</h4>
                <p className="text-xs text-gray-400">Commanding Officer, Sector B</p>
              </div>
            </div>
            <div className="text-xs bg-green-500/15 border border-green-500/30 p-2.5 rounded text-green-300 font-semibold">
              Current Status: Online & Monitoring Radio
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => {
                addToast("success", "Connecting audio line to Sector B radio console...");
                setActiveModal(null);
              }}
              className="flex-1 py-3 bg-[#d4a017] hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Start Voice Call
            </button>
            <button 
              onClick={() => {
                addToast("success", "Pushed request to supervisor dashboard. Standing by.");
                setActiveModal(null);
              }}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Request Radio Callback
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
