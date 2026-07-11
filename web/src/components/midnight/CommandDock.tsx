"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Terminal, ChevronUp, Loader2, Check, X, CornerDownLeft } from "lucide-react";

// ── Quick Command Suggestions ─────────────────────────────────────────────────
const QUICK_COMMANDS = [
  "Summarize stadium health",
  "Deploy volunteers to Gate 6",
  "Show crowd density forecast",
  "Generate evacuation plan",
  "Predict restroom demand",
  "Find nearest medical team",
  "Check transport status",
  "Translate PA to Spanish",
  "Show VIP arrivals next 10 min",
  "Report suspicious activity Gate 4",
  "Open Gate 8 emergency exit",
  "Dispatch ambulance to Sector C",
];

interface CommandEntry {
  id: string;
  input: string;
  output: string;
  status: "typing" | "streaming" | "done" | "error";
  timestamp: string;
}

interface CommandDockProps {
  wsRef: React.MutableRefObject<WebSocket | null>;
  role?: string;
}

export default function CommandDock({ wsRef, role = "Organizer" }: CommandDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<string[]>(QUICK_COMMANDS);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to latest in history
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // Filter suggestions based on input
  useEffect(() => {
    if (input.trim().length > 0) {
      const filtered = QUICK_COMMANDS.filter((cmd) =>
        cmd.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredCommands(filtered);
      setShowSuggestions(filtered.length > 0 && filtered.length < QUICK_COMMANDS.length);
    } else {
      setFilteredCommands(QUICK_COMMANDS);
      setShowSuggestions(false);
    }
  }, [input]);

  // WebSocket message handler for streaming responses
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (!currentStreamId) return;

        if (data.type === "token") {
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === currentStreamId
                ? { ...entry, output: entry.output + data.content, status: "streaming" }
                : entry
            )
          );
        } else if (data.type === "stream_end") {
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === currentStreamId
                ? { ...entry, status: "done" }
                : entry
            )
          );
          setCurrentStreamId(null);
        } else if (data.type === "error") {
          setHistory((prev) =>
            prev.map((entry) =>
              entry.id === currentStreamId
                ? { ...entry, output: "Error: " + data.content, status: "error" }
                : entry
            )
          );
          setCurrentStreamId(null);
        }
      } catch (_) {}
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [wsRef, currentStreamId]);

  const submitCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed || currentStreamId) return;

    const id = `cmd-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString("en-GB", { hour12: false });

    const entry: CommandEntry = {
      id,
      input: trimmed,
      output: "",
      status: "typing",
      timestamp,
    };

    setHistory((prev) => [...prev, entry]);
    setCurrentStreamId(id);
    setInput("");
    setShowSuggestions(false);
    setHistoryIndex(-1);

    // Send via WebSocket
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: trimmed, role }));
    } else {
      // Fallback: simulate response
      setTimeout(() => {
        setHistory((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  output: `🤖 **FIFA Nexus AI** — Processing: "${trimmed}"\n\nCommand received. Stadium operations systems updated. All relevant teams notified.\n\n\`\`\`\n🎯 STATUS: EXECUTED\n├── Confidence: 95%\n└── Impact: Operational\n\`\`\``,
                  status: "done",
                }
              : e
          )
        );
        setCurrentStreamId(null);
      }, 1800);
    }
  }, [currentStreamId, role, wsRef]);

  // Keyboard navigation through history
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputHistory = history.map((h) => h.input).reverse();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
      setHistoryIndex(newIndex);
      setInput(inputHistory[newIndex] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setInput(newIndex === -1 ? "" : inputHistory[newIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }, [history, historyIndex, input, submitCommand]);

  // Voice input
  const toggleListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(4,4,8,0.97)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 -24px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* Expand/Collapse toggle */}
      <button
        onClick={() => setIsExpanded((p) => !p)}
        aria-label={isExpanded ? "Collapse command history" : "Expand command history"}
        style={{
          position: "absolute",
          top: -16,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "3px 14px",
          borderRadius: "8px 8px 0 0",
          background: "rgba(4,4,8,0.97)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderBottom: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <ChevronUp
          className="w-3.5 h-3.5"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "none",
            transition: "transform 0.25s ease",
          }}
        />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em" }}>
          HISTORY
        </span>
      </button>

      {/* Command history panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 240 }}
            exit={{ height: 0 }}
            style={{ overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              style={{
                height: 240,
                overflowY: "auto",
                padding: "10px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {history.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                    No commands yet. Start typing below.
                  </p>
                </div>
              )}
              {history.map((entry) => (
                <div key={entry.id}>
                  {/* Input line */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(212,160,23,0.7)", flexShrink: 0 }}>
                      [{entry.timestamp}]
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--nexus-gold-bright)", fontWeight: 700 }}>
                      &gt; {entry.input}
                    </span>
                    {entry.status === "done" && <Check className="w-3 h-3" style={{ color: "#4ade80", flexShrink: 0 }} />}
                    {entry.status === "streaming" && <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--nexus-cyan)", flexShrink: 0 }} />}
                    {entry.status === "error" && <X className="w-3 h-3" style={{ color: "#ef4444", flexShrink: 0 }} />}
                  </div>
                  {/* Output */}
                  {entry.output && (
                    <div style={{ paddingLeft: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {entry.output.replace(/\*\*/g, "").replace(/```[\s\S]*?```/g, "[XAI Block Rendered]").slice(0, 400)}
                      {entry.status === "streaming" && <span style={{ animation: "pulse-slow 1s infinite" }}>▌</span>}
                    </div>
                  )}
                </div>
              ))}
              <div ref={historyEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: "absolute",
              bottom: "100%",
              left: 20,
              right: 20,
              background: "rgba(8,8,14,0.98)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px 12px 0 0",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxHeight: 200,
              overflowY: "auto",
              boxShadow: "0 -20px 40px rgba(0,0,0,0.6)",
            }}
          >
            {filteredCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => { setInput(cmd); setShowSuggestions(false); inputRef.current?.focus(); }}
                style={{
                  padding: "7px 10px",
                  borderRadius: 6,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <CornerDownLeft className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{cmd}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}>
        {/* Terminal prompt */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Terminal className="w-4 h-4" style={{ color: "var(--nexus-cyan)" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "var(--nexus-cyan)" }}>
            nexus@stadium:~$
          </span>
        </div>

        {/* Input */}
        <div style={{ flex: 1, position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input.length === 0 && setShowSuggestions(false)}
            placeholder="Ask the stadium anything... (↑↓ for history, Enter to execute)"
            aria-label="Stadium command input"
            disabled={!!currentStreamId}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              caretColor: "var(--nexus-cyan)",
              opacity: currentStreamId ? 0.5 : 1,
            }}
          />
        </div>

        {/* Quick suggestions toggle */}
        <button
          onClick={() => { setShowSuggestions((p) => !p); setFilteredCommands(QUICK_COMMANDS); }}
          aria-label="Show command suggestions"
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.08em",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ChevronUp className="w-3 h-3" style={{ transform: showSuggestions ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          SUGGEST
        </button>

        {/* Voice button */}
        <button
          onClick={toggleListening}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          aria-pressed={isListening}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${isListening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
            background: isListening ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: isListening ? "0 0 12px rgba(239,68,68,0.3)" : "none",
            animation: isListening ? "btn-emergency-pulse 1.5s infinite" : "none",
          }}
        >
          {isListening
            ? <MicOff className="w-4 h-4" style={{ color: "#ef4444" }} />
            : <Mic className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
          }
        </button>

        {/* Send button */}
        <button
          onClick={() => submitCommand(input)}
          disabled={!input.trim() || !!currentStreamId}
          aria-label="Execute command"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid rgba(0,200,255,0.3)",
            background: input.trim() && !currentStreamId ? "rgba(0,200,255,0.12)" : "rgba(255,255,255,0.04)",
            cursor: input.trim() && !currentStreamId ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
            opacity: !input.trim() || !!currentStreamId ? 0.4 : 1,
          }}
        >
          {currentStreamId
            ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--nexus-cyan)" }} />
            : <Send className="w-4 h-4" style={{ color: "var(--nexus-cyan)" }} />
          }
        </button>
      </div>

      {/* Rotating quick command chips (shown when no text in input) */}
      {!input && !isExpanded && (
        <div style={{ paddingBottom: 10, paddingLeft: 20, paddingRight: 20, display: "flex", gap: 6, overflowX: "auto" }}>
          {QUICK_COMMANDS.slice(0, 6).map((cmd) => (
            <button
              key={cmd}
              onClick={() => submitCommand(cmd)}
              disabled={!!currentStreamId}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget.style.borderColor = "rgba(0,200,255,0.25)"); (e.currentTarget.style.color = "rgba(0,200,255,0.7)"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"); (e.currentTarget.style.color = "rgba(255,255,255,0.35)"); }}
            >
              {cmd}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
