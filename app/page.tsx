'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { 
  LayoutDashboard, Radio, FileText, Map as MapIcon, 
  Settings, LogOut, Search, Bell, Sun, Battery, 
  TrendingUp, MapPin, Activity
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, 
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function MultiStationDashboard() {
  // 1. STATE UNTUK SEMUA STESEN (Key = Nama Stesen)
  const [stations, setStations] = useState<Record<string, any>>({});
  const [selectedStation, setSelectedStation] = useState<string>("");

  // 2. LOGIK INTEGRASI MULTI-STATION REAL-TIME
  useEffect(() => {
    // Ambil data terakhir untuk setiap stesen unik semasa load pertama
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('flood_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const latestByStation: Record<string, any> = {};
        data.forEach(item => {
          if (!latestByStation[item.station_name]) {
            latestByStation[item.station_name] = {
              ...item,
              history: [item.water_level]
            };
          }
        });
        setStations(latestByStation);
        // Set stesen pertama sebagai pilihan utama secara automatik
        if (Object.keys(latestByStation).length > 0) {
          setSelectedStation(Object.keys(latestByStation)[0]);
        }
      }
    };

    fetchInitialData();

    // Langgan perubahan data untuk SEMUA stesen
    const channel = supabase
      .channel('multi-station-stream')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'flood_data' }, 
        (payload) => {
          const incoming = payload.new;
          const sName = incoming.station_name;

          setStations(prev => {
            const existingStation = prev[sName] || { history: [] };
            const newHistory = [...existingStation.history, incoming.water_level].slice(-10);

            return {
              ...prev,
              [sName]: {
                ...incoming,
                history: newHistory
              }
            };
          });

          // Jika ini stesen pertama yang pernah hantar data, auto-select
          if (!selectedStation) setSelectedStation(sName);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStation]);

  // Data untuk Graf (Berdasarkan stesen yang dipilih)
  const activeData = stations[selectedStation] || { water_level: 0, history: [0] };
  
  const chartData = {
    labels: activeData.history.map((_: any, i: number) => `T-${10-i}`),
    datasets: [{
      label: `Water Level ${selectedStation}`,
      data: activeData.history,
      borderColor: '#cc0000', // THB RED
      backgroundColor: 'rgba(204, 0, 0, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }]
  };

  return (
    <div className="flex h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR DENGAN SENARAI STESEN AKTIF */}
      <aside className="w-72 bg-[#111827] border-r border-slate-800 flex flex-col">
        <div className="p-4 flex items-center justify-center border-b border-slate-800/50 bg-black/20">
          <div className="relative w-44 h-16">
            <Image src="/thb-logo.jpeg" alt="THB Logo" fill priority className="object-contain" />
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Active Stations</h3>
          <div className="space-y-2">
            {Object.keys(stations).length === 0 && <p className="text-xs italic text-slate-600">Waiting for sensor data...</p>}
            {Object.keys(stations).map(name => (
              <button 
                key={name}
                onClick={() => setSelectedStation(name)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selectedStation === name ? 'bg-[#cc0000]/10 border border-[#cc0000]/30 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={16} className={selectedStation === name ? 'text-[#cc0000]' : 'text-slate-600'} />
                  <span className="text-sm font-medium truncate w-32 text-left">{name}</span>
                </div>
                {selectedStation === name && <Activity size={14} className="animate-pulse text-[#cc0000]" />}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-grow px-4 mt-auto border-t border-slate-800 pt-4 pb-6 space-y-1">
          <NavItem icon={<FileText size={18}/>} label="Full Reports" />
          <NavItem icon={<Settings size={18}/>} label="Admin Settings" />
          <NavItem icon={<LogOut size={18}/>} label="Log Out" />
        </nav>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-grow flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0b1120]/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
              Monitoring: <span className="text-[#cc0000]">{selectedStation || "---"}</span>
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Iskandar Z.</p>
              <p className="text-[10px] text-slate-500 uppercase">Project Manager</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
               <img src="https://ui-avatars.com/api/?name=Iskandar+Z&background=cc0000&color=fff" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="flex-grow p-8 overflow-y-auto space-y-8">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 bg-[#111827] rounded-3xl border border-slate-800 p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Current Water Depth</h3>
                  <div className="flex items-baseline gap-4">
                    <span className="text-7xl font-bold text-white tracking-tighter">
                      {activeData.water_level.toFixed(2)}<span className="text-2xl ml-1 text-slate-500">m</span>
                    </span>
                    <span className="px-3 py-1 bg-[#cc0000]/20 text-[#cc0000] text-[10px] font-black rounded-full uppercase">Live</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="col-span-4 space-y-6">
              <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6">
                <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Power Systems</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400 flex items-center gap-2"><Sun size={14}/> Solar Input</span>
                      <span className="text-white font-bold">{activeData.solar_voltage?.toFixed(1) || "0.0"}V</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full"><div className="bg-sky-400 h-full w-[75%] rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400 flex items-center gap-2"><Battery size={14}/> LiFePO4 Battery</span>
                      <span className="text-white font-bold">{activeData.battery_level || "0"}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full"><div className="bg-[#cc0000] h-full rounded-full" style={{width: `${activeData.battery_level}%`}}></div></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#cc0000]/20 to-transparent rounded-3xl border border-[#cc0000]/30 p-6">
                <h3 className="text-[#cc0000] text-[10px] font-bold uppercase tracking-widest mb-2">Station Health</h3>
                <p className="text-2xl font-bold text-white">Operational</p>
                <p className="text-xs text-slate-400 mt-2">All sensors are reporting within normal parameters for {selectedStation}.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-komponen NavItem & ChartOptions (Sama seperti sebelumnya)
function NavItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition ${active ? 'bg-[#cc0000]/10 text-[#cc0000]' : 'text-slate-500 hover:text-white'}`}>
      {icon} <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

const chartOptions: any = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: '#1e293b', drawBorder: false }, ticks: { color: '#475569', font: { size: 10 } } },
    x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } } }
  }
};