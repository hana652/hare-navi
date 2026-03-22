"use client";

import { useState, useMemo } from "react";

interface CalendarProps {
  value: string;
  onChange: (date: string) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export default function Calendar({ value, onChange }: CalendarProps) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // 前月の日
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = viewMonth - 1;
      const y = m < 0 ? viewYear - 1 : viewYear;
      const actualM = m < 0 ? 11 : m;
      cells.push({ day: d, month: actualM, year: y, isCurrentMonth: false, dateStr: toDateStr(y, actualM, d) });
    }

    // 当月の日
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true, dateStr: toDateStr(viewYear, viewMonth, d) });
    }

    // 次月の日（6行にする）
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth + 1;
      const y = m > 11 ? viewYear + 1 : viewYear;
      const actualM = m > 11 ? 0 : m;
      cells.push({ day: d, month: actualM, year: y, isCurrentMonth: false, dateStr: toDateStr(y, actualM, d) });
    }

    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-bold text-gray-800">
          {viewYear}年 {MONTH_NAMES[viewMonth]}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 曜日 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7">
        {days.map((cell, i) => {
          const isPast = cell.dateStr < todayStr;
          const isSelected = cell.dateStr === value;
          const isToday = cell.dateStr === todayStr;
          const dayOfWeek = new Date(cell.year, cell.month, cell.day).getDay();

          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(cell.dateStr)}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg transition-all cursor-pointer
                ${!cell.isCurrentMonth ? "text-gray-300" : ""}
                ${cell.isCurrentMonth ? "hover:bg-sky-50" : ""}
                ${isSelected ? "!bg-sky-500 !text-white font-bold shadow-md" : ""}
                ${isToday && !isSelected ? "border-2 border-sky-400 font-bold" : ""}
                ${cell.isCurrentMonth && !isSelected && dayOfWeek === 0 ? "text-red-500" : ""}
                ${cell.isCurrentMonth && !isSelected && dayOfWeek === 6 ? "text-blue-500" : ""}
              `}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
