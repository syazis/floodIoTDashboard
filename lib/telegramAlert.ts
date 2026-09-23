import { PredictionResult } from './predictiveRegression';

export interface TelegramAlertPayload {
  stationId: string;
  stationName: string;
  waterLevel: number;
  dangerThreshold: number;
  battery: number;
  solarVoltage: number;
  prediction: PredictionResult;
  isAutomatic?: boolean;
}

export const TELEGRAM_BOT_TOKEN = "8938370016:AAEzMuVy-08Vn9puh_e7ltRQykpJqUdoQtI";
export const TELEGRAM_CHAT_ID = "-5219407609";

/**
 * Format teks amaran awal banjir AI berserta unjuran masa (ETA)
 */
export function formatAiFloodAlertMessage(payload: TelegramAlertPayload): string {
  const {
    stationId,
    stationName,
    waterLevel,
    dangerThreshold,
    battery,
    solarVoltage,
    prediction,
    isAutomatic = false,
  } = payload;

  const now = new Date();
  const timeNowStr = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateNowStr = now.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // 1. Tentukan Kebarangkalian & Keterukan Banjir
  let floodRiskTitle = "🚨 AMARAN AWAL BANJIR (PREDICTIVE AI)";
  let riskLevelStr = "🔴 SANGAT TINGGI (KRITIKAL)";
  let urgencyEmoji = "🚨";

  if (prediction.isCurrentlyCritical) {
    floodRiskTitle = "🆘 KECEMASAN BANJIR: AMBANG BAHAYA DILEPASI";
    riskLevelStr = "💥 PARAS AIR SEMASA DI PERINGKAT BAHAYA!";
    urgencyEmoji = "🌊";
  } else if (prediction.minutesToDanger !== null && prediction.minutesToDanger <= 30) {
    floodRiskTitle = "🚨 AMARAN AWAL: RISIKO BANJIR KELAS 1";
    riskLevelStr = "🔴 TINGGI (Banjir diramal dalam masa < 30 minit)";
    urgencyEmoji = "⚡";
  } else if (prediction.minutesToDanger !== null && prediction.minutesToDanger <= 60) {
    floodRiskTitle = "⚠️ AMARAN AWAL: RISIKO BANJIR KELAS 2";
    riskLevelStr = "🟠 SEDERHANA TINGGI (Banjir diramal dalam masa < 1 jam)";
    urgencyEmoji = "⚠️";
  } else if (prediction.trend === 'RISING') {
    floodRiskTitle = "ℹ️ NOTIS WASPADA: KENAIKAN PARAS AIR PANTAS";
    riskLevelStr = "🟡 WASPADA (Tren air sedang menaik)";
    urgencyEmoji = "📈";
  } else {
    floodRiskTitle = "📋 LAPORAN RUTIN PREDICTIVE AI";
    riskLevelStr = "🟢 TERKAWAL (Tiada risiko banjir terdekat)";
    urgencyEmoji = "✅";
  }

  // 2. Berapa Lama Lagi Akan Berlaku Banjir (Anggaran Waktu & Minit)
  let etaText = "";
  if (prediction.isCurrentlyCritical) {
    etaText = "*BANJIR SEDANG BERLAKU* - Paras air kini telah mencecah/melepasi ambang bahaya!";
  } else if (prediction.minutesToDanger !== null) {
    const dangerTime = new Date(now.getTime() + prediction.minutesToDanger * 60000);
    const dangerTimeStr = dangerTime.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
    etaText = `👉 *LEBIH KURANG ~${prediction.minutesToDanger} MINIT LAGI*\n🕒 *Jangkaan Waktu Mencecah:* Jam *${dangerTimeStr}*`;
  } else {
    etaText = "✅ *TIADA ANCAMAN SEGERA* - Keluk unjuran tidak menunjukkan kenaikan ke paras bahaya dalam masa terdekat.";
  }

  const marginToDanger = dangerThreshold - waterLevel;
  const rateSymbol = prediction.rateOfChangeCmPerMin > 0 ? "+" : "";

  return (
`${urgencyEmoji} *${floodRiskTitle}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${isAutomatic ? '🤖 _[Penghantaran Automatik Enjin AI Sentinel]_' : '👤 _[Penghantaran Manual Pusat Kawalan]_'}

📍 *Stesen:* ${stationId} - ${stationName}
📅 *Tarikh & Masa:* ${dateNowStr} | ${timeNowStr}
⚠️ *Kebarangkalian Banjir:* ${riskLevelStr}

⏱️ *BERAPA LAMA LAGI AIR CECAH PARAS BAHAYA (ETA):*
${etaText}

📊 *STATUS TELEMETRI & SENSOR:*
• Paras Air Semasa: *${waterLevel.toFixed(2)} m*
• Ambang Bahaya: *${dangerThreshold.toFixed(2)} m*
• Baki Jurang Paras: *${marginToDanger > 0 ? `${marginToDanger.toFixed(2)} m lagi` : 'Sudah Melepasi!'}*
• Kadar Perubahan Air: *${rateSymbol}${prediction.rateOfChangeCmPerMin} cm/min*
• Tren Aliran: *${prediction.trend === 'RISING' ? 'Menaik Pantas ⬆️' : prediction.trend === 'FALLING' ? 'Sedang Surut ⬇️' : 'Mendatar ➡️'}*

🧠 *ANALISIS MODEL PREDICTIVE AI:*
• Algoritma: *${prediction.modelType.toUpperCase()} Regression*
• Ketepatan Garis Unjuran ($R^2$): *${prediction.rSquared}%*
• Unjuran +15 Minit: *${prediction.projectedLevels.in15Min.toFixed(2)} m*
• Unjuran +30 Minit: *${prediction.projectedLevels.in30Min.toFixed(2)} m*
• Unjuran +60 Minit: *${prediction.projectedLevels.in60Min.toFixed(2)} m*

🔋 *STATUS PERKAKASAN NOD:*
• Bateri Node: *${battery}%* | Solar Panel: *${solarVoltage.toFixed(1)} V*

📢 *TINDAKAN KECEMASAN DICADANGKAN (SOP):*
1. Sahkan visual tebing sungai melalui siaran langsung CCTV.
2. Bersiap sedia mengaktifkan siren amaran awal jika tren berterusan.
3. Maklumkan kepada PKOB Daerah & Pasukan Penyelamat (BOMBA/APM).
4. Ambil langkah pencegahan di kawasan berisiko hilir sungai.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 _Sistem Papan Pemuka IoT Banjir THB & AI Time-Series Engine_`
  );
}

/**
 * Hantar mesej amaran ke bot Telegram
 */
export async function sendTelegramFloodAlert(payload: TelegramAlertPayload): Promise<{ success: boolean; message: string }> {
  try {
    const text = formatAiFloodAlertMessage(payload);
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const resData = await response.json();

    if (resData.ok) {
      return {
        success: true,
        message: 'Amaran awal AI berjaya dihantar ke Telegram!',
      };
    } else {
      console.error('Ralat balasan Telegram:', resData);
      return {
        success: false,
        message: `Gagal hantar ke Telegram: ${resData.description || 'Ralat tidak diketahui'}`,
      };
    }
  } catch (error: any) {
    console.error('Ralat rangkaian Telegram API:', error);
    return {
      success: false,
      message: `Ralat sambungan: ${error.message || 'Sila semak internet'}`,
    };
  }
}
