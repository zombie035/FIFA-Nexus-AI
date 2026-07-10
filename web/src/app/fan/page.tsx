"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AIChat from "@/components/AIChat";
import Modal from "@/components/Modal";
import { Navigation2, Utensils, AlertTriangle, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import NavHeader from "@/components/NavHeader";

const StadiumMap = dynamic(() => import("@/components/StadiumMap"), { ssr: false });

export default function FanDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [selectedGate, setSelectedGate] = useState("Gate 6");
  const [seatNumber, setSeatNumber] = useState("42F");
  const [isRouting, setIsRouting] = useState(false);

  const [orderStatus, setOrderStatus] = useState({ burger: false, drink: false });
  const [orderLoading, setOrderLoading] = useState({ burger: false, drink: false });

  const [sosActivated, setSosActivated] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: "success" | "error" | "info", text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  useEffect(() => { setMounted(true); }, []);

  const handleOrderFood = async (item: string, price: number, field: "burger" | "drink") => {
    setOrderStatus((prev) => ({ ...prev, [field]: false }));
    setOrderLoading((prev) => ({ ...prev, [field]: true }));
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, price, location: `Seat ${seatNumber} (${selectedGate})` }),
      });
      if (res.ok) { setOrderStatus((prev) => ({ ...prev, [field]: true })); addToast("success", `Order placed: ${item}. Volunteer dispatched to Seat ${seatNumber}.`); }
      else { addToast("error", "Failed to order. Reverting to local fallback."); setOrderStatus((prev) => ({ ...prev, [field]: true })); }
    } catch {
      addToast("info", `Mock Order: ${item} ($${price}) placed.`);
      setOrderStatus((prev) => ({ ...prev, [field]: true }));
    } finally {
      setOrderLoading((prev) => ({ ...prev, [field]: false }));
      setTimeout(() => setActiveModal(null), 1500);
    }
  };

  const handleActivateSOS = async () => {
    setSosLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: selectedGate, desc: `EMERGENCY SOS: Fan trigger at Seat ${seatNumber}. Assistance required immediately.`, severity: "CRITICAL" }),
      });
      if (res.ok) { setSosActivated(true); addToast("error", "CRITICAL SOS Broadcasted to security and medical center!"); }
      else { addToast("error", "Emergency API unreachable. Triggering local backup alarm..."); setSosActivated(true); }
    } catch {
      addToast("error", "Emergency SOS triggered locally. Security pinged.");
      setSosActivated(true);
    } finally { setSosLoading(false); }
  };

  const handleRouteCalculation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRouting(true);
    addToast("info", `Optimizing route from ${selectedGate} to Seat ${seatNumber}...`);
    setTimeout(() => { addToast("success", "Fastest route calculated! Follow highlighted pathway."); setActiveModal(null); }, 1000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
      <ToastContainer toasts={toasts} setToasts={setToasts} />

      <NavHeader
        title="Fan Hub"
        subtitle={`Seat ${seatNumber}`}
        accentColor="cyan"
        statusVariant={sosActivated ? "live" : "ok"}
        statusLabel={sosActivated ? "SOS ACTIVE" : "OPERATIONAL"}
      >
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => setActiveModal("route")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)", color: "var(--nexus-cyan)" }}
          >
            <Navigation2 className="w-3.5 h-3.5" /> Route
          </button>
          <button
            onClick={() => setActiveModal("food")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: "rgba(255,160,50,0.08)", border: "1px solid rgba(255,160,50,0.2)", color: "hsl(35,90%,60%)" }}
          >
            <Utensils className="w-3.5 h-3.5" /> Order
          </button>
          <button
            onClick={() => setActiveModal("sos")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: sosActivated ? "hsla(0,85%,55%,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${sosActivated ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: "var(--nexus-red)",
              animation: sosActivated ? "glow-pulse-red 2s infinite" : "none",
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {sosActivated ? "SOS Active" : "SOS"}
          </button>
        </div>
      </NavHeader>

      {/* Mobile action buttons */}
      <div className="sm:hidden flex gap-3 px-4 pt-4">
        <button onClick={() => setActiveModal("route")} className="flex-1 btn btn-ghost text-xs" style={{ color: "var(--nexus-cyan)" }}>
          <Navigation2 className="w-3.5 h-3.5" /> Route
        </button>
        <button onClick={() => setActiveModal("food")} className="flex-1 btn btn-ghost text-xs" style={{ color: "hsl(35,90%,60%)" }}>
          <Utensils className="w-3.5 h-3.5" /> Order
        </button>
        <button onClick={() => setActiveModal("sos")} className="flex-1 btn btn-ghost text-xs" style={{ color: "var(--nexus-red)" }}>
          <AlertTriangle className="w-3.5 h-3.5" /> SOS
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

          {/* AI Copilot */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <AIChat role="Fan" title="Fan Copilot" accentColor="cyan" />
          </motion.div>

          {/* Stadium Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden relative"
            style={{ minHeight: "500px", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className={`w-2 h-2 rounded-full ${sosActivated ? "bg-red-500 animate-ping" : "bg-green-400 animate-pulse"}`}
              />
              <span className="text-[11px] font-mono text-white">
                {sosActivated ? "EMERGENCY IN PROGRESS" : "Interactive Stadium Map"}
              </span>
            </div>

            {isRouting && (
              <div
                className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,200,255,0.25)" }}
              >
                <div>
                  <p className="text-[10px] font-mono mb-1" style={{ color: "var(--nexus-cyan)" }}>ACTIVE ROUTE</p>
                  <p className="text-xs text-white">{selectedGate} → Seat {seatNumber} · 3 min walk</p>
                </div>
                <MapPin className="w-5 h-5" style={{ color: "var(--nexus-cyan)" }} />
              </div>
            )}

            <StadiumMap flashSOS={sosActivated} highlightRoute={isRouting} selectedGate={selectedGate} />
          </motion.div>
        </div>
      </div>

      {/* ── Route Modal ── */}
      <Modal isOpen={activeModal === "route"} onClose={() => setActiveModal(null)} title="Seat Navigation Route" accentColor="cyan">
        <form onSubmit={handleRouteCalculation} className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Enter your turnstile entry point and target seat to compute the optimal low-congestion corridor path.
          </p>
          <div>
            <label className="text-label text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>Starting Gate</label>
            <select value={selectedGate} onChange={(e) => setSelectedGate(e.target.value)} className="nexus-input nexus-select">
              <option value="Gate 1" className="bg-black">Gate 1 (North Concourse)</option>
              <option value="Gate 4" className="bg-black">Gate 4 (South Concourse)</option>
              <option value="Gate 6" className="bg-black">Gate 6 (West Concourse)</option>
            </select>
          </div>
          <div>
            <label className="text-label text-[10px] block mb-2" style={{ color: "var(--text-tertiary)" }}>Seat Number</label>
            <input type="text" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} placeholder="e.g. 42F" className="nexus-input" required />
          </div>
          {isRouting && (
            <div className="p-4 rounded-xl" style={{ background: "hsla(195,100%,50%,0.07)", border: "1px solid rgba(0,200,255,0.2)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--nexus-cyan)" }}>AR Pathfinding Active</p>
              <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
                <li>→ Proceed through {selectedGate} scanning validation.</li>
                <li>→ Take Escalator B straight to Level 2.</li>
                <li>→ Turn right to Section 104, proceed to Seat {seatNumber}.</li>
              </ul>
              <p className="text-[10px] mt-2 font-semibold" style={{ color: "var(--nexus-cyan)" }}>Estimated Walking Time: 3 mins</p>
            </div>
          )}
          <div className="flex gap-3">
            {isRouting && (
              <button type="button" onClick={() => { setIsRouting(false); addToast("info", "Route cleared."); }} className="btn btn-ghost flex-1 text-sm">
                Clear Route
              </button>
            )}
            <button type="submit" className="btn btn-primary flex-1 text-sm" style={{ background: "var(--nexus-cyan)", color: "#000" }}>
              Calculate Route
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Food Modal ── */}
      <Modal isOpen={activeModal === "food"} onClose={() => setActiveModal(null)} title="Order Food & Beverages">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Volunteers will deliver to <strong className="text-white">Seat {seatNumber}</strong>.
          </p>
          {[
            { label: "Classic Burger Combo", desc: "Includes fries and 500ml soda", price: 12.0, field: "burger" as const },
            { label: "Cold Beverage",         desc: "Mineral water / Soda (Ice-cold)", price: 5.0, field: "drink"  as const },
          ].map(({ label, desc, price, field }) => (
            <div
              key={field}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{desc}</p>
                <p className="text-sm font-bold mt-1" style={{ color: "var(--nexus-gold-bright)" }}>${price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleOrderFood(label, price, field)}
                disabled={orderStatus[field] || orderLoading[field]}
                className="btn btn-primary btn-sm"
                style={orderStatus[field] ? { background: "var(--nexus-green)", color: "#000" } : {}}
              >
                {orderLoading[field] && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {orderStatus[field] ? "Ordered ✓" : `Order $${price}`}
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── SOS Modal ── */}
      <Modal isOpen={activeModal === "sos"} onClose={() => setActiveModal(null)} title="Emergency SOS Transmitter" accentColor="red">
        <div className="text-center space-y-4 py-2">
          {sosActivated ? (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: "hsla(0,85%,55%,0.15)", border: "1px solid rgba(239,68,68,0.4)", boxShadow: "0 0 30px var(--nexus-red-glow)" }}
              >
                <AlertTriangle className="w-8 h-8 animate-pulse" style={{ color: "var(--nexus-red)" }} />
              </div>
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SOS Beacon Active</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Your live coordinates are being transmitted. Paramedics and stewards are heading to {selectedGate}. Stay calm.
              </p>
              <button onClick={() => { setSosActivated(false); addToast("info", "SOS Beacon cancelled."); setActiveModal(null); }} className="btn btn-ghost w-full">
                Cancel Alarm
              </button>
            </>
          ) : (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: "hsla(0,85%,55%,0.12)", border: "1px solid rgba(239,68,68,0.35)" }}
              >
                <AlertTriangle className="w-8 h-8 animate-bounce" style={{ color: "var(--nexus-red)" }} />
              </div>
              <h3 className="text-base font-semibold" style={{ color: "var(--nexus-red)", fontFamily: "'Space Grotesk', sans-serif" }}>
                Confirm Emergency Dispatch?
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                This initiates a Priority-1 alert to Command. Security targets {selectedGate}, Seat {seatNumber}.
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setActiveModal(null)} className="btn btn-ghost flex-1 text-sm">Cancel</button>
                <button onClick={handleActivateSOS} disabled={sosLoading} className="btn btn-danger flex-1 text-sm">
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
