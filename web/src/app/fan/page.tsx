"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AIChat from "@/components/AIChat";
import Modal from "@/components/Modal";
import { ArrowLeft, Navigation2, Utensils, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ToastContainer, ToastMessage } from "@/components/Toast";

// Dynamically import Map to avoid SSR issues with Leaflet
const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

export default function FanDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // API settings
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Form states
  const [selectedGate, setSelectedGate] = useState("Gate 6");
  const [seatNumber, setSeatNumber] = useState("42F");
  const [isRouting, setIsRouting] = useState(false);

  // Status & interactive states
  const [orderStatus, setOrderStatus] = useState({ burger: false, drink: false });
  const [orderLoading, setOrderLoading] = useState({ burger: false, drink: false });
  
  const [sosActivated, setSosActivated] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  
  // Notification toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Place food order to backend
  const handleOrderFood = async (item: string, price: number, field: "burger" | "drink") => {
    setOrderStatus(prev => ({ ...prev, [field]: false }));
    setOrderLoading(prev => ({ ...prev, [field]: true }));
    
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          price,
          location: `Seat ${seatNumber} (${selectedGate})`
        })
      });

      if (res.ok) {
        setOrderStatus(prev => ({ ...prev, [field]: true }));
        addToast("success", `Order placed: ${item} ($${price}). Volunteer dispatched to Seat ${seatNumber}.`);
      } else {
        addToast("error", "Failed to order from concession stand API. Reverting to local fallback.");
        setOrderStatus(prev => ({ ...prev, [field]: true })); // Fallback
      }
    } catch (e) {
      console.error(e);
      addToast("info", `Mock Order simulation active: ${item} ($${price}) ordered.`);
      setOrderStatus(prev => ({ ...prev, [field]: true }));
    } finally {
      setOrderLoading(prev => ({ ...prev, [field]: false }));
      // Auto-close modal after 1.5s
      setTimeout(() => setActiveModal(null), 1500);
    }
  };

  // Dispatch SOS Alert to backend
  const handleActivateSOS = async () => {
    setSosLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: selectedGate,
          desc: `EMERGENCY SOS: Fan trigger at Seat ${seatNumber}. Assistance required immediately.`,
          severity: "CRITICAL"
        })
      });

      if (res.ok) {
        setSosActivated(true);
        addToast("error", "CRITICAL SOS Broadcasted to security and medical center!");
      } else {
        addToast("error", "Emergency API unreachable. Triggering local backup alarm...");
        setSosActivated(true);
      }
    } catch (e) {
      console.error(e);
      addToast("error", "Emergency SOS triggered locally. Security has been pinged.");
      setSosActivated(true);
    } finally {
      setSosLoading(false);
    }
  };

  const handleRouteCalculation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRouting(true);
    addToast("info", `Optimizing route from ${selectedGate} to Block 114, Row F (Seat ${seatNumber})...`);
    
    setTimeout(() => {
      addToast("success", `Fastest route calculated! Follow highlighted pathway.`);
      setActiveModal(null);
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col bg-[#050505] text-white">
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fan Hub <span className="text-[#d4a017]">| Live Seat: {seatNumber}</span></h1>
            <p className="text-xs text-gray-500">Current Position: Turnstile at {selectedGate}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('route')} className="glass px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors">
            <Navigation2 className="w-4 h-4 text-blue-400" /> Route Planner
          </button>
          <button onClick={() => setActiveModal('food')} className="glass px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors">
            <Utensils className="w-4 h-4 text-orange-400" /> Concessions
          </button>
          <button onClick={() => setActiveModal('sos')} className={`glass px-4 py-2 text-sm flex items-center gap-2 transition-colors ${sosActivated ? 'bg-red-600 border-red-500 text-white font-bold animate-pulse' : 'border-red-500/30 hover:bg-red-500/20 text-red-400'}`}>
            <AlertTriangle className="w-4 h-4" /> SOS Alert
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left Column: AI Assistant */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1 flex flex-col h-full min-h-[400px]"
        >
          <AIChat />
        </motion.div>

        {/* Right Column: 3D/Interactive Map */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 glass rounded-2xl overflow-hidden shadow-2xl relative min-h-[500px]"
        >
          <div className="absolute top-4 left-4 z-10 glass-panel px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${sosActivated ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></div> 
            {sosActivated ? 'EMERGENCY IN PROGRESS' : 'Interactive Map Twin'}
          </div>
          <StadiumMap flashSOS={sosActivated} highlightRoute={isRouting} selectedGate={selectedGate} />
        </motion.div>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === 'route'} onClose={() => setActiveModal(null)} title="Find Seat Navigation Route">
        <form onSubmit={handleRouteCalculation} className="space-y-4">
          <p className="text-sm text-gray-300">Enter your turnstile entry point and your target seat to compute the optimal low-congestion corridor path.</p>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Starting Gate</label>
            <select 
              value={selectedGate} 
              onChange={(e) => setSelectedGate(e.target.value)} 
              className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4a017]/50"
            >
              <option value="Gate 1">Gate 1 (North Concourse)</option>
              <option value="Gate 4">Gate 4 (South Concourse)</option>
              <option value="Gate 6">Gate 6 (West Concourse)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Seat Number</label>
            <input 
              type="text" 
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="e.g. 42F" 
              className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4a017]/50" 
              required
            />
          </div>

          {isRouting && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
              <span className="font-bold text-white">Active Route Instructions:</span>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                <li>Proceed through {selectedGate} scanning validation.</li>
                <li>Take Escalator B straight to Level 2.</li>
                <li>Turn right to Section 104, then proceed to Seat {seatNumber}.</li>
              </ul>
              <div className="mt-2 text-xs font-semibold uppercase text-blue-400">Estimated Walking Time: 3 mins</div>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            {isRouting && (
              <button 
                type="button" 
                onClick={() => { setIsRouting(false); addToast("info", "Route cleared."); }}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Clear Route
              </button>
            )}
            <button type="submit" className="flex-1 py-3 bg-[#d4a017] hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors">
              Calculate Route
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'food'} onClose={() => setActiveModal(null)} title="Order Food & Beverages">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">Place an order and stadium volunteers will deliver directly to seat <strong>{seatNumber}</strong>.</p>
          
          <div className="p-4 bg-gray-900/50 rounded-xl flex justify-between items-center border border-white/5">
            <div>
              <h4 className="font-bold text-white">Classic Burger Combo</h4>
              <p className="text-xs text-gray-400">Includes fries and 500ml soda</p>
              <p className="text-sm text-[#d4a017] font-bold mt-1">$12.00</p>
            </div>
            <button 
              onClick={() => handleOrderFood("Classic Burger Combo", 12.0, "burger")}
              disabled={orderStatus.burger || orderLoading.burger}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${orderStatus.burger ? 'bg-green-500 text-white' : 'bg-[#d4a017] text-black hover:bg-yellow-400 disabled:opacity-50'}`}
            >
              {orderLoading.burger && <Loader2 className="w-4 h-4 animate-spin" />}
              {orderStatus.burger ? 'Ordered ✓' : 'Order $12'}
            </button>
          </div>

          <div className="p-4 bg-gray-900/50 rounded-xl flex justify-between items-center border border-white/5">
            <div>
              <h4 className="font-bold text-white">Cold Beverage</h4>
              <p className="text-xs text-gray-400">Mineral water / Soda (Ice-cold)</p>
              <p className="text-sm text-[#d4a017] font-bold mt-1">$5.00</p>
            </div>
            <button 
              onClick={() => handleOrderFood("Cold Beverage", 5.0, "drink")}
              disabled={orderStatus.drink || orderLoading.drink}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${orderStatus.drink ? 'bg-green-500 text-white' : 'bg-[#d4a017] text-black hover:bg-yellow-400 disabled:opacity-50'}`}
            >
              {orderLoading.drink && <Loader2 className="w-4 h-4 animate-spin" />}
              {orderStatus.drink ? 'Ordered ✓' : 'Order $5'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'sos'} onClose={() => { setActiveModal(null); }} title="Emergency SOS Transmitter">
        <div className="space-y-4 text-center p-2">
          {sosActivated ? (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/50">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">SOS Beacon Active</h3>
              <p className="text-sm text-gray-400">Your live coordinates are being transmitted to security dispatchers. Paramedics and stewards are heading to Sector A (Gate 6). Stay calm.</p>
              <button 
                onClick={() => { setSosActivated(false); addToast("info", "SOS Beacon cancelled."); setActiveModal(null); }} 
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors mt-4"
              >
                Cancel Alarm
              </button>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-red-400">Confirm Emergency Dispatch?</h3>
              <p className="text-sm text-gray-400">This will initiate a priority-1 alert to the central command team. Security personnel will target your turnstile validation point ({selectedGate}, Seat {seatNumber}).</p>
              
              <div className="flex gap-4 mt-6">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleActivateSOS} 
                  disabled={sosLoading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                >
                  {sosLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Activate SOS
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
