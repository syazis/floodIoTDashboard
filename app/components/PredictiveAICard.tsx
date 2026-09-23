'use client';

import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  ShieldCheck, 
  Flame, 
  Activity, 
  Sliders, 
  Clock, 
  Gauge, 
  Eye,
  EyeOff,
  Send,
  Bell,
  Bot,
  Zap,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { PredictionResult, RegressionModelType } from '@/lib/predictiveRegression';

interface PredictiveAICardProps {
  prediction: PredictionResult;
  selectedModel: RegressionModelType;
  onModelChange: (model: RegressionModelType) => void;
  dangerThreshold: number;
  onThresholdChange: (threshold: number) => void;
  showForecastOnChart: boolean;
  onToggleForecastOnChart: () => void;
  forecastHorizon: number;
  onForecastHorizonChange: (minutes: number) => void;
  historicalCount: number;
  // AI Telegram Early Warning Props
  onTriggerTelegramAlert?: () => void;
  isSendingAlert?: boolean;
  isSentinelActive?: boolean;
  onToggleSentinel?: () => void;
  sentinelThresholdMinutes?: number;
  onSentinelThresholdChange?: (minutes: number) => void;
  lastAlertSentTime?: string | null;
}

export default function PredictiveAICard({
  prediction,
  selectedModel,
  onModelChange,
  dangerThreshold,
  onThresholdChange,
  showForecastOnChart,
  onToggleForecastOnChart,
  forecastHorizon,
  onForecastHorizonChange,
  historicalCount,
  onTriggerTelegramAlert,
  isSendingAlert = false,
  isSentinelActive = true,
  onToggleSentinel,
  sentinelThresholdMinutes = 60,
  onSentinelThresholdChange,
  lastAlertSentTime = null,
}: PredictiveAICardProps) {
  const {
    currentLevel,
    rateOfChangeCmPerMin,
    trend,
    rSquared,
    minutesToDanger,
    isCurrentlyCritical,
    riskStatus,
    projectedLevels,
    equationDescription,
  } = prediction;

  const getStatusBadge = () => {
    if (riskStatus === 'CRITICAL') {
      return (
        <span className="flex items-center gap-1.5 bg-red-950/80 text-red-400 border border-red-800/80 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider animate-pulse">
          <Flame size={13} className="text-red-500" />
          Kritikal: Risiko Tinggi
        </span>
      );
    }
    if (riskStatus === 'WARNING') {
      return (
        <span className="flex items-center gap-1.5 bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
          <AlertTriangle size={13} className="text-amber-400" />
          Amaran: Tren Meningkat
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
        <ShieldCheck size={13} className="text-emerald-400" />
        Terkawal: Paras Selamat
      </span>
    );
  };

  return (
    <div className="bg-[#0f0f0f] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Glow decorative accent background */}
      <div 
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          riskStatus === 'CRITICAL' 
            ? 'bg-red-600/10' 
            : riskStatus === 'WARNING' 
            ? 'bg-amber-600/10' 
            : 'bg-sky-600/10'
        }`} 
      />

      {/* 1. Header Kad Analitik AI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles size={16} className="animate-spin-slow" />
            </div>
            <h3 className="text-white text-sm sm:text-base font-bold tracking-wide flex items-center gap-2">
              Predictive AI Engine
              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800/60 px-1.5 py-0.5 rounded font-mono font-semibold">
                v2.4
              </span>
            </h3>
          </div>
          <p className="text-slate-400 text-xs">
            Ramalan siri masa paras air ({historicalCount} rekod lampau Supabase)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge()}
          <button
            onClick={onToggleForecastOnChart}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showForecastOnChart 
                ? 'bg-indigo-950/70 border-indigo-700/80 text-indigo-300 shadow-sm' 
                : 'bg-[#161616] border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Papar atau sembunyikan unjuran ramalan pada graf"
          >
            {showForecastOnChart ? <Eye size={13} /> : <EyeOff size={13} />}
            <span className="hidden xs:inline">{showForecastOnChart ? 'Unjuran Aktif' : 'Unjuran Tutup'}</span>
          </button>
        </div>
      </div>

      {/* 2. Kawalan Model & Ambang Bahaya */}
      <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3 sm:p-4 mb-5 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-3.5 text-xs">
        {/* Pilihan Model */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Sliders size={13} /> Model:
          </span>
          <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onModelChange('linear')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
                selectedModel === 'linear'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => onModelChange('polynomial')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
                selectedModel === 'polynomial'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Polynomial
            </button>
          </div>
        </div>

        {/* Pilihan Ambang Bahaya */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-red-400" /> Ambang:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {[3.80, 4.00, 4.40].map((val) => (
              <button
                key={val}
                onClick={() => onThresholdChange(val)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                  dangerThreshold === val
                    ? 'bg-red-950/60 border-red-700 text-red-300 shadow-sm'
                    : 'bg-[#0a0a0a] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {val.toFixed(2)}m
              </button>
            ))}
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="10.0"
              value={dangerThreshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value) || 4.40)}
              className="w-14 sm:w-16 bg-[#0a0a0a] border border-slate-800 text-white font-mono text-xs px-1.5 py-1 rounded-lg text-center focus:outline-none focus:border-indigo-500"
              title="Kustom nilai paras bahaya (m)"
            />
          </div>
        </div>

        {/* Horizon Unjuran */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Clock size={13} /> Horizon:
          </span>
          <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-slate-800">
            {[15, 30, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => onForecastHorizonChange(mins)}
                className={`px-2 sm:px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono transition-all ${
                  forecastHorizon === mins
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                +{mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Grid Metrik Utama Ramalan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mb-5">
        
        {/* KAD 1: Countdown Masa Ke Paras Bahaya (ETA) */}
        <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
          riskStatus === 'CRITICAL'
            ? 'bg-gradient-to-br from-red-950/50 to-[#120808] border-red-900/80 shadow-lg shadow-red-950/20'
            : riskStatus === 'WARNING'
            ? 'bg-gradient-to-br from-amber-950/40 to-[#140e06] border-amber-900/80 shadow-lg shadow-amber-950/20'
            : 'bg-gradient-to-br from-slate-900/60 to-[#0e1217] border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock size={13} className={riskStatus === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'} />
              Masa Hingga Paras Bahaya ({dangerThreshold.toFixed(2)}m)
            </span>
          </div>

          <div className="mt-1">
            {isCurrentlyCritical ? (
              <div>
                <p className="text-xl sm:text-2xl font-black text-red-400 tracking-tight animate-pulse flex items-center gap-2">
                  <Flame size={20} /> PARAS BAHAYA!
                </p>
                <p className="text-xs text-red-300/80 mt-1 font-medium">
                  Air telah melepasi ambang {dangerThreshold.toFixed(2)}m (Semasa: {currentLevel.toFixed(2)}m)
                </p>
              </div>
            ) : minutesToDanger !== null ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                    minutesToDanger <= 30 ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    ~{minutesToDanger}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase">Minit Lagi</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Anggaran tiba paras bahaya pada{' '}
                  <span className="text-white font-mono font-bold">
                    {new Date(Date.now() + minutesToDanger * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold text-emerald-400">TIADA ANCAMAN</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {trend === 'FALLING' 
                    ? 'Paras air sedang surut/menurun secara stabil.' 
                    : 'Paras air stabil di bawah zon amaran.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* KAD 2: Kadar Kenaikan Air (Rate of Change) */}
        <div className="bg-[#141414] p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Activity size={13} className="text-sky-400" />
            Kadar Perubahan Semasa
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              rateOfChangeCmPerMin > 0 ? 'text-amber-400' : rateOfChangeCmPerMin < 0 ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {rateOfChangeCmPerMin > 0 ? `+${rateOfChangeCmPerMin}` : rateOfChangeCmPerMin}
            </span>
            <span className="text-xs font-bold text-slate-400">cm / minit</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {trend === 'RISING' ? (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <TrendingUp size={13} /> Menaik Pantas
              </span>
            ) : trend === 'FALLING' ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <TrendingDown size={13} /> Sedang Surut
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1 font-semibold">
                <Minus size={13} /> Paras Stabil
              </span>
            )}
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {prediction.rateOfChangeMPerMin > 0 ? `+${prediction.rateOfChangeMPerMin}` : prediction.rateOfChangeMPerMin} m/min
            </span>
          </div>
        </div>

        {/* KAD 3: Skor Keyakinan Model R² */}
        <div className="bg-[#141414] p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gauge size={13} className="text-indigo-400" />
              Ketepatan ($R^2$ Fit)
            </span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/50">
              {rSquared >= 80 ? 'Tinggi' : rSquared >= 50 ? 'Sederhana' : 'Dinamik'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {rSquared}%
            </span>
            <span className="text-xs text-slate-400">Koefisien Penentuan</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div 
              className={`h-full transition-all duration-500 ${
                rSquared >= 80 ? 'bg-indigo-500' : rSquared >= 50 ? 'bg-amber-500' : 'bg-slate-500'
              }`} 
              style={{ width: `${Math.min(100, Math.max(5, rSquared))}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 truncate font-mono" title={equationDescription}>
            {equationDescription}
          </p>
        </div>

      </div>

      {/* 4. Jadual Unjuran Masa Hadapan (+15m, +30m, +60m) */}
      <div className="bg-[#141414] rounded-xl border border-slate-800/80 p-3 sm:p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Clock size={13} className="text-sky-400" />
          Unjuran Paras Air Mengikut Garis Masa
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {[
            { label: '+15 Minit', value: projectedLevels.in15Min },
            { label: '+30 Minit', value: projectedLevels.in30Min },
            { label: '+60 Minit', value: projectedLevels.in60Min },
          ].map((item, idx) => {
            const isDanger = item.value >= dangerThreshold;
            const isWarning = item.value >= dangerThreshold * 0.85 && !isDanger;
            return (
              <div 
                key={idx}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isDanger 
                    ? 'bg-red-950/40 border-red-800/60 text-red-300' 
                    : isWarning 
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' 
                    : 'bg-[#0a0a0a] border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  {item.label}
                </span>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight block">
                  {item.value.toFixed(2)}m
                </span>
                <span className={`text-[9px] font-black uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${
                  isDanger 
                    ? 'bg-red-900/50 text-red-300' 
                    : isWarning 
                    ? 'bg-amber-900/50 text-amber-300' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isDanger ? 'Bahaya' : isWarning ? 'Waspada' : 'Normal'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Enjin Amaran Awal Telegram (AI Early Warning Sentinel) */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 bg-gradient-to-b from-[#141414] to-[#101010] p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Bot size={16} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Amaran Awal Telegram AI
                {isSentinelActive ? (
                  <span className="flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Auto-Sentinel Aktif
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Manual Sahaja
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400">
                Pemberitahuan ramalan kebarangkalian banjir dan baki masa (ETA) ke Telegram.
              </p>
            </div>
          </div>

          {/* Toggle Switch Sentinel */}
          {onToggleSentinel && (
            <button
              onClick={onToggleSentinel}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isSentinelActive
                  ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap size={13} className={isSentinelActive ? "text-emerald-400" : "text-slate-400"} />
              {isSentinelActive ? "Sentinel Hidup" : "Sentinel Mati"}
            </button>
          )}
        </div>

        {/* Tetapan Sensitiviti Ambang ETA */}
        <div className="bg-[#0c0c0c] p-3 rounded-lg border border-slate-800/80 mb-3 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Clock size={13} className="text-amber-400" />
              Pencetus Amaran Awal jika Banjir Diramal Dalam:
            </span>
            <div className="flex items-center gap-1.5">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onSentinelThresholdChange && onSentinelThresholdChange(mins)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    sentinelThresholdMinutes === mins
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'bg-[#181818] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  &lt; {mins}m
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            *Bot akan menghantar amaran sekiranya regresi AI menjangkakan air mencecah {dangerThreshold.toFixed(2)}m dalam tempoh &lt; {sentinelThresholdMinutes} minit.
          </p>
        </div>

        {/* Butang Tindakan Segera & Status Terkini */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>
              Status Amaran Terakhir: {lastAlertSentTime ? (
                <strong className="text-slate-200">{lastAlertSentTime}</strong>
              ) : (
                <span className="text-slate-500">Belum pernah dihantar sesi ini</span>
              )}
            </span>
          </div>

          {onTriggerTelegramAlert && (
            <button
              onClick={onTriggerTelegramAlert}
              disabled={isSendingAlert}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} className={isSendingAlert ? "animate-pulse" : ""} />
              {isSendingAlert ? "Menghantar ke Telegram..." : "Hantar Amaran Awal AI ke Telegram"}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

