"use client";

import { useEffect, useState, useRef } from "react";
import {
  Send, Bot, Loader2, Maximize2, Trash2, Copy,
  Mic, MicOff, Volume2, HelpCircle, Check, Sparkles,
  Download, Activity, Cpu, Zap, Shield,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  type: "message" | "status";
  content: string;
  sender?: string;
  timestamp: string;
}

interface AIChatProps {
  role?: string;
  title?: string;
  accentColor?: "gold" | "cyan" | "green" | "red";
}

const accentConfig = {
  gold:  { hex: "var(--nexus-gold-bright)", dimHex: "var(--nexus-gold-dim)",  glow: "var(--nexus-gold-glow)",  border: "var(--border-gold)",  bg: "hsla(43,90%,48%,0.06)",   textClass: "text-[var(--nexus-gold-bright)]",   ringClass: "ring-[var(--nexus-gold)]"   },
  cyan:  { hex: "var(--nexus-cyan)",        dimHex: "var(--nexus-cyan-dim)",   glow: "var(--nexus-cyan-glow)",  border: "var(--border-cyan)",  bg: "hsla(195,100%,50%,0.05)", textClass: "text-[var(--nexus-cyan)]",           ringClass: "ring-[var(--nexus-cyan)]"   },
  green: { hex: "var(--nexus-green)",       dimHex: "var(--nexus-green-dim)",  glow: "var(--nexus-green-glow)", border: "var(--border-green)", bg: "hsla(145,65%,42%,0.05)",  textClass: "text-[var(--nexus-green)]",          ringClass: "ring-[var(--nexus-green)]"  },
  red:   { hex: "var(--nexus-red)",         dimHex: "var(--nexus-red-dim)",    glow: "var(--nexus-red-glow)",   border: "var(--border-red)",   bg: "hsla(0,85%,55%,0.05)",    textClass: "text-[var(--nexus-red)]",            ringClass: "ring-[var(--nexus-red)]"    },
};

export default function AIChat({
  role = "Fan",
  title = "AI Stadium Copilot",
  accentColor = "gold",
}: AIChatProps) {
  const accent = accentConfig[accentColor];

  const [messages, setMessages] = useState<Message[]>([
    {
      type: "message",
      content: `Nexus AI online. Authenticated under role **${role}**. Multi-agent pipeline active. How can I assist your stadium operations?`,
      sender: title,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(97);
  const [activeAgents, setActiveAgents] = useState(["RAG-01", "Router", "Memory"]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Role-based quick prompts
  const quickPrompts: Record<string, string[]> = {
    Fan: ["Order a classic burger", "Navigate to seat 42F from Gate 6", "Trigger emergency SOS"],
    Organizer: ["Deploy 5 volunteers to Gate 4", "Show crowd density", "Redirect crowd bottleneck"],
    Security: ["Report suspicious activity at Gate 4", "Deploy 3 officers to Gate 4", "Export security action logs"],
    Volunteer: ["What is my break schedule?", "Contact shift supervisor", "Trigger emergency SOS"],
    Medical: ["Dispatch paramedic team to Gate 6", "Pre-deploy water cases to Sector C", "Status of available beds"],
    Transportation: ["Block entry to VIP North Lot", "Dispatch backup shuttle", "Divert Metro Line A passengers"],
    Accessibility: ["Dispatch wheelchair guide to Gate 2", "Restock audio guides at Sector B", "Sensory room availability"],
  };
  const prompts = quickPrompts[role] || quickPrompts.Fan;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Simulate confidence fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setConfidence(Math.floor(92 + Math.random() * 7));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // WebSocket
  useEffect(() => {
    const wsUrl =
      (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "") + "/ws";
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => console.log(`Nexus AI WebSocket connected: ${role}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "status" && data.content === "Thinking...") {
          setIsTyping(true);
        } else if (data.type === "stream_start") {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              type: "message",
              content: "",
              sender: title,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } else if (data.type === "token") {
          setIsTyping(false);
          const token = data.content;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.sender === title) last.content += token;
            return next;
          });
        } else if (data.type === "stream_end") {
          setIsTyping(false);
        }
      } catch (e) {
        console.error("WebSocket parse error:", e);
      }
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);
    socket.onclose = () => console.log("WebSocket closed — smart fallback active");

    return () => socket.close();
  }, [role, title]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { type: "message", content: textToSend, sender: "You", timestamp }]);
    setInput("");
    setIsTyping(true);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: textToSend, role }));
    } else {
      simulateSmartFallback(textToSend);
    }
  };

  const simulateSmartFallback = (text: string) => {
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          type: "message",
          content: "",
          sender: title,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      const mockResponses = [
        "🗺️ **Navigation Agent routing complete.**\n\nI recommend proceeding through **Gate 6**, taking the Escalator straight to Level 2. Your seat is in Block 114, Row F. Estimated walking time is 3 minutes.",
        "🍔 **Concessions and delivery confirmed.**\n\nI have placed an order for a **Classic Burger Combo** on the backend. A volunteer in Sector B has been assigned to deliver to **Seat 42F**.",
        "🚨 **CRITICAL SECURITY ALERT TRIGGERED.**\n\nI have automatically created a **CRITICAL INCIDENT** at your Sector. Security teams and medic ambulance crews are heading to Gate 6.",
      ];

      const responseText =
        mockResponses[Math.floor(Math.random() * mockResponses.length)] +
        `\n\n\`\`\`\n🎯 AI RECOMMENDATION REPORT\n├── Confidence Score: ${confidence}%\n├── Evidence: Digital Twin Grid Metrics\n├── Expected Impact: Response time under 45s\n└── Alternatives: Reroute via Gate 1 ramps.\n\`\`\``;

      let currentText = "";
      const tokens = responseText.split(" ");
      let tokenIdx = 0;

      const interval = setInterval(() => {
        if (tokenIdx < tokens.length) {
          currentText += (tokenIdx > 0 ? " " : "") + tokens[tokenIdx];
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1].content = currentText;
            return next;
          });
          tokenIdx++;
        } else {
          clearInterval(interval);
        }
      }, 40);
    }, 1000);
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const clean = text.replace(/[*#`_\-]/g, "").replace(/├──|└──|│/g, "");
      const utt = new SpeechSynthesisUtterance(clean);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  };

  const handleDictate = () => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechGen = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognizer = new SpeechGen();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = "en-US";
      if (isListening) { recognizer.stop(); setIsListening(false); return; }
      setIsListening(true);
      recognizer.start();
      recognizer.onresult = (event: any) => { setInput(event.results[0][0].transcript); setIsListening(false); };
      recognizer.onerror = () => setIsListening(false);
      recognizer.onend = () => setIsListening(false);
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = () => {
    const textLog = messages.map((m) => `[${m.timestamp}] ${m.sender || "You"}: ${m.content}`).join("\n\n");
    const blob = new Blob([textLog], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-${role.toLowerCase()}-session.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setMessages([{
      type: "message",
      content: `Session cleared. Nexus AI re-initialized under role **${role}**.`,
      sender: title,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
  };

  const visibleMessages = messages.filter((m) => m.type === "message");

  return (
    <div
      className="flex flex-col h-[640px] relative overflow-hidden rounded-2xl"
      style={{
        background: "rgba(6, 6, 8, 0.96)",
        border: `1px solid ${accent.border}`,
        boxShadow: `0 0 0 1px ${accent.border}, 0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* ── Header: Mission Control Bar ───────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        {/* Left: Agent identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
            >
              <Bot className="w-4 h-4" style={{ color: accent.hex }} />
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[rgba(6,6,8,0.96)]"
              style={{ background: "var(--nexus-green)" }}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {title}
              </span>
              <Sparkles className="w-3 h-3 animate-pulse" style={{ color: accent.hex }} />
            </div>
            <p className="text-label text-[9px]" style={{ color: accent.hex, opacity: 0.7 }}>
              Role: {role}
            </p>
          </div>
        </div>

        {/* Center: Confidence indicator */}
        <div className="hidden md:flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" style={{ color: accent.hex }} />
            <span className="text-data text-[11px] font-bold" style={{ color: accent.hex }}>
              {confidence}%
            </span>
          </div>
          <div
            className="w-20 h-0.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${confidence}%`, background: accent.hex }}
            />
          </div>
          <span className="text-label text-[8px]" style={{ color: "var(--text-tertiary)" }}>CONFIDENCE</span>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-1">
          <button onClick={handleDownload} title="Download session" className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 transition-all duration-150">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleClear} title="Clear session" className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--nexus-red)] hover:bg-white/5 transition-all duration-150">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button title="Expand" className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 transition-all duration-150">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Agent Pipeline Status (thin strip) ───────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 scan-bar"
        style={{ background: accent.bg, borderBottom: `1px solid ${accent.border}30` }}
      >
        <Cpu className="w-3 h-3 flex-shrink-0" style={{ color: accent.hex }} />
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {activeAgents.map((agent) => (
            <span key={agent} className="data-pill data-pill-gray flex-shrink-0 text-[9px]">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: accent.hex }}
              />
              {agent}
            </span>
          ))}
        </div>
        <span className="ml-auto text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>
          PIPELINE ACTIVE
        </span>
      </div>

      {/* ── Messages Stream ───────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        style={{ background: "rgba(4,4,6,0.8)" }}
      >
        {visibleMessages.map((msg, i) => (
          msg.sender === "You" ? (
            /* User Query */
            <div key={i} className="flex justify-end">
              <div className="max-w-[78%]">
                <div
                  className="text-label text-[8px] text-right mb-1 pr-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  QUERY SUBMITTED · {msg.timestamp}
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-medium leading-relaxed"
                  style={{
                    background: `linear-gradient(135deg, ${accent.bg}, ${accent.bg})`,
                    border: `1px solid ${accent.border}`,
                    color: "rgba(255,255,255,0.9)",
                    boxShadow: `0 4px 16px ${accent.glow}`,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ) : (
            /* AI Response Panel */
            <div key={i} className="group relative flex gap-3">
              {/* Left accent bar */}
              <div
                className="w-0.5 rounded-full flex-shrink-0 self-stretch"
                style={{ background: `linear-gradient(to bottom, ${accent.hex}, transparent)`, minHeight: "32px" }}
              />

              <div className="flex-1 min-w-0">
                <div
                  className="text-label text-[8px] mb-2 flex items-center gap-2"
                  style={{ color: accent.hex }}
                >
                  <Zap className="w-2.5 h-2.5" />
                  NEXUS AI · {msg.timestamp}
                </div>

                <div
                  className="p-4 rounded-xl rounded-tl-sm text-sm leading-relaxed prose-nexus"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Action toolbar — appears on hover */}
                {msg.content.length > 5 && (
                  <div
                    className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <button
                      onClick={() => handleCopy(i, msg.content)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 transition-all text-[10px]"
                    >
                      {copiedId === i ? (
                        <><Check className="w-3 h-3 text-[var(--nexus-green)]" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.content)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[var(--text-tertiary)] hover:text-[var(--nexus-cyan)] hover:bg-white/5 transition-all text-[10px]"
                    >
                      <Volume2 className="w-3 h-3" /> Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        ))}

        {/* Thinking animation */}
        {isTyping && (
          <div className="flex gap-3">
            <div
              className="w-0.5 rounded-full flex-shrink-0"
              style={{ background: `linear-gradient(to bottom, ${accent.hex}, transparent)`, minHeight: "56px" }}
            />
            <div className="flex-1">
              <div className="text-label text-[8px] mb-2 flex items-center gap-2" style={{ color: accent.hex }}>
                <Cpu className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: "2s" }} />
                MULTI-AGENT REASONING...
              </div>
              <div
                className="p-4 rounded-xl rounded-tl-sm"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                {/* Animated scanning bars */}
                <div className="space-y-2">
                  {[100, 80, 60].map((w, idx) => (
                    <div
                      key={idx}
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ width: `${w}%`, background: "rgba(255,255,255,0.06)", animationDelay: `${idx * 200}ms` }}
                    >
                      <div
                        className="h-full rounded-full animate-scan"
                        style={{
                          width: "40%",
                          background: `linear-gradient(90deg, transparent, ${accent.hex}, transparent)`,
                          animationDelay: `${idx * 0.3}s`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Prompts ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(p)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid rgba(255,255,255,0.08)`,
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = accent.bg;
              (e.currentTarget as HTMLElement).style.borderColor = accent.border;
              (e.currentTarget as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            <HelpCircle className="w-3 h-3 flex-shrink-0" style={{ color: accent.hex }} />
            {p}
          </button>
        ))}
      </div>

      {/* ── Command Input ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 pb-4 pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Dispatch command (${role})...`}
              className="nexus-input pr-4 text-sm"
              style={{ borderRadius: "12px", paddingRight: "16px" }}
              aria-label="Type your message"
            />
          </div>

          <button
            type="button"
            onClick={handleDictate}
            title="Voice command"
            className="flex-shrink-0 p-2.5 rounded-xl transition-all duration-200"
            style={{
              background: isListening ? "hsla(0,85%,55%,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isListening ? "var(--nexus-red)" : "rgba(255,255,255,0.1)"}`,
              color: isListening ? "var(--nexus-red)" : "var(--text-tertiary)",
            }}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 animate-pulse" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            title="Send"
            className="flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 disabled:opacity-40"
            style={{
              background: input.trim() ? accent.hex : "rgba(255,255,255,0.05)",
              border: `1px solid ${input.trim() ? accent.hex : "rgba(255,255,255,0.1)"}`,
              color: input.trim() ? "#000" : "var(--text-tertiary)",
            }}
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
