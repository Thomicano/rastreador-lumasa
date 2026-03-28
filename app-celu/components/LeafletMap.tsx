'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuración del icono personalizado usando un emoji de colectivo 🚌
const busIcon = new L.DivIcon({
  html: `<div style="font-size: 22px; background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid #3b82f6;">🚌</div>`,
  className: 'custom-bus-icon text-center',
  iconSize: [40, 40],
  iconAnchor: [20, 20], 
  popupAnchor: [0, -20] 
});

// Componente helper para centrar el mapa suavemente (flyTo) cuando las coordenadas cambian
function RecenterAutomatically({lat, lon}: {lat: number, lon: number}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 15, { animate: true, duration: 1.5 });
  }, [lat, lon, map]);
  return null;
}

interface LeafletMapProps {
  lat: number;
  lon: number;
  title?: string;
  subtitle?: string;
}

export default function LeafletMap({ lat, lon, title, subtitle }: LeafletMapProps) {
  const position: [number, number] = [lat, lon];

  return (
    <div className="w-full h-full min-h-[300px] sm:min-h-[400px] rounded-2xl overflow-hidden shadow-lg border border-border relative">
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={true}
        style={{ height: '100%', minHeight: '300px', width: '100%', zIndex: 0 }} 
      >
        <RecenterAutomatically lat={lat} lon={lon} />
        
        {/* Usamos el tileLayer de OpenStreetMap (gratuito) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Nuestro marcador del colectivo animado */}
        <Marker position={position} icon={busIcon}>
          <Popup className="font-sans">
            <div className="text-center rounded-md px-1 py-1">
              <p className="font-bold text-slate-800 m-0 text-[15px] leading-tight flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
                 {title || 'Lumasa en camino'}
              </p>
              <p className="text-xs text-slate-500 m-0 mt-1">{subtitle || 'Unidad detectada en el radar'}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
