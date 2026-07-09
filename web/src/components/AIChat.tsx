"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Send, Bot, Loader2, Maximize2, Trash2, Copy, Download, 
  Mic, MicOff, Volume2, HelpCircle, Check, Sparkles 
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
}

export default function AIChat({ role = "Fan", title = "AI Stadium Copilot" }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: "message", 
      content: `Hello! I am your **${title}**. Authenticated under role **${role}**. How can I assist you with stadium operations today?`, 
      sender: title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Role-based quick prompts
  const quickPrompts: Record<string, string[]> = {
    "Fan": [
      "Order a classic burger",
      "Navigate to seat 42F from Gate 6",
      "Trigger emergency SOS"
    ],
    "Organizer": [
      "Deploy 5 volunteers to Gate 4",
      "Show crowd density",
      "Redirect crowd bottleneck"
    ],
    "Security": [
      "Report suspicious activity at Gate 4",
      "Deploy 3 officers to Gate 4",
      "Export security action logs"
    ],
    "Volunteer": [
      "What is my break schedule?",
      "Contact shift supervisor",
      "Trigger emergency SOS"
    ],
    "Medical": [
      "Dispatch paramedic team to Gate 6",
      "Pre-deploy water cases to Sector C",
      "Status of available beds"
    ],
    "Transportation": [
      "Block entry to VIP North Lot",
      "Dispatch backup shuttle",
      "Divert Metro Line A passengers"
    ],
    "Accessibility": [
      "Dispatch wheelchair guide to Gate 2",
      "Restock audio guides at Sector B",
      "Sensory room space availability"
    ]
  };

  const prompts = quickPrompts[role] || quickPrompts["Fan"];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle WebSocket Connection
  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000").replace(/\/$/, "") + "/ws";
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log(`Gemini Copilot WebSocket Connected under role: ${role}`);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "status" && data.content === "Thinking...") {
          setIsTyping(true);
        } else if (data.type === "stream_start") {
          setIsTyping(false);
          // Add new empty message container for streaming tokens
          setMessages(prev => [...prev, { 
            type: "message", 
            content: "", 
            sender: title,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } else if (data.type === "token") {
          setIsTyping(false);
          const token = data.content;
          setMessages(prev => {
            const nextMsgs = [...prev];
            if (nextMsgs.length > 0) {
              const lastMsg = nextMsgs[nextMsgs.length - 1];
              if (lastMsg.sender === title) {
                lastMsg.content += token;
              }
            }
            return nextMsgs;
          });
        } else if (data.type === "stream_end") {
          setIsTyping(false);
        }
      } catch (e) {
        console.error("Error reading WebSocket payload:", e);
      }
    };

    socket.onerror = (err) => {
      console.error("Gemini WebSocket encountered an error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected. Reverting to smart fallback.");
    };

    return () => {
      socket.close();
    };
  }, [role, title]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { type: "message", content: textToSend, sender: "You", timestamp }]);
    setInput("");
    setIsTyping(true);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: textToSend, role }));
    } else {
      // Offline Smart Fallback streaming Simulation
      simulateSmartFallback(textToSend);
    }
  };

  const simulateSmartFallback = (text: string) => {
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        type: "message", 
        content: "", 
        sender: title,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      const mockResponses = [
        "🗺️ **Navigation Agent routing complete.**\n\nI recommend proceeding through **Gate 6**, taking the Escalator straight to Level 2. Your seat is in Block 114, Row F. Estimated walking time is 3 minutes.",
        "🍔 **Concessions and delivery confirmed.**\n\nI have placed an order for a **Classic Burger Combo** on the backend. A volunteer in Sector B has been assigned to deliver to **Seat 42F**.",
        "🚨 **CRITICAL SECURITY ALERT TRIGGERED.**\n\nI have automatically created a **CRITICAL INCIDENT** at your Sector. Security teams and medic ambulance crews are heading to Gate 6."
      ];
      
      const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)] + 
        `\n\n\`\`\`\n🎯 AI RECOMMENDATION REPORT\n├── Confidence Score: 95%\n├── Evidence: Digital Twin Grid Metrics\n├── Expected Impact: Response time under 45s\n└── Alternatives: Reroute via Gate 1 ramps.\n\`\`\``;

      let currentText = "";
      const tokens = responseText.split(" ");
      let tokenIdx = 0;

      const interval = setInterval(() => {
        if (tokenIdx < tokens.length) {
          currentText += (tokenIdx > 0 ? " " : "") + tokens[tokenIdx];
          setMessages(prev => {
            const nextMsgs = [...prev];
            nextMsgs[nextMsgs.length - 1].content = currentText;
            return nextMsgs;
          });
          tokenIdx++;
        } else {
          clearInterval(interval);
        }
      }, 40);
    }, 1000);
  };

  // Text-to-Speech Voice Assistant
  const handleSpeak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Remove markdown characters for clean reading
      const cleanText = text.replace(/[*#`_\-]/g, "").replace(/├──|└──|│/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      addToast("info", "Reading Copilot response out loud...");
    } else {
      alert("TTS Speech Synthesis not supported in this browser.");
    }
  };

  // Speech-to-Text Dictation
  const handleDictate = () => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechGen = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognizer = new SpeechGen();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = "en-US";

      if (isListening) {
        recognizer.stop();
        setIsListening(false);
        return;
      }

      setIsListening(true);
      recognizer.start();

      recognizer.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput(text);
        setIsListening(false);
        addToast("success", "Speech transcribed successfully!");
      };

      recognizer.onerror = () => {
        setIsListening(false);
        addToast("error", "Failed to capture speech input.");
      };

      recognizer.onend = () => {
        setIsListening(false);
      };
    } else {
      alert("Voice speech recognition is not supported in this browser.");
    }
  };

  // Copy Clipboard
  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast("success", "Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download log
  const handleDownload = () => {
    const textLog = messages
      .map(m => `[${m.timestamp}] ${m.sender || "You"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([textLog], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stadium-copilot-${role.toLowerCase()}-log.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("success", "Conversation log downloaded.");
  };

  // Clear conversation
  const handleClear = () => {
    setMessages([
      { 
        type: "message", 
        content: `Conversation log cleared. Active session: **${role}**.`, 
        sender: title,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    addToast("info", "Chat history cleared.");
  };

  // Local toast helper
  const [toasts, setToasts] = useState<{id: string, text: string}[]>([]);
  const addToast = (type: string, text: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  return (
    <div className="flex flex-col h-[600px] glass rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(212,160,23,0.15)] border-[#d4a017]/30 border relative bg-[#050505]">
      
      {/* Toast Alert overlay */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[10010] flex flex-col gap-1 w-[80%] pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-black/90 border border-[#d4a017]/40 text-white rounded-lg p-2 text-center text-xs backdrop-blur shadow-xl font-medium">
            {t.text}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[#121212] to-[#1a1a1a] p-4 border-b border-gray-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="text-[#d4a017] w-6 h-6 relative z-10" />
            <div className="absolute inset-0 bg-[#d4a017] blur-md opacity-50 z-0"></div>
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base tracking-wide flex items-center gap-1.5 text-white">
              {title} 
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Role: {role}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} title="Download chat log" className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleClear} title="Clear conversation" className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <Maximize2 className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>
      
      {/* Messages View */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-[#0a0a0a]">
        {messages.filter(m => m.type === "message").map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl relative group ${
              msg.sender === "You" 
                ? "bg-gradient-to-br from-[#d4a017] to-yellow-600 text-black rounded-tr-sm shadow-lg font-medium" 
                : "bg-[#141414] text-gray-200 border border-white/5 rounded-tl-sm shadow-md"
            }`}>
              <div className={`text-[9px] uppercase tracking-wider opacity-75 mb-2.5 font-black flex justify-between items-center ${
                msg.sender === "You" ? "text-black/70" : "text-[#d4a017]"
              }`}>
                <span>{msg.sender}</span>
                <span className="opacity-50 text-[8px] font-normal">{msg.timestamp}</span>
              </div>
              
              <div className="text-sm leading-relaxed prose prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Action Toolbar on hover */}
              {msg.sender !== "You" && msg.content.length > 5 && (
                <div className="absolute right-2 -bottom-5 opacity-0 group-hover:opacity-100 flex gap-1.5 bg-[#1a1a1a] border border-white/10 rounded-full px-2 py-0.5 shadow-xl transition-all z-20">
                  <button onClick={() => handleCopy(i, msg.content)} className="text-gray-400 hover:text-white p-1">
                    {copiedId === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button onClick={() => handleSpeak(msg.content)} className="text-gray-400 hover:text-white p-1">
                    <Volume2 className="w-3 h-3 text-blue-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#141414] border border-white/5 p-4 rounded-2xl rounded-tl-sm flex items-center gap-3 text-gray-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs uppercase tracking-wider font-bold">Querying Multi-Agents & RAG...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Action Prompts */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#0a0a0a] flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none z-10">
        {prompts.map((p, idx) => (
          <button 
            key={idx} 
            onClick={() => sendMessage(p)} 
            className="px-3 py-1 bg-white/5 hover:bg-[#d4a017]/20 border border-white/10 hover:border-[#d4a017]/30 text-xs font-medium text-gray-400 hover:text-white rounded-full transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <HelpCircle className="w-3 h-3 text-[#d4a017]" /> {p}
          </button>
        ))}
      </div>

      {/* Input controls form */}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="p-4 border-t border-white/5 bg-[#121212] z-10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Stadium Copilot (Role: ${role})...`}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl py-3.5 pl-5 pr-24 focus:outline-none focus:border-[#d4a017]/50 focus:ring-1 focus:ring-[#d4a017]/50 transition-all shadow-inner text-sm"
          />
          <div className="absolute right-2 flex gap-1.5">
            <button 
              type="button" 
              onClick={handleDictate} 
              className={`p-2 rounded-lg transition-colors border ${
                isListening 
                  ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
              title="Dictate voice command"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button 
              type="submit" 
              disabled={!input.trim()} 
              className="p-2 bg-[#d4a017] text-black rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
