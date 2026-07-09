"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const centerIcon = L.divIcon({
  className: 'center-icon',
  html: `<div style="background-color: #d4a017; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 20px #d4a017; animation: pulse 2s infinite;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

interface StadiumMapProps {
  flashSOS?: boolean;
  highlightRoute?: boolean;
  selectedGate?: string;
}

export default function StadiumMap({ flashSOS = false, highlightRoute = false, selectedGate = "Gate 6" }: StadiumMapProps) {
  const center: [number, number] = [40.8128, -74.0745];
  
  // Coordinates for gates
  const gateCoords: Record<string, [number, number]> = {
    "Gate 1": [40.8145, -74.0740],
    "Gate 4": [40.8115, -74.0740],
    "Gate 6": [40.8130, -74.0765],
  };

  // Get active gate coordinates
  const activeGateCoord = gateCoords[selectedGate] || gateCoords["Gate 6"];
  
  // Route polyline coordinates (from gate to center seat)
  const routePoints: [number, number][] = [
    activeGateCoord,
    [activeGateCoord[0], -74.0745], // Corner point for styling path
    center
  ];

  return (
    <div className="w-full h-full min-h-[500px] bg-[#050505]">
      <MapContainer 
        center={center} 
        zoom={16.5} 
        style={{ height: "100%", width: "100%", background: "#050505" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Center Point */}
        <Marker position={center} icon={centerIcon}>
          <Popup className="custom-popup">
            <div className="bg-black/90 text-white p-2 rounded border border-[#d4a017]/30">
              <strong className="text-[#d4a017]">Your Seat Block</strong>
              <br/>Block 114, Row F
            </div>
          </Popup>
        </Marker>
        
        {/* Gates */}
        <Marker position={gateCoords["Gate 1"]} icon={createCustomIcon('#4facfe')}>
          <Popup><div className="font-bold">Gate 1 (North)</div></Popup>
        </Marker>
        <Marker position={gateCoords["Gate 4"]} icon={createCustomIcon('#4facfe')}>
          <Popup><div className="font-bold">Gate 4 (South)</div></Popup>
        </Marker>
        <Marker position={gateCoords["Gate 6"]} icon={createCustomIcon('#4facfe')}>
          <Popup><div className="font-bold">Gate 6 (West)</div></Popup>
        </Marker>
        
        {/* Medical & Food */}
        <Marker position={[40.8135, -74.0720]} icon={createCustomIcon('#ef4444')}>
          <Popup><div className="font-bold text-red-500">Medical Station East</div></Popup>
        </Marker>
        <Marker position={[40.8120, -74.0725]} icon={createCustomIcon('#f97316')}>
          <Popup><div className="font-bold text-orange-500">FIFA Grill (Food Court)</div></Popup>
        </Marker>

        {/* Dynamic Heatmaps */}
        <Circle center={[40.8135, -74.0740]} radius={60} pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.4, weight: 1 }} />
        <Circle center={[40.8120, -74.0755]} radius={45} pathOptions={{ color: 'orange', fillColor: '#f97316', fillOpacity: 0.3, weight: 1 }} />
        <Circle center={[40.8125, -74.0730]} radius={50} pathOptions={{ color: 'green', fillColor: '#22c55e', fillOpacity: 0.2, weight: 1 }} />

        {/* Dynamic SOS Flashing Area */}
        {flashSOS && (
          <>
            <Circle 
              center={activeGateCoord} 
              radius={80} 
              pathOptions={{ color: 'red', fillColor: '#red', fillOpacity: 0.5, weight: 2 }} 
            />
            <Circle 
              center={activeGateCoord} 
              radius={150} 
              pathOptions={{ color: 'red', fillColor: '#red', fillOpacity: 0.2, weight: 1, dashArray: '5, 10' }} 
            />
          </>
        )}

        {/* Dynamic Route Highlight */}
        {highlightRoute && (
          <Polyline 
            positions={routePoints} 
            pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '10, 10', lineCap: 'round' }} 
          />
        )}
      </MapContainer>
      
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: #121212 !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1);
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(212, 160, 23, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 160, 23, 0); }
        }
      `}} />
    </div>
  );
}
