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
  AlertTriangle
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

export default function ProfessionalDashboard() {
  // 1. STATE UNTUK DATA SEBENAR ESP32
  const [currentData, setCurrentData] = useState({
    water_level: 0.0,
    battery: 0,
    solar_v: 0.0,
    max_24h: 0.0,
    current_depth: 0.0
  });

  // 2. STATE UNTUK REKOD GRAF (Maksimum 10 data points ke belakang)
  const [chartHistory, setChartHistory] = useState<{ labels: string[]; values: number[] }>({
    labels: ['Waiting...'],
    values: [0]
  });

  // 3. LOGIK INTEGRASI REAL-TIME SUPABASE
  useEffect(() => {
    // Ambil data terakhir dahulu semasa page pertama kali dimuatkan (Initial Load)
    const fetchLatestData = async () => {
      const { data, error } = await supabase
        .from('flood_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const latest = data[0];
        setCurrentData({
          water_level: latest.water_level || 0,
          battery: latest.battery_level || 0,
          solar_v: latest.solar_voltage || 0,
          max_24h: latest.water_level || 0, // Anda boleh optimumkan dengan query MAX() nanti
          current_depth: latest.water_level || 0
        });
      }
    };

    fetchLatestData();

    // Langgan (Subscribe) terus ke saluran perubahan PostgreSQL Supabase
    const channel = supabase
      .channel('esp32-flood-stream')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'flood_data' }, 
        (payload) => {
          const incoming = payload.new;
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          // Kemaskini kad statistik utama
          setCurrentData(prev => ({
            water_level: incoming.water_level,
            battery: incoming.battery_level || prev.battery,
            solar_v: incoming.solar_voltage || prev.solar_v,
            max_24h: incoming.water_level > prev.max_24h ? incoming.water_level : prev.max_24h,
            current_depth: incoming.water_level
          }));

          // Kemaskini sejarah graf secara dinamik
          setChartHistory(prev => {
            const newLabels = [...prev.labels, timestamp];
            const newValues = [...prev.values, incoming.water_level];

            // Hadkan hanya 10 data terakhir pada skrin untuk elakkan graf terlalu padat
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
  }, []);

  // 4. STRUKTUR DATA DARI STATE UNTUK CHART.JS
  const mainChartData = {
    labels: chartHistory.labels,
    datasets: [{
      label: 'Water Depth (m)',
      data: chartHistory.values,
      borderColor: '#38bdf8',
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#38bdf8'
    }]
  };

  return (
    <div className="flex h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col">
        {/* BAHAGIAN LOGO THB DIKEMASKINI */}
        <div className="p-4 flex items-center justify-center border-b border-slate-800/50 bg-black/20">
          <div className="relative w-44 h-20">
            <Image 
              src="/thb-logo.jpeg" // Path terus merujuk kepada folder public/
              alt="THB Logo"
              fill
              priority // Memastikan logo dimuatkan serta-merta tanpa delay
              className="object-contain" // Mengekalkan nisbah aspek logo tanpa penyek
            />
          </div>
        </div>
        
        {/* Menu Navigasi */}
        <nav className="flex-grow px-4 space-y-1">
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

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0b1120]/50 backdrop-blur-md">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-[#1e293b] border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell size={20} className="text-slate-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">3</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">Iskandar Z.</p>
                <p className="text-[10px] text-slate-500 uppercase">Project Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 overflow-hidden">
                 <img src="https://ui-avatars.com/api/?name=Iskandar+Z&background=0ea5e9&color=fff" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Real-time Water Level Card (Wide) */}
            <div className="col-span-8 bg-[#111827] rounded-2xl border border-slate-800 p-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Real-time Water Level</h3>
                  <div className="flex items-baseline gap-4 mt-2">
                    <span className="text-5xl font-bold text-white tracking-tighter">{currentData.water_level.toFixed(2)}m</span>
                    <div className="flex items-center text-sky-400 text-sm font-bold uppercase gap-1">
                      <TrendingUp size={16} /> Live Streaming
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <Line data={mainChartData} options={chartOptions} />
              </div>
            </div>

            {/* Gauges Column */}
            <div className="col-span-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <GaugeCard label="Current Depth" value={`${currentData.current_depth.toFixed(2)}m`} subLabel={currentData.current_depth > 4.0 ? "Critical" : "Normal"} color={currentData.current_depth > 4.0 ? "text-red-500" : "text-emerald-400"} />
                <GaugeCard label="Max 24h Depth" value={`${currentData.max_24h.toFixed(2)}m`} subLabel="Tracked" color="text-sky-400" />
              </div>
              
              {/* Solar & Battery Health */}
              <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                      <Sun size={14} /> Solar Panel Health
                    </div>
                    <p className="text-sm font-medium text-white">Solar Voltage: <span className="text-sky-400">{currentData.solar_v.toFixed(1)}V</span></p>
                    <p className="text-[10px] text-green-400 mt-1 uppercase font-bold">
                      Status: {currentData.solar_v > 12.0 ? "Charging (Normal)" : "No Input / Night"}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                    <Battery size={14} /> Battery Health
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">Battery: <span className="text-orange-400">{currentData.battery}%</span></span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-400 h-full transition-all duration-500" style={{ width: `${currentData.battery}%`, boxShadow: '0 0 10px rgba(251, 146, 60, 0.4)' }}></div>
                  </div>
                  <div className="flex justify-between mt-3 text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Hardware Connection</span>
                    <span className="text-green-400 uppercase font-bold italic">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="col-span-8 bg-[#111827] rounded-2xl border border-slate-800 p-6">
               <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Sensor Locations</h3>
               <div className="h-[200px] bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <p className="text-slate-600 text-sm">Industrial Map Integration (Google Maps/Leaflet)</p>
                  <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-sky-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-sky-400 rounded-full border-2 border-white"></div>
               </div>
            </div>

            {/* Alert Feed */}
            <div className="col-span-4 bg-[#111827] rounded-2xl border border-slate-800 p-6">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Warning Alerts Feed</h3>
                 <Settings size={14} className="text-slate-600" />
               </div>
               <div className="space-y-4">
                 {currentData.water_level > 4.0 && (
                   <AlertItem time="NOW" type="CRITICAL" text="Station FL01 - Exceeded 4.0m threshold!" color="text-red-500" />
                 )}
                 <AlertItem time="14:15" type="WARNING" text="Station FL03 - Rapid rise detected" color="text-orange-500" />
                 <AlertItem time="11:30" type="INFO" text="Solar Voltage Low: Station FL04" color="text-yellow-500" />
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
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition ${active ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg shadow-sky-500/5' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function GaugeCard({ label, value, subLabel, color }: any) {
  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 p-4 text-center">
      <div className="w-20 h-20 mx-auto relative mb-3">
         <svg className="w-full h-full" viewBox="0 0 36 36">
            <path className="stroke-slate-800" strokeWidth="3" fill="none" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`stroke-current ${color}`} strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 uppercase font-bold">{subLabel}</div>
      </div>
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function AlertItem({ time, type, text, color }: any) {
  return (
    <div className="flex gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition border-l-2 border-transparent hover:border-sky-500">
      <span className="text-[10px] text-slate-600 font-mono mt-1">{time}</span>
      <div>
        <p className="text-[10px] font-bold uppercase mb-1">
          <span className={color}>{type}:</span> <span className="text-slate-400">Station FL01</span>
        </p>
        <p className="text-xs text-slate-300 leading-tight">{text}</p>
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
      grid: { color: '#1e293b', drawBorder: false },
      ticks: { color: '#475569', font: { size: 10 } }
    },
    x: { 
      grid: { display: false },
      ticks: { color: '#475569', font: { size: 10 } }
    }
  }
};