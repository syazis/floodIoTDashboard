'use client';

import { useEffect, useState } from 'react';
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
  AlertTriangle,
  ChevronDown,
  Video,
  VideoOff,
  Send
} from 'lucide-react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const STATIONS = [
  { id: 'FL01', name: 'Station FL01 (Sg. Bunus)' },
  { id: 'FL02', name: 'Station FL02 (Sg. Gombak)' },
  { id: 'FL03', name: 'Station FL03 (Sg. Klang)' },
  { id: 'FL04', name: 'Station FL04 (Sg. Ampang)' },
];

export default function ProfessionalDashboard() {
  const [selectedStation, setSelectedStation] = useState('FL01'); 
  const [isLiveVideo, setIsLiveVideo] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [testAlertLoading, setTestAlertLoading] = useState(false);

  const [currentData, setCurrentData] = useState({
    water_level: 0.0,
    battery: 0,
    solar_v: 0.0,
    max_24h: 0.0,
    current_depth: 0.0,
    latitude: 3.1604,
    longitude: 101.6963
  });

  const [chartHistory, setChartHistory] = useState<{ labels: string[]; values: number[] }>({
    labels: ['Waiting...'],
    values: [0]
  });

  useEffect(() => {
    setCurrentData({ water_level: 0, battery: 0, solar_v: 0, max_24h: 0, current_depth: 0, latitude: 3.1604, longitude: 101.6963 });
    setChartHistory({ labels: ['Loading...'], values: [0] });
    setIsLiveVideo(false); 

    const fetchLatestData = async () => {
      const { data, error } = await supabase
        .from('flood_data')
        .select('*')
        .eq('station_id', selectedStation)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const latest = data[0];
        setCurrentData({
          water_level: latest.water_level || 0,
          battery: latest.battery_level || 0,
          solar_v: latest.solar_voltage || 0,
          max_24h: latest.water_level || 0, 
          current_depth: latest.water_level || 0,
          latitude: latest.latitude || 3.1604,
          longitude: latest.longitude || 101.6963
        });
        
        const timestamp = new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setChartHistory({
          labels: [timestamp],
          values: [latest.water_level || 0]
        });
      } else {
        setChartHistory({ labels: ['No Data'], values: [0] });
      }
    };

    fetchLatestData();

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
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          setCurrentData(prev => ({
            water_level: incoming.water_level,
            battery: incoming.battery_level || prev.battery,
            solar_v: incoming.solar_voltage || prev.solar_v,
            max_24h: incoming.water_level > prev.max_24h ? incoming.water_level : prev.max_24h,
            current_depth: incoming.water_level,
            latitude: incoming.latitude || prev.latitude,
            longitude: incoming.longitude || prev.longitude
          }));

          setChartHistory(prev => {
            const baseLabels = prev.labels.includes('Loading...') || prev.labels.includes('No Data') || prev.labels.includes('Waiting...') ? [] : prev.labels;
            const baseValues = baseLabels.length === 0 ? [] : prev.values;

            const newLabels = [...baseLabels, timestamp];
            const newValues = [...baseValues, incoming.water_level];

            if (newLabels.length > 10) {
              newLabels.shift();
              newValues.shift();
            }

            return { labels: newLabels, values: newValues };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStation]);

  const handleToggleVideo = async () => {
    setVideoLoading(true);
    const targetStatus = !isLiveVideo ? "START" : "STOP";
    
    const { error } = await supabase
      .from('camera_commands')
      .upsert({ station_id: selectedStation, status: targetStatus }, { onConflict: 'station_id' });

    if (!error) {
      setIsLiveVideo(!isLiveVideo);
      
      if (targetStatus === "START") {
        setTimeout(async () => {
          setIsLiveVideo(false);
          await supabase
            .from('camera_commands')
            .upsert({ station_id: selectedStation, status: "STOP" }, { onConflict: 'station_id' });
        }, 120000);
      }
    }
    setVideoLoading(false);
  };

  const handleTriggerTestAlert = async () => {
    setTestAlertLoading(true);
    
    const { error } = await supabase
      .from('flood_data')
      .insert([
        { 
          station_id: selectedStation, 
          water_level: 4.55, 
          battery_level: 95, 
          solar_voltage: 12.8,
          latitude: 3.1604,
          longitude: 101.6963
        }
      ]);

    if (!error) {
      alert(`Test data sent successfully! Check Telegram group/chat for ${selectedStation} alert.`);
    } else {
      alert("Error sending test data: " + error.message);
    }
    setTestAlertLoading(false);
  };

  const mainChartData = {
    labels: chartHistory.labels,
    datasets: [{
      label: 'Water Depth (m)',
      data: chartHistory.values,
      borderColor: '#0ea5e9', 
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.25)'); 
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#0ea5e9'
    }]
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-[#0f0f0f] border-r border-slate-800 flex flex-col shadow-lg">
        <div className="p-4 flex items-center justify-center border-b border-slate-800 bg-black">
          <div className="relative w-44 h-20">
            <Image src="/thb-logo.jpeg" alt="THB Logo" fill priority className="object-contain" />
          </div>
        </div>
        
        <nav className="flex-grow px-4 space-y-1 pt-6">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
          <NavItem icon={<Radio size={20}/>} label="Sensors" />
          <NavItem icon={<FileText size={20}/>} label="Reports" />
          <NavItem icon={<MapIcon size={20}/>} label="Map View" />
          <NavItem icon={<Settings size={20}/>} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <NavItem icon={<Settings size={20}/>} label="Settings" />
          <NavItem icon={<LogOut size={20}/>} label="Log Out" />
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0f0f0f] z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search station or alerts..." 
              className="w-full bg-[#161616] border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#cc0000] text-slate-200"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell size={20} className="text-slate-400 cursor-pointer hover:text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#cc0000] rounded-full text-[10px] flex items-center justify-center text-white font-bold">3</span>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">Iskandar Z.</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Project Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                 <img src="https://ui-avatars.com/api/?name=Iskandar+Z&background=cc0000&color=fff" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        {/* Kontainer Utama Scrollable */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-[#050505]">
          
          {/* PANEL UTAMA ATAS: PEMILIHAN STESEN DAN BUTANG PERINTAH */}
          <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 flex flex-wrap justify-between items-center gap-4 shadow-sm">
            <div className="relative inline-block">
              <select 
                value={selectedStation} 
                onChange={(e) => setSelectedStation(e.target.value)}
                className="appearance-none bg-[#161616] text-white text-sm font-semibold pl-4 pr-10 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000] cursor-pointer"
              >
                {STATIONS.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-3">
              {/* Butang Buka Live Stream */}
              <button
                onClick={handleToggleVideo}
                disabled={videoLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm border ${
                  isLiveVideo 
                    ? 'bg-[#cc0000] border-red-700 text-white animate-pulse' 
                    : 'bg-[#161616] border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isLiveVideo ? <VideoOff size={14}/> : <Video size={14}/>}
                {videoLoading ? "Connecting..." : isLiveVideo ? "Tutup Live Stream" : "Buka Live Stream"}
              </button>

              {/* Butang Ujian Telegram */}
              <button
                onClick={handleTriggerTestAlert}
                disabled={testAlertLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Send size={14} />
                {testAlertLoading ? "Triggering..." : "Test Telegram Alert"}
              </button>
            </div>
          </div>

          {/* RUANG VIDEO STRIM (COL-SPAN-12) - DINAMIK MEMBUKA RUANG KAWASAN CCTV ATAS */}
          {isLiveVideo && (
            <div className="w-full bg-black rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl transition-all duration-500">
              <div className="w-full h-[400px] relative bg-slate-950">
                <video 
                  src="/dummy-flood-stream.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-[#cc0000] text-[10px] font-black uppercase text-white px-3 py-1 rounded animate-pulse tracking-widest border border-red-700 shadow-md">
                  LIVE VIDEO STREAMING FEED ({selectedStation})
                </div>
                <div className="absolute bottom-4 right-4 bg-black/80 text-[10px] text-slate-400 px-3 py-1.5 rounded-xl backdrop-blur-sm font-mono border border-slate-800 shadow-md">
                  AUTO-TIMEOUT KESELAMATAN BATERI: 2 MINIT
                </div>
              </div>
            </div>
          )}

          {/* GRID UTAMA BAWAH (GRAF & METRIK INFORMASI) */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Kad Graf Aras Air (Col-span-8) */}
            <div className="col-span-8 bg-[#0f0f0f] rounded-2xl border border-slate-800 p-6 shadow-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Real-time Water Level</h3>
                  <div className="flex items-baseline gap-4 mt-2">
                    <span className="text-5xl font-extrabold text-white tracking-tighter">{currentData.water_level.toFixed(2)}m</span>
                    <div className="flex items-center text-[#0ea5e9] text-xs font-bold uppercase gap-1 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/50">
                      <TrendingUp size={14} /> Telemetry Link Online
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <Line data={mainChartData} options={chartOptions} />
              </div>
            </div>

            {/* Kad Lajur Informasi Sebelah Kanan (Col-span-4) */}
            <div className="col-span-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <GaugeCard label="Current Depth" value={`${currentData.current_depth.toFixed(2)}m`} subLabel={currentData.current_depth > 4.0 ? "Critical" : "Normal"} color={currentData.current_depth > 4.0 ? "text-red-500" : "text-emerald-400"} />
                <GaugeCard label="Max 24h Depth" value={`${currentData.max_24h.toFixed(2)}m`} subLabel="Tracked" color="text-[#cc0000]" />
              </div>
              
              {/* Kad Status Kuasa Solar & Bateri */}
              <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-5 space-y-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                    <Sun size={14} className="text-amber-500" /> Solar Panel Health
                  </div>
                  <p className="text-sm font-semibold text-white">Solar Voltage: <span className="text-[#0ea5e9]">{currentData.solar_v.toFixed(1)}V</span></p>
                  <p className="text-[10px] text-emerald-400 mt-1 uppercase font-extrabold italic">
                    Status: {currentData.solar_v > 12.0 ? "Charging (Normal)" : "No Input / Night"}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                    <Battery size={14} className="text-[#0ea5e9]" /> Battery Health
                  </div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-slate-300">Battery: <span className="text-white font-bold">{currentData.battery}%</span></span>
                  </div>
                  <div className="w-full bg-[#161616] h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-[#0ea5e9] h-full transition-all duration-500" style={{ width: `${currentData.battery}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] font-bold">
                    <span className="text-slate-500 uppercase">Node ID: {selectedStation}</span>
                    <span className="text-emerald-400 uppercase italic">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kad Kedudukan GIS Peta */}
            <div className="col-span-8 bg-[#0f0f0f] rounded-2xl border border-slate-800 p-6 shadow-sm">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Sensor Locations</h3>
                <div className="h-[200px] bg-black border border-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                   <p className="text-slate-600 text-xs font-medium">Industrial Map Integration (Google Maps/Leaflet)</p>
                   <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#cc0000] rounded-full animate-ping"></div>
                   <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-[#cc0000] rounded-full border-2 border-slate-900"></div>
                   <div className="absolute top-3 right-3 text-[10px] font-bold text-slate-400 bg-[#161616] px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
                     Lat: {currentData.latitude.toFixed(4)} | Lng: {currentData.longitude.toFixed(4)}
                   </div>
                </div>
            </div>

            {/* Kad Log Amaran Bahaya Telegram */}
            <div className="col-span-4 bg-[#0f0f0f] rounded-2xl border border-slate-800 p-6 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Warning Alerts Feed</h3>
                 <Settings size={14} className="text-slate-500 cursor-pointer hover:text-slate-300" />
               </div>
               <div className="space-y-4">
                 {currentData.water_level > 4.0 && (
                   <AlertItem time="NOW" type="CRITICAL" stationId={selectedStation} text={`Exceeded 4.0m threshold at ${selectedStation}!`} color="text-red-400 bg-red-950/20 border-red-900/50" />
                 )}
                 <AlertItem time="14:15" type="WARNING" stationId="FL03" text="Station FL03 - Rapid rise detected" color="text-amber-400 bg-amber-950/20 border-amber-900/50" />
                 <AlertItem time="11:30" type="INFO" stationId="FL04" text="Solar Voltage Low: Station FL04" color="text-slate-400 bg-slate-900/40 border-slate-800" />
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active 
        ? 'bg-red-950/40 text-[#cc0000] font-bold border border-red-900/50 shadow-md' 
        : 'text-slate-400 hover:bg-[#161616] hover:text-white'
    }`}>
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function GaugeCard({ label, value, subLabel, color }: any) {
  return (
    <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 text-center shadow-sm">
      <div className="w-18 h-18 mx-auto relative mb-3">
         <svg className="w-full h-full" viewBox="0 0 36 36">
            <path className="stroke-slate-800" strokeWidth="3" fill="none" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`stroke-current ${color}`} strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500 uppercase font-black">{subLabel}</div>
      </div>
      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className="text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}

function AlertItem({ time, type, stationId, text, color }: any) {
  return (
    <div className={`flex gap-4 p-3 rounded-xl border transition-all ${color}`}>
      <span className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{time}</span>
      <div>
        <p className="text-[10px] font-black uppercase mb-0.5">
          <span>{type}:</span> <span className="opacity-70">Station {stationId}</span>
        </p>
        <p className="text-xs text-slate-300 leading-tight font-medium">{text}</p>
      </div>
    </div>
  );
}

const chartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { 
      grid: { color: '#161616', drawBorder: false },
      ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } }
    },
    x: { 
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } }
    }
  }
};