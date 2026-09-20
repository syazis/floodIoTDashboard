'use client';

import React, { useState } from 'react';
import { 
  Map as MapIcon, 
  MapPin, 
  Compass, 
  Droplets, 
  CloudRain, 
  Sun, 
  Battery, 
  Camera, 
  ArrowRight,
  ShieldAlert,
  WifiOff
} from 'lucide-react';

interface MapStation {
  id: string;
  name: string;
  river: string;
  lat: number;
  lng: number;
  xPct: number; // Position percentage on map canvas (0-100)
  yPct: number;
  waterLevel: number;
  dangerThreshold: number;
  rainIntensity: number;
  battery: number;
  solarV: number;
  isOnline: boolean;
  status: 'ONLINE' | 'OFFLINE';
  description: string;
}

const MAP_STATIONS: MapStation[] = [
  {
    id: 'FL02',
    name: 'Station FL02',
    river: 'Sg. Gombak',
    lat: 3.1725,
    lng: 101.6940,
    xPct: 42,
    yPct: 24,
    waterLevel: 4.22,
    dangerThreshold: 4.40,
    rainIntensity: 12.0,
    battery: 94,
    solarV: 19.2,
    isOnline: true,
    status: 'ONLINE',
    description: 'Hulu Sg. Gombak berdekatan Jalan Kuching dan kawasan PWTC. Stesen aktif memancarkan telemetri 4G LTE.',
  },
  {
    id: 'FL01',
    name: 'Station FL01',
    river: 'Sg. Bunus',
    lat: 3.1604,
    lng: 101.6963,
    xPct: 52,
    yPct: 38,
    waterLevel: 3.45,
    dangerThreshold: 4.40,
    rainIntensity: 0.0,
    battery: 42,
    solarV: 0.0,
    isOnline: false,
    status: 'OFFLINE',
    description: 'Kawasan rendah berhampiran Kolam Takungan Bunus. (Status: Terputus hubungan sejak 3 jam lalu).',
  },
  {
    id: 'FL03',
    name: 'Station FL03',
    river: 'Sg. Klang',
    lat: 3.1485,
    lng: 101.6953,
    xPct: 48,
    yPct: 62,
    waterLevel: 3.98,
    dangerThreshold: 4.40,
    rainIntensity: 0.0,
    battery: 35,
    solarV: 0.0,
    isOnline: false,
    status: 'OFFLINE',
    description: 'Pertemuan Sg. Klang dan Sg. Gombak berhampiran pintu SMART Tunnel. (Status: Tiada isyarat LoRa).',
  },
  {
    id: 'FL04',
    name: 'Station FL04',
    river: 'Sg. Ampang',
    lat: 3.1650,
    lng: 101.7300,
    xPct: 78,
    yPct: 45,
    waterLevel: 2.15,
    dangerThreshold: 4.40,
    rainIntensity: 0.0,
    battery: 20,
    solarV: 0.0,
    isOnline: false,
    status: 'OFFLINE',
    description: 'Lembangan Sg. Ampang menghala ke kawasan Keramat. (Status: Luar talian sejak 1 hari lalu).',
  },
];

interface MapViewProps {
  onSelectStation?: (stationId: string) => void;
}

export default function MapView({ onSelectStation }: MapViewProps) {
  const [selectedStationId, setSelectedStationId] = useState<string>('FL02'); // Lalai ke FL02 (Online)
  const [layerRivers, setLayerRivers] = useState(true);
  const [layerHazard, setLayerHazard] = useState(true);
  const [layerRadar, setLayerRadar] = useState(false);
  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('dark');

  const activeStation = MAP_STATIONS.find(s => s.id === selectedStationId) || MAP_STATIONS[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 1. Header & Kawalan Lapisan GIS */}
      <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-white text-sm sm:text-base font-bold flex items-center gap-2">
            <MapIcon size={16} className="text-[#cc0000]" />
            Pusat Kawalan GIS Lembangan Sungai (Lembah Klang)
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Pemantauan spatial: <span className="text-emerald-400 font-bold">Stesen FL02 Online</span>, 3 stesen luar talian
          </p>
        </div>

        {/* Suis Lapisan (Layers Toggle) */}
        <div className="flex items-center gap-2 flex-wrap text-xs w-full sm:w-auto">
          <div className="flex bg-[#161616] p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
            <button
              onClick={() => setLayerRivers(!layerRivers)}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 ${
                layerRivers ? 'bg-[#0ea5e9] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Droplets size={11} /> Sungai
            </button>
            <button
              onClick={() => setLayerHazard(!layerHazard)}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 ${
                layerHazard ? 'bg-[#cc0000] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert size={11} /> Risiko
            </button>
            <button
              onClick={() => setLayerRadar(!layerRadar)}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 ${
                layerRadar ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CloudRain size={11} /> Radar
            </button>
          </div>

          <div className="flex bg-[#161616] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setBasemap('dark')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                basemap === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              GIS
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                basemap === 'satellite' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satelit
            </button>
          </div>
        </div>
      </div>

      {/* 2. KANVAS PETA UTAMA & LACI TELEMETRI */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        
        {/* Peta Interaktif (Col-span-8) */}
        <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] rounded-2xl border border-slate-800 h-[380px] sm:h-[480px] lg:h-[620px] relative overflow-hidden shadow-2xl flex items-center justify-center select-none">
          
          {/* Latar Belakang Peta (Dark GIS Grid / Satellite) */}
          <div 
            className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] sm:bg-[size:32px_32px]"
          />
          
          {basemap === 'satellite' ? (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f18] to-black opacity-90" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0c121e] via-[#070b12] to-black" />
          )}

          {/* SVG Rangkaian Sungai (River Network Layer) */}
          {layerRivers && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 640" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              
              {/* Sg. Gombak -> Masjid Jamek */}
              <path
                d="M 280 20 Q 340 100 370 200 T 400 380"
                fill="none"
                stroke="url(#riverGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                className="opacity-75"
              />
              {/* Sg. Bunus -> Sg. Klang */}
              <path
                d="M 440 80 Q 420 180 435 240 T 400 380"
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                strokeLinecap="round"
                className="opacity-80"
              />
              {/* Sg. Ampang -> Sg. Klang */}
              <path
                d="M 660 180 Q 560 260 490 320 T 400 380"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="5"
                strokeLinecap="round"
                className="opacity-70"
              />
              {/* Sg. Klang (Main downstream) */}
              <path
                d="M 400 380 Q 360 480 260 550 T 150 610"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="9"
                strokeLinecap="round"
                className="opacity-85"
              />
              
              {/* Label Sungai */}
              <text x="300" y="60" fill="#7dd3fc" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">SG. GOMBAK (FL02 ONLINE)</text>
              <text x="440" y="130" fill="#7dd3fc" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">SG. BUNUS</text>
              <text x="560" y="240" fill="#7dd3fc" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">SG. AMPANG</text>
              <text x="240" y="520" fill="#7dd3fc" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">SG. KLANG</text>
            </svg>
          )}

          {/* Lapisan Zon Risiko Banjir (Hazard Layer) */}
          {layerHazard && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[20%] left-[38%] w-24 sm:w-28 h-24 sm:h-28 bg-emerald-500/15 rounded-full blur-xl border border-emerald-500/30 animate-pulse" />
            </div>
          )}

          {/* Lapisan Radar Hujan Doppler */}
          {layerRadar && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_42%_24%,rgba(16,185,129,0.2),transparent_60%)] animate-pulse" />
          )}

          {/* Kompas */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-slate-800 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-400 text-[10px] sm:text-xs font-mono">
            <Compass size={14} className="text-[#cc0000] animate-spin-slow" />
            <span className="hidden xs:inline">KL GIS | EPSG:4326</span>
          </div>

          {/* Petunjuk Status Warna */}
          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-xl text-[9px] sm:text-[10px] text-slate-400 font-mono flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> 
              <span className="text-emerald-400 font-bold">Online (FL02)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span> 
              <span className="text-slate-400">Offline (3 Stesen)</span>
            </div>
          </div>

          {/* Pin Stesen Interaktif */}
          {MAP_STATIONS.map((station) => {
            const isSelected = selectedStationId === station.id;
            const isOnline = station.isOnline;

            return (
              <div
                key={station.id}
                onClick={() => setSelectedStationId(station.id)}
                style={{ top: `${station.yPct}%`, left: `${station.xPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 p-2 -m-2 touch-manipulation ${
                  !isOnline ? 'opacity-60 hover:opacity-100' : ''
                }`}
              >
                {/* Gelombang Radar Denyut untuk stesen ONLINE sahaja */}
                {isOnline && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-50 animate-ping" />
                    <div className="absolute -inset-2 rounded-full bg-emerald-500 opacity-25" />
                  </>
                )}

                {/* Butang Pin Utama */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-black flex items-center justify-center shadow-lg transition-transform ${
                    isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'group-hover:scale-110'
                  } ${isOnline ? 'bg-emerald-400' : 'bg-slate-700'}`}
                >
                  <MapPin size={12} className={isOnline ? "text-black font-extrabold" : "text-slate-400"} />
                </div>

                {/* Label Pin Apung */}
                <div className={`absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 font-mono text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border shadow-md pointer-events-none transition-all ${
                  isOnline 
                    ? 'border-emerald-500 text-emerald-300' 
                    : 'border-slate-800 text-slate-400'
                }`}>
                  {station.id}: {isOnline ? `${station.waterLevel.toFixed(2)}m (ONLINE)` : 'OFFLINE'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Laci Butiran Telemetri Stesen Terpilih (Col-span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
          
          <div className="flex justify-between items-start border-b border-slate-800 pb-3 sm:pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white text-base sm:text-lg font-bold">{activeStation.name}</h3>
                <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  activeStation.isOnline
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 animate-pulse'
                    : 'bg-red-950/60 text-red-400 border-red-900/60'
                }`}>
                  {activeStation.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeStation.river}</p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 bg-[#161616] px-2 py-1 rounded-lg border border-slate-800">
              {activeStation.id}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeStation.description}
          </p>

          {/* Metrik Utama Paras Air & Hujan */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-[#141414] p-3 rounded-xl border border-slate-800">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <Droplets size={12} className={activeStation.isOnline ? "text-[#0ea5e9]" : "text-slate-500"} /> Paras Air
              </span>
              <span className={`text-xl sm:text-2xl font-black ${activeStation.isOnline ? 'text-white' : 'text-slate-500'}`}>
                {activeStation.waterLevel.toFixed(2)}m
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block mt-0.5 font-mono">
                {activeStation.isOnline ? `Ambang: ${activeStation.dangerThreshold.toFixed(2)}m` : 'Data Arkib'}
              </span>
            </div>

            <div className="bg-[#141414] p-3 rounded-xl border border-slate-800">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <CloudRain size={12} className={activeStation.isOnline ? "text-indigo-400" : "text-slate-500"} /> Hujan
              </span>
              <span className={`text-xl sm:text-2xl font-black ${activeStation.isOnline ? 'text-white' : 'text-slate-500'}`}>
                {activeStation.rainIntensity.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm/j</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block mt-0.5 font-mono">
                {activeStation.isOnline ? 'Aktif' : 'Terputus'}
              </span>
            </div>
          </div>

          {/* Koordinat & Kuasa */}
          <div className="bg-[#141414] rounded-xl border border-slate-800 p-3 sm:p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Koordinat GPS:</span>
              <span className="text-white font-mono font-bold">
                {activeStation.lat.toFixed(4)}, {activeStation.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-2">
              <span className="flex items-center gap-1">
                <Sun size={12} className="text-amber-400" /> Solar:
              </span>
              <span className={`font-mono font-bold ${activeStation.isOnline ? 'text-white' : 'text-slate-500'}`}>
                {activeStation.solarV.toFixed(1)} V
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-2">
              <span className="flex items-center gap-1">
                <Battery size={12} className="text-emerald-400" /> Bateri:
              </span>
              <span className={`font-mono font-bold ${activeStation.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                {activeStation.battery}%
              </span>
            </div>
          </div>

          {/* Pratonton CCTV */}
          <div className="space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera size={13} className="text-sky-400" /> Pratonton CCTV ESP32-CAM
            </span>
            <div className="w-full h-28 sm:h-32 bg-black rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
              {activeStation.isOnline ? (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1580256081112-e49377338b7f?q=80&w=600&auto=format&fit=crop"
                    alt="CCTV Snapshot"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-950/90 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                    ONLINE CCTV ({activeStation.id})
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-500 text-xs">
                  <WifiOff size={20} className="text-red-500/70" />
                  <span>CCTV Luar Talian ({activeStation.id})</span>
                </div>
              )}
            </div>
          </div>

          {/* Butang Buka Stesen di Dashboard Utama */}
          {onSelectStation && (
            <button
              onClick={() => onSelectStation(activeStation.id)}
              className="w-full bg-[#161616] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold py-2 sm:py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>{activeStation.isOnline ? `Lihat Graf Live ${activeStation.id}` : `Lihat Log Arkib ${activeStation.id}`}</span>
              <ArrowRight size={13} className="text-[#0ea5e9]" />
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
