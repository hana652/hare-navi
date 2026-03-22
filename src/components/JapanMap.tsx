"use client";

import { useState } from "react";

interface JapanMapProps {
  value: string;
  onChange: (code: string) => void;
}

interface PrefData {
  code: string;
  name: string;
}

interface AreaData {
  name: string;
  prefs: PrefData[];
}

const AREAS: AreaData[] = [
  {
    name: "\u5317\u6D77\u9053\u30FB\u6771\u5317",
    prefs: [
      { code: "016000", name: "\u5317\u6D77\u9053" },
      { code: "020000", name: "\u9752\u68EE" },
      { code: "030000", name: "\u5CA9\u624B" },
      { code: "040000", name: "\u5BAE\u57CE" },
      { code: "050000", name: "\u79CB\u7530" },
      { code: "060000", name: "\u5C71\u5F62" },
      { code: "070000", name: "\u798F\u5CF6" },
    ],
  },
  {
    name: "\u95A2\u6771",
    prefs: [
      { code: "080000", name: "\u8328\u57CE" },
      { code: "090000", name: "\u6803\u6728" },
      { code: "100000", name: "\u7FA4\u99AC" },
      { code: "110000", name: "\u57FC\u7389" },
      { code: "120000", name: "\u5343\u8449" },
      { code: "130000", name: "\u6771\u4EAC" },
      { code: "140000", name: "\u795E\u5948\u5DDD" },
    ],
  },
  {
    name: "\u4E2D\u90E8",
    prefs: [
      { code: "150000", name: "\u65B0\u6F5F" },
      { code: "160000", name: "\u5BCC\u5C71" },
      { code: "170000", name: "\u77F3\u5DDD" },
      { code: "180000", name: "\u798F\u4E95" },
      { code: "190000", name: "\u5C71\u68A8" },
      { code: "200000", name: "\u9577\u91CE" },
      { code: "210000", name: "\u5C90\u961C" },
      { code: "220000", name: "\u9759\u5CA1" },
      { code: "230000", name: "\u611B\u77E5" },
    ],
  },
  {
    name: "\u95A2\u897F",
    prefs: [
      { code: "240000", name: "\u4E09\u91CD" },
      { code: "250000", name: "\u6ECB\u8CC0" },
      { code: "260000", name: "\u4EAC\u90FD" },
      { code: "270000", name: "\u5927\u962A" },
      { code: "280000", name: "\u5175\u5EAB" },
      { code: "290000", name: "\u5948\u826F" },
      { code: "300000", name: "\u548C\u6B4C\u5C71" },
    ],
  },
  {
    name: "\u4E2D\u56FD\u30FB\u56DB\u56FD",
    prefs: [
      { code: "310000", name: "\u9CE5\u53D6" },
      { code: "320000", name: "\u5CF6\u6839" },
      { code: "330000", name: "\u5CA1\u5C71" },
      { code: "340000", name: "\u5E83\u5CF6" },
      { code: "350000", name: "\u5C71\u53E3" },
      { code: "360000", name: "\u5FB3\u5CF6" },
      { code: "370000", name: "\u9999\u5DDD" },
      { code: "380000", name: "\u611B\u5A9B" },
      { code: "390000", name: "\u9AD8\u77E5" },
    ],
  },
  {
    name: "\u4E5D\u5DDE\u30FB\u6C96\u7E04",
    prefs: [
      { code: "400000", name: "\u798F\u5CA1" },
      { code: "410000", name: "\u4F50\u8CC0" },
      { code: "420000", name: "\u9577\u5D0E" },
      { code: "430000", name: "\u7188\u672C" },
      { code: "440000", name: "\u5927\u5206" },
      { code: "450000", name: "\u5BAE\u5D0E" },
      { code: "460100", name: "\u9E7F\u5150\u5CF6" },
      { code: "471000", name: "\u6C96\u7E04" },
    ],
  },
];

export default function JapanMap({ value, onChange }: JapanMapProps) {
  const [expandedArea, setExpandedArea] = useState<string | null>(() => {
    // 初期表示: 選択中の都道府県の地方を展開
    for (const area of AREAS) {
      if (area.prefs.some(p => p.code === value)) return area.name;
    }
    return null;
  });

  function toggleArea(areaName: string) {
    setExpandedArea(expandedArea === areaName ? null : areaName);
  }

  return (
    <div className="space-y-1.5">
      {AREAS.map((area) => (
        <div key={area.name}>
          {/* \u5730\u65B9\u30DC\u30BF\u30F3 */}
          <button
            type="button"
            onClick={() => toggleArea(area.name)}
            className={`
              w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${expandedArea === area.name
                ? "bg-sky-100 text-sky-800"
                : area.prefs.some(p => p.code === value)
                  ? "bg-sky-50 text-sky-700"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span>{area.name}</span>
              <div className="flex items-center gap-2">
                {area.prefs.some(p => p.code === value) && (
                  <span className="text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full">
                    {area.prefs.find(p => p.code === value)?.name}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 transition-transform ${expandedArea === area.name ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>

          {/* \u90FD\u9053\u5E9C\u770C\u30DC\u30BF\u30F3 */}
          {expandedArea === area.name && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-1.5 px-1">
              {area.prefs.map((pref) => (
                <button
                  key={pref.code}
                  type="button"
                  onClick={() => onChange(pref.code)}
                  className={`
                    px-2 py-2 rounded-lg text-sm transition-all text-center
                    ${pref.code === value
                      ? "bg-sky-500 text-white font-bold shadow-md"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-sky-300 hover:bg-sky-50"
                    }
                  `}
                >
                  {pref.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
