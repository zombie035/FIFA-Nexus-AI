"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type ScenarioType =
  | "normal"
  | "rain"
  | "lightning"
  | "medical_emergency"
  | "crowd_surge"
  | "vip_breach"
  | "evacuation"
  | "power_failure"
  | "fire";

export interface ScenarioConfig {
  id: ScenarioType;
  label: string;
  emoji: string;
  primaryColor: string;
  glowColor: string;
  headerBg: string;
  alertText: string;
  alertLevel: "info" | "warning" | "critical";
  healthImpact: number; // subtracted from base health score
  particleColor: string;
  description: string;
}

export const SCENARIOS: Record<ScenarioType, ScenarioConfig> = {
  normal: {
    id: "normal",
    label: "Normal Ops",
    emoji: "✅",
    primaryColor: "hsl(145,65%,42%)",
    glowColor: "rgba(74,222,128,0.3)",
    headerBg: "rgba(7,7,9,0.92)",
    alertText: "",
    alertLevel: "info",
    healthImpact: 0,
    particleColor: "#4ade80",
    description: "All systems nominal. Stadium operating at peak efficiency.",
  },
  rain: {
    id: "rain",
    label: "Heavy Rain",
    emoji: "🌧️",
    primaryColor: "hsl(210,80%,55%)",
    glowColor: "rgba(100,160,255,0.35)",
    headerBg: "rgba(5,10,28,0.95)",
    alertText: "⚠️ WEATHER ALERT — Heavy rain detected. Roof deployment initiated.",
    alertLevel: "warning",
    healthImpact: 8,
    particleColor: "#60a5fa",
    description: "Heavy rain event. Crowd movement impacted. Roof systems activating.",
  },
  lightning: {
    id: "lightning",
    label: "Lightning",
    emoji: "⚡",
    primaryColor: "hsl(220,100%,65%)",
    glowColor: "rgba(80,120,255,0.5)",
    headerBg: "rgba(5,8,35,0.97)",
    alertText: "🚨 LIGHTNING ALERT — All outdoor operations suspended immediately.",
    alertLevel: "critical",
    healthImpact: 22,
    particleColor: "#818cf8",
    description: "Lightning strike detected within 10km. Evacuation of outdoor areas in progress.",
  },
  medical_emergency: {
    id: "medical_emergency",
    label: "Medical Emergency",
    emoji: "🚑",
    primaryColor: "hsl(0,90%,58%)",
    glowColor: "rgba(239,68,68,0.45)",
    headerBg: "rgba(20,4,4,0.97)",
    alertText: "🚨 MEDICAL EMERGENCY — Mass casualty protocol active. All medics deploy.",
    alertLevel: "critical",
    healthImpact: 28,
    particleColor: "#ef4444",
    description: "Mass medical event declared. All medical teams mobilizing to incident zone.",
  },
  crowd_surge: {
    id: "crowd_surge",
    label: "Crowd Surge",
    emoji: "🌊",
    primaryColor: "hsl(25,90%,60%)",
    glowColor: "rgba(220,120,50,0.45)",
    headerBg: "rgba(20,10,3,0.97)",
    alertText: "🚨 CROWD SURGE ALERT — Gate 6 density critical. Diversion routes activated.",
    alertLevel: "critical",
    healthImpact: 35,
    particleColor: "#f97316",
    description: "Dangerous crowd density detected at Gate 6. Emergency dispersal in progress.",
  },
  vip_breach: {
    id: "vip_breach",
    label: "VIP Breach",
    emoji: "🔐",
    primaryColor: "hsl(280,80%,65%)",
    glowColor: "rgba(168,85,247,0.45)",
    headerBg: "rgba(12,5,25,0.97)",
    alertText: "🚨 SECURITY BREACH — VIP perimeter violation detected. Lockdown initiated.",
    alertLevel: "critical",
    healthImpact: 20,
    particleColor: "#a855f7",
    description: "Unauthorized access to VIP zone detected. Security lockdown in effect.",
  },
  evacuation: {
    id: "evacuation",
    label: "Evacuation",
    emoji: "🚨",
    primaryColor: "hsl(0,100%,60%)",
    glowColor: "rgba(255,30,30,0.6)",
    headerBg: "rgba(25,0,0,0.98)",
    alertText: "🚨 STADIUM EVACUATION IN PROGRESS — All exits open. Follow emergency routes.",
    alertLevel: "critical",
    healthImpact: 45,
    particleColor: "#ff1f1f",
    description: "Full stadium evacuation ordered. All gates unlocked. Emergency services on site.",
  },
  power_failure: {
    id: "power_failure",
    label: "Power Failure",
    emoji: "🔴",
    primaryColor: "hsl(43,100%,50%)",
    glowColor: "rgba(255,180,0,0.4)",
    headerBg: "rgba(10,8,0,0.98)",
    alertText: "⚡ POWER FAILURE — Backup generators active. Lights restoring in 60 seconds.",
    alertLevel: "warning",
    healthImpact: 18,
    particleColor: "#facc15",
    description: "Main power grid failure. Backup systems active. Investigation underway.",
  },
  fire: {
    id: "fire",
    label: "Fire Alert",
    emoji: "🔥",
    primaryColor: "hsl(15,100%,55%)",
    glowColor: "rgba(255,80,20,0.55)",
    headerBg: "rgba(25,5,0,0.98)",
    alertText: "🔥 FIRE ALERT — Section C concourse. Fire crews deployed. Fans evacuating.",
    alertLevel: "critical",
    healthImpact: 40,
    particleColor: "#f97316",
    description: "Fire detected in Section C concourse. Fire suppression active. Evacuating sector.",
  },
};

interface ScenarioContextValue {
  scenario: ScenarioType;
  config: ScenarioConfig;
  setScenario: (s: ScenarioType) => void;
  baseHealthScore: number;
  healthScore: number;
}

const ScenarioContext = createContext<ScenarioContextValue>({
  scenario: "normal",
  config: SCENARIOS.normal,
  setScenario: () => {},
  baseHealthScore: 87,
  healthScore: 87,
});

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenarioState] = useState<ScenarioType>("normal");
  const [baseHealthScore, setBaseHealthScore] = useState(87);

  // Simulate health score drift over time
  useEffect(() => {
    const id = setInterval(() => {
      setBaseHealthScore((prev) => {
        const drift = (Math.random() - 0.48) * 1.5;
        return Math.max(60, Math.min(99, prev + drift));
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const setScenario = useCallback((s: ScenarioType) => {
    setScenarioState(s);
  }, []);

  const config = SCENARIOS[scenario];
  const healthScore = Math.max(10, Math.round(baseHealthScore - config.healthImpact));

  return (
    <ScenarioContext.Provider value={{ scenario, config, setScenario, baseHealthScore, healthScore }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  return useContext(ScenarioContext);
}
