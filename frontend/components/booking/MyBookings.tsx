'use client';

import { useState, useEffect } from 'react';
import { getMyBookings, cancelMyBooking } from '@/lib/api';

interface Booking {
  id: string;
  name: string;
  date: string;
  time: string;
  status: string;
}

interface MyBookingsProps {
  token: string;
  onReschedule: (booking: { id: string }) => void;
  onClose: () => void;
}

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const dayName = dayNames[d.getDay()];
  return `יום ${dayName}, ${day}/${month}/${year}`;
}

export default function MyBookings({ token, onReschedule, onClose }: MyBookingsProps) {
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await getMyBookings(token);
      setUpcoming(data.upcoming);
      setPast(data.past);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את התור?')) return;

    setCancellingId(bookingId);
    try {
      await cancelMyBooking(token, bookingId);
      setUpcoming((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'שגיאה בביטול התור';
      alert(message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fadeInUp space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">התורים שלי</h2>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted">תורים קרובים</h3>
          {upcoming.map((booking) => (
            <div
              key={booking.id}
              className="bg-card rounded-2xl p-4 border-2 border-primary/20 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs font-medium text-success">מאושר</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatDate(booking.date)}</p>
                  <p className="text-primary font-black text-lg">{booking.time}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex gap-2">
                <button
                  onClick={() => onReschedule(booking)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200 active:scale-[0.98]"
                >
                  שנה זמן
                </button>
                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {cancellingId === booking.id ? (
                    <span className="flex items-center justify-center gap-1">
                      <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      מבטל...
                    </span>
                  ) : (
                    'בטל תור'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/10 flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-muted font-medium">אין תורים קרובים</p>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted">תורים קודמים</h3>
          {past.slice(0, 5).map((booking) => (
            <div
              key={booking.id}
              className="bg-card rounded-xl p-3 border border-border opacity-60"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">
                  {booking.status === 'COMPLETED' ? 'הושלם' : 'מאושר'}
                </span>
                <div className="text-right">
                  <span className="text-sm text-foreground">{formatDate(booking.date)}</span>
                  <span className="text-sm font-bold text-foreground mr-2">{booking.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book new */}
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl font-bold text-base bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all duration-200 active:scale-[0.98]"
      >
        קבע תור חדש
      </button>
    </div>
  );
}
