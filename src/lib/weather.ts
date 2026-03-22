import type { Region } from "./regions";
import { getHistoricalRate } from "./historical-data";

export interface WeatherResult {
  historicalRate: number | null;
  historicalYears: number;
  historicalSunnyDays: number;
  historicalTotalDays: number;
  forecastPop: number | null;
  forecastWeather: string | null;
  forecastSource: string | null;
  openMeteoSunny: boolean | null;
  openMeteoPrecipProb: number | null;
  compositeScore: number;
  daysFromNow: number;
  confidence: "high" | "medium" | "low";
}

// 気象庁 天気予報JSON取得
async function fetchJmaForecast(regionCode: string) {
  try {
    const res = await fetch(
      `https://www.jma.go.jp/bosai/forecast/data/forecast/${regionCode}.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Open-Meteo JMA API取得（最大16日）
async function fetchOpenMeteo(lat: number, lon: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/jma?latitude=${lat}&longitude=${lon}&daily=weathercode,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&forecast_days=16`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// JMA予報からターゲット日のデータを抽出
function extractJmaForecast(data: any, targetDate: string): { pop: number | null; weather: string | null } {
  if (!data || !Array.isArray(data)) return { pop: null, weather: null };

  let pop: number | null = null;
  let weather: string | null = null;

  for (const section of data) {
    if (!section.timeSeries) continue;
    for (const ts of section.timeSeries) {
      if (!ts.timeDefines || !ts.areas) continue;
      for (let i = 0; i < ts.timeDefines.length; i++) {
        const d = ts.timeDefines[i].substring(0, 10);
        if (d === targetDate) {
          const area = ts.areas[0];
          if (area.weathers && area.weathers[i]) weather = area.weathers[i];
          if (area.pops && area.pops[i] && area.pops[i] !== "") {
            pop = parseInt(area.pops[i]);
          }
        }
      }
    }
  }
  return { pop, weather };
}

// 総合スコア計算
function calculateCompositeScore(
  historicalRate: number | null,
  forecastPop: number | null,
  openMeteoPrecipProb: number | null,
  daysFromNow: number
): { score: number; confidence: "high" | "medium" | "low" } {
  const forecasts: number[] = [];

  if (forecastPop !== null) forecasts.push(100 - forecastPop);
  if (openMeteoPrecipProb !== null) forecasts.push(100 - openMeteoPrecipProb);
  const avgForecast = forecasts.length > 0
    ? forecasts.reduce((a, b) => a + b, 0) / forecasts.length
    : null;

  let score: number;

  if (daysFromNow <= 3) {
    if (avgForecast !== null && historicalRate !== null) {
      score = avgForecast * 0.8 + historicalRate * 0.2;
    } else if (avgForecast !== null) {
      score = avgForecast;
    } else {
      score = historicalRate ?? 50;
    }
    return { score: Math.round(score), confidence: "high" };
  } else if (daysFromNow <= 7) {
    if (avgForecast !== null && historicalRate !== null) {
      score = avgForecast * 0.5 + historicalRate * 0.5;
    } else if (avgForecast !== null) {
      score = avgForecast;
    } else {
      score = historicalRate ?? 50;
    }
    return { score: Math.round(score), confidence: "medium" };
  } else if (daysFromNow <= 16) {
    if (avgForecast !== null && historicalRate !== null) {
      score = avgForecast * 0.3 + historicalRate * 0.7;
    } else {
      score = historicalRate ?? 50;
    }
    return { score: Math.round(score), confidence: "medium" };
  } else {
    score = historicalRate ?? 50;
    return { score: Math.round(score), confidence: "low" };
  }
}

export async function getWeatherPrediction(
  region: Region,
  targetDate: Date
): Promise<WeatherResult> {
  const now = new Date();
  const daysFromNow = Math.ceil((targetDate.getTime() - now.getTime()) / 86400000);
  const targetStr = targetDate.toISOString().substring(0, 10);
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();

  // 過去統計: ハードコードデータから即座に取得（0ms）
  const historical = getHistoricalRate(region.code, month, day);

  // 予報: 気象庁 + Open-Meteoを並行取得（16日以内のみ）
  const [jmaData, openMeteoData] = await Promise.all([
    daysFromNow <= 7 ? fetchJmaForecast(region.jmaAreaCode) : Promise.resolve(null),
    daysFromNow <= 16 ? fetchOpenMeteo(region.lat, region.lon) : Promise.resolve(null),
  ]);

  const jma = jmaData ? extractJmaForecast(jmaData, targetStr) : { pop: null, weather: null };

  let openMeteoPrecipProb: number | null = null;
  let openMeteoSunny: boolean | null = null;
  if (openMeteoData?.daily?.time) {
    const idx = openMeteoData.daily.time.indexOf(targetStr);
    if (idx >= 0) {
      openMeteoPrecipProb = openMeteoData.daily.precipitation_probability_max?.[idx] ?? null;
      const wcode = openMeteoData.daily.weathercode?.[idx];
      openMeteoSunny = wcode !== null && wcode !== undefined ? wcode <= 3 : null;
    }
  }

  const { score, confidence } = calculateCompositeScore(
    historical.rate,
    jma.pop,
    openMeteoPrecipProb,
    daysFromNow
  );

  let forecastSource: string | null = null;
  if (jma.weather || jma.pop !== null) forecastSource = "\u6C17\u8C61\u5E81";
  else if (openMeteoPrecipProb !== null) forecastSource = "Open-Meteo (JMA)";

  return {
    historicalRate: historical.rate,
    historicalYears: historical.years,
    historicalSunnyDays: historical.sunnyDays,
    historicalTotalDays: historical.totalDays,
    forecastPop: jma.pop,
    forecastWeather: jma.weather,
    forecastSource,
    openMeteoSunny,
    openMeteoPrecipProb,
    compositeScore: score,
    daysFromNow,
    confidence,
  };
}
