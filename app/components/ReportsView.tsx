'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  CloudRain, 
  Search, 
  ShieldAlert
} from 'lucide-react';

interface FloodReportLog {
  id: string;
  timestamp: string;
  stationId: string;
  stationName: string;
  river: string;
  waterLevel: number;
  rainIntensity: number; // mm/h
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  aiForecastEta: string;
  actionTaken: string;
}

const DUMMY_REPORTS: FloodReportLog[] = [
  {
    id: 'REP-2026-0920-01',
    timestamp: '2026-09-20 15:30',
    stationId: 'FL01',
    stationName: 'Station FL01',
    river: 'Sg. Bunus',
    waterLevel: 4.55,
    rainIntensity: 45.2,
    severity: 'CRITICAL',
    aiForecastEta: 'Diramal 8m awal (R² 96%)',
    actionTaken: 'Telegram Alert + Siren Smart City Aktif',
  },
  {
    id: 'REP-2026-0920-02',
    timestamp: '2026-09-20 14:15',
    stationId: 'FL02',
    stationName: 'Station FL02',
    river: 'Sg. Gombak',
    waterLevel: 4.22,
    rainIntensity: 32.8,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 18m awal (R² 92%)',
    actionTaken: 'Notifikasi Awal DBKL',
  },
  {
    id: 'REP-2026-0919-03',
    timestamp: '2026-09-19 18:40',
    stationId: 'FL03',
    stationName: 'Station FL03',
    river: 'Sg. Klang',
    waterLevel: 4.10,
    rainIntensity: 28.5,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 22m awal (R² 89%)',
    actionTaken: 'Pintu SMART Tunnel Dibuka',
  },
  {
    id: 'REP-2026-0918-04',
    timestamp: '2026-09-18 16:10',
    stationId: 'FL01',
    stationName: 'Station FL01',
    river: 'Sg. Bunus',
    waterLevel: 4.62,
    rainIntensity: 58.0,
    severity: 'CRITICAL',
    aiForecastEta: 'Diramal 12m awal (R² 98%)',
    actionTaken: 'Amaran Pemindahan Kg. Baru',
  },
  {
    id: 'REP-2026-0917-05',
    timestamp: '2026-09-17 13:30',
    stationId: 'FL02',
    stationName: 'Station FL02',
    river: 'Sg. Gombak',
    waterLevel: 4.23,
    rainIntensity: 18.0,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 25m awal (R² 94%)',
    actionTaken: 'Telegram Alert Bilik Gerakan',
  },
  {
    id: 'REP-2026-0916-06',
    timestamp: '2026-09-16 09:15',
    stationId: 'FL04',
    stationName: 'Station FL04',
    river: 'Sg. Ampang',
    waterLevel: 3.10,
    rainIntensity: 8.5,
    severity: 'NORMAL',
    aiForecastEta: 'Paras Terkawal (Tren Stabil)',
    actionTaken: 'Laporan Berkala Automatik',
  },
  {
    id: 'REP-2026-0915-07',
    timestamp: '2026-09-15 21:45',
    stationId: 'FL03',
    stationName: 'Station FL03',
    river: 'Sg. Klang',
    waterLevel: 3.40,
    rainIntensity: 12.0,
    severity: 'NORMAL',
    aiForecastEta: 'Paras Terkawal (Tren Menurun)',
    actionTaken: 'Laporan Berkala Automatik',
  },
  {
    id: 'REP-2026-0914-08',
    timestamp: '2026-09-14 17:20',
    stationId: 'FL01',
    stationName: 'Station FL01',
    river: 'Sg. Bunus',
    waterLevel: 4.35,
    rainIntensity: 39.5,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 15m awal (R² 91%)',
    actionTaken: 'Notifikasi Pasukan Tindakan',
  },
];

export default function ReportsView() {
  const [timeRange, setTimeRange] = useState('7D');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Penapisan data laporan
  const filteredReports = DUMMY_REPORTS.filter((item) => {
    if (stationFilter !== 'ALL' && item.stationId !== stationFilter) return false;
    if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matches = 
        item.stationName.toLowerCase().includes(q) ||
        item.river.toLowerCase().includes(q) ||
        item.actionTaken.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // Fungsi muat turun fail CSV sebenar
  const handleExportCSV = () => {
    const headers = [
      'Report ID',
      'Tarikh & Masa',
      'Kod Stesen',
      'Nama Stesen',
      'Lembangan Sungai',
      'Paras Air (m)',
      'Hujan (mm/j)',
      'Tahap Keterukan',
      'Ketepatan Ramalan AI',
      'Tindakan Diambil'
    ];

    const rows = filteredReports.map(r => [
      `"${r.id}"`,
      `"${r.timestamp}"`,
      `"${r.stationId}"`,
      `"${r.stationName}"`,
      `"${r.river}"`,
      r.waterLevel.toFixed(2),
      r.rainIntensity.toFixed(1),
      `"${r.severity}"`,
      `"${r.aiForecastEta}"`,
      `"${r.actionTaken}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `THB_Flood_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 1. KAD KPI RINGKASAN LAPORAN ATAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={13} className="text-red-400" /> Insiden
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/50">
              {timeRange}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">5 Kejadian</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">2 melepasi 4.40m</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={13} className="text-[#0ea5e9]" /> Puncak
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-sky-400 font-bold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-900/50">
              FL01
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">4.62 m</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Sg. Bunus (18 Sept)</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <CloudRain size={13} className="text-indigo-400" /> Hujan
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/50">
              Total
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">184.2 mm</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Purata 26.3 mm/h</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-400" /> Uptime
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">
              SLA
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">99.8%</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Telemetri lancar</p>
        </div>
      </div>

      {/* 2. BAR PENAPIS & BUTANG EKSPORT */}
      <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-3.5 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Carian Pantas */}
          <div className="relative flex-1 sm:w-56 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
            <input
              type="text"
              placeholder="Cari stesen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] text-white text-xs pl-8 pr-3 py-1.5 sm:py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            />
          </div>

          {/* Penapis Tempoh Masa */}
          <div className="flex items-center gap-1.5">
            <div className="flex bg-[#161616] p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: '24H', label: '24J' },
                { id: '7D', label: '7 Hari' },
                { id: '30D', label: '30 Hari' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                    timeRange === t.id ? 'bg-[#cc0000] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Penapis Stesen */}
          <div className="flex items-center gap-1">
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-2.5 py-1.5 sm:py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            >
              <option value="ALL">Semua Stesen</option>
              <option value="FL01">FL01 - Sg. Bunus</option>
              <option value="FL02">FL02 - Sg. Gombak</option>
              <option value="FL03">FL03 - Sg. Klang</option>
              <option value="FL04">FL04 - Sg. Ampang</option>
            </select>
          </div>

          {/* Penapis Tahap Keterukan */}
          <div className="flex items-center gap-1">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-2.5 py-1.5 sm:py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            >
              <option value="ALL">Semua Keterukan</option>
              <option value="CRITICAL">🚨 Bahaya</option>
              <option value="WARNING">⚠️ Waspada</option>
              <option value="NORMAL">✅ Normal</option>
            </select>
          </div>
        </div>

        {/* Butang Tindakan Eksport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#161616] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Printer size={13} /> Cetak
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* 3. JADUAL DATA LAPORAN */}
      <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white text-xs sm:text-sm font-bold flex items-center gap-2">
            <FileText size={15} className="text-[#cc0000]" />
            Log Arkib Bencana & Telemetri
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
            {filteredReports.length} rekod
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-[#141414] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 sm:px-4">ID</th>
                <th className="py-2.5 px-3 sm:px-4">Tarikh & Masa</th>
                <th className="py-2.5 px-3 sm:px-4">Stesen</th>
                <th className="py-2.5 px-3 sm:px-4">Paras</th>
                <th className="py-2.5 px-3 sm:px-4">Hujan</th>
                <th className="py-2.5 px-3 sm:px-4">Status</th>
                <th className="py-2.5 px-3 sm:px-4">Ramalan AI</th>
                <th className="py-2.5 px-3 sm:px-4">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredReports.map((row) => {
                const isCrit = row.severity === 'CRITICAL';
                const isWarn = row.severity === 'WARNING';
                return (
                  <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-mono text-slate-400 font-bold">{row.id}</td>
                    <td className="py-3 px-3 sm:px-4 text-slate-300 font-mono whitespace-nowrap">{row.timestamp}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className="text-white font-bold block">{row.stationName}</span>
                      <span className="text-slate-500 text-[10px]">{row.river}</span>
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className={`font-mono font-bold text-sm ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {row.waterLevel.toFixed(2)}m
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono text-slate-300">{row.rainIntensity.toFixed(1)}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isCrit
                          ? 'bg-red-950/80 text-red-400 border-red-800/80'
                          : isWarn
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                          : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                      }`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-300 text-[11px] whitespace-nowrap">{row.aiForecastEta}</td>
                    <td className="py-3 px-3 sm:px-4 text-slate-400 text-[11px] max-w-[200px] truncate" title={row.actionTaken}>
                      {row.actionTaken}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL CETAK RINGKASAN */}
      {printModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white text-base font-bold flex items-center gap-2">
                <Printer size={16} className="text-[#cc0000]" />
                Ringkasan Laporan Banjir THB
              </h4>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#141414] border border-slate-800 rounded-xl p-3.5 sm:p-4 text-xs space-y-3 font-sans">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <div>
                  <p className="font-bold text-white uppercase tracking-wider">THB Flood Mitigation Unit</p>
                  <p className="text-[11px] text-slate-400">Lembangan Sungai Lembah Klang</p>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400">
                  <p>{new Date().toLocaleDateString()}</p>
                  <p className="text-emerald-400 font-bold">DISAHKAN</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase">Insiden</p>
                  <p className="text-base sm:text-lg font-bold text-white">5 Kejadian</p>
                </div>
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase">Paras Puncak</p>
                  <p className="text-base sm:text-lg font-bold text-red-400">4.62 m</p>
                </div>
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase">Ketepatan AI</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-400">95.4%</p>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                Ringkasan siri masa 4 stesen telemetri. Sistem amaran awal Predictive AI berjaya memberi amaran purata 15 minit sebelum melepasi paras bahaya.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#161616] border border-slate-800"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#cc0000] hover:bg-red-700 shadow-sm"
              >
                Cetak Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
