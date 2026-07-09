"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Sparkles, Stars, Text, Html } from "@react-three/drei";
import * as THREE from "three";

// A programmatic stadium model
function Stadium() {
  const stadiumRef = useRef<THREE.Group>(null);

  // Rotate slowly
  useFrame((state) => {
    if (stadiumRef.current) {
      stadiumRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={stadiumRef} position={[0, -2, 0]}>
      {/* Pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#1a472a" roughness={0.8} />
      </mesh>
      
      {/* Pitch Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
        <ringGeometry args={[1.5, 1.6, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
        <planeGeometry args={[0.1, 14]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Outer Pitch Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.105, 0]}>
        <boxGeometry args={[19, 13, 0.05]} />
        <meshBasicMaterial color="#ffffff" wireframe />
      </mesh>

      {/* Seating Tiers */}
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} position={[0, 1 + tier * 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[12 + tier * 2.5, 2, 4, 100, Math.PI * 2]} />
          <meshStandardMaterial 
            color={tier % 2 === 0 ? "#111111" : "#1a1a1a"} 
            roughness={0.7} 
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* VIP Zones (Glowing Rings on top) */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[19, 0.2, 16, 100]} />
        <meshStandardMaterial color="#d4a017" emissive="#d4a017" emissiveIntensity={1.5} />
      </mesh>

      {/* Stadium Roof / Canopy */}
      <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[18, 3, 16, 100, Math.PI * 2]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          transmission={0.9} 
          opacity={1} 
          metalness={0} 
          roughness={0} 
          ior={1.5} 
          thickness={0.5} 
        />
      </mesh>
    </group>
  );
}

// Data markers for the Digital Twin
function DataMarker({ position, label, value, color }: { position: [number, number, number], label: string, value: string, color: string }) {
  const markerRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2 + position[0]) * 0.2;
    }
  });

  return (
    <group ref={markerRef} position={position}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <Html position={[0, 0.8, 0]} center>
        <div className="glass-panel px-3 py-1 text-xs whitespace-nowrap border rounded-md" style={{ borderColor: color }}>
          <div className="text-gray-400">{label}</div>
          <div className="font-bold text-white">{value}</div>
        </div>
      </Html>
    </group>
  );
}

export default function Scene() {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505] z-10 pointer-events-none" />
      <Canvas camera={{ position: [0, 15, 25], fov: 50 }}>
        <color attach="background" args={["#050505"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[20, 30, 10]} intensity={1.5} color="#ffffff" castShadow />
        <spotLight position={[-20, 20, -10]} intensity={2} color="#4facfe" />
        <spotLight position={[20, 20, 10]} intensity={2} color="#d4a017" />
        
        <Stadium />
        
        {/* Indicators */}
        <DataMarker position={[-8, 3, -5]} label="GATE A DENSITY" value="82% CAP" color="#ff4444" />
        <DataMarker position={[8, 3, 5]} label="GATE B FLOW" value="OPTIMAL" color="#44ff44" />
        <DataMarker position={[0, 2, 8]} label="MEDICAL 1" value="STANDBY" color="#44aaff" />
        <DataMarker position={[0, 6, -10]} label="VIP LOUNGE" value="65% OCCUPIED" color="#d4a017" />
        
        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <Sparkles count={400} scale={30} size={2} speed={0.2} opacity={0.3} color="#ffffff" />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={10}
          maxDistance={50}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
