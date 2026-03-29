'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAvailableDates } from '@/lib/hooks';
import { CalendarSkeleton } from '@/components/ui/Skeleton';

interface DatePickerProps {
  onSelect: (date: string) => void;
  selectedDate?: string;
  title?: string;
}

const dayLabels = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const monthNames = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export default function DatePicker({ onSelect, selectedDate, title }: DatePickerProps) {
  const { data, isLoading } = useAvailableDates();
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const availableDates = useMemo(() => {
    if (!data?.dates) return new Set<string>();
    return new Set<string>(
      data.dates.filter((d: { available: boolean }) => d.available).map((d: { date: string }) => d.date)
    );
  }, [data]);


  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [viewMonth]);

  const prevMonth = useCallback(() => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const isToday = (d: Date) => formatDate(d) === formatDate(today);
  const isPast = (d: Date) => {
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return dateOnly < today;
  };

  // Show skeleton only on first load (no cached data)
  if (isLoading && availableDates.size === 0) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="animate-fadeInUp">
      <h2 className="text-xl font-bold text-center text-foreground mb-6">{title || 'בחר תאריך'}</h2>

      <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          {/* RTL: left = next month, right = prev month */}
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-lg font-bold text-foreground">
            {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </h3>

          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 px-3 pt-3">
          {dayLabels.map((label) => (
            <div key={label} className="text-center text-xs font-semibold text-muted py-2">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-3 pb-4 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-11" />;
            }

            const dateStr = formatDate(day);
            const available = availableDates.has(dateStr);
            const selected = selectedDate === dateStr;
            const past = isPast(day);
            const todayMark = isToday(day);
            // In booking range but not available = closed/non-working day
            const allDates = data?.dates ?? [];
            const inRange = allDates.some((d: { date: string }) => d.date === dateStr);
            const isClosed = inRange && !available && !past;

            return (
              <button
                key={dateStr}
                disabled={!available || past}
                onClick={() => onSelect(dateStr)}
                className={`
                  relative h-11 rounded-xl text-sm font-semibold transition-all duration-200
                  ${
                    selected
                      ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                      : available && !past
                        ? 'bg-gray-50 text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer'
                        : isClosed
                          ? 'text-gray-300 line-through cursor-not-allowed'
                          : 'text-gray-200 cursor-not-allowed'
                  }
                `}
              >
                {day.getDate()}
                {available && !past && !selected && !todayMark && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-400" />
                )}
                {todayMark && (
                  <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
