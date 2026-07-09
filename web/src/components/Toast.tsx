"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useEffect } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
}

export function ToastContainer({ toasts, setToasts }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[10002] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />
  };

  const borderColors = {
    success: "border-green-500/30 bg-green-950/20",
    error: "border-red-500/30 bg-red-950/20",
    info: "border-blue-500/30 bg-blue-950/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl ${borderColors[toast.type]} text-white`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm font-medium">{toast.text}</div>
      <button onClick={() => onClose(toast.id)} className="text-gray-400 hover:text-white transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
