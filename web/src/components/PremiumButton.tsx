"use client";

import React, { useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
export type ButtonVariant =
  | "primary"    // Championship Gold
  | "fan"        // Fan Hub Gold (brighter)
  | "ai"         // Holographic Cyan (AI Copilot)
  | "security"   // Black Titanium Blue
  | "emergency"  // Crimson Heartbeat
  | "medical"    // Crystal Emerald
  | "analytics"  // Carbon Fiber Purple
  | "volunteer"  // Stadium Orange
  | "transport"  // Electric Teal
  | "success"    // Victory Green
  | "danger"     // Matte Crimson
  | "ghost";     // Frosted Glass

export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface PremiumButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  id?: string;
  "aria-label"?: string;
  fullWidth?: boolean;
}

// Map variant → CSS class + cursor glow color
const variantConfig: Record<ButtonVariant, { cls: string; glowColor: string }> = {
  primary:   { cls: "btn-primary",   glowColor: "rgba(212,160,23,0.6)" },
  fan:       { cls: "btn-fan",       glowColor: "rgba(255,210,0,0.65)" },
  ai:        { cls: "btn-ai",        glowColor: "rgba(0,200,255,0.55)" },
  security:  { cls: "btn-security",  glowColor: "rgba(50,100,255,0.45)" },
  emergency: { cls: "btn-emergency", glowColor: "rgba(220,30,30,0.65)" },
  medical:   { cls: "btn-medical",   glowColor: "rgba(0,200,120,0.5)" },
  analytics: { cls: "btn-analytics", glowColor: "rgba(120,60,255,0.5)" },
  volunteer: { cls: "btn-volunteer", glowColor: "rgba(220,110,30,0.5)" },
  transport: { cls: "btn-transport", glowColor: "rgba(0,200,220,0.45)" },
  success:   { cls: "btn-success",   glowColor: "rgba(20,160,60,0.5)" },
  danger:    { cls: "btn-danger",    glowColor: "rgba(200,30,30,0.55)" },
  ghost:     { cls: "btn-ghost",     glowColor: "rgba(255,255,255,0.15)" },
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
  xl: "btn-xl",
};

export default function PremiumButton({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled = false,
  loading = false,
  icon,
  iconRight,
  className = "",
  type = "button",
  id,
  fullWidth = false,
  "aria-label": ariaLabel,
}: PremiumButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement | null>(null);
  const [specularPos, setSpecularPos] = useState({ x: 50, y: 50 });
  const [isPressed, setIsPressed] = useState(false);

  const cfg = variantConfig[variant];
  const sizeCls = sizeMap[size];

  // ── Cursor-tracking specular highlight ──────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpecularPos({ x, y });
    // Dynamic specular on the ::after layer — use CSS custom property
    btn.style.setProperty("--spec-x", `${x}%`);
    btn.style.setProperty("--spec-y", `${y}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setSpecularPos({ x: 50, y: 50 });
    if (btnRef.current) {
      btnRef.current.style.setProperty("--spec-x", "50%");
      btnRef.current.style.setProperty("--spec-y", "50%");
    }
  }, []);

  // ── Ripple on click ──────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const btn = btnRef.current;
    if (btn) {
      // Remove old ripple
      const old = btn.querySelector(".btn-ripple");
      if (old) old.remove();

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.className = "btn-ripple";
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
        pointer-events: none;
        z-index: 10;
        transform: scale(0);
        animation: btn-ripple-expand 0.55s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
      `;
      btn.appendChild(ripple);
      rippleRef.current = ripple;

      setTimeout(() => {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 600);
    }

    onClick?.(e);
  }, [disabled, loading, onClick]);

  const handleMouseDown = useCallback(() => setIsPressed(true), []);
  const handleMouseUp = useCallback(() => setIsPressed(false), []);

  const classes = [
    "btn",
    cfg.cls,
    sizeCls,
    loading ? "btn-loading" : "",
    fullWidth ? "w-full" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      ref={btnRef}
      id={id}
      type={type}
      className={classes}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      style={{
        // Specular highlight overlay driven by mouse position
        "--spec-x": `${specularPos.x}%`,
        "--spec-y": `${specularPos.y}%`,
      } as React.CSSProperties}
    >
      {loading ? (
        <Loader2
          className="animate-spin"
          style={{ width: "1em", height: "1em", flexShrink: 0 }}
        />
      ) : icon ? (
        <span style={{ display: "inline-flex", flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      ) : null}

      <span style={{ position: "relative", zIndex: 3 }}>{children}</span>

      {iconRight && !loading && (
        <span
          style={{
            display: "inline-flex",
            flexShrink: 0,
            lineHeight: 1,
            transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          className="btn-icon-right"
        >
          {iconRight}
        </span>
      )}
    </button>
  );
}

// ── Style injection for ripple keyframe ─────────────────────────────────────
if (typeof document !== "undefined") {
  const styleId = "premium-btn-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes btn-ripple-expand {
        to { transform: scale(1); opacity: 0; }
      }
      .btn:hover .btn-icon-right {
        transform: translateX(2px);
      }
    `;
    document.head.appendChild(style);
  }
}
