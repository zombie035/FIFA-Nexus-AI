"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Activity, Map as MapIcon, ShieldAlert, Users, Calendar, ArrowRight, Play, MapPin, Zap, HeartPulse, Bus } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamically import Scene to avoid SSR issues with Three.js
const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Animated Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    // Target date: June 11, 2026 (FIFA World Cup 2026 Start)
    const targetDate = new Date("2026-06-11T00:00:00Z").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative min-h-screen bg-[#050505] text-white selection:bg-[#d4a017] selection:text-black overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Scene />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 lg:p-24">
        <motion.div 
          style={{ y, opacity }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center max-w-5xl w-full mt-20"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 glass px-6 py-2 rounded-full text-sm font-medium text-[#d4a017] uppercase tracking-wider shadow-[0_0_15px_rgba(212,160,23,0.3)]"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Official FIFA 2026 Technology
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 leading-tight drop-shadow-2xl"
          >
            FIFA Nexus AI<br/>
            <span className="text-4xl md:text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-[#d4a017] to-yellow-200">
              Intelligent Stadium OS
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
          >
            The world's most advanced generative AI platform for stadium operations, predictive crowd intelligence, and unparalleled fan experiences.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/fan" className="px-8 py-4 bg-[#d4a017] text-black font-bold rounded-full hover:bg-yellow-400 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(212,160,23,0.4)] flex items-center gap-2 w-full sm:w-auto justify-center">
              Enter Fan Hub <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="px-8 py-4 glass text-white font-semibold rounded-full hover:bg-white/10 hover:scale-105 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center">
              Explore Platform <Play className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Live Countdown Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="relative mt-16 mx-auto glass-panel px-8 py-6 flex flex-wrap gap-8 shadow-2xl border border-white/10 w-[90%] max-w-2xl justify-center z-20"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">{timeLeft.d}</div>
            <div className="text-xs text-[#d4a017] uppercase tracking-widest font-medium">Days</div>
          </div>
          <div className="w-px h-12 bg-white/20 self-center" />
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">{timeLeft.h.toString().padStart(2, '0')}</div>
            <div className="text-xs text-[#d4a017] uppercase tracking-widest font-medium">Hours</div>
          </div>
          <div className="w-px h-12 bg-white/20 self-center" />
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">{timeLeft.m.toString().padStart(2, '0')}</div>
            <div className="text-xs text-[#d4a017] uppercase tracking-widest font-medium">Minutes</div>
          </div>
          <div className="w-px h-12 bg-white/20 self-center" />
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">{timeLeft.s.toString().padStart(2, '0')}</div>
            <div className="text-xs text-[#d4a017] uppercase tracking-widest font-medium">Seconds</div>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="relative z-10 py-32 px-6 lg:px-24 bg-gradient-to-b from-transparent via-[#050505] to-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Centralized Intelligence</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              Four dedicated AI hubs powering a seamless ecosystem for fans, organizers, security, and volunteers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              title="Fan Copilot" 
              desc="Real-time seat navigation, food ordering, and augmented reality stadium maps." 
              icon={<MapIcon className="w-10 h-10 mb-6 text-[#4facfe]" />} 
              href="/fan" 
              delay={0.1}
              color="hover:border-[#4facfe]/50 hover:shadow-[0_0_30px_rgba(79,172,254,0.2)]"
            />
            <FeatureCard 
              title="Command Center" 
              desc="Executive overview of crowd density, energy metrics, and automated AI orchestration." 
              icon={<Activity className="w-10 h-10 mb-6 text-[#d4a017]" />} 
              href="/organizer" 
              delay={0.2}
              color="hover:border-[#d4a017]/50 hover:shadow-[0_0_30px_rgba(212,160,23,0.2)]" 
            />
            <FeatureCard 
              title="Security AI" 
              desc="Predictive threat analysis, emergency route optimization, and live incident tracking." 
              icon={<ShieldAlert className="w-10 h-10 mb-6 text-red-500" />} 
              href="/security" 
              delay={0.3}
              color="hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]" 
            />
            <FeatureCard 
              title="Volunteer Ops" 
              desc="Dynamic task routing, SOS alerts, and multilingual AI assistance for staff." 
              icon={<Users className="w-10 h-10 mb-6 text-green-400" />} 
              href="/volunteer" 
              delay={0.4}
              color="hover:border-green-400/50 hover:shadow-[0_0_30px_rgba(74,222,128,0.2)]" 
            />
            <FeatureCard 
              title="Medical Hub" 
              desc="Live triage status, automated paramedic routing, and AI-predicted heatstroke alerts." 
              icon={<HeartPulse className="w-10 h-10 mb-6 text-blue-500" />} 
              href="/medical" 
              delay={0.5}
              color="hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]" 
            />
            <FeatureCard 
              title="Transport Hub" 
              desc="Live metro status, predictive traffic rerouting, and dynamic VIP shuttle tracking." 
              icon={<Bus className="w-10 h-10 mb-6 text-indigo-500" />} 
              href="/transportation" 
              delay={0.6}
              color="hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]" 
            />
          </div>
        </div>
      </section>

      {/* Live Stats / Interactive Map Preview */}
      <section className="relative z-10 py-32 px-6 lg:px-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm">
              <Zap className="w-4 h-4 text-yellow-400" /> Powered by Deep Learning
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">Predictive Crowd Intelligence. <br/><span className="text-gray-500">Before it happens.</span></h2>
            <p className="text-lg text-gray-400 font-light">
              Nexus AI continuously ingests thousands of data points—from turnstile throughput to thermal cameras—to anticipate bottlenecks, reroute fans, and deploy volunteers proactively.
            </p>
            <ul className="space-y-4">
              <ListItem text="Sub-second latency WebSocket streams" />
              <ListItem text="Retrieval-Augmented Generation (RAG) for procedures" />
              <ListItem text="Dynamic Heatmaps & Pathfinding algorithms" />
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-2">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#d4a017]/20 to-transparent opacity-50 z-0" />
              {/* Mock Map Image/Box for visual flair */}
              <div className="relative z-10 h-[400px] w-full rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#d4a017]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
                 <MapPin className="w-12 h-12 text-[#d4a017] drop-shadow-[0_0_15px_rgba(212,160,23,0.8)]" />
                 <div className="absolute bottom-6 left-6 right-6 glass p-4 flex justify-between items-center text-sm">
                   <div><div className="text-gray-400 text-xs uppercase mb-1">Density</div><div className="text-green-400 font-bold">OPTIMAL</div></div>
                   <div><div className="text-gray-400 text-xs uppercase mb-1">Flow Rate</div><div className="text-white font-bold">1,240/min</div></div>
                   <div><div className="text-gray-400 text-xs uppercase mb-1">Status</div><div className="text-blue-400 font-bold">AI ROUTING</div></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 lg:px-24 border-t border-white/10 bg-[#020202]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a017] to-yellow-600 flex items-center justify-center font-bold text-black">N</div>
             <span className="font-semibold text-lg tracking-wide">NEXUS AI</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2026 FIFA World Cup Technology Showcase. All rights reserved.
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
             <a href="#" className="hover:text-white transition-colors">Documentation</a>
             <a href="#" className="hover:text-white transition-colors">Privacy</a>
             <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc, icon, href, delay, color }: { title: string, desc: string, icon: React.ReactNode, href: string, delay: number, color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
    >
      <Link href={href} className={`block group h-full glass-panel p-8 rounded-3xl border border-white/5 transition-all duration-500 ${color} bg-gradient-to-b from-white/[0.03] to-transparent`}>
        <div className="flex flex-col h-full">
          {icon}
          <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">{title}</h3>
          <p className="text-gray-400 leading-relaxed font-light flex-grow">{desc}</p>
          <div className="mt-8 flex items-center text-sm font-semibold uppercase tracking-wider text-gray-500 group-hover:text-white transition-colors">
            Launch Platform <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-gray-300">
      <div className="w-1.5 h-1.5 rounded-full bg-[#d4a017]" />
      {text}
    </li>
  );
}
