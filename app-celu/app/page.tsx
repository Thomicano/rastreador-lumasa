"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, Calendar, Bus, Heart } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
// @ts-ignore
import confetti from "canvas-confetti";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MapaSeguimiento = dynamic(() => import('@/components/MapaSeguimiento'), {
  ssr: false,
});


// Inicialización de Supabase con validación simple para Vercel

const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const getSupabaseUrl = () => {
  if (typeof window !== "undefined" && (supabaseUrlRaw.includes("127.0.0.1") || supabaseUrlRaw.includes("localhost"))) {
    const portMatch = supabaseUrlRaw.match(/:(\d+)/);
    const port = portMatch ? `:${portMatch[1]}` : "";
    return `http://${window.location.hostname}${port}`;
  }
  return supabaseUrlRaw;
};

const supabase: any = supabaseUrlRaw && supabaseKey
  ? createClient(getSupabaseUrl(), supabaseKey)
  : null;

// SWITCH DE PRUEBA: Cambiar a false para ocultar los colectivos que ya pasaron
const MOSTRAR_TODOS_PARA_PROBAR = false;

const getTipoDiaString = (date: Date): string => {
  if (date.getMonth() === 2 && date.getDate() === 24) {
    return "Domingo";
  }
  if (date.getMonth() === 2 && date.getDate() === 25) {
    return "Habil";
  }
  const dia = date.getDay();
  if (dia === 0) return "Domingo";
  if (dia === 6) return "Sabado";
  return "Habil";
};

// Componente de Fondo Animado con Framer Motion (Mona Mode 2.0)
const MonaBackground = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const shapes = ['❤️', '🐒', '🙈', '💖', '✨'];
    // Generar las partículas en cliente para coincidir hidratación
    const newParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      left: Math.random() * 100,
      size: 18 + Math.random() * 28, // pixels
      delay: Math.random() * 5,
      duration: 12 + Math.random() * 15
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-normal opacity-70">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '110vh', x: `${p.left}vw`, opacity: 0, rotate: -20, scale: 0.5 }}
          animate={{
            y: '-20vh',
            x: `${p.left + (Math.random() * 15 - 7.5)}vw`,
            opacity: [0, 0.9, 0.9, 0],
            rotate: [-20, 45, -45, 90],
            scale: [0.5, 1.2, 1.4, 0.8]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          className="absolute drop-shadow-xl"
          style={{
            fontSize: p.size,
            filter: "drop-shadow(0px 0px 8px rgba(255, 105, 180, 0.4))"
          }}
        >
          {p.shape}
        </motion.div>
      ))}
    </div>
  );
};
export default function HorariosApp() {
  const [horariosIda, setHorariosIda] = useState<any[]>([]);
  const [horariosVuelta, setHorariosVuelta] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [now, setNow] = useState<Date>(new Date());

  // Custom Tabs state
  const [activeTab, setActiveTab] = useState<"ida" | "vuelta">("ida");

  // Prevención de errores de hidratación para evitar que el renderizado de fechas rompa el árbol en celulares
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Rastrear state
  const [rastreando, setRastreando] = useState<string | null>(null);
  const [mapData, setMapData] = useState<{ lat: number, lon: number, title?: string, subtitle?: string } | null>(null);

  // Past buses state
  const [showPastBuses, setShowPastBuses] = useState(false);

  // Easter Egg State
  const [headerClicks, setHeaderClicks] = useState(0);
  const [isMonaMode, setIsMonaMode] = useState(false);

  // Trigger de Partículas al Activar
  useEffect(() => {
    if (isMonaMode) {
      // Explosión de corazones / purpurina rosada en canvas-confetti
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        // Colores rosa y blanco brillantes
        const colors = ['#f43f5e', '#fb7185', '#fda4af', '#ffffff', '#e11d48'];

        // Dispara de ambos lados
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors,
          shapes: ['circle', 'square']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors,
          shapes: ['circle', 'square']
        });
      }, 250);
    }
  }, [isMonaMode]);

  const handleDateClick = () => {
    if (isMonaMode) return;
    const newClicks = headerClicks + 1;
    setHeaderClicks(newClicks);
    if (newClicks >= 6) { // Actualizado a 6 Clicks
      setIsMonaMode(true);
    }
  };

  const formattedDate = useMemo(() => {
    const text = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(selectedDate);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }, [selectedDate]);

  const next7Days = useMemo(() => {
    const days = [];
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, [now.getDate()]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchHorarios = useCallback(async () => {
    try {
      setCargando(true);
      const tipoDiaOriginal = getTipoDiaString(selectedDate);
      const tipoDiaMinuscula = tipoDiaOriginal.toLowerCase();
      const valoresDiaValidos = [tipoDiaOriginal, tipoDiaMinuscula, 'Diario', 'diario'];

      if (!supabase) {
        setHorariosIda([]);
        setHorariosVuelta([]);
        return;
      }

      const { data: dataIda, error: errorIda } = await supabase
        .from('horarios')
        .select('*')
        .eq('origen', 'Despeñaderos')
        .eq('destino', 'Córdoba')
        .in('tipo_dia', valoresDiaValidos)
        .order('hora_salida', { ascending: true });

      if (errorIda) throw errorIda;

      const { data: dataVuelta, error: errorVuelta } = await supabase
        .from('horarios')
        .select('*')
        .eq('origen', 'Córdoba')
        .eq('destino', 'Despeñaderos')
        .in('tipo_dia', valoresDiaValidos)
        .order('hora_salida', { ascending: true });

      if (errorVuelta) throw errorVuelta;

      const deduplicateHorarios = (horarios: any[]) => {
        const seen = new Set();
        return horarios.filter(h => {
          if (seen.has(h.hora_salida)) return false;
          seen.add(h.hora_salida);
          return true;
        });
      };

      const finalIda = deduplicateHorarios(dataIda || []);
      const finalVuelta = deduplicateHorarios(dataVuelta || []);

      console.log(`[Network Debug] Cargados ${finalIda.length} de Ida, ${finalVuelta.length} de Vuelta.`);

      setHorariosIda(finalIda);
      setHorariosVuelta(finalVuelta);
    } catch (error) {
      console.error("Error al obtener datos de Supabase:", error);
    } finally {
      setCargando(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const dateStatus = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    if (selected.getTime() < today.getTime()) return 'past';
    if (selected.getTime() > today.getTime()) return 'future';
    return 'today';
  }, [selectedDate, now]);

  const classifyHorarios = (horarios: any[]) => {
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    let nextFound = false;

    return horarios.map((cole: any) => {
      if (!cole.hora_salida) return { ...cole, isPast: false, isNext: false };

      const [h, m] = cole.hora_salida.split(':').map(Number);
      const busTotalMinutes = h * 60 + (m || 0);

      let isPast = false;
      let isNext = false;

      if (dateStatus === 'past') {
        isPast = true;
      } else if (dateStatus === 'today') {
        if (busTotalMinutes < currentTotalMinutes) {
          isPast = true;
        } else if (!nextFound) {
          isNext = true;
          nextFound = true;
        }
      }

      return { ...cole, isPast, isNext };
    });
  };

  const processedIda = useMemo(() => classifyHorarios(horariosIda), [horariosIda, now, dateStatus]);
  const processedVuelta = useMemo(() => classifyHorarios(horariosVuelta), [horariosVuelta, now, dateStatus]);

  const handleRastrear = async (cole: any) => {
    if (!cole.hora_salida) return;

    // Identificador único para el estado de carga
    const idBus = cole.id || cole.hora_salida;
    setRastreando(idBus);

    const origen_id = activeTab === 'ida' ? '156' : '1';
    const destino_id = activeTab === 'ida' ? '1' : '156';
    const hora_servicio = cole.hora_salida.substring(0, 5);

    // Usamos el hostname dinámico de la ventana para apuntar siempre a la misma máquina en la LAN (ya sea localhost o 192.168.1.8)
    const apiUrl = `http://${window.location.hostname}:8000/api/rastrear_automatico?origen_id=${origen_id}&destino_id=${destino_id}&hora_servicio=${hora_servicio}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 'success') {
        const { lat, lon } = data.coordenadas;
        toast.success("¡Unidad localizada!", {
          description: "Desplegando radar en tiempo real..."
        });
        // Mostrar mapa con coordenadas
        setMapData({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          title: `Lumasa - ${hora_servicio}`,
          subtitle: `En viaje a ${activeTab === 'ida' ? 'Córdoba' : 'Despeñaderos'}`
        });
      } else {
        toast.error("El colectivo todavía no inició su recorrido.", {
          description: data.mensaje || "Intenta de nuevo en unos minutos."
        });
      }
    } catch (error) {
      console.error("Error rastreando:", error);
      toast.error("No se pudo conectar con el servidor.", {
        description: "Revisa tu conexión a internet o intenta más tarde."
      });
    } finally {
      setRastreando(null);
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-4 relative z-10 w-full p-1">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl bg-slate-200/50" />
      ))}
    </div>
  );

  const renderEmptyState = (message: string, icon: React.ReactNode, subtitle?: string) => (
    <div className="flex flex-col items-center justify-center p-10 mt-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center relative z-10 w-full">
      <div className={`p-4 rounded-2xl mb-4 ${isMonaMode ? 'bg-rose-50 text-rose-400' : 'bg-slate-50 text-indigo-400'}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 tracking-tight">{message}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );

  const TransportIcon = isMonaMode ? Heart : Bus;

  const renderHorarios = (horarios: any[]) => {
    if (horarios.length === 0) {
      return renderEmptyState(
        "No hay servicios para este día",
        <Clock className="w-8 h-8" />,
        "Prueba seleccionando otro día o revisa más tarde."
      );
    }

    const pastBuses = horarios.filter(cole => cole.isPast);
    const futureBuses = horarios.filter(cole => !cole.isPast);

    const renderBusCard = (cole: any, idx: number) => {
      const isLumasa = cole.empresa?.toLowerCase().includes("lumasa");
      const { isPast, isNext } = cole;

      return (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          key={cole.id || idx}
          className={`flex items-center justify-between bg-white rounded-2xl p-4 transition-all duration-500 ${isPast ? 'opacity-50 grayscale-[0.5]' : 'opacity-100'
            } ${isNext
              ? `border-2 scale-[1.02] ${isMonaMode ? 'border-rose-400 shadow-xl shadow-rose-500/20' : 'border-indigo-500 shadow-xl shadow-indigo-500/20'}`
              : `border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md ${isMonaMode ? 'hover:border-rose-200' : 'hover:border-indigo-100'}`
            }`}
        >
          {/* Información del Viaje */}
          <div className="flex flex-col">
            {isNext && (
              <motion.div
                // PRO Badge Profesional
                initial={isMonaMode ? { scale: 0.9, opacity: 0 } : false}
                animate={isMonaMode ? { scale: 1, opacity: 1 } : false}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-2 w-fit shadow-sm border ${isMonaMode
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/30 border-rose-400'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMonaMode ? 'bg-white' : 'bg-indigo-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isMonaMode ? 'bg-white' : 'bg-indigo-500'}`}></span>
                </span>
                Próximo servicio
              </motion.div>
            )}

            <h2 className={`text-3xl font-extrabold tracking-tighter ${isPast ? 'text-slate-400' : 'text-slate-900'}`}>
              {cole.hora_salida?.substring(0, 5)}
            </h2>

            <div className={`flex items-center text-sm font-medium mt-1 ${isPast ? 'text-slate-400' : 'text-slate-500'}`}>
              <TransportIcon className={`w-4 h-4 mr-1.5 ${isPast ? 'text-slate-300' : (isMonaMode ? 'text-rose-500 fill-rose-500' : 'text-indigo-400')
                }`} />
              {cole.empresa}
            </div>
          </div>

          <button
            onClick={() => handleRastrear(cole)}
            disabled={!isLumasa || rastreando === (cole.id || cole.hora_salida)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border ${rastreando === (cole.id || cole.hora_salida)
              ? `${isMonaMode ? 'bg-rose-400' : 'bg-indigo-400'} text-white cursor-wait shadow-sm border-transparent`
              : isLumasa
                ? `${isMonaMode ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/25' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'} text-white border-transparent shadow-md`
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
          >
            {rastreando === (cole.id || cole.hora_salida) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rastreando...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Rastrear
              </>
            )}
          </button>
        </motion.div>
      );
    };

    return (
      <div className="space-y-3 relative z-10 w-full">
        {pastBuses.length > 0 && (
          <div className="flex justify-center mb-2">
            <button
              onClick={() => setShowPastBuses(!showPastBuses)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4 transition-colors p-2"
            >
              {showPastBuses ? "Ocultar horarios anteriores" : "Mostrar horarios anteriores"}
            </button>
          </div>
        )}
        <AnimatePresence>
          {showPastBuses && pastBuses.map((cole: any, idx: number) => renderBusCard(cole, idx))}
          {futureBuses.map((cole: any, idx: number) => renderBusCard(cole, idx))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans pb-12 transition-colors duration-1000 overflow-hidden relative ${isMonaMode ? 'bg-rose-50/50 selection:bg-rose-200/50' : 'bg-slate-50 selection:bg-indigo-200/50'
      }`}>

      {/* Fondo de Partículas Personalizado (Mona Mode 2.0) */}
      {isMonaMode && <MonaBackground />}

      <div className="relative z-10">
        <header className="pt-12 pb-6 px-0 text-center relative">

          <div className="flex flex-col items-center justify-center space-y-4 mb-3 px-6 cursor-pointer select-none" onClick={handleDateClick}>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Badge
                variant="secondary"
                className={`border-none px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest gap-1.5 flex items-center shadow-sm transition-colors duration-500 ${isMonaMode ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </Badge>
            </motion.div>
          </div>

          {/* Confirmación Sutil Animated */}
          <AnimatePresence>
            {isMonaMode && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                className="absolute left-0 right-0 top-24 pointer-events-none"
              >
                <span className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 px-3 py-1 rounded-full shadow-sm drop-shadow-sm">
                  ¡6 Clicks! Novia monísima! ❤️🥳🐒
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.h1
            initial={isMonaMode ? { scale: 1.1, color: '#f43f5e' } : false}
            animate={{ scale: 1, color: '#0f172a' }}
            className={`text-4xl font-extrabold tracking-tight mb-2 px-6 ${isMonaMode ? 'mt-4' : ''}`}
          >
            Horarios
          </motion.h1>
          <p className="text-slate-500 font-medium px-6 mb-6">
            Encontrá el próximo colectivo fácilmente.
          </p>

          <div className="w-full max-w-xl mx-auto px-2 relative z-20">
            <div className="flex overflow-x-auto gap-4 py-3 scrollbar-hide snap-x sm:justify-center items-center" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {next7Days.map((d, i) => {
                const isSelected = d.getDate() === selectedDate.getDate() &&
                  d.getMonth() === selectedDate.getMonth();
                const dayName = new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d);
                const dayNumber = d.getDate();

                let bgClass = "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300";
                let textClass = "text-slate-400";
                let numClass = "text-slate-800";

                if (isSelected) {
                  if (isMonaMode) {
                    bgClass = "bg-gradient-to-br from-rose-500 to-pink-500 border-rose-400 shadow-lg shadow-rose-500/30 scale-105";
                    textClass = "text-rose-100";
                    numClass = "text-white";
                  } else {
                    bgClass = "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/30 scale-105";
                    textClass = "text-indigo-100";
                    numClass = "text-white";
                  }
                }

                return (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    key={i}
                    onClick={() => setSelectedDate(d)}
                    className={`flex-none snap-center flex flex-col items-center justify-center min-w-[65px] h-[75px] rounded-[20px] transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 ${bgClass}`}
                  >
                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${textClass}`}>
                      {dayName.replace('.', '')}
                    </span>
                    <span className={`text-2xl font-extrabold mt-0.5 tracking-tight transition-colors duration-300 ${numClass}`}>
                      {dayNumber}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 sm:px-6 relative z-10">

          {/* Contenedor del Mapa Integrado (Condicional) */}
          <AnimatePresence>
            {mapData && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, height: 'auto', scale: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // Shadcn/Radix signature ease-out spring feeling
                className="w-full mb-6 relative overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2"
              >
                <div className="w-full bg-white rounded-3xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 p-1 relative z-0">
                  <MapaSeguimiento
                    lat={mapData.lat}
                    lon={mapData.lon}
                    title={mapData.title}
                    subtitle={mapData.subtitle}
                    onClose={() => setMapData(null)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex bg-slate-200/60 p-1.5 rounded-2xl mb-6 shadow-inner border border-slate-200/50">
            <button
              onClick={() => setActiveTab('ida')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-[14px] transition-all duration-300 ${activeTab === 'ida'
                ? `bg-white ${isMonaMode ? 'text-rose-600' : 'text-indigo-700'} shadow-sm border border-slate-100`
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }`}
            >
              Ida a Córdoba
            </button>
            <button
              onClick={() => setActiveTab('vuelta')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-[14px] transition-all duration-300 ${activeTab === 'vuelta'
                ? `bg-white ${isMonaMode ? 'text-rose-600' : 'text-indigo-700'} shadow-sm border border-slate-100`
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }`}
            >
              Vuelta a Despeñaderos
            </button>
          </div>

          <div className="transition-opacity duration-300 relative z-10 w-full mb-10">
            <AnimatePresence mode="wait">
              {activeTab === 'ida' && (
                <motion.div
                  key="ida"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  {(!isMounted || cargando) ? renderSkeletons() : renderHorarios(processedIda)}
                </motion.div>
              )}

              {activeTab === 'vuelta' && (
                <motion.div
                  key="vuelta"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {(!isMounted || cargando) ? renderSkeletons() : renderHorarios(processedVuelta)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </main>
      </div>
    </div>
  );
}