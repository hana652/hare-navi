"use client";

import { useState, useCallback } from "react";
import { REGIONS } from "@/lib/regions";
import { getHistoricalRate } from "@/lib/historical-data";
import Calendar from "@/components/Calendar";
import JapanMap from "@/components/JapanMap";

interface ForecastData {
  forecastPop: number | null;
  forecastWeather: string | null;
  openMeteoPrecipProb: number | null;
}

function getScoreEmoji(score: number) {
  if (score >= 80) return "\u2600\uFE0F";
  if (score >= 60) return "\uD83C\uDF24\uFE0F";
  if (score >= 40) return "\u26C5";
  if (score >= 20) return "\uD83C\uDF27\uFE0F";
  return "\uD83C\uDF27\uFE0F";
}

function getScoreBg(score: number) {
  if (score >= 70) return "from-orange-400 to-yellow-400";
  if (score >= 50) return "from-sky-400 to-blue-500";
  if (score >= 30) return "from-gray-400 to-gray-500";
  return "from-blue-500 to-indigo-600";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["\u65E5", "\u6708", "\u706B", "\u6C34", "\u6728", "\u91D1", "\u571F"];
  return `${d.getFullYear()}\u5E74${d.getMonth() + 1}\u6708${d.getDate()}\u65E5\uFF08${weekdays[d.getDay()]}\uFF09`;
}

function getConfidenceLabel(daysFromNow: number, hasForecast: boolean) {
  if (daysFromNow <= 3 && hasForecast) return "\u4FE1\u983C\u5EA6\uFF1A\u9AD8";
  if (daysFromNow <= 7 && hasForecast) return "\u4FE1\u983C\u5EA6\uFF1A\u4E2D";
  if (daysFromNow <= 16 && hasForecast) return "\u4FE1\u983C\u5EA6\uFF1A\u4E2D";
  return "\u4FE1\u983C\u5EA6\uFF1A\u904E\u53BB\u7D71\u8A08\u306E\u307F";
}

function calcCompositeScore(
  historicalRate: number,
  forecastPop: number | null,
  openMeteoPrecipProb: number | null,
  daysFromNow: number
): number {
  const forecasts: number[] = [];
  if (forecastPop !== null) forecasts.push(100 - forecastPop);
  if (openMeteoPrecipProb !== null) forecasts.push(100 - openMeteoPrecipProb);
  const avgForecast = forecasts.length > 0
    ? forecasts.reduce((a, b) => a + b, 0) / forecasts.length
    : null;

  if (daysFromNow <= 3 && avgForecast !== null) {
    return Math.round(avgForecast * 0.8 + historicalRate * 0.2);
  } else if (daysFromNow <= 7 && avgForecast !== null) {
    return Math.round(avgForecast * 0.5 + historicalRate * 0.5);
  } else if (daysFromNow <= 16 && avgForecast !== null) {
    return Math.round(avgForecast * 0.3 + historicalRate * 0.7);
  }
  return historicalRate;
}

export default function Home() {
  const [region, setRegion] = useState("130000");
  const [date, setDate] = useState("");
  const [historicalRate, setHistoricalRate] = useState<number | null>(null);
  const [historicalData, setHistoricalData] = useState<{ sunnyDays: number; totalDays: number; years: number } | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchedRegion, setSearchedRegion] = useState("");
  const [searchedDate, setSearchedDate] = useState("");
  const [daysFromNow, setDaysFromNow] = useState(0);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const targetDate = new Date(date + "T00:00:00");
    const now = new Date();
    const diff = Math.ceil((targetDate.getTime() - now.getTime()) / 86400000);
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const regionName = REGIONS.find(r => r.code === region)?.name || "";

    // STEP 1: 即座に過去統計を表示（0ms）
    const hist = getHistoricalRate(region, month, day);
    setHistoricalRate(hist.rate);
    setHistoricalData({ sunnyDays: hist.sunnyDays, totalDays: hist.totalDays, years: hist.years });
    setForecast(null);
    setSearched(true);
    setSearchedRegion(regionName);
    setSearchedDate(date);
    setDaysFromNow(diff);

    // STEP 2: 予報をバックグラウンドで取得（未来の日付のみ）
    if (diff > 0 && diff <= 16) {
      setLoadingForecast(true);
      try {
        const res = await fetch(`/api/weather?region=${region}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          setForecast({
            forecastPop: data.forecastPop,
            forecastWeather: data.forecastWeather,
            openMeteoPrecipProb: data.openMeteoPrecipProb,
          });
        }
      } catch {
        // 予報取得失敗しても統計は表示済みなのでOK
      } finally {
        setLoadingForecast(false);
      }
    }
  }, [date, region]);

  const compositeScore = historicalRate !== null
    ? calcCompositeScore(
        historicalRate,
        forecast?.forecastPop ?? null,
        forecast?.openMeteoPrecipProb ?? null,
        daysFromNow
      )
    : null;

  const selectedRegionName = REGIONS.find(r => r.code === region)?.name || "";

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-sky-800 mb-1">
          {"\u2600\uFE0F \u6674\u308C\u30CA\u30D3"}
        </h1>
        <p className="text-sky-600 text-sm">{"\u305D\u306E\u65E5\u3001\u6674\u308C\u308B\uFF1F"}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* \u5730\u57DF\u9078\u629E */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-3">
          <h2 className="font-bold text-gray-700 text-sm mb-2">{"\uD83D\uDDFE \u5730\u57DF"}</h2>
          <JapanMap value={region} onChange={setRegion} />
        </div>

        {/* \u30AB\u30EC\u30F3\u30C0\u30FC */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-3">
          <h2 className="font-bold text-gray-700 text-sm mb-2">{"\uD83D\uDCC5 \u65E5\u4ED8"}</h2>
          <Calendar value={date} onChange={setDate} />
        </div>

        {/* \u691C\u7D22\u30DC\u30BF\u30F3 */}
        <div className="bg-white rounded-2xl shadow-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 min-w-0 truncate mr-3">
              {selectedRegionName && date ? (
                <span>
                  <span className="font-bold text-sky-700">{selectedRegionName}</span>
                  {" / "}
                  <span className="font-bold text-sky-700">{formatDate(date)}</span>
                </span>
              ) : (
                <span className="text-gray-400">{"\u5730\u57DF\u3068\u65E5\u4ED8\u3092\u9078\u629E"}</span>
              )}
            </div>
            <button
              type="submit"
              disabled={!date}
              className="bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm whitespace-nowrap flex-shrink-0"
            >
              {"\u6674\u308C\u308B\uFF1F"}
            </button>
          </div>
        </div>
      </form>

      {/* \u7D50\u679C */}
      {searched && compositeScore !== null && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* \u30E1\u30A4\u30F3\u30B9\u30B3\u30A2 */}
          <div className={`bg-gradient-to-r ${getScoreBg(compositeScore)} p-6 text-center text-white`}>
            <p className="text-sm opacity-80">
              {searchedRegion} / {formatDate(searchedDate)}
            </p>
            <div className="text-6xl my-3">
              {getScoreEmoji(compositeScore)}
            </div>
            <p className="text-5xl font-bold">
              {compositeScore}%
            </p>
            <p className="text-lg mt-1">{"\u6674\u308C\u308B\u78BA\u7387"}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-white/20">
              {getConfidenceLabel(daysFromNow, forecast !== null)}
              {loadingForecast && " (\u4E88\u5831\u53D6\u5F97\u4E2D...)"}
            </span>
          </div>

          <div className="p-5 space-y-3">
            {/* \u904E\u53BB\u7D71\u8A08 */}
            <div className="bg-amber-50 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 text-sm mb-1">
                {"\uD83D\uDCCA \u904E\u53BB\u306E\u7D71\u8A08"}
              </h3>
              <p className="text-2xl font-bold text-amber-700">
                {historicalRate}%
                {historicalData && (
                  <span className="text-sm font-normal ml-2">
                    ({historicalData.sunnyDays}/{historicalData.totalDays}{"\u65E5\u304C\u6674\u308C"})
                  </span>
                )}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {"\u904E\u53BB"}{historicalData?.years || 30}{"\u5E74\u9593\u306E\u540C\u6708\u306E\u30C7\u30FC\u30BF"}
              </p>
            </div>

            {/* \u4E88\u5831 */}
            {loadingForecast && (
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-blue-600 text-sm animate-pulse">{"\uD83D\uDD04 \u6700\u65B0\u306E\u4E88\u5831\u3092\u53D6\u5F97\u4E2D..."}</p>
              </div>
            )}

            {forecast && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(forecast.forecastWeather || forecast.forecastPop !== null) && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-bold text-blue-800 text-sm mb-1">{"\uD83C\uDFEF \u6C17\u8C61\u5E81"}</h3>
                    {forecast.forecastWeather && (
                      <p className="text-blue-700 text-sm">{forecast.forecastWeather}</p>
                    )}
                    {forecast.forecastPop !== null && (
                      <p className="text-blue-700 text-lg font-bold">{"\u964D\u6C34 "}{forecast.forecastPop}%</p>
                    )}
                  </div>
                )}

                {forecast.openMeteoPrecipProb !== null && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="font-bold text-purple-800 text-sm mb-1">{"\uD83C\uDF0D Open-Meteo"}</h3>
                    <p className="text-purple-700 text-lg font-bold">{"\u964D\u6C34 "}{forecast.openMeteoPrecipProb}%</p>
                  </div>
                )}
              </div>
            )}

            {/* \u904E\u53BB\u306E\u65E5\u4ED8\u306E\u5834\u5408 */}
            {daysFromNow <= 0 && !loadingForecast && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 text-center">
                  {"\u904E\u53BB\u306E\u65E5\u4ED8\u306E\u305F\u3081\u3001\u904E\u53BB\u7D71\u8A08\u306E\u307F\u3067\u7B97\u51FA\u3057\u3066\u3044\u307E\u3059"}
                </p>
              </div>
            )}

            {/* \u30B9\u30B3\u30A2\u6839\u62E0 */}
            {daysFromNow > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 text-center">
                  {daysFromNow <= 3 && "\u4E88\u5831\u91CD\u8996\uFF08\u4E88\u583180% + \u7D71\u8A0820%\uFF09"}
                  {daysFromNow > 3 && daysFromNow <= 7 && "\u30D0\u30E9\u30F3\u30B9\uFF08\u4E88\u583150% + \u7D71\u8A0850%\uFF09"}
                  {daysFromNow > 7 && daysFromNow <= 16 && "\u7D71\u8A08\u5BC4\u308A\uFF08\u7D71\u8A0870% + \u4E88\u583130%\uFF09"}
                  {daysFromNow > 16 && "\u904E\u53BB\u7D71\u8A08\u306E\u307F\uFF08\u4E88\u5831\u7BC4\u56F2\u5916\uFF09"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="text-center mt-6 text-xs text-sky-600/50">
        <p>{"\u30C7\u30FC\u30BF: \u6C17\u8C61\u5E81 / Open-Meteo (JMA)"}</p>
      </footer>
    </main>
  );
}
