'use client';

import React, { useState } from 'react';
import { 
  Radio, 
  Cpu, 
  Battery, 
  Sun, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  Droplets, 
  Activity, 
  Camera, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Check,
  Search,
  WifiOff
} from 'lucide-react';

interface SensorNode {
  id: string;
  name: string;
  river: string;
  hardwareId: string;
  firmware: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'MAINTENANCE';
  lastPing: string;
  waterLevelSensor: {
    model: string;
    reading: number; // m
    accuracy: string;
    temperature: number; // °C
    status: 'OPTIMAL' | 'ATTENTION' | 'OFFLINE';
  };
  rainGauge: {
    model: string;
    intensity: number; // mm/h
    dailyTotal: number; // mm
    status: 'ACTIVE' | 'IDLE' | 'OFFLINE';
  };
  powerSystem: {
    solarVoltage: number; // V
    solarCurrent: number; // A
    batteryPercent: number; // %
    batteryTemp: number; // °C
    mpptState: 'BULK' | 'FLOAT' | 'STANDBY' | 'DISCONNECTED';
  };
  telemetry: {
    type: string;
    rssi: number; // dBm
    packetLoss: number; // %
    ipAddress: string;
  };
  camera: {
    model: string;
    fps: number;
    status: 'STANDBY' | 'STREAMING' | 'OFFLINE';
  };
}

const DUMMY_SENSORS: SensorNode[] = [
  {
    id: 'FL02',
    name: 'Station FL02',
    river: 'Sg. Gombak (Jalan Kuching)',
    hardwareId: 'ESP32-FL-002B',
    firmware: 'v2.4.2-rel',
    status: 'ONLINE',
    lastPing: '2 saat lalu (Aktif)',
    waterLevelSensor: {
      model: 'A02YYUW Waterproof Ultrasonic',
      reading: 4.22,
      accuracy: '±0.8 cm',
      temperature: 27.9,
      status: 'OPTIMAL',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 12.0,
      dailyTotal: 24.5,
      status: 'ACTIVE',
    },
    powerSystem: {
      solarVoltage: 19.2,
      solarCurrent: 1.8,
      batteryPercent: 94,
      batteryTemp: 28.5,
      mpptState: 'FLOAT',
    },
    telemetry: {
      type: '4G LTE Cat-M1 (Online)',
      rssi: -65,
      packetLoss: 0.01,
      ipAddress: '10.204.12.82',
    },
    camera: {
      model: 'OV2640 2MP',
      fps: 15,
      status: 'STANDBY',
    },
  },
  {
    id: 'FL01',
    name: 'Station FL01',
    river: 'Sg. Bunus (Jalan Tun Razak)',
    hardwareId: 'ESP32-FL-001A',
    firmware: 'v2.4.2-rel',
    status: 'OFFLINE',
    lastPing: 'Terputus (3 jam lalu)',
    waterLevelSensor: {
      model: 'JSN-SR04T v3 (Ultrasonic)',
      reading: 3.45,
      accuracy: '±1.0 cm',
      temperature: 28.4,
      status: 'OFFLINE',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 0.0,
      dailyTotal: 38.2,
      status: 'OFFLINE',
    },
    powerSystem: {
      solarVoltage: 0.0,
      solarCurrent: 0.0,
      batteryPercent: 42,
      batteryTemp: 29.1,
      mpptState: 'DISCONNECTED',
    },
    telemetry: {
      type: '4G Disconnected',
      rssi: 0,
      packetLoss: 100,
      ipAddress: 'N/A (Offline)',
    },
    camera: {
      model: 'OV2640 2MP',
      fps: 0,
      status: 'OFFLINE',
    },
  },
  {
    id: 'FL03',
    name: 'Station FL03',
    river: 'Sg. Klang (Masjid Jamek Confluence)',
    hardwareId: 'ESP32-FL-003C',
    firmware: 'v2.4.1-rel',
    status: 'OFFLINE',
    lastPing: 'Terputus (5 jam lalu)',
    waterLevelSensor: {
      model: 'JSN-SR04T v3 (Ultrasonic)',
      reading: 3.98,
      accuracy: '±1.2 cm',
      temperature: 30.1,
      status: 'OFFLINE',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 0.0,
      dailyTotal: 52.8,
      status: 'OFFLINE',
    },
    powerSystem: {
      solarVoltage: 0.0,
      solarCurrent: 0.0,
      batteryPercent: 35,
      batteryTemp: 32.4,
      mpptState: 'DISCONNECTED',
    },
    telemetry: {
      type: 'LoRa Disconnected',
      rssi: 0,
      packetLoss: 100,
      ipAddress: 'N/A (Offline)',
    },
    camera: {
      model: 'OV2640 2MP Wide-Angle',
      fps: 0,
      status: 'OFFLINE',
    },
  },
  {
    id: 'FL04',
    name: 'Station FL04',
    river: 'Sg. Ampang (Taman Keramat)',
    hardwareId: 'ESP32-FL-004D',
    firmware: 'v2.4.2-rel',
    status: 'OFFLINE',
    lastPing: 'Terputus (1 hari lalu)',
    waterLevelSensor: {
      model: 'A02YYUW Waterproof Ultrasonic',
      reading: 2.15,
      accuracy: '±0.5 cm',
      temperature: 27.3,
      status: 'OFFLINE',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 0.0,
      dailyTotal: 18.0,
      status: 'OFFLINE',
    },
    powerSystem: {
      solarVoltage: 0.0,
      solarCurrent: 0.0,
      batteryPercent: 20,
      batteryTemp: 27.8,
      mpptState: 'DISCONNECTED',
    },
    telemetry: {
      type: '4G Disconnected',
      rssi: 0,
      packetLoss: 100,
      ipAddress: 'N/A (Offline)',
    },
    camera: {
      model: 'OV2640 2MP',
      fps: 0,
      status: 'OFFLINE',
    },
  },
];

export default function SensorsView() {
  const [selectedStationFilter, setSelectedStationFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [pingedStationId, setPingedStationId] = useState<string | null>(null);
  const [calibrationModalStation, setCalibrationModalStation] = useState<string | null>(null);
  const [calibrationSuccess, setCalibrationSuccess] = useState(false);

  const filteredSensors = DUMMY_SENSORS.filter((node) => {
    if (selectedStationFilter !== 'ALL' && node.id !== selectedStationFilter) return false;
    if (selectedStatusFilter !== 'ALL' && node.status !== selectedStatusFilter) return false;
    return true;
  });

  const handlePingAll = () => {
    setIsPingingAll(true);
    setTimeout(() => {
      setIsPingingAll(false);
    }, 1500);
  };

  const handlePingSingle = (id: string) => {
    setPingedStationId(id);
    setTimeout(() => {
      setPingedStationId(null);
    }, 1200);
  };

  const handleRunCalibration = () => {
    setCalibrationSuccess(true);
    setTimeout(() => {
      setCalibrationSuccess(false);
      setCalibrationModalStation(null);
    }, 1600);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 1. KAD METRIK TELEMETRI GLOBAL ATAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Radio size={13} className="text-[#0ea5e9]" /> Stesen Aktif
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">
              FL02 SAHAJA
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">1 / 4 Stesen</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">FL02 Online, 3 Offline</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Battery size={13} className="text-emerald-400" /> Bateri FL02
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">
              Optimum
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">94.0%</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">LiFePO4 simpanan 48j</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Sun size={13} className="text-amber-400" /> Solar FL02
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/50">
              Float
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">19.2 V</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Pengecasan solar aktif</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Wifi size={13} className="text-indigo-400" /> Kualiti FL02
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">
              65ms
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">-65 dBm</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">4G Cat-M1 bersambung</p>
        </div>
      </div>

      {/* 2. BAR PENAPIS & BUTANG TINDAKAN */}
      <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Penapis Stesen */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-xs font-semibold text-slate-400">Stesen:</span>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000] w-full sm:w-auto"
            >
              <option value="ALL">Semua Stesen (FL01 - FL04)</option>
              <option value="FL02">FL02 - Sg. Gombak (ONLINE)</option>
              <option value="FL01">FL01 - Sg. Bunus (OFFLINE)</option>
              <option value="FL03">FL03 - Sg. Klang (OFFLINE)</option>
              <option value="FL04">FL04 - Sg. Ampang (OFFLINE)</option>
            </select>
          </div>

          {/* Penapis Status */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-xs font-semibold text-slate-400">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000] w-full sm:w-auto"
            >
              <option value="ALL">Semua Status</option>
              <option value="ONLINE">Online Sahaja (FL02)</option>
              <option value="OFFLINE">Offline Sahaja (FL01, FL03, FL04)</option>
            </select>
          </div>
        </div>

        <div>
          <button
            onClick={handlePingAll}
            disabled={isPingingAll}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#161616] hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw size={13} className={isPingingAll ? 'animate-spin text-[#0ea5e9]' : ''} />
            {isPingingAll ? 'Memeriksa Telemetri...' : 'Ping Telemetri'}
          </button>
        </div>
      </div>

      {/* 3. SENARAI KAD PERKAKASAN STESEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredSensors.map((node) => {
          const isOnline = node.status === 'ONLINE';
          const isSinglePing = pingedStationId === node.id;
          return (
            <div
              key={node.id}
              className={`rounded-2xl border p-4 sm:p-6 shadow-md transition-all space-y-4 sm:space-y-5 ${
                isOnline
                  ? 'bg-[#0f0f0f] border-slate-800 hover:border-emerald-700/60 ring-1 ring-emerald-500/20'
                  : 'bg-[#0a0a0a] border-slate-900 opacity-75'
              }`}
            >
              {/* Header Stesen */}
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white text-base sm:text-lg font-bold">{node.name}</h3>
                    <span
                      className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                        isOnline
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 animate-pulse'
                          : 'bg-red-950/60 text-red-400 border-red-900/60'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{node.river}</p>
                  <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 mt-0.5">
                    ID: <span className="text-slate-300">{node.hardwareId}</span> | FW: {node.firmware}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Status Link:</span>
                  <span className={`text-[11px] sm:text-xs font-mono font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                    {node.lastPing}
                  </span>
                  {isOnline ? (
                    <button
                      onClick={() => handlePingSingle(node.id)}
                      className="mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold bg-[#161616] hover:bg-slate-800 border border-slate-800 text-sky-400 px-2 py-1 rounded-lg transition-all ml-auto"
                    >
                      <RefreshCw size={11} className={isSinglePing ? 'animate-spin' : ''} />
                      {isSinglePing ? 'Ping...' : 'Ping Node'}
                    </button>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 justify-end">
                      <WifiOff size={11} className="text-red-400" /> Tiada Sambungan
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Sensor Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* 1. Sensor Paras Air */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Droplets size={13} className={isOnline ? "text-[#0ea5e9]" : "text-slate-500"} /> Paras Air
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      isOnline ? 'bg-sky-950/80 text-sky-400 border-sky-800/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {node.waterLevelSensor.status}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className={`text-xl sm:text-2xl font-black ${isOnline ? 'text-white' : 'text-slate-500'}`}>
                      {node.waterLevelSensor.reading.toFixed(2)}m
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                      {isOnline ? node.waterLevelSensor.accuracy : 'Log Terakhir'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {node.waterLevelSensor.model}
                  </p>
                </div>

                {/* 2. Tolok Hujan (Rain Gauge) */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Activity size={13} className={isOnline ? "text-indigo-400" : "text-slate-500"} /> Tolok Hujan
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      isOnline ? 'bg-indigo-950/80 text-indigo-400 border-indigo-800/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {node.rainGauge.status}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className={`text-xl sm:text-2xl font-black ${isOnline ? 'text-white' : 'text-slate-500'}`}>
                      {node.rainGauge.intensity.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm/j</span>
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">Hari: {node.rainGauge.dailyTotal.toFixed(1)}mm</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {node.rainGauge.model}
                  </p>
                </div>

                {/* 3. Sistem Kuasa (Solar & Bateri) */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap size={13} className={isOnline ? "text-amber-400" : "text-slate-500"} /> Kuasa Solar
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      isOnline ? 'bg-amber-950/80 text-amber-400 border-amber-800/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {node.powerSystem.mpptState}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className={`text-base sm:text-lg font-bold ${isOnline ? 'text-white' : 'text-slate-500'}`}>
                      {node.powerSystem.solarVoltage.toFixed(1)}V <span className="text-xs font-normal text-slate-400">({node.powerSystem.solarCurrent.toFixed(1)}A)</span>
                    </span>
                    <span className={`text-xs font-mono font-bold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                      Bateri: {node.powerSystem.batteryPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className={`h-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} style={{ width: `${node.powerSystem.batteryPercent}%` }} />
                  </div>
                </div>

                {/* 4. Rangkaian & Kamera */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3 sm:p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Wifi size={13} className={isOnline ? "text-emerald-400" : "text-slate-500"} /> Modem & Kamera
                    </span>
                    <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                      {node.telemetry.ipAddress}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">Kamera: {node.camera.status}</span>
                    <span className={`text-xs font-mono font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isOnline ? `${node.telemetry.rssi} dBm` : 'Tiada Isyarat'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {node.telemetry.type}
                  </p>
                </div>

              </div>

              {/* Tindakan Bawah Kad */}
              <div className="pt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                {isOnline ? (
                  <button
                    onClick={() => setCalibrationModalStation(node.id)}
                    className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-white bg-[#161616] hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl font-semibold transition-all w-full sm:w-auto"
                  >
                    <Sliders size={13} /> Kalibrasi Sifar Paras Air
                  </button>
                ) : (
                  <span className="text-[11px] text-red-400/80 italic">
                    Stesen ini luar talian (perlu lawatan teknikal lapangan)
                  </span>
                )}
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono text-center sm:text-right">
                  {isOnline ? 'Sampel data aktif setiap 10s' : 'Sambungan terputus'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL KALIBRASI SIMULASI */}
      {calibrationModalStation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white text-base font-bold flex items-center gap-2">
                <Sliders size={16} className="text-sky-400" />
                Kalibrasi Stesen {calibrationModalStation}
              </h4>
              <button
                onClick={() => setCalibrationModalStation(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Penentukuran ini menghantar arahan kalibrasi sifar (*zero offset calibration*) ke mikropengawal ESP32 stesen {calibrationModalStation} untuk memastikan bacaan sensor ultrasonik selaras dengan tanda aras fizikal sungai.
            </p>

            <div className="bg-[#141414] p-3 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
              <p className="text-slate-400">Node: ESP32-FL-{calibrationModalStation}</p>
              <p className="text-slate-400">Offset Semasa: +0.02 m</p>
              <p className="text-emerald-400">Status Komunikasi: Bersedia</p>
            </div>

            {calibrationSuccess ? (
              <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2 font-bold animate-pulse">
                <Check size={16} /> Kalibrasi berjaya diselaraskan ke ESP32!
              </div>
            ) : (
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setCalibrationModalStation(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#161616] border border-slate-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleRunCalibration}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 shadow-sm"
                >
                  Jalankan Kalibrasi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
