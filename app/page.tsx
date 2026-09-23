'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Radio, 
  FileText, 
  Map as MapIcon, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  Sun, 
  Battery, 
  TrendingUp, 
  ChevronDown, 
  Video, 
  VideoOff, 
  Send, 
  ShieldCheck, 
  Menu, 
  X, 
  AlertTriangle,
  Bot,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { sendTelegramFloodAlert } from '@/lib/telegramAlert';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  calculateWaterLevelPrediction, 
  HistoricalDataPoint, 
  RegressionModelType 
} from '@/lib/predictiveRegression';
import PredictiveAICard from './components/PredictiveAICard';
import SensorsView from './components/SensorsView';
import ReportsView from './components/ReportsView';
import MapView from './components/MapView';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const STATIONS = [
  { id: 'FL02', name: 'Station FL02 (Sg. Gombak) - [ONLINE]', isOnline: true },
  { id: 'FL01', name: 'Station FL01 (Sg. Bunus) - [OFFLINE]', isOnline: false },
  { id: 'FL03', name: 'Station FL03 (Sg. Klang) - [OFFLINE]', isOnline: false },
  { id: 'FL04', name: 'Station FL04 (Sg. Ampang) - [OFFLINE]', isOnline: false },
];

interface HistoryItem {
  timestamp: number;
  label: string;
  waterLevel: number;
}

type TabType = 'dashboard' | 'sensors' | 'reports' | 'map';

export default function ProfessionalDashboard() {
  // Tab Navigasi Aktif & Menu Mudah Alih (Mobile Drawer)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [selectedStation, setSelectedStation] = useState('FL02'); // Lalai ke FL02 (Satu-satunya stesen ONLINE) 
  const [isLiveVideo, setIsLiveVideo] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [testAlertLoading, setTestAlertLoading] = useState(false);

  // Tetapan Enjin Predictive AI
  const [selectedModel, setSelectedModel] = useState<RegressionModelType>('linear');
  const [dangerThreshold, setDangerThreshold] = useState<number>(4.40);
  const [showForecastOnChart, setShowForecastOnChart] = useState<boolean>(true);
  const [forecastHorizon, setForecastHorizon] = useState<number>(30); // 30 minit

  // Tetapan Amaran Awal Telegram (AI Sentinel)
  const [isSentinelActive, setIsSentinelActive] = useState<boolean>(true);
  const [sentinelThresholdMinutes, setSentinelThresholdMinutes] = useState<number>(60);
  const [lastAlertSentTime, setLastAlertSentTime] = useState<string | null>(null);
  const [isSendingAiAlert, setIsSendingAiAlert] = useState<boolean>(false);
  const [alertToast, setAlertToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const lastAlertTimestampRef = useRef<number>(0);

  const [currentData, setCurrentData] = useState({
    water_level: 0.0,
    battery: 0,
    solar_v: 0.0,
    max_24h: 0.0,
    current_depth: 0.0,
    latitude: 3.1604,
    longitude: 101.6963
  });

  const [historyPoints, setHistoryPoints] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setCurrentData({ water_level: 0, battery: 0, solar_v: 0, max_24h: 0, current_depth: 0, latitude: 3.1604, longitude: 101.6963 });
    setHistoryPoints([]);
    setIsLiveVideo(false); 

    // Muat turun 30 rekod data sejarah lampau stesen bagi mengira keluk regresi
    const fetchHistoricalData = async () => {
      const { data, error } = await supabase
        .from('flood_data')
        .select('*')
        .eq('station_id', selectedStation)
        .order('created_at', { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        // Susun semula dari paling awal ke paling terkini (kronologi)
        const chronological = [...data].reverse();
        const latest = chronological[chronological.length - 1];

        setCurrentData({
          water_level: latest.water_level || 0,
          battery: latest.battery_level || 0,
          solar_v: latest.solar_voltage || 0,
          max_24h: Math.max(...chronological.map(d => d.water_level || 0)),
          current_depth: latest.water_level || 0,
          latitude: latest.latitude || 3.1604,
          longitude: latest.longitude || 101.6963
        });

        const items: HistoryItem[] = chronological.map(item => {
          const d = item.created_at ? new Date(item.created_at) : new Date();
          return {
            timestamp: d.getTime(),
            label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            waterLevel: item.water_level || 0,
          };
        });

        setHistoryPoints(items);
      } else {
        setHistoryPoints([]);
      }
    };

    fetchHistoricalData();

    // Dengar kemas kini masa nyata dari ESP32 melalui Supabase Realtime
    const channel = supabase
      .channel(`esp32-flood-stream-${selectedStation}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'flood_data',
          filter: `station_id=eq.${selectedStation}`
        }, 
        (payload) => {
          const incoming = payload.new;
          const d = incoming.created_at ? new Date(incoming.created_at) : new Date();
          const timestamp = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          setCurrentData(prev => ({
            water_level: incoming.water_level,
            battery: incoming.battery_level || prev.battery,
            solar_v: incoming.solar_voltage || prev.solar_v,
            max_24h: incoming.water_level > prev.max_24h ? incoming.water_level : prev.max_24h,
            current_depth: incoming.water_level,
            latitude: incoming.latitude || prev.latitude,
            longitude: incoming.longitude || prev.longitude
          }));

          setHistoryPoints(prev => {
            const newItem: HistoryItem = {
              timestamp: d.getTime(),
              label: timestamp,
              waterLevel: incoming.water_level || 0,
            };
            const nextList = [...prev, newItem];
            // Kekalkan 35 titik rekod lampau terkini untuk kestabilan graf & regresi
            if (nextList.length > 35) {
              nextList.shift();
            }
            return nextList;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStation]);

  // Pengiraan Predictive AI berasaskan rekod lampau Supabase
  const prediction = useMemo(() => {
    const dataPoints: HistoricalDataPoint[] = historyPoints.map(p => ({
      timestamp: p.timestamp,
      waterLevel: p.waterLevel,
    }));

    return calculateWaterLevelPrediction(
      dataPoints,
      dangerThreshold,
      selectedModel,
      forecastHorizon
    );
  }, [historyPoints, dangerThreshold, selectedModel, forecastHorizon]);

  const handleToggleVideo = async () => {
    setVideoLoading(true);
    const nextVideoState = !isLiveVideo;
    const targetStatus = nextVideoState ? "START" : "STOP";
    
    // 1. Paksa UI bertukar serta-merta supaya kotak video/CCTV terbuka di dashboard
    setIsLiveVideo(nextVideoState);

    // 2. Hantar arahan ke Supabase di latar belakang (tanpa menyekat UI)
    try {
      const { error } = await supabase
        .from('camera_commands')
        .upsert({ station_id: selectedStation, status: targetStatus }, { onConflict: 'station_id' });
        
      if (error) {
        console.error("Ralat arahan kamera Supabase:", error.message);
      }
    } catch (err) {
      console.error("Gagal menyambung ke pelayan perintah:", err);
    }

    // 3. Logik Auto-Timeout 2 minit kekal seperti asal
    if (targetStatus === "START") {
      setTimeout(async () => {
        setIsLiveVideo(false);
        await supabase
          .from('camera_commands')
          .upsert({ station_id: selectedStation, status: "STOP" }, { onConflict: 'station_id' });
      }, 120000);
    }
    
    setVideoLoading(false);
  };

  const handleSendAiTelegramAlert = async (isAutomatic = false) => {
    if (isSendingAiAlert) return;
    setIsSendingAiAlert(true);
    setTestAlertLoading(true);

    const stObj = STATIONS.find(s => s.id === selectedStation);
    const stName = stObj ? stObj.name.replace(' - [ONLINE]', '').replace(' - [OFFLINE]', '') : selectedStation;

    try {
      const result = await sendTelegramFloodAlert({
        stationId: selectedStation,
        stationName: stName,
        waterLevel: currentData.water_level,
        dangerThreshold: dangerThreshold,
        battery: currentData.battery,
        solarVoltage: currentData.solar_v,
        prediction: prediction,
        isAutomatic,
      });

      if (result.success) {
        const timeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
        setLastAlertSentTime(timeStr);
        lastAlertTimestampRef.current = Date.now();
        setAlertToast({
          message: isAutomatic 
            ? `🤖 Amaran Awal AI Automatik dihantar ke Telegram (Banjir diramal dalam ~${prediction.minutesToDanger || 0} minit)`
            : `✅ Amaran Awal AI (${selectedStation}) berjaya dihantar ke grup Telegram!`,
          type: 'success'
        });
        setTimeout(() => setAlertToast(null), 6000);
      } else {
        setAlertToast({
          message: result.message,
          type: 'error'
        });
        setTimeout(() => setAlertToast(null), 6000);
      }
    } catch (err: any) {
      console.error("Ralat menghantar amaran Telegram:", err);
      setAlertToast({
        message: "Ralat rangkaian semasa menghubungi bot Telegram.",
        type: 'error'
      });
      setTimeout(() => setAlertToast(null), 6000);
    } finally {
      setIsSendingAiAlert(false);
      setTestAlertLoading(false);
    }
  };

  // Pemantau Automatik AI Sentinel: Semak setiap kali data/ramalan dikira
  useEffect(() => {
    if (!isSentinelActive) return;

    // Syarat amaran awal banjir AI:
    // - Air diramal mencecah bahaya dalam masa <= sentinelThresholdMinutes (cth 60 minit) dan tren menaik
    // - ATAU paras air semasa telah melepasi paras bahaya
    const isFloodLikely = 
      (prediction.minutesToDanger !== null && 
       prediction.minutesToDanger <= sentinelThresholdMinutes && 
       prediction.trend === 'RISING') ||
      prediction.isCurrentlyCritical;

    if (isFloodLikely) {
      const now = Date.now();
      const cooldownMs = 15 * 60 * 1000; // Cooldown 15 minit bagi mengelakkan spam ke Telegram

      if (now - lastAlertTimestampRef.current > cooldownMs) {
        handleSendAiTelegramAlert(true);
      }
    }
  }, [prediction, isSentinelActive, sentinelThresholdMinutes]);

  // Konfigurasi Data Graf Berbilang Lapisan: Data Sebenar + Unjuran Ramalan AI + Ambang Bahaya
  const mainChartData = useMemo(() => {
    if (historyPoints.length === 0) {
      return {
        labels: ['Memuatkan...'],
        datasets: [
          {
            label: 'Water Depth (m)',
            data: [0],
            borderColor: '#0ea5e9',
          }
        ]
      };
    }

    const histLabels = historyPoints.map(p => p.label);
    const histValues = historyPoints.map(p => p.waterLevel);

    const forecastPoints = (showForecastOnChart && prediction.forecastPoints.length > 0)
      ? prediction.forecastPoints
      : [];

    const forecastLabels = forecastPoints.map(p => p.label);
    const forecastValues = forecastPoints.map(p => p.predictedLevel);

    const allLabels = [...histLabels, ...forecastLabels];

    // Garis Sebenar: nilai untuk sejarah, null untuk masa depan
    const actualData = [...histValues, ...Array(forecastLabels.length).fill(null)];

    // Garis Ramalan: null untuk semua rekod lampau KECUALI rekod terkini (supaya garis bersambung lancar)
    const lastHistVal = histValues[histValues.length - 1];
    const predData = forecastPoints.length > 0
      ? [...Array(Math.max(0, histValues.length - 1)).fill(null), lastHistVal, ...forecastValues]
      : [];

    // Garis rujukan ambang bahaya
    const dangerData = Array(allLabels.length).fill(dangerThreshold);

    const datasets: any[] = [
      {
        label: 'Paras Sebenar (m)',
        data: actualData,
        borderColor: '#0ea5e9',
        backgroundColor: (context: any) => {
          const ctx = context.chart?.ctx;
          if (!ctx) return 'rgba(14, 165, 233, 0.1)';
          const gradient = ctx.createLinearGradient(0, 0, 0, 320);
          gradient.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
          gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        pointRadius: 3.5,
        pointHoverRadius: 6,
        pointBackgroundColor: '#0ea5e9',
        borderWidth: 2.5,
      }
    ];

    if (showForecastOnChart && forecastPoints.length > 0) {
      const isCrit = prediction.riskStatus === 'CRITICAL';
      const isWarn = prediction.riskStatus === 'WARNING';
      const forecastColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#818cf8';

      datasets.push({
        label: `Unjuran AI (${selectedModel === 'polynomial' ? 'Kuadratik' : 'Linear'})`,
        data: predData,
        borderColor: forecastColor,
        borderDash: [6, 4],
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: forecastColor,
        tension: selectedModel === 'polynomial' ? 0.35 : 0,
        fill: false,
        borderWidth: 2.5,
      });
    }

    // Tambah garis aras bahaya horizontal
    datasets.push({
      label: `Paras Bahaya (${dangerThreshold.toFixed(2)}m)`,
      data: dangerData,
      borderColor: 'rgba(239, 68, 68, 0.85)',
      borderDash: [4, 4],
      pointRadius: 0,
      borderWidth: 1.8,
      fill: false,
    });

    return {
      labels: allLabels,
      datasets,
    };
  }, [historyPoints, showForecastOnChart, prediction, selectedModel, dangerThreshold]);

  // Konfigurasi Carta Interaktif
  const chartOptions = useMemo(() => {
    const allKnownLevels = [
      currentData.water_level,
      dangerThreshold,
      ...historyPoints.map(p => p.waterLevel),
      ...prediction.forecastPoints.map(p => p.predictedLevel)
    ];
    const maxVal = Math.max(5.0, dangerThreshold + 0.6, ...allKnownLevels);

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            color: '#94a3b8',
            font: { size: 10, weight: 'bold' as const },
            boxWidth: 10,
            usePointStyle: true,
            padding: 10,
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            label: (context: any) => {
              if (context.raw === null || context.raw === undefined) return '';
              return `${context.dataset.label}: ${Number(context.raw).toFixed(2)} m`;
            }
          }
        }
      },
      scales: {
        y: {
          suggestedMin: 0,
          suggestedMax: Math.ceil(maxVal * 10) / 10,
          grid: {
            color: '#1e293b',
          },
          ticks: {
            color: '#ffffff',
            font: { size: 10, weight: 'bold' as const },
            callback: (value: any) => `${value}m`,
          }
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#ffffff',
            font: { size: 9, weight: 'bold' as const },
            maxRotation: 45,
            minRotation: 0,
          }
        }
      }
    };
  }, [dangerThreshold, currentData.water_level, historyPoints, prediction]);

  return (
    <div className="flex h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden relative">
      
      {/* 1. SIDEBAR DESKTOP (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-64 bg-[#0f0f0f] border-r border-slate-800 flex-col shadow-lg select-none flex-shrink-0">
        <div className="p-4 flex items-center justify-center border-b border-slate-800 bg-black">
          <div className="relative w-44 h-20">
            <Image src="/thb-logo.jpeg" alt="THB Logo" fill priority className="object-contain" />
          </div>
        </div>
        
        <nav className="flex-grow px-4 space-y-1 pt-6">
          <NavItem 
            icon={<LayoutDashboard size={20}/>} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Radio size={20}/>} 
            label="Sensors" 
            active={activeTab === 'sensors'} 
            onClick={() => setActiveTab('sensors')} 
            badge="16 Active"
          />
          <NavItem 
            icon={<FileText size={20}/>} 
            label="Reports" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          <NavItem 
            icon={<MapIcon size={20}/>} 
            label="Map View" 
            active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')} 
            badge="GIS Live"
          />
          <NavItem 
            icon={<Settings size={20}/>} 
            label="Settings" 
            active={false} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <NavItem icon={<Settings size={20}/>} label="Settings" />
          <NavItem icon={<LogOut size={20}/>} label="Log Out" />
        </div>
      </aside>

      {/* 2. DRAWER MENU MUDAH ALIH (Mobile Slide-out Menu) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0f0f0f] border-r border-slate-800 flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="relative w-36 h-12">
                <Image src="/thb-logo.jpeg" alt="THB Logo" fill priority className="object-contain" />
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="Tutup Menu"
              >
                <X size={18} />
              </button>
            </div>
            
            <nav className="space-y-1.5 flex-grow">
              <NavItem 
                icon={<LayoutDashboard size={20}/>} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              />
              <NavItem 
                icon={<Radio size={20}/>} 
                label="Sensors" 
                active={activeTab === 'sensors'} 
                onClick={() => { setActiveTab('sensors'); setIsMobileMenuOpen(false); }} 
                badge="16 Active"
              />
              <NavItem 
                icon={<FileText size={20}/>} 
                label="Reports" 
                active={activeTab === 'reports'} 
                onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }} 
              />
              <NavItem 
                icon={<MapIcon size={20}/>} 
                label="Map View" 
                active={activeTab === 'map'} 
                onClick={() => { setActiveTab('map'); setIsMobileMenuOpen(false); }} 
                badge="GIS Live"
              />
              <NavItem 
                icon={<Settings size={20}/>} 
                label="Settings" 
                active={false} 
              />
            </nav>

            <div className="border-t border-slate-800 pt-3">
              <NavItem icon={<LogOut size={20}/>} label="Log Out" />
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-grow flex flex-col overflow-hidden min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 md:px-8 bg-[#0f0f0f] z-10 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hamburger Button untuk Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              title="Buka Menu"
            >
              <Menu size={20} />
            </button>

            {/* Logo ringkas di Header Mobile */}
            <div className="lg:hidden relative w-24 h-8 flex-shrink-0">
              <Image src="/thb-logo.jpeg" alt="THB Logo" fill priority className="object-contain" />
            </div>

            {/* Carian di Desktop */}
            <div className="hidden sm:block relative w-48 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input 
                type="text" 
                placeholder="Cari stesen..." 
                className="w-full bg-[#161616] border border-slate-800 rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#cc0000] text-slate-200"
              />
            </div>

            {/* Breadcrumb Navigasi */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 border-l border-slate-800 pl-4">
              <span>PORTAL</span>
              <span>/</span>
              <span className="text-white font-bold uppercase tracking-wider">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative">
              <Bell size={18} className="text-slate-400 cursor-pointer hover:text-white" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#cc0000] rounded-full text-[9px] flex items-center justify-center text-white font-bold">3</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 border-l border-slate-800 pl-3 sm:pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-semibold text-white">Iskandar Z.</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider">Project Manager</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                <img src="https://ui-avatars.com/api/?name=Iskandar+Z&background=cc0000&color=fff" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        {/* Kontainer Utama Scrollable (pb-24 untuk memberi ruang bottom nav pada mobile) */}
        <div className="flex-grow p-3 sm:p-5 md:p-6 pb-24 lg:pb-6 overflow-y-auto space-y-4 sm:space-y-6 bg-[#050505]">
          
          {/* TAB 1: SENSORS VIEW */}
          {activeTab === 'sensors' && (
            <SensorsView />
          )}

          {/* TAB 2: REPORTS VIEW */}
          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {/* TAB 3: MAP VIEW */}
          {activeTab === 'map' && (
            <MapView 
              onSelectStation={(stationId) => {
                setSelectedStation(stationId);
                setActiveTab('dashboard');
              }}
            />
          )}

          {/* TAB 4: DASHBOARD UTAMA + PREDICTIVE AI */}
          {activeTab === 'dashboard' && (
            <>
              {/* PANEL UTAMA ATAS: PEMILIHAN STESEN DAN BUTANG PERINTAH */}
              <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-sm">
                <div className="relative inline-block w-full sm:w-auto">
                  <select 
                    value={selectedStation} 
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-[#161616] text-white text-xs sm:text-sm font-semibold pl-3 sm:pl-4 pr-9 sm:pr-10 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000] cursor-pointer"
                  >
                    {STATIONS.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                  {/* Butang Buka Live Stream */}
                  <button
                    onClick={handleToggleVideo}
                    disabled={videoLoading}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-sm border ${
                      isLiveVideo 
                        ? 'bg-[#cc0000] border-red-700 text-white animate-pulse' 
                        : 'bg-[#161616] border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {isLiveVideo ? <VideoOff size={13}/> : <Video size={13}/>}
                    {videoLoading ? "Menyambung..." : isLiveVideo ? "Tutup Stream" : "Live Stream"}
                  </button>

                  {/* Butang Amaran Awal Telegram AI */}
                  <button
                    onClick={() => handleSendAiTelegramAlert(false)}
                    disabled={isSendingAiAlert || testAlertLoading}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-sm"
                  >
                    <Send size={13} />
                    {isSendingAiAlert ? "Menghantar..." : "Hantar Alert Telegram AI"}
                  </button>
                </div>
              </div>

              {/* 🚨 BANNER AMARAN AWAL BANJIR AI */}
              {((prediction.minutesToDanger !== null && prediction.minutesToDanger <= sentinelThresholdMinutes) || prediction.isCurrentlyCritical) && (
                <div className="w-full bg-gradient-to-r from-red-950/90 via-amber-950/90 to-red-950/90 border border-red-500/60 p-3.5 sm:p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-600/30 text-red-400 border border-red-500/50 shrink-0">
                      <AlertTriangle size={22} className="animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black uppercase text-red-200 tracking-wider">
                          Amaran Awal AI: Kebarangkalian Banjir Dikesan!
                        </span>
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          {prediction.isCurrentlyCritical ? 'Kecemasan' : 'Risiko Tinggi'}
                        </span>
                      </div>
                      <p className="text-xs text-red-200/90 mt-0.5">
                        {prediction.isCurrentlyCritical ? (
                          <>Paras air di <strong>{selectedStation}</strong> telah melepasi ambang bahaya ({dangerThreshold.toFixed(2)}m)!</>
                        ) : (
                          <>
                            Air diramal mencecah ambang bahaya ({dangerThreshold.toFixed(2)}m) dalam masa lebih kurang{' '}
                            <strong className="text-white underline font-black">
                              ~{prediction.minutesToDanger} MINIT LAGI
                            </strong>{' '}
                            (Kadar Kenaikan: +{prediction.rateOfChangeCmPerMin} cm/min).
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSendAiTelegramAlert(false)}
                      disabled={isSendingAiAlert}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      <Send size={13} />
                      {isSendingAiAlert ? "Menghantar..." : "Hantar Alert Telegram Segera"}
                    </button>
                  </div>
                </div>
              )}

              {/* 🌟 RUANG VIDEO STRIM (COL-SPAN-12) */}
              {isLiveVideo && (
                <div className="w-full bg-black rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl transition-all duration-500">
                  <div className="w-full h-[260px] sm:h-[350px] md:h-[450px] relative bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img 
                      src="http://172.20.10.3:81/stream"
                      alt="THB Flood Station Live Stream"
                      className="w-full h-full object-contain bg-black"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1580256081112-e49377338b7f?q=80&w=600&auto=format&fit=crop"; 
                        console.error("Gagal menyambung ke live stream ESP32-CAM.");
                      }}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#cc0000] text-[9px] sm:text-[10px] font-black uppercase text-white px-2.5 py-1 rounded animate-pulse tracking-widest border border-red-700 shadow-md">
                      <span className="w-1.5 h-1.5 bg-white rounded-full block animate-ping"></span>
                      LIVE CCTV ({selectedStation})
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/80 text-[9px] sm:text-[10px] text-emerald-400 px-2.5 py-1 rounded-xl backdrop-blur-sm font-mono border border-emerald-950 shadow-md flex items-center gap-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full block"></span>
                      STATUS: ONLINE | 2 MIN
                    </div>
                  </div>
                </div>
              )}

              {/* GRID UTAMA BAWAH (GRAF & METRIK INFORMASI) */}
              <div className="grid grid-cols-12 gap-4 sm:gap-6">
                
                {/* Kad Graf Aras Air (Col-span-8) */}
                <div className="col-span-12 lg:col-span-8 bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-md">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div>
                      <h3 className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        Real-time Water Level & Predictive Projection
                      </h3>
                      <div className="flex items-baseline gap-3 mt-1.5 sm:mt-2">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tighter">
                          {currentData.water_level.toFixed(2)}m
                        </span>
                        {selectedStation === 'FL02' ? (
                          <div className="flex items-center text-emerald-400 text-[10px] sm:text-xs font-bold uppercase gap-1 bg-emerald-950/40 px-2 py-0.5 sm:py-1 rounded-md border border-emerald-900/50">
                            <TrendingUp size={13} /> Telemetri Online
                          </div>
                        ) : (
                          <div className="flex items-center text-red-400 text-[10px] sm:text-xs font-bold uppercase gap-1 bg-red-950/40 px-2 py-0.5 sm:py-1 rounded-md border border-red-900/50">
                            <AlertTriangle size={13} /> Node Offline
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Ringkas Ramalan AI pada Graf */}
                    <div className="bg-[#141414] border border-slate-800/80 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-left sm:text-right w-full sm:w-auto">
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block">Status Ramalan AI</span>
                      {prediction.isCurrentlyCritical ? (
                        <span className="text-xs font-extrabold text-red-400 flex items-center gap-1 sm:justify-end">
                          🚨 Paras Bahaya!
                        </span>
                      ) : prediction.minutesToDanger !== null ? (
                        <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1 sm:justify-end">
                          ⚠️ ~{prediction.minutesToDanger}m ke {dangerThreshold.toFixed(2)}m
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 sm:justify-end">
                          <ShieldCheck size={12} /> Paras Terkawal
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-[250px] sm:h-[300px] md:h-[320px] w-full">
                    <Line data={mainChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Kad Lajur Informasi Sebelah Kanan (Col-span-4) */}
                <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <GaugeCard 
                      label="Current Depth" 
                      value={`${currentData.current_depth.toFixed(2)}m`} 
                      subLabel={currentData.current_depth >= dangerThreshold ? "Critical" : "Normal"} 
                      color={currentData.current_depth >= dangerThreshold ? "text-red-500" : "text-emerald-400"} 
                    />
                    <GaugeCard 
                      label="Max 24h Depth" 
                      value={`${currentData.max_24h.toFixed(2)}m`} 
                      subLabel="Tracked" 
                      color="text-[#cc0000]" 
                    />
                  </div>
                  
                  {/* Kad Status Kuasa Solar & Bateri */}
                  <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 sm:space-y-6 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1.5">
                        <Sun size={13} className="text-amber-500" /> Kesihatan Solar
                      </div>
                      <p className="text-sm font-semibold text-white">Voltan Solar: <span className="text-[#0ea5e9]">{currentData.solar_v.toFixed(1)}V</span></p>
                      <p className="text-[10px] text-emerald-400 mt-1 uppercase font-extrabold italic">
                        Status: {selectedStation === 'FL02' ? (currentData.solar_v > 12.0 ? "Pengecasan Normal" : "Tiada Input / Malam") : "Luar Talian (Tiada Data)"}
                      </p>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2 sm:mb-3">
                        <Battery size={13} className="text-[#0ea5e9]" /> Kesihatan Bateri
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1.5 font-medium">
                        <span className="text-slate-300">Bateri: <span className="text-white font-bold">{currentData.battery}%</span></span>
                      </div>
                      <div className="w-full bg-[#161616] h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-[#0ea5e9] h-full transition-all duration-500" style={{ width: `${currentData.battery}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-2.5 text-[10px] font-bold">
                        <span className="text-slate-500 uppercase">Node ID: {selectedStation}</span>
                        <span className={selectedStation === 'FL02' ? "text-emerald-400 uppercase italic font-bold" : "text-red-400 uppercase italic font-bold"}>
                          {selectedStation === 'FL02' ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🌟 KAD UTAMA PREDICTIVE AI ENGINE (COL-SPAN-12) */}
                <div className="col-span-12">
                  <PredictiveAICard
                    prediction={prediction}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    dangerThreshold={dangerThreshold}
                    onThresholdChange={setDangerThreshold}
                    showForecastOnChart={showForecastOnChart}
                    onToggleForecastOnChart={() => setShowForecastOnChart(!showForecastOnChart)}
                    forecastHorizon={forecastHorizon}
                    onForecastHorizonChange={setForecastHorizon}
                    historicalCount={historyPoints.length}
                    onTriggerTelegramAlert={() => handleSendAiTelegramAlert(false)}
                    isSendingAlert={isSendingAiAlert}
                    isSentinelActive={isSentinelActive}
                    onToggleSentinel={() => setIsSentinelActive(!isSentinelActive)}
                    sentinelThresholdMinutes={sentinelThresholdMinutes}
                    onSentinelThresholdChange={setSentinelThresholdMinutes}
                    lastAlertSentTime={lastAlertSentTime}
                  />
                </div>

                {/* Kad Kedudukan GIS Peta (Col-span-8) */}
                <div className="col-span-12 lg:col-span-8 bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sensor Locations</h3>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="text-[11px] font-bold text-[#0ea5e9] hover:underline flex items-center gap-1"
                    >
                      Buka Peta Penuh <MapIcon size={12} />
                    </button>
                  </div>
                  <div 
                    onClick={() => setActiveTab('map')}
                    className="h-[180px] sm:h-[200px] bg-black border border-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center cursor-pointer group"
                  >
                     <p className="text-slate-600 text-xs font-medium group-hover:text-slate-400 transition-colors text-center px-4">
                       Sentuh untuk membuka Pusat Kawalan GIS Penuh (4 Stesen)
                     </p>
                     <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#cc0000] rounded-full animate-ping"></div>
                     <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#cc0000] rounded-full border-2 border-slate-900"></div>
                     <div className="absolute top-3 right-3 text-[10px] font-bold text-slate-400 bg-[#161616] px-2.5 py-1 rounded-xl border border-slate-800 shadow-sm">
                       {currentData.latitude.toFixed(4)}, {currentData.longitude.toFixed(4)}
                     </div>
                  </div>
                </div>

                {/* Kad Log Amaran Bahaya Telegram & AI (Col-span-4) */}
                <div className="col-span-12 lg:col-span-4 bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-sm">
                   <div className="flex justify-between items-center mb-4 sm:mb-6">
                     <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Warning Alerts Feed</h3>
                     <Settings size={14} className="text-slate-500 cursor-pointer hover:text-slate-300" />
                   </div>
                   <div className="space-y-2.5 sm:space-y-3">
                     {/* Amaran AI Automatik jika risiko kritikal atau amaran dikesan */}
                     {prediction.riskStatus === 'CRITICAL' && (
                       <AlertItem 
                         time="AI ETA" 
                         type="PREDICTIVE ALERT" 
                         stationId={selectedStation} 
                         text={prediction.isCurrentlyCritical 
                           ? `Paras bahaya (${dangerThreshold.toFixed(2)}m) sedang berlaku di ${selectedStation}!` 
                           : `Air diramal mencecah paras bahaya (${dangerThreshold.toFixed(2)}m) dalam masa ~${prediction.minutesToDanger} minit!`}
                         color="text-red-400 bg-red-950/40 border-red-900/80 animate-pulse" 
                       />
                     )}
                     {prediction.riskStatus === 'WARNING' && prediction.minutesToDanger !== null && (
                       <AlertItem 
                         time="AI FORECAST" 
                         type="EARLY WARNING" 
                         stationId={selectedStation} 
                         text={`Tren kenaikan ${prediction.rateOfChangeCmPerMin > 0 ? '+' : ''}${prediction.rateOfChangeCmPerMin} cm/min dikesan. Dijangka melepasi paras bahaya dalam ~${prediction.minutesToDanger} minit.`} 
                         color="text-amber-400 bg-amber-950/40 border-amber-900/80" 
                       />
                     )}
                     {currentData.water_level >= dangerThreshold && (
                       <AlertItem 
                         time="NOW" 
                         type="CRITICAL" 
                         stationId={selectedStation} 
                         text={`Exceeded ${dangerThreshold.toFixed(2)}m danger threshold at ${selectedStation}!`} 
                         color="text-red-400 bg-red-950/30 border-red-900/60" 
                       />
                     )}
                     <AlertItem time="14:15" type="WARNING" stationId="FL03" text="Station FL03 - Rapid rise detected" color="text-amber-400 bg-amber-950/20 border-amber-900/50" />
                     <AlertItem time="11:30" type="INFO" stationId="FL04" text="Solar Voltage Low: Station FL04" color="text-slate-400 bg-slate-900/40 border-slate-800" />
                   </div>
                </div>

              </div>
            </>
          )}

        </div>
      </main>

      {/* 4. BAR NAVIGASI BAWAH MUDAH ALIH (Mobile Bottom Navigation Bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around py-2 px-1 shadow-2xl safe-area-pb">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-[#cc0000] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px]">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('sensors')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'sensors' ? 'text-[#cc0000] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio size={18} />
          <span className="text-[10px]">Sensors</span>
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'reports' ? 'text-[#cc0000] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={18} />
          <span className="text-[10px]">Reports</span>
        </button>
        <button 
          onClick={() => setActiveTab('map')} 
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'map' ? 'text-[#cc0000] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapIcon size={18} />
          <span className="text-[10px]">Map</span>
        </button>
      </nav>

      {/* Notifikasi Toast Amaran Telegram */}
      {alertToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
            alertToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : alertToast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
              : 'bg-red-950/90 border-red-500/60 text-red-200'
          }`}>
            <div className="shrink-0 mt-0.5">
              {alertToast.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={18} className="text-red-400" />
              )}
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {alertToast.message}
            </div>
            <button
              onClick={() => setAlertToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub-komponen pembantu
function NavItem({ icon, label, active = false, badge, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl cursor-pointer transition-all ${
      active 
        ? 'bg-red-950/40 text-[#cc0000] font-bold border border-red-900/50 shadow-md' 
        : 'text-slate-400 hover:bg-[#161616] hover:text-white'
    }`}>
      <div className="flex items-center gap-3 sm:gap-4">
        {icon}
        <span className="text-xs sm:text-sm font-semibold">{label}</span>
      </div>
      {badge && (
        <span className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
          active 
            ? 'bg-red-900/50 text-red-200 border-red-700/60' 
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function GaugeCard({ label, value, subLabel, color }: any) {
  return (
    <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-3 sm:p-4 text-center shadow-sm">
      <div className="w-14 h-14 sm:w-18 sm:h-18 mx-auto relative mb-2 sm:mb-3">
         <svg className="w-full h-full" viewBox="0 0 36 36">
            <path className="stroke-slate-800" strokeWidth="3" fill="none" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`stroke-current ${color}`} strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] text-slate-500 uppercase font-black">{subLabel}</div>
      </div>
      <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-0.5 sm:mb-1">{label}</p>
      <p className="text-base sm:text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}

function AlertItem({ time, type, stationId, text, color }: any) {
  return (
    <div className={`flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl border transition-all ${color}`}>
      <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono font-bold mt-0.5 whitespace-nowrap">{time}</span>
      <div>
        <p className="text-[9px] sm:text-[10px] font-black uppercase mb-0.5">
          <span>{type}:</span> <span className="opacity-70">Station {stationId}</span>
        </p>
        <p className="text-[11px] sm:text-xs text-slate-300 leading-tight font-medium">{text}</p>
      </div>
    </div>
  );
}