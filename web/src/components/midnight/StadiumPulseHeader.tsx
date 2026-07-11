"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, Thermometer, Wind, Zap, Eye, Droplets,
  Train, Car, Bus, Navigation2, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import HealthScore from "./HealthScore";
import { useScenario, SCENARIOS, ScenarioType } from "./ScenarioEngine";

// ── Match Phase Data ──────────────────────────────────────────────────────────
const MATCH_PHASES = [
  { id: 0, label: "PRE-MATCH",      short: "PRE",   color: "rgba(255,255,255,0.3)" },
  { id: 1, label: "FAN ARRIVAL",    short: "ARR",   color: "rgba(0,200,255,0.8)" },
  { id: 2, label: "SECURITY CHECK", short: "SEC",   color: "rgba(0,200,255,0.8)" },
  { id: 3, label: "KICK-OFF",       short: "KO",    color: "rgba(212,160,23,1)" },
  { id: 4, label: "FIRST HALF",     short: "1ST",   color: "rgba(212,160,23,1)" },
  { id: 5, label: "HALF TIME",      short: "HT",    color: "rgba(255,180,50,0.9)" },
  { id: 6, label: "SECOND HALF",    short: "2ND",   color: "rgba(212,160,23,1)" },
  { id: 7, label: "FULL TIME",      short: "FT",    color: "rgba(74,222,128,0.9)" },
  { id: 8, label: "EXIT PHASE",     short: "EXIT",  color: "rgba(255,100,100,0.8)" },
];

// ── Weather Simulation ────────────────────────────────────────────────────────
function useWeatherSim(scenario: ScenarioType) {
  const [weather, setWeather] = useState({
    temp: 24,
    humidity: 55,
    wind: 12,
    rain: 5,
    lightning: false,
    condition: "Partly Cloudy",
    icon: "⛅",
  });

  useEffect(() => {
    const base = {
      normal:            { temp: 24, humidity: 55, wind: 12, rain: 5,  lightning: false, condition: "Partly Cloudy", icon: "⛅" },
      rain:              { temp: 18, humidity: 89, wind: 22, rain: 78, lightning: false, condition: "Heavy Rain",    icon: "🌧️" },
      lightning:         { temp: 16, humidity: 95, wind: 38, rain: 60, lightning: true,  condition: "Thunderstorm",  icon: "⛈️" },
      medical_emergency: { temp: 28, humidity: 70, wind: 8,  rain: 2,  lightning: false, condition: "Hot & Humid",  icon: "🌡️" },
      crowd_surge:       { temp: 26, humidity: 62, wind: 10, rain: 3,  lightning: false, condition: "Clear",         icon: "☀️" },
      vip_breach:        { temp: 22, humidity: 58, wind: 14, rain: 8,  lightning: false, condition: "Overcast",     icon: "🌫️" },
      evacuation:        { temp: 19, humidity: 82, wind: 28, rain: 45, lightning: true,  condition: "Storm",         icon: "🌩️" },
      power_failure:     { temp: 21, humidity: 65, wind: 15, rain: 10, lightning: false, condition: "Cloudy",        icon: "☁️" },
      fire:              { temp: 31, humidity: 40, wind: 20, rain: 0,  lightning: false, condition: "Hot & Dry",    icon: "🔥" },
    };
    setWeather(base[scenario] || base.normal);
  }, [scenario]);

  // Add micro-fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setWeather((prev) => ({
        ...prev,
        temp: +(prev.temp + (Math.random() - 0.5) * 0.4).toFixed(1),
        wind: Math.max(0, +(prev.wind + (Math.random() - 0.5) * 1.2).toFixed(0)),
      }));
    }, 5000);
    return () => clearInterval(id);
  }, [scenario]);

  return weather;
}

// ── Transport Simulation ──────────────────────────────────────────────────────
const TRANSPORT_DATA = {
  metro:   { label: "Metro",   icon: <Train className="w-3 h-3" />,     baseLoad: 82 },
  bus:     { label: "Bus",     icon: <Bus className="w-3 h-3" />,       baseLoad: 65 },
  parking: { label: "Parking", icon: <Car className="w-3 h-3" />,       baseLoad: 78 },
  rideshare: { label: "Rides", icon: <Navigation2 className="w-3 h-3" />, baseLoad: 55 },
};

interface StadiumPulseHeaderProps {
  healthScore: number;
  liveMetrics: { crowd: number; incidents: number; volunteers: number };
  onHealthScoreClick: () => void;
}

export default function StadiumPulseHeader({
  healthScore,
  liveMetrics,
  onHealthScoreClick,
}: StadiumPulseHeaderProps) {
  const { scenario, config, setScenario } = useScenario();
  const [activePhase, setActivePhase] = useState(4); // Default: First Half
  const [liveTime, setLiveTime] = useState("—");
  const [matchClock, setMatchClock] = useState(0); // seconds
  const [showScenarioPicker, setShowScenarioPicker] = useState(false);
  const weather = useWeatherSim(scenario);
  const [transportLoads, setTransportLoads] = useState({ metro: 82, bus: 65, parking: 78, rideshare: 55 });

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-GB", { hour12: false }));
      setMatchClock((prev) => prev + 1);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Transport load simulation
  useEffect(() => {
    const id = setInterval(() => {
      setTransportLoads((prev) => ({
        metro:     Math.max(10, Math.min(100, prev.metro     + (Math.random() - 0.45) * 3)),
        bus:       Math.max(10, Math.min(100, prev.bus       + (Math.random() - 0.48) * 2)),
        parking:   Math.max(10, Math.min(100, prev.parking   + (Math.random() - 0.5) * 1.5)),
        rideshare: Math.max(10, Math.min(100, prev.rideshare + (Math.random() - 0.46) * 2)),
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const matchMinutes = Math.floor(matchClock / 60);

  const transportColor = (load: number) =>
    load >= 90 ? "#ef4444" : load >= 75 ? "#fbbf24" : "#4ade80";

  return (
    <header
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        background: config.headerBg,
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderBottom: `1px solid ${config.primaryColor}22`,
        transition: "background 0.6s ease, border-color 0.6s ease",
      }}
    >
      {/* Emergency Alert Banner */}
      <AnimatePresence>
        {config.alertText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              background: config.alertLevel === "critical" ? "rgba(220,20,20,0.9)" : "rgba(200,120,0,0.85)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "white",
                animation: "scan-horizontal 3s ease-in-out infinite",
              }}
            >
              <span style={{ animation: "btn-emergency-pulse 1.2s infinite" }}>⬤</span>
              {config.alertText.toUpperCase()}
              <span style={{ animation: "btn-emergency-pulse 1.2s infinite" }}>⬤</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main control strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "0 16px",
          height: "64px",
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        {/* ── Branding ── */}
        <div style={{ flexShrink: 0, paddingRight: 16, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: 15, color: "white", letterSpacing: "-0.03em" }}>
            FIFA <span style={{ background: `linear-gradient(135deg, ${config.primaryColor}, #ffd700)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nexus AI</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            Midnight Pitch
          </div>
        </div>

        {/* ── Health Score ── */}
        <div style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase" }}>Health</div>
          <HealthScore score={healthScore} size={44} onClick={onHealthScoreClick} />
        </div>

        {/* ── Match Timeline ── */}
        <div style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase" }}>Match Phase</div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {MATCH_PHASES.map((phase, i) => (
              <React.Fragment key={phase.id}>
                <button
                  onClick={() => setActivePhase(phase.id)}
                  aria-label={`Set match phase to ${phase.label}`}
                  aria-pressed={activePhase === phase.id}
                  style={{
                    background: activePhase === phase.id ? `${phase.color.replace("0.8", "0.15").replace("1)", "0.15)")}` : "transparent",
                    border: activePhase === phase.id ? `1px solid ${phase.color.replace("0.8", "0.5")}` : "1px solid transparent",
                    borderRadius: 4,
                    padding: "3px 6px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: activePhase === phase.id ? phase.color : "rgba(255,255,255,0.25)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: activePhase === phase.id ? `0 0 8px ${phase.color.replace("0.8", "0.3")}` : "none",
                    animation: activePhase === phase.id ? "pulse-slow 2s ease-in-out infinite" : "none",
                    flexShrink: 0,
                  }}
                >
                  {phase.short}
                </button>
                {i < MATCH_PHASES.length - 1 && (
                  <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 8 }}>›</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Match Clock ── */}
        <div style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 2, textTransform: "uppercase" }}>Match</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--nexus-gold-bright)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {String(matchMinutes).padStart(2, "0")}:{String(matchClock % 60).padStart(2, "0")}
          </div>
        </div>

        {/* ── Weather ── */}
        <div style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase" }}>Weather</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{weather.icon}</span>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "white" }}>
                {weather.temp}°C
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.35)" }}>
                {weather.condition}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.4)" }}>
                <Wind className="w-2.5 h-2.5" /> {weather.wind}km/h
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: weather.rain > 50 ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
                <Droplets className="w-2.5 h-2.5" /> {weather.rain}%
              </div>
            </div>
            {weather.lightning && (
              <Zap className="w-3 h-3" style={{ color: "#818cf8", animation: "pulse-slow 0.8s infinite" }} />
            )}
          </div>
        </div>

        {/* ── Transport ── */}
        <div style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase" }}>Transport</div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(TRANSPORT_DATA).map(([key, data]) => {
              const load = Math.round(transportLoads[key as keyof typeof transportLoads]);
              const color = transportColor(load);
              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{data.icon}</span>
                  <div style={{ width: 4, height: 20, background: "rgba(255,255,255,0.08)", borderRadius: 2, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${load}%`, background: color, borderRadius: 2, transition: "height 1s ease, background 0.5s ease" }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color, fontWeight: 700 }}>{load}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Live Stats ── */}
        <div style={{ flexShrink: 0, padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase" }}>Stadium</div>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: "FANS",      value: liveMetrics.crowd.toLocaleString(), color: "#22d3ee" },
              { label: "INCIDENTS", value: liveMetrics.incidents,              color: liveMetrics.incidents > 0 ? "#ef4444" : "#4ade80" },
              { label: "CREW",      value: liveMetrics.volunteers,             color: "#fbbf24" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: stat.color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scenario Selector ── */}
        <div style={{ flexShrink: 0, padding: "0 14px", marginLeft: "auto", position: "relative" }}>
          <button
            onClick={() => setShowScenarioPicker((p) => !p)}
            aria-label="Change scenario"
            aria-expanded={showScenarioPicker}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              background: `${config.primaryColor}18`,
              border: `1px solid ${config.primaryColor}40`,
              color: config.primaryColor,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: `0 0 16px ${config.glowColor}`,
            }}
          >
            <span>{config.emoji}</span>
            <span style={{ textTransform: "uppercase" }}>{config.label}</span>
            {showScenarioPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <AnimatePresence>
            {showScenarioPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "rgba(8,8,12,0.97)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 8,
                  minWidth: 200,
                  boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
                  backdropFilter: "blur(20px)",
                  zIndex: 100,
                }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", padding: "4px 8px 8px", textTransform: "uppercase" }}>
                  Demo Scenario
                </div>
                {Object.values(SCENARIOS).map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => { setScenario(sc.id); setShowScenarioPicker(false); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: scenario === sc.id ? `${sc.primaryColor}18` : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${sc.primaryColor}12`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = scenario === sc.id ? `${sc.primaryColor}18` : "transparent")}
                  >
                    <span style={{ fontSize: 14 }}>{sc.emoji}</span>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: scenario === sc.id ? sc.primaryColor : "white" }}>
                        {sc.label}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                        Impact: −{sc.healthImpact} health
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Live Clock ── */}
        <div style={{ flexShrink: 0, padding: "0 0 0 14px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginBottom: 2, textTransform: "uppercase" }}>UTC+0</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>
            {liveTime}
          </div>
        </div>
      </div>
    </header>
  );
}
