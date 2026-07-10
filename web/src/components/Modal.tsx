"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  accentColor?: "gold" | "red" | "cyan" | "green";
}

const accentBorderMap = {
  gold:  "from-[var(--nexus-gold)] to-[var(--nexus-gold-bright)]",
  red:   "from-[var(--nexus-red)] to-[hsl(0,85%,70%)]",
  cyan:  "from-[var(--nexus-cyan)] to-[hsl(195,100%,75%)]",
  green: "from-[var(--nexus-green)] to-[hsl(145,65%,60%)]",
};

const accentCloseMap = {
  gold:  "hover:text-[var(--nexus-gold)]",
  red:   "hover:text-[var(--nexus-red)]",
  cyan:  "hover:text-[var(--nexus-cyan)]",
  green: "hover:text-[var(--nexus-green)]",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  accentColor = "gold",
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const accentBorder = accentBorderMap[accentColor];
  const accentClose  = accentCloseMap[accentColor];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1000] bg-black/70"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md pointer-events-auto relative rounded-2xl overflow-hidden"
              style={{
                background: "rgba(10,10,12,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05) inset",
              }}
            >
              {/* Top gradient accent line */}
              <div className={`h-[2px] w-full bg-gradient-to-r ${accentBorder}`} />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2
                  id="modal-title"
                  className="text-base font-semibold text-white tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className={`p-1.5 rounded-lg text-[var(--text-tertiary)] ${accentClose} hover:bg-white/5 transition-all duration-200`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
