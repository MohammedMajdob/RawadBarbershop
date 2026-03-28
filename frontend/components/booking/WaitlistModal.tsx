'use client';

import { useState } from 'react';
import { joinWaitlist } from '@/lib/api';
import { useAvailableDates } from '@/lib/hooks';

interface WaitlistModalProps {
  onClose: () => void;
  isAuthenticated?: boolean;
  prefillName?: string;
  prefillPhone?: string;
  prefillDate?: string;
}

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function formatDateHebrew(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `יום ${dayNames[date.getDay()]}, ${d} ב${monthNames[m - 1]}`;
}

export default function WaitlistModal({
  onClose,
  isAuthenticated = false,
  prefillName = '',
  prefillPhone = '',
  prefillDate = '',
}: WaitlistModalProps) {
  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [preferredDate, setPreferredDate] = useState(prefillDate);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const { data: datesData } = useAvailableDates();
  const availableDates: string[] = (datesData?.dates ?? [])
    .filter((d: { date: string; available: boolean }) => d.available)
    .map((d: { date: string; available: boolean }) => d.date);

  const handleSubmit = async () => {
    if (!isAuthenticated && (!name.trim() || !phone.trim())) {
      setError('נא למלא שם ומספר טלפון');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await joinWaitlist({
        name: isAuthenticated ? prefillName : name.trim(),
        phone: isAuthenticated ? prefillPhone : phone.trim(),
        preferredDate: preferredDate || undefined,
        note: note.trim() || undefined,
      });
      setDone(true);
    } catch {
      setError('שגיאה, נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = 'https://www.gentlemen1996.co.il';
    if (navigator.share) {
      await navigator.share({ title: 'Gentlemen Barber Shop', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('הקישור הועתק!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + close button */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
          <div className="w-8" />
        </div>

        {done ? (
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">נרשמת בהצלחה!</h3>
            <p className="text-sm text-gray-500 mb-5">ניצור איתך קשר כשיתפנה תור</p>

            {/* Share section */}
            <div className="bg-[#1a1a2e] rounded-2xl p-4 mb-4 text-right">
              <p className="text-sm font-bold text-white mb-0.5">שתף עם חברים</p>
              <p className="text-xs text-white/60 mb-3">שלח את הקישור לקביעת תור</p>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-bold text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                שתף קישור לקביעת תור
              </button>
            </div>

            <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-white font-bold">
              סגור
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 text-right mb-1">רשימת המתנה</h3>
            <p className="text-sm text-gray-500 text-right mb-5">נתקשר אליך כשיתפנה תור</p>

            <div className="space-y-3">
              {/* Show name/phone only for non-authenticated users */}
              {!isAuthenticated && (
                <>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="שם מלא *"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary outline-none text-right bg-gray-50 transition-colors"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="מספר טלפון *"
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary outline-none text-left bg-gray-50 transition-colors"
                  />
                </>
              )}

              {/* Date chips — only open dates */}
              <div>
                <p className="text-xs text-gray-400 text-right mb-2">יום מועדף (אופציונלי)</p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {availableDates.map((d) => {
                    const [y, m, day] = d.split('-').map(Number);
                    const date = new Date(y, m - 1, day);
                    const isSelected = preferredDate === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setPreferredDate(isSelected ? '' : d)}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-100 bg-gray-50 text-gray-700'
                        }`}
                      >
                        <p className="text-[11px] font-medium leading-tight">{dayNames[date.getDay()]}</p>
                        <p className="text-sm font-bold">{day}</p>
                        <p className="text-[10px] text-gray-400">{monthNames[m - 1].slice(0, 3)}</p>
                      </button>
                    );
                  })}
                </div>
                {preferredDate && (
                  <p className="text-xs text-primary text-right mt-1 font-medium">{formatDateHebrew(preferredDate)}</p>
                )}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="הערה (אופציונלי) — למשל: רק בוקר, רק אחה״צ..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary outline-none text-right bg-gray-50 resize-none transition-colors text-sm"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-right mt-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-4 w-full py-3.5 rounded-xl bg-primary text-white font-bold text-base disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? 'שולח...' : 'הצטרף לרשימה'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
