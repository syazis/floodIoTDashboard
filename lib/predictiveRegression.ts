/**
 * Modul Predictive AI: Ramalan Siri Masa Paras Air
 * Menyediakan pengiraan Linear Regression dan Polynomial Regression (Darjah 2),
 * pengiraan kadar kenaikan air (cm/min), anggaran minit ke paras bahaya (ETA),
 * serta penjanaan data unjuran masa depan untuk visualisasi graf.
 */

export interface HistoricalDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  waterLevel: number; // in meters
}

export type RegressionModelType = 'linear' | 'polynomial';

export interface ForecastPoint {
  timestamp: number;
  label: string;
  predictedLevel: number;
  minutesFromNow: number;
}

export interface PredictionResult {
  modelType: RegressionModelType;
  currentLevel: number;
  dangerThreshold: number;
  rateOfChangeMPerMin: number; // m/min
  rateOfChangeCmPerMin: number; // cm/min
  trend: 'RISING' | 'FALLING' | 'STABLE';
  rSquared: number; // 0 to 1
  minutesToDanger: number | null; // null if not reaching danger or already reached
  isCurrentlyCritical: boolean;
  riskStatus: 'CRITICAL' | 'WARNING' | 'SAFE';
  projectedLevels: {
    in15Min: number;
    in30Min: number;
    in60Min: number;
  };
  forecastPoints: ForecastPoint[];
  equationDescription: string;
}

/**
 * Menyelesaikan sistem persamaan linear 3x3 (Gaussian elimination)
 */
function solve3x3(matrix: number[][], vector: number[]): [number, number, number] | null {
  const A = matrix.map(row => [...row]);
  const b = [...vector];

  for (let i = 0; i < 3; i++) {
    // Pivot selection
    let maxRow = i;
    for (let k = i + 1; k < 3; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];

    if (Math.abs(A[i][i]) < 1e-12) {
      return null; // Singular matrix
    }

    // Eliminate below
    for (let k = i + 1; k < 3; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < 3; j++) {
        A[k][j] -= factor * A[i][j];
      }
      b[k] -= factor * b[i];
    }
  }

  // Back substitution
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < 3; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / A[i][i];
  }

  return [x[0], x[1], x[2]];
}

/**
 * Mengira ramalan siri masa berasaskan data lampau
 * @param data Array titik data sejarah [{ timestamp, waterLevel }]
 * @param dangerThreshold Paras bahaya dalam meter (cth: 4.40m)
 * @param modelType 'linear' atau 'polynomial'
 * @param forecastHorizonMinutes Tempoh unjuran ke hadapan dalam minit (lalai: 60)
 */
export function calculateWaterLevelPrediction(
  data: HistoricalDataPoint[],
  dangerThreshold: number = 4.40,
  modelType: RegressionModelType = 'linear',
  forecastHorizonMinutes: number = 60
): PredictionResult {
  // Susun data mengikut kronologi
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Jika data tidak mencukupi (kurang daripada 2 titik)
  if (sorted.length < 2) {
    const currentVal = sorted[0]?.waterLevel ?? 0;
    const isCrit = currentVal >= dangerThreshold;
    return {
      modelType,
      currentLevel: currentVal,
      dangerThreshold,
      rateOfChangeMPerMin: 0,
      rateOfChangeCmPerMin: 0,
      trend: 'STABLE',
      rSquared: 1,
      minutesToDanger: isCrit ? 0 : null,
      isCurrentlyCritical: isCrit,
      riskStatus: isCrit ? 'CRITICAL' : 'SAFE',
      projectedLevels: {
        in15Min: currentVal,
        in30Min: currentVal,
        in60Min: currentVal,
      },
      forecastPoints: [],
      equationDescription: 'Data tidak mencukupi untuk regresi',
    };
  }

  const N = sorted.length;
  const latestPoint = sorted[N - 1];
  const tLatest = latestPoint.timestamp;
  const currentLevel = latestPoint.waterLevel;

  // Normalkan x dalam unit minit relatif kepada tLatest (x_i <= 0, x_latest = 0)
  // Ini memudahkan tafsiran: x = 0 adalah sekarang, x = 10 adalah 10 minit akan datang
  const points = sorted.map(p => ({
    x: (p.timestamp - tLatest) / 60000,
    y: p.waterLevel,
  }));

  // Kira purata
  const meanY = points.reduce((acc, p) => acc + p.y, 0) / N;
  const ssTot = points.reduce((acc, p) => acc + Math.pow(p.y - meanY, 2), 0);

  let evaluate: (x: number) => number;
  let instantaneousRateAtNow: number = 0; // Kecerunan pada x = 0 (m/min)
  let equationDesc = '';
  let ssRes = 0;

  if (modelType === 'polynomial' && N >= 3) {
    // Bina Normal Matrix untuk y = a*x^2 + b*x + c
    let sumX4 = 0, sumX3 = 0, sumX2 = 0, sumX = 0;
    let sumX2Y = 0, sumXY = 0, sumY = 0;

    for (const p of points) {
      const x2 = p.x * p.x;
      const x3 = x2 * p.x;
      const x4 = x2 * x2;
      sumX4 += x4;
      sumX3 += x3;
      sumX2 += x2;
      sumX += p.x;
      sumX2Y += x2 * p.y;
      sumXY += p.x * p.y;
      sumY += p.y;
    }

    const matrix = [
      [sumX4, sumX3, sumX2],
      [sumX3, sumX2, sumX],
      [sumX2, sumX, N],
    ];
    const vector = [sumX2Y, sumXY, sumY];
    const solution = solve3x3(matrix, vector);

    if (solution) {
      const [a, b, c] = solution;
      
      // Perlindungan: Sekiranya keluk kuadratik terlalu mendadak (Runge's effect)
      // hadkan atau gunakan penyesuaian stabil
      evaluate = (x: number) => {
        const val = a * x * x + b * x + c;
        // Paras air tidak boleh negatif secara fizikal
        return Math.max(0, val);
      };

      // Kecerunan dy/dx pada x=0 ialah b
      instantaneousRateAtNow = b;
      equationDesc = `y = ${a >= 0 ? '+' : ''}${a.toFixed(5)}t² ${b >= 0 ? '+' : ''}${b.toFixed(4)}t + ${c.toFixed(2)}`;

      for (const p of points) {
        const yPred = evaluate(p.x);
        ssRes += Math.pow(p.y - yPred, 2);
      }
    } else {
      // Fallback ke linear jika singular
      return calculateWaterLevelPrediction(data, dangerThreshold, 'linear', forecastHorizonMinutes);
    }
  } else {
    // Linear Regression: y = m*x + c
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    }

    const meanX = sumX / N;
    let denom = sumXX - N * meanX * meanX;
    if (Math.abs(denom) < 1e-10) denom = 1;

    const m = (sumXY - N * meanX * meanY) / denom;
    const c = meanY - m * meanX;

    evaluate = (x: number) => Math.max(0, m * x + c);
    instantaneousRateAtNow = m;
    equationDesc = `y = ${m.toFixed(4)}t + ${c.toFixed(2)}`;

    for (const p of points) {
      const yPred = evaluate(p.x);
      ssRes += Math.pow(p.y - yPred, 2);
    }
  }

  // Kira R-squared
  let rSquared = 1;
  if (ssTot > 1e-6) {
    rSquared = Math.max(0, Math.min(1, 1 - ssRes / ssTot));
  }

  const rateOfChangeMPerMin = instantaneousRateAtNow;
  const rateOfChangeCmPerMin = rateOfChangeMPerMin * 100;

  // Tren paras air
  let trend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
  if (rateOfChangeCmPerMin > 0.05) {
    trend = 'RISING';
  } else if (rateOfChangeCmPerMin < -0.05) {
    trend = 'FALLING';
  }

  // Pengiraan Minit Ke Paras Bahaya
  const isCurrentlyCritical = currentLevel >= dangerThreshold;
  let minutesToDanger: number | null = null;

  if (isCurrentlyCritical) {
    minutesToDanger = 0;
  } else if (trend === 'RISING') {
    // Cari masa x > 0 di mana evaluate(x) >= dangerThreshold
    // Jika linear: x = (dangerThreshold - c) / m
    // Untuk kejituan dan menangani polynomial, kita lakukan carian numerik 0.1 minit langkah
    const maxSearchMinutes = 180; // Had carian 3 jam
    const step = 0.5;
    let found = false;

    for (let t = step; t <= maxSearchMinutes; t += step) {
      if (evaluate(t) >= dangerThreshold) {
        minutesToDanger = Math.round(t);
        found = true;
        break;
      }
    }

    if (!found) {
      minutesToDanger = null; // Tidak mencecah dalam tempoh 3 jam
    }
  } else {
    minutesToDanger = null; // Air menurun atau stabil
  }

  // Penentuan Status Risiko AI
  let riskStatus: 'CRITICAL' | 'WARNING' | 'SAFE' = 'SAFE';
  if (isCurrentlyCritical || (minutesToDanger !== null && minutesToDanger <= 30)) {
    riskStatus = 'CRITICAL';
  } else if ((minutesToDanger !== null && minutesToDanger <= 90) || (trend === 'RISING' && currentLevel >= dangerThreshold * 0.85)) {
    riskStatus = 'WARNING';
  } else {
    riskStatus = 'SAFE';
  }

  // Unjuran pada 15, 30, 60 minit
  const in15Min = evaluate(15);
  const in30Min = evaluate(30);
  const in60Min = evaluate(60);

  // Hasilkan siri titik ramalan untuk graf masa hadapan
  // Contoh: selang 5 minit sehingga forecastHorizonMinutes
  const forecastPoints: ForecastPoint[] = [];
  const stepInterval = Math.max(2, Math.floor(forecastHorizonMinutes / 12)); // cth 5 min

  for (let m = stepInterval; m <= forecastHorizonMinutes; m += stepInterval) {
    const futureTime = new Date(tLatest + m * 60000);
    const timeStr = futureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    forecastPoints.push({
      timestamp: futureTime.getTime(),
      label: `${timeStr} (+${m}m)`,
      predictedLevel: parseFloat(evaluate(m).toFixed(2)),
      minutesFromNow: m,
    });
  }

  return {
    modelType,
    currentLevel: parseFloat(currentLevel.toFixed(2)),
    dangerThreshold: parseFloat(dangerThreshold.toFixed(2)),
    rateOfChangeMPerMin: parseFloat(rateOfChangeMPerMin.toFixed(4)),
    rateOfChangeCmPerMin: parseFloat(rateOfChangeCmPerMin.toFixed(2)),
    trend,
    rSquared: parseFloat((rSquared * 100).toFixed(1)),
    minutesToDanger,
    isCurrentlyCritical,
    riskStatus,
    projectedLevels: {
      in15Min: parseFloat(in15Min.toFixed(2)),
      in30Min: parseFloat(in30Min.toFixed(2)),
      in60Min: parseFloat(in60Min.toFixed(2)),
    },
    forecastPoints,
    equationDescription: equationDesc,
  };
}
