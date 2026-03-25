'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAvailableSlots } from '@/lib/api';

interface TimePickerProps {
  date: string;
  onSelect: (time: string) => void;
  selectedTime?: string;
  title?: string;
}

export default function TimePicker({ date, onSelect, selectedTime, title }: TimePickerProps) {
  const [slots, setSlots] = useState<{ time: string; available: boolean; held?: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchSlots = useCallback((showLoader: boolean) => {
    if (showLoader) setLoading(true);
    getAvailableSlots(date)
      .then((data) => {
        setSlots(data.slots || []);
        setMessage(data.message || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    fetchSlots(true);
    const interval = setInterval(() => fetchSlots(false), 5000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (message && slots.length === 0) {
    return (
      <div className="text-center py-12 animate-fadeInUp">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-muted text-lg">{message}</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h2 className="text-xl font-bold text-center text-foreground mb-6">{title || 'בחר שעה'}</h2>

      <div className="max-w-md mx-auto grid grid-cols-3 gap-3 stagger-children">
        {slots.map(({ time, available, held }) => {
          const isSelected = selectedTime === time;

          return (
            <button
              key={time}
              disabled={!available}
              onClick={() => onSelect(time)}
              className={`
                relative py-3.5 rounded-xl text-base font-bold transition-all duration-200 border-2
                ${
                  isSelected
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-[1.03]'
                    : available
                      ? 'bg-card border-border text-foreground hover:border-primary hover:text-primary hover:shadow-md cursor-pointer active:scale-95'
                      : 'bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed'
                }
              `}
            >
              {time}
              {held && (
                <span className="block text-[10px] font-medium text-amber-500 mt-0.5">תפוסה כרגע</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
