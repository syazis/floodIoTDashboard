'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
  const [currentData, setCurrentData] = useState({
    water_level: 4.15,
    battery: 88,
    solar_v: 19.5,
    max_24h: 4.30,
    current_depth: 3.92
  });

  // Data untuk graf utama
  const mainChartData = {
    labels: ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', '12 AM'],
    datasets: [{
      label: 'Water Depth (m)',
      data: [0.8, 1.2, 2.5, 3.1, 2.8, 3.9, 4.15],
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
      pointRadius: 0,
    }]
  };

  return (
    <div className="flex h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col">
        <div className="p-6 mb-4">
          <h1 className="text-sky-400 font-bold text-xl flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded-md rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm -rotate-45"></div>
            </div>
            FLOODWATCH <span className="text-white font-light text-sm">IoT</span>
          </h1>
        </div>
        
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
                      <TrendingUp size={16} /> Trending Up
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
                <GaugeCard label="Current Depth" value="3.92m" subLabel="Warning" color="text-orange-400" />
                <GaugeCard label="Max 24h Depth" value="4.30m" subLabel="Stable" color="text-sky-400" />
              </div>
              
              {/* Solar & Battery Health */}
              <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                      <Sun size={14} /> Solar Panel Health
                    </div>
                    <p className="text-sm font-medium text-white">Solar Voltage: <span className="text-sky-400">19.5V</span></p>
                    <p className="text-[10px] text-green-400 mt-1 uppercase font-bold">Status: Charging (Normal)</p>
                  </div>
                  <div className="h-10 w-24 bg-sky-400/5 rounded p-1">
                     {/* Mini sparkline logic here */}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                    <Battery size={14} /> Battery Health
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">Battery: <span className="text-orange-400">88%</span></span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-400 h-full w-[88%]" style={{boxShadow: '0 0 10px rgba(251, 146, 60, 0.4)'}}></div>
                  </div>
                  <div className="flex justify-between mt-3 text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Voltage: 13.1V</span>
                    <span className="text-green-400 uppercase font-bold italic">Status: Good</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="col-span-8 bg-[#111827] rounded-2xl border border-slate-800 p-6">
               <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Sensor Locations</h3>
               <div className="h-[200px] bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <p className="text-slate-600 text-sm">Industrial Map Integration (Google Maps/Leaflet)</p>
                  {/* Mock Map Markers */}
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
                 <AlertItem time="15:42" type="CRITICAL" text="Station FL01 - Exceeded 4.0m threshold" color="text-red-500" />
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

// Sub-components untuk kekemasan kod
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