"use client";

import React, { useEffect, useRef, useState } from "react";
import { useScenario } from "./ScenarioEngine";

interface HealthScoreProps {
  score: number;
  size?: number;
  onClick?: () => void;
}

export default function HealthScore({ score, size = 88, onClick }: HealthScoreProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const prevScore = useRef(score);
  const { config } = useScenario();

  // Animate score changes
  useEffect(() => {
    const start = prevScore.current;
    const end = score;
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + (end - start) * ease));
      if (progress < 1) requestAnimationFrame(animate);
      else prevScore.current = end;
    };
    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, displayScore));
  const strokeDash = (clampedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 95) return "#4ade80"; // green
    if (s >= 85) return "#22d3ee"; // cyan
    if (s >= 70) return "#fbbf24"; // amber
    return "#ef4444";              // red
  };

  const getLabel = (s: number) => {
    if (s >= 95) return "OPTIMAL";
    if (s >= 85) return "GOOD";
    if (s >= 70) return "FAIR";
    return "CRITICAL";
  };

  const color = getColor(clampedScore);
  const isPulsing = clampedScore < 70;

  return (
    <button
      onClick={onClick}
      aria-label={`Stadium Health Score: ${clampedScore}. Click for details.`}
      style={{
        position: "relative",
        width: size,
        height: size,
        background: "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: "rotate(-90deg)",
          filter: isPulsing ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color}55)`,
          animation: isPulsing ? "health-pulse 1.5s ease-in-out infinite" : "none",
        }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={6}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.25,0.46,0.45,0.94), stroke 0.4s ease" }}
        />
      </svg>

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: size * 0.24,
            color: color,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            textShadow: `0 0 12px ${color}99`,
          }}
        >
          {clampedScore}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: size * 0.095,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: color,
            opacity: 0.7,
          }}
        >
          {getLabel(clampedScore)}
        </span>
      </div>

      <style jsx>{`
        @keyframes health-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px ${color}); }
          50% { filter: drop-shadow(0 0 18px ${color}); }
        }
      `}</style>
    </button>
  );
}
