"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Stars,
  Sparkles,
  ScrollControls,
  useScroll,
  Scroll,
  Environment,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   SOCCER BALL CANVAS TEXTURE
───────────────────────────────────────────────────────────── */
function createSoccerBallTexture(): THREE.CanvasTexture {
  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Off-white leather base
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#f4f4f0");
  bg.addColorStop(1, "#e8e8e4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Very subtle leather grain
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.012})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, 1);
  }

  // Draw a pentagon at (u,v) in UV space
  const pentagon = (u: number, v: number, r: number, rot = 0) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72) - 90 + rot) * (Math.PI / 180);
      const x = u * W + Math.cos(a) * r;
      const y = v * H + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  // Draw seam lines outward from each pentagon vertex
  const drawSeams = (u: number, v: number, r: number, rot = 0) => {
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 5;
    for (let i = 0; i < 5; i++) {
      const a1 = ((i * 72) - 90 + rot) * (Math.PI / 180);
      const a2 = (((i + 1) * 72) - 90 + rot) * (Math.PI / 180);
      const midA = (a1 + a2) / 2;
      ctx.beginPath();
      ctx.moveTo(u * W + Math.cos(midA) * r, v * H + Math.sin(midA) * r);
      ctx.lineTo(u * W + Math.cos(midA) * r * 2.4, v * H + Math.sin(midA) * r * 2.4);
      ctx.stroke();
    }
  };

  // Pentagon layout (UV positions): 12 pentagons on a standard soccer ball
  const panels: [number, number, number, number][] = [
    // Top pole area
    [0.5,  0.05, H * 0.058, 0],
    // Upper ring (5 panels)
    [0.1,  0.285, H * 0.072, 18],
    [0.3,  0.285, H * 0.072, 18],
    [0.5,  0.285, H * 0.072, 18],
    [0.7,  0.285, H * 0.072, 18],
    [0.9,  0.285, H * 0.072, 18],
    // Lower ring (5 panels, offset by 36deg)
    [0.0,  0.715, H * 0.072, 0],
    [0.2,  0.715, H * 0.072, 0],
    [0.4,  0.715, H * 0.072, 0],
    [0.6,  0.715, H * 0.072, 0],
    [0.8,  0.715, H * 0.072, 0],
    // Bottom pole
    [0.5,  0.95, H * 0.058, 0],
    // Edge wrapping duplicates
    [0.0,  0.285, H * 0.072, 18],
    [1.0,  0.715, H * 0.072, 0],
  ];

  // 1. Draw seam network first
  panels.forEach(([u, v, r, rot]) => drawSeams(u, v, r, rot));

  // 2. Draw filled black pentagons
  panels.forEach(([u, v, r, rot]) => {
    pentagon(u, v, r, rot);
    // Gradient fill: very dark grey → true black
    const grd = ctx.createRadialGradient(u * W, v * H, 0, u * W, v * H, r);
    grd.addColorStop(0, "#1a1a1a");
    grd.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grd;
    ctx.fill();

    // Pentagon seam edge stroke
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 5;
    pentagon(u, v, r, rot);
    ctx.stroke();

    // Inner highlight (specular catch)
    const highlight = ctx.createRadialGradient(u * W - r * 0.2, v * H - r * 0.3, 0, u * W, v * H, r * 0.85);
    highlight.addColorStop(0, "rgba(255,255,255,0.07)");
    highlight.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = highlight;
    pentagon(u, v, r, rot);
    ctx.fill();
  });

  // 3. Hexagon seam lines on the white areas
  const hexGrid = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 30) * (Math.PI / 180);
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
              : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
  };

  ctx.strokeStyle = "rgba(180,180,180,0.5)";
  ctx.lineWidth = 3;
  const hxSize = 90;
  for (let row = -1; row < H / (hxSize * 0.866) + 2; row++) {
    for (let col = -1; col < W / (hxSize * 1.5) + 2; col++) {
      const x = col * hxSize * 1.5 + (row % 2 === 0 ? 0 : hxSize * 0.75);
      const y = row * hxSize * 0.866;
      hexGrid(x, y, hxSize * 0.47);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 16;
  return tex;
}

/* ─────────────────────────────────────────────────────────────
   SOCCER BALL MESH
───────────────────────────────────────────────────────────── */
function Football() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef  = useRef<THREE.Mesh>(null);
  const scroll   = useScroll();

  const ballTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createSoccerBallTexture();
  }, []);

  const roughnessMap = useMemo(() => {
    if (typeof window === "undefined") return null;
    const W = 512, H = 256;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#999999"; // medium roughness for white areas
    ctx.fillRect(0, 0, W, H);
    // Pentagons are smoother (darker = less rough in roughness map)
    [[0.5, 0.05], [0.5, 0.95],
     [0.1, 0.285], [0.3, 0.285], [0.5, 0.285], [0.7, 0.285], [0.9, 0.285],
     [0.0, 0.715], [0.2, 0.715], [0.4, 0.715], [0.6, 0.715], [0.8, 0.715]].forEach(([u, v]) => {
      ctx.beginPath();
      ctx.arc(u * W, v * H, H * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = "#444444"; // smoother
      ctx.fill();
    });
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const s = scroll.offset;
    const t = state.clock.elapsedTime;

    // Continuous rotation, slows on scroll
    groupRef.current.rotation.y += delta * Math.max(0.08, 0.38 - s * 0.3);

    // Subtle X wobble
    groupRef.current.rotation.x = Math.sin(t * 0.28) * 0.04;

    // Z tilt follows mouse (premium parallax)
    const mx = state.mouse.x;
    const my = state.mouse.y;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z, -mx * 0.12, 0.04
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x, my * 0.08, 0.04
    );

    // Drift down on scroll
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y, -s * 2.8, 0.04
    );

    // Scale: start large, shrink on scroll, re-appear at CTA
    const targetScale = s < 0.7
      ? 1.2 - s * 0.6
      : 0.6 + (s - 0.7) * 0.4;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, Math.max(0.35, targetScale), 0.04)
    );

    // Pulsing glow
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.045 + Math.sin(t * 1.4) * 0.018;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Main ball body ── */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhysicalMaterial
          map={ballTexture ?? undefined}
          roughnessMap={roughnessMap ?? undefined}
          roughness={0.28}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
          reflectivity={0.95}
          envMapIntensity={1.9}
        />
      </mesh>

      {/* ── Warm glow halo ── */}
      <mesh ref={glowRef} scale={1.07}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#d4a017"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Orbiting rings ── */}
      <OrbitingRings />
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────
   ORBITING RINGS
───────────────────────────────────────────────────────────── */
function OrbitingRings() {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const scroll = useScroll();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const fade = Math.max(0, 1 - scroll.offset * 2.5);
    if (r1.current) {
      r1.current.rotation.x += delta * 0.52;
      r1.current.rotation.z += delta * 0.21;
      (r1.current.material as THREE.MeshStandardMaterial).opacity = fade;
    }
    if (r2.current) {
      r2.current.rotation.y += delta * 0.38;
      r2.current.rotation.x += delta * 0.12;
      (r2.current.material as THREE.MeshStandardMaterial).opacity = fade * 0.8;
    }
    if (r3.current) {
      r3.current.rotation.z -= delta * 0.26;
      r3.current.rotation.y += delta * 0.16;
      (r3.current.material as THREE.MeshStandardMaterial).opacity = fade * 0.55;
    }
  });

  return (
    <group>
      <mesh ref={r1}>
        <torusGeometry args={[1.55, 0.013, 16, 120]} />
        <meshStandardMaterial color="#d4a017" emissive="#d4a017" emissiveIntensity={3} transparent />
      </mesh>
      <mesh ref={r2} rotation={[0, 0, Math.PI / 3]}>
        <torusGeometry args={[1.88, 0.009, 16, 120]} />
        <meshStandardMaterial color="#00c8ff" emissive="#00c8ff" emissiveIntensity={2.5} transparent />
      </mesh>
      <mesh ref={r3} rotation={[Math.PI / 5, 0, Math.PI / 6]}>
        <torusGeometry args={[2.25, 0.007, 16, 120]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} transparent />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────
   STADIUM SPOTLIGHT ARRAY
───────────────────────────────────────────────────────────── */
function StadiumLights() {
  const l1 = useRef<THREE.SpotLight>(null);
  const l2 = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (l1.current) l1.current.intensity = 3.2 + Math.sin(t * 0.7) * 0.4;
    if (l2.current) l2.current.intensity = 3.2 + Math.sin(t * 0.5 + 1.2) * 0.4;
  });

  return (
    <>
      {/* 4 corner stadium floodlights */}
      <spotLight ref={l1} position={[-9, 11, 7]} color="#ffe8c0" intensity={3.2} angle={Math.PI / 6} penumbra={0.85} castShadow decay={1.4} />
      <spotLight ref={l2} position={[9, 11, 7]}  color="#c0d8ff" intensity={3.2} angle={Math.PI / 6} penumbra={0.85} castShadow decay={1.4} />
      <spotLight position={[-9, 9, -7]} color="#d4a017" intensity={2.2} angle={Math.PI / 7} penumbra={0.8} decay={1.8} />
      <spotLight position={[9, 9, -7]}  color="#4facfe" intensity={2.2} angle={Math.PI / 7} penumbra={0.8} decay={1.8} />

      {/* Cool rim from below */}
      <pointLight position={[0, -5, 1]} color="#3050ff" intensity={0.6} decay={2} />
      {/* Warm key from front */}
      <pointLight position={[0, 4, 5]}  color="#fffaee" intensity={1.0} decay={2} />

      <ambientLight intensity={0.12} color="#080820" />
      <hemisphereLight args={["#0a0a28", "#00000a", 0.28]} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   FLOATING SPARK PARTICLES
───────────────────────────────────────────────────────────── */
function ParticleField() {
  const pts = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const count = 1800;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r     = 4 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = Math.random();
      if (c < 0.38) {
        // Gold
        col[i * 3] = 0.84; col[i * 3 + 1] = 0.63; col[i * 3 + 2] = 0.09;
      } else if (c < 0.62) {
        // Cyan
        col[i * 3] = 0.0;  col[i * 3 + 1] = 0.79; col[i * 3 + 2] = 1.0;
      } else {
        // White
        col[i * 3] = 1.0;  col[i * 3 + 1] = 1.0;  col[i * 3 + 2] = 1.0;
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (pts.current) {
      pts.current.rotation.y =  state.clock.elapsedTime * 0.014;
      pts.current.rotation.x =  Math.sin(state.clock.elapsedTime * 0.009) * 0.12;
    }
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.72}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─────────────────────────────────────────────────────────────
   CINEMATIC CAMERA CONTROLLER (scroll + mouse driven)
───────────────────────────────────────────────────────────── */
function CameraController() {
  const { camera } = useThree();
  const scroll  = useScroll();
  const target  = useRef(new THREE.Vector3(0, 1, 4.8));
  const lookAt  = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const s  = scroll.offset;        // 0→1
    const mx = state.mouse.x * 0.6;
    const my = state.mouse.y * 0.35;

    /* ── Keyframed camera path ── */
    let tx: number, ty: number, tz: number;
    let lx = 0, ly = 0;

    if (s < 0.18) {
      // Hero: front-center, mouse parallax
      tx = mx;        ty = 1.0 + my;         tz = 4.8;
      ly = 0;
    } else if (s < 0.38) {
      // Swing left — platform intro
      const p = (s - 0.18) / 0.20;
      tx = THREE.MathUtils.lerp(mx, -2.8, p) + mx * 0.25;
      ty = THREE.MathUtils.lerp(1.0, 0.3, p) + my * 0.2;
      tz = THREE.MathUtils.lerp(4.8, 4.2, p);
      lx = THREE.MathUtils.lerp(0, -0.5, p);
    } else if (s < 0.58) {
      // Feature grid — right pan
      const p = (s - 0.38) / 0.20;
      tx = THREE.MathUtils.lerp(-2.8, 2.5, p) + mx * 0.15;
      ty = THREE.MathUtils.lerp(0.3, -0.3, p);
      tz = THREE.MathUtils.lerp(4.2, 5.5, p);
      lx = THREE.MathUtils.lerp(-0.5, 0.5, p);
    } else if (s < 0.76) {
      // Stats — overhead angle
      const p = (s - 0.58) / 0.18;
      tx = THREE.MathUtils.lerp(2.5, 0, p);
      ty = THREE.MathUtils.lerp(-0.3, 3.8, p);
      tz = THREE.MathUtils.lerp(5.5, 6.5, p);
      ly = THREE.MathUtils.lerp(0, -1.5, p);
    } else {
      // CTA — centered, pulled back slightly
      const p = THREE.MathUtils.clamp((s - 0.76) / 0.24, 0, 1);
      tx = THREE.MathUtils.lerp(0, mx * 0.5, p);
      ty = THREE.MathUtils.lerp(3.8, 0.5, p) + my * 0.15;
      tz = THREE.MathUtils.lerp(6.5, 6.0, p);
      ly = THREE.MathUtils.lerp(-1.5, 0, p);
    }

    target.current.set(tx, ty, tz);
    lookAt.current.set(lx, ly, 0);
    camera.position.lerp(target.current, 0.032);
    camera.lookAt(lookAt.current);
  });

  return null;
}

/* ─────────────────────────────────────────────────────────────
   HUB DATA
───────────────────────────────────────────────────────────── */
const HUBS = [
  {
    title: "Fan Copilot",
    desc: "AR navigation & in-seat ordering for 80K fans.",
    href: "/fan",
    color: "hsl(195,100%,60%)",
    glowColor: "rgba(0,200,255,0.22)",
    borderColor: "rgba(0,200,255,0.35)",
    bgColor: "rgba(0,200,255,0.06)",
    icon: "🗺️",
    btnLabel: "Launch Fan Hub",
    category: "AI Navigation",
  },
  {
    title: "Command Center",
    desc: "Live crowd intelligence & AI orchestration.",
    href: "/organizer",
    color: "hsl(43,90%,55%)",
    glowColor: "rgba(212,160,23,0.22)",
    borderColor: "rgba(212,160,23,0.38)",
    bgColor: "rgba(212,160,23,0.06)",
    icon: "⚡",
    btnLabel: "Enter Command",
    category: "Operations",
  },
  {
    title: "Security AI",
    desc: "Predictive threat analysis & incident command.",
    href: "/security",
    color: "hsl(0,85%,60%)",
    glowColor: "rgba(220,50,50,0.22)",
    borderColor: "rgba(220,50,50,0.38)",
    bgColor: "rgba(220,50,50,0.06)",
    icon: "🛡️",
    btnLabel: "Security Ops",
    category: "Threat Intelligence",
  },
  {
    title: "Volunteer Ops",
    desc: "Dynamic task routing & multilingual support.",
    href: "/volunteer",
    color: "hsl(145,65%,50%)",
    glowColor: "rgba(0,180,100,0.2)",
    borderColor: "rgba(0,180,100,0.35)",
    bgColor: "rgba(0,180,100,0.06)",
    icon: "👥",
    btnLabel: "Volunteer Hub",
    category: "Team Management",
  },
  {
    title: "Medical Hub",
    desc: "AI-predicted heatstroke alerts & live triage.",
    href: "/medical",
    color: "hsl(220,90%,65%)",
    glowColor: "rgba(50,100,255,0.2)",
    borderColor: "rgba(50,100,255,0.32)",
    bgColor: "rgba(50,100,255,0.06)",
    icon: "💊",
    btnLabel: "Medical Command",
    category: "Health & Safety",
  },
  {
    title: "Transport Hub",
    desc: "Metro AI, VIP shuttle & predictive rerouting.",
    href: "/transportation",
    color: "hsl(250,85%,70%)",
    glowColor: "rgba(120,60,255,0.2)",
    borderColor: "rgba(120,60,255,0.32)",
    bgColor: "rgba(120,60,255,0.06)",
    icon: "🚌",
    btnLabel: "Transport AI",
    category: "Logistics",
  },
];

/* ─────────────────────────────────────────────────────────────
   HTML SCROLL CONTENT
───────────────────────────────────────────────────────────── */
function HTMLOverlay() {
  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "5px 16px",
    borderRadius: "100px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  };

  const sectionStyle = (top: string, minH = "100vh"): React.CSSProperties => ({
    position: "absolute",
    top,
    left: 0,
    width: "100%",
    minHeight: minH,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6vw",
  });

  return (
    <Scroll html style={{ width: "100%" }}>

      {/* ══════════════════════════════════════════
          SECTION 0 — HERO  (0 → 100vh)
      ══════════════════════════════════════════ */}
      <section style={{ ...sectionStyle("0vh"), flexDirection: "column", justifyContent: "flex-end", paddingBottom: "9vh", pointerEvents: "none", textAlign: "center" }}>
        {/* Badge */}
        <div style={{ ...badgeStyle, background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#d4a017", marginBottom: "28px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4444", display: "inline-block", boxShadow: "0 0 8px rgba(255,68,68,0.8)", animation: "btn-emergency-pulse 1.8s ease-in-out infinite" }} />
          FIFA World Cup 2026 · Official AI Platform
        </div>

        {/* Main title */}
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(3.2rem, 9.5vw, 8rem)",
          fontWeight: 900,
          letterSpacing: "-0.045em",
          lineHeight: 1.0,
          color: "white",
          marginBottom: "18px",
          textShadow: "0 0 100px rgba(212,160,23,0.22)",
        }}>
          FIFA{" "}
          <span style={{
            background: "linear-gradient(135deg, #d4a017 0%, #ffd04d 55%, #d4a017 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Nexus AI
          </span>
          <br />
          <span style={{ fontSize: "0.4em", fontWeight: 300, color: "rgba(255,255,255,0.38)", letterSpacing: "0em" }}>
            Intelligent Stadium Operating System
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "clamp(0.875rem,1.5vw,1.05rem)", maxWidth: "560px", margin: "0 auto 36px", lineHeight: 1.75, fontWeight: 300 }}>
          Generative AI powering crowd intelligence, real-time operations, and unparalleled fan experiences at the FIFA World Cup 2026.
        </p>

        {/* CTAs — Premium Buttons */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", pointerEvents: "auto" }}>
          {/* Primary: Fan Hub — Championship Gold */}
          <Link
            href="/fan"
            id="hero-cta-fan"
            className="btn btn-fan btn-lg"
            style={{ textDecoration: "none" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "perspective(600px) translateZ(3px) translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "";
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "perspective(600px) translateZ(-2px) translateY(2px) scale(0.975)";
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "perspective(600px) translateZ(3px) translateY(-4px)";
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.1em" }}>⚡</span>
              Enter Fan Hub
              <span style={{
                display: "inline-block",
                transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              }}>→</span>
            </span>
          </Link>

          {/* Secondary: Command Center — Frosted Glass */}
          <Link
            href="/organizer"
            id="hero-cta-command"
            className="btn btn-ghost btn-lg"
            style={{ textDecoration: "none" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "perspective(600px) translateZ(1px) translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "";
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "perspective(600px) translateZ(-1px) translateY(1px)";
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "perspective(600px) translateZ(1px) translateY(-2px)";
            }}
          >
            Command Center
          </Link>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          color: "rgba(255,255,255,0.22)", pointerEvents: "none",
        }}>
          <span style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.14em", textTransform: "uppercase" }}>Scroll to explore</span>
          <div style={{ width: "22px", height: "38px", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "11px", display: "flex", justifyContent: "center", padding: "5px 0" }}>
            <div className="animate-bounce" style={{ width: "3px", height: "7px", background: "#d4a017", borderRadius: "2px" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 1 — PLATFORM INTRO (100 → 200vh)
      ══════════════════════════════════════════ */}
      <section style={{ ...sectionStyle("100vh"), justifyContent: "flex-start", paddingLeft: "8vw", pointerEvents: "none" }}>
        <div style={{ maxWidth: "500px" }}>
          <div style={{ ...badgeStyle, background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.25)", color: "#00c8ff", marginBottom: "24px" }}>
            AI Infrastructure
          </div>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(2rem,4vw,3.2rem)",
            fontWeight: 700, letterSpacing: "-0.03em", color: "white", lineHeight: 1.15, marginBottom: "20px",
          }}>
            Six AI Hubs.<br />
            <span style={{ color: "#d4a017" }}>One Nexus.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.46)", lineHeight: 1.82, fontSize: "0.975rem", fontWeight: 300, marginBottom: "28px" }}>
            Nexus AI integrates Fan Copilot, Security Operations, Volunteer Management, Medical Command, Transport Intelligence, and the Executive Command Center into one unified neural network — processing thousands of data signals per second.
          </p>
          {[
            "Sub-second WebSocket data streams",
            "Retrieval-Augmented Generation (RAG)",
            "Predictive crowd heatmaps & AI pathfinding",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px", color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", marginBottom: "10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4a017", flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — FEATURE GRID (200 → 330vh)
      ══════════════════════════════════════════ */}
      <section style={{ ...sectionStyle("200vh", "130vh"), flexDirection: "column", padding: "8vh 5vw", pointerEvents: "none" }}>
        <div style={{ maxWidth: "1200px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <div style={{ ...badgeStyle, background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", color: "#d4a017", marginBottom: "18px" }}>
              Six Hubs
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem,3.5vw,3rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "white" }}>
              Platform Intelligence
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "14px", pointerEvents: "auto" }}>
            {HUBS.map((hub) => (
              <a
                key={hub.href}
                href={hub.href}
                id={`hub-card-${hub.href.replace("/", "")}`}
                style={{
                  display: "block", padding: "24px", borderRadius: "18px",
                  background: hub.bgColor,
                  border: `1px solid ${hub.borderColor}`,
                  backdropFilter: "blur(20px)",
                  textDecoration: "none",
                  transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${hub.borderColor}`,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${hub.bgColor.replace("0.06", "0.12")}`;
                  el.style.transform = "translateY(-6px) scale(1.01)";
                  el.style.boxShadow = `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${hub.borderColor}, 0 0 60px ${hub.glowColor}`;
                  const arrow = el.querySelector(".hub-arrow") as HTMLElement;
                  if (arrow) arrow.style.transform = "translateX(4px)";
                  const launch = el.querySelector(".hub-launch") as HTMLElement;
                  if (launch) launch.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = hub.bgColor;
                  el.style.transform = "translateY(0) scale(1)";
                  el.style.boxShadow = `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${hub.borderColor}`;
                  const arrow = el.querySelector(".hub-arrow") as HTMLElement;
                  if (arrow) arrow.style.transform = "translateX(0)";
                  const launch = el.querySelector(".hub-launch") as HTMLElement;
                  if (launch) launch.style.opacity = "0.6";
                }}
                onMouseDown={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-2px) scale(0.99)";
                }}
                onMouseUp={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-6px) scale(1.01)";
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                  background: `linear-gradient(90deg, transparent, ${hub.color}, transparent)`,
                }} />

                {/* Corner glow */}
                <div style={{
                  position: "absolute", top: "16px", right: "16px",
                  width: "60px", height: "60px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${hub.glowColor.replace("0.22", "0.3")} 0%, transparent 70%)`,
                  filter: "blur(8px)",
                  pointerEvents: "none",
                }} />

                {/* Icon */}
                <div style={{
                  fontSize: "26px", marginBottom: "14px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "46px", height: "46px",
                  borderRadius: "12px",
                  background: `${hub.glowColor.replace("0.22", "0.15")}`,
                  border: `1px solid ${hub.borderColor}`,
                  boxShadow: `0 0 16px ${hub.glowColor}`,
                }}>{ hub.icon}</div>

                {/* Category tag */}
                <div style={{
                  fontSize: "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: hub.color,
                  marginBottom: "6px",
                  opacity: 0.8,
                }}>{ hub.category}</div>

                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", fontWeight: 700, color: "white", marginBottom: "8px", letterSpacing: "-0.01em" }}>{hub.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: "18px" }}>{hub.desc}</p>

                {/* Launch button row */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div
                    className="hub-launch"
                    style={{
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: hub.color,
                      opacity: 0.6,
                      transition: "opacity 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {hub.btnLabel}
                    <span
                      className="hub-arrow"
                      style={{
                        display: "inline-block",
                        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                    >→</span>
                  </div>

                  {/* Mini LED indicator */}
                  <div style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: hub.color,
                    boxShadow: `0 0 8px ${hub.color}, 0 0 16px ${hub.glowColor}`,
                    animation: "pulse-ring 2.5s infinite",
                  }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — STATS (340 → 420vh)
      ══════════════════════════════════════════ */}
      <section style={{ ...sectionStyle("350vh", "80vh"), flexDirection: "column", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ ...badgeStyle, background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.22)", color: "#00c8ff", marginBottom: "44px" }}>
          Platform Scale
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "40px 64px", maxWidth: "700px" }}>
          {[
            { v: "2.4M+", l: "Daily AI Interactions" },
            { v: "48",    l: "Active AI Agents" },
            { v: "16",    l: "Stadium Venues" },
            { v: "99.9%", l: "Uptime SLA" },
          ].map(({ v, l }) => (
            <div key={l}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(2.4rem,4vw,4rem)",
                fontWeight: 700, color: "white", letterSpacing: "-0.02em",
                textShadow: "0 0 32px rgba(212,160,23,0.38)",
              }}>{v}</div>
              <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "8px" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — CTA + FOOTER (450 → 550vh)
      ══════════════════════════════════════════ */}
      <section style={{ ...sectionStyle("450vh"), flexDirection: "column", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ maxWidth: "600px" }}>
          <div style={{ ...badgeStyle, background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.22)", color: "#d4a017", marginBottom: "28px" }}>
            Get Started
          </div>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(2.8rem,6vw,5rem)",
            fontWeight: 900, letterSpacing: "-0.045em", color: "white", lineHeight: 1.0, marginBottom: "20px",
          }}>
            Enter the<br />
            <span style={{ background: "linear-gradient(135deg, #d4a017, #ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Control Room
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem", lineHeight: 1.75, marginBottom: "40px", fontWeight: 300 }}>
            Experience the future of stadium operations at FIFA World Cup 2026. Six AI hubs. One unified command.
          </p>

          {/* Premium CTA buttons */}
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", pointerEvents: "auto" }}>
            <Link
              href="/fan"
              id="footer-cta-fan"
              className="btn btn-fan btn-lg"
              style={{ textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "perspective(600px) translateZ(3px) translateY(-4px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "perspective(600px) translateZ(-2px) translateY(2px) scale(0.975)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "perspective(600px) translateZ(3px) translateY(-4px)"; }}
            >
              ⚡ Fan Experience
            </Link>

            <Link
              href="/organizer"
              id="footer-cta-command"
              className="btn btn-ghost btn-lg"
              style={{ textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "perspective(600px) translateZ(1px) translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              Command Center
            </Link>

            <Link
              href="/security"
              id="footer-cta-security"
              className="btn btn-security btn-lg"
              style={{ textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "perspective(600px) translateZ(2px) translateY(-3px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "perspective(600px) translateZ(-2px) translateY(2px) scale(0.975)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "perspective(600px) translateZ(2px) translateY(-3px)"; }}
            >
              🛡️ Security Ops
            </Link>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "80px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.18)", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}>
            © 2026 FIFA World Cup Technology Showcase. All rights reserved.
          </div>
        </div>
      </section>
    </Scroll>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPLETE SCENE (inside ScrollControls)
───────────────────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <fog attach="fog" args={["#020408", 12, 50]} />
      <color attach="background" args={["#020408"]} />

      <StadiumLights />
      <Football />
      <ParticleField />
      <CameraController />

      {/* Ambient starfield */}
      <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade speed={0.18} />

      {/* Gold sparkle layer */}
      <Sparkles count={120} scale={9} size={3.5} speed={0.25} opacity={0.55} color="#d4a017" noise={0.12} />
      {/* Cyan sparkle layer */}
      <Sparkles count={70}  scale={14} size={2.5} speed={0.18} opacity={0.38} color="#00c8ff" noise={0.12} />

      {/* Stadium pitch ground plane (subtle) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#0b1f0e" roughness={0.95} transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* Pitch center circle (emissive) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.48, 0]}>
        <ringGeometry args={[3.5, 3.6, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <Environment preset="night" />

      <HTMLOverlay />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT CANVAS EXPORT
───────────────────────────────────────────────────────────── */
export default function FootballScene() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#020408", zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 1, 4.8], fov: 58, near: 0.1, far: 300 }}
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
      >
        <Suspense fallback={null}>
          <ScrollControls pages={5.5} damping={0.5} distance={1}>
            <Scene />
          </ScrollControls>
        </Suspense>

        <EffectComposer>
          <Bloom
            intensity={1.9}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.88}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.08} darkness={1.02} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
