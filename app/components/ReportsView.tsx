'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  CloudRain, 
  Search, 
  ChevronDown, 
  ExternalLink,
  ShieldAlert,
  Send
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
    timestamp: '2026-09-20 15:30:12',
    stationId: 'FL01',
    stationName: 'Station FL01',
    river: 'Sg. Bunus',
    waterLevel: 4.55,
    rainIntensity: 45.2,
    severity: 'CRITICAL',
    aiForecastEta: 'Diramal 8 minit awal (R² 96%)',
    actionTaken: 'Telegram Broadcast + Siren Smart City Diaktifkan',
  },
  {
    id: 'REP-2026-0920-02',
    timestamp: '2026-09-20 14:15:00',
    stationId: 'FL02',
    stationName: 'Station FL02',
    river: 'Sg. Gombak',
    waterLevel: 4.22,
    rainIntensity: 32.8,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 18 minit awal (R² 92%)',
    actionTaken: 'Notifikasi Awal Pasukan Penyelamat DBKL',
  },
  {
    id: 'REP-2026-0919-03',
    timestamp: '2026-09-19 18:40:22',
    stationId: 'FL03',
    stationName: 'Station FL03',
    river: 'Sg. Klang',
    waterLevel: 4.10,
    rainIntensity: 28.5,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 22 minit awal (R² 89%)',
    actionTaken: 'Pintu Kawalan Air SMART Tunnel dibuka',
  },
  {
    id: 'REP-2026-0918-04',
    timestamp: '2026-09-18 16:10:45',
    stationId: 'FL01',
    stationName: 'Station FL01',
    river: 'Sg. Bunus',
    waterLevel: 4.62,
    rainIntensity: 58.0,
    severity: 'CRITICAL',
    aiForecastEta: 'Diramal 12 minit awal (R² 98%)',
    actionTaken: 'Amaran Pemindahan Awal Penduduk Kg. Baru',
  },
  {
    id: 'REP-2026-0917-05',
    timestamp: '2026-09-17 13:30:00',
    stationId: 'FL02',
    stationName: 'Station FL02',
    river: 'Sg. Gombak',
    waterLevel: 4.23,
    rainIntensity: 18.0,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 25 minit awal (R² 94%)',
    actionTaken: 'Telegram Alert ke Bilik Gerakan Bencana',
  },
  {
    id: 'REP-2026-0916-06',
    timestamp: '2026-09-16 09:15:30',
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
    timestamp: '2026-09-15 21:45:10',
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
    timestamp: '2026-09-14 17:20:00',
    stationId: 'FL01',
    stationName: 'Station FL01',
    river: 'Sg. Bunus',
    waterLevel: 4.35,
    rainIntensity: 39.5,
    severity: 'WARNING',
    aiForecastEta: 'Diramal 15 minit awal (R² 91%)',
    actionTaken: 'Notifikasi Pasukan Tindakan Pantas',
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
    <div className="space-y-6">
      
      {/* 1. KAD KPI RINGKASAN LAPORAN ATAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-400" /> Insiden Banjir
            </span>
            <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-900/50">
              {timeRange}
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">5 Kejadian</p>
          <p className="text-xs text-slate-400 mt-1">2 kritikal melepasi ambang 4.40m</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-[#0ea5e9]" /> Paras Air Puncak
            </span>
            <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-900/50">
              FL01
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">4.62 m</p>
          <p className="text-xs text-slate-400 mt-1">Direkodkan di Sg. Bunus (18 Sept)</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CloudRain size={14} className="text-indigo-400" /> Kumulatif Hujan
            </span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
              4 Stesen
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">184.2 mm</p>
          <p className="text-xs text-slate-400 mt-1">Purata 26.3 mm/hari</p>
        </div>

        <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" /> Uptime Sistem
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
              SLA 99.5%
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">99.8%</p>
          <p className="text-xs text-slate-400 mt-1">Sifar gangguan telemetri kritikal</p>
        </div>
      </div>

      {/* 2. BAR PENAPIS & BUTANG EKSPORT */}
      <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Carian Pantas */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Cari stesen / tindakan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            />
          </div>

          {/* Penapis Tempoh Masa */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Calendar size={13} /> Tempoh:
            </span>
            <div className="flex bg-[#161616] p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: '24H', label: '24 Jam' },
                { id: '7D', label: '7 Hari' },
                { id: '30D', label: '30 Hari' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    timeRange === t.id ? 'bg-[#cc0000] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Penapis Stesen */}
          <div className="flex items-center gap-2">
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            >
              <option value="ALL">Semua Stesen</option>
              <option value="FL01">FL01 - Sg. Bunus</option>
              <option value="FL02">FL02 - Sg. Gombak</option>
              <option value="FL03">FL03 - Sg. Klang</option>
              <option value="FL04">FL04 - Sg. Ampang</option>
            </select>
          </div>

          {/* Penapis Tahap Keterukan */}
          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#161616] text-white text-xs font-medium px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#cc0000]"
            >
              <option value="ALL">Semua Tahap</option>
              <option value="CRITICAL">🚨 Bahaya Sahaja</option>
              <option value="WARNING">⚠️ Waspada Sahaja</option>
              <option value="NORMAL">✅ Normal Sahaja</option>
            </select>
          </div>
        </div>

        {/* Butang Tindakan Eksport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#161616] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Printer size={13} /> Cetak Ringkasan
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* 3. JADUAL DATA LAPORAN */}
      <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white text-sm font-bold flex items-center gap-2">
            <FileText size={16} className="text-[#cc0000]" />
            Log Laporan Arkib Bencana & Telemetri
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Menunjukkan {filteredReports.length} rekod
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ID Laporan</th>
                <th className="py-3 px-4">Tarikh & Masa</th>
                <th className="py-3 px-4">Stesen / Sungai</th>
                <th className="py-3 px-4">Paras Air (m)</th>
                <th className="py-3 px-4">Hujan (mm/j)</th>
                <th className="py-3 px-4">Keterukan</th>
                <th className="py-3 px-4">Ramalan Predictive AI</th>
                <th className="py-3 px-4">Tindakan Diambil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredReports.map((row) => {
                const isCrit = row.severity === 'CRITICAL';
                const isWarn = row.severity === 'WARNING';
                return (
                  <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">{row.id}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{row.timestamp}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-bold block">{row.stationName}</span>
                      <span className="text-slate-500 text-[11px]">{row.river}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-mono font-bold text-sm ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {row.waterLevel.toFixed(2)}m
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{row.rainIntensity.toFixed(1)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isCrit
                          ? 'bg-red-950/80 text-red-400 border-red-800/80'
                          : isWarn
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                          : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                      }`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-[11px]">{row.aiForecastEta}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={row.actionTaken}>
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
          <div className="bg-[#0f0f0f] border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-white text-base font-bold flex items-center gap-2">
                <Printer size={16} className="text-[#cc0000]" />
                Ringkasan Eksekutif Laporan Banjir THB
              </h4>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#141414] border border-slate-800 rounded-xl p-4 text-xs space-y-3 font-sans">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <div>
                  <p className="font-bold text-white uppercase tracking-wider">THB IoT Flood Mitigation Unit</p>
                  <p className="text-[11px] text-slate-400">Lembangan Sungai Lembah Klang</p>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400">
                  <p>Tarikh: {new Date().toLocaleDateString()}</p>
                  <p>Status: DISAHKAN</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase">Jumlah Insiden</p>
                  <p className="text-lg font-bold text-white">5 Kejadian</p>
                </div>
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase">Paras Tertinggi</p>
                  <p className="text-lg font-bold text-red-400">4.62 m (FL01)</p>
                </div>
                <div className="p-2 bg-[#0a0a0a] rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase">Ketepatan AI</p>
                  <p className="text-lg font-bold text-emerald-400">95.4%</p>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                Ringkasan ini merangkumi data siri masa daripada 4 stesen telemetri aktif. Sepanjang tempoh ini, sistem amaran awal Predictive AI berjaya memberi amaran awal purata 15 minit sebelum paras melepasi zon bahaya.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#161616] border border-slate-800"
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
