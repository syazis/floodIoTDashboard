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
  Search
} from 'lucide-react';

interface SensorNode {
  id: string;
  name: string;
  river: string;
  hardwareId: string;
  firmware: string;
  status: 'ONLINE' | 'WARNING' | 'MAINTENANCE';
  lastPing: string;
  waterLevelSensor: {
    model: string;
    reading: number; // m
    accuracy: string;
    temperature: number; // °C
    status: 'OPTIMAL' | 'ATTENTION';
  };
  rainGauge: {
    model: string;
    intensity: number; // mm/h
    dailyTotal: number; // mm
    status: 'ACTIVE' | 'IDLE';
  };
  powerSystem: {
    solarVoltage: number; // V
    solarCurrent: number; // A
    batteryPercent: number; // %
    batteryTemp: number; // °C
    mpptState: 'BULK' | 'FLOAT' | 'STANDBY';
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
    id: 'FL01',
    name: 'Station FL01',
    river: 'Sg. Bunus (Jalan Tun Razak)',
    hardwareId: 'ESP32-FL-001A',
    firmware: 'v2.4.2-rel',
    status: 'ONLINE',
    lastPing: '2 saat lalu',
    waterLevelSensor: {
      model: 'JSN-SR04T v3 (Ultrasonic)',
      reading: 3.45,
      accuracy: '±1.0 cm',
      temperature: 28.4,
      status: 'OPTIMAL',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 14.5,
      dailyTotal: 38.2,
      status: 'ACTIVE',
    },
    powerSystem: {
      solarVoltage: 18.6,
      solarCurrent: 2.1,
      batteryPercent: 88,
      batteryTemp: 29.1,
      mpptState: 'BULK',
    },
    telemetry: {
      type: '4G LTE Cat-M1 + LoRa',
      rssi: -62,
      packetLoss: 0.01,
      ipAddress: '10.204.12.81',
    },
    camera: {
      model: 'OV2640 2MP Night-Vision',
      fps: 15,
      status: 'STANDBY',
    },
  },
  {
    id: 'FL02',
    name: 'Station FL02',
    river: 'Sg. Gombak (Jalan Kuching)',
    hardwareId: 'ESP32-FL-002B',
    firmware: 'v2.4.2-rel',
    status: 'ONLINE',
    lastPing: '4 saat lalu',
    waterLevelSensor: {
      model: 'A02YYUW Waterproof Ultrasonic',
      reading: 4.22,
      accuracy: '±0.8 cm',
      temperature: 27.9,
      status: 'OPTIMAL',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 0.0,
      dailyTotal: 12.4,
      status: 'IDLE',
    },
    powerSystem: {
      solarVoltage: 19.2,
      solarCurrent: 1.8,
      batteryPercent: 94,
      batteryTemp: 28.5,
      mpptState: 'FLOAT',
    },
    telemetry: {
      type: '4G LTE Cat-M1',
      rssi: -68,
      packetLoss: 0.02,
      ipAddress: '10.204.12.82',
    },
    camera: {
      model: 'OV2640 2MP',
      fps: 15,
      status: 'STANDBY',
    },
  },
  {
    id: 'FL03',
    name: 'Station FL03',
    river: 'Sg. Klang (Masjid Jamek Confluence)',
    hardwareId: 'ESP32-FL-003C',
    firmware: 'v2.4.1-rel',
    status: 'WARNING',
    lastPing: '12 saat lalu',
    waterLevelSensor: {
      model: 'JSN-SR04T v3 (Ultrasonic)',
      reading: 3.98,
      accuracy: '±1.2 cm',
      temperature: 30.1,
      status: 'ATTENTION',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 22.0,
      dailyTotal: 52.8,
      status: 'ACTIVE',
    },
    powerSystem: {
      solarVoltage: 14.1,
      solarCurrent: 0.8,
      batteryPercent: 68,
      batteryTemp: 32.4,
      mpptState: 'BULK',
    },
    telemetry: {
      type: 'LoRaWAN + 4G Backup',
      rssi: -84,
      packetLoss: 0.15,
      ipAddress: '10.204.12.83',
    },
    camera: {
      model: 'OV2640 2MP Wide-Angle',
      fps: 12,
      status: 'STANDBY',
    },
  },
  {
    id: 'FL04',
    name: 'Station FL04',
    river: 'Sg. Ampang (Taman Keramat)',
    hardwareId: 'ESP32-FL-004D',
    firmware: 'v2.4.2-rel',
    status: 'ONLINE',
    lastPing: '1 saat lalu',
    waterLevelSensor: {
      model: 'A02YYUW Waterproof Ultrasonic',
      reading: 2.15,
      accuracy: '±0.5 cm',
      temperature: 27.3,
      status: 'OPTIMAL',
    },
    rainGauge: {
      model: 'Tipping Bucket 0.2mm',
      intensity: 4.2,
      dailyTotal: 18.0,
      status: 'ACTIVE',
    },
    powerSystem: {
      solarVoltage: 19.5,
      solarCurrent: 2.4,
      batteryPercent: 96,
      batteryTemp: 27.8,
      mpptState: 'FLOAT',
    },
    telemetry: {
      type: '4G LTE Cat-M1 + LoRa',
      rssi: -58,
      packetLoss: 0.00,
      ipAddress: '10.204.12.84',
    },
    camera: {
      model: 'OV2640 2MP',
      fps: 15,
      status: 'STANDBY',
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
    <div className="space-y-6">
      
      {/* 1. KAD METRIK TELEMETRI GLOBAL ATAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={14} className="text-[#0ea5e9]" /> Stesen Aktif
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
              100% ONLINE
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">4 / 4 Stesen</p>
          <p className="text-xs text-slate-400 mt-1">16 sensor periferal beroperasi normal</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Battery size={14} className="text-emerald-400" /> Purata Bateri
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
              LiFePO4 Sihat
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">86.5%</p>
          <p className="text-xs text-slate-400 mt-1">Baki rizab kuasa 36 jam tanpa solar</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sun size={14} className="text-amber-400" /> Penjanaan Solar
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/50">
              MPPT Aktif
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">17.8 V</p>
          <p className="text-xs text-slate-400 mt-1">Purata arus pengecasan 1.78 A</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Wifi size={14} className="text-indigo-400" /> Kualiti Rangkaian
            </span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
              Kependaman 85ms
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">-68 dBm</p>
          <p className="text-xs text-slate-400 mt-1">4G LTE Cat-M1 + LoRa Link stabil</p>
        </div>
      </div>

      {/* 2. BAR PENAPIS & BUTANG TINDAKAN */}
      <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Penapis Stesen */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Stesen:</span>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            >
              <option value="ALL">Semua Stesen (FL01 - FL04)</option>
              <option value="FL01">FL01 - Sg. Bunus</option>
              <option value="FL02">FL02 - Sg. Gombak</option>
              <option value="FL03">FL03 - Sg. Klang</option>
              <option value="FL04">FL04 - Sg. Ampang</option>
            </select>
          </div>

          {/* Penapis Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ONLINE">Online Sahaja</option>
              <option value="WARNING">Perlu Perhatian</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePingAll}
            disabled={isPingingAll}
            className="flex items-center gap-2 bg-[#161616] hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw size={13} className={isPingingAll ? 'animate-spin text-[#0ea5e9]' : ''} />
            {isPingingAll ? 'Memeriksa Telemetri...' : 'Ping Semua Sensor'}
          </button>
        </div>
      </div>

      {/* 3. SENARAI KAD PERKAKASAN STESEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSensors.map((node) => {
          const isSinglePing = pingedStationId === node.id;
          return (
            <div
              key={node.id}
              className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-6 shadow-md hover:border-slate-700 transition-all space-y-5"
            >
              {/* Header Stesen */}
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-white text-lg font-bold">{node.name}</h3>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                        node.status === 'ONLINE'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{node.river}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Node ID: <span className="text-slate-300">{node.hardwareId}</span> | FW: {node.firmware}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Ping Terakhir:</span>
                  <span className="text-xs font-mono font-bold text-slate-300">{node.lastPing}</span>
                  <button
                    onClick={() => handlePingSingle(node.id)}
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-bold bg-[#161616] hover:bg-slate-800 border border-slate-800 text-sky-400 px-2.5 py-1 rounded-lg transition-all ml-auto"
                  >
                    <RefreshCw size={11} className={isSinglePing ? 'animate-spin' : ''} />
                    {isSinglePing ? 'Ping...' : 'Ping Node'}
                  </button>
                </div>
              </div>

              {/* Sub-Sensor Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Sensor Paras Air */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Droplets size={14} className="text-[#0ea5e9]" /> Sensor Paras Air
                    </span>
                    <span className="text-[9px] font-bold bg-sky-950/80 text-sky-400 px-1.5 py-0.5 rounded border border-sky-800/50">
                      {node.waterLevelSensor.status}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{node.waterLevelSensor.reading.toFixed(2)}m</span>
                    <span className="text-[11px] font-mono text-slate-400">Ketepatan: {node.waterLevelSensor.accuracy}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Model: {node.waterLevelSensor.model} | Suhu: {node.waterLevelSensor.temperature}°C
                  </p>
                </div>

                {/* 2. Tolok Hujan (Rain Gauge) */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Activity size={14} className="text-indigo-400" /> Tolok Hujan (Rain Gauge)
                    </span>
                    <span className="text-[9px] font-bold bg-indigo-950/80 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-800/50">
                      {node.rainGauge.status}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-white">{node.rainGauge.intensity.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm/j</span></span>
                    <span className="text-[11px] font-mono text-slate-400">Hari: {node.rainGauge.dailyTotal.toFixed(1)} mm</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Model: {node.rainGauge.model}
                  </p>
                </div>

                {/* 3. Sistem Kuasa (Solar & Bateri) */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" /> Sistem Kuasa Solar
                    </span>
                    <span className="text-[9px] font-bold bg-amber-950/80 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/50">
                      {node.powerSystem.mpptState}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-lg font-bold text-white">
                      {node.powerSystem.solarVoltage.toFixed(1)}V <span className="text-xs font-normal text-slate-400">({node.powerSystem.solarCurrent.toFixed(1)}A)</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Bateri: {node.powerSystem.batteryPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full" style={{ width: `${node.powerSystem.batteryPercent}%` }} />
                  </div>
                </div>

                {/* 4. Rangkaian & Kamera */}
                <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Wifi size={14} className="text-emerald-400" /> Modem & Kamera
                    </span>
                    <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      IP: {node.telemetry.ipAddress}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-sm font-bold text-slate-200">Kamera: {node.camera.status}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{node.telemetry.rssi} dBm</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {node.telemetry.type} | Hilang Paket: {node.telemetry.packetLoss}%
                  </p>
                </div>

              </div>

              {/* Tindakan Bawah Kad */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <button
                  onClick={() => setCalibrationModalStation(node.id)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-[#161616] hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl font-semibold transition-all"
                >
                  <Sliders size={13} /> Kalibrasi Sifar Paras Air
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  Sampel data diselaraskan setiap 10s
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL KALIBRASI SIMULASI */}
      {calibrationModalStation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white text-base font-bold flex items-center gap-2">
                <Sliders size={16} className="text-sky-400" />
                Kalibrasi Sensor Stesen {calibrationModalStation}
              </h4>
              <button
                onClick={() => setCalibrationModalStation(null)}
                className="text-slate-400 hover:text-white text-sm"
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
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setCalibrationModalStation(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#161616] border border-slate-800"
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
