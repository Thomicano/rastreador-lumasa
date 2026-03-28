'use client';

import dynamic from 'next/dynamic';
import { MapPin, Loader2, X } from 'lucide-react';

const MapWithoutSSR = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] sm:h-[400px] rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 flex flex-col items-center justify-center border border-dashed border-border animate-pulse">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-2" />
      <span className="text-sm font-medium text-slate-500">Iniciando satélite...</span>
    </div>
  )
});

interface MapaSeguimientoProps {
  lat: number;
  lon: number;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

export default function MapaSeguimiento({ lat, lon, title, subtitle, onClose }: MapaSeguimientoProps) {
  return (
    <div className="w-full py-2 px-1 flex flex-col gap-3">
      {/* Cabecera del Mapa */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight text-slate-800">Unidad localizada</h3>
            <p className="text-[13px] font-medium text-slate-500">Mostrando en tiempo real</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-100/80 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded-full transition-all duration-300"
            title="Cerrar y volver a horarios"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Contenedor responsivo del mapa */}
      <div className="relative w-full">
        <MapWithoutSSR lat={lat} lon={lon} title={title} subtitle={subtitle} />
      </div>
    </div>
  );
}
