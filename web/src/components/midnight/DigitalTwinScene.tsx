"use client";

import React, { useRef, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useScenario } from "./ScenarioEngine";

// ── Zone Data ─────────────────────────────────────────────────────────────────
interface StadiumZone {
  id: string;
  label: string;
  position: [number, number, number];
  type: "concession" | "restroom" | "medical" | "security" | "vip" | "entrance" | "gate";
  color: string;
  data: Record<string, string | number>;
}

const ZONES: StadiumZone[] = [
  { id: "concession-b", label: "Stand 112", position: [4, 0.5, 2],  type: "concession", color: "#fbbf24", data: { Queue: 37, "Avg Wait": "5 min", "Hot Dogs": "12%", "Soft Drinks": "73%", Status: "HIGH LOAD" } },
  { id: "medical-a",    label: "Medical Bay A", position: [-4, 0.5, 3], type: "medical",    color: "#ef4444", data: { Patients: 3, Ambulances: 2, Doctors: 4, Nurses: 8, "Response": "1m 45s" } },
  { id: "security-1",  label: "Security Hub", position: [0, 0.5, -5],  type: "security",   color: "#818cf8", data: { Officers: 12, Cameras: 98, "Threat Level": "ELEVATED", Incidents: 2 } },
  { id: "vip-lounge",  label: "VIP Lounge", position: [-3, 1, -2], type: "vip",        color: "#d4a017", data: { Capacity: "80%", Guests: 240, Security: "4 Agents", Status: "ACTIVE" } },
  { id: "gate-6",      label: "Gate 6", position: [6, 0.5, -1],    type: "gate",       color: "#22d3ee", data: { Flow: "HIGH", Density: "87%", Queue: 180, "Wait Time": "8 min" } },
  { id: "restroom-c",  label: "Restroom C", position: [2, 0.5, -4],  type: "restroom",   color: "#4ade80", data: { Occupancy: "65%", Cleaning: "Due in 12 min", Status: "OPERATIONAL" } },
];

// ── Stadium Geometry Components ────────────────────────────────────────────────

// Animated crowd particles in stadium seating bowl
function CrowdParticles({ scenario }: { scenario: string }) {
  const ref = useRef<THREE.Points>(null);
  const { scenario: sc, config } = useScenario();

  const { positions, colors } = useMemo(() => {
    const count = 3500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const section = Math.floor(Math.random() * 4);
      const angle = (section / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const radMin = 5.5, radMax = 9;
      const radius = radMin + Math.random() * (radMax - radMin);
      const tier = Math.random();
      const height = 0.5 + tier * 3.5;

      positions[i * 3]     = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Color by density zone
      const density = Math.random();
      if (density < 0.2) {
        // Green — sparse
        colors[i * 3] = 0.26; colors[i * 3 + 1] = 0.87; colors[i * 3 + 2] = 0.5;
      } else if (density < 0.55) {
        // Gold — medium
        colors[i * 3] = 0.83; colors[i * 3 + 1] = 0.62; colors[i * 3 + 2] = 0.09;
      } else if (density < 0.82) {
        // Orange — dense
        colors[i * 3] = 0.97; colors[i * 3 + 1] = 0.45; colors[i * 3 + 2] = 0.09;
      } else {
        // Red — critical
        colors[i * 3] = 0.93; colors[i * 3 + 1] = 0.27; colors[i * 3 + 2] = 0.27;
      }
    }
    return { positions, colors };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors.slice(), 3));
    return g;
  }, [positions, colors]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Gentle particle drift
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i += 15) { // only update 1/15th each frame for perf
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const wave = Math.sin(t * 0.4 + i * 0.1) * 0.03;
      pos.array[i * 3]     = x + wave;
      pos.array[i * 3 + 2] = z + Math.cos(t * 0.3 + i * 0.15) * 0.02;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Stadium bowl / stands ring
function StadiumStands({ primaryColor }: { primaryColor: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      {/* Main oval bowl */}
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[8, 3.5, 8, 64]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.85}
          metalness={0.1}
          emissive="#0a0a18"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Seating tiers — inner */}
      <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 9, 64]} />
        <meshStandardMaterial color="#0d1117" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Roof ring segments */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[8.5, 4.5, 0]}>
              <boxGeometry args={[1.5, 0.15, 0.8]} />
              <meshStandardMaterial color="#252535" roughness={0.6} metalness={0.4} />
            </mesh>
            {/* Roof support pillar */}
            <mesh position={[8.5, 2, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 4.5, 6]} />
              <meshStandardMaterial color="#1e1e2e" roughness={0.5} metalness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* LED rim lighting */}
      <mesh position={[0, 4.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.8, 8.1, 64]} />
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

// The green pitch
function Pitch() {
  return (
    <group>
      {/* Grass */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 7, 1, 1]} />
        <meshStandardMaterial color="#1a4d2e" roughness={0.95} metalness={0.0} emissive="#0d2a18" emissiveIntensity={0.4} />
      </mesh>

      {/* Pitch markings */}
      {/* Center circle */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.52, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      {/* Center spot */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Halfway line */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 7]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      {/* Outer border */}
      <lineSegments position={[0, 0.015, 0]}>
        <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(10.8, 6.8)]} />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}

// Floodlight towers
function FloodlightTowers() {
  const positions: [number, number, number][] = [[-10, 0, -6], [10, 0, -6], [-10, 0, 6], [10, 0, 6]];
  return (
    <>
      {positions.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.08, 0.15, 7, 6]} />
            <meshStandardMaterial color="#2a2a3a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Light head */}
          <mesh position={[0, 7.2, 0]}>
            <boxGeometry args={[1.2, 0.3, 0.5]} />
            <meshStandardMaterial color="#fffaee" emissive="#fffaee" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// Interactive zone hotspots
function ZoneHotspot({ zone, selected, onSelect }: {
  zone: StadiumZone;
  selected: boolean;
  onSelect: (z: StadiumZone | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = zone.position[1] + Math.sin(t * 1.8 + zone.position[0]) * 0.12;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = selected ? 0.9 : 0.5 + Math.sin(t * 2 + zone.position[2]) * 0.2;
  });

  return (
    <group position={zone.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : zone); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <octahedronGeometry args={[0.22, 0]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.7} />
      </mesh>

      {/* Pulsing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.32, 32]} />
        <meshBasicMaterial color={zone.color} transparent opacity={selected ? 0.8 : 0.3} />
      </mesh>

      {/* Label */}
      <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          color: zone.color,
          whiteSpace: "nowrap",
          textShadow: `0 0 8px ${zone.color}`,
          letterSpacing: "0.06em",
          marginTop: -28,
          transform: "translateX(-50%)",
        }}>
          {zone.label}
        </div>
      </Html>
    </group>
  );
}

// Scene lighting
function SceneLights({ color }: { color: string }) {
  const l1 = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    if (l1.current) l1.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
  });

  return (
    <>
      <ambientLight intensity={0.15} color="#090915" />
      <hemisphereLight args={["#0a1020", "#000008", 0.3]} />
      <spotLight ref={l1} position={[-12, 14, 8]} color="#ffe8c0" intensity={2.2} angle={Math.PI / 5} penumbra={0.85} castShadow />
      <spotLight position={[12, 14, 8]}  color="#c0d8ff" intensity={2.2} angle={Math.PI / 5} penumbra={0.85} castShadow />
      <spotLight position={[-10, 12, -8]} color={color}   intensity={1.8} angle={Math.PI / 6} penumbra={0.8} decay={1.5} />
      <spotLight position={[10, 12, -8]}  color="#d4a017" intensity={1.8} angle={Math.PI / 6} penumbra={0.8} decay={1.5} />
      <pointLight position={[0, 2, 0]} color="#00c8ff" intensity={0.3} decay={2} />
    </>
  );
}

// Auto-rotating camera intro
function CameraIntro() {
  const { camera } = useThree();
  const done = useRef(false);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (done.current) return;
    t.current += delta * 0.4;
    const progress = Math.min(t.current, 1);
    const ease = 1 - Math.pow(1 - progress, 3);

    camera.position.set(
      Math.sin(t.current * 0.5) * (22 - ease * 10),
      18 - ease * 8,
      22 - ease * 8
    );
    camera.lookAt(0, 1, 0);

    if (t.current > 2.5) done.current = true;
  });

  return null;
}

// Rain particles for weather scenarios
function RainParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    if (!active) return null;
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [active]);

  useFrame(() => {
    if (!ref.current || !geo || !active) return;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.array[i * 3 + 1] -= 0.15;
      if (pos.array[i * 3 + 1] < -1) pos.array[i * 3 + 1] = 20;
    }
    pos.needsUpdate = true;
  });

  if (!active || !geo) return null;

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.04} color="#aaccff" transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Info Popup ─────────────────────────────────────────────────────────────────
function ZoneInfoPopup({ zone, onClose }: { zone: StadiumZone; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 10 }}
      style={{
        position: "absolute",
        top: 80,
        left: 16,
        width: 220,
        background: "rgba(6,6,12,0.97)",
        border: `1px solid ${zone.color}40`,
        borderRadius: 14,
        padding: 16,
        boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 30px ${zone.color}18`,
        backdropFilter: "blur(20px)",
        zIndex: 20,
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 16 }}
        aria-label="Close zone info"
      >
        ×
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: zone.color, boxShadow: `0 0 10px ${zone.color}` }} />
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "white" }}>{zone.label}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: zone.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{zone.type}</div>
        </div>
      </div>

      {/* Data rows */}
      {Object.entries(zone.data).map(([key, val]) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{key}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "white" }}>{val}</span>
        </div>
      ))}

      {/* AI status line */}
      <div style={{ marginTop: 10, padding: "6px 8px", background: `${zone.color}10`, border: `1px solid ${zone.color}25`, borderRadius: 6 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: zone.color }}>
          🧠 AI MONITORING ACTIVE
        </span>
      </div>
    </motion.div>
  );
}

// ── Main Scene Component ───────────────────────────────────────────────────────
export default function DigitalTwinScene() {
  const { config, scenario } = useScenario();
  const [selectedZone, setSelectedZone] = useState<StadiumZone | null>(null);
  const isRaining = scenario === "rain" || scenario === "lightning" || scenario === "evacuation";

  const handleZoneSelect = useCallback((zone: StadiumZone | null) => {
    setSelectedZone(zone);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Zone info popup */}
      <AnimatePresence>
        {selectedZone && (
          <ZoneInfoPopup zone={selectedZone} onClose={() => setSelectedZone(null)} />
        )}
      </AnimatePresence>

      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        zIndex: 10,
        background: "rgba(6,6,12,0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "10px 12px",
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: 2, textTransform: "uppercase" }}>Crowd Density</div>
        {[["#4ade80", "Low"], ["#d4a017", "Medium"], ["#f97316", "High"], ["#ef4444", "Critical"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}` }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Instruction hint */}
      <div style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 10,
        background: "rgba(6,6,12,0.7)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        padding: "6px 10px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: "rgba(255,255,255,0.25)",
        backdropFilter: "blur(8px)",
      }}>
        Click zones • Drag to orbit • Scroll to zoom
      </div>

      {/* Scenario badge */}
      {scenario !== "normal" && (
        <div style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          padding: "5px 14px",
          borderRadius: 20,
          background: `${config.primaryColor}20`,
          border: `1px solid ${config.primaryColor}50`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: config.primaryColor,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          boxShadow: `0 0 20px ${config.glowColor}`,
          animation: "pulse-slow 2s ease-in-out infinite",
        }}>
          {config.emoji} {config.label.toUpperCase()} SCENARIO ACTIVE
        </div>
      )}

      <Canvas
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [18, 14, 18], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={["#04040a", 30, 80]} />

          <SceneLights color={config.primaryColor} />
          <Stars radius={60} depth={40} count={800} factor={2} saturation={0} fade />

          <CameraIntro />

          {/* Stadium geometry */}
          <StadiumStands primaryColor={config.primaryColor} />
          <Pitch />
          <FloodlightTowers />

          {/* Crowd particles */}
          <CrowdParticles scenario={scenario} />

          {/* Rain weather overlay */}
          <RainParticles active={isRaining} />

          {/* Interactive zone hotspots */}
          {ZONES.map((zone) => (
            <ZoneHotspot
              key={zone.id}
              zone={zone}
              selected={selectedZone?.id === zone.id}
              onSelect={handleZoneSelect}
            />
          ))}

          {/* Orbit controls — allow user to explore */}
          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={35}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 1, 0]}
            dampingFactor={0.08}
            enableDamping
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
